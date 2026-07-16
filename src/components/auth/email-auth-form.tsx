"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createBrowserSupabaseClient } from "@/infrastructure/supabase/browser-client";
import type { Dictionary, Locale } from "@/i18n/locales";

type EmailAuthFormProps = Readonly<{
  mode: "sign-in" | "sign-up";
  locale: Locale;
  redirectPath: string;
  dictionary: Dictionary["auth"];
}>;

function errorMessage(message: string, dictionary: Dictionary["auth"]): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("email not confirmed")) return dictionary.confirmationRequired;
  if (normalized.includes("rate limit")) return dictionary.rateLimited;
  if (normalized.includes("invalid login credentials")) return dictionary.invalidCredentials;
  return dictionary.unavailable;
}

export function EmailAuthForm({ mode, locale, redirectPath, dictionary }: EmailAuthFormProps) {
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignUp = mode === "sign-up";

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    if (typeof email !== "string" || typeof password !== "string") return;

    setIsSubmitting(true);
    setStatus("");
    try {
      const supabase = createBrowserSupabaseClient();
      if (isSignUp) {
        const callbackUrl = new URL("/auth/callback", window.location.origin);
        callbackUrl.searchParams.set("next", redirectPath);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callbackUrl.toString() },
        });
        if (error) {
          setStatus(errorMessage(error.message, dictionary));
          return;
        }
        setStatus(dictionary.checkEmail);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus(errorMessage(error.message, dictionary));
        return;
      }
      window.location.assign(redirectPath);
    } catch (error) {
      setStatus(error instanceof Error ? errorMessage(error.message, dictionary) : dictionary.unavailable);
    } finally {
      setIsSubmitting(false);
    }
  }

  const alternatePath = `/${locale}/${isSignUp ? "sign-in" : "sign-up"}?redirect=${encodeURIComponent(redirectPath)}`;
  return (
    <form className="auth-form" onSubmit={submit}>
      <p className="auth-free-note">{dictionary.freeOnly}</p>
      <label htmlFor="email">{dictionary.email}</label>
      <input id="email" name="email" type="email" autoComplete="email" required />
      <label htmlFor="password">{dictionary.password}</label>
      <input id="password" name="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} required />
      <button className="button primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? dictionary.working : isSignUp ? dictionary.signUp : dictionary.signIn}
      </button>
      <p className="auth-alternate">
        {isSignUp ? dictionary.haveAccount : dictionary.needAccount} <Link className="auth-alternate-link" href={alternatePath}>{isSignUp ? dictionary.signIn : dictionary.signUp}</Link>
      </p>
      <p className="auth-status" role="status" aria-live="polite">{status}</p>
    </form>
  );
}
