import { candidateDeltaSchema, type CandidateDelta } from "@/domain/candidate-delta";
import { reconcileCandidate } from "@/application/analysis/reconcile-candidate";
import type { LifeThreadAggregate } from "@/domain/entities";
import type { ThreadRepository } from "@/application/threads/thread-repository";

export type CandidateProposalResult =
  | Readonly<{ kind: "applied"; aggregate: LifeThreadAggregate }>
  | Readonly<{ kind: "duplicate"; aggregate: LifeThreadAggregate }>
  | Readonly<{ kind: "missing_thread" }>
  | Readonly<{ kind: "rejected"; reason: "invalid_candidate" | "stale_version" | "unauthorized_actor" | "missing_source" | "cross_thread" | "unauthorized_operation" }>;

export async function proposeCandidate(
  repository: ThreadRepository,
  ownerId: string,
  rawCandidate: unknown,
  now: string,
): Promise<CandidateProposalResult> {
  const parsed = candidateDeltaSchema.safeParse(rawCandidate);
  if (!parsed.success) return { kind: "rejected", reason: "invalid_candidate" };
  return proposeParsedCandidate(repository, ownerId, parsed.data, now);
}

export async function proposeParsedCandidate(
  repository: ThreadRepository,
  ownerId: string,
  candidate: CandidateDelta,
  now: string,
): Promise<CandidateProposalResult> {
  const aggregate = await repository.load(ownerId, candidate.thread_id);
  if (!aggregate) return { kind: "missing_thread" };
  const actor = { actor_type: "chatgpt_app", actor_user_id: ownerId } as const;
  const result = reconcileCandidate(aggregate, candidate, now, actor);
  if (result.kind === "duplicate") return result;
  if (result.kind === "rejected") return result;
  const saved = await repository.save(ownerId, result.aggregate, aggregate.thread.version);
  if (saved.kind === "stale_version") return { kind: "rejected", reason: "stale_version" };
  return result;
}
