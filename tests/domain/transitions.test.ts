import { describe, expect, it } from "vitest";
import type { Task } from "@/domain/entities";
import { canonicalSerialize } from "@/domain/serialization";
import { transitionTask } from "@/domain/transitions";

const proposedTask: Task = {
  id: "task_transition",
  thread_id: "thread_contract",
  milestone_id: null,
  content: "Review the first proposal",
  status: "proposed",
  priority: "normal",
  position: 0,
  source_type: "ai_suggested",
  derivation: "direct",
  source_reference_ids: ["source_goal"],
  confidence: 0.9,
  user_confirmed: false,
  confirmed_by: null,
  confirmed_at: null,
  deleted_at: null,
  deleted_by: null,
  created_at: "2026-07-15T12:00:00.000Z",
  updated_at: "2026-07-15T12:00:00.000Z",
};

describe("task transition policy", () => {
  it("accepts a proposal through demo_user without changing its origin", () => {
    // Given an AI-suggested proposed task
    // When demo_user accepts it
    const result = transitionTask(proposedTask, {
      kind: "set_status",
      actor_id: "demo_user",
      status: "pending",
      occurred_at: "2026-07-15T12:05:00.000Z",
    });

    // Then confirmation is human-attributed and provenance is immutable
    expect(result.kind).toBe("applied");
    if (result.kind === "applied") {
      expect(result.task.source_type).toBe("ai_suggested");
      expect(result.task.user_confirmed).toBe(true);
      expect(result.task.confirmed_by).toBe("demo_user");
      expect(result.task.status).toBe("pending");
    }
  });

  it("treats user completion of a proposal as explicit confirmation", () => {
    // Given an AI-suggested proposed task
    // When demo_user completes it from the primary next-action control
    const result = transitionTask(proposedTask, {
      kind: "set_status",
      actor_id: "demo_user",
      status: "completed",
      occurred_at: "2026-07-15T12:05:00.000Z",
    });

    // Then completion also records explicit human confirmation without changing origin
    expect(result.kind).toBe("applied");
    if (result.kind === "applied") {
      expect(result.task.status).toBe("completed");
      expect(result.task.source_type).toBe("ai_suggested");
      expect(result.task.user_confirmed).toBe(true);
      expect(result.task.confirmed_by).toBe("demo_user");
      expect(result.task.confirmed_at).toBe("2026-07-15T12:05:00.000Z");
    }
  });

  it("reopens a completed task and preserves its identity", () => {
    // Given a completed task
    const completed = { ...proposedTask, status: "completed" as const };
    // When demo_user reopens it
    const result = transitionTask(completed, {
      kind: "set_status",
      actor_id: "demo_user",
      status: "in_progress",
      occurred_at: "2026-07-15T12:06:00.000Z",
    });
    // Then the same task becomes active again
    expect(result.kind).toBe("applied");
    if (result.kind === "applied") expect(result.task.id).toBe(completed.id);
  });

  it("tombstones and restores without erasing provenance", () => {
    // Given a proposed task with citations
    const removed = transitionTask(proposedTask, {
      kind: "tombstone",
      actor_id: "demo_user",
      occurred_at: "2026-07-15T12:07:00.000Z",
    });
    expect(removed.kind).toBe("applied");
    if (removed.kind !== "applied") return;

    // When demo_user restores the same task
    const restored = transitionTask(removed.task, {
      kind: "restore",
      actor_id: "demo_user",
      occurred_at: "2026-07-15T12:08:00.000Z",
    });

    // Then origin and citations survive both revisions
    expect(restored.kind).toBe("applied");
    if (restored.kind === "applied") {
      expect(restored.task.deleted_at).toBeNull();
      expect(restored.task.source_type).toBe("ai_suggested");
      expect(restored.task.source_reference_ids).toEqual(["source_goal"]);
    }
  });

  it("rejects invalid and model-confirmed transitions without mutation", () => {
    // Given canonical state before forbidden commands
    const before = canonicalSerialize(proposedTask);

    // When an invalid waiting state or model-authored acceptance is attempted
    const invalid = transitionTask(proposedTask, {
      kind: "set_status",
      actor_id: "demo_user",
      status: "waiting",
      occurred_at: "2026-07-15T12:09:00.000Z",
    });
    const model = transitionTask(proposedTask, {
      kind: "set_status",
      actor_id: "model",
      status: "pending",
      occurred_at: "2026-07-15T12:09:00.000Z",
    });

    // Then neither command returns mutated state
    expect(invalid).toEqual({ kind: "rejected", reason: "invalid_transition" });
    expect(model).toEqual({ kind: "rejected", reason: "unauthorized_actor" });
    expect(canonicalSerialize(proposedTask)).toBe(before);
  });
});
