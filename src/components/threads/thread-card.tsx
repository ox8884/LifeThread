import Link from "next/link";
import type { ThreadSummary } from "@/application/threads/thread-repository";
import type { Dictionary, Locale } from "@/i18n/locales";

type ThreadCardProps = Readonly<{
  locale: Locale;
  dictionary: Dictionary;
  summary: ThreadSummary;
}>;

function formatUpdatedAt(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatReviewCount(count: number, locale: Locale, label: string): string {
  return locale === "ko" ? `${label} ${count}건` : `${count} ${label}`;
}

export function ThreadCard({ locale, dictionary, summary }: ThreadCardProps) {
  const supportingText = summary.goal_text === summary.title ? null : summary.goal_text;

  return (
    <Link
      className="thread-card"
      href={"/" + locale + "/threads/" + summary.id}
      aria-label={summary.title}
      data-testid="thread-card"
    >
      <div className="thread-card-topline">
        <span className="status-chip">{dictionary.activeThread}</span>
        <span className="thread-card-review-count">
          {formatReviewCount(summary.review_count, locale, dictionary.threadCardReviews)}
        </span>
      </div>
      <h2>{summary.title}</h2>
      {supportingText ? <p>{supportingText}</p> : null}
      {summary.progress ? (
        <div
          className="thread-card-progress"
          aria-label={`${dictionary.overallProgress}: ${summary.progress.completed} / ${summary.progress.total}`}
        >
          <div className="thread-card-progress-label">
            <span>{dictionary.overallProgress}</span>
            <strong>{summary.progress.completed} / {summary.progress.total} {dictionary.completeLower}</strong>
          </div>
          <div
            className="thread-card-progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={summary.progress.percent}
          >
            <span style={{ width: `${summary.progress.percent}%` }} />
          </div>
        </div>
      ) : null}
      <div className="thread-card-meta">
        <span>{dictionary.threadCardUpdated} {formatUpdatedAt(summary.updated_at, locale)}</span>
        <span>{dictionary.threadCardRevision} {summary.version}</span>
      </div>
      <span className="thread-card-action">{dictionary.openThread}</span>
    </Link>
  );
}
