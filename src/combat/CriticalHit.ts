/**
 * Critical hit calculation with injectable RNG for tests / determinism.
 */
export interface CritConfig {
  readonly chance: number;
  readonly multiplier: number;
}

export const DEFAULT_CRIT: CritConfig = Object.freeze({
  chance: 0.08,
  multiplier: 1.5,
});

export interface CritResult {
  readonly isCrit: boolean;
  readonly damage: number;
}

export type CritRng = () => number; // 0..1

export function resolveCriticalHit(
  baseDamage: number,
  config: CritConfig = DEFAULT_CRIT,
  rng: CritRng = Math.random,
  enabled = true,
): CritResult {
  if (!enabled || config.chance <= 0) {
    return Object.freeze({ isCrit: false, damage: baseDamage });
  }
  const roll = rng();
  if (roll < config.chance) {
    return Object.freeze({ isCrit: true, damage: Math.round(baseDamage * config.multiplier * 10) / 10 });
  }
  return Object.freeze({ isCrit: false, damage: baseDamage });
}
