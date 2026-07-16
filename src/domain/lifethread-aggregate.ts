import { createHash } from "node:crypto";
import { ownsThread, type RevisionActor } from "@/domain/actors";
import type { LifeThreadAggregate, Task, ThreadRevision } from "@/domain/entities";
import type { CanonicalStatus } from "@/domain/status";
import { transitionTask } from "@/domain/transitions";

type TaskMutationBase = Readonly<{
  actor: RevisionActor;
  expected_version: number;
  occurred_at: string;
}>;

export type TaskMutation =
  | (TaskMutationBase & Readonly<{ kind: "add"; content: string }>)
  | (TaskMutationBase & Readonly<{ kind: "edit"; task_id: string; content: string }>)
  | (TaskMutationBase &
      Readonly<{ kind: "transition"; task_id: string; status: CanonicalStatus }>)
  | (TaskMutationBase & Readonly<{ kind: "tombstone"; task_id: string }>)
  | (TaskMutationBase & Readonly<{ kind: "restore"; task_id: string }>)
  | (TaskMutationBase & Readonly<{ kind: "reorder"; task_id: string; position: number }>);

export type AggregateMutationResult =
  | Readonly<{ kind: "applied"; aggregate: LifeThreadAggregate }>
  | Readonly<{
      kind: "rejected";
      reason: "stale_version" | "task_not_found" | "invalid_transition" | "invalid_input" | "unauthorized_actor";
    }>;

function revisionId(threadId: string, version: number): string {
  return `revision_${createHash("sha256")
    .update(`${threadId}:${version}`)
    .digest("hex")
    .slice(0, 16)}`;
}

function appendRevision(
  aggregate: LifeThreadAggregate,
  tasks: Task[],
  mutation: TaskMutation,
  summary: string,
): LifeThreadAggregate {
  const version = aggregate.thread.version + 1;
  const revision: ThreadRevision = {
    id: revisionId(aggregate.thread.id, version),
    thread_id: aggregate.thread.id,
    version,
    ...mutation.actor,
    command: `task:${mutation.kind}`,
    change_summary: summary,
    previous_version: aggregate.thread.version,
    created_at: mutation.occurred_at,
  };
  return {
    ...aggregate,
    thread: { ...aggregate.thread, version, updated_at: mutation.occurred_at },
    tasks,
    revisions: [...aggregate.revisions, revision],
  };
}

export function applyTaskMutation(
  aggregate: LifeThreadAggregate,
  mutation: TaskMutation,
): AggregateMutationResult {
  if (mutation.expected_version !== aggregate.thread.version) {
    return { kind: "rejected", reason: "stale_version" };
  }
  if (mutation.actor.actor_type !== "user") {
    return { kind: "rejected", reason: "unauthorized_actor" };
  }
  if (!ownsThread(mutation.actor, aggregate.thread.owner_id)) {
    return { kind: "rejected", reason: "unauthorized_actor" };
  }
  if (mutation.kind === "add") {
    const content = mutation.content.normalize("NFC").trim();
    if (!content) return { kind: "rejected", reason: "invalid_input" };
    const task: Task = {
      id: `task_${createHash("sha256")
        .update(`${aggregate.thread.id}:${content}:${aggregate.thread.version}`)
        .digest("hex")
        .slice(0, 16)}`,
      thread_id: aggregate.thread.id,
      milestone_id: null,
      content,
      status: "pending",
      priority: "normal",
      position: aggregate.tasks.length,
      source_type: "user_created",
      derivation: "direct",
      source_reference_ids: [],
      confidence: null,
      analysis_run_id: null,
      user_confirmed: true,
      confirmed_by: mutation.actor.actor_user_id,
      confirmed_at: mutation.occurred_at,
      deleted_at: null,
      deleted_by: null,
      created_at: mutation.occurred_at,
      updated_at: mutation.occurred_at,
    };
    return {
      kind: "applied",
      aggregate: appendRevision(aggregate, [...aggregate.tasks, task], mutation, "Added a manual task."),
    };
  }

  const task = aggregate.tasks.find((candidate) => candidate.id === mutation.task_id);
  if (!task) return { kind: "rejected", reason: "task_not_found" };
  let updated: Task;
  switch (mutation.kind) {
    case "edit": {
      const content = mutation.content.normalize("NFC").trim();
      if (!content) return { kind: "rejected", reason: "invalid_input" };
      updated = {
        ...task,
        content,
        analysis_run_id: null,
        user_confirmed: true,
        confirmed_by: mutation.actor.actor_user_id,
        confirmed_at: mutation.occurred_at,
        updated_at: mutation.occurred_at,
      };
      break;
    }
    case "transition": {
      const result = transitionTask(task, {
        kind: "set_status",
        actor: mutation.actor,
        status: mutation.status,
        occurred_at: mutation.occurred_at,
      });
      if (result.kind === "rejected") {
        return { kind: "rejected", reason: "invalid_transition" };
      }
      updated = result.task;
      break;
    }
    case "tombstone": {
      const result = transitionTask(task, {
        kind: "tombstone",
        actor: mutation.actor,
        occurred_at: mutation.occurred_at,
      });
      if (result.kind === "rejected") {
        return { kind: "rejected", reason: "invalid_transition" };
      }
      updated = result.task;
      break;
    }
    case "restore": {
      const result = transitionTask(task, {
        kind: "restore",
        actor: mutation.actor,
        occurred_at: mutation.occurred_at,
      });
      if (result.kind === "rejected") {
        return { kind: "rejected", reason: "invalid_transition" };
      }
      updated = result.task;
      break;
    }
    case "reorder":
      if (!Number.isInteger(mutation.position) || mutation.position < 0) {
        return { kind: "rejected", reason: "invalid_input" };
      }
      updated = { ...task, position: mutation.position, updated_at: mutation.occurred_at };
      break;
  }
  const tasks = aggregate.tasks.map((candidate) =>
    candidate.id === updated.id ? updated : candidate,
  );
  return {
    kind: "applied",
    aggregate: appendRevision(aggregate, tasks, mutation, `Applied task ${mutation.kind}.`),
  };
}
