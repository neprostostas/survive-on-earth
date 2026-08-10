import {
  applyBodyFlagClasses,
  clearInlineRuntimeStyles,
  setRuntimeCssVars,
} from "../theme/runtimeTheme";
import { LOCALE_NATIVE_NAMES, SUPPORTED_LOCALES, mapBrowserLanguage, type LocaleId } from "./locales";
import { resolveAny, resolveString, type StringKey } from "./strings";
import { resolveContent } from "./content/resolveContent";

const STORAGE_KEY = "survive-on-earth.locale";
const SETTINGS_KEY = "survive-on-earth.settings.v1";

export interface GameSettings {
  uiScale: number;
  textSize: "normal" | "large" | "xlarge";
  highContrast: boolean;
  reducedMotion: boolean;
  screenShake: boolean;
  masterVolume: number;
  qualityPreset: "low" | "medium" | "high" | "ultra";
  damageNumbers: boolean;
  colorAssist: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  uiScale: 1,
  textSize: "normal",
  highContrast: false,
  reducedMotion: false,
  screenShake: true,
  masterVolume: 1,
  qualityPreset: "high",
  damageNumbers: true,
  colorAssist: false,
};

const TEXT_SCALE: Record<GameSettings["textSize"], number> = {
  normal: 1,
  large: 1.14,
  xlarge: 1.28,
};

export class I18n {
  private locale: LocaleId;
  private settings: GameSettings;
  private readonly listeners = new Set<() => void>();

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY) as LocaleId | null;
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
      this.locale = stored;
    } else {
      this.locale = mapBrowserLanguage(navigator.language);
    }
    this.settings = this.loadSettings();
    this.applyDocumentAttributes();
  }

  get currentLocale(): LocaleId { return this.locale; }
  get hasExplicitLocale(): boolean { return localStorage.getItem(STORAGE_KEY) !== null; }
  get gameSettings(): Readonly<GameSettings> { return this.settings; }
  readonly locales = SUPPORTED_LOCALES;
  readonly nativeNames = LOCALE_NATIVE_NAMES;

  t(key: StringKey, vars?: Record<string, string | number>): string {
    return resolveString(this.locale, key, vars);
  }

  /** Free-form key resolver (shell + content + fallback). Prefer typed `t` when possible. */
  tx(key: string, fallback?: string, vars?: Record<string, string | number>): string {
    return resolveAny(this.locale, key, vars, fallback);
  }

  hasContentKey(key: string): boolean {
    const hit = resolveContent(this.locale, key, "");
    return hit.length > 0 && hit !== key;
  }

  setLocale(locale: LocaleId): void {
    if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale)) return;
    this.locale = locale;
    localStorage.setItem(STORAGE_KEY, locale);
    this.applyDocumentAttributes();
    this.emit();
  }

  patchSettings(partial: Partial<GameSettings>): void {
    const next = { ...this.settings, ...partial };
    // Clamp volume and scale to sane ranges
    if (typeof next.uiScale === "number") {
      next.uiScale = Math.min(1.5, Math.max(0.8, Number(next.uiScale) || 1));
    }
    if (typeof next.masterVolume === "number") {
      next.masterVolume = Math.min(1, Math.max(0, Number(next.masterVolume) || 0));
    }
    this.settings = next;
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch { /* ignore */ }
    this.applyDocumentAttributes();
    this.emit();
  }

  /** Replace settings (e.g. from save blob) and persist. */
  replaceSettings(settings: Partial<GameSettings>): void {
    this.patchSettings({ ...DEFAULT_SETTINGS, ...settings });
  }

  serializeSettings(): GameSettings {
    return { ...this.settings };
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  formatDuration(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  formatDate(ms: number): string {
    try {
      return new Intl.DateTimeFormat(this.locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(ms));
    } catch {
      return new Date(ms).toLocaleString();
    }
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  private loadSettings(): GameSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw) as Partial<GameSettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private applyDocumentAttributes(): void {
    const root = document.documentElement;
    // Only legitimate attribute on <html>
    root.lang = this.locale;

    const textScale = TEXT_SCALE[this.settings.textSize] ?? 1;
    setRuntimeCssVars({
      "--ui-scale": String(this.settings.uiScale),
      "--text-scale": String(textScale),
    });
    clearInlineRuntimeStyles(root);

    const reduced = this.settings.reducedMotion
      || (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    applyBodyFlagClasses({
      highContrast: this.settings.highContrast,
      reducedMotion: reduced,
      colorAssist: this.settings.colorAssist,
      hideDamageNumbers: !this.settings.damageNumbers,
    });
  }
}

export const I18N = new I18n();
