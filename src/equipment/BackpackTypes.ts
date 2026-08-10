import type { ItemId } from "../items/ItemId.ts";
import { ITEM_REGISTRY } from "../items/ItemSystem.ts";

/** Central backpack capability — never scatter item-id compares across systems. */
export function isBackpackCapableItemId(itemId: ItemId): boolean {
  return ITEM_REGISTRY.get(itemId).backpack !== undefined;
}

export function backpackExtraSlots(itemId: ItemId): number {
  const meta = ITEM_REGISTRY.get(itemId).backpack;
  if (!meta) return 0;
  return meta.extraSlots;
}
