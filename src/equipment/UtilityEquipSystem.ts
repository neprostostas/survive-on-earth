import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import type { ItemStack } from "../items/ItemSystem.ts";
import { PlayerUtilitySlot } from "./PlayerUtilitySlot.ts";

export class UtilityEquipSystem {
  constructor(
    private readonly inventory: PlayerInventory,
    private readonly utilitySlot: PlayerUtilitySlot,
  ) {}

  equipFromInventory(slotIndex: number, expected?: ItemStack): boolean {
    const current = this.inventory.getSlot(slotIndex).stack;
    if (!current) return false;
    if (expected && current !== expected) return false;
    if (!PlayerUtilitySlot.isCompatible(current.itemId)) return false;
    return this.utilitySlot.equipIfAccepted(current, (previous) =>
      this.inventory.exchangeWholeStack(slotIndex, current, previous));
  }

  unequipToInventory(expected?: ItemStack): boolean {
    const current = this.utilitySlot.current;
    if (!current) return false;
    if (expected && current !== expected) return false;
    return this.utilitySlot.unequipIfAccepted(current, (stack) => this.inventory.tryInsert(stack).accepted);
  }
}
