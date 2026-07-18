import Link from "next/link";
import { signOutAction } from "@/app/[locale]/actions";
import type { Dictionary, Locale } from "@/i18n/locales";
import { otherLocale } from "@/i18n/locales";

type WorkspaceHeaderProps = Readonly<{
  locale: Locale;
  dictionary: Dictionary;
}>;

export function WorkspaceHeader({ locale, dictionary }: WorkspaceHeaderProps) {
  return (
    <header className="workspace-header">
      <nav className="workspace-nav" aria-label={dictionary.workspaceNavigation}>
        <Link className="brand" href={`/${locale}`}>
          <span className="brand-mark" aria-hidden="true">LT</span>
          <span>LifeThread</span>
        </Link>
        <span className="demo-status">{dictionary.demoStatus}</span>
      </nav>
      <div className="workspace-header-actions">
        <Link className="locale-link" href={`/${otherLocale(locale)}`}>
          {dictionary.switchLocale}
        </Link>
        <details className="header-menu">
          <summary aria-label={dictionary.threadMenu}>•••</summary>
          <div className="header-menu-panel">
            <p className="account-label">{dictionary.accountSignedIn}</p>
            <p>{dictionary.demoLabel}</p>
            <p>{dictionary.privacyLabel}</p>
            <p>{dictionary.sendingLabel}</p>
            <form action={signOutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button className="button quiet" type="submit">{dictionary.signOut}</button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}
