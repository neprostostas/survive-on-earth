/**
 * Keeps the live DOM tree clean: runtime CSS variables live in one <style>,
 * a11y flags are body class names — never data-* / style spam on <html>.
 */

const STYLE_ID = "soi-runtime-theme";

const vars = new Map<string, string>();
let sheet: HTMLStyleElement | null = null;

function ensureSheet(): HTMLStyleElement {
  if (sheet?.isConnected) return sheet;
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.append(el);
  }
  sheet = el;
  return el;
}

function flush(): void {
  const lines: string[] = [];
  for (const [name, value] of vars) {
    lines.push(`  ${name}: ${value};`);
  }
  ensureSheet().textContent = lines.length > 0 ? `:root {\n${lines.join("\n")}\n}\n` : "";
}

/** Set / replace one CSS custom property (published into the runtime stylesheet). */
export function setRuntimeCssVar(name: string, value: string): void {
  vars.set(name, value);
  flush();
}

/** Batch-set CSS custom properties. */
export function setRuntimeCssVars(next: Readonly<Record<string, string>>): void {
  for (const [name, value] of Object.entries(next)) {
    vars.set(name, value);
  }
  flush();
}

/** Round float mess (2.8000000000000003 → 2.8). */
export function fmtUnit(value: number, unit: "%" | "vh", digits = 1): string {
  const n = Number.isFinite(value) ? value : 0;
  const rounded = Math.round(n * 10 ** digits) / 10 ** digits;
  // strip trailing zeros: 2.0 → 2 ; 2.8 stays 2.8
  const text = String(rounded);
  return `${text}${unit}`;
}

/** Strip previous inline runtime chrome so <html> / .hud stay clean. */
export function clearInlineRuntimeStyles(...elements: Array<HTMLElement | null | undefined>): void {
  for (const el of elements) {
    if (!el) continue;
    // Remove only known runtime props, keep engine/canvas touch styles alone.
    const style = el.style;
    const names: string[] = [];
    for (let i = 0; i < style.length; i += 1) {
      const prop = style.item(i);
      if (
        prop.startsWith("--hud-")
        || prop === "--ui-scale"
        || prop === "--text-scale"
      ) {
        names.push(prop);
      }
    }
    for (const prop of names) style.removeProperty(prop);
  }
}

const BODY_FLAG_CLASSES = [
  "soe-high-contrast",
  "soe-reduced-motion",
  "soe-color-assist",
  "soe-hide-damage-numbers",
] as const;

/** Apply accessibility / display flags as body classes (no data-* on <html>). */
export function applyBodyFlagClasses(flags: {
  highContrast: boolean;
  reducedMotion: boolean;
  colorAssist: boolean;
  hideDamageNumbers: boolean;
}): void {
  const body = document.body;
  body.classList.toggle("soe-high-contrast", flags.highContrast);
  body.classList.toggle("soe-reduced-motion", flags.reducedMotion);
  body.classList.toggle("soe-color-assist", flags.colorAssist);
  body.classList.toggle("soe-hide-damage-numbers", flags.hideDamageNumbers);

  // Drop legacy data-* pollution from earlier builds.
  const root = document.documentElement;
  delete root.dataset.textSize;
  delete root.dataset.highContrast;
  delete root.dataset.colorAssist;
  delete root.dataset.screenShake;
  delete root.dataset.damageNumbers;
  delete root.dataset.quality;
  delete root.dataset.reducedMotion;
}

/** Visible for tests/debug — which flag classes are currently on body. */
export function bodyFlagClasses(): readonly string[] {
  return BODY_FLAG_CLASSES.filter((c) => document.body.classList.contains(c));
}
