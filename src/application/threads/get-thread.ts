import type { ThreadRepository } from "@/application/threads/thread-repository";
import type { LifeThreadAggregate } from "@/domain/entities";

export async function getThread(
  repository: ThreadRepository,
  ownerId: string,
  threadId: string,
): Promise<LifeThreadAggregate | null> {
  return repository.load(ownerId, threadId);
}
