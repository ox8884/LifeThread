import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LocalJsonThreadRepository } from "@/infrastructure/local/json-thread-repository";
import { LocalPrivateStorage } from "@/infrastructure/local/private-storage";
import { demoGoal, resetDemo } from "@/application/demo/reset-demo";
import { canonicalSerialize } from "@/domain/serialization";
import { createAggregateFixture } from "@tests/fixtures/domain";

describe("local persistence adapters", () => {
  it("lists multiple threads for only their owner", async () => {
    // Given a repository backed by a real temporary directory
    const directory = await mkdtemp(join(tmpdir(), "lifethread-repository-"));
    const path = join(directory, "state.json");
    const repository = new LocalJsonThreadRepository(path);
    const firstAggregate = createAggregateFixture();
    const ownerId = firstAggregate.thread.owner_id;
    const secondAggregate = {
      ...firstAggregate,
      thread: {
        ...firstAggregate.thread,
        id: "thread_second",
        title: "Study plan, again",
        updated_at: "2026-07-15T12:01:00.000Z",
      },
    };

    // When two threads with the same goal text are saved for one owner
    const first = await repository.save(ownerId, firstAggregate, null);
    const second = await repository.save(ownerId, secondAggregate, null);

    // Then that owner sees both newest-first while another owner sees neither
    expect(first).toEqual({ kind: "saved" });
    expect(second).toEqual({ kind: "saved" });
    expect(await repository.list(ownerId)).toEqual([
      {
        id: "thread_second",
        title: "Study plan, again",
        goal_text: firstAggregate.thread.goal_text,
        version: 1,
        updated_at: "2026-07-15T12:01:00.000Z",
        review_count: 0,
        progress: { completed: 0, total: 0, percent: 0 },
      },
      {
        id: "thread_fixture",
        title: "Study plan",
        goal_text: firstAggregate.thread.goal_text,
        version: 1,
        updated_at: "2026-07-15T12:00:00.000Z",
        review_count: 0,
        progress: { completed: 0, total: 0, percent: 0 },
      },
    ]);
    const otherOwnerId = "22222222-2222-4222-8222-222222222222";
    expect(await repository.list(otherOwnerId)).toEqual([]);
    expect(await repository.load(otherOwnerId, firstAggregate.thread.id)).toBeNull();
  });

  it("keeps matching thread IDs independent across owners", async () => {
    // Given two owners with aggregates that share a thread identifier
    const directory = await mkdtemp(join(tmpdir(), "lifethread-repository-"));
    const repository = new LocalJsonThreadRepository(join(directory, "state.json"));
    const firstAggregate = createAggregateFixture();
    const otherOwnerId = "22222222-2222-4222-8222-222222222222";
    const secondAggregate = {
      ...firstAggregate,
      thread: {
        ...firstAggregate.thread,
        owner_id: otherOwnerId,
        title: "Other owner's matching identifier",
      },
    };

    // When each owner saves the same thread identifier
    await repository.save(firstAggregate.thread.owner_id, firstAggregate, null);
    await repository.save(otherOwnerId, secondAggregate, null);

    // Then both owner/thread keys resolve their independent aggregates
    expect(await repository.load(firstAggregate.thread.owner_id, firstAggregate.thread.id)).toEqual(
      firstAggregate,
    );
    expect(await repository.load(otherOwnerId, secondAggregate.thread.id)).toEqual(
      secondAggregate,
    );
  });

  it("serializes concurrent same-version saves across repository instances", async () => {
    // Given separate adapters targeting one local state path and competing initial writes
    const directory = await mkdtemp(join(tmpdir(), "lifethread-repository-"));
    const path = join(directory, "state.json");
    const firstRepository = new LocalJsonThreadRepository(path);
    const secondRepository = new LocalJsonThreadRepository(path);
    const aggregate = createAggregateFixture();
    const competingAggregate = {
      ...aggregate,
      thread: { ...aggregate.thread, title: "Competing initial revision" },
    };

    // When both writers use the same expected version concurrently
    const outcomes = await Promise.all([
      firstRepository.save(aggregate.thread.owner_id, aggregate, null),
      secondRepository.save(aggregate.thread.owner_id, competingAggregate, null),
    ]);

    // Then exactly one wins, the other observes the saved version, and no rename collision occurs
    expect(outcomes.filter((outcome) => outcome.kind === "saved")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.kind === "stale_version")).toEqual([
      { kind: "stale_version", actual_version: 1 },
    ]);
    const loaded = await firstRepository.load(aggregate.thread.owner_id, aggregate.thread.id);
    expect([
      canonicalSerialize(aggregate),
      canonicalSerialize(competingAggregate),
    ]).toContain(canonicalSerialize(loaded));
  });

  it("preserves the winning revision after a stale optimistic write", async () => {
    // Given one persisted thread and a winning second revision
    const directory = await mkdtemp(join(tmpdir(), "lifethread-repository-"));
    const repository = new LocalJsonThreadRepository(join(directory, "state.json"));
    const aggregate = createAggregateFixture();
    const ownerId = aggregate.thread.owner_id;
    const winningAggregate = {
      ...aggregate,
      thread: {
        ...aggregate.thread,
        title: "Winning revision",
        version: 2,
        updated_at: "2026-07-15T12:01:00.000Z",
      },
    };
    await repository.save(ownerId, aggregate, null);
    const winning = await repository.save(ownerId, winningAggregate, 1);

    // When a competing writer saves from the stale first version
    const stale = await repository.save(ownerId, {
      ...winningAggregate,
      thread: { ...winningAggregate.thread, title: "Losing revision" },
    }, 1);

    // Then the stale result reports version two and the winner remains on disk
    expect(winning).toEqual({ kind: "saved" });
    expect(stale).toEqual({ kind: "stale_version", actual_version: 2 });
    const loaded = await repository.load(ownerId, aggregate.thread.id);
    expect(loaded ? canonicalSerialize(loaded) : null).toBe(
      canonicalSerialize(winningAggregate),
    );
  });

  it("rejects a save whose caller does not own the aggregate", async () => {
    // Given an aggregate owned by another user
    const directory = await mkdtemp(join(tmpdir(), "lifethread-repository-"));
    const repository = new LocalJsonThreadRepository(join(directory, "state.json"));
    const aggregate = createAggregateFixture();
    const otherOwnerId = "22222222-2222-4222-8222-222222222222";

    // When the other user attempts the initial save
    const save = repository.save(otherOwnerId, aggregate, null);

    // Then persistence rejects the caller and leaves both owner scopes empty
    await expect(save).rejects.toThrow();
    expect(await repository.list(aggregate.thread.owner_id)).toEqual([]);
    expect(await repository.list(otherOwnerId)).toEqual([]);
  });

  it("resets only local demo owner state before recreating the canonical demo thread", async () => {
    // Given a local demo repository with a stale second thread for the demo owner
    const directory = await mkdtemp(join(tmpdir(), "lifethread-repository-"));
    const repository = new LocalJsonThreadRepository(join(directory, "state.json"));
    const firstDemo = await resetDemo(repository);
    const staleDemoThread = {
      ...firstDemo,
      thread: {
        ...firstDemo.thread,
        id: "thread_stale_demo",
        title: "Stale demo thread",
        updated_at: "2026-07-15T12:01:00.000Z",
      },
    };
    await repository.save(firstDemo.thread.owner_id, staleDemoThread, null);

    // When the local demo reset runs again
    const reset = await resetDemo(repository);

    // Then it recreates exactly the canonical demo thread without stale local state
    expect(reset.thread.goal_text).toBe(demoGoal);
    expect(await repository.list(reset.thread.owner_id)).toEqual([
      expect.objectContaining({
        id: reset.thread.id,
        goal_text: demoGoal,
      }),
    ]);
  });

  it("keeps objects private and grants only an expiring signed read", async () => {
    // Given a private local object store
    const directory = await mkdtemp(join(tmpdir(), "lifethread-storage-"));
    const storage = new LocalPrivateStorage(directory, "test-signing-secret");
    const content = new TextEncoder().encode("private Korean evidence 비공개");

    // When an object is written and a short-lived read is signed
    await storage.put("thread_fixture/evidence_1.txt", content);
    const signed = storage.createSignedRead(
      "thread_fixture/evidence_1.txt",
      "2026-07-15T12:01:00.000Z",
    );

    // Then valid access works, expired access fails, and no public path is emitted
    const valid = await storage.readSigned(signed, "2026-07-15T12:00:30.000Z");
    const expired = await storage.readSigned(signed, "2026-07-15T12:02:00.000Z");
    expect(valid).not.toBeNull();
    if (!valid) return;
    expect(new TextDecoder().decode(valid)).toContain("비공개");
    expect(expired).toBeNull();
    expect(signed).not.toContain("http");
    await expect(readFile(join(directory, "objects", "evidence_1.txt"))).rejects.toThrow();
  });
});
