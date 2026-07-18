import type { LifeThreadAggregate } from "@/domain/entities";

export type ThreadSummary = Readonly<{
  id: string;
  title: string;
  goal_text: string;
  version: number;
  updated_at: string;
  review_count: number;
  progress?: Readonly<{ completed: number; total: number; percent: number }>;
}>;

export type SaveResult =
  | Readonly<{ kind: "saved" }>
  | Readonly<{ kind: "stale_version"; actual_version: number | null }>;

export interface ThreadRepository {
  list(ownerId: string): Promise<readonly ThreadSummary[]>;
  load(ownerId: string, threadId: string): Promise<LifeThreadAggregate | null>;
  save(
    ownerId: string,
    aggregate: LifeThreadAggregate,
    expectedVersion: number | null,
  ): Promise<SaveResult>;
}

export interface ResettableThreadRepository {
  resetOwner(ownerId: string): Promise<void>;
}

export class ThreadOwnerMismatchError extends Error {
  readonly name = "ThreadOwnerMismatchError";

  constructor(
    readonly ownerId: string,
    readonly aggregateOwnerId: string,
  ) {
    super("The repository caller does not own the aggregate");
  }
}
