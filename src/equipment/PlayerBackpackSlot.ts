import type { ItemStack } from "../items/ItemSystem.ts";
import { ITEM_REGISTRY } from "../items/ItemSystem.ts";
import { isBackpackCapableItemId } from "./BackpackTypes.ts";

export type BackpackSlotChangeListener = (previous: ItemStack | null, stack: ItemStack | null) => void;

/**
 * Equipped backpack item only (not armor, not weapon).
 * Capacity is derived by consumers via backpack metadata on the stack.
 */
export class PlayerBackpackSlot {
  private stack: ItemStack | null = null;
  private readonly listeners = new Set<BackpackSlotChangeListener>();

  get isEmpty(): boolean { return this.stack === null; }
  get current(): ItemStack | null { return this.stack; }
  getSnapshot(): ItemStack | null { return this.stack; }

  /** Active extra slots granted by equipped backpack definition (0 if empty). */
  get extraSlots(): number {
    if (!this.stack) return 0;
    return ITEM_REGISTRY.get(this.stack.itemId).backpack?.extraSlots ?? 0;
  }

  equipIfAccepted(incoming: ItemStack, acceptPrevious: (previous: ItemStack | null) => boolean): boolean {
    if (!isBackpackCapableItemId(incoming.itemId) || incoming.quantity !== 1) return false;
    if (!ITEM_REGISTRY.get(incoming.itemId).backpack) return false;
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

  subscribe(listener: BackpackSlotChangeListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private emit(previous: ItemStack | null, stack: ItemStack | null): void {
    for (const listener of this.listeners) listener(previous, stack);
  }
}
