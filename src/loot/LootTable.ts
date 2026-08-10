import type { ItemId } from "../items/ItemId.ts";
import { createItemStack, type ItemStack } from "../items/ItemSystem.ts";

export interface LootTableEntry {
  readonly itemId: ItemId;
  readonly weight: number;
  readonly minQuantity: number;
  readonly maxQuantity: number;
}

export interface LootTable {
  readonly id: string;
  readonly entries: readonly LootTableEntry[];
  /** Chance 0..1 that the roll yields nothing. */
  readonly emptyChance: number;
}

/** Seeded LCG for deterministic tests / replays. */
export class SeededRng {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0 || 1;
  }
  next(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
}

export function rollLootTable(table: LootTable, rng: SeededRng = new SeededRng(Date.now())): readonly ItemStack[] {
  if (rng.next() < table.emptyChance) return Object.freeze([]);
  const total = table.entries.reduce((sum, e) => sum + e.weight, 0);
  if (total <= 0) return Object.freeze([]);
  let roll = rng.next() * total;
  for (const entry of table.entries) {
    roll -= entry.weight;
    if (roll <= 0) {
      const qty = rng.int(entry.minQuantity, entry.maxQuantity);
      if (qty < 1) return Object.freeze([]);
      return Object.freeze([createItemStack(entry.itemId, qty)]);
    }
  }
  return Object.freeze([]);
}

export const ZOMBIE_LOOT_TABLE: LootTable = Object.freeze({
  id: "zombie-basic",
  emptyChance: 0.25,
  entries: Object.freeze([
    Object.freeze({ itemId: "pine-log" as const, weight: 3, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "limestone" as const, weight: 2, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "berries" as const, weight: 3, minQuantity: 1, maxQuantity: 3 }),
    Object.freeze({ itemId: "cloth" as const, weight: 2, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "plant-fiber" as const, weight: 2, minQuantity: 1, maxQuantity: 3 }),
  ]),
});

export const CITY_INFECTED_LOOT: LootTable = Object.freeze({
  id: "city-infected",
  emptyChance: 0.2,
  entries: Object.freeze([
    Object.freeze({ itemId: "scrap-metal" as const, weight: 4, minQuantity: 1, maxQuantity: 3 }),
    Object.freeze({ itemId: "wiring" as const, weight: 2, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "rubber" as const, weight: 2, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "cloth" as const, weight: 3, minQuantity: 1, maxQuantity: 3 }),
    Object.freeze({ itemId: "bandage" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "glass-pane" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
  ]),
});

export const VEHICLE_WRECK_LOOT: LootTable = Object.freeze({
  id: "vehicle-wreck",
  emptyChance: 0.1,
  entries: Object.freeze([
    Object.freeze({ itemId: "scrap-metal" as const, weight: 5, minQuantity: 1, maxQuantity: 4 }),
    Object.freeze({ itemId: "wiring" as const, weight: 3, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "rubber" as const, weight: 3, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "battery" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "fuel-can" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "bearing" as const, weight: 2, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "engine-part" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "glass-pane" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
  ]),
});

export const RAID_MID_LOOT: LootTable = Object.freeze({
  id: "raid-mid",
  emptyChance: 0.05,
  entries: Object.freeze([
    Object.freeze({ itemId: "steel-bar" as const, weight: 3, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "circuit-component" as const, weight: 2, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "trade-token" as const, weight: 3, minQuantity: 2, maxQuantity: 5 }),
    Object.freeze({ itemId: "pistol-ammo" as const, weight: 2, minQuantity: 4, maxQuantity: 12 }),
    Object.freeze({ itemId: "metal-plate" as const, weight: 2, minQuantity: 1, maxQuantity: 2 }),
  ]),
});

export const RAID_HIGH_LOOT: LootTable = Object.freeze({
  id: "raid-high",
  emptyChance: 0.05,
  entries: Object.freeze([
    Object.freeze({ itemId: "hardened-alloy" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "precision-component" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "advanced-circuit" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "power-cell" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "trade-token" as const, weight: 3, minQuantity: 4, maxQuantity: 10 }),
  ]),
});

export const ENDGAME_BOSS_LOOT: LootTable = Object.freeze({
  id: "endgame-boss",
  emptyChance: 0,
  entries: Object.freeze([
    Object.freeze({ itemId: "reactor-component" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "security-module" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "composite-plate" as const, weight: 3, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "helix-edge" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
  ]),
});

export const BUNKER_TOKEN_LOOT: LootTable = Object.freeze({
  id: "bunker-token",
  emptyChance: 0.15,
  entries: Object.freeze([
    Object.freeze({ itemId: "dungeon-token" as const, weight: 5, minQuantity: 1, maxQuantity: 3 }),
    Object.freeze({ itemId: "circuit-component" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "fuse" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
  ]),
});

export const FOREST_LOOT: LootTable = Object.freeze({
  id: "forest-loot",
  emptyChance: 0.2,
  entries: Object.freeze([
    Object.freeze({ itemId: "branch" as const, weight: 4, minQuantity: 1, maxQuantity: 3 }),
    Object.freeze({ itemId: "plant-fiber" as const, weight: 4, minQuantity: 1, maxQuantity: 4 }),
    Object.freeze({ itemId: "berries" as const, weight: 3, minQuantity: 1, maxQuantity: 3 }),
    Object.freeze({ itemId: "mushroom" as const, weight: 2, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "medicinal-herb" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "hide" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
  ]),
});

export const ROCKY_LOOT: LootTable = Object.freeze({
  id: "rocky-loot",
  emptyChance: 0.18,
  entries: Object.freeze([
    Object.freeze({ itemId: "stone" as const, weight: 4, minQuantity: 1, maxQuantity: 3 }),
    Object.freeze({ itemId: "limestone" as const, weight: 3, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "gravel" as const, weight: 3, minQuantity: 1, maxQuantity: 3 }),
    Object.freeze({ itemId: "iron-ore" as const, weight: 2, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "copper-ore" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
  ]),
});

export const SWAMP_LOOT: LootTable = Object.freeze({
  id: "swamp-loot",
  emptyChance: 0.2,
  entries: Object.freeze([
    Object.freeze({ itemId: "mushroom" as const, weight: 3, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "medicinal-herb" as const, weight: 3, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "dirty-water" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "plant-resin" as const, weight: 2, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "toxic-treatment" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "activated-carbon" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
  ]),
});

export const SNOW_LOOT: LootTable = Object.freeze({
  id: "snow-loot",
  emptyChance: 0.22,
  entries: Object.freeze([
    Object.freeze({ itemId: "fur" as const, weight: 3, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "hardwood-log" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "insulated-hide" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "warming-meal" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "raw-meat" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
  ]),
});

export const DESERT_LOOT: LootTable = Object.freeze({
  id: "desert-loot",
  emptyChance: 0.2,
  entries: Object.freeze([
    Object.freeze({ itemId: "scrap-metal" as const, weight: 4, minQuantity: 1, maxQuantity: 3 }),
    Object.freeze({ itemId: "empty-can" as const, weight: 3, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "broken-glass" as const, weight: 2, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "glass-pane" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "low-grade-fuel" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
  ]),
});

export const INDUSTRIAL_LOOT: LootTable = Object.freeze({
  id: "industrial-loot",
  emptyChance: 0.15,
  entries: Object.freeze([
    Object.freeze({ itemId: "scrap-metal" as const, weight: 4, minQuantity: 1, maxQuantity: 3 }),
    Object.freeze({ itemId: "screws" as const, weight: 3, minQuantity: 2, maxQuantity: 6 }),
    Object.freeze({ itemId: "bent-pipe" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "rusted-mechanism" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "gear" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "wire" as const, weight: 2, minQuantity: 1, maxQuantity: 2 }),
  ]),
});

export const HOSPITAL_LOOT: LootTable = Object.freeze({
  id: "hospital-loot",
  emptyChance: 0.12,
  entries: Object.freeze([
    Object.freeze({ itemId: "bandage" as const, weight: 3, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "sterile-bandage" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "antiseptic" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "first-aid-kit" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "medical-sample" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
  ]),
});

export const JUNK_SALVAGE_LOOT: LootTable = Object.freeze({
  id: "junk-salvage",
  emptyChance: 0.1,
  entries: Object.freeze([
    Object.freeze({ itemId: "empty-can" as const, weight: 4, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "broken-tool" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "scrap-device" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "old-coin" as const, weight: 1, minQuantity: 1, maxQuantity: 3 }),
    Object.freeze({ itemId: "broken-radio" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "map-fragment" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
  ]),
});

export const MARAUDER_GEAR_LOOT: LootTable = Object.freeze({
  id: "marauder-gear",
  emptyChance: 0.08,
  entries: Object.freeze([
    Object.freeze({ itemId: "cloth" as const, weight: 3, minQuantity: 1, maxQuantity: 3 }),
    Object.freeze({ itemId: "pistol-ammo" as const, weight: 2, minQuantity: 2, maxQuantity: 8 }),
    Object.freeze({ itemId: "bandage" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "trade-token" as const, weight: 2, minQuantity: 1, maxQuantity: 3 }),
    Object.freeze({ itemId: "survival-knife" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
  ]),
});

export const EVENT_SUPPLY_LOOT: LootTable = Object.freeze({
  id: "event-supply",
  emptyChance: 0.05,
  entries: Object.freeze([
    Object.freeze({ itemId: "dry-food" as const, weight: 3, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "bandage" as const, weight: 3, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "clean-water" as const, weight: 3, minQuantity: 1, maxQuantity: 2 }),
    Object.freeze({ itemId: "nails" as const, weight: 2, minQuantity: 2, maxQuantity: 6 }),
    Object.freeze({ itemId: "tape" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
  ]),
});

export const BOSS_COMPONENT_LOOT: LootTable = Object.freeze({
  id: "boss-component",
  emptyChance: 0,
  entries: Object.freeze([
    Object.freeze({ itemId: "rare-component" as const, weight: 3, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "hardened-alloy" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "precision-mechanism" as const, weight: 2, minQuantity: 1, maxQuantity: 1 }),
    Object.freeze({ itemId: "blueprint-weapon" as const, weight: 1, minQuantity: 1, maxQuantity: 1 }),
  ]),
});

const TABLES: ReadonlyMap<string, LootTable> = new Map([
  [ZOMBIE_LOOT_TABLE.id, ZOMBIE_LOOT_TABLE],
  [CITY_INFECTED_LOOT.id, CITY_INFECTED_LOOT],
  [VEHICLE_WRECK_LOOT.id, VEHICLE_WRECK_LOOT],
  [RAID_MID_LOOT.id, RAID_MID_LOOT],
  [RAID_HIGH_LOOT.id, RAID_HIGH_LOOT],
  [ENDGAME_BOSS_LOOT.id, ENDGAME_BOSS_LOOT],
  [BUNKER_TOKEN_LOOT.id, BUNKER_TOKEN_LOOT],
  [FOREST_LOOT.id, FOREST_LOOT],
  [ROCKY_LOOT.id, ROCKY_LOOT],
  [SWAMP_LOOT.id, SWAMP_LOOT],
  [SNOW_LOOT.id, SNOW_LOOT],
  [DESERT_LOOT.id, DESERT_LOOT],
  [INDUSTRIAL_LOOT.id, INDUSTRIAL_LOOT],
  [HOSPITAL_LOOT.id, HOSPITAL_LOOT],
  [JUNK_SALVAGE_LOOT.id, JUNK_SALVAGE_LOOT],
  [MARAUDER_GEAR_LOOT.id, MARAUDER_GEAR_LOOT],
  [EVENT_SUPPLY_LOOT.id, EVENT_SUPPLY_LOOT],
  [BOSS_COMPONENT_LOOT.id, BOSS_COMPONENT_LOOT],
]);

export function getLootTable(id: string): LootTable | null {
  return TABLES.get(id) ?? null;
}

export function rollNamedLoot(profile: string, seed: number): readonly ItemStack[] {
  const table = getLootTable(profile)
    ?? (profile === "raid-low" ? VEHICLE_WRECK_LOOT
      : profile === "raid-mid" ? RAID_MID_LOOT
        : profile === "raid-high" ? RAID_HIGH_LOOT
          : profile === "zombie-basic" ? ZOMBIE_LOOT_TABLE
            : ZOMBIE_LOOT_TABLE);
  return rollLootTable(table, new SeededRng(seed));
}

export function listLootTableIds(): readonly string[] {
  return Object.freeze([...TABLES.keys()]);
}