import type { LocationId } from "./LocationRegistry.ts";
import { LOCATION_REGISTRY } from "./LocationRegistry.ts";

/**
 * Overworld pin positions (0..1 normalized on the global map canvas).
 * Primary travel layout — original Survive on Earth geography, not LDOE.
 */
export interface MapPin {
  readonly id: LocationId;
  readonly x: number;
  readonly y: number;
}

/** Hand-placed anchors for the starter ring; rest filled deterministically. */
const ANCHORS: Partial<Record<LocationId, { x: number; y: number }>> = {
  home: { x: 0.42, y: 0.55 },
  "pine-woods": { x: 0.52, y: 0.48 },
  "limestone-ridge": { x: 0.34, y: 0.48 },
  "dense-forest": { x: 0.58, y: 0.40 },
  "abandoned-camp": { x: 0.48, y: 0.60 },
  "old-highway": { x: 0.62, y: 0.58 },
  "gas-station": { x: 0.68, y: 0.52 },
  "survivor-camp": { x: 0.38, y: 0.38 },
  "riverbank": { x: 0.28, y: 0.58 },
  "rocky-outcrop": { x: 0.30, y: 0.36 },
  "overgrown-farm": { x: 0.46, y: 0.68 },
  "derelict-motel": { x: 0.72, y: 0.44 },
  "industrial-yard": { x: 0.74, y: 0.62 },
  "abandoned-factory": { x: 0.78, y: 0.55 },
  "bunker-echo": { x: 0.22, y: 0.44 },
  "frozen-pine-valley": { x: 0.48, y: 0.22 },
  "marauder-camp": { x: 0.66, y: 0.36 },
  "underground-depot": { x: 0.26, y: 0.52 },
  "blacksite-ruins": { x: 0.18, y: 0.30 },
  "greyhaven-outskirts": { x: 0.82, y: 0.42 },
  "greyhaven-residential": { x: 0.86, y: 0.38 },
  "greyhaven-commercial": { x: 0.88, y: 0.44 },
  "greyhaven-industrial": { x: 0.90, y: 0.50 },
  "greyhaven-hospital-district": { x: 0.84, y: 0.34 },
  "greyhaven-transit": { x: 0.86, y: 0.48 },
  "greyhaven-government": { x: 0.88, y: 0.32 },
  "greyhaven-old-town": { x: 0.84, y: 0.52 },
  "greyhaven-waterfront": { x: 0.80, y: 0.56 },
  "metro-central": { x: 0.83, y: 0.45 },
  "city-sewers": { x: 0.81, y: 0.50 },
  "abandoned-hospital": { x: 0.70, y: 0.30 },
  "ironbound-prison": { x: 0.76, y: 0.70 },
  "wayfarer-airport": { x: 0.60, y: 0.72 },
  "smuggler-harbor": { x: 0.54, y: 0.78 },
  "coastal-power-plant": { x: 0.48, y: 0.82 },
  "ridge-dam": { x: 0.36, y: 0.75 },
  "deep-mine": { x: 0.20, y: 0.62 },
  "blacksite-core": { x: 0.14, y: 0.28 },
  "helix-core": { x: 0.10, y: 0.18 },
  "exclusion-safehouse": { x: 0.16, y: 0.16 },
  "exclusion-wastes": { x: 0.12, y: 0.12 },
  "hunters-cabin": { x: 0.54, y: 0.34 },
  "smuggler-cache": { x: 0.58, y: 0.70 },
  "forgotten-observatory": { x: 0.40, y: 0.18 },
  "swamp-hollow": { x: 0.64, y: 0.76 },
  "desert-ruin": { x: 0.50, y: 0.88 },
  "ironbound-fort": { x: 0.72, y: 0.66 },
  "wayfarer-post": { x: 0.56, y: 0.64 },
  "ash-jackal-outpost": { x: 0.68, y: 0.68 },
};

function hash01(s: string, salt: number): number {
  let h = salt >>> 0;
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0);
  return (h % 1000) / 1000;
}

export function mapPinFor(id: LocationId): MapPin {
  const a = ANCHORS[id];
  if (a) return Object.freeze({ id, x: a.x, y: a.y });
  return Object.freeze({
    id,
    x: 0.12 + hash01(id, 17) * 0.76,
    y: 0.12 + hash01(id, 41) * 0.76,
  });
}

export function primaryMapLocations(): readonly MapPin[] {
  return LOCATION_REGISTRY.filter((l) => !l.parentLocation).map((l) => mapPinFor(l.id));
}

/** World units: how far (in map 0..1 space) counts as "near enough to enter". */
export const OVERWORLD_ENTER_RADIUS = 0.045;
export const OVERWORLD_WALK_SPEED = 0.12; // fraction/sec
export const OVERWORLD_RUN_SPEED = 0.20;
export const OVERWORLD_ENERGY_WALK = 2.2; // /sec
export const OVERWORLD_ENERGY_RUN = 4.5;
