import type { ItemId } from "../items/ItemId";
import { ITEM_REGISTRY, createItemStack, mergeItemStacks, type ItemStack } from "../items/ItemSystem.ts";
import { INVENTORY_CONFIG } from "./inventoryConfig.ts";

export interface InventorySlot {
  readonly index: number;
  readonly stack: ItemStack | null;
}

export interface InventoryInsertResult {
  readonly accepted: boolean;
  readonly changedSlotIndexes: readonly number[];
}

export interface InventoryItemRequirement {
  readonly itemId: ItemId;
  readonly quantity: number;
}

export type InventoryTransactionFailure = "not-enough-items" | "inventory-full";

export interface InventoryTransactionPlan {
  readonly accepted: boolean;
  readonly reason: InventoryTransactionFailure | null;
  readonly slots: readonly (ItemStack | null)[] | null;
}

export type InventoryChangeListener = (result: InventoryInsertResult) => void;

const REJECTED_INSERT: InventoryInsertResult = Object.freeze({ accepted: false, changedSlotIndexes: Object.freeze([]) });

export function planInventoryInsertion(
  current: readonly (ItemStack | null)[],
  incoming: ItemStack,
): readonly (ItemStack | null)[] | null {
  if (current.length !== INVENTORY_CONFIG.baseSlotCount) throw new RangeError(`Inventory plan requires ${INVENTORY_CONFIG.baseSlotCount} slots`);
  createItemStack(incoming.itemId, incoming.quantity);
  const planned = [...current];
  let remainder: ItemStack | null = incoming;

  for (let index = 0; index < planned.length && remainder; index += 1) {
    const existing = planned[index];
    if (!existing || existing.itemId !== remainder.itemId) continue;
    if (existing.quantity >= ITEM_REGISTRY.get(existing.itemId).maxStack) continue;
    const merged = mergeItemStacks(existing, remainder);
    planned[index] = merged.stack;
    remainder = merged.remainder;
  }

  for (let index = 0; index < planned.length && remainder; index += 1) {
    if (planned[index] !== null) continue;
    planned[index] = createItemStack(remainder.itemId, remainder.quantity);
    remainder = null;
  }

  return remainder ? null : Object.freeze(planned);
}

export function planConsumeAndInsert(
  current: readonly (ItemStack | null)[],
  requirements: readonly InventoryItemRequirement[],
  output: ItemStack,
): InventoryTransactionPlan {
  if (current.length !== INVENTORY_CONFIG.baseSlotCount) throw new RangeError(`Inventory plan requires ${INVENTORY_CONFIG.baseSlotCount} slots`);
  createItemStack(output.itemId, output.quantity);
  const totals = new Map<ItemId, number>();
  for (const requirement of requirements) {
    if (!Number.isInteger(requirement.quantity) || requirement.quantity < 1) throw new RangeError(`Invalid item requirement quantity: ${requirement.quantity}`);
    ITEM_REGISTRY.get(requirement.itemId);
    totals.set(requirement.itemId, (totals.get(requirement.itemId) ?? 0) + requirement.quantity);
  }

  for (const [itemId, required] of totals) {
    const owned = current.reduce((total, stack) => total + (stack?.itemId === itemId ? stack.quantity : 0), 0);
    if (owned < required) return Object.freeze({ accepted: false, reason: "not-enough-items", slots: null });
  }

  const consumed = [...current];
  for (const [itemId, required] of totals) {
    let remaining = required;
    for (let index = 0; index < consumed.length && remaining > 0; index += 1) {
      const stack = consumed[index];
      if (!stack || stack.itemId !== itemId) continue;
      const quantity = Math.min(stack.quantity, remaining);
      const nextQuantity = stack.quantity - quantity;
      consumed[index] = nextQuantity > 0 ? createItemStack(itemId, nextQuantity) : null;
      remaining -= quantity;
    }
  }

  const inserted = planInventoryInsertion(consumed, output);
  if (!inserted) return Object.freeze({ accepted: false, reason: "inventory-full", slots: null });
  return Object.freeze({ accepted: true, reason: null, slots: inserted });
}

export class PlayerInventory {
  private readonly stacks: Array<ItemStack | null> = Array.from({ length: INVENTORY_CONFIG.baseSlotCount }, () => null);
  private readonly listeners = new Set<InventoryChangeListener>();
  private lastAccepted: boolean | null = null;

  get slotCount(): number { return INVENTORY_CONFIG.baseSlotCount; }
  get occupiedSlotCount(): number { return this.stacks.reduce((count, stack) => count + Number(stack !== null), 0); }
  get emptySlotCount(): number { return this.slotCount - this.occupiedSlotCount; }
  get lastInsertAccepted(): boolean | null { return this.lastAccepted; }

  getSlots(): readonly InventorySlot[] {
    return Object.freeze(this.stacks.map((stack, index) => Object.freeze({ index, stack })));
  }

  getSlot(index: number): InventorySlot {
    if (!Number.isInteger(index) || index < 0 || index >= this.slotCount) throw new RangeError(`Invalid inventory slot index: ${index}`);
    return Object.freeze({ index, stack: this.stacks[index] ?? null });
  }

  canInsert(incoming: ItemStack): boolean { return planInventoryInsertion(this.stacks, incoming) !== null; }

  tryInsert(incoming: ItemStack): InventoryInsertResult {
    const plan = planInventoryInsertion(this.stacks, incoming);
    if (!plan) {
      this.lastAccepted = false;
      return REJECTED_INSERT;
    }
    const changedSlotIndexes: number[] = [];
    for (let index = 0; index < this.slotCount; index += 1) {
      if (plan[index] === this.stacks[index]) continue;
      this.stacks[index] = plan[index] ?? null;
      changedSlotIndexes.push(index);
    }
    this.lastAccepted = true;
    const result = Object.freeze({ accepted: true, changedSlotIndexes: Object.freeze(changedSlotIndexes) });
    for (const listener of this.listeners) listener(result);
    return result;
  }

  previewConsumeAndInsert(requirements: readonly InventoryItemRequirement[], output: ItemStack): InventoryTransactionPlan {
    return planConsumeAndInsert(this.stacks, requirements, output);
  }

  tryConsumeAndInsert(requirements: readonly InventoryItemRequirement[], output: ItemStack): InventoryTransactionPlan {
    const plan = planConsumeAndInsert(this.stacks, requirements, output);
    if (!plan.accepted || !plan.slots) {
      this.lastAccepted = false;
      return plan;
    }
    const changedSlotIndexes: number[] = [];
    for (let index = 0; index < this.slotCount; index += 1) {
      if (plan.slots[index] === this.stacks[index]) continue;
      this.stacks[index] = plan.slots[index] ?? null;
      changedSlotIndexes.push(index);
    }
    this.lastAccepted = true;
    const change = Object.freeze({ accepted: true, changedSlotIndexes: Object.freeze(changedSlotIndexes) });
    for (const listener of this.listeners) listener(change);
    return plan;
  }

  /** Equipment-only primitive: atomically replaces one expected whole stack. */
  exchangeWholeStack(index: number, expected: ItemStack, replacement: ItemStack | null): boolean {
    const current = this.getSlot(index).stack;
    if (current !== expected) return false;
    if (replacement) createItemStack(replacement.itemId, replacement.quantity);
    this.stacks[index] = replacement;
    const result = Object.freeze({ accepted: true, changedSlotIndexes: Object.freeze([index]) });
    for (const listener of this.listeners) listener(result);
    return true;
  }

  totalQuantity(itemId: ItemId): number {
    return this.stacks.reduce((total, stack) => total + (stack?.itemId === itemId ? stack.quantity : 0), 0);
  }

  subscribe(listener: InventoryChangeListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }
}
