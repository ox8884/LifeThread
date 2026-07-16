import type { LivingStateProjection } from "@/application/state/project-living-state";
import type { LifeThreadAggregate } from "@/domain/entities";
import type { Dictionary } from "@/i18n/locales";

type ThreadOverviewProps = Readonly<{
  aggregate: LifeThreadAggregate;
  projection: LivingStateProjection;
  dictionary: Dictionary;
}>;

export function ThreadOverview({ aggregate, projection, dictionary }: ThreadOverviewProps) {
  const supportingText = aggregate.thread.desired_outcome;

  return (
    <section className="thread-overview" aria-labelledby="thread-title">
      <div className="overview-copy">
        <div className="overview-meta">
          <span className="status-chip">{dictionary.activeThread}</span>
          <span>{dictionary.lastUpdated}</span>
        </div>
        <h1 id="thread-title">{aggregate.thread.title}</h1>
        {supportingText && supportingText !== aggregate.thread.title ? <p>{supportingText}</p> : null}
      </div>
      <div className="progress-summary">
        <strong data-testid="thread-progress">
          {projection.progress.completed} / {projection.progress.total} {dictionary.completeLower}
        </strong>
        <span>{dictionary.overallProgress}</span>
        <div
          className="progress-track"
          role="progressbar"
          aria-label={dictionary.overallProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={projection.progress.percent}
        >
          <span style={{ width: `${projection.progress.percent}%` }} />
        </div>
      </div>
    </section>
  );
}
