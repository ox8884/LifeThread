import { createHash } from "node:crypto";
import type { CandidateDelta } from "@/domain/candidate-delta";
import type { LifeThreadAggregate } from "@/domain/entities";
import type { SourceType } from "@/domain/status";

export type ReconciliationResult =
  | Readonly<{ kind: "applied"; aggregate: LifeThreadAggregate }>
  | Readonly<{ kind: "duplicate"; aggregate: LifeThreadAggregate }>
  | Readonly<{
      kind: "rejected";
      reason:
        | "cross_thread"
        | "missing_source"
        | "stale_version"
        | "unauthorized_operation";
    }>;

export function stableId(prefix: string, value: string): string {
  return `${prefix}_${createHash("sha256").update(value).digest("hex").slice(0, 16)}`;
}

export function proposalSource(
  candidate: CandidateDelta,
  operation: Readonly<{ derivation?: "direct" | "inferred" | undefined }>,
): SourceType {
  if (candidate.analysis_reason === "initial_goal") return "ai_suggested";
  if ("derivation" in operation && operation.derivation === "direct") {
    return "evidence_extracted";
  }
  return "context_inferred";
}

export function sourcesResolve(
  aggregate: LifeThreadAggregate,
  candidate: CandidateDelta,
): boolean {
  const validIds = new Set(
    aggregate.source_references
      .filter((reference) => reference.thread_id === aggregate.thread.id)
      .map((reference) => reference.id),
  );
  return candidate.operations.every((operation) =>
    operation.source_reference_ids.every((id) => validIds.has(id)),
  ) && candidate.next_best_action.source_reference_ids.every((id) => validIds.has(id));
}

type DerivedCandidateOperation = Readonly<{
  operation_id: string;
  kind:
    | "propose_timeline_event"
    | "propose_open_loop"
    | "propose_waiting_state"
    | "propose_deadline"
    | "propose_risk"
    | "propose_recommendation";
  semantic_key: string;
  content: string;
  priority?: "low" | "normal" | "high" | "urgent" | undefined;
  severity?: "low" | "medium" | "high" | undefined;
  derivation: "direct" | "inferred";
  source_reference_ids: string[];
  confidence: number;
}>;

export function createDerivedItem(
  operation: DerivedCandidateOperation,
  candidate: CandidateDelta,
  now: string,
) {
  return {
    id: stableId(operation.kind, operation.semantic_key),
    semantic_key: operation.semantic_key,
    thread_id: candidate.thread_id,
    content: operation.content,
    status: "proposed" as const,
    ...(operation.priority ? { priority: operation.priority } : {}),
    ...(operation.severity ? { severity: operation.severity } : {}),
    source_type: proposalSource(candidate, operation),
    source_reference_ids: operation.source_reference_ids,
    confidence: operation.confidence,
    created_at: now,
    updated_at: now,
  };
}
