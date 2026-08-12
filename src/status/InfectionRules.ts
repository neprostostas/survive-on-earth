/**
 * Bite / infection chance from enemy archetypes.
 */
import type { EnemyArchetypeId } from "../enemies/EnemyArchetypes.ts";

const HUMAN_HOSTILE = /^(marauder|bandit-|faction-|sniper-host|shotgun-host|industrial-raider)/;

const INFECTIOUS = /infected|shambler|runner|zombie|toxic|spore|stalker|screecher|bloater|brute|hive|cave|tunnel|warden|leviathan|helix|ash-jackal|sentinel|hazard|tendril|roaming/;

/** True when a hit from this archetype can transmit infection. */
export function canInfectFromArchetype(id: string | EnemyArchetypeId): boolean {
  if (HUMAN_HOSTILE.test(id)) return false;
  return INFECTIOUS.test(id);
}

/** Higher damage hits → higher bite infection chance. */
export function infectionChanceFromHit(finalDamage: number, infectious: boolean): number {
  if (!infectious) return 0;
  if (finalDamage >= 14) return 0.38;
  if (finalDamage >= 8) return 0.26;
  return 0.16;
}
