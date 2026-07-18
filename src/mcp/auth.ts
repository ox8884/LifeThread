import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { NextResponse } from "next/server";
import { createTokenSupabaseClient } from "@/infrastructure/supabase/token-client";

const bearerPattern = /^Bearer ([^\s]+)$/;

export function parseBearerToken(value: string | null): string | null {
  const match = value?.match(bearerPattern);
  return match?.[1] ?? null;
}

export function createMcpAuthChallenge(resourceUrl: string): NextResponse {
  const metadataUrl = new URL(
    "/.well-known/oauth-protected-resource",
    resourceUrl,
  ).toString();
  return NextResponse.json(
    { error: "unauthorized", error_description: "A valid bearer token is required." },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata="${metadataUrl}"`,
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function verifyMcpToken(
  request: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  const token = bearerToken ?? parseBearerToken(request.headers.get("authorization"));
  if (!token) return undefined;
  const client = createTokenSupabaseClient(token);
  const { data, error } = await client.auth.getUser();
  const ownerId = data.user?.id;
  if (error || !ownerId) return undefined;
  return {
    token,
    clientId: "lifethread-chatgpt",
    scopes: ["lifethreads:read", "lifethreads:write"],
    extra: { ownerId },
  };
}

export function ownerIdFromAuthInfo(authInfo: AuthInfo | undefined): string | null {
  const ownerId = authInfo?.extra?.["ownerId"];
  return typeof ownerId === "string" ? ownerId : null;
}
