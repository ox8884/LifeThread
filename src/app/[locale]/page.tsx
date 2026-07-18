import { notFound, redirect } from "next/navigation";
import { getDictionary, isLocale } from "@/i18n/locales";
import { createThreadAction } from "@/app/[locale]/actions";
import { listThreads } from "@/application/threads/list-threads";
import { getAuthenticatedRuntimeRepository } from "@/infrastructure/runtime";
import { ThreadDashboard } from "@/components/threads/thread-dashboard";
import { hasRuntimeEnvironment } from "@/config/env";
import { AuthRequiredError, requireUser } from "@/infrastructure/auth/require-user";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server-client";

export const dynamic = "force-dynamic";

type LocalePageProps = Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ action_error?: string | string[] }>;
}>;

function hasActionError(value: string | readonly string[] | undefined): boolean {
  return value === "1" || (Array.isArray(value) && value.includes("1"));
}

export default async function LocalePage({ params, searchParams }: LocalePageProps) {
  const { locale } = await params;
  const { action_error: actionErrorValue } = await searchParams;
  if (!isLocale(locale)) notFound();
  if (!hasRuntimeEnvironment(process.env)) {
    redirect("/" + locale + "/sign-in?redirect=" + encodeURIComponent("/" + locale));
  }
  const dictionary = getDictionary(locale);
  const supabase = await createServerSupabaseClient();
  let ownerId: string;
  try {
    ownerId = await requireUser(supabase, { locale, redirect: "/" + locale });
  } catch (error) {
    if (error instanceof AuthRequiredError) redirect(error.signInPath);
    throw error;
  }
  const summaries = await listThreads(
    getAuthenticatedRuntimeRepository(supabase),
    ownerId,
  );

  return (
    <ThreadDashboard
      locale={locale}
      dictionary={dictionary}
      summaries={summaries}
      ownerId={ownerId}
      actionError={hasActionError(actionErrorValue)}
      createAction={createThreadAction}
    />
  );
}
