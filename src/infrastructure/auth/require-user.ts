import { z } from "zod";
import type { Locale } from "@/i18n/locales";

const claimsSchema = z.object({ sub: z.string().uuid() }).passthrough();

type ClaimsClient = Readonly<{
  auth: Readonly<{
    getClaims: () => Promise<Readonly<{
      data: Readonly<{ claims: unknown }> | null;
      error: Readonly<{ message: string }> | null;
    }>>;
  }>;
}>;

type RequireUserOptions = Readonly<{
  locale: Locale;
  redirect?: string;
}>;

export class AuthRequiredError extends Error {
  readonly name = "AuthRequiredError";

  constructor(readonly signInPath: string) {
    super("A verified user is required");
  }
}

export function safeRelativeRedirect(candidate: string | undefined, fallback: string): string {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return fallback;
  }

  const parsed = new URL(candidate, "https://lifethread.invalid");
  if (parsed.origin !== "https://lifethread.invalid") return fallback;
  try {
    const decodedPathname = decodeURIComponent(parsed.pathname);
    if (decodedPathname.startsWith("//") || decodedPathname.includes("\\")) return fallback;
  } catch {
    return fallback;
  }
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function signInPath(locale: Locale, redirectPath: string): string {
  return `/${locale}/sign-in?redirect=${encodeURIComponent(redirectPath)}`;
}

export async function requireUser(
  client: ClaimsClient,
  { locale, redirect = `/${locale}` }: RequireUserOptions,
): Promise<string> {
  const { data, error } = await client.auth.getClaims();
  const claims = claimsSchema.safeParse(data?.claims);
  if (error || !claims.success) {
    throw new AuthRequiredError(signInPath(locale, safeRelativeRedirect(redirect, `/${locale}`)));
  }
  return claims.data.sub;
}
