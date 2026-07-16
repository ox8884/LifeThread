import { createThread } from "@/application/threads/create-thread";
import type {
  ResettableThreadRepository,
  ThreadRepository,
} from "@/application/threads/thread-repository";
import { recordedFixtureOwnerId } from "@/domain/actors";
import { RecordedAnalysisGateway } from "@/infrastructure/ai/recorded-analysis-gateway";

export const demoGoal =
  "Build a sustainable bilingual learning routine 주말 학습 계획";
export const demoResetTime = "2026-07-15T12:00:00.000Z";

export async function resetDemo(
  repository: ThreadRepository & ResettableThreadRepository,
) {
  await repository.resetOwner(recordedFixtureOwnerId);
  const result = await createThread(
    { goal: demoGoal, locale: "en", now: demoResetTime },
    { repository, gateway: new RecordedAnalysisGateway() },
  );
  if (result.kind !== "created") throw new DemoResetError(result.kind);
  return result.aggregate;
}

export class DemoResetError extends Error {
  readonly outcome: string;
  constructor(outcome: string) {
    super("Demo reset did not create canonical state");
    this.name = "DemoResetError";
    this.outcome = outcome;
  }
}
