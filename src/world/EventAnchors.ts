/**
 * Bind offline world events to overworld location anchors (pure domain).
 */
import type { LocationId } from "../locations/LocationRegistry.ts";
import { mapPinFor } from "../locations/MapLayout.ts";
import type { ActiveWorldEvent, WorldEventKind } from "./WorldEventDirector.ts";

/** Default resource / road / outskirts sites for generic events. */
export const EVENT_ANCHOR_POOL: readonly LocationId[] = Object.freeze([
  "pine-woods",
  "rocky-outcrop",
  "swamp-hollow",
  "old-highway",
  "gas-station",
  "derelict-motel",
  "industrial-yard",
  "abandoned-factory",
  "overgrown-farm",
  "riverbank",
  "greyhaven-outskirts",
  "dense-forest",
  "abandoned-camp",
  "desert-ruin",
  "hunters-cabin",
]);

/** Prefer thematic sites when the event kind implies a biome. */
const KIND_POOLS: Readonly<Partial<Record<WorldEventKind, readonly LocationId[]>>> = Object.freeze({
  "medical-camp": Object.freeze(["abandoned-hospital", "greyhaven-hospital-district"] as const),
  "flooded-cache": Object.freeze(["swamp-hollow", "metro-flooded", "silt-cataract"] as const),
  "frozen-cache": Object.freeze(["frozen-pine-valley"] as const),
  "desert-wreck": Object.freeze(["desert-ruin", "glass-caldera"] as const),
  "city-evac": Object.freeze(["greyhaven-residential", "greyhaven-commercial", "greyhaven-transit"] as const),
  "bunker-entrance": Object.freeze(["bunker-echo", "underground-depot", "blacksite-ruins"] as const),
  "marauder-camp-event": Object.freeze(["marauder-camp", "ash-jackal-outpost"] as const),
  "convoy": Object.freeze(["old-highway", "gas-station", "wayfarer-airport"] as const),
  "crash-site": Object.freeze(["old-highway", "wayfarer-airport", "desert-ruin"] as const),
  "infected-nest": Object.freeze(["dense-forest", "abandoned-camp", "city-sewers"] as const),
  "broken-transmitter": Object.freeze(["forgotten-observatory", "coastal-power-plant", "ridge-dam"] as const),
  "scavenger-market": Object.freeze(["survivor-camp", "wayfarer-post", "smuggler-harbor"] as const),
  "rare-trader": Object.freeze(["survivor-camp", "wayfarer-post", "greyhaven-commercial"] as const),
  "trader": Object.freeze(["survivor-camp", "wayfarer-post", "old-highway"] as const),
  "wandering-survivor": Object.freeze(["pine-woods", "riverbank", "hunters-cabin"] as const),
});

export function eventAnchorPoolFor(kind: WorldEventKind): readonly LocationId[] {
  return KIND_POOLS[kind] ?? EVENT_ANCHOR_POOL;
}

export function eventAnchorLocation(event: {
  readonly kind: WorldEventKind;
  readonly seed: number;
}): LocationId {
  const pool = eventAnchorPoolFor(event.kind);
  const i = Math.abs(event.seed) % pool.length;
  return pool[i]!;
}

export function unclaimedEventAt(
  events: readonly ActiveWorldEvent[],
  locationId: LocationId,
): ActiveWorldEvent | null {
  for (const e of events) {
    if (e.claimed) continue;
    if (eventAnchorLocation(e) === locationId) return e;
  }
  return null;
}

export interface EventMapPin {
  readonly eventId: string;
  readonly title: string;
  readonly danger: number;
  readonly kind: WorldEventKind;
  readonly locationId: LocationId;
  readonly x: number;
  readonly y: number;
}

/** Slight offset so event markers don't sit under raid dots on shared sites. */
function pinOffset(seed: number): { dx: number; dy: number } {
  const a = (seed % 7) - 3;
  const b = ((seed * 3) % 7) - 3;
  return { dx: a * 0.004, dy: b * 0.004 };
}

function clamp01(n: number): number {
  return Math.max(0.02, Math.min(0.98, n));
}

/** Map pins for open (unclaimed) world events. */
export function eventMapPins(events: readonly ActiveWorldEvent[]): readonly EventMapPin[] {
  const out: EventMapPin[] = [];
  for (const e of events) {
    if (e.claimed) continue;
    const locationId = eventAnchorLocation(e);
    const pin = mapPinFor(locationId);
    const off = pinOffset(e.seed);
    out.push(Object.freeze({
      eventId: e.id,
      title: e.title,
      danger: e.danger,
      kind: e.kind,
      locationId,
      x: clamp01(pin.x + off.dx),
      y: clamp01(pin.y + off.dy),
    }));
  }
  return Object.freeze(out);
}
