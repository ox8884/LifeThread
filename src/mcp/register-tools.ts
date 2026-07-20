import type { ThreadRepository } from "@/application/threads/thread-repository";
import { getThread } from "@/application/threads/get-thread";
import { listThreads } from "@/application/threads/list-threads";
import { proposeCandidate } from "@/application/analysis/propose-candidate";
import { acceptProposal, rejectProposal } from "@/application/proposals/proposal-commands";
import { stableId } from "@/domain/identity";
import type { CandidateDelta } from "@/domain/candidate-delta";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { createTokenSupabaseClient } from "@/infrastructure/supabase/token-client";
import { SupabaseThreadRepository } from "@/infrastructure/supabase/supabase-thread-repository";
import { ownerIdFromAuthInfo } from "@/mcp/auth";
import { decisionInputSchema, getThreadInputSchema, listThreadsInputSchema, proposeInputSchema, toolAnnotations } from "@/mcp/tool-schemas";
import { widgetHtml } from "@/mcp/widget";

type ListInput = Readonly<{ ownerId: string }>;
type GetInput = Readonly<{ ownerId: string; threadId: string }>;
type ProposeInput = Readonly<{ ownerId: string; candidate: CandidateDelta }>;
type DecisionInput = Readonly<{ ownerId: string; threadId: string; proposalId: string; expectedVersion: number }>;

function inputValue<T>(canonical: T | undefined, legacy: T | undefined): T | undefined {
  return canonical ?? legacy;
}

function compactThread(aggregate: NonNullable<Awaited<ReturnType<typeof getThread>>>) {
  return {
    id: aggregate.thread.id,
    title: aggregate.thread.title,
    goal_text: aggregate.thread.goal_text,
    version: aggregate.thread.version,
    current_revision: aggregate.revisions.at(-1) ?? null,
    tasks: aggregate.tasks.filter((task) => !task.deleted_at && ["proposed", "pending", "in_progress", "waiting", "blocked"].includes(task.status)),
    facts: aggregate.facts.filter((fact) => fact.user_confirmed),
    open_loops: aggregate.open_loops,
    conflicts: aggregate.conflicts.filter((conflict) => conflict.status === "unresolved"),
    source_references: aggregate.source_references,
  };
}

export function createMcpToolHandlers(repository: ThreadRepository) {
  return {
    async list_lifethreads(input: ListInput) {
      return { threads: await listThreads(repository, input.ownerId) };
    },
    async get_lifethread(input: GetInput) {
      const aggregate = await getThread(repository, input.ownerId, input.threadId);
      if (!aggregate) return { outcome: "missing_thread" as const };
      return { thread: compactThread(aggregate) };
    },
    async propose_lifethread_update(input: ProposeInput) {
      const result = await proposeCandidate(repository, input.ownerId, input.candidate, new Date().toISOString());
      if (result.kind === "missing_thread") return { outcome: "missing_thread" as const, proposals: [], resulting_version: null };
      if (result.kind === "rejected") return { outcome: result.reason as string, proposals: [], resulting_version: null, thread_id: input.candidate.thread_id };
      const proposals = result.aggregate.tasks.filter((task) => task.analysis_run_id === input.candidate.analysis_run_id && task.status === "proposed").map((task) => ({ id: task.id, kind: "task" as const, content: task.content }));
      return { outcome: result.kind, proposals, resulting_version: result.aggregate.thread.version, thread_id: result.aggregate.thread.id, web_url: `/en/threads/${result.aggregate.thread.id}` };
    },
    async accept_lifethread_proposal(input: DecisionInput) {
      const result = await acceptProposal(repository, { ...input, now: new Date().toISOString() });
      return { outcome: result.kind === "applied" ? "accepted" : result.kind, resulting_version: result.kind === "applied" ? result.aggregate.thread.version : null };
    },
    async reject_lifethread_proposal(input: DecisionInput) {
      const result = await rejectProposal(repository, { ...input, now: new Date().toISOString() });
      return { outcome: result.kind === "applied" ? "rejected" : result.kind, resulting_version: result.kind === "applied" ? result.aggregate.thread.version : null };
    },
  };
}

export function proposalOperationId(threadId: string, version: number): string {
  return stableId("proposal", `${threadId}:${version}`);
}

function response<T extends Record<string, unknown>>(value: T) {
  return { structuredContent: value, content: [{ type: "text" as const, text: JSON.stringify(value) }] };
}

function authorizedHandlers(authInfo: AuthInfo | undefined) {
  const ownerId = ownerIdFromAuthInfo(authInfo);
  const token = authInfo?.token;
  if (!ownerId || !token) return null;
  return { ownerId, handlers: createMcpToolHandlers(new SupabaseThreadRepository(createTokenSupabaseClient(token))) };
}

export function registerLifeThreadTools(server: McpServer): void {
  registerAppResource(
    server,
    "lifethread-proposals",
    "ui://lifethread/proposals-v2.html",
    { title: "LifeThread proposal review", description: "Compact proposal review controls", _meta: { ui: { csp: { connectDomains: [] } } } },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: RESOURCE_MIME_TYPE, text: widgetHtml }] }),
  );
  registerAppResource(
    server,
    "lifethread-proposals-legacy",
    "ui://lifethread/proposals-v1.html",
    { title: "LifeThread proposal review", description: "Compact proposal review controls", _meta: { ui: { csp: { connectDomains: [] } } } },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: RESOURCE_MIME_TYPE, text: widgetHtml }] }),
  );

  server.registerTool("list_lifethreads", { title: "List LifeThreads", description: "List the authenticated user's LifeThreads.", inputSchema: listThreadsInputSchema, annotations: toolAnnotations.readOnly }, async (_input, extra) => {
    const authorized = authorizedHandlers(extra.authInfo);
    if (!authorized) return response({ outcome: "unauthorized" });
    return response(await authorized.handlers.list_lifethreads({ ownerId: authorized.ownerId }));
  });
  server.registerTool("get_lifethread", { title: "Get a LifeThread", description: "Read the authenticated user's minimal current LifeThread state.", inputSchema: getThreadInputSchema, annotations: toolAnnotations.readOnly }, async (input, extra) => {
    const authorized = authorizedHandlers(extra.authInfo);
    if (!authorized) return response({ outcome: "unauthorized" });
    const threadId = inputValue(input.thread_id, input.threadId);
    if (!threadId) return response({ outcome: "invalid_input", message: "thread_id is required" });
    return response(await authorized.handlers.get_lifethread({ ownerId: authorized.ownerId, threadId }));
  });
  registerAppTool(server, "propose_lifethread_update", { title: "Propose a LifeThread update", description: "Submit a cited, reviewable CandidateDelta. It cannot complete or confirm anything.", inputSchema: proposeInputSchema, annotations: toolAnnotations.write, _meta: { ui: { resourceUri: "ui://lifethread/proposals-v2.html" }, "openai/widgetAccessible": true } }, async (input, extra) => {
    const authorized = authorizedHandlers(extra.authInfo);
    if (!authorized) return response({ outcome: "unauthorized" });
    return response(await authorized.handlers.propose_lifethread_update({ ownerId: authorized.ownerId, candidate: input.candidate }));
  });
  server.registerTool("accept_lifethread_proposal", { title: "Accept a LifeThread proposal", description: "Explicitly accept one current proposal at the supplied version.", inputSchema: decisionInputSchema, annotations: toolAnnotations.write }, async (input, extra) => {
    const authorized = authorizedHandlers(extra.authInfo);
    if (!authorized) return response({ outcome: "unauthorized" });
    const threadId = inputValue(input.thread_id, input.threadId);
    const proposalId = inputValue(input.proposal_id, input.proposalId);
    const expectedVersion = inputValue(input.expected_version, input.expectedVersion);
    if (!threadId || !proposalId || expectedVersion === undefined) {
      return response({ outcome: "invalid_input", message: "thread_id, proposal_id, and expected_version are required" });
    }
    return response(await authorized.handlers.accept_lifethread_proposal({
      ownerId: authorized.ownerId,
      threadId,
      proposalId,
      expectedVersion,
    }));
  });
  server.registerTool("reject_lifethread_proposal", { title: "Reject a LifeThread proposal", description: "Reversibly reject one current proposal at the supplied version.", inputSchema: decisionInputSchema, annotations: toolAnnotations.reject }, async (input, extra) => {
    const authorized = authorizedHandlers(extra.authInfo);
    if (!authorized) return response({ outcome: "unauthorized" });
    const threadId = inputValue(input.thread_id, input.threadId);
    const proposalId = inputValue(input.proposal_id, input.proposalId);
    const expectedVersion = inputValue(input.expected_version, input.expectedVersion);
    if (!threadId || !proposalId || expectedVersion === undefined) {
      return response({ outcome: "invalid_input", message: "thread_id, proposal_id, and expected_version are required" });
    }
    return response(await authorized.handlers.reject_lifethread_proposal({
      ownerId: authorized.ownerId,
      threadId,
      proposalId,
      expectedVersion,
    }));
  });
}
