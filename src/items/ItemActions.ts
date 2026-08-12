import { isBlueprintItemId } from "../crafting/BlueprintUnlocks";
import type { ItemDefinition } from "./ItemDefinition";
import type { ItemStack } from "./ItemSystem";
import { ITEM_REGISTRY } from "./ItemSystem";
import { isWeaponCapableItemId } from "../equipment/WeaponTypes";
import { isBackpackCapableItemId } from "../equipment/BackpackTypes";
import { PlayerQuickSlot } from "../equipment/PlayerQuickSlot";
import { PlayerUtilitySlot } from "../equipment/PlayerUtilitySlot";

export type ItemActionId = "equip" | "unequip" | "use" | "split" | "delete" | "quick-assign" | "utility-equip";

export interface ItemActionContext {
  readonly source: "inventory" | "equipment" | "weapon" | "backpack" | "quick" | "utility";
  readonly stack: ItemStack;
}

/** Central action availability — UI must not invent unsupported ops. */
export function resolveItemActions(ctx: ItemActionContext): readonly ItemActionId[] {
  const def = ITEM_REGISTRY.get(ctx.stack.itemId);
  const actions: ItemActionId[] = [];
  if (ctx.source === "inventory") {
    if (def.equipment) actions.push("equip");
    if (isWeaponCapableItemId(ctx.stack.itemId) && def.meleeCombat) actions.push("equip");
    if (isBackpackCapableItemId(ctx.stack.itemId)) actions.push("equip");
    if (def.consumable || isBlueprintItemId(ctx.stack.itemId)) actions.push("use");
    if (PlayerQuickSlot.isCompatible(ctx.stack.itemId)) actions.push("quick-assign");
    if (PlayerUtilitySlot.isCompatible(ctx.stack.itemId)) actions.push("utility-equip");
    if (ctx.stack.quantity > 1 && ctx.stack.currentDurability === undefined) actions.push("split");
    actions.push("delete");
  } else {
    actions.push("unequip");
  }
  return Object.freeze(actions);
}

export function itemCategoryLabel(def: ItemDefinition): string {
  return def.category.toUpperCase();
}
