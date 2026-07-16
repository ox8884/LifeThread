import type { ThreadRepository } from "@/application/threads/thread-repository";
import {
  applyTaskMutation,
  type AggregateMutationResult,
  type TaskMutation,
} from "@/domain/lifethread-aggregate";
import { userActorForOwner, type RevisionActor } from "@/domain/actors";
import type { CanonicalStatus } from "@/domain/status";

type TaskCommandInput =
  | Readonly<{ kind: "add"; content: string; expected_version: number; now: string }>
  | Readonly<{ kind: "edit"; task_id: string; content: string; expected_version: number; now: string }>
  | Readonly<{ kind: "transition"; task_id: string; status: CanonicalStatus; expected_version: number; now: string }>
  | Readonly<{ kind: "tombstone" | "restore"; task_id: string; expected_version: number; now: string }>
  | Readonly<{ kind: "reorder"; task_id: string; position: number; expected_version: number; now: string }>;

function toMutation(input: TaskCommandInput, actor: RevisionActor): TaskMutation {
  const base = { actor, expected_version: input.expected_version, occurred_at: input.now };
  switch (input.kind) {
    case "add": return { ...base, kind: "add", content: input.content };
    case "edit": return { ...base, kind: "edit", task_id: input.task_id, content: input.content };
    case "transition": return { ...base, kind: "transition", task_id: input.task_id, status: input.status };
    case "tombstone": return { ...base, kind: "tombstone", task_id: input.task_id };
    case "restore": return { ...base, kind: "restore", task_id: input.task_id };
    case "reorder": return { ...base, kind: "reorder", task_id: input.task_id, position: input.position };
  }
}

export async function runTaskCommand(
  repository: ThreadRepository,
  input: TaskCommandInput,
): Promise<AggregateMutationResult | Readonly<{ kind: "missing_thread" }>> {
  const aggregate = await repository.load();
  if (!aggregate) return { kind: "missing_thread" };
  const result = applyTaskMutation(aggregate, toMutation(input, userActorForOwner(aggregate.thread.owner_id)));
  if (result.kind === "rejected") return result;
  const saved = await repository.save(result.aggregate, input.expected_version);
  if (saved.kind === "stale_version") return { kind: "rejected", reason: "stale_version" };
  return result;
}
