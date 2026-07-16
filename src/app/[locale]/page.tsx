import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDictionary, isLocale, otherLocale } from "@/i18n/locales";
import { createThreadAction } from "@/app/[locale]/actions";
import { getThread } from "@/application/threads/get-thread";
import { listThreads } from "@/application/threads/list-threads";
import { getAuthenticatedRuntimeRepository } from "@/infrastructure/runtime";
import { Workspace } from "@/components/threads/workspace";
import { hasRuntimeEnvironment } from "@/config/env";
import { AuthRequiredError, requireUser } from "@/infrastructure/auth/require-user";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server-client";

export const dynamic = "force-dynamic";

type LocalePageProps = Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ action_error?: string | string[] }>;
}>;

export default async function LocalePage({ params, searchParams }: LocalePageProps) {
  const { locale } = await params;
  const { action_error: actionErrorValue } = await searchParams;
  if (!isLocale(locale)) notFound();
  const actionError = actionErrorValue === "1"
    || (Array.isArray(actionErrorValue) && actionErrorValue.includes("1"));
  const dictionary = getDictionary(locale);
  const alternateLocale = otherLocale(locale);
  if (!hasRuntimeEnvironment(process.env)) redirect(`/${locale}/sign-in?redirect=${encodeURIComponent(`/${locale}`)}`);
  const supabase = await createServerSupabaseClient();
  let ownerId: string;
  try {
    ownerId = await requireUser(supabase, { locale, redirect: `/${locale}` });
  } catch (error) {
    if (error instanceof AuthRequiredError) redirect(error.signInPath);
    throw error;
  }
  const repository = getAuthenticatedRuntimeRepository(supabase);
  const summaries = await listThreads(repository, ownerId);
  const summary = summaries[0];
  const aggregate = summary
    ? await getThread(repository, ownerId, summary.id)
    : null;

  if (aggregate) {
    return (
      <Workspace
        aggregate={aggregate}
        locale={locale}
        dictionary={dictionary}
        actionError={actionError}
      />
    );
  }

  return (
    <div className="create-shell" lang={locale}>
      <header className="create-header">
        <Link className="brand" href={`/${locale}`}>
          <span className="brand-mark" aria-hidden="true">LT</span>
          LifeThread
        </Link>
        <Link className="locale-link" href={`/${alternateLocale}`}>
          {dictionary.switchLocale}
        </Link>
      </header>
      {actionError ? (
        <div className="action-error-banner" role="alert" aria-live="assertive">
          <p>{dictionary.actionError}</p>
          <Link className="button secondary" href={`/${locale}`}>{dictionary.tryAgain}</Link>
        </div>
      ) : null}
      <main className="create-main">
        <section className="create-intro" aria-labelledby="create-title">
          <p className="eyebrow">{dictionary.noTemplateRequired}</p>
          <h1 id="create-title">{dictionary.whatDoYouWantDone}</h1>
          <p className="lede">{dictionary.goalIntro}</p>
          <form className="goal-form" action={createThreadAction}>
            <input type="hidden" name="locale" value={locale} />
            <label htmlFor="goal">{dictionary.yourGoal}</label>
            <textarea
              id="goal"
              name="goal"
              required
              maxLength={2000}
              placeholder={dictionary.goalPlaceholder}
            />
            <button className="button primary" type="submit">{dictionary.startPlanning}</button>
          </form>
          <details className="create-details">
            <summary>{dictionary.demoStatus}</summary>
            <div>
              <p>{dictionary.demoLabel}</p>
              <p>{dictionary.privacyLabel}</p>
              <p>{dictionary.sendingLabel}</p>
            </div>
          </details>
        </section>
      </main>
    </div>
  );
}
