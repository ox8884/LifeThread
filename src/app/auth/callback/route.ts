import { NextResponse, type NextRequest } from "next/server";
import { safeRelativeRedirect, signInPath } from "@/infrastructure/auth/require-user";
import { applyAuthHeaders, createServerSupabaseClient } from "@/infrastructure/supabase/server-client";
import { isLocale, type Locale } from "@/i18n/locales";

function localeForPath(path: string): Locale {
  const locale = path.split("/")[1];
  return locale && isLocale(locale) ? locale : "en";
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = safeRelativeRedirect(request.nextUrl.searchParams.get("next") ?? undefined, "/en");
  const headers = new Headers();
  if (!code) {
    return applyAuthHeaders(NextResponse.redirect(new URL(signInPath(localeForPath(nextPath), nextPath), request.url), 303), headers);
  }
  const supabase = await createServerSupabaseClient(headers);
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  const destination = error ? signInPath(localeForPath(nextPath), nextPath) : nextPath;
  return applyAuthHeaders(NextResponse.redirect(new URL(destination, request.url), 303), headers);
}
