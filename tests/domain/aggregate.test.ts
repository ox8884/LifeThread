import { describe, expect, it } from "vitest";
import { applyTaskMutation } from "@/domain/lifethread-aggregate";
import { canonicalSerialize } from "@/domain/serialization";
import { reconcileCandidate } from "@/application/analysis/reconcile-candidate";
import {
  createAggregateFixture,
  createCandidateFixture,
  fixedNow,
  USER_ID,
} from "@tests/fixtures/domain";

const recordedActor = { actor_type: "recorded_fixture", actor_user_id: null } as const;
const userActor = { actor_type: "user", actor_user_id: USER_ID } as const;

describe("LifeThread aggregate task commands", () => {
  it("emits one revision for a human task transition", () => {
    // Given an aggregate containing one reconciled proposal
    const reconciled = reconcileCandidate(
      createAggregateFixture(),
      createCandidateFixture(),
      fixedNow,
      recordedActor,
    );
    expect(reconciled.kind).toBe("applied");
    if (reconciled.kind !== "applied") return;
    const task = reconciled.aggregate.tasks[0];
    expect(task).toBeDefined();
    if (!task) return;

    // When its owner accepts it at the expected version
    const result = applyTaskMutation(reconciled.aggregate, {
      kind: "transition",
      task_id: task.id,
      status: "pending",
      actor: userActor,
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
      actor: userActor,
      expected_version: 0,
      occurred_at: fixedNow,
    });

    // Then no state or revision is emitted
    expect(result).toEqual({ kind: "rejected", reason: "stale_version" });
    expect(canonicalSerialize(aggregate)).toBe(before);
  });

  it("rejects a user mutation from a different owner", () => {
    // Given an aggregate with a different authenticated owner
    const aggregate = createAggregateFixture();

    // When another user tries to add a task at the current version
    const result = applyTaskMutation(aggregate, {
      kind: "add",
      content: "A cross-owner task",
      actor: { actor_type: "user", actor_user_id: "22222222-2222-4222-8222-222222222222" },
      expected_version: aggregate.thread.version,
      occurred_at: fixedNow,
    });

    // Then the aggregate rejects the unowned write
    expect(result).toEqual({ kind: "rejected", reason: "unauthorized_actor" });
  });
});
