export type QuestId =
  | "collect-pine-logs"
  | "collect-limestone"
  | "craft-hatchet"
  | "craft-spear"
  | "equip-backpack"
  | "kill-zombie"
  | "visit-pine-woods"
  | "build-floor"
  | "build-chest"
  | "craft-bandage"
  | "cook-meal"
  | "smelt-iron"
  | "craft-iron-weapon"
  | "kill-infected-10"
  | "visit-rocky-hills"
  | "visit-swamp-edge"
  | "visit-greyhaven"
  | "build-wall"
  | "craft-leather-armor"
  | "craft-first-aid"
  | "deliver-package"
  | "collect-scrap-15"
  | "defeat-elite"
  | "assemble-bike"
  | "reach-bunker-echo"
  | "craft-steel-tool"
  | "purify-water"
  | "farm-harvest"
  | "visit-hospital"
  | "visit-prison"
  | "visit-metro"
  | "recover-map-fragment"
  | "craft-backpack-reinforced"
  | "kill-marauder"
  | "claim-world-event"
  | "clear-raid"
  | "craft-advanced-med"
  | "frontier-favor"
  | "ironbound-scrap-run";

export interface QuestDefinition {
  readonly id: QuestId;
  readonly title: string;
  readonly description: string;
  readonly target: number;
  readonly rewardXp: number;
  readonly chain?: string;
}

export const QUEST_DEFS: readonly QuestDefinition[] = Object.freeze([
  Object.freeze({ id: "collect-pine-logs" as const, title: "Gather Wood", description: "Collect Pine Logs", target: 6, rewardXp: 20, chain: "starter" }),
  Object.freeze({ id: "collect-limestone" as const, title: "Quarry Stone", description: "Collect Limestone", target: 6, rewardXp: 20, chain: "starter" }),
  Object.freeze({ id: "craft-hatchet" as const, title: "First Tool", description: "Craft a Hatchet", target: 1, rewardXp: 25, chain: "starter" }),
  Object.freeze({ id: "craft-spear" as const, title: "First Weapon", description: "Craft a Spear", target: 1, rewardXp: 25, chain: "starter" }),
  Object.freeze({ id: "equip-backpack" as const, title: "Backpacker", description: "Equip a Backpack", target: 1, rewardXp: 30, chain: "starter" }),
  Object.freeze({ id: "kill-zombie" as const, title: "First Kill", description: "Defeat an infected", target: 1, rewardXp: 20, chain: "combat" }),
  Object.freeze({ id: "visit-pine-woods" as const, title: "Explorer", description: "Travel to Pine Woods", target: 1, rewardXp: 15, chain: "explore" }),
  Object.freeze({ id: "build-floor" as const, title: "Foundations", description: "Place a wood floor", target: 1, rewardXp: 20, chain: "home" }),
  Object.freeze({ id: "build-chest" as const, title: "Storage", description: "Place a chest", target: 1, rewardXp: 25, chain: "home" }),
  Object.freeze({ id: "craft-bandage" as const, title: "Field Medic", description: "Craft a Bandage", target: 1, rewardXp: 20, chain: "survival" }),
  Object.freeze({ id: "cook-meal" as const, title: "Camp Cook", description: "Cook a meal (stew/soup/meat)", target: 1, rewardXp: 25, chain: "survival" }),
  Object.freeze({ id: "smelt-iron" as const, title: "First Smelt", description: "Craft an Iron Bar", target: 1, rewardXp: 30, chain: "crafting" }),
  Object.freeze({ id: "craft-iron-weapon" as const, title: "Iron Arms", description: "Craft Crowbar or Machete", target: 1, rewardXp: 35, chain: "crafting" }),
  Object.freeze({ id: "kill-infected-10" as const, title: "Cull the Horde", description: "Defeat 10 infected", target: 10, rewardXp: 40, chain: "combat" }),
  Object.freeze({ id: "visit-rocky-hills" as const, title: "Stone Country", description: "Travel to rocky hills / quarry", target: 1, rewardXp: 20, chain: "explore" }),
  Object.freeze({ id: "visit-swamp-edge" as const, title: "Mire Scout", description: "Travel to the swamp edge", target: 1, rewardXp: 25, chain: "explore" }),
  Object.freeze({ id: "visit-greyhaven" as const, title: "City Gates", description: "Enter a Greyhaven district", target: 1, rewardXp: 35, chain: "city" }),
  Object.freeze({ id: "build-wall" as const, title: "Perimeter", description: "Place a wall piece", target: 1, rewardXp: 25, chain: "home" }),
  Object.freeze({ id: "craft-leather-armor" as const, title: "Hidebound", description: "Craft a leather armor piece", target: 1, rewardXp: 35, chain: "crafting" }),
  Object.freeze({ id: "craft-first-aid" as const, title: "Trauma Ready", description: "Craft a First Aid Kit", target: 1, rewardXp: 30, chain: "survival" }),
  Object.freeze({ id: "deliver-package" as const, title: "Courier", description: "Carry a Sealed Package to a trader", target: 1, rewardXp: 40, chain: "faction" }),
  Object.freeze({ id: "collect-scrap-15" as const, title: "Scavenger Run", description: "Collect Scrap Metal", target: 15, rewardXp: 30, chain: "survival" }),
  Object.freeze({ id: "defeat-elite" as const, title: "Trophy Hunt", description: "Defeat an elite or boss-tier enemy", target: 1, rewardXp: 50, chain: "combat" }),
  Object.freeze({ id: "assemble-bike" as const, title: "Wheels Up", description: "Assemble the Salvaged Bike", target: 1, rewardXp: 50, chain: "vehicle" }),
  Object.freeze({ id: "reach-bunker-echo" as const, title: "Echo Below", description: "Enter Bunker Echo", target: 1, rewardXp: 40, chain: "bunker" }),
  Object.freeze({ id: "craft-steel-tool" as const, title: "Steel Edge", description: "Craft a steel hatchet or pickaxe", target: 1, rewardXp: 45, chain: "crafting" }),
  Object.freeze({ id: "purify-water" as const, title: "Clean Water", description: "Craft Clean or Purified Water", target: 1, rewardXp: 25, chain: "survival" }),
  Object.freeze({ id: "farm-harvest" as const, title: "First Crop", description: "Harvest a home garden crop", target: 1, rewardXp: 30, chain: "farming" }),
  Object.freeze({ id: "visit-hospital" as const, title: "Quarantine Halls", description: "Enter St. Marrow Hospital", target: 1, rewardXp: 40, chain: "dungeon" }),
  Object.freeze({ id: "visit-prison" as const, title: "Concrete Yard", description: "Enter Ironhold Prison", target: 1, rewardXp: 45, chain: "dungeon" }),
  Object.freeze({ id: "visit-metro" as const, title: "Underground Lines", description: "Enter metro hub", target: 1, rewardXp: 40, chain: "city" }),
  Object.freeze({ id: "recover-map-fragment" as const, title: "Charted Path", description: "Obtain a Map Fragment", target: 1, rewardXp: 35, chain: "explore" }),
  Object.freeze({ id: "craft-backpack-reinforced" as const, title: "Loadout Upgrade", description: "Craft Reinforced Backpack", target: 1, rewardXp: 40, chain: "crafting" }),
  Object.freeze({ id: "kill-marauder" as const, title: "Hostile Intent", description: "Defeat a marauder or human hostile", target: 1, rewardXp: 35, chain: "combat" }),
  Object.freeze({ id: "claim-world-event" as const, title: "Opportunist", description: "Claim a world event reward", target: 1, rewardXp: 30, chain: "events" }),
  Object.freeze({ id: "clear-raid" as const, title: "Compound Breaker", description: "Clear a PvE raid site", target: 1, rewardXp: 60, chain: "raid" }),
  Object.freeze({ id: "craft-advanced-med" as const, title: "Trauma Suite", description: "Craft Advanced Medical Kit", target: 1, rewardXp: 50, chain: "survival" }),
  Object.freeze({ id: "frontier-favor" as const, title: "Frontier Favor", description: "Complete a Frontier contract", target: 1, rewardXp: 35, chain: "faction" }),
  Object.freeze({ id: "ironbound-scrap-run" as const, title: "Ironbound Scrap Run", description: "Complete an Ironbound gather contract", target: 1, rewardXp: 35, chain: "faction" }),
]);

export interface QuestState {
  readonly id: QuestId;
  readonly progress: number;
  readonly completed: boolean;
}

export type QuestListener = (states: readonly QuestState[]) => void;

export class QuestSystem {
  private readonly progress = new Map<QuestId, number>();
  private readonly completed = new Set<QuestId>();
  private tracked: QuestId = "collect-pine-logs";
  private readonly listeners = new Set<QuestListener>();

  get trackedId(): QuestId { return this.tracked; }

  setTracked(id: QuestId): void {
    this.tracked = id;
    this.emit();
  }

  advance(id: QuestId, amount = 1): { completedNow: boolean; rewardXp: number } {
    if (this.completed.has(id)) return { completedNow: false, rewardXp: 0 };
    const def = QUEST_DEFS.find((q) => q.id === id);
    if (!def) return { completedNow: false, rewardXp: 0 };
    const next = Math.min(def.target, (this.progress.get(id) ?? 0) + amount);
    this.progress.set(id, next);
    if (next >= def.target) {
      this.completed.add(id);
      this.emit();
      return { completedNow: true, rewardXp: def.rewardXp };
    }
    this.emit();
    return { completedNow: false, rewardXp: 0 };
  }

  snapshot(): readonly QuestState[] {
    return Object.freeze(QUEST_DEFS.map((def) => Object.freeze({
      id: def.id,
      progress: this.progress.get(def.id) ?? 0,
      completed: this.completed.has(def.id),
    })));
  }

  trackedState(): QuestState {
    const def = QUEST_DEFS.find((q) => q.id === this.tracked) ?? QUEST_DEFS[0];
    return Object.freeze({
      id: def.id,
      progress: this.progress.get(def.id) ?? 0,
      completed: this.completed.has(def.id),
    });
  }

  serialize(): { tracked: QuestId; progress: Record<string, number>; completed: string[] } {
    return {
      tracked: this.tracked,
      progress: Object.fromEntries(this.progress.entries()),
      completed: [...this.completed],
    };
  }

  load(data: { tracked?: string; progress?: Record<string, number>; completed?: string[] }): void {
    this.progress.clear();
    this.completed.clear();
    if (data.progress) {
      for (const [id, value] of Object.entries(data.progress)) {
        if (QUEST_DEFS.some((q) => q.id === id)) this.progress.set(id as QuestId, value);
      }
    }
    for (const id of data.completed ?? []) {
      if (QUEST_DEFS.some((q) => q.id === id)) this.completed.add(id as QuestId);
    }
    if (data.tracked && QUEST_DEFS.some((q) => q.id === data.tracked)) {
      this.tracked = data.tracked as QuestId;
    }
    this.emit();
  }

  subscribe(listener: QuestListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private emit(): void {
    const snap = this.snapshot();
    for (const listener of this.listeners) listener(snap);
  }
}
