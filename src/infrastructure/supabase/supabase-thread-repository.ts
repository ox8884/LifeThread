import type { PostgrestError } from "@supabase/supabase-js";
import { z } from "zod";
import type {
  SaveResult,
  ThreadRepository,
  ThreadSummary,
} from "@/application/threads/thread-repository";
import { ThreadOwnerMismatchError } from "@/application/threads/thread-repository";
import { projectLivingState } from "@/application/state/project-living-state";
import {
  lifeThreadAggregateSchema,
  type LifeThreadAggregate,
} from "@/domain/entities";
import type { RepositoryClient } from "@/infrastructure/supabase/repository-client";

const threadSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  goal_text: z.string().min(1).max(2_000),
  version: z.number().int().positive(),
  updated_at: z.string().datetime({ offset: true }),
  review_count: z.number().int().nonnegative(),
  aggregate: lifeThreadAggregateSchema.optional(),
}).strict();

const aggregateRowSchema = z.object({
  aggregate: lifeThreadAggregateSchema,
}).strict();

const saveRpcRowSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("saved"),
    actual_version: z.number().int().positive(),
  }).strict(),
  z.object({
    kind: z.literal("stale_version"),
    actual_version: z.number().int().positive().nullable(),
  }).strict(),
]);

type RepositoryOperation = "list" | "load" | "save";

export class SupabaseRepositoryError extends Error {
  readonly name = "SupabaseRepositoryError";

  constructor(
    readonly operation: RepositoryOperation,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function throwRepositoryError(
  operation: RepositoryOperation,
  error: PostgrestError | null,
): void {
  if (error) throw new SupabaseRepositoryError(operation, error.code, error.message);
}

function assertNever(value: never): never {
  throw new SupabaseRepositoryError(
    "save",
    "invalid_rpc_response",
    `Unexpected aggregate save response: ${JSON.stringify(value)}`,
  );
}

export class SupabaseThreadRepository implements ThreadRepository {
  readonly #client: RepositoryClient;

  constructor(client: RepositoryClient) {
    this.#client = client;
  }

  async list(ownerId: string): Promise<readonly ThreadSummary[]> {
    const { data, error } = await this.#client
      .from("life_threads")
      .select("id,title,goal_text,version,updated_at,review_count,aggregate")
      .eq("owner_id", ownerId)
      .order("updated_at", { ascending: false });
    throwRepositoryError("list", error);
    return z.array(threadSummarySchema).parse(data).map((row) => ({
      id: row.id,
      title: row.title,
      goal_text: row.goal_text,
      version: row.version,
      updated_at: row.updated_at,
      review_count: row.review_count,
      ...(row.aggregate ? { progress: projectLivingState(row.aggregate).progress } : {}),
    }));
  }

  async load(
    ownerId: string,
    threadId: string,
  ): Promise<LifeThreadAggregate | null> {
    const { data, error } = await this.#client
      .from("life_threads")
      .select("aggregate")
      .eq("owner_id", ownerId)
      .eq("id", threadId)
      .maybeSingle();
    throwRepositoryError("load", error);
    if (!data) return null;
    const aggregate = aggregateRowSchema.parse(data).aggregate;
    if (aggregate.thread.owner_id !== ownerId) {
      throw new ThreadOwnerMismatchError(ownerId, aggregate.thread.owner_id);
    }
    if (aggregate.thread.id !== threadId) {
      throw new SupabaseRepositoryError(
        "load",
        "invalid_thread_id",
        "The loaded aggregate does not match the requested thread",
      );
    }
    return aggregate;
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
    const { data, error } = await this.#client.rpc(
      "save_lifethread_aggregate",
      {
        p_thread_id: parsed.thread.id,
        p_expected_version: expectedVersion,
        p_aggregate: parsed,
      },
    );
    throwRepositoryError("save", error);
    const [result] = z.tuple([saveRpcRowSchema]).parse(data);
    switch (result.kind) {
      case "saved":
        return { kind: "saved" };
      case "stale_version":
        return { kind: "stale_version", actual_version: result.actual_version };
      default:
        return assertNever(result);
    }
  }
}
