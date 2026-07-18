import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getThread } from "@/application/threads/get-thread";
import { createMcpToolHandlers } from "@/mcp/register-tools";
import { LocalJsonThreadRepository } from "@/infrastructure/local/json-thread-repository";
import { createAggregateFixture, createCandidateFixture, USER_ID } from "@tests/fixtures/domain";

const cleanupPaths: string[] = [];

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map((path) => rm(path, { force: true, recursive: true })));
});

async function createHandlers() {
  const directory = await mkdtemp(join(tmpdir(), "lifethread-mcp-"));
  cleanupPaths.push(directory);
  const repository = new LocalJsonThreadRepository(join(directory, "threads.json"));
  const aggregate = createAggregateFixture();
  const saved = await repository.save(USER_ID, aggregate, null);
  if (saved.kind !== "saved") throw new Error("fixture save failed");
  return { repository, handlers: createMcpToolHandlers(repository) };
}

describe("LifeThread MCP tools", () => {
  it("lists and gets only the authenticated owner's minimal thread projection", async () => {
    const { handlers } = await createHandlers();

    const listed = await handlers.list_lifethreads({ ownerId: USER_ID });
    expect(listed.threads).toHaveLength(1);
    expect(listed.threads[0]?.id).toBe("thread_fixture");

    const thread = await handlers.get_lifethread({ ownerId: USER_ID, threadId: "thread_fixture" });
    if (!("thread" in thread)) throw new Error("thread projection missing");
    expect(thread.thread.id).toBe("thread_fixture");
    expect(thread.thread.goal_text).toContain("한국어");
    expect(thread).not.toHaveProperty("evidence");
  });

  it("applies a cited ChatGPT candidate once and keeps proposals tentative", async () => {
    const { handlers, repository } = await createHandlers();
    const candidate = createCandidateFixture();

    const first = await handlers.propose_lifethread_update({ ownerId: USER_ID, candidate });
    expect(first.outcome).toBe("applied");
    expect(first.resulting_version).toBe(2);

    const aggregate = await getThread(repository, USER_ID, "thread_fixture");
    expect(aggregate?.tasks[0]?.status).toBe("proposed");
    expect(aggregate?.tasks[0]?.user_confirmed).toBe(false);

    const replay = await handlers.propose_lifethread_update({ ownerId: USER_ID, candidate });
    expect(replay.outcome).toBe("duplicate");
    expect(replay.resulting_version).toBe(2);
  });

  it("requires current version for explicit proposal decisions", async () => {
    const { handlers } = await createHandlers();
    const first = await handlers.propose_lifethread_update({
      ownerId: USER_ID,
      candidate: createCandidateFixture(),
    });
    const proposalId = first.proposals[0]?.id;
    if (!proposalId) throw new Error("proposal id missing");

    await expect(handlers.accept_lifethread_proposal({
      ownerId: USER_ID,
      threadId: "thread_fixture",
      proposalId,
      expectedVersion: 1,
    })).resolves.toMatchObject({ outcome: "stale_version" });

    await expect(handlers.reject_lifethread_proposal({
      ownerId: USER_ID,
      threadId: "thread_fixture",
      proposalId,
      expectedVersion: 2,
    })).resolves.toMatchObject({ outcome: "rejected" });
  });
});
