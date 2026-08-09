import { ITEM_REGISTRY, createItemStack, type ItemStack } from "../items/ItemSystem.ts";
import { EQUIPMENT_SLOT_IDS, type EquipmentSlotId } from "./EquipmentTypes.ts";

export interface EquipmentSlot {
  readonly id: EquipmentSlotId;
  readonly stack: ItemStack | null;
}

export interface EquipmentChange {
  readonly slot: EquipmentSlotId;
  readonly previous: ItemStack | null;
  readonly stack: ItemStack | null;
}

export type EquipmentChangeListener = (change: EquipmentChange) => void;

export class PlayerEquipment {
  private readonly stacks: Record<EquipmentSlotId, ItemStack | null> = {
    head: null,
    torso: null,
    legs: null,
    feet: null,
  };
  private readonly listeners = new Set<EquipmentChangeListener>();

  get totalArmor(): number {
    return EQUIPMENT_SLOT_IDS.reduce((total, slot) => {
      const stack = this.stacks[slot];
      return total + (stack ? ITEM_REGISTRY.get(stack.itemId).equipment?.armor ?? 0 : 0);
    }, 0);
  }

  getSlots(): readonly EquipmentSlot[] {
    return Object.freeze(EQUIPMENT_SLOT_IDS.map((id) => Object.freeze({ id, stack: this.stacks[id] })));
  }

  getSlot(id: EquipmentSlotId): EquipmentSlot {
    return Object.freeze({ id, stack: this.stacks[id] });
  }

  getSnapshot(): Readonly<Record<EquipmentSlotId, ItemStack | null>> {
    return Object.freeze({ ...this.stacks });
  }

  equipIfAccepted(
    destination: EquipmentSlotId,
    incoming: ItemStack,
    acceptPrevious: (previous: ItemStack | null) => boolean,
  ): boolean {
    createItemStack(incoming.itemId, incoming.quantity);
    const definition = ITEM_REGISTRY.get(incoming.itemId);
    if (!definition.equipment || definition.equipment.slot !== destination || incoming.quantity !== 1) return false;
    const previous = this.stacks[destination];
    if (previous === incoming) return false;
    if (!acceptPrevious(previous)) return false;
    this.stacks[destination] = incoming;
    this.emit(destination, previous, incoming);
    return true;
  }

  unequipIfAccepted(
    source: EquipmentSlotId,
    expected: ItemStack,
    acceptStack: (stack: ItemStack) => boolean,
  ): boolean {
    const current = this.stacks[source];
    if (current !== expected || !acceptStack(current)) return false;
    this.stacks[source] = null;
    this.emit(source, current, null);
    return true;
  }

  subscribe(listener: EquipmentChangeListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private emit(slot: EquipmentSlotId, previous: ItemStack | null, stack: ItemStack | null): void {
    const change = Object.freeze({ slot, previous, stack });
    for (const listener of this.listeners) listener(change);
  }
}
