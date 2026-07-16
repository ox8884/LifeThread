import { spawnSync } from "node:child_process";
import { missingLiveEnvironment } from "../../src/config/env";

if (process.env["LIFETHREAD_LIVE_INTEGRATION"] === "1") {
  const missing = missingLiveEnvironment(process.env).filter(
    (name) => name !== "OPENAI_API_KEY",
  );
  if (missing.length > 0) {
    console.error(`INTEGRATION_MISSING ${missing.join(",")}`);
    process.exitCode = 1;
  }
}

if (process.exitCode !== 1) {
  const result = spawnSync(
    process.execPath,
    ["node_modules/vitest/vitest.mjs", "run", "tests/integration", ...process.argv.slice(2)],
    { stdio: "inherit" },
  );
  process.exitCode = result.status ?? 1;
}
