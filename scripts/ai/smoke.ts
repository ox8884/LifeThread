import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { reconcileCandidate } from "../../src/application/analysis/reconcile-candidate";
import { createThread } from "../../src/application/threads/create-thread";
import { candidateDeltaSchema } from "../../src/domain/candidate-delta";
import { RecordedAnalysisGateway } from "../../src/infrastructure/ai/recorded-analysis-gateway";
import { LocalJsonThreadRepository } from "../../src/infrastructure/local/json-thread-repository";
import {
  LiveAnalysisError,
  OpenAIResponsesGateway,
  openAIModel,
} from "../../src/infrastructure/openai/responses-gateway";

async function runSmoke(apiKey: string): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), "lifethread-ai-smoke-"));
  const repository = new LocalJsonThreadRepository(join(directory, "state.json"));
  const seeded = await createThread(
    {
      goal: "Create a realistic mixed-language learning plan 학습 계획",
      locale: "en",
      now: new Date().toISOString(),
    },
    { repository, gateway: new RecordedAnalysisGateway() },
  );
  if (seeded.kind !== "created") throw new SmokeSetupError();
  const liveGateway = new OpenAIResponsesGateway(apiKey);
  const raw = await liveGateway.analyze({
    aggregate: seeded.aggregate,
    locale: "en",
    reason: "manual_refresh",
    source_reference_id: "source_goal",
  });
  const candidate = candidateDeltaSchema.parse(raw);
  const reconciled = reconcileCandidate(
    seeded.aggregate,
    candidate,
    new Date().toISOString(),
  );
  if (reconciled.kind !== "applied") throw new SmokeReconciliationError(reconciled.kind);
  console.log(
    `AI_SMOKE_OK model=${openAIModel} schema=${candidate.schema_version} operations=${candidate.operations.length} outcome=applied`,
  );
}

class SmokeSetupError extends Error {}
class SmokeReconciliationError extends Error {
  readonly outcome: string;
  constructor(outcome: string) {
    super("AI smoke reconciliation failed");
    this.outcome = outcome;
  }
}

const apiKey = process.env["OPENAI_API_KEY"];
if (!apiKey) {
  console.error("AI_SMOKE_MISSING_OPENAI_API_KEY");
  process.exitCode = 1;
} else {
  try {
    await runSmoke(apiKey);
  } catch (error) {
    const category = error instanceof LiveAnalysisError
      ? error.category
      : error instanceof SmokeReconciliationError
        ? error.outcome
        : error instanceof SmokeSetupError
          ? "setup"
          : "network_or_provider";
    console.error(`AI_SMOKE_FAILED category=${category}`);
    process.exitCode = 1;
  }
}
