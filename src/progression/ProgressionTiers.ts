/** Progression tier model — gates UI hints and design data, not a hard lock engine. */
export type ProgressionTierId =
  | "primitive"
  | "basic-survival"
  | "established"
  | "industrial"
  | "advanced-industrial"
  | "tactical"
  | "hazardous"
  | "endgame";

export interface ProgressionTier {
  readonly id: ProgressionTierId;
  readonly title: string;
  readonly minLevel: number;
  readonly focus: string;
}

export const PROGRESSION_TIERS: readonly ProgressionTier[] = Object.freeze([
  Object.freeze({ id: "primitive" as const, title: "Primitive", minLevel: 1, focus: "hand tools, plant fiber, campfire" }),
  Object.freeze({ id: "basic-survival" as const, title: "Basic Survival", minLevel: 3, focus: "hatchet, backpack, basic meals" }),
  Object.freeze({ id: "established" as const, title: "Established Survivor", minLevel: 6, focus: "iron gear, base stations, vehicle start" }),
  Object.freeze({ id: "industrial" as const, title: "Industrial", minLevel: 10, focus: "steel, electronics, Greyhaven outskirts" }),
  Object.freeze({ id: "advanced-industrial" as const, title: "Advanced Industrial", minLevel: 14, focus: "fabrication, ATV, city districts" }),
  Object.freeze({ id: "tactical" as const, title: "Tactical", minLevel: 18, focus: "composite gear, raids, Blacksite" }),
  Object.freeze({ id: "hazardous" as const, title: "Hazardous Zone", minLevel: 22, focus: "filters, exclusion zone, elite dungeons" }),
  Object.freeze({ id: "endgame" as const, title: "Endgame", minLevel: 28, focus: "Helix Core, unique weapons, full base grid" }),
]);

export function tierForLevel(level: number): ProgressionTier {
  let current = PROGRESSION_TIERS[0]!;
  for (const t of PROGRESSION_TIERS) {
    if (level >= t.minLevel) current = t;
  }
  return current;
}
