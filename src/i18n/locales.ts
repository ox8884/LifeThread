import en from "../../messages/en.json";
import ko from "../../messages/ko.json";

export const locales = ["en", "ko"] as const;
export type Locale = (typeof locales)[number];
export type Dictionary = typeof en;

const dictionaries: Readonly<Record<Locale, Dictionary>> = { en, ko };

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "ko";
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "ko" : "en";
}
