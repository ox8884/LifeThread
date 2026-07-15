import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
  SaveResult,
  ThreadRepository,
} from "@/application/threads/thread-repository";
import {
  lifeThreadAggregateSchema,
  type LifeThreadAggregate,
} from "@/domain/entities";

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

export class LocalJsonThreadRepository implements ThreadRepository {
  readonly #path: string;

  constructor(path: string) {
    this.#path = path;
  }

  async load(): Promise<LifeThreadAggregate | null> {
    try {
      const content = await readFile(this.#path, "utf8");
      return lifeThreadAggregateSchema.parse(JSON.parse(content));
    } catch (error) {
      if (isMissingFile(error)) return null;
      throw error;
    }
  }

  async save(
    aggregate: LifeThreadAggregate,
    expectedVersion: number | null,
  ): Promise<SaveResult> {
    const current = await this.load();
    const actualVersion = current?.thread.version ?? null;
    if (actualVersion !== expectedVersion) {
      return { kind: "stale_version", actual_version: actualVersion };
    }
    await this.write(aggregate);
    return { kind: "saved" };
  }

  async reset(aggregate: LifeThreadAggregate | null): Promise<void> {
    if (aggregate) {
      await this.write(aggregate);
      return;
    }
    await rm(this.#path, { force: true });
  }

  private async write(aggregate: LifeThreadAggregate): Promise<void> {
    const parsed = lifeThreadAggregateSchema.parse(aggregate);
    await mkdir(dirname(this.#path), { recursive: true, mode: 0o700 });
    const temporaryPath = `${this.#path}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(parsed, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(temporaryPath, this.#path);
  }
}
