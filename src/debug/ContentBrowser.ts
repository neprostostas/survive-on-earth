/**
 * DEV-only content browser helpers — registry summaries & spawn helpers.
 * Never used as gameplay authority; pure observation + debug command inputs.
 */
import { ITEM_REGISTRY, createItemStack } from "../items/ItemSystem.ts";
import { CRAFTING_RECIPES } from "../crafting/CraftingRecipeRegistry.ts";
import { LOCATION_REGISTRY } from "../locations/LocationRegistry.ts";
import { ENEMY_ARCHETYPES } from "../enemies/EnemyArchetypes.ts";
import { BOSS_PROFILES } from "../combat/BossBrain.ts";
import { QUEST_DEFS } from "../quests/QuestSystem.ts";
import { ACHIEVEMENT_DEFS } from "../progression/Achievements.ts";
import { listLootTableIds } from "../loot/LootTable.ts";
import { BUILD_PIECES } from "../building/BuildingRegistry.ts";
import type { ItemId } from "../items/ItemId.ts";
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";

export interface ContentSummary {
  readonly items: number;
  readonly recipes: number;
  readonly locations: number;
  readonly enemies: number;
  readonly bosses: number;
  readonly quests: number;
  readonly achievements: number;
  readonly lootTables: number;
  readonly buildPieces: number;
  readonly weapons: number;
  readonly armor: number;
  readonly backpacks: number;
  readonly consumables: number;
  readonly resources: number;
}

export function getContentSummary(): ContentSummary {
  const all = ITEM_REGISTRY.getAll();
  return Object.freeze({
    items: all.length,
    recipes: CRAFTING_RECIPES.getAll().length,
    locations: LOCATION_REGISTRY.length,
    enemies: ENEMY_ARCHETYPES.size,
    bosses: BOSS_PROFILES.length,
    quests: QUEST_DEFS.length,
    achievements: ACHIEVEMENT_DEFS.length,
    lootTables: listLootTableIds().length,
    buildPieces: BUILD_PIECES.length,
    weapons: all.filter((i) => i.category === "tool" && i.meleeCombat).length,
    armor: all.filter((i) => i.category === "armor").length,
    backpacks: all.filter((i) => i.backpack).length,
    consumables: all.filter((i) => i.category === "consumable").length,
    resources: all.filter((i) => i.category === "resource" || i.category === "material").length,
  });
}

export function formatContentSummary(): string {
  const s = getContentSummary();
  return [
    `items=${s.items}`,
    `recipes=${s.recipes}`,
    `locations=${s.locations}`,
    `enemies=${s.enemies}`,
    `bosses=${s.bosses}`,
    `quests=${s.quests}`,
    `achievements=${s.achievements}`,
    `loot=${s.lootTables}`,
    `build=${s.buildPieces}`,
    `weapons=${s.weapons}`,
    `armor=${s.armor}`,
    `packs=${s.backpacks}`,
    `food/med=${s.consumables}`,
  ].join(" · ");
}

export function listUnusedIngredients(): readonly string[] {
  const produced = new Set(CRAFTING_RECIPES.getAll().map((r) => r.output.itemId));
  const used = new Set<string>();
  for (const r of CRAFTING_RECIPES.getAll()) {
    for (const i of r.ingredients) used.add(i.itemId);
  }
  return ITEM_REGISTRY.getAll()
    .filter((d) => d.category === "material" || d.category === "resource")
    .map((d) => d.id)
    .filter((id) => !used.has(id) && !produced.has(id));
}

/** Debug: grant stack if inventory accepts. */
export function debugSpawnItem(inventory: PlayerInventory, itemId: string, quantity = 1): boolean {
  try {
    const stack = createItemStack(itemId as ItemId, quantity);
    return inventory.tryInsert(stack).accepted;
  } catch {
    return false;
  }
}

export function findItemIds(query: string): readonly string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ITEM_REGISTRY.getAll()
    .filter((d) => d.id.includes(q) || d.displayName.toLowerCase().includes(q))
    .map((d) => d.id)
    .slice(0, 40);
}
