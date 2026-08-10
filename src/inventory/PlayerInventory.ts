import type { ItemId } from "../items/ItemId";
import { ITEM_REGISTRY, cloneItemStack, createItemStack, mergeItemStacks, type ItemStack } from "../items/ItemSystem.ts";
import { INVENTORY_CONFIG, inventoryStorageLength } from "./inventoryConfig.ts";

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
export type InventoryCapacityListener = (activeSlotCount: number) => void;

const REJECTED_INSERT: InventoryInsertResult = Object.freeze({ accepted: false, changedSlotIndexes: Object.freeze([]) });

function assertPlanLength(current: readonly (ItemStack | null)[]): void {
  if (current.length < INVENTORY_CONFIG.baseSlotCount || current.length > inventoryStorageLength()) {
    throw new RangeError(`Inventory plan length ${current.length} out of allowed range`);
  }
}

export function planInventoryInsertion(
  current: readonly (ItemStack | null)[],
  incoming: ItemStack,
): readonly (ItemStack | null)[] | null {
  assertPlanLength(current);
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
  assertPlanLength(current);
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
  assertPlanLength(current);
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

/**
 * Single carried inventory: permanent POCKETS (0..base-1) + optional backpack extra slots.
 * Active capacity is derived externally (BackpackEquipSystem) via setExtraSlotCount.
 */
export class PlayerInventory {
  private readonly stacks: Array<ItemStack | null> = Array.from({ length: inventoryStorageLength() }, () => null);
  private extraSlotCount = 0;
  private readonly listeners = new Set<InventoryChangeListener>();
  private readonly capacityListeners = new Set<InventoryCapacityListener>();
  private lastAccepted: boolean | null = null;

  get baseSlotCount(): number { return INVENTORY_CONFIG.baseSlotCount; }
  get extraSlots(): number { return this.extraSlotCount; }
  /** Active inventory capacity: base pockets + backpack bonus. */
  get slotCount(): number { return INVENTORY_CONFIG.baseSlotCount + this.extraSlotCount; }
  get occupiedSlotCount(): number {
    let count = 0;
    for (let i = 0; i < this.slotCount; i += 1) {
      if (this.stacks[i] !== null) count += 1;
    }
    return count;
  }
  get emptySlotCount(): number { return this.slotCount - this.occupiedSlotCount; }
  get lastInsertAccepted(): boolean | null { return this.lastAccepted; }

  isBasePocketIndex(index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < INVENTORY_CONFIG.baseSlotCount;
  }

  isBackpackStorageIndex(index: number): boolean {
    return Number.isInteger(index) && index >= INVENTORY_CONFIG.baseSlotCount && index < this.slotCount;
  }

  /** True when every active backpack-storage slot (base..slotCount-1) is empty. */
  areBackpackStorageSlotsEmpty(): boolean {
    for (let i = INVENTORY_CONFIG.baseSlotCount; i < this.slotCount; i += 1) {
      if (this.stacks[i] !== null) return false;
    }
    return true;
  }

  /**
   * Expand / shrink active capacity. Shrink requires empty backpack-storage slots.
   * Does not read backpack domain — caller supplies extra from metadata.
   */
  setExtraSlotCount(extra: number): boolean {
    if (!Number.isInteger(extra) || extra < 0 || extra > INVENTORY_CONFIG.reservedExtraSlotCapacity) {
      return false;
    }
    const nextActive = INVENTORY_CONFIG.baseSlotCount + extra;
    if (extra < this.extraSlotCount) {
      for (let i = nextActive; i < this.slotCount; i += 1) {
        if (this.stacks[i] !== null) return false;
      }
    }
    if (this.extraSlotCount === extra) return true;
    this.extraSlotCount = extra;
    for (const listener of this.capacityListeners) listener(this.slotCount);
    return true;
  }

  /** Wipe every reserved storage cell and reset backpack extra capacity (save load / new game). */
  clearAllStorage(): void {
    for (let i = 0; i < this.stacks.length; i += 1) this.stacks[i] = null;
    if (this.extraSlotCount !== 0) {
      this.extraSlotCount = 0;
      for (const listener of this.capacityListeners) listener(this.slotCount);
    }
    this.lastAccepted = null;
    const result = Object.freeze({ accepted: true, changedSlotIndexes: Object.freeze([]) as readonly number[] });
    for (const listener of this.listeners) listener(result);
  }

  /**
   * Deterministic save restore: place stacks at exact indices after capacity is set.
   * Overflows that no longer fit try-insert into remaining free cells.
   */
  restoreSlots(slots: readonly { readonly index: number; readonly stack: ItemStack }[], extra: number): void {
    this.clearAllStorage();
    this.setExtraSlotCount(extra);
    const overflow: ItemStack[] = [];
    for (const entry of slots) {
      const { index, stack } = entry;
      if (!Number.isInteger(index) || index < 0 || index >= this.slotCount || this.stacks[index] !== null) {
        overflow.push(stack);
        continue;
      }
      this.stacks[index] = stack;
    }
    for (const stack of overflow) this.tryInsert(stack);
    const result = Object.freeze({ accepted: true, changedSlotIndexes: Object.freeze([]) as readonly number[] });
    for (const listener of this.listeners) listener(result);
  }

  getSlots(): readonly InventorySlot[] {
    const slots: InventorySlot[] = [];
    for (let index = 0; index < this.slotCount; index += 1) {
      slots.push(Object.freeze({ index, stack: this.stacks[index] ?? null }));
    }
    return Object.freeze(slots);
  }

  getSlot(index: number): InventorySlot {
    if (!Number.isInteger(index) || index < 0 || index >= this.slotCount) {
      throw new RangeError(`Invalid inventory slot index: ${index}`);
    }
    return Object.freeze({ index, stack: this.stacks[index] ?? null });
  }

  private activeView(): (ItemStack | null)[] {
    return this.stacks.slice(0, this.slotCount);
  }

  canInsert(incoming: ItemStack): boolean { return planInventoryInsertion(this.activeView(), incoming) !== null; }

  tryInsert(incoming: ItemStack): InventoryInsertResult {
    const plan = planInventoryInsertion(this.activeView(), incoming);
    if (!plan) {
      this.lastAccepted = false;
      return REJECTED_INSERT;
    }
    return this.applyPlan(plan, true);
  }

  /**
   * Unequip destination: insert only into permanent POCKETS (0..base-1).
   * Prevents placing the bag into backpack-storage that will shut down next.
   * Preserves stack identity when placing into an empty pocket as the whole stack.
   */
  tryInsertIntoBasePockets(incoming: ItemStack): InventoryInsertResult {
    const baseView = this.stacks.slice(0, INVENTORY_CONFIG.baseSlotCount);
    const plan = planInventoryInsertion(baseView, incoming);
    if (!plan) {
      this.lastAccepted = false;
      return REJECTED_INSERT;
    }
    const changedSlotIndexes: number[] = [];
    for (let index = 0; index < INVENTORY_CONFIG.baseSlotCount; index += 1) {
      if (plan[index] === this.stacks[index]) continue;
      // Prefer original reference when slot was empty and plan is a full matching stack.
      if (this.stacks[index] === null && plan[index] && plan[index]!.itemId === incoming.itemId
        && plan[index]!.quantity === incoming.quantity
        && plan[index]!.currentDurability === incoming.currentDurability) {
        this.stacks[index] = incoming;
      } else {
        this.stacks[index] = plan[index] ?? null;
      }
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
    const plan = planInventoryInsertionPartial(this.activeView(), incoming);
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
    return planConsumeAndInsert(this.activeView(), requirements, output);
  }

  tryConsumeAndInsert(requirements: readonly InventoryItemRequirement[], output: ItemStack): InventoryTransactionPlan {
    const plan = planConsumeAndInsert(this.activeView(), requirements, output);
    if (!plan.accepted || !plan.slots) {
      this.lastAccepted = false;
      return plan;
    }
    this.applyPlan(plan.slots, true);
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

  /** Place whole stack into an empty slot (unequip / rearrange target). Preserves identity. */
  placeIntoEmptySlot(index: number, stack: ItemStack): boolean {
    if (!Number.isInteger(index) || index < 0 || index >= this.slotCount) {
      throw new RangeError(`Invalid inventory slot index: ${index}`);
    }
    if (this.stacks[index] !== null) return false;
    cloneItemStack(stack);
    this.stacks[index] = stack;
    const result = Object.freeze({ accepted: true, changedSlotIndexes: Object.freeze([index]) });
    for (const listener of this.listeners) listener(result);
    return true;
  }

  /**
   * Reorder: swap two inventory slots. Same-type non-durable stacks merge into the target.
   */
  rearrangeSlots(fromIndex: number, toIndex: number): InventoryInsertResult {
    if (!Number.isInteger(fromIndex) || fromIndex < 0 || fromIndex >= this.slotCount) {
      throw new RangeError(`Invalid inventory slot index: ${fromIndex}`);
    }
    if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= this.slotCount) {
      throw new RangeError(`Invalid inventory slot index: ${toIndex}`);
    }
    if (fromIndex === toIndex) return REJECTED_INSERT;
    const from = this.stacks[fromIndex];
    if (!from) return REJECTED_INSERT;
    const to = this.stacks[toIndex];
    if (!to) {
      this.stacks[toIndex] = from;
      this.stacks[fromIndex] = null;
    } else if (
      from.itemId === to.itemId
      && from.currentDurability === undefined
      && to.currentDurability === undefined
    ) {
      const merged = mergeItemStacks(to, from);
      this.stacks[toIndex] = merged.stack;
      this.stacks[fromIndex] = merged.remainder;
    } else {
      this.stacks[fromIndex] = to;
      this.stacks[toIndex] = from;
    }
    this.lastAccepted = true;
    const result = Object.freeze({
      accepted: true,
      changedSlotIndexes: Object.freeze([fromIndex, toIndex]),
    });
    for (const listener of this.listeners) listener(result);
    return result;
  }

  totalQuantity(itemId: ItemId): number {
    let total = 0;
    for (let i = 0; i < this.slotCount; i += 1) {
      const stack = this.stacks[i];
      if (stack?.itemId === itemId) total += stack.quantity;
    }
    return total;
  }

  /** Split non-durable stack: leave remainder, insert new stack with take quantity. */
  trySplitStack(index: number, takeQuantity: number): boolean {
    const stack = this.getSlot(index).stack;
    if (!stack || stack.currentDurability !== undefined) return false;
    if (!Number.isInteger(takeQuantity) || takeQuantity < 1 || takeQuantity >= stack.quantity) return false;
    const leave = stack.quantity - takeQuantity;
    const moved = createItemStack(stack.itemId, takeQuantity);
    if (!this.canInsert(moved)) return false;
    this.stacks[index] = createItemStack(stack.itemId, leave);
    const insert = this.tryInsert(moved);
    if (!insert.accepted) {
      this.stacks[index] = stack;
      return false;
    }
    const change = Object.freeze({
      accepted: true,
      changedSlotIndexes: Object.freeze([index, ...insert.changedSlotIndexes]),
    });
    for (const listener of this.listeners) listener(change);
    return true;
  }

  tryDeleteStack(index: number, expected?: ItemStack): boolean {
    const stack = this.getSlot(index).stack;
    if (!stack) return false;
    if (expected && stack !== expected) return false;
    this.stacks[index] = null;
    const change = Object.freeze({ accepted: true, changedSlotIndexes: Object.freeze([index]) });
    for (const listener of this.listeners) listener(change);
    return true;
  }

  /** Lowest occupied slot index holding the item, or null. Deterministic ascending scan. */
  findFirstSlotByItemId(itemId: ItemId): number | null {
    ITEM_REGISTRY.get(itemId);
    for (let index = 0; index < this.slotCount; index += 1) {
      if (this.stacks[index]?.itemId === itemId) return index;
    }
    return null;
  }

  subscribe(listener: InventoryChangeListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  subscribeCapacity(listener: InventoryCapacityListener): () => void {
    this.capacityListeners.add(listener);
    return () => { this.capacityListeners.delete(listener); };
  }

  private applyPlan(plan: readonly (ItemStack | null)[], accepted: boolean): InventoryInsertResult {
    const changedSlotIndexes: number[] = [];
    for (let index = 0; index < this.slotCount; index += 1) {
      if (plan[index] === this.stacks[index]) continue;
      this.stacks[index] = plan[index] ?? null;
      changedSlotIndexes.push(index);
    }
    this.lastAccepted = accepted;
    const result = Object.freeze({ accepted, changedSlotIndexes: Object.freeze(changedSlotIndexes) });
    for (const listener of this.listeners) listener(result);
    return result;
  }
}
