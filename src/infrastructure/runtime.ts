import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { LocalJsonThreadRepository } from "@/infrastructure/local/json-thread-repository";

export function resolveRuntimeStatePath(
  vercelEnvironment: string | undefined,
  workingDirectory: string,
  temporaryDirectory: string,
): string {
  const root = vercelEnvironment === "1" ? temporaryDirectory : workingDirectory;
  return resolve(root, ".lifethread/thread-state.json");
}

export const runtimeStatePath = resolveRuntimeStatePath(
  process.env["VERCEL"],
  process.cwd(),
  tmpdir(),
);

export function getRuntimeRepository(): LocalJsonThreadRepository {
  return new LocalJsonThreadRepository(runtimeStatePath);
}
