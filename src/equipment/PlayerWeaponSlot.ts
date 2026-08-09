import { createItemStack, type ItemStack } from "../items/ItemSystem.ts";
import type { ItemId } from "../items/ItemId";
import type { DurabilityConsumeResult } from "../inventory/PlayerInventory.ts";
import { ITEM_REGISTRY } from "../items/ItemSystem.ts";
import { isWeaponCapableItemId } from "./WeaponTypes.ts";

export type WeaponSlotChangeListener = (previous: ItemStack | null, stack: ItemStack | null) => void;

/**
 * Single active melee weapon slot. Armor stays on PlayerEquipment.
 * Source of truth for equipped combat tools only.
 */
export class PlayerWeaponSlot {
  private stack: ItemStack | null = null;
  private readonly listeners = new Set<WeaponSlotChangeListener>();

  get isEmpty(): boolean { return this.stack === null; }
  get current(): ItemStack | null { return this.stack; }

  getSnapshot(): ItemStack | null { return this.stack; }

  /**
   * Atomically install incoming stack. previous goes to acceptPrevious first.
   * Does not clone stacks — caller moves ownership via Inventory exchanges.
   */
  equipIfAccepted(incoming: ItemStack, acceptPrevious: (previous: ItemStack | null) => boolean): boolean {
    if (!isWeaponCapableItemId(incoming.itemId) || incoming.quantity !== 1) return false;
    if (!ITEM_REGISTRY.get(incoming.itemId).meleeCombat) return false;
    if (this.stack === incoming) return false;
    const previous = this.stack;
    if (!acceptPrevious(previous)) return false;
    this.stack = incoming;
    this.emit(previous, incoming);
    return true;
  }

  unequipIfAccepted(expected: ItemStack, acceptStack: (stack: ItemStack) => boolean): boolean {
    if (this.stack !== expected) return false;
    if (!acceptStack(expected)) return false;
    this.stack = null;
    this.emit(expected, null);
    return true;
  }

  /** Successful combat/harvest impact via weapon slot — last use removes. */
  tryConsumeDurability(expectedItemId: ItemId, uses = 1): DurabilityConsumeResult {
    const maxDurability = ITEM_REGISTRY.get(expectedItemId).maxDurability;
    if (maxDurability === undefined || !Number.isInteger(uses) || uses < 1) {
      return Object.freeze({ accepted: false, slotIndex: -1, itemId: expectedItemId, before: 0, after: 0, broke: false, maxDurability: maxDurability ?? 0 });
    }
    const current = this.stack;
    if (!current || current.itemId !== expectedItemId || current.currentDurability === undefined) {
      return Object.freeze({ accepted: false, slotIndex: -1, itemId: expectedItemId, before: 0, after: 0, broke: false, maxDurability });
    }
    const before = current.currentDurability;
    if (before < uses) {
      return Object.freeze({ accepted: false, slotIndex: -1, itemId: expectedItemId, before, after: before, broke: false, maxDurability });
    }
    const after = before - uses;
    const broke = after <= 0;
    const previous = current;
    this.stack = broke
      ? null
      : createItemStack(expectedItemId, current.quantity, { currentDurability: after });
    this.emit(previous, this.stack);
    return Object.freeze({
      accepted: true,
      slotIndex: -1,
      itemId: expectedItemId,
      before,
      after: broke ? 0 : after,
      broke,
      maxDurability,
    });
  }

  subscribe(listener: WeaponSlotChangeListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private emit(previous: ItemStack | null, stack: ItemStack | null): void {
    for (const listener of this.listeners) listener(previous, stack);
  }
}
