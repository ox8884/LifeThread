import { notFound } from "next/navigation";
import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { safeRelativeRedirect } from "@/infrastructure/auth/require-user";
import { getDictionary, isLocale } from "@/i18n/locales";

type SignUpPageProps = Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string | string[] }>;
}>;

export default async function SignUpPage({ params, searchParams }: SignUpPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { redirect } = await searchParams;
  const redirectPath = safeRelativeRedirect(typeof redirect === "string" ? redirect : undefined, `/${locale}`);
  const dictionary = getDictionary(locale);
  return (
    <main className="auth-shell" lang={locale}>
      <section className="auth-card" aria-labelledby="sign-up-title">
        <p className="eyebrow">LifeThread</p>
        <h1 id="sign-up-title">{dictionary.auth.signUpTitle}</h1>
        <p className="lede">{dictionary.auth.signUpLede}</p>
        <EmailAuthForm mode="sign-up" locale={locale} redirectPath={redirectPath} dictionary={dictionary.auth} />
      </section>
    </main>
  );
}
