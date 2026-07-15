import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LocalJsonThreadRepository } from "@/infrastructure/local/json-thread-repository";
import { LocalPrivateStorage } from "@/infrastructure/local/private-storage";
import { canonicalSerialize } from "@/domain/serialization";
import { createAggregateFixture } from "@tests/fixtures/domain";

describe("local persistence adapters", () => {
  it("round-trips one aggregate and rejects a stale optimistic write", async () => {
    // Given a repository backed by a real temporary directory
    const directory = await mkdtemp(join(tmpdir(), "lifethread-repository-"));
    const path = join(directory, "state.json");
    const repository = new LocalJsonThreadRepository(path);
    const aggregate = createAggregateFixture();

    // When the first write and one stale write are attempted
    const first = await repository.save(aggregate, null);
    const stale = await repository.save(
      {
        ...aggregate,
        thread: { ...aggregate.thread, version: 2 },
      },
      0,
    );

    // Then only the expected write survives on disk
    expect(first).toEqual({ kind: "saved" });
    expect(stale).toEqual({ kind: "stale_version", actual_version: 1 });
    const loaded = await repository.load();
    expect(loaded ? canonicalSerialize(loaded) : null).toBe(
      canonicalSerialize(aggregate),
    );
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
