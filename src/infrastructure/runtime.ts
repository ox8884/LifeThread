import { resolve } from "node:path";
import { LocalJsonThreadRepository } from "@/infrastructure/local/json-thread-repository";

export const runtimeStatePath = resolve(
  process.cwd(),
  ".lifethread/thread-state.json",
);

export function getRuntimeRepository(): LocalJsonThreadRepository {
  return new LocalJsonThreadRepository(runtimeStatePath);
}
