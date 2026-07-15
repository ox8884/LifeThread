import type { LifeThreadAggregate } from "@/domain/entities";
import type { CanonicalStatus } from "@/domain/status";

export type LivingStateProjection = Readonly<{
  counts: Readonly<Record<CanonicalStatus, number>>;
  next_action: Readonly<{
    content: string;
    source_reference_ids: string[];
    confidence: number;
  }> | null;
  open_loop_count: number;
  conflict_count: number;
}>;

export function projectLivingState(aggregate: LifeThreadAggregate): LivingStateProjection {
  const counts: Record<CanonicalStatus, number> = {
    proposed: 0,
    pending: 0,
    in_progress: 0,
    waiting: 0,
    blocked: 0,
    completed: 0,
    rejected: 0,
    uncertain: 0,
    overdue: 0,
    cancelled: 0,
  };
  for (const task of aggregate.tasks) {
    if (!task.deleted_at) counts[task.status] += 1;
  }
  const recommendation = aggregate.recommendations
    .filter((item) => item.status === "proposed")
    .sort((left, right) => right.confidence - left.confidence)[0];
  return {
    counts,
    next_action: recommendation ? {
      content: recommendation.content,
      source_reference_ids: recommendation.source_reference_ids,
      confidence: recommendation.confidence,
    } : null,
    open_loop_count: aggregate.open_loops.filter((item) => item.status !== "completed").length,
    conflict_count: aggregate.conflicts.filter((item) => item.status === "unresolved").length,
  };
}
