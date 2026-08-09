import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import { ITEM_REGISTRY, type ItemStack } from "../items/ItemSystem.ts";
import type { EquipmentSlotId } from "./EquipmentTypes.ts";
import type { PlayerEquipment } from "./PlayerEquipment.ts";

export type EquipmentOperation = "equip" | "unequip";
export type EquipmentFailureReason = "empty-source" | "not-equipment" | "stale-source" | "inventory-full" | "wrong-slot";

export interface EquipmentTransferResult {
  readonly accepted: boolean;
  readonly operation: EquipmentOperation;
  readonly equipmentSlot: EquipmentSlotId | null;
  readonly inventorySlot: number | null;
  readonly reason: EquipmentFailureReason | null;
}

export class EquipmentSystem {
  private latest: EquipmentTransferResult | null = null;
  private readonly inventory: PlayerInventory;
  private readonly equipment: PlayerEquipment;

  constructor(inventory: PlayerInventory, equipment: PlayerEquipment) {
    this.inventory = inventory;
    this.equipment = equipment;
  }

  get lastResult(): EquipmentTransferResult | null { return this.latest; }

  equipFromInventory(inventorySlot: number, expected?: ItemStack): EquipmentTransferResult {
    const current = this.inventory.getSlot(inventorySlot).stack;
    if (!current) return this.result(false, "equip", null, inventorySlot, "empty-source");
    if (expected && current !== expected) return this.result(false, "equip", null, inventorySlot, "stale-source");
    const destination = ITEM_REGISTRY.get(current.itemId).equipment?.slot;
    if (!destination) return this.result(false, "equip", null, inventorySlot, "not-equipment");
    const accepted = this.equipment.equipIfAccepted(
      destination,
      current,
      (previous) => this.inventory.exchangeWholeStack(inventorySlot, current, previous),
    );
    return this.result(accepted, "equip", destination, inventorySlot, accepted ? null : "wrong-slot");
  }

  unequipToInventory(slot: EquipmentSlotId, expected?: ItemStack): EquipmentTransferResult {
    const current = this.equipment.getSlot(slot).stack;
    if (!current) return this.result(false, "unequip", slot, null, "empty-source");
    if (expected && current !== expected) return this.result(false, "unequip", slot, null, "stale-source");
    const accepted = this.equipment.unequipIfAccepted(slot, current, (stack) => this.inventory.tryInsert(stack).accepted);
    return this.result(accepted, "unequip", slot, null, accepted ? null : "inventory-full");
  }

  private result(
    accepted: boolean,
    operation: EquipmentOperation,
    equipmentSlot: EquipmentSlotId | null,
    inventorySlot: number | null,
    reason: EquipmentFailureReason | null,
  ): EquipmentTransferResult {
    this.latest = Object.freeze({ accepted, operation, equipmentSlot, inventorySlot, reason });
    return this.latest;
  }
}
