import type { Dictionary, Locale } from "@/i18n/locales";

type NewThreadFormProps = Readonly<{
  locale: Locale;
  dictionary: Dictionary;
  action: (formData: FormData) => Promise<void>;
}>;

export function NewThreadForm({ locale, dictionary, action }: NewThreadFormProps) {
  return (
    <section className="new-thread-card" aria-labelledby="new-thread-title">
      <p className="section-kicker">{dictionary.dashboardCreateEyebrow}</p>
      <h2 id="new-thread-title">{dictionary.dashboardCreateTitle}</h2>
      <p>{dictionary.dashboardCreateBody}</p>
      <form className="dashboard-create-form" action={action}>
        <input type="hidden" name="locale" value={locale} />
        <label htmlFor="new-goal">{dictionary.dashboardCreateLabel}</label>
        <textarea
          id="new-goal"
          name="goal"
          required
          maxLength={2000}
          placeholder={dictionary.dashboardCreatePlaceholder}
        />
        <button className="button primary" type="submit">
          {dictionary.dashboardCreateButton}
        </button>
      </form>
    </section>
  );
}
