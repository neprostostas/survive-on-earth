import type { ItemDefinition } from "./ItemDefinition";
import type { ItemId } from "./ItemId";
import type { ItemResult } from "./ItemResult";

export interface ItemStack {
  readonly itemId: ItemId;
  readonly quantity: number;
}

export interface StackMergeResult {
  readonly stack: ItemStack;
  readonly remainder: ItemStack | null;
}

const INITIAL_DEFINITIONS: readonly ItemDefinition[] = Object.freeze([
  Object.freeze({ id: "pine-log", displayName: "Pine Log", category: "resource", maxStack: 20, iconId: "pine-log" }),
  Object.freeze({ id: "limestone", displayName: "Limestone", category: "resource", maxStack: 20, iconId: "limestone" }),
]);

export class ItemRegistry {
  private readonly definitions: ReadonlyMap<ItemId, ItemDefinition>;
  private readonly all: readonly ItemDefinition[];

  constructor(definitions: readonly ItemDefinition[]) {
    const map = new Map<ItemId, ItemDefinition>();
    for (const definition of definitions) {
      if (map.has(definition.id)) throw new Error(`Duplicate item definition: ${definition.id}`);
      if (!Number.isInteger(definition.maxStack) || definition.maxStack < 1) throw new Error(`Invalid max stack for item: ${definition.id}`);
      map.set(definition.id, Object.freeze({ ...definition }));
    }
    this.definitions = map;
    this.all = Object.freeze([...map.values()]);
  }

  has(id: string): id is ItemId { return this.definitions.has(id as ItemId); }

  get(id: ItemId | string): ItemDefinition {
    const definition = this.definitions.get(id as ItemId);
    if (!definition) throw new Error(`Unknown item definition: ${id}`);
    return definition;
  }

  getAll(): readonly ItemDefinition[] { return this.all; }
}

export const ITEM_REGISTRY = new ItemRegistry(INITIAL_DEFINITIONS);

export function createItemStack(itemId: ItemId, quantity: number): ItemStack {
  const definition = ITEM_REGISTRY.get(itemId);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > definition.maxStack) {
    throw new RangeError(`Invalid ${itemId} stack quantity ${quantity}; expected 1..${definition.maxStack}`);
  }
  return Object.freeze({ itemId, quantity });
}

export function createItemStacks(itemId: ItemId, totalQuantity: number): readonly ItemStack[] {
  if (!Number.isInteger(totalQuantity) || totalQuantity < 1) throw new RangeError(`Invalid total item quantity: ${totalQuantity}`);
  const maxStack = ITEM_REGISTRY.get(itemId).maxStack;
  const stacks: ItemStack[] = [];
  let remaining = totalQuantity;
  while (remaining > 0) {
    const quantity = Math.min(maxStack, remaining);
    stacks.push(createItemStack(itemId, quantity));
    remaining -= quantity;
  }
  return Object.freeze(stacks);
}

export function mergeItemStacks(left: ItemStack, right: ItemStack): StackMergeResult {
  validateStack(left);
  validateStack(right);
  if (left.itemId !== right.itemId) throw new Error(`Cannot merge different item types: ${left.itemId} and ${right.itemId}`);
  const maxStack = ITEM_REGISTRY.get(left.itemId).maxStack;
  const combined = left.quantity + right.quantity;
  return Object.freeze({
    stack: createItemStack(left.itemId, Math.min(maxStack, combined)),
    remainder: combined > maxStack ? createItemStack(left.itemId, combined - maxStack) : null,
  });
}

export function createItemResult(sourceId: string, itemId: ItemId, quantity: number): ItemResult {
  if (!sourceId) throw new Error("Item result source ID is required");
  return Object.freeze({ sourceId, itemId, quantity, stacks: createItemStacks(itemId, quantity) });
}

function validateStack(stack: ItemStack): void {
  const definition = ITEM_REGISTRY.get(stack.itemId);
  if (!Number.isInteger(stack.quantity) || stack.quantity < 1 || stack.quantity > definition.maxStack) {
    throw new RangeError(`Invalid ${stack.itemId} stack quantity: ${stack.quantity}`);
  }
}
