import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocked = vi.hoisted(() => ({
  approveAuthorization: vi.fn(),
  denyAuthorization: vi.fn(),
  requireUser: vi.fn(),
}));

vi.mock("@/infrastructure/auth/require-user", () => ({
  AuthRequiredError: class AuthRequiredError extends Error {},
  requireUser: mocked.requireUser,
}));

vi.mock("@/infrastructure/supabase/server-client", () => ({
  applyAuthHeaders: <T extends Response>(response: T): T => response,
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      oauth: {
        approveAuthorization: mocked.approveAuthorization,
        denyAuthorization: mocked.denyAuthorization,
      },
    },
  })),
}));

import { POST } from "@/app/api/oauth/decision/route";

function decisionRequest(decision: "approve" | "deny"): NextRequest {
  return new NextRequest("https://lifethread.example/api/oauth/decision", {
    method: "POST",
    body: new URLSearchParams({
      authorization_id: "authorization_fixture",
      decision,
      locale: "ko",
    }),
  });
}

describe("OAuth authorization decision route", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    mocked.requireUser.mockResolvedValue("11111111-1111-4111-8111-111111111111");
    mocked.approveAuthorization.mockReset();
    mocked.denyAuthorization.mockReset();
  });

  it("keeps the authorization request locale and redirects only to the SDK approval URL", async () => {
    // Given a verified user approving a Korean authorization request
    const redirectUrl = "https://client.example/callback?approved=1";
    mocked.approveAuthorization.mockResolvedValue({ data: { redirect_url: redirectUrl }, error: null });

    // When the approval form posts its authorization ID and locale
    const response = await POST(decisionRequest("approve"));

    // Then the route preserves the consent context and forwards only the SDK URL
    expect(mocked.requireUser).toHaveBeenCalledWith(expect.anything(), {
      locale: "ko",
      redirect: "/oauth/consent?authorization_id=authorization_fixture&locale=ko",
    });
    expect(mocked.approveAuthorization).toHaveBeenCalledWith("authorization_fixture");
    expect(response.headers.get("location")).toBe(redirectUrl);
  });

  it("redirects only to the SDK denial URL", async () => {
    // Given a verified user denying an authorization request
    const redirectUrl = "https://client.example/callback?denied=1";
    mocked.denyAuthorization.mockResolvedValue({ data: { redirect_url: redirectUrl }, error: null });

    // When the denial form posts its authorization ID and locale
    const response = await POST(decisionRequest("deny"));

    // Then the route delegates the destination exclusively to the SDK
    expect(mocked.denyAuthorization).toHaveBeenCalledWith("authorization_fixture");
    expect(response.headers.get("location")).toBe(redirectUrl);
  });
});
