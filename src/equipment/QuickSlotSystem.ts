import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import { ITEM_REGISTRY, type ItemStack } from "../items/ItemSystem.ts";
import { PlayerQuickSlot } from "./PlayerQuickSlot.ts";

export type QuickSlotFailure = "empty-source" | "not-compatible" | "stale-source" | "inventory-full" | "cooldown";

export class QuickSlotSystem {
  constructor(
    private readonly inventory: PlayerInventory,
    private readonly quickSlot: PlayerQuickSlot,
  ) {}

  assignFromInventory(slotIndex: number, expected?: ItemStack): { accepted: boolean; reason: QuickSlotFailure | null } {
    const current = this.inventory.getSlot(slotIndex).stack;
    if (!current) return { accepted: false, reason: "empty-source" };
    if (expected && current !== expected) return { accepted: false, reason: "stale-source" };
    if (!PlayerQuickSlot.isCompatible(current.itemId)) return { accepted: false, reason: "not-compatible" };
    const accepted = this.quickSlot.assignIfAccepted(current, (previous) => {
      return this.inventory.exchangeWholeStack(slotIndex, current, previous);
    });
    return { accepted, reason: accepted ? null : "stale-source" };
  }

  clearToInventory(expected?: ItemStack): { accepted: boolean; reason: QuickSlotFailure | null } {
    const current = this.quickSlot.current;
    if (!current) return { accepted: false, reason: "empty-source" };
    if (expected && current !== expected) return { accepted: false, reason: "stale-source" };
    const accepted = this.quickSlot.clearIfAccepted(current, (stack) => this.inventory.tryInsert(stack).accepted);
    return { accepted, reason: accepted ? null : "inventory-full" };
  }

  /** Peek definition without consuming. */
  canUse(): boolean {
    const stack = this.quickSlot.current;
    if (!stack || this.quickSlot.cooldown > 0) return false;
    return ITEM_REGISTRY.get(stack.itemId).consumable !== undefined;
  }
}
