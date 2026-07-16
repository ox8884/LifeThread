import { projectLivingState } from "@/application/state/project-living-state";
import { TaskList } from "@/components/tasks/task-list";
import { CandidateReview } from "@/components/threads/candidate-review";
import { NextActionCard } from "@/components/threads/next-action-card";
import { ThreadDetails } from "@/components/threads/thread-details";
import { ThreadOverview } from "@/components/threads/thread-overview";
import { WorkspaceHeader } from "@/components/threads/workspace-header";
import type { LifeThreadAggregate } from "@/domain/entities";
import type { Dictionary, Locale } from "@/i18n/locales";

type WorkspaceProps = Readonly<{
  aggregate: LifeThreadAggregate;
  locale: Locale;
  dictionary: Dictionary;
  actionError: boolean;
}>;

export function Workspace({ aggregate, locale, dictionary, actionError }: WorkspaceProps) {
  const projection = projectLivingState(aggregate);
  const currentTaskId = projection.next_action?.task_id ?? null;

  return (
    <div className="workspace-shell" lang={locale}>
      <WorkspaceHeader locale={locale} dictionary={dictionary} />
      {actionError ? (
        <div className="action-error-banner" role="alert" aria-live="assertive">
          <p>{dictionary.actionError}</p>
          <a className="button secondary" href={`/${locale}`}>{dictionary.tryAgain}</a>
        </div>
      ) : null}
      <p
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        data-testid="workspace-update-status"
      >
        {dictionary.workspaceUpdated} {aggregate.thread.version}
      </p>
      <main className="workspace-main">
        <ThreadOverview aggregate={aggregate} projection={projection} dictionary={dictionary} />
        <section className="action-grid">
          <NextActionCard
            nextAction={projection.next_action}
            threadId={aggregate.thread.id}
            version={aggregate.thread.version}
            locale={locale}
            dictionary={dictionary}
          />
          <CandidateReview
            aggregate={aggregate}
            currentTaskId={currentTaskId}
            reviewCount={projection.review_count}
            locale={locale}
            dictionary={dictionary}
          />
        </section>
        <TaskList
          threadId={aggregate.thread.id}
          tasks={aggregate.tasks}
          version={aggregate.thread.version}
          currentTaskId={currentTaskId}
          locale={locale}
          dictionary={dictionary}
        />
        <ThreadDetails aggregate={aggregate} locale={locale} dictionary={dictionary} />
      </main>
    </div>
  );
}
