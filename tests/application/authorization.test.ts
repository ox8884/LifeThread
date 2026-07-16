import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateDraft } from "@/application/communication/generate-draft";
import { ingestNoteEvidence } from "@/application/evidence/ingest-evidence";
import { confirmFact } from "@/application/facts/confirm-fact";
import { runTaskCommand } from "@/application/tasks/task-commands";
import { createThread } from "@/application/threads/create-thread";
import { recordedFixtureOwnerId } from "@/domain/actors";
import { RecordedAnalysisGateway } from "@/infrastructure/ai/recorded-analysis-gateway";
import { LocalJsonThreadRepository } from "@/infrastructure/local/json-thread-repository";

const mismatchedActor = {
  actor_type: "user",
  actor_user_id: "22222222-2222-4222-8222-222222222222",
} as const;
const ownerChatgptActor = {
  actor_type: "chatgpt_app",
  actor_user_id: recordedFixtureOwnerId,
} as const;

async function createThreadFixture() {
  const directory = await mkdtemp(join(tmpdir(), "lifethread-authorization-"));
  const repository = new LocalJsonThreadRepository(join(directory, "state.json"));
  const gateway = new RecordedAnalysisGateway();
  const result = await createThread(
    { goal: "Protect ownership across every write", locale: "en", now: "2026-07-15T12:00:00.000Z" },
    { repository, gateway },
  );
  if (result.kind !== "created") throw new Error("authorization fixture creation failed");
  return { repository, gateway, aggregate: result.aggregate };
}

describe("application write authorization", () => {
  it("rejects a cross-owner task command", async () => {
    // Given a persisted aggregate owned by another user
    const { repository, aggregate } = await createThreadFixture();
    const task = aggregate.tasks[0];
    expect(task).toBeDefined();
    if (!task) return;

    // When a non-owner attempts a task transition
    const result = await runTaskCommand(repository, {
      kind: "transition",
      task_id: task.id,
      status: "pending",
      expected_version: aggregate.thread.version,
      now: "2026-07-15T12:10:00.000Z",
      actor: mismatchedActor,
    });

    // Then the command is rejected before persistence
    expect(result).toEqual({ kind: "rejected", reason: "unauthorized_actor" });
  });

  it("rejects cross-owner evidence ingestion", async () => {
    // Given a persisted aggregate owned by another user
    const { repository, gateway, aggregate } = await createThreadFixture();

    // When a non-owner submits new evidence
    const result = await ingestNoteEvidence(repository, gateway, {
      note: "The schedule changed.",
      locale: "en",
      expected_version: aggregate.thread.version,
      now: "2026-07-15T12:10:00.000Z",
      actor: mismatchedActor,
    });

    // Then the write path rejects the caller
    expect(result).toEqual({ kind: "unauthorized_actor" });
  });

  it("rejects a cross-owner fact confirmation", async () => {
    // Given a persisted aggregate containing a proposed fact
    const { repository, aggregate } = await createThreadFixture();
    const fact = aggregate.facts[0];
    expect(fact).toBeDefined();
    if (!fact) return;

    // When a non-owner confirms the fact
    const result = await confirmFact(repository, {
      fact_id: fact.id,
      expected_version: aggregate.thread.version,
      now: "2026-07-15T12:10:00.000Z",
      actor: mismatchedActor,
    });

    // Then the fact remains unconfirmed
    expect(result).toEqual({ kind: "unauthorized_actor" });
  });

  it("rejects a cross-owner draft generation", async () => {
    // Given a persisted aggregate with cited source material
    const { repository, aggregate } = await createThreadFixture();

    // When a non-owner requests a draft
    const result = await generateDraft(repository, {
      locale: "en",
      expected_version: aggregate.thread.version,
      now: "2026-07-15T12:10:00.000Z",
      actor: mismatchedActor,
    });

    // Then the draft is not written
    expect(result).toEqual({ kind: "unauthorized_actor" });
  });

  it("rejects an owner-matching ChatGPT task transition", async () => {
    // Given a task owned by the same user as the ChatGPT actor
    const { repository, aggregate } = await createThreadFixture();
    const task = aggregate.tasks[0];
    expect(task).toBeDefined();
    if (!task) return;

    // When ChatGPT tries to accept the task
    const result = await runTaskCommand(repository, {
      kind: "transition",
      task_id: task.id,
      status: "pending",
      expected_version: aggregate.thread.version,
      now: "2026-07-15T12:10:00.000Z",
      actor: ownerChatgptActor,
    });

    // Then the generic user-control command rejects it
    expect(result).toEqual({ kind: "rejected", reason: "unauthorized_actor" });
  });

  it("rejects an owner-matching ChatGPT task tombstone", async () => {
    // Given a task owned by the same user as the ChatGPT actor
    const { repository, aggregate } = await createThreadFixture();
    const task = aggregate.tasks[0];
    expect(task).toBeDefined();
    if (!task) return;

    // When ChatGPT tries to tombstone the task
    const result = await runTaskCommand(repository, {
      kind: "tombstone",
      task_id: task.id,
      expected_version: aggregate.thread.version,
      now: "2026-07-15T12:10:00.000Z",
      actor: ownerChatgptActor,
    });

    // Then the generic user-control command rejects it
    expect(result).toEqual({ kind: "rejected", reason: "unauthorized_actor" });
  });

  it("rejects an owner-matching ChatGPT task restore", async () => {
    // Given a tombstoned task owned by the same user as the ChatGPT actor
    const { repository, aggregate } = await createThreadFixture();
    const task = aggregate.tasks[0];
    expect(task).toBeDefined();
    if (!task) return;
    const tombstoned = {
      ...aggregate,
      tasks: [{ ...task, deleted_at: aggregate.thread.updated_at, deleted_by: aggregate.thread.owner_id }],
    };
    const saved = await repository.save(tombstoned, aggregate.thread.version);
    expect(saved.kind).toBe("saved");

    // When ChatGPT tries to restore the task
    const result = await runTaskCommand(repository, {
      kind: "restore",
      task_id: task.id,
      expected_version: aggregate.thread.version,
      now: "2026-07-15T12:10:00.000Z",
      actor: ownerChatgptActor,
    });

    // Then the generic user-control command rejects it
    expect(result).toEqual({ kind: "rejected", reason: "unauthorized_actor" });
  });

  it("rejects owner-matching ChatGPT evidence ingestion", async () => {
    // Given a persisted aggregate owned by the ChatGPT actor's user
    const { repository, gateway, aggregate } = await createThreadFixture();

    // When ChatGPT submits user evidence
    const result = await ingestNoteEvidence(repository, gateway, {
      note: "The schedule changed.",
      locale: "en",
      expected_version: aggregate.thread.version,
      now: "2026-07-15T12:10:00.000Z",
      actor: ownerChatgptActor,
    });

    // Then the user-control write rejects it
    expect(result).toEqual({ kind: "unauthorized_actor" });
  });

  it("rejects an owner-matching ChatGPT fact confirmation", async () => {
    // Given a proposed fact owned by the ChatGPT actor's user
    const { repository, aggregate } = await createThreadFixture();
    const fact = aggregate.facts[0];
    expect(fact).toBeDefined();
    if (!fact) return;

    // When ChatGPT confirms the fact
    const result = await confirmFact(repository, {
      fact_id: fact.id,
      expected_version: aggregate.thread.version,
      now: "2026-07-15T12:10:00.000Z",
      actor: ownerChatgptActor,
    });

    // Then the user-control write rejects it
    expect(result).toEqual({ kind: "unauthorized_actor" });
  });

  it("rejects owner-matching ChatGPT draft generation", async () => {
    // Given a cited aggregate owned by the ChatGPT actor's user
    const { repository, aggregate } = await createThreadFixture();

    // When ChatGPT requests a user draft
    const result = await generateDraft(repository, {
      locale: "en",
      expected_version: aggregate.thread.version,
      now: "2026-07-15T12:10:00.000Z",
      actor: ownerChatgptActor,
    });

    // Then the user-control write rejects it
    expect(result).toEqual({ kind: "unauthorized_actor" });
  });
});
