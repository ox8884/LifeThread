import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { hasRuntimeEnvironment } from "@/config/env";
import { AuthRequiredError, requireUser } from "@/infrastructure/auth/require-user";
import { applyAuthHeaders, createServerSupabaseClient } from "@/infrastructure/supabase/server-client";

const decisionSchema = z.object({ authorizationId: z.string().min(1).max(512), decision: z.enum(["approve", "deny"]), locale: z.enum(["en", "ko"]) }).strict();

function formText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!hasRuntimeEnvironment(process.env)) return NextResponse.json({ error: "Authentication unavailable" }, { status: 503 });
  const formData = await request.formData();
  const parsed = decisionSchema.safeParse({ authorizationId: formText(formData, "authorization_id"), decision: formText(formData, "decision"), locale: formText(formData, "locale") });
  if (!parsed.success) return NextResponse.json({ error: "Invalid authorization decision" }, { status: 400 });
  const headers = new Headers();
  const supabase = await createServerSupabaseClient(headers);
  const consentPath = `/oauth/consent?authorization_id=${encodeURIComponent(parsed.data.authorizationId)}&locale=${parsed.data.locale}`;
  try {
    await requireUser(supabase, { locale: parsed.data.locale, redirect: consentPath });
  } catch (error) {
    if (error instanceof AuthRequiredError) return applyAuthHeaders(NextResponse.redirect(new URL(error.signInPath, request.url), 303), headers);
    throw error;
  }
  const result = parsed.data.decision === "approve" ? await supabase.auth.oauth.approveAuthorization(parsed.data.authorizationId) : await supabase.auth.oauth.denyAuthorization(parsed.data.authorizationId);
  if (result.error || !result.data) return NextResponse.json({ error: "Authorization decision failed" }, { status: 400 });
  return applyAuthHeaders(NextResponse.redirect(result.data.redirect_url, 303), headers);
}
