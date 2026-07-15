import { describe, expect, it } from "vitest";
import { applyTaskMutation } from "@/domain/lifethread-aggregate";
import { canonicalSerialize } from "@/domain/serialization";
import { reconcileCandidate } from "@/application/analysis/reconcile-candidate";
import {
  createAggregateFixture,
  createCandidateFixture,
  fixedNow,
} from "@tests/fixtures/domain";

describe("LifeThread aggregate task commands", () => {
  it("emits one revision for a human task transition", () => {
    // Given an aggregate containing one reconciled proposal
    const reconciled = reconcileCandidate(
      createAggregateFixture(),
      createCandidateFixture(),
      fixedNow,
    );
    expect(reconciled.kind).toBe("applied");
    if (reconciled.kind !== "applied") return;
    const task = reconciled.aggregate.tasks[0];
    expect(task).toBeDefined();
    if (!task) return;

    // When demo_user accepts it at the expected version
    const result = applyTaskMutation(reconciled.aggregate, {
      kind: "transition",
      task_id: task.id,
      status: "pending",
      actor_id: "demo_user",
      expected_version: 2,
      occurred_at: "2026-07-15T12:10:00.000Z",
    });

    // Then exactly one append-only revision records the change
    expect(result.kind).toBe("applied");
    if (result.kind === "applied") {
      expect(result.aggregate.thread.version).toBe(3);
      expect(result.aggregate.revisions).toHaveLength(3);
      expect(result.aggregate.tasks[0]?.source_type).toBe("ai_suggested");
    }
  });

  it("rejects stale writes without changing canonical bytes", () => {
    // Given a current aggregate
    const aggregate = createAggregateFixture();
    const before = canonicalSerialize(aggregate);

    // When a stale browser attempts to add a task
    const result = applyTaskMutation(aggregate, {
      kind: "add",
      content: "A stale task",
      actor_id: "demo_user",
      expected_version: 0,
      occurred_at: fixedNow,
    });

    // Then no state or revision is emitted
    expect(result).toEqual({ kind: "rejected", reason: "stale_version" });
    expect(canonicalSerialize(aggregate)).toBe(before);
  });
});
