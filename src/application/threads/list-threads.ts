import type {
  ThreadRepository,
  ThreadSummary,
} from "@/application/threads/thread-repository";

export async function listThreads(
  repository: ThreadRepository,
  ownerId: string,
): Promise<readonly ThreadSummary[]> {
  return repository.list(ownerId);
}
