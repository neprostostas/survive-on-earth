export interface HudMetric {
  centerX: number;
  centerY: number;
  sizeH: number;
}

export const HUD_LAYOUT = {
  referenceViewport: { width: 1230, height: 580 },
  playerStatus: { leftH: 0.133, topH: 0.052, widthH: 0.36 },
  joystick: { centerX: 0.146, centerY: 0.681, sizeH: 0.234 } satisfies HudMetric,
  auto: { centerX: 0.094, centerY: 0.864, sizeH: 0.116 } satisfies HudMetric,
  minimap: { centerX: 0.862, centerY: 0.15, sizeH: 0.286 } satisfies HudMetric,
  social: { centerX: 0.784, centerY: 0.052, sizeH: 0.055 } satisfies HudMetric,
  settings: { centerX: 0.94, centerY: 0.052, sizeH: 0.055 } satisfies HudMetric,
  build: { centerX: 0.902, centerY: 0.398, sizeH: 0.109 } satisfies HudMetric,
  quickSlot: { centerX: 0.894, centerY: 0.548, sizeH: 0.121 } satisfies HudMetric,
  attack: { centerX: 0.899, centerY: 0.705, sizeH: 0.153 } satisfies HudMetric,
  interact: { centerX: 0.888, centerY: 0.845, sizeH: 0.124 } satisfies HudMetric,
  sneak: { centerX: 0.942, centerY: 0.915, sizeH: 0.105 } satisfies HudMetric,
  utilityBaselineY: 0.875,
} as const;

export function applyHudLayoutTokens(element: HTMLElement): void {
  const set = (name: string, value: string): void => { element.style.setProperty(name, value); };
  set("--hud-status-left", `${HUD_LAYOUT.playerStatus.leftH * 100}vh`);
  set("--hud-status-top", `${HUD_LAYOUT.playerStatus.topH * 100}vh`);
  set("--hud-status-width", `${HUD_LAYOUT.playerStatus.widthH * 100}vh`);
  for (const [name, metric] of Object.entries({
    joystick: HUD_LAYOUT.joystick,
    auto: HUD_LAYOUT.auto,
    minimap: HUD_LAYOUT.minimap,
    social: HUD_LAYOUT.social,
    settings: HUD_LAYOUT.settings,
    build: HUD_LAYOUT.build,
    quick: HUD_LAYOUT.quickSlot,
    attack: HUD_LAYOUT.attack,
    interact: HUD_LAYOUT.interact,
    sneak: HUD_LAYOUT.sneak,
  })) {
    set(`--hud-${name}-x`, `${metric.centerX * 100}%`);
    set(`--hud-${name}-y`, `${metric.centerY * 100}%`);
    set(`--hud-${name}-size`, `${metric.sizeH * 100}vh`);
  }
  set("--hud-utility-y", `${HUD_LAYOUT.utilityBaselineY * 100}%`);
}

export function validateHudLayout(): string[] {
  const errors: string[] = [];
  for (const [name, metric] of Object.entries(HUD_LAYOUT)) {
    if (typeof metric !== "object" || metric === null || !("centerX" in metric)) continue;
    const value = metric as HudMetric;
    if (value.centerX < 0 || value.centerX > 1 || value.centerY < 0 || value.centerY > 1) errors.push(`${name}: anchor outside viewport`);
    if (value.sizeH <= 0 || value.sizeH > 0.5) errors.push(`${name}: invalid size`);
  }
  return errors;
}
