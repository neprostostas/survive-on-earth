/**
 * Day/night combat pressure helpers (pure).
 */
import type { LocationId } from "../locations/LocationRegistry.ts";
import type { EnemyArchetypeId } from "./EnemyArchetypes.ts";
import type { LocationEnemySpawnSpec } from "./LocationEnemyPools.ts";

/** Acquire / vision cone stretch at night. */
export const NIGHT_ACQUIRE_MUL = 1.35;
/** Footstep / burst hear stretch at night. */
export const NIGHT_HEAR_MUL = 1.25;

export function nightAcquireMul(isNight: boolean): number {
  return isNight ? NIGHT_ACQUIRE_MUL : 1;
}

export function nightHearMul(isNight: boolean): number {
  return isNight ? NIGHT_HEAR_MUL : 1;
}

export function scaledAcquireRange(base: number, isNight: boolean): number {
  return base * nightAcquireMul(isNight);
}

export function scaledHearRadius(base: number, isNight: boolean): number {
  return base * nightHearMul(isNight);
}

/** Extra stalker-night bodies for non-home outdoor nights. */
export function nightExtraStalkerCount(isNight: boolean, locationId: LocationId): number {
  if (!isNight || locationId === "home") return 0;
  // Indoor-ish narrative floors already dense — light bump only.
  if (
    locationId.startsWith("bunker")
    || locationId.startsWith("metro")
    || locationId === "helix-core"
    || locationId === "abandoned-hospital"
    || locationId === "ironbound-prison"
  ) {
    return 1;
  }
  return 2;
}

/**
 * Append night pressure to a spawn roster without mutating the base specs.
 * Prefers boosting existing stalker-night count, else adds a new entry.
 */
export function withNightSpawnPressure(
  specs: readonly LocationEnemySpawnSpec[],
  isNight: boolean,
  locationId: LocationId,
): readonly LocationEnemySpawnSpec[] {
  const extra = nightExtraStalkerCount(isNight, locationId);
  if (extra <= 0) return specs;
  const out: LocationEnemySpawnSpec[] = specs.map((s) => Object.freeze({ ...s }));
  const idx = out.findIndex((s) => s.archetypeId === "stalker-night");
  if (idx >= 0) {
    const cur = out[idx]!;
    out[idx] = Object.freeze({ archetypeId: cur.archetypeId, count: cur.count + extra });
  } else {
    out.push(Object.freeze({
      archetypeId: "stalker-night" as EnemyArchetypeId,
      count: extra,
    }));
  }
  return Object.freeze(out);
}
