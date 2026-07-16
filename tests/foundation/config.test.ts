import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import ko from "../../messages/ko.json";
import { getDictionary, isLocale, otherLocale } from "@/i18n/locales";
import { missingRuntimeEnvironment } from "@/config/env";

describe("foundation configuration", () => {
  it("keeps English and Korean dictionaries structurally identical", () => {
    expect(Object.keys(ko).sort()).toEqual(Object.keys(en).sort());
    expect(getDictionary("ko").privacyLabel).toContain("공개 공유 없음");
  });

  it("accepts only the two canonical locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ko")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(otherLocale("en")).toBe("ko");
  });

  it("names only the public Supabase runtime contract without reading content", () => {
    expect(missingRuntimeEnvironment({})).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ]);
  });
});
