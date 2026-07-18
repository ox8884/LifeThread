import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import { projectLivingState } from "@/application/state/project-living-state";
import type {
  ResettableThreadRepository,
  SaveResult,
  ThreadRepository,
  ThreadSummary,
} from "@/application/threads/thread-repository";
import { ThreadOwnerMismatchError } from "@/application/threads/thread-repository";
import {
  lifeThreadAggregateSchema,
  type LifeThreadAggregate,
} from "@/domain/entities";

const localThreadEnvelopeSchema = z.object({
  schema_version: z.literal("lifethread.local_threads.v1"),
  threads: z.array(lifeThreadAggregateSchema).readonly(),
}).strict().readonly();

type LocalThreadEnvelope = z.infer<typeof localThreadEnvelopeSchema>;

const statePathLocks = new Map<string, Promise<void>>();

const emptyEnvelope: LocalThreadEnvelope = {
  schema_version: "lifethread.local_threads.v1",
  threads: [],
};

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function withStatePathLock<T>(
  path: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = statePathLocks.get(path) ?? Promise.resolve();
  const current = previous.then(operation, operation);
  const next = current.then(
    () => undefined,
    () => undefined,
  );
  statePathLocks.set(path, next);
  try {
    return await current;
  } finally {
    if (statePathLocks.get(path) === next) statePathLocks.delete(path);
  }
}

export class LocalJsonThreadRepository implements ThreadRepository, ResettableThreadRepository {
  readonly #path: string;

  constructor(path: string) {
    this.#path = path;
  }

  async list(ownerId: string): Promise<readonly ThreadSummary[]> {
    const envelope = await this.read();
    return envelope.threads
      .filter((aggregate) => aggregate.thread.owner_id === ownerId)
      .map((aggregate) => {
        const projection = projectLivingState(aggregate);
        return {
          id: aggregate.thread.id,
          title: aggregate.thread.title,
          goal_text: aggregate.thread.goal_text,
          version: aggregate.thread.version,
          updated_at: aggregate.thread.updated_at,
          review_count: projection.review_count,
          progress: projection.progress,
        };
      })
      .sort((left, right) => right.updated_at.localeCompare(left.updated_at));
  }

  async load(
    ownerId: string,
    threadId: string,
  ): Promise<LifeThreadAggregate | null> {
    const envelope = await this.read();
    return envelope.threads.find(
      (aggregate) => aggregate.thread.owner_id === ownerId
        && aggregate.thread.id === threadId,
    ) ?? null;
  }

  async save(
    ownerId: string,
    aggregate: LifeThreadAggregate,
    expectedVersion: number | null,
  ): Promise<SaveResult> {
    const parsed = lifeThreadAggregateSchema.parse(aggregate);
    if (parsed.thread.owner_id !== ownerId) {
      throw new ThreadOwnerMismatchError(ownerId, parsed.thread.owner_id);
    }
    return withStatePathLock(this.#path, async () => {
      const envelope = await this.read();
      const current = envelope.threads.find(
        (candidate) => candidate.thread.owner_id === ownerId
          && candidate.thread.id === parsed.thread.id,
      );
      const actualVersion = current?.thread.version ?? null;
      if (actualVersion !== expectedVersion) {
        return { kind: "stale_version", actual_version: actualVersion };
      }
      const threads = current
        ? envelope.threads.map((candidate) => (
          candidate.thread.owner_id === ownerId && candidate.thread.id === parsed.thread.id
            ? parsed
            : candidate
        ))
        : [...envelope.threads, parsed];
      await this.write({ ...envelope, threads });
      return { kind: "saved" };
    });
  }

  async resetOwner(ownerId: string): Promise<void> {
    await withStatePathLock(this.#path, async () => {
      const envelope = await this.read();
      const threads = envelope.threads.filter(
        (aggregate) => aggregate.thread.owner_id !== ownerId,
      );
      if (threads.length === envelope.threads.length) return;
      if (threads.length === 0) {
        await rm(this.#path, { force: true });
        return;
      }
      await this.write({ ...envelope, threads });
    });
  }

  private async read(): Promise<LocalThreadEnvelope> {
    try {
      const content = await readFile(this.#path, "utf8");
      return localThreadEnvelopeSchema.parse(JSON.parse(content));
    } catch (error) {
      if (isMissingFile(error)) return emptyEnvelope;
      throw error;
    }
  }

  private async write(envelope: LocalThreadEnvelope): Promise<void> {
    const parsed = localThreadEnvelopeSchema.parse(envelope);
    await mkdir(dirname(this.#path), { recursive: true, mode: 0o700 });
    const temporaryPath = `${this.#path}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(parsed, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(temporaryPath, this.#path);
  }
}
