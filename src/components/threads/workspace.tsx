import Link from "next/link";
import type { LifeThreadAggregate } from "@/domain/entities";
import { canonicalStatuses } from "@/domain/status";
import type { Dictionary, Locale } from "@/i18n/locales";
import { otherLocale } from "@/i18n/locales";
import { projectLivingState } from "@/application/state/project-living-state";
import {
  confirmFactAction,
  draftAction,
  evidenceAction,
  resetDemoAction,
  startFreshAction,
} from "@/app/[locale]/actions";
import { TaskList } from "@/components/tasks/task-list";

type WorkspaceProps = Readonly<{
  aggregate: LifeThreadAggregate;
  locale: Locale;
  dictionary: Dictionary;
}>;

function GlobalRail({ locale, dictionary }: Readonly<{ locale: Locale; dictionary: Dictionary }>) {
  return (
    <aside className="workspace-rail" aria-label="LifeThread">
      <Link className="brand" href={`/${locale}`}>
        <span className="brand-mark" aria-hidden="true">LT</span>
        LifeThread
      </Link>
      <div className="rail-labels">
        <span className="adapter-label">{dictionary.demoLabel}</span>
        <span>{dictionary.privacyLabel}</span>
        <span>{dictionary.sendingLabel}</span>
      </div>
      <Link className="locale-link" href={`/${otherLocale(locale)}`}>
        {dictionary.switchLocale}
      </Link>
      <div className="rail-actions">
        <form action={startFreshAction}><button className="button quiet" type="submit">{dictionary.startFresh}</button></form>
        <form action={resetDemoAction}><button className="button quiet" type="submit">{dictionary.resetDemo}</button></form>
      </div>
    </aside>
  );
}

export function Workspace({ aggregate, locale, dictionary }: WorkspaceProps) {
  const projection = projectLivingState(aggregate);
  const currentRevision = aggregate.revisions.at(-1);
  return (
    <div className="workspace-shell" lang={locale}>
      <GlobalRail locale={locale} dictionary={dictionary} />
      <main className="workspace-main">
        <header className="thread-header">
          <div className="thread-meta">
            <span>{dictionary.currentThread}</span>
            <code data-testid="thread-id">{aggregate.thread.id}</code>
          </div>
          <h1>{aggregate.thread.title}</h1>
          <p className="thread-goal">{aggregate.thread.goal_text}</p>
          <div className="badge-row">
            <span className="badge">demo_user</span>
            <span className="badge">{dictionary.revision} <strong data-testid="thread-version">{aggregate.thread.version}</strong></span>
            <span className="badge origin">{dictionary.demoLabel}</span>
            <span className="badge">{dictionary.privacyLabel}</span>
          </div>
        </header>

        <section className="panel state-panel" aria-labelledby="state-title">
          <div className="section-heading">
            <div><p className="section-kicker">{dictionary.revision} {aggregate.thread.version}</p><h2 id="state-title">{dictionary.livingState}</h2></div>
            <code>{currentRevision?.id}</code>
          </div>
          <p className="state-summary">{aggregate.living_state.summary}</p>
          <div className="state-counts">
            {canonicalStatuses.filter((status) => projection.counts[status] > 0).map((status) => (
              <span key={status}><strong>{projection.counts[status]}</strong> {dictionary.status[status]}</span>
            ))}
          </div>
        </section>

        <TaskList tasks={aggregate.tasks} version={aggregate.thread.version} dictionary={dictionary} />

        <section className="two-column-sections">
          <div className="panel section-panel">
            <div className="section-heading"><h2>{dictionary.evidence}</h2><span className="count-badge">{aggregate.evidence.length}</span></div>
            <form className="stack-form" action={evidenceAction}>
              <input type="hidden" name="version" value={aggregate.thread.version} />
              <input type="hidden" name="locale" value={locale} />
              <label htmlFor="evidence-note">{dictionary.evidenceNote}</label>
              <textarea id="evidence-note" name="note" placeholder={dictionary.evidencePlaceholder} required maxLength={50000} />
              <button className="button secondary" type="submit">{dictionary.addPrivateNote}</button>
            </form>
            <div className="evidence-list">
              {aggregate.evidence.map((item) => {
                const reference = aggregate.source_references.find((candidate) => candidate.evidence_id === item.id);
                return (
                  <article className="evidence-row" key={item.id}>
                    <div><span className="badge">{item.kind}</span><span className="badge">{dictionary.source} {item.source_language}</span></div>
                    <p>{item.note}</p>
                    <code>{dictionary.checksum} {item.checksum.slice(0, 12)} · {dictionary.locator} {reference?.locator}</code>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="panel section-panel">
            <div className="section-heading"><h2>{dictionary.facts}</h2><span className="count-badge">{aggregate.facts.length}</span></div>
            {aggregate.facts.map((fact) => (
              <article className="fact-row" key={fact.id}>
                <p>{fact.content}</p>
                <div className="badge-row"><span className="badge origin">{dictionary.origin[fact.source_type]}</span>{fact.user_confirmed ? <span className="badge confirmed">{dictionary.confirmed}</span> : null}</div>
                {!fact.user_confirmed ? (
                  <form action={confirmFactAction}>
                    <input type="hidden" name="version" value={aggregate.thread.version} />
                    <input type="hidden" name="factId" value={fact.id} />
                    <button className="button secondary" type="submit">{dictionary.confirmFact}</button>
                  </form>
                ) : null}
              </article>
            ))}
            {aggregate.conflicts.map((conflict) => (
              <article className="conflict-row" key={conflict.id}>
                <strong>{dictionary.unresolvedConflict}</strong>
                <p>{conflict.existing_value}</p>
                <p>{conflict.candidate_value}</p>
                <code>{conflict.source_reference_ids.join(", ")}</code>
              </article>
            ))}
          </div>
        </section>

        <section className="panel section-panel">
          <div className="section-heading"><h2>{dictionary.communication}</h2><span className="badge warning">{dictionary.draftNotSent}</span></div>
          <form action={draftAction}>
            <input type="hidden" name="version" value={aggregate.thread.version} />
            <input type="hidden" name="locale" value={locale} />
            <button className="button secondary" type="submit">{dictionary.generateDraft}</button>
          </form>
          {aggregate.communications.map((draft) => (
            <article className="draft-row" key={draft.id}>
              <div className="badge-row"><span className="badge warning">{dictionary.draftNotSent}</span><span className="badge">{draft.locale}</span></div>
              <p>{draft.content}</p><code>{draft.revision_id} · {draft.source_reference_ids.join(", ")}</code>
            </article>
          ))}
        </section>

        <section className="panel section-panel history-panel">
          <div className="section-heading"><h2>{dictionary.history}</h2><span className="count-badge">{aggregate.revisions.length}</span></div>
          <ol>{[...aggregate.revisions].reverse().map((revision) => <li key={revision.id}><code>{revision.id}</code><span>{revision.change_summary}</span></li>)}</ol>
        </section>
      </main>

      <aside className="context-rail">
        <section className="next-action-panel">
          <p className="section-kicker">{dictionary.nextAction}</p>
          <h2>{projection.next_action?.content}</h2>
          <p>{aggregate.recommendations[0]?.content}</p>
          <div className="confidence-meter"><span style={{ width: `${(projection.next_action?.confidence ?? 0) * 100}%` }} /></div>
          <code>{projection.next_action?.source_reference_ids.join(", ")}</code>
        </section>
        <section className="context-section"><h3>{dictionary.openLoops}</h3>{aggregate.open_loops.map((item) => <p key={item.id}>{item.content}</p>)}</section>
        <section className="context-section"><h3>{dictionary.risks}</h3>{aggregate.risks.map((item) => <p key={item.id}>{item.content}</p>)}</section>
        <section className="context-section limitations"><h3>{dictionary.limitations}</h3><p>{dictionary.limitationsText}</p></section>
      </aside>
    </div>
  );
}
