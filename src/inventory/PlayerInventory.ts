import type { ItemId } from "../items/ItemId";
import { ITEM_REGISTRY, cloneItemStack, createItemStack, mergeItemStacks, type ItemStack } from "../items/ItemSystem.ts";
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

export interface DurabilityConsumeResult {
  readonly accepted: boolean;
  readonly slotIndex: number;
  readonly itemId: ItemId;
  readonly before: number;
  readonly after: number;
  readonly broke: boolean;
  readonly maxDurability: number;
}

export type InventoryChangeListener = (result: InventoryInsertResult) => void;

const REJECTED_INSERT: InventoryInsertResult = Object.freeze({ accepted: false, changedSlotIndexes: Object.freeze([]) });

export function planInventoryInsertion(
  current: readonly (ItemStack | null)[],
  incoming: ItemStack,
): readonly (ItemStack | null)[] | null {
  if (current.length !== INVENTORY_CONFIG.baseSlotCount) throw new RangeError(`Inventory plan requires ${INVENTORY_CONFIG.baseSlotCount} slots`);
  cloneItemStack(incoming);
  const planned = [...current];
  let remainder: ItemStack | null = cloneItemStack(incoming);

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
    planned[index] = cloneItemStack(remainder);
    remainder = null;
  }

  return remainder ? null : Object.freeze(planned);
}

export interface PartialInventoryInsertPlan {
  readonly slots: readonly (ItemStack | null)[];
  readonly insertedQuantity: number;
  readonly overflowQuantity: number;
}

/**
 * Harvest delivery planning: insert as much as possible (merge → empty slots).
 * Overflow is reported, never requires failure rejection of the whole stack.
 * Does not change manual ground full-stack-or-nothing pickup (tryInsert).
 */
export function planInventoryInsertionPartial(
  current: readonly (ItemStack | null)[],
  incoming: ItemStack,
): PartialInventoryInsertPlan {
  if (current.length !== INVENTORY_CONFIG.baseSlotCount) throw new RangeError(`Inventory plan requires ${INVENTORY_CONFIG.baseSlotCount} slots`);
  cloneItemStack(incoming);
  const planned = [...current];
  let remaining = incoming.quantity;
  const maxStack = ITEM_REGISTRY.get(incoming.itemId).maxStack;
  // Durable tools never merge; quantity is always 1.
  if (incoming.currentDurability !== undefined) {
    for (let index = 0; index < planned.length && remaining > 0; index += 1) {
      if (planned[index] !== null) continue;
      planned[index] = cloneItemStack(incoming);
      remaining = 0;
    }
    const insertedQuantity = incoming.quantity - remaining;
    return Object.freeze({
      slots: Object.freeze(planned),
      insertedQuantity,
      overflowQuantity: remaining,
    });
  }

  for (let index = 0; index < planned.length && remaining > 0; index += 1) {
    const existing = planned[index];
    if (!existing || existing.itemId !== incoming.itemId) continue;
    if (existing.quantity >= maxStack) continue;
    const room = maxStack - existing.quantity;
    const take = Math.min(room, remaining);
    planned[index] = createItemStack(incoming.itemId, existing.quantity + take);
    remaining -= take;
  }

  for (let index = 0; index < planned.length && remaining > 0; index += 1) {
    if (planned[index] !== null) continue;
    const take = Math.min(maxStack, remaining);
    planned[index] = createItemStack(incoming.itemId, take);
    remaining -= take;
  }

  const insertedQuantity = incoming.quantity - remaining;
  return Object.freeze({
    slots: Object.freeze(planned),
    insertedQuantity,
    overflowQuantity: remaining,
  });
}

export function planConsumeAndInsert(
  current: readonly (ItemStack | null)[],
  requirements: readonly InventoryItemRequirement[],
  output: ItemStack,
): InventoryTransactionPlan {
  if (current.length !== INVENTORY_CONFIG.baseSlotCount) throw new RangeError(`Inventory plan requires ${INVENTORY_CONFIG.baseSlotCount} slots`);
  cloneItemStack(output);
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
      if (nextQuantity > 0) {
        if (stack.currentDurability !== undefined) {
          throw new Error(`Cannot partially consume durable tool stack: ${itemId}`);
        }
        consumed[index] = createItemStack(itemId, nextQuantity);
      } else {
        consumed[index] = null;
      }
      remaining -= quantity;
    }
  }

  const inserted = planInventoryInsertion(consumed, output);
  if (!inserted) return Object.freeze({ accepted: false, reason: "inventory-full", slots: null });
  return Object.freeze({ accepted: true, reason: null, slots: inserted });
}

export interface InventoryPartialInsertResult {
  readonly insertedQuantity: number;
  readonly overflowQuantity: number;
  readonly changedSlotIndexes: readonly number[];
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

  /**
   * Harvest auto-delivery: insert as much as fits; report overflow (never world-drop).
   * Manual ground pickup must keep using tryInsert (full stack or nothing).
   */
  tryInsertAvailable(incoming: ItemStack): InventoryPartialInsertResult {
    const plan = planInventoryInsertionPartial(this.stacks, incoming);
    if (plan.insertedQuantity === 0) {
      this.lastAccepted = false;
      return Object.freeze({ insertedQuantity: 0, overflowQuantity: plan.overflowQuantity, changedSlotIndexes: Object.freeze([]) });
    }
    const changedSlotIndexes: number[] = [];
    for (let index = 0; index < this.slotCount; index += 1) {
      if (plan.slots[index] === this.stacks[index]) continue;
      this.stacks[index] = plan.slots[index] ?? null;
      changedSlotIndexes.push(index);
    }
    this.lastAccepted = true;
    const result = Object.freeze({
      insertedQuantity: plan.insertedQuantity,
      overflowQuantity: plan.overflowQuantity,
      changedSlotIndexes: Object.freeze(changedSlotIndexes),
    });
    for (const listener of this.listeners) listener(Object.freeze({ accepted: true, changedSlotIndexes: result.changedSlotIndexes }));
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

  /**
   * Harvesting impact: spend exactly one use at a resolved durable tool slot.
   * Last use (1 → 0) empties the slot; never stores 0/50 or negative durability.
   */
  tryConsumeDurability(slotIndex: number, expectedItemId: ItemId, uses = 1): DurabilityConsumeResult {
    if (!Number.isInteger(uses) || uses < 1) {
      throw new RangeError(`Invalid durability use amount: ${uses}`);
    }
    const maxDurability = ITEM_REGISTRY.get(expectedItemId).maxDurability;
    if (maxDurability === undefined) {
      return Object.freeze({ accepted: false, slotIndex, itemId: expectedItemId, before: 0, after: 0, broke: false, maxDurability: 0 });
    }
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= this.slotCount) {
      return Object.freeze({ accepted: false, slotIndex, itemId: expectedItemId, before: 0, after: 0, broke: false, maxDurability });
    }
    const stack = this.stacks[slotIndex];
    if (!stack || stack.itemId !== expectedItemId || stack.currentDurability === undefined) {
      return Object.freeze({ accepted: false, slotIndex, itemId: expectedItemId, before: 0, after: 0, broke: false, maxDurability });
    }
    const before = stack.currentDurability;
    if (before < uses) {
      return Object.freeze({ accepted: false, slotIndex, itemId: expectedItemId, before, after: before, broke: false, maxDurability });
    }
    const after = before - uses;
    const broke = after <= 0;
    this.stacks[slotIndex] = broke
      ? null
      : createItemStack(expectedItemId, stack.quantity, { currentDurability: after });
    this.lastAccepted = true;
    const change = Object.freeze({ accepted: true, changedSlotIndexes: Object.freeze([slotIndex]) });
    for (const listener of this.listeners) listener(change);
    return Object.freeze({
      accepted: true,
      slotIndex,
      itemId: expectedItemId,
      before,
      after: broke ? 0 : after,
      broke,
      maxDurability,
    });
  }

  /** Equipment-only primitive: atomically replaces one expected whole stack. */
  exchangeWholeStack(index: number, expected: ItemStack, replacement: ItemStack | null): boolean {
    const current = this.getSlot(index).stack;
    if (current !== expected) return false;
    if (replacement) cloneItemStack(replacement);
    this.stacks[index] = replacement;
    const result = Object.freeze({ accepted: true, changedSlotIndexes: Object.freeze([index]) });
    for (const listener of this.listeners) listener(result);
    return true;
  }

  totalQuantity(itemId: ItemId): number {
    return this.stacks.reduce((total, stack) => total + (stack?.itemId === itemId ? stack.quantity : 0), 0);
  }

  /** Lowest occupied slot index holding the item, or null. Deterministic ascending scan. */
  findFirstSlotByItemId(itemId: ItemId): number | null {
    ITEM_REGISTRY.get(itemId);
    for (let index = 0; index < this.stacks.length; index += 1) {
      if (this.stacks[index]?.itemId === itemId) return index;
    }
    return null;
  }

  subscribe(listener: InventoryChangeListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }
}
