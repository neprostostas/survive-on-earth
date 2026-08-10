import type { ItemStack } from "../items/ItemSystem.ts";
import { ITEM_REGISTRY } from "../items/ItemSystem.ts";

export type UtilitySlotListener = (previous: ItemStack | null, stack: ItemStack | null) => void;

/** Torch / light utility — not weapon, not armor. */
export class PlayerUtilitySlot {
  private stack: ItemStack | null = null;
  private readonly listeners = new Set<UtilitySlotListener>();

  get isEmpty(): boolean { return this.stack === null; }
  get current(): ItemStack | null { return this.stack; }

  static isCompatible(itemId: string): boolean {
    return ITEM_REGISTRY.get(itemId).utility === true;
  }

  equipIfAccepted(incoming: ItemStack, acceptPrevious: (previous: ItemStack | null) => boolean): boolean {
    if (!PlayerUtilitySlot.isCompatible(incoming.itemId) || incoming.quantity !== 1) return false;
    if (this.stack === incoming) return false;
    const previous = this.stack;
    if (!acceptPrevious(previous)) return false;
    this.stack = incoming;
    this.emit(previous, incoming);
    return true;
  }

  unequipIfAccepted(expected: ItemStack, accept: (stack: ItemStack) => boolean): boolean {
    if (this.stack !== expected) return false;
    if (!accept(expected)) return false;
    this.stack = null;
    this.emit(expected, null);
    return true;
  }

  subscribe(listener: UtilitySlotListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private emit(previous: ItemStack | null, stack: ItemStack | null): void {
    for (const listener of this.listeners) listener(previous, stack);
  }
}
