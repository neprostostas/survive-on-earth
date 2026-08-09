/**
 * Resolved player melee attack profile for one swing.
 * Fists are not an ItemDefinition — UNARMED_MELEE_PROFILE is the fallback.
 */
export interface MeleeCombatProfile {
  readonly source: "fists" | "hatchet" | "pickaxe";
  readonly damage: number;
  readonly attacksPerSecond: number;
  readonly cycleDuration: number;
  readonly impactNormalizedTime: number;
  /** Item stack mutates only for real tools; fists have infinite untracked durability. */
  readonly consumesDurability: boolean;
}

export const UNARMED_MELEE_PROFILE: MeleeCombatProfile = Object.freeze({
  source: "fists",
  damage: 6,
  attacksPerSecond: 1.8,
  cycleDuration: 1 / 1.8,
  impactNormalizedTime: 0.38,
  consumesDurability: false,
});

/** Shared impact fraction along attack cycle (project calibration, not claimed LDOE exact anims). */
export const MELEE_IMPACT_NORMALIZED_TIME = 0.38;

export function createMeleeProfile(
  source: Exclude<MeleeCombatProfile["source"], "fists">,
  damage: number,
  attacksPerSecond: number,
): MeleeCombatProfile {
  return Object.freeze({
    source,
    damage,
    attacksPerSecond,
    cycleDuration: 1 / attacksPerSecond,
    impactNormalizedTime: MELEE_IMPACT_NORMALIZED_TIME,
    consumesDurability: true,
  });
}
