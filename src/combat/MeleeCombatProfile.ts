/**
 * Resolved player melee attack profile for one swing.
 * Fists are not an ItemDefinition — UNARMED_MELEE_PROFILE is the fallback.
 */
export type MeleeWeaponSource = "fists" | string;

export interface MeleeCombatProfile {
  readonly source: MeleeWeaponSource;
  readonly damage: number;
  readonly attacksPerSecond: number;
  readonly cycleDuration: number;
  readonly impactNormalizedTime: number;
  /** World units — snapshotted for the swing (Spear longer than default). */
  readonly hitRange: number;
  /** Item stack mutates only for real tools; fists have infinite untracked durability. */
  readonly consumesDurability: boolean;
}

/** Default short-melee reach (fists / hatchet / pickaxe calibration). */
export const DEFAULT_MELEE_HIT_RANGE = 1.15;

/** Shared impact fraction along attack cycle (project calibration, not claimed LDOE exact anims). */
export const MELEE_IMPACT_NORMALIZED_TIME = 0.38;

export const UNARMED_MELEE_PROFILE: MeleeCombatProfile = Object.freeze({
  source: "fists",
  damage: 6,
  attacksPerSecond: 1.8,
  cycleDuration: 1 / 1.8,
  impactNormalizedTime: MELEE_IMPACT_NORMALIZED_TIME,
  hitRange: DEFAULT_MELEE_HIT_RANGE,
  consumesDurability: false,
});

export function createMeleeProfile(
  source: string,
  damage: number,
  attacksPerSecond: number,
  hitRange: number = DEFAULT_MELEE_HIT_RANGE,
): MeleeCombatProfile {
  return Object.freeze({
    source,
    damage,
    attacksPerSecond,
    cycleDuration: 1 / attacksPerSecond,
    impactNormalizedTime: MELEE_IMPACT_NORMALIZED_TIME,
    hitRange,
    consumesDurability: source !== "fists",
  });
}
