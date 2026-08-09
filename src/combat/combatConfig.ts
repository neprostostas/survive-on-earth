import { UNARMED_MELEE_PROFILE } from "./MeleeCombatProfile.ts";

/** @deprecated Prefer UNARMED_MELEE_PROFILE — kept for M09-era imports. */
export const FISTS_COMBAT_PROFILE = UNARMED_MELEE_PROFILE;

export const COMBAT_CONFIG = Object.freeze({
  targetAcquisitionRange: 2.2,
  meleeHitRange: 1.15,
  targetSwitchBias: 0.16,
  dummyMaxHealth: 40,
  dummyCollisionRadius: 0.3,
  dummyDeathDuration: 0.32,
});
