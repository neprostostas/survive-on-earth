import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import { ITEM_REGISTRY, type ItemStack } from "../items/ItemSystem.ts";
import { backpackExtraSlots, isBackpackCapableItemId } from "./BackpackTypes.ts";
import type { PlayerBackpackSlot } from "./PlayerBackpackSlot.ts";

export type BackpackOperation = "equip" | "unequip";
export type BackpackFailureReason =
  | "empty-source"
  | "not-backpack"
  | "stale-source"
  | "inventory-full"
  | "backpack-not-empty"
  | "source-in-backpack-storage"
  | "not-base-pocket";

export interface BackpackTransferResult {
  readonly accepted: boolean;
  readonly operation: BackpackOperation;
  readonly inventorySlot: number | null;
  readonly reason: BackpackFailureReason | null;
}

/**
 * Coordinates PlayerInventory ↔ PlayerBackpackSlot.
 * Occupied backpack storage and non-POCKET sources reject atomically.
 */
export class BackpackEquipSystem {
  private latest: BackpackTransferResult | null = null;
  private readonly inventory: PlayerInventory;
  private readonly backpackSlot: PlayerBackpackSlot;

  constructor(inventory: PlayerInventory, backpackSlot: PlayerBackpackSlot) {
    this.inventory = inventory;
    this.backpackSlot = backpackSlot;
  }

  get lastResult(): BackpackTransferResult | null { return this.latest; }

  equipFromInventory(inventorySlot: number, expected?: ItemStack): BackpackTransferResult {
    if (!this.inventory.isBasePocketIndex(inventorySlot)) {
      return this.result(false, "equip", inventorySlot, "source-in-backpack-storage");
    }
    const current = this.inventory.getSlot(inventorySlot).stack;
    if (!current) return this.result(false, "equip", inventorySlot, "empty-source");
    if (expected && current !== expected) return this.result(false, "equip", inventorySlot, "stale-source");
    if (!isBackpackCapableItemId(current.itemId) || !ITEM_REGISTRY.get(current.itemId).backpack) {
      return this.result(false, "equip", inventorySlot, "not-backpack");
    }
    if (!this.inventory.areBackpackStorageSlotsEmpty()) {
      return this.result(false, "equip", inventorySlot, "backpack-not-empty");
    }

    const nextExtra = backpackExtraSlots(current.itemId);
    const accepted = this.backpackSlot.equipIfAccepted(current, (previous) => {
      return this.inventory.exchangeWholeStack(inventorySlot, current, previous);
    });
    if (!accepted) {
      return this.result(false, "equip", inventorySlot, "stale-source");
    }
    this.inventory.setExtraSlotCount(nextExtra);
    return this.result(true, "equip", inventorySlot, null);
  }

  unequipToInventory(expected?: ItemStack): BackpackTransferResult {
    const current = this.backpackSlot.current;
    if (!current) return this.result(false, "unequip", null, "empty-source");
    if (expected && current !== expected) return this.result(false, "unequip", null, "stale-source");
    if (!this.inventory.areBackpackStorageSlotsEmpty()) {
      return this.result(false, "unequip", null, "backpack-not-empty");
    }

    const accepted = this.backpackSlot.unequipIfAccepted(current, (stack) => {
      return this.inventory.tryInsertIntoBasePockets(stack).accepted;
    });
    if (!accepted) {
      return this.result(false, "unequip", null, "inventory-full");
    }
    this.inventory.setExtraSlotCount(0);
    return this.result(true, "unequip", null, null);
  }

  unequipToInventorySlot(inventorySlot: number, expected?: ItemStack): BackpackTransferResult {
    const current = this.backpackSlot.current;
    if (!current) return this.result(false, "unequip", inventorySlot, "empty-source");
    if (expected && current !== expected) return this.result(false, "unequip", inventorySlot, "stale-source");
    if (!this.inventory.areBackpackStorageSlotsEmpty()) {
      return this.result(false, "unequip", inventorySlot, "backpack-not-empty");
    }
    if (!this.inventory.isBasePocketIndex(inventorySlot)) {
      return this.result(false, "unequip", inventorySlot, "not-base-pocket");
    }
    const dest = this.inventory.getSlot(inventorySlot).stack;
    if (!dest) {
      const accepted = this.backpackSlot.unequipIfAccepted(current, (stack) => {
        return this.inventory.placeIntoEmptySlot(inventorySlot, stack);
      });
      if (!accepted) {
        return this.result(false, "unequip", inventorySlot, "inventory-full");
      }
      this.inventory.setExtraSlotCount(0);
      return this.result(true, "unequip", inventorySlot, null);
    }
    if (isBackpackCapableItemId(dest.itemId) && ITEM_REGISTRY.get(dest.itemId).backpack) {
      return this.equipFromInventory(inventorySlot, dest);
    }
    return this.result(false, "unequip", inventorySlot, "not-backpack");
  }

  private result(
    accepted: boolean,
    operation: BackpackOperation,
    inventorySlot: number | null,
    reason: BackpackFailureReason | null,
  ): BackpackTransferResult {
    this.latest = Object.freeze({ accepted, operation, inventorySlot, reason });
    return this.latest;
  }
}
