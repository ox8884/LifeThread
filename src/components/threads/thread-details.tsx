import { draftAction } from "@/app/[locale]/actions";
import type { LifeThreadAggregate } from "@/domain/entities";
import type { Dictionary, Locale } from "@/i18n/locales";

type ThreadDetailsProps = Readonly<{
  aggregate: LifeThreadAggregate;
  locale: Locale;
  dictionary: Dictionary;
}>;

export function ThreadDetails({ aggregate, locale, dictionary }: ThreadDetailsProps) {
  return (
    <section className="thread-details" aria-label={dictionary.livingState}>
      <details className="thread-detail-section">
        <summary>
          <span>{dictionary.evidence}</span>
          <span className="count-badge">{aggregate.evidence.length}</span>
        </summary>
        <div className="detail-content evidence-list">
          {aggregate.evidence.map((item) => (
            <article className="evidence-row" key={item.id}>
              <div className="badge-row">
                <span className="badge">{item.kind}</span>
                <span className="badge">{dictionary.source} {item.source_language}</span>
              </div>
              <p>{item.note}</p>
            </article>
          ))}
        </div>
      </details>

      <details className="thread-detail-section">
        <summary>
          <span>{dictionary.facts}</span>
          <span className="count-badge">{aggregate.facts.length}</span>
        </summary>
        <div className="detail-content">
          {aggregate.facts.map((fact) => (
            <article className="fact-row" key={fact.id}>
              <p>{fact.content}</p>
              <div className="badge-row">
                <span className="badge origin">{dictionary.origin[fact.source_type]}</span>
                {fact.user_confirmed ? (
                  <span className="badge confirmed">{dictionary.confirmed}</span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </details>

      <details className="thread-detail-section">
        <summary>
          <span>{dictionary.conflicts}</span>
          <span className="count-badge">{aggregate.conflicts.length}</span>
        </summary>
        <div className="detail-content">
          {aggregate.conflicts.map((conflict) => (
            <article className="conflict-row" key={conflict.id}>
              <strong>{dictionary.unresolvedConflict}</strong>
              <p>{conflict.existing_value}</p>
              <p>{conflict.candidate_value}</p>
            </article>
          ))}
        </div>
      </details>

      <details className="thread-detail-section">
        <summary>
          <span>{dictionary.communication}</span>
          <span className="badge warning">{dictionary.draftNotSent}</span>
        </summary>
        <div className="detail-content">
          <form action={draftAction}>
            <input type="hidden" name="version" value={aggregate.thread.version} />
            <input type="hidden" name="locale" value={locale} />
            <button className="button secondary" type="submit">{dictionary.generateDraft}</button>
          </form>
          {aggregate.communications.map((draft) => (
            <article className="draft-row" key={draft.id}>
              <div className="badge-row">
                <span className="badge warning">{dictionary.draftNotSent}</span>
                <span className="badge">{draft.locale}</span>
              </div>
              <p>{draft.content}</p>
            </article>
          ))}
        </div>
      </details>

      <details className="thread-detail-section">
        <summary>
          <span>{dictionary.history}</span>
          <span className="count-badge">{aggregate.revisions.length}</span>
        </summary>
        <ol className="detail-content history-list">
          {[...aggregate.revisions].reverse().map((revision) => (
            <li key={revision.id}>{revision.change_summary}</li>
          ))}
        </ol>
      </details>

      <details className="thread-detail-section">
        <summary>{dictionary.openLoops}</summary>
        <div className="detail-content supporting-grid">
          <div>
            <h3>{dictionary.openLoops}</h3>
            {aggregate.open_loops.map((item) => <p key={item.id}>{item.content}</p>)}
          </div>
          <div>
            <h3>{dictionary.risks}</h3>
            {aggregate.risks.map((item) => <p key={item.id}>{item.content}</p>)}
          </div>
          <div>
            <h3>{dictionary.limitations}</h3>
            <p>{dictionary.limitationsText}</p>
          </div>
        </div>
      </details>

      <details className="thread-detail-section technical-details">
        <summary>{dictionary.technicalDetails}</summary>
        <div className="detail-content technical-content">
          <code data-testid="thread-id">{aggregate.thread.id}</code>
          <code data-testid="thread-version">{aggregate.thread.version}</code>
          {aggregate.evidence.map((item) => {
            const reference = aggregate.source_references.find(
              (candidate) => candidate.evidence_id === item.id,
            );
            return (
              <code key={item.id}>
                {dictionary.checksum} {item.checksum.slice(0, 12)} · {dictionary.locator} {reference?.locator}
              </code>
            );
          })}
        </div>
      </details>
    </section>
  );
}
