import { redirect } from "next/navigation";
import { hasRuntimeEnvironment } from "@/config/env";
import { AuthRequiredError, requireUser } from "@/infrastructure/auth/require-user";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server-client";
import { getDictionary } from "@/i18n/locales";

type ConsentPageProps = Readonly<{ searchParams: Promise<{ authorization_id?: string | string[]; locale?: string | string[] }> }>;

export default async function ConsentPage({ searchParams }: ConsentPageProps) {
  const { authorization_id: authorizationIdValue, locale: localeValue } = await searchParams;
  const locale = localeValue === "ko" ? "ko" : "en";
  const dictionary = getDictionary(locale).auth;
  const authorizationId = typeof authorizationIdValue === "string" ? authorizationIdValue : "";
  if (!hasRuntimeEnvironment(process.env) || !authorizationId) return <main className="auth-shell" lang={locale}><section className="auth-card"><h1>{dictionary.consentTitle}</h1><p role="alert">{dictionary.invalidConsent}</p></section></main>;
  const consentPath = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}&locale=${locale}`;
  const supabase = await createServerSupabaseClient();
  try {
    await requireUser(supabase, { locale, redirect: consentPath });
  } catch (error) {
    if (error instanceof AuthRequiredError) redirect(error.signInPath);
    throw error;
  }
  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
  if (error || !data) return <main className="auth-shell" lang={locale}><section className="auth-card"><h1>{dictionary.consentTitle}</h1><p role="alert">{dictionary.invalidConsent}</p></section></main>;
  if (!("authorization_id" in data)) redirect(data.redirect_url);
  const scopes = data.scope.split(" ").filter(Boolean);
  return <main className="auth-shell" lang={locale}><section className="auth-card" aria-labelledby="consent-title"><p className="eyebrow">LifeThread</p><h1 id="consent-title">{dictionary.consentTitle}</h1><p className="lede">{dictionary.consentLede}</p><dl className="consent-details"><div><dt>{dictionary.client}</dt><dd>{data.client.name}</dd></div><div><dt>{dictionary.permissions}</dt><dd><ul>{scopes.map((scope) => <li key={scope}>{scope}</li>)}</ul></dd></div></dl><form className="consent-actions" action="/api/oauth/decision" method="post"><input type="hidden" name="authorization_id" value={data.authorization_id} /><input type="hidden" name="locale" value={locale} /><button className="button primary" name="decision" value="approve" type="submit">{dictionary.approve}</button><button className="button quiet" name="decision" value="deny" type="submit">{dictionary.deny}</button></form></section></main>;
}
