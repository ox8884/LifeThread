import { stableId } from "@/domain/identity";
import type { LifeThreadAggregate } from "@/domain/entities";
import type { ThreadRepository } from "@/application/threads/thread-repository";
import { runTaskCommand } from "@/application/tasks/task-commands";

export type ProposalDecisionResult =
  | Readonly<{ kind: "applied"; aggregate: LifeThreadAggregate }>
  | Readonly<{ kind: "missing_thread" | "missing_proposal" }>
  | Readonly<{ kind: "stale_version" | "already_decided" | "invalid_proposal" }>;

function proposalExists(aggregate: LifeThreadAggregate, proposalId: string): boolean {
  return aggregate.tasks.some((task) => task.id === proposalId && task.status === "proposed" && !task.deleted_at)
    || aggregate.facts.some((fact) => fact.id === proposalId && fact.status === "proposed")
    || aggregate.milestones.some((milestone) => milestone.id === proposalId && milestone.status === "proposed" && !milestone.deleted_at);
}

export async function acceptProposal(
  repository: ThreadRepository,
  input: Readonly<{ ownerId: string; threadId: string; proposalId: string; expectedVersion: number; now: string }>,
): Promise<ProposalDecisionResult> {
  const aggregate = await repository.load(input.ownerId, input.threadId);
  if (!aggregate) return { kind: "missing_thread" };
  if (aggregate.thread.version !== input.expectedVersion) return { kind: "stale_version" };
  const task = aggregate.tasks.find((candidate) => candidate.id === input.proposalId);
  if (!task) return proposalExists(aggregate, input.proposalId) ? { kind: "invalid_proposal" } : { kind: "missing_proposal" };
  if (task.status !== "proposed" || task.deleted_at) return { kind: "already_decided" };
  const result = await runTaskCommand(repository, {
    owner_id: input.ownerId,
    thread_id: input.threadId,
    expected_version: input.expectedVersion,
    now: input.now,
    actor: { actor_type: "user", actor_user_id: input.ownerId },
    kind: "transition",
    task_id: input.proposalId,
    status: "pending",
  });
  return result.kind === "applied" ? result : { kind: "stale_version" };
}

export async function rejectProposal(
  repository: ThreadRepository,
  input: Readonly<{ ownerId: string; threadId: string; proposalId: string; expectedVersion: number; now: string }>,
): Promise<ProposalDecisionResult> {
  const aggregate = await repository.load(input.ownerId, input.threadId);
  if (!aggregate) return { kind: "missing_thread" };
  if (aggregate.thread.version !== input.expectedVersion) return { kind: "stale_version" };
  const task = aggregate.tasks.find((candidate) => candidate.id === input.proposalId);
  if (!task) return { kind: "missing_proposal" };
  if (task.status !== "proposed" || task.deleted_at) return { kind: "already_decided" };
  const result = await runTaskCommand(repository, {
    owner_id: input.ownerId,
    thread_id: input.threadId,
    expected_version: input.expectedVersion,
    now: input.now,
    actor: { actor_type: "user", actor_user_id: input.ownerId },
    kind: "transition",
    task_id: input.proposalId,
    status: "rejected",
  });
  return result.kind === "applied" ? result : { kind: "stale_version" };
}

export function proposalIdForTask(threadId: string, semanticKey: string): string {
  return stableId("task", semanticKey).replace(`${threadId}:`, "");
}
