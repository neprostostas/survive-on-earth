/**
 * Courier run: Sealed Package → trader delivery (pure).
 */
import type { ItemId } from "../items/ItemId.ts";
import { createItemStack } from "../items/ItemSystem.ts";
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";

export const COURIER_PACKAGE_ID: ItemId = "quest-package";
export const COURIER_QUEST_ID = "deliver-package";
export const COURIER_REWARD_TOKENS = 2;
export const COURIER_REWARD_REP = 8;

export function inventoryHasItem(inventory: PlayerInventory, itemId: ItemId, quantity = 1): boolean {
  let total = 0;
  for (let i = 0; i < inventory.slotCount; i += 1) {
    const stack = inventory.getSlot(i).stack;
    if (stack?.itemId === itemId) total += stack.quantity;
  }
  return total >= quantity;
}

export function tryGrantCourierPackage(inventory: PlayerInventory): { ok: boolean; reason: string | null } {
  if (inventoryHasItem(inventory, COURIER_PACKAGE_ID)) {
    return { ok: false, reason: "already-carrying" };
  }
  if (!inventory.tryInsert(createItemStack(COURIER_PACKAGE_ID, 1)).accepted) {
    return { ok: false, reason: "inventory-full" };
  }
  return { ok: true, reason: null };
}

export function tryDeliverCourierPackage(inventory: PlayerInventory): { ok: boolean; reason: string | null } {
  if (!inventoryHasItem(inventory, COURIER_PACKAGE_ID)) {
    return { ok: false, reason: "no-package" };
  }
  const slot = inventory.findFirstSlotByItemId(COURIER_PACKAGE_ID);
  if (slot === null) return { ok: false, reason: "no-package" };
  const stack = inventory.getSlot(slot).stack;
  if (!stack) return { ok: false, reason: "no-package" };
  inventory.exchangeWholeStack(slot, stack, null);
  return { ok: true, reason: null };
}

/** Mira greets with delivery prompt when the package is in inventory. */
export function miraDialogueForInventory(inventory: PlayerInventory): "mira-courier" | "mira-hello" {
  return inventoryHasItem(inventory, COURIER_PACKAGE_ID) ? "mira-courier" : "mira-hello";
}
