/**
 * Map locations ↔ dungeon reset ids (pure domain).
 */
import type { LocationId } from "../locations/LocationRegistry.ts";
import {
  DUNGEON_RESET_CONFIGS,
  type DungeonId,
} from "./DungeonReset.ts";

/** Locations that belong to a resettable dungeon compound. */
const DUNGEON_LOCATIONS: Readonly<Record<DungeonId, readonly LocationId[]>> = Object.freeze({
  "bunker-echo": Object.freeze([
    "bunker-echo",
    "bunker-echo-f2",
    "bunker-echo-f3",
    "bunker-echo-f4",
    "bunker-echo-f5",
  ] as const),
  "abandoned-hospital": Object.freeze([
    "abandoned-hospital",
    "greyhaven-hospital-district",
  ] as const),
  "metro-network": Object.freeze([
    "metro-central",
    "metro-flooded",
    "metro-security",
    "city-sewers",
    "greyhaven-transit",
  ] as const),
  blacksite: Object.freeze(["blacksite-ruins", "blacksite-core"] as const),
  "helix-core": Object.freeze(["helix-core"] as const),
  "ironbound-prison": Object.freeze(["ironbound-prison"] as const),
});

/** Lock ids that re-seal when their dungeon cycles. */
const DUNGEON_LOCKS: Readonly<Partial<Record<DungeonId, readonly string[]>>> = Object.freeze({
  "bunker-echo": Object.freeze(["bunker-armory"]),
});

export function dungeonForLocation(locationId: LocationId): DungeonId | null {
  for (const cfg of DUNGEON_RESET_CONFIGS) {
    const locs = DUNGEON_LOCATIONS[cfg.id];
    if (locs?.includes(locationId)) return cfg.id;
  }
  return null;
}

export function locationsForDungeon(id: DungeonId): readonly LocationId[] {
  return DUNGEON_LOCATIONS[id] ?? Object.freeze([]);
}

export function locksForDungeon(id: DungeonId): readonly string[] {
  return DUNGEON_LOCKS[id] ?? Object.freeze([]);
}

export function dungeonTitle(id: DungeonId): string {
  return DUNGEON_RESET_CONFIGS.find((c) => c.id === id)?.title ?? id;
}

export function formatDungeonResetNames(ids: readonly DungeonId[]): string {
  return ids.map(dungeonTitle).join(", ");
}

/** True when the player is standing inside a dungeon that just reset. */
export function playerInsideResetDungeon(
  currentLocation: LocationId,
  resetIds: readonly DungeonId[],
): boolean {
  const here = dungeonForLocation(currentLocation);
  return here !== null && resetIds.includes(here);
}
