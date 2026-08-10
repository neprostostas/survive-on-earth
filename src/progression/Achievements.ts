/**
 * Local session achievements — not platform / store achievements.
 */
export type AchievementId =
  | "first-harvest"
  | "first-craft"
  | "first-kill"
  | "backpacker"
  | "explorer"
  | "builder"
  | "bunker-survivor"
  | "first-shelter"
  | "armed-survivor"
  | "road-explorer"
  | "bunker-raider"
  | "warden-defeated"
  | "master-crafter"
  | "full-backpack"
  | "treasure-hunter"
  | "city-walker"
  | "faction-ally"
  | "vehicle-rider"
  | "atv-pilot"
  | "power-online"
  | "helix-ascendant"
  | "raid-clearer"
  | "greyhaven-scout"
  | "exclusion-walker"
  | "hospital-cleared"
  | "metro-linked"
  | "survive-day-1"
  | "survive-day-10"
  | "survive-day-50"
  | "first-cook"
  | "first-purify"
  | "gather-logs-50"
  | "gather-stone-50"
  | "gather-ore-25"
  | "craft-100"
  | "fortified-home"
  | "kills-50"
  | "kills-200"
  | "critical-master"
  | "sneak-killer"
  | "metro-boss"
  | "hospital-boss"
  | "swamp-boss"
  | "mine-boss"
  | "blacksite-boss"
  | "farm-first-crop"
  | "fish-first"
  | "map-fragment-finder"
  | "world-event-hunter"
  | "contract-runner"
  | "journal-archivist"
  | "steel-worker"
  | "composite-crafter"
  | "winter-ready"
  | "hazmat-ready"
  | "heavy-armor"
  | "weapon-collector";

export interface AchievementDef {
  readonly id: AchievementId;
  readonly title: string;
  readonly description: string;
  readonly category: "survival" | "exploration" | "combat" | "crafting" | "building" | "endgame" | "gathering" | "boss" | "faction";
}

export const ACHIEVEMENT_DEFS: readonly AchievementDef[] = Object.freeze([
  Object.freeze({ id: "first-harvest" as const, title: "First Harvest", description: "Deplete a resource node", category: "survival" as const }),
  Object.freeze({ id: "first-craft" as const, title: "First Craft", description: "Craft any blueprint", category: "crafting" as const }),
  Object.freeze({ id: "first-kill" as const, title: "First Kill", description: "Defeat an infected", category: "combat" as const }),
  Object.freeze({ id: "backpacker" as const, title: "Backpacker", description: "Equip a backpack", category: "survival" as const }),
  Object.freeze({ id: "explorer" as const, title: "Explorer", description: "Travel to a resource location", category: "exploration" as const }),
  Object.freeze({ id: "builder" as const, title: "Builder", description: "Place a structure", category: "building" as const }),
  Object.freeze({ id: "bunker-survivor" as const, title: "Bunker Survivor", description: "Enter Bunker Echo", category: "exploration" as const }),
  Object.freeze({ id: "first-shelter" as const, title: "First Shelter", description: "Sleep or rest at Home", category: "survival" as const }),
  Object.freeze({ id: "armed-survivor" as const, title: "Armed Survivor", description: "Equip a weapon", category: "combat" as const }),
  Object.freeze({ id: "road-explorer" as const, title: "Road Explorer", description: "Visit the Old Highway", category: "exploration" as const }),
  Object.freeze({ id: "bunker-raider" as const, title: "Bunker Raider", description: "Reach Bunker Floor 3+", category: "exploration" as const }),
  Object.freeze({ id: "warden-defeated" as const, title: "The Warden Defeated", description: "Defeat the Warden", category: "boss" as const }),
  Object.freeze({ id: "master-crafter" as const, title: "Master Crafter", description: "Craft 25 items (tracked session)", category: "crafting" as const }),
  Object.freeze({ id: "full-backpack" as const, title: "Full Backpack", description: "Equip expedition or carrier pack", category: "survival" as const }),
  Object.freeze({ id: "treasure-hunter" as const, title: "Treasure Hunter", description: "Open a rare cache", category: "exploration" as const }),
  Object.freeze({ id: "city-walker" as const, title: "City Walker", description: "Enter Greyhaven outskirts", category: "exploration" as const }),
  Object.freeze({ id: "faction-ally" as const, title: "Trusted Ally", description: "Reach Ally with any friendly faction", category: "faction" as const }),
  Object.freeze({ id: "vehicle-rider" as const, title: "Bike Pilot", description: "Assemble the Salvaged Bike", category: "building" as const }),
  Object.freeze({ id: "atv-pilot" as const, title: "Trailrunner", description: "Assemble the Trailrunner ATV", category: "endgame" as const }),
  Object.freeze({ id: "power-online" as const, title: "Lights On", description: "Power a base generator", category: "building" as const }),
  Object.freeze({ id: "helix-ascendant" as const, title: "Helix Ascendant", description: "Reach Helix Core", category: "endgame" as const }),
  Object.freeze({ id: "raid-clearer" as const, title: "Compound Breaker", description: "Clear a PvE raid site", category: "combat" as const }),
  Object.freeze({ id: "greyhaven-scout" as const, title: "Greyhaven Scout", description: "Visit 3 city districts", category: "exploration" as const }),
  Object.freeze({ id: "exclusion-walker" as const, title: "Ash Walker", description: "Enter the Exclusion Zone", category: "endgame" as const }),
  Object.freeze({ id: "hospital-cleared" as const, title: "Quarantine Over", description: "Complete St. Marrow Hospital objective", category: "combat" as const }),
  Object.freeze({ id: "metro-linked" as const, title: "Metro Linked", description: "Unlock metro central access", category: "exploration" as const }),
  Object.freeze({ id: "survive-day-1" as const, title: "First Dawn", description: "Survive one full day", category: "survival" as const }),
  Object.freeze({ id: "survive-day-10" as const, title: "Ten Days Out", description: "Survive 10 days", category: "survival" as const }),
  Object.freeze({ id: "survive-day-50" as const, title: "Hardened Settler", description: "Survive 50 days", category: "survival" as const }),
  Object.freeze({ id: "first-cook" as const, title: "Campfire Cook", description: "Cook food", category: "survival" as const }),
  Object.freeze({ id: "first-purify" as const, title: "Clear Draught", description: "Purify water", category: "survival" as const }),
  Object.freeze({ id: "gather-logs-50" as const, title: "Timber Hands", description: "Collect 50 wood logs (session)", category: "gathering" as const }),
  Object.freeze({ id: "gather-stone-50" as const, title: "Stonebreaker", description: "Collect 50 stone materials", category: "gathering" as const }),
  Object.freeze({ id: "gather-ore-25" as const, title: "Ore Hauler", description: "Collect 25 ore pieces", category: "gathering" as const }),
  Object.freeze({ id: "craft-100" as const, title: "Assembly Line", description: "Craft 100 items", category: "crafting" as const }),
  Object.freeze({ id: "fortified-home" as const, title: "Fortified Home", description: "Place walls and a gate/door", category: "building" as const }),
  Object.freeze({ id: "kills-50" as const, title: "Fifty Fallen", description: "Defeat 50 enemies", category: "combat" as const }),
  Object.freeze({ id: "kills-200" as const, title: "War of Attrition", description: "Defeat 200 enemies", category: "combat" as const }),
  Object.freeze({ id: "critical-master" as const, title: "Weak Point", description: "Land 25 critical hits", category: "combat" as const }),
  Object.freeze({ id: "sneak-killer" as const, title: "Quiet Steps", description: "Land 10 sneak kills", category: "combat" as const }),
  Object.freeze({ id: "metro-boss" as const, title: "Tunnel King", description: "Defeat Metro Abomination", category: "boss" as const }),
  Object.freeze({ id: "hospital-boss" as const, title: "Contaminant Down", description: "Defeat Marrow Contaminant", category: "boss" as const }),
  Object.freeze({ id: "swamp-boss" as const, title: "Mire Cleared", description: "Defeat Mire Behemoth", category: "boss" as const }),
  Object.freeze({ id: "mine-boss" as const, title: "Deep Guard", description: "Defeat Mine Guardian", category: "boss" as const }),
  Object.freeze({ id: "blacksite-boss" as const, title: "Subject Contained", description: "Defeat Blacksite Subject", category: "boss" as const }),
  Object.freeze({ id: "farm-first-crop" as const, title: "First Harvest Home", description: "Harvest garden crops", category: "survival" as const }),
  Object.freeze({ id: "fish-first" as const, title: "First Catch", description: "Catch a fish", category: "survival" as const }),
  Object.freeze({ id: "map-fragment-finder" as const, title: "Paper Trail", description: "Find a map fragment", category: "exploration" as const }),
  Object.freeze({ id: "world-event-hunter" as const, title: "Signal Chaser", description: "Claim 5 world events", category: "exploration" as const }),
  Object.freeze({ id: "contract-runner" as const, title: "Contractor", description: "Complete 5 faction contracts", category: "faction" as const }),
  Object.freeze({ id: "journal-archivist" as const, title: "Archivist", description: "Discover 20 journal entries", category: "exploration" as const }),
  Object.freeze({ id: "steel-worker" as const, title: "Steel Worker", description: "Craft steel products", category: "crafting" as const }),
  Object.freeze({ id: "composite-crafter" as const, title: "Composite Hand", description: "Craft composite parts", category: "crafting" as const }),
  Object.freeze({ id: "winter-ready" as const, title: "Winter Ready", description: "Equip winter armor set piece", category: "survival" as const }),
  Object.freeze({ id: "hazmat-ready" as const, title: "Sealed Suit", description: "Equip hazmat protection", category: "endgame" as const }),
  Object.freeze({ id: "heavy-armor" as const, title: "Ironclad", description: "Equip heavy plate armor", category: "combat" as const }),
  Object.freeze({ id: "weapon-collector" as const, title: "Armory", description: "Craft 8 different weapons (session)", category: "combat" as const }),
]);

export type AchievementListener = (id: AchievementId) => void;

export class AchievementSystem {
  private readonly unlocked = new Set<AchievementId>();
  private readonly listeners = new Set<AchievementListener>();

  isUnlocked(id: AchievementId): boolean { return this.unlocked.has(id); }

  tryUnlock(id: AchievementId): boolean {
    if (this.unlocked.has(id)) return false;
    if (!ACHIEVEMENT_DEFS.some((d) => d.id === id)) return false;
    this.unlocked.add(id);
    for (const listener of this.listeners) listener(id);
    return true;
  }

  serialize(): readonly AchievementId[] { return Object.freeze([...this.unlocked]); }

  load(ids: readonly string[]): void {
    this.unlocked.clear();
    for (const id of ids) {
      if (ACHIEVEMENT_DEFS.some((d) => d.id === id)) this.unlocked.add(id as AchievementId);
    }
  }

  subscribe(listener: AchievementListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }
}
