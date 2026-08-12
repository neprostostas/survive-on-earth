/**
 * Bind offline raid sites to overworld location anchors (pure domain).
 */
import type { LocationId } from "../locations/LocationRegistry.ts";
import { mapPinFor } from "../locations/MapLayout.ts";
import type { RaidSite } from "./RaidSystem.ts";

/** Hostile / high-danger compounds that can host map raid sites. */
export const RAID_ANCHOR_POOL: readonly LocationId[] = Object.freeze([
  "ash-jackal-outpost",
  "marauder-camp",
  "industrial-yard",
  "abandoned-factory",
  "derelict-motel",
]);

export function raidAnchorLocation(site: { readonly seed: number }): LocationId {
  const i = Math.abs(site.seed) % RAID_ANCHOR_POOL.length;
  return RAID_ANCHOR_POOL[i]!;
}

export function unclearedRaidAt(
  sites: readonly RaidSite[],
  locationId: LocationId,
): RaidSite | null {
  for (const s of sites) {
    if (s.cleared) continue;
    if (raidAnchorLocation(s) === locationId) return s;
  }
  return null;
}

export interface RaidMapPin {
  readonly raidId: string;
  readonly title: string;
  readonly threat: number;
  readonly locationId: LocationId;
  readonly x: number;
  readonly y: number;
}

/** Map pins for open (uncleared) raid compounds. */
export function raidMapPins(sites: readonly RaidSite[]): readonly RaidMapPin[] {
  const out: RaidMapPin[] = [];
  for (const s of sites) {
    if (s.cleared) continue;
    const locationId = raidAnchorLocation(s);
    const pin = mapPinFor(locationId);
    out.push(Object.freeze({
      raidId: s.id,
      title: s.title,
      threat: s.threat,
      locationId,
      x: pin.x,
      y: pin.y,
    }));
  }
  return Object.freeze(out);
}

/** Extra hostiles beyond the location default when a raid is active. */
export function raidReinforcementCount(site: RaidSite): number {
  return Math.max(4, Math.min(14, site.enemyCount));
}
