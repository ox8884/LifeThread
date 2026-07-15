import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

function valueAfter(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

const args = process.argv.slice(2);
const separator = args.indexOf("--");
const task = valueAfter(args, "--task");
const label = valueAfter(args, "--label");
const expectedText = valueAfter(args, "--expect-exit") ?? "0";
const expectedExit = Number.parseInt(expectedText, 10);
const command = separator >= 0 ? args[separator + 1] : undefined;
const commandArgs = separator >= 0 ? args.slice(separator + 2) : [];

if (!task || !label || !command || Number.isNaN(expectedExit)) {
  console.error(
    "QA_CAPTURE_USAGE --task <task> --label <label> [--expect-exit <n>] -- <command> [args]",
  );
  process.exitCode = 2;
} else {
  const result = spawnSync(command, commandArgs, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
  });
  const exitCode = result.status ?? 1;
  const output = `${result.stdout}${result.stderr}`;
  const directory = resolve(process.cwd(), ".omo/evidence", task);
  await mkdir(directory, { recursive: true });
  await writeFile(
    resolve(directory, `${label}.log`),
    `$ ${[command, ...commandArgs].join(" ")}\nexit=${exitCode}\n${output}`,
    "utf8",
  );
  process.stdout.write(output);
  if (exitCode !== expectedExit) {
    console.error(`QA_CAPTURE_EXIT_MISMATCH expected=${expectedExit} actual=${exitCode}`);
    process.exitCode = 1;
  } else {
    console.log(`QA_CAPTURE_OK task=${task} label=${label} exit=${exitCode}`);
  }
}
