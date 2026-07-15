import { createHash } from "node:crypto";

export function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

export function stableId(prefix: string, value: string): string {
  return `${prefix}_${sha256(value).slice(0, 16)}`;
}

export function detectSourceLanguage(value: string): "en" | "ko" | "mixed" {
  const hasKorean = /[\uac00-\ud7af]/u.test(value);
  const hasLatin = /[a-z]/iu.test(value);
  if (hasKorean && hasLatin) return "mixed";
  return hasKorean ? "ko" : "en";
}
