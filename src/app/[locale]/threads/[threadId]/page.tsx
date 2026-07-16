import { notFound, redirect } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n/locales";
import { getThread } from "@/application/threads/get-thread";
import { getAuthenticatedRuntimeRepository } from "@/infrastructure/runtime";
import { Workspace } from "@/components/threads/workspace";
import { hasRuntimeEnvironment } from "@/config/env";
import { AuthRequiredError, requireUser } from "@/infrastructure/auth/require-user";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server-client";

export const dynamic = "force-dynamic";

type ThreadPageProps = Readonly<{
  params: Promise<{ locale: string; threadId: string }>;
  searchParams: Promise<{ action_error?: string | string[] }>;
}>;

function hasActionError(value: string | readonly string[] | undefined): boolean {
  return value === "1" || (Array.isArray(value) && value.includes("1"));
}

export default async function ThreadPage({ params, searchParams }: ThreadPageProps) {
  const { locale, threadId } = await params;
  const { action_error: actionErrorValue } = await searchParams;
  if (!isLocale(locale)) notFound();
  if (!hasRuntimeEnvironment(process.env)) {
    redirect("/" + locale + "/sign-in?redirect=" + encodeURIComponent("/" + locale + "/threads/" + threadId));
  }
  const dictionary = getDictionary(locale);
  const supabase = await createServerSupabaseClient();
  let ownerId: string;
  try {
    ownerId = await requireUser(supabase, {
      locale,
      redirect: "/" + locale + "/threads/" + threadId,
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) redirect(error.signInPath);
    throw error;
  }
  const aggregate = await getThread(
    getAuthenticatedRuntimeRepository(supabase),
    ownerId,
    threadId,
  );
  if (!aggregate) notFound();

  return (
    <Workspace
      aggregate={aggregate}
      locale={locale}
      dictionary={dictionary}
      actionError={hasActionError(actionErrorValue)}
    />
  );
}
