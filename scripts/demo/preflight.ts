import { missingRuntimeEnvironment } from "../../src/config/env";
import { getRuntimeRepository } from "../../src/infrastructure/runtime";
import { recordedFixtureOwnerId } from "../../src/domain/actors";
import en from "../../messages/en.json";
import ko from "../../messages/ko.json";

const repository = getRuntimeRepository();
const summary = (await repository.list(recordedFixtureOwnerId))[0];
const localState = summary
  ? await repository.load(recordedFixtureOwnerId, summary.id)
  : null;
const dictionariesMatch = JSON.stringify(Object.keys(en).sort()) === JSON.stringify(Object.keys(ko).sort());

if (localState && dictionariesMatch) {
  console.log(
    `DEMO_PREFLIGHT_OK mode=local adapter=recorded_fixture thread=${localState.thread.id} version=${localState.thread.version}`,
  );
} else {
  const missing = missingRuntimeEnvironment(process.env);
  if (missing.length > 0) {
    console.error(`DEMO_PREFLIGHT_MISSING ${missing.join(",")}`);
    process.exitCode = 1;
  } else {
    console.log("DEMO_PREFLIGHT_OK mode=live adapters=supabase");
  }
}
