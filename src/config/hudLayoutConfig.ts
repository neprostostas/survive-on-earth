import { clearInlineRuntimeStyles, fmtUnit, setRuntimeCssVars } from "../theme/runtimeTheme";

/** Pixel-measured LDOE HUD anchors. sizes = fraction of viewport height; x/y = 0–1 centers. */
export interface HudMetric {
  centerX: number;
  centerY: number;
  sizeH: number;
}

export interface HudLevelStrip {
  left: number;
  right: number;
  bottomH: number;
}

export interface HudPlayerStatus {
  leftH: number;
  topH: number;
  widthH: number;
}

/** Mutable layout used by runtime tokens + HUD layout editor (F4). */
export interface HudLayoutState {
  referenceViewport: { width: number; height: number };
  playerStatus: HudPlayerStatus;
  joystick: HudMetric;
  auto: HudMetric;
  minimap: HudMetric;
  settings: HudMetric;
  map: HudMetric;
  quickSlot: HudMetric;
  quickSlot2: HudMetric;
  attack: HudMetric;
  build: HudMetric;
  interact: HudMetric;
  sneak: HudMetric;
  utilityB: HudMetric;
  utilityI: HudMetric;
  levelStrip: HudLevelStrip;
}

/**
 * CSS token prefix → metric field on layout state.
 * size is applied as `--hud-{token}-size` in vh.
 */
export const HUD_EDITABLE_CONTROLS = [
  { id: "joystick", token: "joystick", field: "joystick", label: "Joystick", selector: ".joystick" },
  { id: "auto", token: "auto", field: "auto", label: "AUTO", selector: ".auto-control" },
  { id: "minimap", token: "minimap", field: "minimap", label: "Minimap", selector: ".minimap-shell" },
  { id: "settings", token: "settings", field: "settings", label: "Settings", selector: ".settings-shell" },
  { id: "map", token: "map", field: "map", label: "Map M", selector: ".map-action" },
  { id: "quick1", token: "quick", field: "quickSlot", label: "Quick 1", selector: ".quick-action-1" },
  { id: "quick2", token: "quick2", field: "quickSlot2", label: "Quick 2", selector: ".quick-action-2" },
  { id: "attack", token: "attack", field: "attack", label: "Attack F", selector: ".attack-action" },
  { id: "build", token: "build", field: "build", label: "Build G", selector: ".build-action" },
  { id: "interact", token: "interact", field: "interact", label: "Interact E", selector: ".action.primary" },
  { id: "sneak", token: "sneak", field: "sneak", label: "Sneak C", selector: ".sneak-action" },
  { id: "utilB", token: "utilB", field: "utilityB", label: "Blueprints B", selector: ".crafting-toggle" },
  { id: "utilI", token: "utilI", field: "utilityI", label: "Inventory I", selector: ".inventory-toggle" },
] as const satisfies readonly {
  id: string;
  token: string;
  field: keyof HudLayoutState;
  label: string;
  selector: string;
}[];

export type HudEditableField = (typeof HUD_EDITABLE_CONTROLS)[number]["field"];

/**
 * Measured from LDOE reference (1024×477 landscape screenshot).
 * Gameplay: F attack · E/SPC interact · C sneak · G build · 1/2 quick · B blueprints · I backpack · M map
 */
export const HUD_LAYOUT: HudLayoutState = {
  referenceViewport: { width: 1024, height: 477 },

  playerStatus: { leftH: 0.028, topH: 0.022, widthH: 0.27 },

  joystick: { centerX: 0.149, centerY: 0.686, sizeH: 0.226 },
  auto: { centerX: 0.072, centerY: 0.875, sizeH: 0.072 },

  minimap: { centerX: 0.885, centerY: 0.180, sizeH: 0.240 },
  settings: { centerX: 0.789, centerY: 0.059, sizeH: 0.052 },

  map: { centerX: 0.876, centerY: 0.419, sizeH: 0.062 },
  quickSlot: { centerX: 0.861, centerY: 0.538, sizeH: 0.058 },
  quickSlot2: { centerX: 0.827, centerY: 0.648, sizeH: 0.055 },
  attack: { centerX: 0.914, centerY: 0.682, sizeH: 0.155 },
  build: { centerX: 0.937, centerY: 0.410, sizeH: 0.080 },
  interact: { centerX: 0.822, centerY: 0.837, sizeH: 0.140 },
  sneak: { centerX: 0.930, centerY: 0.866, sizeH: 0.090 },

  utilityB: { centerX: 0.682, centerY: 0.887, sizeH: 0.058 },
  utilityI: { centerX: 0.737, centerY: 0.886, sizeH: 0.058 },

  levelStrip: { left: 0.232, right: 0.831, bottomH: 0.027 },
};

export function cloneHudLayout(source: HudLayoutState = HUD_LAYOUT): HudLayoutState {
  return structuredClone(source);
}

/** Keep circular controls fully on-screen (fractional centers + sizeH). */
export function clampHudMetric(metric: HudMetric, viewportWidth: number, viewportHeight: number): HudMetric {
  const vw = Math.max(1, viewportWidth);
  const vh = Math.max(1, viewportHeight);
  const aspect = vw / vh;
  let sizeH = Math.min(0.48, Math.max(0.03, metric.sizeH));

  // Diameter in height-fraction must fit both axes at the current center.
  const maxByY = Math.min(metric.centerY * 2, (1 - metric.centerY) * 2);
  const maxByX = Math.min(metric.centerX * 2, (1 - metric.centerX) * 2) * aspect;
  sizeH = Math.min(sizeH, maxByY, maxByX, 0.48);
  sizeH = Math.max(0.03, sizeH);

  const rY = sizeH / 2;
  const rX = sizeH / (2 * aspect);
  const centerX = Math.min(1 - rX, Math.max(rX, metric.centerX));
  const centerY = Math.min(1 - rY, Math.max(rY, metric.centerY));
  return { centerX, centerY, sizeH };
}

export function clampHudLayout(layout: HudLayoutState, viewportWidth: number, viewportHeight: number): HudLayoutState {
  const next = cloneHudLayout(layout);
  for (const control of HUD_EDITABLE_CONTROLS) {
    const field = control.field as HudEditableField;
    next[field] = clampHudMetric(next[field] as HudMetric, viewportWidth, viewportHeight);
  }
  const strip = next.levelStrip;
  strip.left = Math.min(0.95, Math.max(0, strip.left));
  strip.right = Math.min(1, Math.max(strip.left + 0.05, strip.right));
  strip.bottomH = Math.min(0.08, Math.max(0.005, strip.bottomH));
  return next;
}

/**
 * Publish HUD layout as CSS vars in the shared runtime stylesheet.
 * Does not write inline styles onto <html> or .hud (DOM stays clean).
 */
export function applyHudLayoutTokens(element: HTMLElement, layout: HudLayoutState = HUD_LAYOUT): void {
  const next: Record<string, string> = {
    "--hud-status-left": fmtUnit(layout.playerStatus.leftH * 100, "vh"),
    "--hud-status-top": fmtUnit(layout.playerStatus.topH * 100, "vh"),
    "--hud-status-width": fmtUnit(layout.playerStatus.widthH * 100, "vh"),
    "--hud-level-left": fmtUnit(layout.levelStrip.left * 100, "%"),
    "--hud-level-right": fmtUnit((1 - layout.levelStrip.right) * 100, "%"),
    "--hud-level-bottom": fmtUnit(layout.levelStrip.bottomH * 100, "vh"),
  };
  for (const [name, metric] of Object.entries({
    joystick: layout.joystick,
    auto: layout.auto,
    minimap: layout.minimap,
    settings: layout.settings,
    map: layout.map,
    build: layout.build,
    quick: layout.quickSlot,
    quick2: layout.quickSlot2,
    attack: layout.attack,
    interact: layout.interact,
    sneak: layout.sneak,
    utilB: layout.utilityB,
    utilI: layout.utilityI,
  })) {
    next[`--hud-${name}-x`] = fmtUnit(metric.centerX * 100, "%");
    next[`--hud-${name}-y`] = fmtUnit(metric.centerY * 100, "%");
    next[`--hud-${name}-size`] = fmtUnit(metric.sizeH * 100, "vh");
  }
  setRuntimeCssVars(next);
  // Strip any legacy inline pollution from earlier builds.
  clearInlineRuntimeStyles(element, document.documentElement);
}

/** Compact snippet for clipboard → paste back to agent / config. */
export function formatHudLayoutExport(layout: HudLayoutState): string {
  const fmt = (m: HudMetric): string =>
    `{ centerX: ${m.centerX.toFixed(3)}, centerY: ${m.centerY.toFixed(3)}, sizeH: ${m.sizeH.toFixed(3)} }`;
  const lines = [
    "// HUD layout export (paste to agent or into hudLayoutConfig.ts)",
    "HUD_LAYOUT partial:",
    `  joystick: ${fmt(layout.joystick)},`,
    `  auto: ${fmt(layout.auto)},`,
    `  minimap: ${fmt(layout.minimap)},`,
    `  settings: ${fmt(layout.settings)},`,
    `  map: ${fmt(layout.map)},`,
    `  quickSlot: ${fmt(layout.quickSlot)},`,
    `  quickSlot2: ${fmt(layout.quickSlot2)},`,
    `  attack: ${fmt(layout.attack)},`,
    `  build: ${fmt(layout.build)},`,
    `  interact: ${fmt(layout.interact)},`,
    `  sneak: ${fmt(layout.sneak)},`,
    `  utilityB: ${fmt(layout.utilityB)},`,
    `  utilityI: ${fmt(layout.utilityI)},`,
    `  levelStrip: { left: ${layout.levelStrip.left.toFixed(3)}, right: ${layout.levelStrip.right.toFixed(3)}, bottomH: ${layout.levelStrip.bottomH.toFixed(3)} },`,
  ];
  return lines.join("\n");
}

export function validateHudLayout(layout: HudLayoutState = HUD_LAYOUT): string[] {
  const errors: string[] = [];
  for (const [name, metric] of Object.entries(layout)) {
    if (typeof metric !== "object" || metric === null || !("centerX" in metric)) continue;
    const value = metric as HudMetric;
    if (value.centerX < 0 || value.centerX > 1 || value.centerY < 0 || value.centerY > 1) {
      errors.push(`${name}: anchor outside viewport`);
    }
    if (value.sizeH <= 0 || value.sizeH > 0.5) errors.push(`${name}: invalid size`);
  }
  if (layout.attack.sizeH <= layout.interact.sizeH) {
    errors.push("attack must be larger than interact (LDOE weapon hierarchy)");
  }
  if (layout.levelStrip.left >= layout.levelStrip.right) {
    errors.push("levelStrip: left must be less than right");
  }
  return errors;
}
