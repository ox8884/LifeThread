import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { shouldEnableReactDevTools } from "@/config/dev-tools";

describe("development tools", () => {
  it("requires explicit opt-in in development", () => {
    expect(shouldEnableReactDevTools("development", "1")).toBe(true);
    expect(shouldEnableReactDevTools("development", undefined)).toBe(false);
    expect(shouldEnableReactDevTools("development", "0")).toBe(false);
    expect(shouldEnableReactDevTools("production", "1")).toBe(false);
    expect(shouldEnableReactDevTools("test", "1")).toBe(false);
  });

  it("uses local packages without automatic telemetry", () => {
    const layoutSource = readFileSync(resolve("src/app/layout.tsx"), "utf8");
    const toolsSource = readFileSync(
      resolve("src/components/dev/react-dev-tools.tsx"),
      "utf8",
    );
    const source = `${layoutSource}\n${toolsSource}`;

    expect(source).not.toMatch(/unpkg|https?:\/\/.*react-(?:scan|grab)/);
    expect(toolsSource).toContain("telemetry: false");
  });
});
