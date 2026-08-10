/** World regions — high-level geography and travel costs bias. */
export type RegionId =
  | "green"
  | "yellow"
  | "red"
  | "industrial"
  | "underground"
  | "northern"
  | "greyhaven"
  | "swamp"
  | "desert"
  | "exclusion";

export interface RegionDefinition {
  readonly id: RegionId;
  readonly title: string;
  readonly difficultyBias: number;
  readonly environment: "temperate" | "arid" | "hostile" | "industrial" | "underground" | "cold" | "urban" | "swamp" | "desert" | "contaminated";
  readonly lootQuality: 1 | 2 | 3 | 4 | 5;
  readonly enemyPool: string;
  readonly resourceProfile: string;
  readonly travelCostMul: number;
  readonly coldExposure: number;
  readonly heatExposure: number;
}

export const REGION_REGISTRY: readonly RegionDefinition[] = Object.freeze([
  Object.freeze({
    id: "green" as const,
    title: "Green Region",
    difficultyBias: 1,
    environment: "temperate" as const,
    lootQuality: 1 as const,
    enemyPool: "light-infected",
    resourceProfile: "wood-fiber-food",
    travelCostMul: 1,
    coldExposure: 0,
    heatExposure: 0.1,
  }),
  Object.freeze({
    id: "yellow" as const,
    title: "Yellow Region",
    difficultyBias: 2,
    environment: "arid" as const,
    lootQuality: 2 as const,
    enemyPool: "mixed-infected",
    resourceProfile: "scrap-stone",
    travelCostMul: 1.15,
    coldExposure: 0,
    heatExposure: 0.35,
  }),
  Object.freeze({
    id: "red" as const,
    title: "Red Region",
    difficultyBias: 4,
    environment: "hostile" as const,
    lootQuality: 4 as const,
    enemyPool: "elite-infected",
    resourceProfile: "rare-ore",
    travelCostMul: 1.4,
    coldExposure: 0.05,
    heatExposure: 0.15,
  }),
  Object.freeze({
    id: "industrial" as const,
    title: "Industrial Coast",
    difficultyBias: 3,
    environment: "industrial" as const,
    lootQuality: 3 as const,
    enemyPool: "industrial-infected",
    resourceProfile: "metal-wiring",
    travelCostMul: 1.25,
    coldExposure: 0,
    heatExposure: 0.2,
  }),
  Object.freeze({
    id: "underground" as const,
    title: "Underground Region",
    difficultyBias: 4,
    environment: "underground" as const,
    lootQuality: 4 as const,
    enemyPool: "bunker-infected",
    resourceProfile: "bunker-tech",
    travelCostMul: 1.35,
    coldExposure: 0.2,
    heatExposure: 0,
  }),
  Object.freeze({
    id: "northern" as const,
    title: "Northern Region",
    difficultyBias: 3,
    environment: "cold" as const,
    lootQuality: 3 as const,
    enemyPool: "cold-infected",
    resourceProfile: "rare-wood-ore",
    travelCostMul: 1.3,
    coldExposure: 0.85,
    heatExposure: 0,
  }),
  Object.freeze({
    id: "greyhaven" as const,
    title: "Greyhaven",
    difficultyBias: 4,
    environment: "urban" as const,
    lootQuality: 4 as const,
    enemyPool: "urban-mixed",
    resourceProfile: "urban-scrap-tech",
    travelCostMul: 1.45,
    coldExposure: 0.05,
    heatExposure: 0.1,
  }),
  Object.freeze({
    id: "swamp" as const,
    title: "Low Marsh",
    difficultyBias: 3,
    environment: "swamp" as const,
    lootQuality: 2 as const,
    enemyPool: "swamp-infected",
    resourceProfile: "fiber-reeds-fish",
    travelCostMul: 1.35,
    coldExposure: 0.15,
    heatExposure: 0.25,
  }),
  Object.freeze({
    id: "desert" as const,
    title: "Southern Barrens",
    difficultyBias: 3,
    environment: "desert" as const,
    lootQuality: 3 as const,
    enemyPool: "arid-infected",
    resourceProfile: "minerals-dust",
    travelCostMul: 1.4,
    coldExposure: 0,
    heatExposure: 0.9,
  }),
  Object.freeze({
    id: "exclusion" as const,
    title: "Ashen Exclusion Zone",
    difficultyBias: 5,
    environment: "contaminated" as const,
    lootQuality: 5 as const,
    enemyPool: "exclusion-elites",
    resourceProfile: "endgame-rare",
    travelCostMul: 1.7,
    coldExposure: 0.1,
    heatExposure: 0.2,
  }),
]);

export function getRegion(id: RegionId): RegionDefinition {
  const found = REGION_REGISTRY.find((r) => r.id === id);
  if (!found) throw new Error(`Unknown region: ${id}`);
  return found;
}
