import type { ItemId } from "../items/ItemId";
import {
  ITEM_REGISTRY,
  cloneItemStack,
  createItemStack,
  expandToLegalStacks,
  isStackMergeable,
  mergeItemStacks,
  type ItemStack,
} from "../items/ItemSystem.ts";
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

function planInsertLegalChunk(
  current: readonly (ItemStack | null)[],
  chunk: ItemStack,
  pocketBoundary: number,
): (ItemStack | null)[] | null {
  const planned = [...current];
  let remainder: ItemStack | null = cloneItemStack(chunk);
  const cap = planned.length;
  const pocketEnd = Math.min(Math.max(0, pocketBoundary), cap);
  const maxStack = ITEM_REGISTRY.get(chunk.itemId).maxStack;
  const canMerge = isStackMergeable(chunk);

  const mergeRange = (from: number, to: number): void => {
    if (!canMerge || !remainder) return;
    for (let index = from; index < to && remainder; index += 1) {
      const existing = planned[index];
      if (!existing || existing.itemId !== remainder.itemId || !isStackMergeable(existing)) continue;
      if (existing.quantity >= maxStack) continue;
      const merged = mergeItemStacks(existing, remainder);
      planned[index] = merged.stack;
      remainder = merged.remainder;
    }
  };

  const fillEmptyRange = (from: number, to: number): void => {
    for (let index = from; index < to && remainder; index += 1) {
      if (planned[index] !== null) continue;
      // Always place at most one maxStack (or the remaining legal chunk).
      const take = Math.min(maxStack, remainder.quantity);
      if (take === remainder.quantity) {
        planned[index] = cloneItemStack(remainder);
        remainder = null;
      } else {
        planned[index] = createItemStack(remainder.itemId, take);
        remainder = createItemStack(remainder.itemId, remainder.quantity - take);
      }
    }
  };

  // Pockets first (merge → empty), then backpack storage (merge → empty).
  mergeRange(0, pocketEnd);
  fillEmptyRange(0, pocketEnd);
  mergeRange(pocketEnd, cap);
  fillEmptyRange(pocketEnd, cap);

  return remainder ? null : planned;
}

export function planInventoryInsertion(
  current: readonly (ItemStack | null)[],
  incoming: ItemStack,
  /** Prefer base pockets for both merges and new stacks before backpack storage. */
  pocketBoundary: number = INVENTORY_CONFIG.baseSlotCount,
): readonly (ItemStack | null)[] | null {
  assertPlanLength(current);
  const chunks = expandToLegalStacks(incoming);
  let planned: (ItemStack | null)[] = [...current];
  for (const chunk of chunks) {
    const next = planInsertLegalChunk(planned, chunk, pocketBoundary);
    if (!next) return null;
    planned = next;
  }
  return Object.freeze(planned);
}

export interface PartialInventoryInsertPlan {
  readonly slots: readonly (ItemStack | null)[];
  readonly insertedQuantity: number;
  readonly overflowQuantity: number;
}

/**
 * Harvest delivery planning: insert as much as possible.
 * Prefer base pockets (merge → empty) before backpack storage.
 * Overflow is reported, never requires failure rejection of the whole stack.
 * Does not change manual ground full-stack-or-nothing pickup (tryInsert).
 */
export function planInventoryInsertionPartial(
  current: readonly (ItemStack | null)[],
  incoming: ItemStack,
  pocketBoundary: number = INVENTORY_CONFIG.baseSlotCount,
): PartialInventoryInsertPlan {
  assertPlanLength(current);
  const chunks = expandToLegalStacks(incoming);
  let planned: (ItemStack | null)[] = [...current];
  let insertedQuantity = 0;
  const totalRequested = chunks.reduce((sum, c) => sum + c.quantity, 0);

  for (const chunk of chunks) {
    const partial = planPartialSingleChunk(planned, chunk, pocketBoundary);
    if (partial.insertedQuantity === 0) break;
    planned = [...partial.slots];
    insertedQuantity += partial.insertedQuantity;
    if (partial.insertedQuantity < chunk.quantity) break;
  }

  return Object.freeze({
    slots: Object.freeze(planned),
    insertedQuantity,
    overflowQuantity: Math.max(0, totalRequested - insertedQuantity),
  });
}

/** Partial insert of a single already-legal chunk (may fill only part of its quantity). */
function planPartialSingleChunk(
  current: readonly (ItemStack | null)[],
  chunk: ItemStack,
  pocketBoundary: number,
): { slots: readonly (ItemStack | null)[]; insertedQuantity: number } {
  const planned = [...current];
  let remaining = chunk.quantity;
  const maxStack = ITEM_REGISTRY.get(chunk.itemId).maxStack;
  const cap = planned.length;
  const pocketEnd = Math.min(Math.max(0, pocketBoundary), cap);
  const canMerge = isStackMergeable(chunk);

  const mergeRange = (from: number, to: number): void => {
    if (!canMerge) return;
    for (let index = from; index < to && remaining > 0; index += 1) {
      const existing = planned[index];
      if (!existing || existing.itemId !== chunk.itemId || !isStackMergeable(existing)) continue;
      if (existing.quantity >= maxStack) continue;
      const room = maxStack - existing.quantity;
      const take = Math.min(room, remaining);
      planned[index] = createItemStack(chunk.itemId, existing.quantity + take);
      remaining -= take;
    }
  };

  const fillEmptyRange = (from: number, to: number): void => {
    for (let index = from; index < to && remaining > 0; index += 1) {
      if (planned[index] !== null) continue;
      if (!canMerge) {
        planned[index] = cloneItemStack(chunk);
        remaining = 0;
        continue;
      }
      const take = Math.min(maxStack, remaining);
      planned[index] = createItemStack(chunk.itemId, take);
      remaining -= take;
    }
  };

  mergeRange(0, pocketEnd);
  fillEmptyRange(0, pocketEnd);
  mergeRange(pocketEnd, cap);
  fillEmptyRange(pocketEnd, cap);

  return Object.freeze({
    slots: Object.freeze(planned),
    insertedQuantity: chunk.quantity - remaining,
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
    const activeBefore = this.slotCount;
    for (let i = 0; i < this.stacks.length; i += 1) this.stacks[i] = null;
    if (this.extraSlotCount !== 0) {
      this.extraSlotCount = 0;
      for (const listener of this.capacityListeners) listener(this.slotCount);
    }
    this.lastAccepted = null;
    // Emit every previously-active index so UI listeners don't keep stale icons after a domain wipe.
    this.emitSlotRange(0, activeBefore);
  }

  /**
   * Deterministic save restore: place stacks at exact indices after capacity is set.
   * Oversize stacks are split by maxStack; leftovers try-insert into free cells.
   */
  restoreSlots(slots: readonly { readonly index: number; readonly stack: ItemStack }[], extra: number): void {
    // Mute intermediate clear notification — final state is published once below.
    this.clearAllStorageQuiet();
    this.setExtraSlotCount(extra);
    const overflow: ItemStack[] = [];
    for (const entry of slots) {
      const { index } = entry;
      let legal: readonly ItemStack[];
      try {
        legal = expandToLegalStacks(entry.stack);
      } catch {
        continue;
      }
      for (let i = 0; i < legal.length; i += 1) {
        const chunk = legal[i]!;
        if (
          i === 0
          && Number.isInteger(index)
          && index >= 0
          && index < this.slotCount
          && this.stacks[index] === null
        ) {
          this.stacks[index] = chunk;
        } else {
          overflow.push(chunk);
        }
      }
    }
    for (const stack of overflow) this.tryInsertQuiet(stack);
    this.sanitizeActiveStacks();
    // Full-capacity notify: subscribers with index-only patches must re-read every cell after load.
    this.emitSlotRange(0, this.slotCount);
  }

  /** clearAllStorage without listener storm (paired with restoreSlots final emit). */
  private clearAllStorageQuiet(): void {
    for (let i = 0; i < this.stacks.length; i += 1) this.stacks[i] = null;
    if (this.extraSlotCount !== 0) {
      this.extraSlotCount = 0;
      for (const listener of this.capacityListeners) listener(this.slotCount);
    }
    this.lastAccepted = null;
  }

  /** tryInsert without change listeners — bulk restore batches a single final emit. */
  private tryInsertQuiet(incoming: ItemStack): boolean {
    const plan = planInventoryInsertion(this.activeView(), incoming);
    if (!plan) {
      this.lastAccepted = false;
      return false;
    }
    for (let index = 0; index < this.slotCount; index += 1) {
      this.stacks[index] = plan[index] ?? null;
    }
    this.lastAccepted = true;
    return true;
  }

  private emitSlotRange(from: number, to: number): void {
    const start = Math.max(0, Math.floor(from));
    const end = Math.max(start, Math.floor(to));
    const indexes: number[] = [];
    for (let i = start; i < end; i += 1) indexes.push(i);
    const result = Object.freeze({
      accepted: true,
      changedSlotIndexes: Object.freeze(indexes) as readonly number[],
    });
    for (const listener of this.listeners) listener(result);
  }

  /** Rewrite any illegal overfull stacks into maxStack chunks (defensive recovery). */
  sanitizeActiveStacks(): void {
    const overflow: ItemStack[] = [];
    for (let index = 0; index < this.slotCount; index += 1) {
      const stack = this.stacks[index];
      if (!stack) continue;
      try {
        cloneItemStack(stack);
        continue; // already legal
      } catch {
        /* expand corrupt / oversize */
      }
      let legal: readonly ItemStack[];
      try {
        legal = expandToLegalStacks(stack);
      } catch {
        this.stacks[index] = null;
        continue;
      }
      this.stacks[index] = legal[0] ?? null;
      for (let i = 1; i < legal.length; i += 1) overflow.push(legal[i]!);
    }
    for (const stack of overflow) {
      const plan = planInventoryInsertion(this.activeView(), stack);
      if (!plan) break;
      for (let index = 0; index < this.slotCount; index += 1) {
        if (plan[index] === this.stacks[index]) continue;
        this.stacks[index] = plan[index] ?? null;
      }
    }
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
    this.sanitizeActiveStacks();
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
    if (replacement) {
      try {
        cloneItemStack(replacement);
        this.stacks[index] = replacement;
      } catch {
        try {
          const legal = expandToLegalStacks(replacement);
          if (legal.length !== 1) return false;
          this.stacks[index] = legal[0]!;
        } catch {
          return false;
        }
      }
    } else {
      this.stacks[index] = null;
    }
    const result = Object.freeze({ accepted: true, changedSlotIndexes: Object.freeze([index]) });
    for (const listener of this.listeners) listener(result);
    return true;
  }

  /** Place whole stack into an empty slot (unequip / rearrange target). Preserves identity when already legal. */
  placeIntoEmptySlot(index: number, stack: ItemStack): boolean {
    if (!Number.isInteger(index) || index < 0 || index >= this.slotCount) {
      throw new RangeError(`Invalid inventory slot index: ${index}`);
    }
    if (this.stacks[index] !== null) return false;
    try {
      cloneItemStack(stack);
      this.stacks[index] = stack;
    } catch {
      try {
        const legal = expandToLegalStacks(stack);
        if (legal.length !== 1) return false;
        this.stacks[index] = legal[0]!;
      } catch {
        return false;
      }
    }
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
      && isStackMergeable(from)
      && isStackMergeable(to)
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

  /**
   * Nearest empty slot to `fromIndex` by absolute grid index distance.
   * Ties prefer lower indices. Ignores `fromIndex` itself.
   */
  findNearestEmptySlot(fromIndex: number): number | null {
    if (!Number.isInteger(fromIndex) || fromIndex < 0 || fromIndex >= this.slotCount) {
      return null;
    }
    let best: number | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < this.slotCount; i += 1) {
      if (i === fromIndex || this.stacks[i] !== null) continue;
      const dist = Math.abs(i - fromIndex);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    return best;
  }

  /**
   * Split non-durable stack into a new cell at the nearest empty slot
   * (not merge-into-existing, so half does not glue back onto the source).
   */
  trySplitStack(index: number, takeQuantity: number): boolean {
    const stack = this.getSlot(index).stack;
    if (!stack || stack.currentDurability !== undefined) return false;
    if (!Number.isInteger(takeQuantity) || takeQuantity < 1 || takeQuantity >= stack.quantity) return false;
    const dest = this.findNearestEmptySlot(index);
    if (dest === null) return false;
    const leave = stack.quantity - takeQuantity;
    this.stacks[index] = createItemStack(stack.itemId, leave);
    this.stacks[dest] = createItemStack(stack.itemId, takeQuantity);
    this.lastAccepted = true;
    const change = Object.freeze({
      accepted: true,
      changedSlotIndexes: Object.freeze([index, dest]),
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
    this.sanitizeActiveStacks();
    this.lastAccepted = accepted;
    const result = Object.freeze({ accepted, changedSlotIndexes: Object.freeze(changedSlotIndexes) });
    for (const listener of this.listeners) listener(result);
    return result;
  }
}
