import { z } from "zod";
import type { AnalysisGateway } from "@/application/analysis/analysis-gateway";
import { reconcileCandidate } from "@/application/analysis/reconcile-candidate";
import type { ThreadRepository } from "@/application/threads/thread-repository";
import { candidateDeltaSchema } from "@/domain/candidate-delta";
import { recordedFixtureOwnerId, type RevisionActor } from "@/domain/actors";
import type { LifeThreadAggregate } from "@/domain/entities";
import { detectSourceLanguage, sha256, stableId } from "@/domain/identity";
import type { Locale } from "@/i18n/locales";

const goalSchema = z.string().transform((value) => value.normalize("NFC").trim()).pipe(z.string().min(1).max(2_000));

type CreateThreadInput = Readonly<{ goal: string; locale: Locale; now: string; owner_id?: string }>;
type CreateThreadDependencies = Readonly<{
  repository: ThreadRepository;
  gateway: AnalysisGateway;
}>;

export type CreateThreadResult =
  | Readonly<{ kind: "created"; aggregate: LifeThreadAggregate }>
  | Readonly<{ kind: "invalid_goal" }>
  | Readonly<{ kind: "already_exists" }>
  | Readonly<{ kind: "analysis_rejected" }>;

function initialAggregate(
  goal: string,
  now: string,
  ownerId: string,
  actor: RevisionActor,
): LifeThreadAggregate {
  const threadId = stableId("thread", `${ownerId}:${goal}`);
  const evidenceId = stableId("evidence", `${threadId}:goal`);
  const sourceId = "source_goal";
  const digest = sha256(goal);
  return {
    thread: {
      id: threadId,
      owner_id: ownerId,
      title: goal.length > 72 ? `${goal.slice(0, 69)}...` : goal,
      goal_text: goal,
      goal_confirmed: false,
      version: 1,
      created_at: now,
      updated_at: now,
    },
    milestones: [],
    tasks: [],
    evidence: [{
      id: evidenceId,
      thread_id: threadId,
      kind: "goal_input",
      note: goal,
      private_object_key: null,
      checksum: digest,
      media_type: "text/plain",
      size_bytes: Buffer.byteLength(goal, "utf8"),
      original_filename: null,
      source_language: detectSourceLanguage(goal),
      capture_date: null,
      ingestion_state: "final",
      created_at: now,
      deleted_at: null,
    }],
    source_references: [{
      id: sourceId,
      thread_id: threadId,
      evidence_id: evidenceId,
      locator_kind: "text_span",
      locator: `chars:0-${goal.length}`,
      quoted_hash: digest,
      created_at: now,
    }],
    facts: [],
    timeline_events: [],
    open_loops: [],
    waiting_states: [],
    deadlines: [],
    risks: [],
    conflicts: [],
    recommendations: [],
    communications: [],
    localized_content: [],
    analysis_runs: [],
    corrections: [],
    revisions: [{
      id: "revision_1",
      thread_id: threadId,
      version: 1,
      ...actor,
      command: "create_thread",
      change_summary: "Created the thread and preserved the original goal.",
      previous_version: 0,
      created_at: now,
    }],
    applied_analysis_run_ids: [],
    applied_operation_ids: [],
    living_state: { summary: "Goal captured; analysis is pending.", occurred_at: null, date_precision: "unknown" },
  };
}

export async function createThread(
  input: CreateThreadInput,
  dependencies: CreateThreadDependencies,
): Promise<CreateThreadResult> {
  const parsedGoal = goalSchema.safeParse(input.goal);
  if (!parsedGoal.success) return { kind: "invalid_goal" };
  if (await dependencies.repository.load()) return { kind: "already_exists" };
  const ownerId = input.owner_id ?? recordedFixtureOwnerId;
  const initial = initialAggregate(parsedGoal.data, input.now, ownerId, dependencies.gateway.actor);
  const rawCandidate = await dependencies.gateway.analyze({
    aggregate: initial,
    locale: input.locale,
    reason: "initial_goal",
    source_reference_id: "source_goal",
  });
  const candidate = candidateDeltaSchema.safeParse(rawCandidate);
  if (!candidate.success) return { kind: "analysis_rejected" };
  const reconciliation = reconcileCandidate(initial, candidate.data, input.now, dependencies.gateway.actor);
  if (reconciliation.kind !== "applied") return { kind: "analysis_rejected" };
  const saved = await dependencies.repository.save(reconciliation.aggregate, null);
  if (saved.kind === "stale_version") return { kind: "already_exists" };
  return { kind: "created", aggregate: reconciliation.aggregate };
}
