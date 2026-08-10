/** Supported locales for Survive on Earth. */
export type LocaleId =
  | "en"
  | "uk"
  | "pl"
  | "de"
  | "es"
  | "fr"
  | "it"
  | "pt"
  | "tr"
  | "cs"
  | "ro"
  | "ja"
  | "ko";

export const SUPPORTED_LOCALES: readonly LocaleId[] = Object.freeze([
  "en", "uk", "pl", "de", "es", "fr", "it", "pt", "tr", "cs", "ro", "ja", "ko",
]);

export const LOCALE_NATIVE_NAMES: Readonly<Record<LocaleId, string>> = Object.freeze({
  en: "English",
  uk: "Українська",
  pl: "Polski",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  pt: "Português",
  tr: "Türkçe",
  cs: "Čeština",
  ro: "Română",
  ja: "日本語",
  ko: "한국어",
});

export function mapBrowserLanguage(tag: string | undefined): LocaleId {
  if (!tag) return "en";
  const lower = tag.toLowerCase();
  const base = lower.split("-")[0] ?? lower;
  if ((SUPPORTED_LOCALES as readonly string[]).includes(base)) return base as LocaleId;
  if (base === "ua") return "uk";
  if (base === "nb" || base === "nn") return "en";
  return "en";
}
