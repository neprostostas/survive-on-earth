import type { ItemStack } from "../items/ItemSystem.ts";
import { ITEM_REGISTRY } from "../items/ItemSystem.ts";

export type QuickSlotListener = (previous: ItemStack | null, stack: ItemStack | null) => void;

/** Single consumable quick-use slot — separate from weapon. */
export class PlayerQuickSlot {
  private stack: ItemStack | null = null;
  private readonly listeners = new Set<QuickSlotListener>();
  private cooldownRemaining = 0;

  get isEmpty(): boolean { return this.stack === null; }
  get current(): ItemStack | null { return this.stack; }
  get cooldown(): number { return this.cooldownRemaining; }

  static isCompatible(itemId: string): boolean {
    const def = ITEM_REGISTRY.get(itemId);
    return def.quickSlot === true && def.consumable !== undefined;
  }

  tick(delta: number): void {
    if (this.cooldownRemaining > 0) this.cooldownRemaining = Math.max(0, this.cooldownRemaining - delta);
  }

  setCooldown(seconds: number): void {
    this.cooldownRemaining = Math.max(0, seconds);
  }

  assignIfAccepted(incoming: ItemStack, acceptPrevious: (previous: ItemStack | null) => boolean): boolean {
    if (!PlayerQuickSlot.isCompatible(incoming.itemId)) return false;
    if (this.stack === incoming) return false;
    const previous = this.stack;
    if (!acceptPrevious(previous)) return false;
    this.stack = incoming;
    this.emit(previous, incoming);
    return true;
  }

  clearIfAccepted(expected: ItemStack, acceptStack: (stack: ItemStack) => boolean): boolean {
    if (this.stack !== expected) return false;
    if (!acceptStack(expected)) return false;
    this.stack = null;
    this.emit(expected, null);
    return true;
  }

  /** Reduce quantity by 1 after successful use; clear slot at 0. */
  consumeOne(): boolean {
    if (!this.stack || this.stack.quantity < 1) return false;
    const previous = this.stack;
    if (previous.quantity === 1) {
      this.stack = null;
    } else {
      this.stack = Object.freeze({ itemId: previous.itemId, quantity: previous.quantity - 1 });
    }
    this.emit(previous, this.stack);
    return true;
  }

  subscribe(listener: QuickSlotListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private emit(previous: ItemStack | null, stack: ItemStack | null): void {
    for (const listener of this.listeners) listener(previous, stack);
  }
}
