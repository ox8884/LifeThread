import { describe, expect, it } from "vitest";
import { createMcpAuthChallenge, parseBearerToken } from "@/mcp/auth";
import { decisionInputSchema, getThreadInputSchema } from "@/mcp/tool-schemas";

describe("MCP authentication boundary", () => {
  it("extracts exactly one bearer token and rejects other schemes", () => {
    expect(parseBearerToken("Bearer token-value")).toBe("token-value");
    expect(parseBearerToken("Basic token-value")).toBeNull();
    expect(parseBearerToken("Bearer one Bearer two")).toBeNull();
    expect(parseBearerToken(null)).toBeNull();
  });

  it("creates an OAuth protected-resource challenge without exposing thread data", () => {
    const response = createMcpAuthChallenge("https://lifethread.example/mcp");

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain("resource_metadata=");
    expect(response.headers.get("www-authenticate")).toContain("https://lifethread.example/.well-known/oauth-protected-resource");
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("uses the snake_case field names that ChatGPT sends for LifeThread identifiers", () => {
    expect(Object.keys(getThreadInputSchema)).toEqual(["thread_id", "threadId"]);
    expect(Object.keys(decisionInputSchema)).toEqual([
      "thread_id",
      "threadId",
      "proposal_id",
      "proposalId",
      "expected_version",
      "expectedVersion",
    ]);
  });
});
