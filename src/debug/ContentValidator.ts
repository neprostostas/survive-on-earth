import { ITEM_REGISTRY } from "../items/ItemSystem.ts";
import { CRAFTING_RECIPES } from "../crafting/CraftingRecipeRegistry.ts";
import { LOCATION_REGISTRY } from "../locations/LocationRegistry.ts";
import { REGION_REGISTRY } from "../locations/RegionRegistry.ts";
import { QUEST_DEFS } from "../quests/QuestSystem.ts";
import { listLootTableIds, getLootTable } from "../loot/LootTable.ts";
import { BUILD_PIECES } from "../building/BuildingRegistry.ts";
import { ITEM_ICONS } from "../ui/itemIcons.ts";

/**
 * Lightweight DEV content validation — logs warnings only, never throws in prod.
 * No success/summary spam; only logs real registry problems.
 */
export function validateContentRegistries(log: (msg: string) => void = console.warn): void {
  if (!(import.meta as { env?: { DEV?: boolean } }).env?.DEV) return;
  for (const recipe of CRAFTING_RECIPES.getAll()) {
    for (const ing of recipe.ingredients) {
      try {
        ITEM_REGISTRY.get(ing.itemId);
      } catch {
        log(`[content] recipe ${recipe.id} missing ingredient ${ing.itemId}`);
      }
    }
    try {
      ITEM_REGISTRY.get(recipe.output.itemId);
    } catch {
      log(`[content] recipe ${recipe.id} missing output ${recipe.output.itemId}`);
    }
  }
  const regionIds = new Set(REGION_REGISTRY.map((r) => r.id));
  for (const loc of LOCATION_REGISTRY) {
    if (!regionIds.has(loc.regionId)) log(`[content] location ${loc.id} has unknown region ${loc.regionId}`);
  }
  const itemIds = new Set(ITEM_REGISTRY.getAll().map((i) => i.id));
  for (const id of itemIds) {
    if (!(id in ITEM_ICONS)) log(`[content] missing icon for ${id}`);
  }
  for (const tableId of listLootTableIds()) {
    const table = getLootTable(tableId);
    if (!table) continue;
    for (const e of table.entries) {
      if (!itemIds.has(e.itemId)) log(`[content] loot ${tableId} missing item ${e.itemId}`);
    }
  }
  for (const piece of BUILD_PIECES) {
    for (const line of piece.cost) {
      if (!itemIds.has(line.itemId)) log(`[content] build ${piece.id} missing cost ${line.itemId}`);
    }
  }
  const qTitles = new Map<string, string>();
  for (const q of QUEST_DEFS) {
    if (qTitles.has(q.title)) log(`[content] duplicate quest title: ${q.title}`);
    qTitles.set(q.title, q.id);
  }
}
