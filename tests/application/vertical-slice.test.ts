import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createThread } from "@/application/threads/create-thread";
import { getThread } from "@/application/threads/get-thread";
import { listThreads } from "@/application/threads/list-threads";
import { runTaskCommand } from "@/application/tasks/task-commands";
import { confirmFact } from "@/application/facts/confirm-fact";
import { ingestNoteEvidence } from "@/application/evidence/ingest-evidence";
import { projectLivingState } from "@/application/state/project-living-state";
import { generateDraft } from "@/application/communication/generate-draft";
import { RecordedAnalysisGateway } from "@/infrastructure/ai/recorded-analysis-gateway";
import { LocalJsonThreadRepository } from "@/infrastructure/local/json-thread-repository";
import { canonicalSerialize } from "@/domain/serialization";
import { recordedFixtureOwnerId } from "@/domain/actors";

const ownerActor = { actor_type: "user", actor_user_id: recordedFixtureOwnerId } as const;

async function createRepository() {
  const directory = await mkdtemp(join(tmpdir(), "lifethread-vertical-"));
  return new LocalJsonThreadRepository(join(directory, "state.json"));
}

describe("local LifeThread vertical slice", () => {
  it("creates distinct threads when one owner repeats the same goal", async () => {
    // Given one owner and one normalized goal
    const repository = await createRepository();
    const gateway = new RecordedAnalysisGateway();
    const input = {
      goal: "Build a reliable home maintenance routine",
      locale: "en",
      owner_id: recordedFixtureOwnerId,
    } as const;

    // When the owner creates that goal at two different times
    const first = await createThread(
      { ...input, now: "2026-07-15T12:00:00.000Z" },
      { repository, gateway },
    );
    const second = await createThread(
      { ...input, now: "2026-07-15T12:01:00.000Z" },
      { repository, gateway },
    );

    // Then both threads are independently addressable in newest-first order
    expect(first.kind).toBe("created");
    expect(second.kind).toBe("created");
    if (first.kind !== "created" || second.kind !== "created") return;
    expect(first.aggregate.thread.id).not.toBe(second.aggregate.thread.id);
    expect((await listThreads(repository, recordedFixtureOwnerId)).map((thread) => thread.id)).toEqual([
      second.aggregate.thread.id,
      first.aggregate.thread.id,
    ]);
    expect(await getThread(
      repository,
      recordedFixtureOwnerId,
      first.aggregate.thread.id,
    )).toEqual(first.aggregate);
  });

  it.each([
    "건강한 수면 루틴을 만들고 싶어요",
    "Build a reliable home maintenance routine",
    "Prepare for 여행 while tracking passport renewal",
    "Understand why my custom sensor intermittently fails",
  ])("creates one category-free cited proposal for %s", async (goal) => {
    // Given an empty local repository and recorded strict analysis
    const repository = await createRepository();
    const gateway = new RecordedAnalysisGateway();

    // When an arbitrary goal crosses the application boundary
    const result = await createThread(
      { goal, locale: "en", now: "2026-07-15T12:00:00.000Z" },
      { repository, gateway },
    );

    // Then the same aggregate path produces tentative, cited domain objects
    expect(result.kind).toBe("created");
    if (result.kind !== "created") return;
    const aggregate = await repository.load(
      recordedFixtureOwnerId,
      result.aggregate.thread.id,
    );
    expect(aggregate?.tasks).toHaveLength(3);
    expect(aggregate?.tasks.every((task) => task.status === "proposed")).toBe(true);
    expect(aggregate?.tasks.every((task) => task.source_type === "ai_suggested")).toBe(true);
    expect(canonicalSerialize(aggregate)).not.toContain("category");
  });

  it("rejects blank and over-limit goals without persistence", async () => {
    // Given an empty repository
    const repository = await createRepository();
    const gateway = new RecordedAnalysisGateway();

    // When invalid goal boundaries are submitted
    const blank = await createThread(
      { goal: "  ", locale: "en", now: "2026-07-15T12:00:00.000Z" },
      { repository, gateway },
    );
    const long = await createThread(
      { goal: "가".repeat(2_001), locale: "ko", now: "2026-07-15T12:00:00.000Z" },
      { repository, gateway },
    );

    // Then neither creates partial canonical state
    expect(blank.kind).toBe("invalid_goal");
    expect(long.kind).toBe("invalid_goal");
    expect(await repository.list(recordedFixtureOwnerId)).toEqual([]);
  });

  it("persists human task controls with immutable origin and revisions", async () => {
    // Given a created thread with three AI proposals
    const repository = await createRepository();
    const gateway = new RecordedAnalysisGateway();
    const created = await createThread(
      { goal: "Plan a mixed 한국어 study sprint", locale: "en", now: "2026-07-15T12:00:00.000Z" },
      { repository, gateway },
    );
    expect(created.kind).toBe("created");
    if (created.kind !== "created") return;
    const threadId = created.aggregate.thread.id;
    const initial = await repository.load(recordedFixtureOwnerId, threadId);
    expect(initial).not.toBeNull();
    if (!initial) return;
    const first = initial.tasks[0];
    expect(first).toBeDefined();
    if (!first) return;

    // When demo_user accepts and completes the first task
    const accepted = await runTaskCommand(repository, {
      kind: "transition",
      owner_id: recordedFixtureOwnerId,
      thread_id: threadId,
      task_id: first.id,
      status: "pending",
      expected_version: initial.thread.version,
      now: "2026-07-15T12:10:00.000Z",
      actor: ownerActor,
    });
    expect(accepted.kind).toBe("applied");
    const afterAccept = await repository.load(recordedFixtureOwnerId, threadId);
    expect(afterAccept).not.toBeNull();
    if (!afterAccept) return;
    const completed = await runTaskCommand(repository, {
      kind: "transition",
      owner_id: recordedFixtureOwnerId,
      thread_id: threadId,
      task_id: first.id,
      status: "completed",
      expected_version: afterAccept.thread.version,
      now: "2026-07-15T12:11:00.000Z",
      actor: ownerActor,
    });

    // Then two revisions persist and AI origin remains historical truth
    expect(completed.kind).toBe("applied");
    const current = await repository.load(recordedFixtureOwnerId, threadId);
    expect(current?.tasks[0]?.source_type).toBe("ai_suggested");
    expect(current?.tasks[0]?.status).toBe("completed");
    expect(current?.revisions).toHaveLength(4);
  });

  it("preserves evidence metadata and raises a conflict for a confirmed fact", async () => {
    // Given a thread whose first proposed fact is explicitly confirmed
    const repository = await createRepository();
    const gateway = new RecordedAnalysisGateway();
    const created = await createThread(
      { goal: "Create a steady learning schedule", locale: "en", now: "2026-07-15T12:00:00.000Z" },
      { repository, gateway },
    );
    expect(created.kind).toBe("created");
    if (created.kind !== "created") return;
    const threadId = created.aggregate.thread.id;
    const initial = await repository.load(recordedFixtureOwnerId, threadId);
    expect(initial?.facts[0]).toBeDefined();
    if (!initial || !initial.facts[0]) return;
    await confirmFact(repository, {
      owner_id: recordedFixtureOwnerId,
      thread_id: threadId,
      fact_id: initial.facts[0].id,
      expected_version: initial.thread.version,
      now: "2026-07-15T12:20:00.000Z",
      actor: ownerActor,
    });
    const confirmed = await repository.load(recordedFixtureOwnerId, threadId);
    expect(confirmed).not.toBeNull();
    if (!confirmed) return;

    // When contradictory Korean evidence is ingested and analyzed
    const result = await ingestNoteEvidence(
      repository,
      gateway,
      {
        owner_id: recordedFixtureOwnerId,
        thread_id: threadId,
        note: "사실 일정이 바뀌어서 주말에만 진행할 수 있습니다.",
        locale: "en",
        expected_version: confirmed.thread.version,
        now: "2026-07-15T12:21:00.000Z",
        actor: ownerActor,
      },
    );

    // Then original metadata resolves and the confirmed value is not overwritten
    expect(result.kind).toBe("applied");
    const current = await repository.load(recordedFixtureOwnerId, threadId);
    expect(current?.evidence.at(-1)?.source_language).toBe("ko");
    expect(current?.evidence.at(-1)?.private_object_key).toBeNull();
    expect(current?.facts[0]?.user_confirmed).toBe(true);
    expect(current?.conflicts).toHaveLength(1);
  });

  it("projects one next action and creates a cited unsent locale draft", async () => {
    // Given a cited current state
    const repository = await createRepository();
    const gateway = new RecordedAnalysisGateway();
    const created = await createThread(
      { goal: "Plan a concise bilingual follow-up", locale: "ko", now: "2026-07-15T12:00:00.000Z" },
      { repository, gateway },
    );
    expect(created.kind).toBe("created");
    if (created.kind !== "created") return;
    const threadId = created.aggregate.thread.id;
    const aggregate = await repository.load(recordedFixtureOwnerId, threadId);
    expect(aggregate).not.toBeNull();
    if (!aggregate) return;

    // When state is projected, the current action is completed, and a Korean draft is requested
    const projection = projectLivingState(aggregate);
    expect(projection.next_action).toMatchObject({
      task_id: aggregate.tasks[0]?.id,
      status: "proposed",
      content: aggregate.tasks[0]?.content,
      source_type: "ai_suggested",
    });
    expect(projection.progress).toEqual({ completed: 0, total: 3, percent: 0 });
    expect(projection.review_count).toBe(3);

    const firstTask = aggregate.tasks[0];
    expect(firstTask).toBeDefined();
    if (!firstTask) return;
    const completion = await runTaskCommand(repository, {
      kind: "transition",
      owner_id: recordedFixtureOwnerId,
      thread_id: threadId,
      task_id: firstTask.id,
      status: "completed",
      expected_version: aggregate.thread.version,
      now: "2026-07-15T12:29:00.000Z",
      actor: ownerActor,
    });
    expect(completion.kind).toBe("applied");
    const afterCompletion = await repository.load(recordedFixtureOwnerId, threadId);
    expect(afterCompletion).not.toBeNull();
    if (!afterCompletion) return;

    const nextProjection = projectLivingState(afterCompletion);
    expect(nextProjection.next_action?.task_id).toBe(afterCompletion.tasks[1]?.id);
    expect(nextProjection.progress).toEqual({ completed: 1, total: 3, percent: 33 });

    const drafted = await generateDraft(repository, {
      owner_id: recordedFixtureOwnerId,
      thread_id: threadId,
      locale: "ko",
      expected_version: afterCompletion.thread.version,
      now: "2026-07-15T12:30:00.000Z",
      actor: ownerActor,
    });

    // Then the next task is actionable and the localized draft remains unsent
    expect(projection.next_action?.source_reference_ids).toContain("source_goal");
    expect(drafted.kind).toBe("applied");
    const current = await repository.load(recordedFixtureOwnerId, threadId);
    expect(current?.communications.at(-1)?.locale).toBe("ko");
    expect(current?.communications.at(-1)?.sent).toBe(false);
    expect(canonicalSerialize(current)).not.toContain("send_action");
  });
});
