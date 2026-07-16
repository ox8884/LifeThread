import { describe, expect, it } from "vitest";
import { resolveRuntimeStatePath } from "@/infrastructure/runtime";

describe("runtime state path", () => {
  it("uses a writable temporary root on Vercel", () => {
    const path = resolveRuntimeStatePath("1", "C:\\repo", "C:\\temp");

    expect(path).toBe("C:\\temp\\.lifethread\\thread-state.json");
  });

  it("keeps the repository-local root outside Vercel", () => {
    const path = resolveRuntimeStatePath(undefined, "C:\\repo", "C:\\temp");

    expect(path).toBe("C:\\repo\\.lifethread\\thread-state.json");
  });
});
