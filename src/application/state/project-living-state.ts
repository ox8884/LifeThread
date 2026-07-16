import type { LifeThreadAggregate, Task } from "@/domain/entities";
import type { CanonicalStatus } from "@/domain/status";

const activeStatusRank: Readonly<Partial<Record<CanonicalStatus, number>>> = {
  in_progress: 0,
  pending: 1,
  waiting: 2,
  blocked: 3,
  overdue: 4,
  proposed: 5,
};

export type LivingStateProjection = Readonly<{
  counts: Readonly<Record<CanonicalStatus, number>>;
  next_action: Readonly<{
    task_id: string;
    status: Task["status"];
    content: string;
    source_type: Task["source_type"];
    source_reference_ids: string[];
    confidence: Task["confidence"];
  }> | null;
  progress: Readonly<{ completed: number; total: number; percent: number }>;
  review_count: number;
  open_loop_count: number;
  conflict_count: number;
}>;

function actionableTasks(aggregate: LifeThreadAggregate): Task[] {
  return aggregate.tasks
    .filter((task) => !task.deleted_at && activeStatusRank[task.status] !== undefined)
    .sort((left, right) => {
      const leftRank = activeStatusRank[left.status] ?? Number.MAX_SAFE_INTEGER;
      const rightRank = activeStatusRank[right.status] ?? Number.MAX_SAFE_INTEGER;
      const rankDelta = leftRank - rightRank;
      return rankDelta !== 0 ? rankDelta : left.position - right.position;
    });
}

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
  const visibleTasks = aggregate.tasks.filter((task) => !task.deleted_at);
  for (const task of visibleTasks) counts[task.status] += 1;

  const nextTask = actionableTasks(aggregate)[0];
  const completed = counts.completed;
  const total = visibleTasks.filter(
    (task) => task.status !== "rejected" && task.status !== "cancelled",
  ).length;
  const unresolvedConflictCount = aggregate.conflicts.filter(
    (conflict) => conflict.status === "unresolved",
  ).length;
  const reviewCount = counts.proposed
    - (nextTask?.status === "proposed" ? 1 : 0)
    + aggregate.facts.filter((fact) => !fact.user_confirmed).length
    + unresolvedConflictCount;

  return {
    counts,
    next_action: nextTask ? {
      task_id: nextTask.id,
      status: nextTask.status,
      content: nextTask.content,
      source_type: nextTask.source_type,
      source_reference_ids: nextTask.source_reference_ids,
      confidence: nextTask.confidence,
    } : null,
    progress: {
      completed,
      total,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    },
    review_count: reviewCount,
    open_loop_count: aggregate.open_loops.filter((item) => item.status !== "completed").length,
    conflict_count: unresolvedConflictCount,
  };
}
