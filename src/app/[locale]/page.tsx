import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, otherLocale } from "@/i18n/locales";
import { createThreadAction, resetDemoAction } from "@/app/[locale]/actions";
import { getRuntimeRepository } from "@/infrastructure/runtime";
import { Workspace } from "@/components/threads/workspace";

export const dynamic = "force-dynamic";

type LocalePageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const alternateLocale = otherLocale(locale);
  const aggregate = await getRuntimeRepository().load();

  if (aggregate) {
    return <Workspace aggregate={aggregate} locale={locale} dictionary={dictionary} />;
  }

  return (
    <div className="create-shell" lang={locale}>
      <aside className="create-rail" aria-label="LifeThread">
        <Link className="brand" href={`/${locale}`}>
          <span className="brand-mark" aria-hidden="true">LT</span>
          LifeThread
        </Link>
        <Link className="locale-link" href={`/${alternateLocale}`}>
          {dictionary.switchLocale}
        </Link>
      </aside>
      <main className="create-main">
        <p className="eyebrow">{dictionary.createEyebrow}</p>
        <h1>{dictionary.createHeadline}</h1>
        <p className="lede">{dictionary.createLede}</p>
        <form className="goal-form" action={createThreadAction}>
          <input type="hidden" name="locale" value={locale} />
          <label htmlFor="goal">{dictionary.goalLabel}</label>
          <textarea id="goal" name="goal" required maxLength={2000} placeholder={dictionary.goalPlaceholder} />
          <button className="button primary" type="submit">{dictionary.createThread}</button>
        </form>
        <ul className="status-strip" aria-label="Demo boundaries">
          <li>{dictionary.demoLabel}</li>
          <li>{dictionary.privacyLabel}</li>
          <li>{dictionary.sendingLabel}</li>
        </ul>
        <form action={resetDemoAction}>
          <button className="button quiet" type="submit">{dictionary.resetDemo}</button>
        </form>
      </main>
    </div>
  );
}
