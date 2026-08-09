import type { ItemDefinition } from "./ItemDefinition";
import type { ItemId } from "./ItemId";
import type { ItemResult } from "./ItemResult";
import { EQUIPMENT_SLOT_IDS } from "../equipment/EquipmentTypes.ts";

export interface ItemStack {
  readonly itemId: ItemId;
  readonly quantity: number;
  /** Present only for items whose definition declares maxDurability. Always 1..max. */
  readonly currentDurability?: number;
}

export interface StackMergeResult {
  readonly stack: ItemStack;
  readonly remainder: ItemStack | null;
}

export interface ItemStackCreateOptions {
  readonly currentDurability?: number;
}

const INITIAL_DEFINITIONS: readonly ItemDefinition[] = Object.freeze([
  Object.freeze({ id: "pine-log", displayName: "Pine Log", category: "resource", maxStack: 20, iconId: "pine-log" }),
  Object.freeze({ id: "limestone", displayName: "Limestone", category: "resource", maxStack: 20, iconId: "limestone" }),
  Object.freeze({ id: "dad-hat", displayName: "Dad Hat", category: "armor", maxStack: 1, iconId: "dad-hat", equipment: Object.freeze({ slot: "head", armor: 2 }) }),
  Object.freeze({ id: "shirt", displayName: "Shirt", category: "armor", maxStack: 1, iconId: "shirt", equipment: Object.freeze({ slot: "torso", armor: 3 }) }),
  Object.freeze({ id: "cargo-pants", displayName: "Cargo Pants", category: "armor", maxStack: 1, iconId: "cargo-pants", equipment: Object.freeze({ slot: "legs", armor: 3 }) }),
  Object.freeze({ id: "sneakers", displayName: "Sneakers", category: "armor", maxStack: 1, iconId: "sneakers", equipment: Object.freeze({ slot: "feet", armor: 0 }) }),
  Object.freeze({ id: "hatchet", displayName: "Hatchet", category: "tool", maxStack: 1, iconId: "hatchet", maxDurability: 50, meleeCombat: Object.freeze({ damage: 7, attacksPerSecond: 0.9 }) }),
  Object.freeze({ id: "pickaxe", displayName: "Pickaxe", category: "tool", maxStack: 1, iconId: "pickaxe", maxDurability: 50, meleeCombat: Object.freeze({ damage: 7, attacksPerSecond: 1.1 }) }),
]);

export class ItemRegistry {
  private readonly definitions: ReadonlyMap<ItemId, ItemDefinition>;
  private readonly all: readonly ItemDefinition[];

  constructor(definitions: readonly ItemDefinition[]) {
    const map = new Map<ItemId, ItemDefinition>();
    for (const definition of definitions) {
      if (map.has(definition.id)) throw new Error(`Duplicate item definition: ${definition.id}`);
      if (!Number.isInteger(definition.maxStack) || definition.maxStack < 1) throw new Error(`Invalid max stack for item: ${definition.id}`);
      if (definition.category === "armor") {
        if (!definition.equipment || !EQUIPMENT_SLOT_IDS.includes(definition.equipment.slot) || !Number.isFinite(definition.equipment.armor) || definition.equipment.armor < 0) {
          throw new Error(`Invalid equipment metadata for item: ${definition.id}`);
        }
      } else if (definition.equipment) throw new Error(`Non-armor item cannot declare equipment metadata: ${definition.id}`);
      if (definition.maxDurability !== undefined) {
        if (definition.category !== "tool") throw new Error(`Only tools may declare maxDurability: ${definition.id}`);
        if (!Number.isInteger(definition.maxDurability) || definition.maxDurability < 1) {
          throw new Error(`Invalid maxDurability for item: ${definition.id}`);
        }
      }
      if (definition.meleeCombat !== undefined) {
        if (!Number.isFinite(definition.meleeCombat.damage) || definition.meleeCombat.damage <= 0) {
          throw new Error(`Invalid melee damage for item: ${definition.id}`);
        }
        if (!Number.isFinite(definition.meleeCombat.attacksPerSecond) || definition.meleeCombat.attacksPerSecond <= 0) {
          throw new Error(`Invalid melee attack speed for item: ${definition.id}`);
        }
      }
      map.set(definition.id, Object.freeze({
        ...definition,
        equipment: definition.equipment ? Object.freeze({ ...definition.equipment }) : undefined,
        meleeCombat: definition.meleeCombat ? Object.freeze({ ...definition.meleeCombat }) : undefined,
      }));
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

/** Fresh durable tools start full; resources/armor have no durability field. */
export function createItemStack(itemId: ItemId, quantity: number, options?: ItemStackCreateOptions): ItemStack {
  const definition = ITEM_REGISTRY.get(itemId);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > definition.maxStack) {
    throw new RangeError(`Invalid ${itemId} stack quantity ${quantity}; expected 1..${definition.maxStack}`);
  }
  const maxDurability = definition.maxDurability;
  if (maxDurability === undefined) {
    if (options?.currentDurability !== undefined) {
      throw new RangeError(`Item ${itemId} does not support durability`);
    }
    return Object.freeze({ itemId, quantity });
  }
  const currentDurability = options?.currentDurability ?? maxDurability;
  if (!Number.isInteger(currentDurability) || currentDurability < 1 || currentDurability > maxDurability) {
    throw new RangeError(`Invalid ${itemId} durability ${currentDurability}; expected 1..${maxDurability}`);
  }
  return Object.freeze({ itemId, quantity, currentDurability });
}

/** Preserve instance durability across inventory placement / copies. */
export function cloneItemStack(stack: ItemStack): ItemStack {
  return stack.currentDurability === undefined
    ? createItemStack(stack.itemId, stack.quantity)
    : createItemStack(stack.itemId, stack.quantity, { currentDurability: stack.currentDurability });
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
  if (left.currentDurability !== undefined || right.currentDurability !== undefined) {
    throw new Error(`Cannot merge durable tool stacks: ${left.itemId}`);
  }
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

/** Read-only view of instance durability against catalog max. */
export function stackDurability(stack: ItemStack): { readonly current: number; readonly max: number } | null {
  const max = ITEM_REGISTRY.get(stack.itemId).maxDurability;
  if (max === undefined) return null;
  const current = stack.currentDurability;
  if (current === undefined || !Number.isInteger(current) || current < 1 || current > max) {
    throw new RangeError(`Invalid durable stack state for ${stack.itemId}: ${String(current)} / ${max}`);
  }
  return Object.freeze({ current, max });
}

function validateStack(stack: ItemStack): void {
  const definition = ITEM_REGISTRY.get(stack.itemId);
  if (!Number.isInteger(stack.quantity) || stack.quantity < 1 || stack.quantity > definition.maxStack) {
    throw new RangeError(`Invalid ${stack.itemId} stack quantity: ${stack.quantity}`);
  }
  if (definition.maxDurability === undefined) {
    if (stack.currentDurability !== undefined) throw new RangeError(`Non-durable ${stack.itemId} has currentDurability`);
    return;
  }
  if (!Number.isInteger(stack.currentDurability) || stack.currentDurability! < 1 || stack.currentDurability! > definition.maxDurability) {
    throw new RangeError(`Invalid ${stack.itemId} durability: ${String(stack.currentDurability)}`);
  }
}
