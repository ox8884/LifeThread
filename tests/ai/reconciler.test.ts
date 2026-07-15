import { describe, expect, it } from "vitest";
import { reconcileCandidate } from "@/application/analysis/reconcile-candidate";
import { canonicalSerialize } from "@/domain/serialization";
import {
  createAggregateFixture,
  createCandidateFixture,
  fixedNow,
} from "@tests/fixtures/domain";

describe("deterministic CandidateDelta reconciliation", () => {
  it("applies cited proposals as one revision while retaining AI provenance", () => {
    // Given a current aggregate and schema-valid candidate
    const aggregate = createAggregateFixture();
    const candidate = createCandidateFixture();

    // When deterministic reconciliation runs
    const result = reconcileCandidate(aggregate, candidate, fixedNow);

    // Then all accepted effects share exactly one new revision
    expect(result.kind).toBe("applied");
    if (result.kind === "applied") {
      expect(result.aggregate.thread.version).toBe(2);
      expect(result.aggregate.revisions).toHaveLength(2);
      expect(result.aggregate.tasks[0]?.source_type).toBe("ai_suggested");
      expect(result.aggregate.tasks[0]?.user_confirmed).toBe(false);
      expect(result.aggregate.facts[0]?.source_reference_ids).toEqual(["source_goal"]);
      expect(result.aggregate.living_state.occurred_at).toBeNull();
    }
  });

  it("returns prior state for exact replay and stale input", () => {
    // Given one successfully reconciled candidate
    const first = reconcileCandidate(
      createAggregateFixture(),
      createCandidateFixture(),
      fixedNow,
    );
    expect(first.kind).toBe("applied");
    if (first.kind !== "applied") return;
    const before = canonicalSerialize(first.aggregate);

    // When the same run or its stale base is submitted again
    const replay = reconcileCandidate(first.aggregate, createCandidateFixture(), fixedNow);
    const staleCandidate = {
      ...createCandidateFixture(),
      analysis_run_id: "analysis_stale",
    };
    const stale = reconcileCandidate(first.aggregate, staleCandidate, fixedNow);

    // Then neither path writes a revision
    expect(replay.kind).toBe("duplicate");
    expect(stale.kind).toBe("rejected");
    if (stale.kind === "rejected") expect(stale.reason).toBe("stale_version");
    expect(canonicalSerialize(first.aggregate)).toBe(before);
  });

  it("creates a conflict instead of overwriting a confirmed fact", () => {
    // Given an existing confirmed fact with the same semantic identity
    const aggregate = createAggregateFixture();
    const withConfirmedFact = {
      ...aggregate,
      facts: [
        {
          id: "fact_confirmed",
          semantic_key: "fact:language",
          thread_id: aggregate.thread.id,
          content: "The goal is Korean-only.",
          status: "pending" as const,
          source_type: "user_created" as const,
          derivation: "direct" as const,
          source_reference_ids: ["source_goal"],
          confidence: 1,
          user_confirmed: true,
          confirmed_by: "demo_user" as const,
          confirmed_at: fixedNow,
          relevant_date: null,
          date_precision: "unknown" as const,
          created_at: fixedNow,
          updated_at: fixedNow,
        },
      ],
    };

    // When a candidate proposes a contradictory value
    const result = reconcileCandidate(withConfirmedFact, createCandidateFixture(), fixedNow);

    // Then the confirmed value survives and an unresolved conflict is visible
    expect(result.kind).toBe("applied");
    if (result.kind === "applied") {
      expect(result.aggregate.facts[0]?.content).toBe("The goal is Korean-only.");
      expect(result.aggregate.conflicts).toHaveLength(1);
      expect(result.aggregate.conflicts[0]?.status).toBe("unresolved");
    }
  });
});
