import { notFound } from "next/navigation";
import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { safeRelativeRedirect } from "@/infrastructure/auth/require-user";
import { getDictionary, isLocale } from "@/i18n/locales";

type SignInPageProps = Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string | string[] }>;
}>;

export default async function SignInPage({ params, searchParams }: SignInPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { redirect } = await searchParams;
  const redirectPath = safeRelativeRedirect(typeof redirect === "string" ? redirect : undefined, `/${locale}`);
  const dictionary = getDictionary(locale);
  return (
    <main className="auth-shell" lang={locale}>
      <section className="auth-card" aria-labelledby="sign-in-title">
        <p className="eyebrow">LifeThread</p>
        <h1 id="sign-in-title">{dictionary.auth.signInTitle}</h1>
        <p className="lede">{dictionary.auth.signInLede}</p>
        <EmailAuthForm mode="sign-in" locale={locale} redirectPath={redirectPath} dictionary={dictionary.auth} />
      </section>
    </main>
  );
}
