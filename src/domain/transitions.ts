import type { TaskCommand } from "@/domain/commands";
import type { Task } from "@/domain/entities";
import type { CanonicalStatus } from "@/domain/status";

const allowedTransitions: Readonly<Record<CanonicalStatus, readonly CanonicalStatus[]>> = {
  proposed: ["pending", "completed", "rejected"],
  pending: ["in_progress", "waiting", "blocked", "completed", "cancelled"],
  in_progress: ["waiting", "blocked", "completed", "cancelled"],
  waiting: ["in_progress", "blocked", "completed", "overdue", "cancelled"],
  blocked: ["in_progress", "waiting", "completed", "cancelled"],
  completed: ["in_progress"],
  rejected: [],
  uncertain: [],
  overdue: ["in_progress", "waiting", "blocked", "completed", "cancelled"],
  cancelled: [],
};

export type TaskTransitionResult =
  | Readonly<{ kind: "applied"; task: Task }>
  | Readonly<{
      kind: "rejected";
      reason: "unauthorized_actor" | "invalid_transition" | "invalid_tombstone";
    }>;

export function transitionTask(
  task: Task,
  command: TaskCommand,
): TaskTransitionResult {
  if (command.actor.actor_type === "recorded_fixture") {
    return { kind: "rejected", reason: "unauthorized_actor" };
  }

  switch (command.kind) {
    case "set_status": {
      if (!allowedTransitions[task.status].includes(command.status)) {
        return { kind: "rejected", reason: "invalid_transition" };
      }
      const confirmingProposal = task.status === "proposed"
        && (command.status === "pending" || command.status === "completed");
      return {
        kind: "applied",
        task: {
          ...task,
          status: command.status,
          user_confirmed: task.user_confirmed || confirmingProposal,
          confirmed_by: confirmingProposal ? command.actor.actor_user_id : task.confirmed_by,
          confirmed_at: confirmingProposal ? command.occurred_at : task.confirmed_at,
          updated_at: command.occurred_at,
        },
      };
    }
    case "tombstone":
      if (task.deleted_at) return { kind: "rejected", reason: "invalid_tombstone" };
      return {
        kind: "applied",
        task: {
          ...task,
          deleted_at: command.occurred_at,
          deleted_by: command.actor.actor_user_id,
          updated_at: command.occurred_at,
        },
      };
    case "restore":
      if (!task.deleted_at) return { kind: "rejected", reason: "invalid_tombstone" };
      return {
        kind: "applied",
        task: {
          ...task,
          deleted_at: null,
          deleted_by: null,
          updated_at: command.occurred_at,
        },
      };
  }
}
