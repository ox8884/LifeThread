import type { ThreadSummary } from "@/application/threads/thread-repository";
import { NewThreadForm } from "@/components/threads/new-thread-form";
import { ThreadCard } from "@/components/threads/thread-card";
import { WorkspaceHeader } from "@/components/threads/workspace-header";
import type { Dictionary, Locale } from "@/i18n/locales";

type ThreadDashboardProps = Readonly<{
  locale: Locale;
  dictionary: Dictionary;
  summaries: readonly ThreadSummary[];
  actionError: boolean;
  createAction: (formData: FormData) => Promise<void>;
}>;

function formatGoalCount(count: number, locale: Locale, label: string): string {
  return locale === "ko" ? `${count}${label}` : `${count} ${label}`;
}

export function ThreadDashboard({
  locale,
  dictionary,
  summaries,
  actionError,
  createAction,
}: ThreadDashboardProps) {
  return (
    <div className="workspace-shell" lang={locale}>
      <WorkspaceHeader locale={locale} dictionary={dictionary} />
      {actionError ? (
        <div className="action-error-banner" role="alert" aria-live="assertive">
          <p>{dictionary.actionError}</p>
          <a className="button secondary" href={"/" + locale}>
            {dictionary.tryAgain}
          </a>
        </div>
      ) : null}
      <main className="dashboard-main">
        <header className="dashboard-heading">
          <div>
            <p className="eyebrow">{dictionary.dashboardEyebrow}</p>
            <h1>{dictionary.dashboardTitle}</h1>
            <p className="lede">{dictionary.dashboardLede}</p>
          </div>
          <div
            className="dashboard-count"
            aria-label={formatGoalCount(summaries.length, locale, dictionary.dashboardCountLabel)}
          >
            <strong>{summaries.length}</strong>
            <span>{dictionary.dashboardCountLabel}</span>
          </div>
        </header>
        <section className="dashboard-layout" aria-labelledby="thread-list-title">
          <div className="thread-list-section">
            <div className="dashboard-section-heading">
              <div>
                <p className="section-kicker">{dictionary.dashboardListEyebrow}</p>
                <h2 id="thread-list-title">{dictionary.dashboardListTitle}</h2>
              </div>
              <span className="review-count">{summaries.length}</span>
            </div>
            {summaries.length > 0 ? (
              <div className="thread-card-grid">
                {summaries.map((summary) => (
                  <ThreadCard
                    key={summary.id}
                    locale={locale}
                    dictionary={dictionary}
                    summary={summary}
                  />
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">
                <h2>{dictionary.dashboardEmptyTitle}</h2>
                <p>{dictionary.dashboardEmptyBody}</p>
              </div>
            )}
          </div>
          <NewThreadForm
            locale={locale}
            dictionary={dictionary}
            action={createAction}
          />
        </section>
      </main>
    </div>
  );
}
