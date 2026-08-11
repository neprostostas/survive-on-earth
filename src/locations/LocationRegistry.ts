import type { RegionId } from "./RegionRegistry.ts";
import { getRegion } from "./RegionRegistry.ts";

export type LocationId =
  | "home"
  | "pine-woods"
  | "limestone-ridge"
  | "dense-forest"
  | "abandoned-camp"
  | "bunker-echo"
  | "rocky-outcrop"
  | "old-highway"
  | "gas-station"
  | "derelict-motel"
  | "industrial-yard"
  | "abandoned-factory"
  | "overgrown-farm"
  | "riverbank"
  | "frozen-pine-valley"
  /** Prism ice field — not snowy forest. */
  | "glass-caldera"
  /** Open bronze heath — not autumn thickets or farm. */
  | "copperleaf-basin"
  /** Forded river gorge — not bank reeds or docks. */
  | "silt-cataract"
  | "survivor-camp"
  | "marauder-camp"
  | "underground-depot"
  | "blacksite-ruins"
  | "bunker-echo-f2"
  | "bunker-echo-f3"
  | "bunker-echo-f4"
  | "bunker-echo-f5"
  | "greyhaven-outskirts"
  | "greyhaven-residential"
  | "greyhaven-commercial"
  | "greyhaven-industrial"
  | "greyhaven-hospital-district"
  | "greyhaven-transit"
  | "greyhaven-government"
  | "greyhaven-old-town"
  | "greyhaven-waterfront"
  | "metro-central"
  | "metro-flooded"
  | "metro-security"
  | "city-sewers"
  | "abandoned-hospital"
  | "ironbound-prison"
  | "wayfarer-airport"
  | "smuggler-harbor"
  | "coastal-power-plant"
  | "ridge-dam"
  | "deep-mine"
  | "blacksite-core"
  | "helix-core"
  | "exclusion-safehouse"
  | "exclusion-wastes"
  | "hunters-cabin"
  | "smuggler-cache"
  | "forgotten-observatory"
  | "swamp-hollow"
  | "desert-ruin"
  | "ironbound-fort"
  | "wayfarer-post"
  | "ash-jackal-outpost";

export type LocationKind =
  | "home"
  | "resource"
  | "danger"
  | "bunker"
  | "event"
  | "dungeon"
  | "hub"
  | "indoor"
  | "underground"
  | "boss"
  | "npc-hub";

export type DiscoveryState = "hidden" | "undiscovered" | "discovered" | "visited" | "completed";

export interface LocationDefinition {
  readonly id: LocationId;
  readonly title: string;
  readonly difficulty: 1 | 2 | 3 | 4 | 5;
  readonly energyCost: number;
  readonly type: LocationKind;
  readonly regionId: RegionId;
  readonly unlockedByDefault: boolean;
  readonly resourceProfile: string;
  readonly enemyProfile: string;
  readonly description: string;
  readonly recommendedGear: string;
  readonly coldExposure?: number;
  readonly resettable?: boolean;
  readonly parentLocation?: LocationId;
  readonly floors?: readonly LocationId[];
}

function loc(partial: LocationDefinition): LocationDefinition {
  return Object.freeze({ ...partial, coldExposure: partial.coldExposure ?? 0, resettable: partial.resettable ?? partial.type !== "home" });
}

export const LOCATION_REGISTRY: readonly LocationDefinition[] = Object.freeze([
  loc({
    id: "home",
    title: "Home Base",
    difficulty: 1,
    energyCost: 0,
    type: "home",
    regionId: "green",
    unlockedByDefault: true,
    resourceProfile: "starter",
    enemyProfile: "none",
    description: "Safe buildable camp. Respawn and storage hub.",
    recommendedGear: "None",
  }),
  loc({
    id: "pine-woods",
    title: "Pine Woods",
    difficulty: 1,
    energyCost: 8,
    type: "resource",
    regionId: "green",
    unlockedByDefault: true,
    resourceProfile: "pine-fiber-berries",
    enemyProfile: "light-zombies",
    description: "Softwood trees, plant fiber, and berries.",
    recommendedGear: "Hatchet",
  }),
  loc({
    id: "limestone-ridge",
    title: "Limestone Ridge",
    difficulty: 2,
    energyCost: 12,
    type: "resource",
    regionId: "green",
    unlockedByDefault: true,
    resourceProfile: "limestone-rock",
    enemyProfile: "medium-zombies",
    description: "Rocky outcrops rich in limestone.",
    recommendedGear: "Pickaxe",
  }),
  loc({
    id: "dense-forest",
    title: "Autumn Thickets",
    difficulty: 3,
    energyCost: 16,
    type: "danger",
    regionId: "green",
    unlockedByDefault: false,
    resourceProfile: "dense-pine",
    enemyProfile: "heavy-zombies",
    description: "Thick cover and stronger infected.",
    recommendedGear: "Spear + Bandages",
  }),
  loc({
    id: "abandoned-camp",
    title: "Abandoned Camp",
    difficulty: 2,
    energyCost: 14,
    type: "danger",
    regionId: "yellow",
    unlockedByDefault: true,
    resourceProfile: "loot-crates",
    enemyProfile: "camp-zombies",
    description: "Ruined tents and supply crates.",
    recommendedGear: "Melee weapon",
  }),
  loc({
    id: "rocky-outcrop",
    title: "Rocky Outcrop",
    difficulty: 2,
    energyCost: 11,
    type: "resource",
    regionId: "yellow",
    unlockedByDefault: false,
    resourceProfile: "ore-stone",
    enemyProfile: "medium-zombies",
    description: "Scattered ore and stone deposits.",
    recommendedGear: "Pickaxe",
  }),
  loc({
    id: "old-highway",
    title: "Old Highway",
    difficulty: 2,
    energyCost: 12,
    type: "resource",
    regionId: "yellow",
    unlockedByDefault: true,
    resourceProfile: "scrap-vehicles",
    enemyProfile: "road-infected",
    description: "Damaged road, wrecked cars, scrap metal, roadside caches.",
    recommendedGear: "Crowbar",
  }),
  loc({
    id: "gas-station",
    title: "Abandoned Gas Station",
    difficulty: 2,
    energyCost: 13,
    type: "danger",
    regionId: "yellow",
    unlockedByDefault: false,
    resourceProfile: "fuel-scrap",
    enemyProfile: "road-infected",
    description: "Ruined pumps, convenience store shell, mechanical loot.",
    recommendedGear: "Melee + flashlight",
  }),
  loc({
    id: "derelict-motel",
    title: "Derelict Motel",
    difficulty: 3,
    energyCost: 15,
    type: "indoor",
    regionId: "yellow",
    unlockedByDefault: false,
    resourceProfile: "room-loot",
    enemyProfile: "indoor-infected",
    description: "Exterior wing, reception, locked rooms, rare chest.",
    recommendedGear: "Weapon + lock tools",
  }),
  loc({
    id: "industrial-yard",
    title: "Industrial Yard",
    difficulty: 3,
    energyCost: 16,
    type: "resource",
    regionId: "industrial",
    unlockedByDefault: false,
    resourceProfile: "metal-containers",
    enemyProfile: "industrial-infected",
    description: "Shipping containers, scrap piles, machinery, rare components.",
    recommendedGear: "Reinforced tools",
  }),
  loc({
    id: "abandoned-factory",
    title: "Abandoned Factory",
    difficulty: 4,
    energyCost: 18,
    type: "dungeon",
    regionId: "industrial",
    unlockedByDefault: false,
    resourceProfile: "factory-industrial",
    enemyProfile: "factory-workers",
    description: "Machine hall, offices, locked warehouse. Power puzzle compatible.",
    recommendedGear: "Armor + ranged",
  }),
  loc({
    id: "overgrown-farm",
    title: "Harvest Fields",
    difficulty: 2,
    energyCost: 12,
    type: "resource",
    regionId: "green",
    unlockedByDefault: true,
    resourceProfile: "food-seeds",
    enemyProfile: "farm-infected",
    description: "Farmhouse, barn, crop fields, food and seed loot.",
    recommendedGear: "Hatchet",
  }),
  loc({
    id: "riverbank",
    title: "Riverbank",
    difficulty: 1,
    energyCost: 10,
    type: "resource",
    regionId: "green",
    unlockedByDefault: true,
    resourceProfile: "fish-fiber-berries",
    enemyProfile: "light-zombies",
    description: "Water edge, reeds, fishing spots, driftwood.",
    recommendedGear: "Fishing Rod",
  }),
  loc({
    id: "frozen-pine-valley",
    title: "Frozen Pine Valley",
    difficulty: 4,
    energyCost: 20,
    type: "danger",
    regionId: "northern",
    unlockedByDefault: false,
    resourceProfile: "rare-wood-ore",
    enemyProfile: "cold-infected",
    description: "Snow-lit valley, rare timber and ore. Extreme cold.",
    recommendedGear: "Winter clothing",
    coldExposure: 0.9,
  }),
  loc({
    id: "glass-caldera",
    title: "Glass Caldera",
    difficulty: 4,
    energyCost: 22,
    type: "danger",
    regionId: "northern",
    unlockedByDefault: false,
    resourceProfile: "crystal-ice-ore",
    enemyProfile: "prism-hunters",
    description: "Wind-scoured ice basin of mirror plates and spectral light. No timber, only glass and mineral ice.",
    recommendedGear: "Winter gear + spiked boots",
    coldExposure: 0.95,
  }),
  loc({
    id: "copperleaf-basin",
    title: "Copperleaf Basin",
    difficulty: 3,
    energyCost: 14,
    type: "resource",
    regionId: "green",
    unlockedByDefault: false,
    resourceProfile: "bronze-fiber-herbs",
    enemyProfile: "heath-hosts",
    description: "Open copper heath ringed by standing stones — a late-autumn amphitheater without woods or fields.",
    recommendedGear: "Knife + warm midlayer",
  }),
  loc({
    id: "silt-cataract",
    title: "Silt Cataract",
    difficulty: 2,
    energyCost: 12,
    type: "resource",
    regionId: "green",
    unlockedByDefault: true,
    resourceProfile: "silt-fiber-scrap",
    enemyProfile: "ford-patrol",
    description: "Braided gorge river under a wrecked cable span. Fords, basalt columns, roaring whitewater — no pier docks.",
    recommendedGear: "Waterproof boots",
  }),
  loc({
    id: "survivor-camp",
    title: "Survivor Camp",
    difficulty: 1,
    energyCost: 9,
    type: "npc-hub",
    regionId: "green",
    unlockedByDefault: true,
    resourceProfile: "trade",
    enemyProfile: "none",
    description: "Friendly hub with traders, quests, and safe firelight.",
    recommendedGear: "Trade goods",
  }),
  loc({
    id: "marauder-camp",
    title: "Marauder Camp",
    difficulty: 4,
    energyCost: 18,
    type: "danger",
    regionId: "red",
    unlockedByDefault: false,
    resourceProfile: "bandit-loot",
    enemyProfile: "marauders",
    description: "Hostile camp with guards, storage, and a leader.",
    recommendedGear: "Ranged + armor",
  }),
  loc({
    id: "underground-depot",
    title: "Underground Depot",
    difficulty: 4,
    energyCost: 19,
    type: "dungeon",
    regionId: "underground",
    unlockedByDefault: false,
    resourceProfile: "mechanical-loot",
    enemyProfile: "depot-infected",
    description: "Tunnels, warehouse bays, generators, locked vault.",
    recommendedGear: "Light source + weapons",
  }),
  loc({
    id: "bunker-echo",
    title: "Bunker Echo",
    difficulty: 4,
    energyCost: 20,
    type: "bunker",
    regionId: "underground",
    unlockedByDefault: false,
    resourceProfile: "bunker-loot",
    enemyProfile: "bunker-infected",
    description: "Underground complex. Access card may be required.",
    recommendedGear: "Access Card + gear",
    floors: ["bunker-echo", "bunker-echo-f2", "bunker-echo-f3", "bunker-echo-f4", "bunker-echo-f5"],
  }),
  loc({
    id: "bunker-echo-f2",
    title: "Bunker Echo · Floor 2",
    difficulty: 4,
    energyCost: 0,
    type: "underground",
    regionId: "underground",
    unlockedByDefault: false,
    resourceProfile: "bunker-mid",
    enemyProfile: "bunker-security",
    description: "Security corridor, barracks, medical, locked armory.",
    recommendedGear: "Security Level 2",
    parentLocation: "bunker-echo",
  }),
  loc({
    id: "bunker-echo-f3",
    title: "Bunker Echo · Floor 3",
    difficulty: 5,
    energyCost: 0,
    type: "boss",
    regionId: "underground",
    unlockedByDefault: false,
    resourceProfile: "bunker-deep",
    enemyProfile: "warden-boss",
    description: "Labs, toxic sections, generator, boss approach.",
    recommendedGear: "Gas mask + elite gear",
    parentLocation: "bunker-echo",
  }),
  loc({
    id: "blacksite-ruins",
    title: "Blacksite Ruins",
    difficulty: 5,
    energyCost: 28,
    type: "dungeon",
    regionId: "red",
    unlockedByDefault: false,
    resourceProfile: "elite-tech",
    enemyProfile: "elite-mixed",
    description: "Highest-danger static ruins. Locked vaults and elites.",
    recommendedGear: "Endgame gear",
  }),  loc({
    id: "bunker-echo-f4",
    title: "Bunker Echo · Floor 4",
    difficulty: 5,
    energyCost: 0,
    type: "underground",
    regionId: "underground",
    unlockedByDefault: false,
    resourceProfile: "bunker-command",
    enemyProfile: "bunker-elites",
    description: "Command level, armory vaults, and server halls.",
    recommendedGear: "Security 3 + gas mask",
    parentLocation: "bunker-echo",
  }),
  loc({
    id: "bunker-echo-f5",
    title: "Bunker Echo · Floor 5",
    difficulty: 5,
    energyCost: 0,
    type: "underground",
    regionId: "underground",
    unlockedByDefault: false,
    resourceProfile: "bunker-reactor",
    enemyProfile: "reactor-guardians",
    description: "Utility reactor level with rare components.",
    recommendedGear: "Endgame hazard kit",
    parentLocation: "bunker-echo",
  }),
  loc({
    id: "greyhaven-outskirts",
    title: "Greyhaven Outskirts",
    difficulty: 3,
    energyCost: 18,
    type: "danger",
    regionId: "greyhaven",
    unlockedByDefault: false,
    resourceProfile: "urban-entry",
    enemyProfile: "urban-light",
    description: "Checkpoints, motels, and cracked highways into the city.",
    recommendedGear: "Mid-tier armor",
  }),
  loc({
    id: "greyhaven-residential",
    title: "Residential Ruins",
    difficulty: 3,
    energyCost: 20,
    type: "danger",
    regionId: "greyhaven",
    unlockedByDefault: false,
    resourceProfile: "household",
    enemyProfile: "urban-infected",
    description: "Apartments, garages, kitchens, and hidden caches.",
    recommendedGear: "Melee + bags",
  }),
  loc({
    id: "greyhaven-commercial",
    title: "Commerce Grid",
    difficulty: 4,
    energyCost: 22,
    type: "danger",
    regionId: "greyhaven",
    unlockedByDefault: false,
    resourceProfile: "retail-electronics",
    enemyProfile: "dense-infected",
    description: "Supermarket shells, offices, and parking decks.",
    recommendedGear: "Ranged weapon",
  }),
  loc({
    id: "greyhaven-industrial",
    title: "Greyhaven Machine Ward",
    difficulty: 4,
    energyCost: 24,
    type: "danger",
    regionId: "greyhaven",
    unlockedByDefault: false,
    resourceProfile: "city-industrial",
    enemyProfile: "industrial-hostile",
    description: "Pipe networks, yards, scrap, and scavenger crews.",
    recommendedGear: "Tools + armor",
  }),
  loc({
    id: "greyhaven-hospital-district",
    title: "Hospital District",
    difficulty: 4,
    energyCost: 22,
    type: "dungeon",
    regionId: "greyhaven",
    unlockedByDefault: false,
    resourceProfile: "medical-district",
    enemyProfile: "medical-infected",
    description: "Streets around the mega-hospital complex.",
    recommendedGear: "Medical gear + gas mask",
  }),
  loc({
    id: "greyhaven-transit",
    title: "Transit Spine",
    difficulty: 4,
    energyCost: 21,
    type: "danger",
    regionId: "greyhaven",
    unlockedByDefault: false,
    resourceProfile: "transit-loot",
    enemyProfile: "urban-mixed",
    description: "Bus depots, overpasses, and metro accesses.",
    recommendedGear: "Light source",
  }),
  loc({
    id: "greyhaven-government",
    title: "Civic Quarters",
    difficulty: 5,
    energyCost: 26,
    type: "danger",
    regionId: "greyhaven",
    unlockedByDefault: false,
    resourceProfile: "security-loot",
    enemyProfile: "security-infected",
    description: "Administrative ruins and security vaults.",
    recommendedGear: "Access gear",
  }),
  loc({
    id: "greyhaven-old-town",
    title: "Old Town",
    difficulty: 4,
    energyCost: 23,
    type: "danger",
    regionId: "greyhaven",
    unlockedByDefault: false,
    resourceProfile: "collectible-dense",
    enemyProfile: "alley-ambush",
    description: "Narrow alleys, courtyards, and secret doors.",
    recommendedGear: "Stealth + melee",
  }),
  loc({
    id: "greyhaven-waterfront",
    title: "Waterfront Docks",
    difficulty: 4,
    energyCost: 24,
    type: "danger",
    regionId: "greyhaven",
    unlockedByDefault: false,
    resourceProfile: "dock-industrial",
    enemyProfile: "smuggler-mixed",
    description: "Warehouses, cranes, and flooded warehouses.",
    recommendedGear: "Industrial kit",
  }),
  loc({
    id: "metro-central",
    title: "Metro Central",
    difficulty: 4,
    energyCost: 20,
    type: "underground",
    regionId: "greyhaven",
    unlockedByDefault: false,
    resourceProfile: "metro-loot",
    enemyProfile: "tunnel-infected",
    description: "Main station, passenger cars, maintenance bays.",
    recommendedGear: "Torch + weapon",
  }),
  loc({
    id: "metro-flooded",
    title: "Flooded Station",
    difficulty: 4,
    energyCost: 22,
    type: "underground",
    regionId: "greyhaven",
    unlockedByDefault: false,
    resourceProfile: "flooded-loot",
    enemyProfile: "water-infected",
    description: "Knee-deep tunnels and collapsed platforms.",
    recommendedGear: "Hazard gear",
  }),
  loc({
    id: "metro-security",
    title: "Metro Security Hub",
    difficulty: 5,
    energyCost: 24,
    type: "dungeon",
    regionId: "greyhaven",
    unlockedByDefault: false,
    resourceProfile: "metro-security",
    enemyProfile: "sentinel-guards",
    description: "Powered doors, terminals, underground boss approach.",
    recommendedGear: "Keycards + mid-end gear",
  }),
  loc({
    id: "city-sewers",
    title: "Greyhaven Sewers",
    difficulty: 4,
    energyCost: 19,
    type: "dungeon",
    regionId: "greyhaven",
    unlockedByDefault: false,
    resourceProfile: "sewer-industrial",
    enemyProfile: "sewer-nests",
    description: "Drainage chambers, valves, and toxic nests.",
    recommendedGear: "Gas mask",
  }),
  loc({
    id: "abandoned-hospital",
    title: "St. Marrow Hospital",
    difficulty: 5,
    energyCost: 25,
    type: "dungeon",
    regionId: "greyhaven",
    unlockedByDefault: false,
    resourceProfile: "hospital-mega",
    enemyProfile: "hospital-boss-line",
    description: "Multi-wing medical dungeon with quarantine wings.",
    recommendedGear: "Advanced medical + weapons",
  }),
  loc({
    id: "ironbound-prison",
    title: "Ironbound Prison",
    difficulty: 5,
    energyCost: 26,
    type: "dungeon",
    regionId: "industrial",
    unlockedByDefault: false,
    resourceProfile: "prison-armory",
    enemyProfile: "inmate-guards",
    description: "Cell blocks, yards, and contested armory.",
    recommendedGear: "Heavy combat",
  }),
  loc({
    id: "wayfarer-airport",
    title: "Wayfarer Field",
    difficulty: 4,
    energyCost: 24,
    type: "dungeon",
    regionId: "yellow",
    unlockedByDefault: false,
    resourceProfile: "airport-cargo",
    enemyProfile: "airport-mixed",
    description: "Terminal, hangars, runway, and control tower.",
    recommendedGear: "Ranged + electronics scav",
  }),
  loc({
    id: "smuggler-harbor",
    title: "Summer Cove Harbor",
    difficulty: 4,
    energyCost: 23,
    type: "danger",
    regionId: "industrial",
    unlockedByDefault: false,
    resourceProfile: "harbor-mech",
    enemyProfile: "harbor-hostiles",
    description: "Container yards, customs shells, dry dock.",
    recommendedGear: "Mechanical tools",
  }),
  loc({
    id: "coastal-power-plant",
    title: "Coastal Power Plant",
    difficulty: 5,
    energyCost: 27,
    type: "dungeon",
    regionId: "industrial",
    unlockedByDefault: false,
    resourceProfile: "power-components",
    enemyProfile: "plant-guardians",
    description: "Turbine halls and transformer yards. Regional power objective.",
    recommendedGear: "Electrical isolation kit",
  }),
  loc({
    id: "ridge-dam",
    title: "Ridge Dam",
    difficulty: 4,
    energyCost: 24,
    type: "dungeon",
    regionId: "industrial",
    unlockedByDefault: false,
    resourceProfile: "dam-mech",
    enemyProfile: "flooded-guardians",
    description: "Water control, flooded service tunnels.",
    recommendedGear: "Tools + warm clothing",
  }),
  loc({
    id: "deep-mine",
    title: "Deep Mine",
    difficulty: 4,
    energyCost: 22,
    type: "dungeon",
    regionId: "underground",
    unlockedByDefault: false,
    resourceProfile: "rare-veins",
    enemyProfile: "cave-creatures",
    description: "Elevator shafts, mineral tunnels, nest chambers.",
    recommendedGear: "Advanced pick + light",
  }),
  loc({
    id: "blacksite-core",
    title: "Blacksite Core",
    difficulty: 5,
    energyCost: 30,
    type: "dungeon",
    regionId: "red",
    unlockedByDefault: false,
    resourceProfile: "blacksite-core",
    enemyProfile: "blacksite-boss",
    description: "Containment, research, and vault below the ruins.",
    recommendedGear: "Endgame loadout",
  }),
  loc({
    id: "helix-core",
    title: "Helix Core",
    difficulty: 5,
    energyCost: 35,
    type: "boss",
    regionId: "exclusion",
    unlockedByDefault: false,
    resourceProfile: "helix-endgame",
    enemyProfile: "helix-warden",
    description: "Final research facility. Multi-phase sanctuary.",
    recommendedGear: "Full endgame set",
  }),
  loc({
    id: "exclusion-safehouse",
    title: "Ashen Safehouse",
    difficulty: 3,
    energyCost: 28,
    type: "hub",
    regionId: "exclusion",
    unlockedByDefault: false,
    resourceProfile: "safehouse",
    enemyProfile: "none",
    description: "Small shelter on the exclusion fringe.",
    recommendedGear: "Filters",
  }),
  loc({
    id: "exclusion-wastes",
    title: "Ashen Wastes",
    difficulty: 5,
    energyCost: 32,
    type: "danger",
    regionId: "exclusion",
    unlockedByDefault: false,
    resourceProfile: "exclusion-rare",
    enemyProfile: "exclusion-elites",
    description: "Contaminated flats with rare salvage veins.",
    recommendedGear: "Hazmat + filters",
  }),
  loc({
    id: "hunters-cabin",
    title: "Hunter's Cabin",
    difficulty: 2,
    energyCost: 14,
    type: "resource",
    regionId: "green",
    unlockedByDefault: false,
    resourceProfile: "hunting-cache",
    enemyProfile: "wildlife-light",
    description: "Hidden cabin with hunting supplies.",
    recommendedGear: "Melee",
  }),
  loc({
    id: "smuggler-cache",
    title: "Smuggler Cache",
    difficulty: 3,
    energyCost: 16,
    type: "event",
    regionId: "yellow",
    unlockedByDefault: false,
    resourceProfile: "smuggler-loot",
    enemyProfile: "ambush",
    description: "Buried goods and tripwires.",
    recommendedGear: "Lock tools",
  }),
  loc({
    id: "forgotten-observatory",
    title: "Forgotten Observatory",
    difficulty: 3,
    energyCost: 18,
    type: "danger",
    regionId: "northern",
    unlockedByDefault: false,
    resourceProfile: "optics-electronics",
    enemyProfile: "cold-elites",
    description: "Hilltop ruin with optical components.",
    recommendedGear: "Winter kit",
  }),
  loc({
    id: "swamp-hollow",
    title: "Swamp Hollow",
    difficulty: 3,
    energyCost: 17,
    type: "resource",
    regionId: "swamp",
    unlockedByDefault: false,
    resourceProfile: "swamp-plants",
    enemyProfile: "swamp-infected",
    description: "Reeds, toxic plants, and shallow water paths.",
    recommendedGear: "Boot armor",
  }),
  loc({
    id: "desert-ruin",
    title: "Sunken Ruin",
    difficulty: 4,
    energyCost: 20,
    type: "danger",
    regionId: "desert",
    unlockedByDefault: false,
    resourceProfile: "desert-minerals",
    enemyProfile: "arid-infected",
    description: "Sand-blown stone and rare mineral pockets.",
    recommendedGear: "Heat cloth",
  }),
  loc({
    id: "ironbound-fort",
    title: "Ironbound Fort",
    difficulty: 4,
    energyCost: 20,
    type: "npc-hub",
    regionId: "industrial",
    unlockedByDefault: false,
    resourceProfile: "faction-industrial",
    enemyProfile: "none",
    description: "Fortified industrial settlement of the Ironbound Collective.",
    recommendedGear: "Metal trade goods",
  }),
  loc({
    id: "wayfarer-post",
    title: "Wayfarer Relay",
    difficulty: 2,
    energyCost: 14,
    type: "npc-hub",
    regionId: "yellow",
    unlockedByDefault: false,
    resourceProfile: "faction-trade",
    enemyProfile: "none",
    description: "Scout network trading post and map intelligence.",
    recommendedGear: "Travel goods",
  }),
  loc({
    id: "ash-jackal-outpost",
    title: "Ash Jackal Outpost",
    difficulty: 4,
    energyCost: 19,
    type: "danger",
    regionId: "red",
    unlockedByDefault: false,
    resourceProfile: "raider-loot",
    enemyProfile: "ash-jackals",
    description: "Hostile raider fortifications.",
    recommendedGear: "Combat gear",
  }),
]);


export function getLocation(id: LocationId): LocationDefinition {
  const found = LOCATION_REGISTRY.find((l) => l.id === id);
  if (!found) throw new Error(`Unknown location: ${id}`);
  return found;
}

export function effectiveColdExposure(id: LocationId): number {
  const def = getLocation(id);
  if (def.coldExposure !== undefined && def.coldExposure > 0) return def.coldExposure;
  return getRegion(def.regionId).coldExposure;
}

export function effectiveEnergyCost(id: LocationId, mode: "walk" | "run" | "vehicle"): number {
  const def = getLocation(id);
  const region = getRegion(def.regionId);
  let cost = def.energyCost * region.travelCostMul;
  if (mode === "run") cost *= 1.35;
  if (mode === "vehicle") cost = Math.max(0, cost * 0.15);
  return Math.ceil(cost);
}
