import { confirmFactAction, taskAction } from "@/app/[locale]/actions";
import type { LifeThreadAggregate } from "@/domain/entities";
import type { Dictionary, Locale } from "@/i18n/locales";

type CandidateReviewProps = Readonly<{
  aggregate: LifeThreadAggregate;
  currentTaskId: string | null;
  reviewCount: number;
  locale: Locale;
  dictionary: Dictionary;
}>;

export function CandidateReview({
  aggregate,
  currentTaskId,
  reviewCount,
  locale,
  dictionary,
}: CandidateReviewProps) {
  const proposedTasks = aggregate.tasks.filter(
    (task) => !task.deleted_at && task.status === "proposed" && task.id !== currentTaskId,
  );
  const unconfirmedFacts = aggregate.facts.filter((fact) => !fact.user_confirmed);
  const unresolvedConflicts = aggregate.conflicts.filter((conflict) => conflict.status === "unresolved");

  return (
    <section className="candidate-review" aria-labelledby="review-title">
      <div className="review-heading">
        <p className="section-kicker">{dictionary.reviewChanges}</p>
        <span className="review-count" data-testid="review-count">{reviewCount}</span>
      </div>
      <h2 id="review-title">{dictionary.changesToReview}</h2>
      <p>{dictionary.changesToReviewBody}</p>
      <details className="review-disclosure">
        <summary aria-label={dictionary.reviewChanges}>{dictionary.reviewChanges}</summary>
        <div className="review-items">
          {proposedTasks.map((task) => (
            <article className="review-item" key={task.id}>
              <span className="badge origin">{dictionary.origin[task.source_type]}</span>
              <p>{task.content}</p>
              <div className="review-actions">
                <form action={taskAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="threadId" value={aggregate.thread.id} />
                  <input type="hidden" name="kind" value="transition" />
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="status" value="pending" />
                  <input type="hidden" name="version" value={aggregate.thread.version} />
                  <button className="button secondary" type="submit">{dictionary.accept}</button>
                </form>
                <form action={taskAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="threadId" value={aggregate.thread.id} />
                  <input type="hidden" name="kind" value="transition" />
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <input type="hidden" name="version" value={aggregate.thread.version} />
                  <button className="button quiet danger" type="submit">{dictionary.reject}</button>
                </form>
              </div>
            </article>
          ))}
          {unconfirmedFacts.map((fact) => (
            <article className="review-item" key={fact.id}>
              <span className="badge origin">{dictionary.origin[fact.source_type]}</span>
              <p>{fact.content}</p>
              <form action={confirmFactAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="threadId" value={aggregate.thread.id} />
                <input type="hidden" name="version" value={aggregate.thread.version} />
                <input type="hidden" name="factId" value={fact.id} />
                <button className="button secondary" type="submit">{dictionary.confirmFact}</button>
              </form>
            </article>
          ))}
          {unresolvedConflicts.map((conflict) => (
            <article className="review-item conflict-row" key={conflict.id}>
              <strong>{dictionary.unresolvedConflict}</strong>
              <p>{conflict.existing_value}</p>
              <p>{conflict.candidate_value}</p>
            </article>
          ))}
        </div>
      </details>
    </section>
  );
}
