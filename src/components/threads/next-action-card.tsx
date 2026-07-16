import { evidenceAction, taskAction } from "@/app/[locale]/actions";
import type { LivingStateProjection } from "@/application/state/project-living-state";
import type { Dictionary, Locale } from "@/i18n/locales";

type NextActionCardProps = Readonly<{
  nextAction: LivingStateProjection["next_action"];
  version: number;
  locale: Locale;
  dictionary: Dictionary;
}>;

export function NextActionCard({
  nextAction,
  version,
  locale,
  dictionary,
}: NextActionCardProps) {
  if (!nextAction) {
    return (
      <section className="next-action-card next-action-empty" data-testid="next-action">
        <p className="section-kicker">{dictionary.now}</p>
        <h2>{dictionary.noNextAction}</h2>
        <p>{dictionary.noNextActionBody}</p>
      </section>
    );
  }

  return (
    <section className="next-action-card" data-testid="next-action" aria-labelledby="next-action-title">
      <p className="section-kicker">{dictionary.now}</p>
      <h2 id="next-action-title">{nextAction.content}</h2>
      <p className="next-action-reason">{dictionary.nextActionReason}</p>
      <div className="next-action-controls">
        <form action={taskAction}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="kind" value="transition" />
          <input type="hidden" name="taskId" value={nextAction.task_id} />
          <input type="hidden" name="status" value="completed" />
          <input type="hidden" name="version" value={version} />
          <button className="button primary" type="submit">{dictionary.done}</button>
        </form>
        <details className="help-disclosure">
          <summary>{dictionary.needHelp}</summary>
          <p>{dictionary.needHelpBody}</p>
        </details>
      </div>
      <form className="quick-update" action={evidenceAction}>
        <input type="hidden" name="version" value={version} />
        <input type="hidden" name="locale" value={locale} />
        <label htmlFor="quick-update-note">{dictionary.whatChanged}</label>
        <div className="quick-update-fields">
          <textarea
            id="quick-update-note"
            name="note"
            placeholder={dictionary.quickUpdatePlaceholder}
            required
            maxLength={50000}
          />
          <button className="button secondary" type="submit">{dictionary.addUpdate}</button>
        </div>
      </form>
    </section>
  );
}
