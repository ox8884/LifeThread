import { describe, expect, it, vi } from "vitest";
import {
  AuthRequiredError,
  requireUser,
  safeRelativeRedirect,
} from "@/infrastructure/auth/require-user";
import { isReadOnlyCookieMutationError } from "@/infrastructure/supabase/server-client";

const verifiedUserId = "11111111-1111-4111-8111-111111111111";

describe("verified web authentication boundary", () => {
  it("preserves a locale-specific relative return path for an unauthenticated user", async () => {
    // Given a browser request without verified Supabase claims
    const getClaims = vi.fn().mockResolvedValue({
      data: { claims: null },
      error: null,
    });

    // When the protected Korean workspace requires a user
    const requiredUser = requireUser(
      { auth: { getClaims } },
      { locale: "ko", redirect: "/ko?thread=thread_fixture" },
    );

    // Then it returns a locale-aware sign-in path without trusting a session object
    await expect(requiredUser).rejects.toMatchObject({
      name: "AuthRequiredError",
      signInPath: "/ko/sign-in?redirect=%2Fko%3Fthread%3Dthread_fixture",
    });
  });

  it("preserves the consent locale and authorization ID through sign-in", async () => {
    // Given an unauthenticated Korean authorization request
    const getClaims = vi.fn().mockResolvedValue({
      data: { claims: null },
      error: null,
    });
    const consentPath = "/oauth/consent?authorization_id=authorization_fixture&locale=ko";

    // When the verified boundary redirects to sign-in
    const requiredUser = requireUser({ auth: { getClaims } }, { locale: "ko", redirect: consentPath });

    // Then the complete consent request remains the local return destination
    await expect(requiredUser).rejects.toMatchObject({
      signInPath: "/ko/sign-in?redirect=%2Foauth%2Fconsent%3Fauthorization_id%3Dauthorization_fixture%26locale%3Dko",
    });
  });

  it("returns only the verified UUID sub from getClaims", async () => {
    // Given a client with a verified JWT subject and an untrusted session accessor
    const getClaims = vi.fn().mockResolvedValue({
      data: { claims: { sub: verifiedUserId } },
      error: null,
    });
    const getSession = vi.fn().mockResolvedValue({
      data: { session: { user: { id: "attacker-controlled-session-user" } } },
    });
    const client = { auth: { getClaims, getSession } };

    // When the authenticated boundary resolves the current user
    const userId = await requireUser(client, { locale: "en" });

    // Then it uses the verified subject and never treats getSession().user as authorization
    expect(userId).toBe(verifiedUserId);
    expect(getSession).not.toHaveBeenCalled();
  });

  it("rejects expired or invalid claims rather than authorizing a fallback user", async () => {
    // Given Supabase rejects a stale access token
    const getClaims = vi.fn().mockResolvedValue({
      data: { claims: null },
      error: { message: "JWT expired" },
    });

    // When a protected route checks the user boundary
    const requiredUser = requireUser({ auth: { getClaims } }, { locale: "en", redirect: "/en" });

    // Then the route fails closed with a sign-in destination
    await expect(requiredUser).rejects.toBeInstanceOf(AuthRequiredError);
  });

  it("rejects open redirect candidates while preserving a valid relative path", () => {
    // Given valid and hostile redirect candidates from a query string
    const valid = "/en?from=consent";
    const hostile = "https://attacker.example/steal";

    // When the redirect boundary parses them
    const accepted = safeRelativeRedirect(valid, "/en");
    const rejected = safeRelativeRedirect(hostile, "/en");

    // Then only the same-origin relative candidate survives
    expect(accepted).toBe(valid);
    expect(rejected).toBe("/en");
  });

  it("rejects protocol-relative, backslash, and encoded-path redirect bypasses", () => {
    // Given redirect candidates that URL parsers can reinterpret as a new origin
    const hostileCandidates = [
      "//attacker.example/steal",
      "/\\\\attacker.example/steal",
      "/%5C%5Cattacker.example/steal",
      "/%2F%2Fattacker.example/steal",
      "javascript:alert(1)",
    ];

    // When the redirect boundary normalizes every candidate
    const normalized = hostileCandidates.map((candidate) => safeRelativeRedirect(candidate, "/en"));

    // Then no encoded or parser-specific bypass can escape the local origin
    expect(normalized).toEqual(["/en", "/en", "/en", "/en", "/en"]);
  });

  it("only treats the Next Server Component cookie-mutation error as recoverable", () => {
    // Given the known read-only context message and an unrelated infrastructure failure
    const readOnlyError = new Error("Cookies can only be modified in a Server Action or Route Handler.");
    const unrelatedError = new Error("Redis connection failed");

    // When the server cookie adapter classifies write failures
    const canDeferReadOnlyWrite = isReadOnlyCookieMutationError(readOnlyError);
    const canDeferUnrelatedFailure = isReadOnlyCookieMutationError(unrelatedError);

    // Then only the Server Component limitation is delegated to proxy refresh
    expect(canDeferReadOnlyWrite).toBe(true);
    expect(canDeferUnrelatedFailure).toBe(false);
  });
});
