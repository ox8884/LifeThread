import type { LifeThreadAggregate } from "@/domain/entities";

export type SaveResult =
  | Readonly<{ kind: "saved" }>
  | Readonly<{ kind: "stale_version"; actual_version: number | null }>;

export interface ThreadRepository {
  load(): Promise<LifeThreadAggregate | null>;
  save(
    aggregate: LifeThreadAggregate,
    expectedVersion: number | null,
  ): Promise<SaveResult>;
  reset(aggregate: LifeThreadAggregate | null): Promise<void>;
}
