import type { LocaleId } from "../locales";
import { CONTENT_EN } from "./en";
import { CONTENT_UK } from "./uk";
import { CONTENT_PL } from "./pl";
import { CONTENT_DE } from "./de";
import { CONTENT_ES } from "./es";
import { CONTENT_FR } from "./fr";
import { CONTENT_IT } from "./it";
import { CONTENT_PT } from "./pt";
import { CONTENT_TR } from "./tr";
import { CONTENT_CS } from "./cs";
import { CONTENT_RO } from "./ro";
import { CONTENT_JA } from "./ja";
import { CONTENT_KO } from "./ko";

const TABLES: Record<LocaleId, Readonly<Record<string, string>>> = {
  en: CONTENT_EN,
  uk: CONTENT_UK,
  pl: CONTENT_PL,
  de: CONTENT_DE,
  es: CONTENT_ES,
  fr: CONTENT_FR,
  it: CONTENT_IT,
  pt: CONTENT_PT,
  tr: CONTENT_TR,
  cs: CONTENT_CS,
  ro: CONTENT_RO,
  ja: CONTENT_JA,
  ko: CONTENT_KO,
};

/** Resolve content catalog key (items/locations/…); falls back to EN then provided fallback. */
export function resolveContent(
  locale: LocaleId,
  key: string,
  fallback?: string,
): string {
  return TABLES[locale]?.[key] ?? CONTENT_EN[key] ?? fallback ?? key;
}
