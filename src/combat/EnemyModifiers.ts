/**
 * Named elite modifiers — additive, data-driven, applied at spawn time.
 */

export type EnemyModifierId =
  | "armored"
  | "fast"
  | "toxic"
  | "regenerating"
  | "enraged"
  | "stealthy"
  | "heavy"
  | "ranged";

export interface EnemyModifierDef {
  readonly id: EnemyModifierId;
  readonly title: string;
  readonly healthMul: number;
  readonly damageMul: number;
  readonly speedMul: number;
  readonly xpMul: number;
}

const MOD_LIST: readonly EnemyModifierDef[] = Object.freeze([
  Object.freeze({ id: "armored" as const, title: "Armored", healthMul: 1.45, damageMul: 1.0, speedMul: 0.85, xpMul: 1.3 }),
  Object.freeze({ id: "fast" as const, title: "Swift", healthMul: 0.85, damageMul: 1.0, speedMul: 1.35, xpMul: 1.2 }),
  Object.freeze({ id: "toxic" as const, title: "Toxic", healthMul: 1.1, damageMul: 1.15, speedMul: 0.95, xpMul: 1.25 }),
  Object.freeze({ id: "regenerating" as const, title: "Regenerating", healthMul: 1.2, damageMul: 0.95, speedMul: 1.0, xpMul: 1.35 }),
  Object.freeze({ id: "enraged" as const, title: "Enraged", healthMul: 1.0, damageMul: 1.4, speedMul: 1.15, xpMul: 1.4 }),
  Object.freeze({ id: "stealthy" as const, title: "Stalking", healthMul: 0.9, damageMul: 1.35, speedMul: 1.1, xpMul: 1.3 }),
  Object.freeze({ id: "heavy" as const, title: "Heavy", healthMul: 1.7, damageMul: 1.25, speedMul: 0.7, xpMul: 1.5 }),
  Object.freeze({ id: "ranged" as const, title: "Ranged", healthMul: 0.95, damageMul: 1.1, speedMul: 1.0, xpMul: 1.2 }),
]);

export const ENEMY_MODIFIERS: ReadonlyMap<EnemyModifierId, EnemyModifierDef> = new Map(
  MOD_LIST.map((m) => [m.id, m] as const),
);

const ELITE_TITLES = Object.freeze([
  "Ash-Touched", "Wirebound", "Bonehowl", "Rustblood", "Nightglass",
  "Grey Howler", "Ironjaw", "Sporemark", "Hollowstep", "Tidefang",
]);

export interface ModifiedEnemyStats {
  readonly maxHealth: number;
  readonly damage: number;
  readonly moveSpeed: number;
  readonly xpReward: number;
  readonly modifiers: readonly EnemyModifierId[];
  readonly eliteTitle: string | null;
}

export function applyEnemyModifiers(
  base: { maxHealth: number; damage: number; moveSpeed: number; xpReward: number },
  modifiers: readonly EnemyModifierId[],
  seed = 1,
): ModifiedEnemyStats {
  let healthMul = 1;
  let damageMul = 1;
  let speedMul = 1;
  let xpMul = 1;
  for (const id of modifiers) {
    const m = ENEMY_MODIFIERS.get(id);
    if (!m) continue;
    healthMul *= m.healthMul;
    damageMul *= m.damageMul;
    speedMul *= m.speedMul;
    xpMul *= m.xpMul;
  }
  const eliteTitle = modifiers.length > 0
    ? ELITE_TITLES[Math.abs(seed) % ELITE_TITLES.length]!
    : null;
  return Object.freeze({
    maxHealth: Math.max(1, Math.round(base.maxHealth * healthMul)),
    damage: Math.max(1, Math.round(base.damage * damageMul)),
    moveSpeed: base.moveSpeed * speedMul,
    xpReward: Math.max(1, Math.round(base.xpReward * xpMul)),
    modifiers: Object.freeze([...modifiers]),
    eliteTitle,
  });
}

export function pickRandomModifiers(seed: number, count = 1): EnemyModifierId[] {
  const ids = [...ENEMY_MODIFIERS.keys()];
  const out: EnemyModifierId[] = [];
  let s = seed >>> 0 || 1;
  for (let i = 0; i < count && ids.length > 0; i += 1) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const idx = s % ids.length;
    out.push(ids.splice(idx, 1)[0]!);
  }
  return out;
}
