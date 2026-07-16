import { describe, expect, it } from "vitest";
import {
  canonicalStatuses,
  sourceTypes,
} from "@/domain/status";
import {
  candidateDeltaSchema,
  type CandidateDelta,
} from "@/domain/candidate-delta";
import {
  lifeThreadSchema,
  lifeThreadAggregateSchema,
  revisionSchema,
  type LifeThreadAggregate,
} from "@/domain/entities";
import { canonicalSerialize } from "@/domain/serialization";
import { createAggregateFixture, USER_ID } from "@tests/fixtures/domain";

const validCandidate = {
  schema_version: "lifethread.candidate_delta.v1",
  thread_id: "thread_contract",
  base_revision_id: "revision_1",
  analysis_run_id: "analysis_1",
  analysis_reason: "initial_goal",
  requested_locale: "en",
  detected_source_languages: ["ko"],
  operations: [
    {
      operation_id: "operation_1",
      kind: "create_task",
      semantic_key: "task:first-step",
      content: "첫 단계를 확인하기",
      priority: "high",
      derivation: "direct",
      confidence: 0.9,
      source_reference_ids: ["source_goal"],
    },
  ],
  current_state_summary: "The goal is ready for a first review.",
  next_best_action: {
    action: "Review the proposed first step",
    rationale: "It keeps the user in control.",
    dependencies: [],
    confidence: 0.9,
    source_reference_ids: ["source_goal"],
  },
  change_explanation: "Created one tentative task.",
} satisfies CandidateDelta;

describe("canonical domain contracts", () => {
  it("exposes every canonical status and exactly four immutable origins", () => {
    // Given the approved canonical vocabulary
    // When consumers inspect the exported contracts
    // Then no localized or scenario-specific value is present
    expect(canonicalStatuses).toEqual([
      "proposed",
      "pending",
      "in_progress",
      "waiting",
      "blocked",
      "completed",
      "rejected",
      "uncertain",
      "overdue",
      "cancelled",
    ]);
    expect(sourceTypes).toEqual([
      "user_created",
      "ai_suggested",
      "evidence_extracted",
      "context_inferred",
    ]);
  });

  it("accepts category-free construction and rejects a category discriminator", () => {
    // Given a smallest valid thread
    const thread = {
      id: "thread_contract",
      owner_id: USER_ID,
      title: "언어와 상관없는 목표",
      goal_text: "Build a mixed-language routine 건강하게",
      goal_confirmed: false,
      version: 1,
      created_at: "2026-07-15T12:00:00.000Z",
      updated_at: "2026-07-15T12:00:00.000Z",
    };

    // When the boundary parses it
    // Then arbitrary content succeeds while workflow routing is rejected
    expect(lifeThreadSchema.safeParse(thread).success).toBe(true);
    expect(
      lifeThreadSchema.safeParse({ ...thread, category: "health" }).success,
    ).toBe(false);
  });

  it("rejects model confirmation fields and uncited important operations", () => {
    // Given a structurally valid CandidateDelta
    // When forbidden authority or missing provenance enters the boundary
    // Then the closed schema rejects both before reconciliation
    expect(candidateDeltaSchema.safeParse(validCandidate).success).toBe(true);
    expect(
      candidateDeltaSchema.safeParse({
        ...validCandidate,
        operations: [
          {
            ...validCandidate.operations[0],
            user_confirmed: true,
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      candidateDeltaSchema.safeParse({
        ...validCandidate,
        operations: [
          {
            ...validCandidate.operations[0],
            source_reference_ids: [],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("serializes canonical state deterministically while preserving unknown dates", () => {
    // Given equivalent aggregate objects with unknown temporal data
    const first = {
      thread: {
        id: "thread_contract",
        owner_id: USER_ID,
        title: "Unknown date",
        goal_text: "Plan without inventing a date",
        goal_confirmed: false,
        version: 1,
        created_at: "2026-07-15T12:00:00.000Z",
        updated_at: "2026-07-15T12:00:00.000Z",
      },
      milestones: [],
      tasks: [],
      evidence: [],
      source_references: [],
      facts: [],
      timeline_events: [],
      open_loops: [],
      waiting_states: [],
      deadlines: [],
      risks: [],
      conflicts: [],
      recommendations: [],
      communications: [],
      localized_content: [],
      analysis_runs: [],
      corrections: [],
      revisions: [],
      applied_analysis_run_ids: [],
      applied_operation_ids: [],
      living_state: {
        summary: "Date remains unknown",
        occurred_at: null,
        date_precision: "unknown",
      },
    } satisfies LifeThreadAggregate;

    // When serialized repeatedly
    // Then bytes and null date semantics remain stable
    expect(canonicalSerialize(first)).toBe(canonicalSerialize(first));
    expect(canonicalSerialize(first)).toContain('"occurred_at":null');
  });

  it("requires an owning user for aggregates and closed revision actors", () => {
    // Given a fixture owned by one authenticated user and a user revision
    const fixture = createAggregateFixture();
    const userRevision = {
      id: "revision_user",
      thread_id: fixture.thread.id,
      version: 2,
      actor_type: "user",
      actor_user_id: USER_ID,
      command: "task:add",
      change_summary: "Added one task.",
      previous_version: 1,
      created_at: "2026-07-15T12:01:00.000Z",
    };

    // When domain boundaries parse the authenticated state
    // Then ownership and the actor discriminant are preserved together
    expect(lifeThreadAggregateSchema.parse(fixture).thread.owner_id).toBe(USER_ID);
    expect(revisionSchema.parse(userRevision)).toMatchObject({
      actor_type: "user",
      actor_user_id: USER_ID,
    });
    expect(() => revisionSchema.parse({
      ...userRevision,
      actor_type: "chatgpt_app",
      actor_user_id: null,
    })).toThrow();
  });
});
