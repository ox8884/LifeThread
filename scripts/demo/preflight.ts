import { missingLiveEnvironment } from "../../src/config/env";
import { getRuntimeRepository } from "../../src/infrastructure/runtime";
import en from "../../messages/en.json";
import ko from "../../messages/ko.json";

const localState = await getRuntimeRepository().load();
const dictionariesMatch = JSON.stringify(Object.keys(en).sort()) === JSON.stringify(Object.keys(ko).sort());

if (localState && dictionariesMatch) {
  console.log(
    `DEMO_PREFLIGHT_OK mode=local adapter=recorded_fixture actor=demo_user thread=${localState.thread.id} version=${localState.thread.version}`,
  );
} else {
  const missing = missingLiveEnvironment(process.env);
  if (missing.length > 0) {
    console.error(`DEMO_PREFLIGHT_MISSING ${missing.join(",")}`);
    process.exitCode = 1;
  } else {
    console.log("DEMO_PREFLIGHT_OK mode=live adapters=supabase,openai");
  }
}
