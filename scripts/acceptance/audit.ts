import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "README.md",
  "DESIGN.md",
  "docs/requirements-digest.md",
  "docs/acceptance-criteria.md",
  "docs/architecture.md",
  "docs/data-model.md",
  "docs/ai-pipeline.md",
  "src/domain/candidate-delta.ts",
  "src/domain/lifethread-aggregate.ts",
  "src/application/analysis/reconcile-candidate.ts",
  "src/application/threads/create-thread.ts",
  "src/application/tasks/task-commands.ts",
  "src/application/evidence/ingest-evidence.ts",
  "src/application/state/project-living-state.ts",
  "src/application/communication/generate-draft.ts",
  "e2e/vertical-slice.spec.ts",
];

const failures: string[] = [];
for (const relativePath of requiredFiles) {
  if (!existsSync(join(root, relativePath))) failures.push(`missing:${relativePath}`);
}

const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  scripts?: Record<string, string>;
};
for (const scriptName of [
  "lint",
  "typecheck",
  "test",
  "build",
  "test:e2e",
  "demo:preflight",
  "demo:reset",
  "mcp:smoke",
]) {
  if (!packageJson.scripts?.[scriptName]) failures.push(`missing-script:${scriptName}`);
}

const sourceText = [
  "README.md",
  "src/application/analysis/reconcile-candidate.ts",
  "src/application/threads/create-thread.ts",
  "src/application/tasks/task-commands.ts",
  "src/application/evidence/ingest-evidence.ts",
  "src/application/state/project-living-state.ts",
]
  .filter((entry) => existsSync(join(root, entry)))
  .map((entry) => readFileSync(join(root, entry), "utf8"))
  .join("\n");
if (/sharePublic|publicShare|enablePublicLink/i.test(sourceText)) {
  failures.push("forbidden-public-sharing-implementation");
}
if (failures.length > 0) {
  console.error("ACCEPTANCE_AUDIT_FAILED");
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log(`ACCEPTANCE_AUDIT_OK checked_files=${requiredFiles.length} checked_scripts=8`);
