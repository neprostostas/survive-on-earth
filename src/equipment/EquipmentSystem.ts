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
    // Prefer identity-preserving place into first empty cell (avoids plan-clone edge cases).
    for (let index = 0; index < this.inventory.slotCount; index += 1) {
      if (this.inventory.getSlot(index).stack !== null) continue;
      const accepted = this.equipment.unequipIfAccepted(slot, current, (stack) =>
        this.inventory.placeIntoEmptySlot(index, stack));
      return this.result(accepted, "unequip", slot, index, accepted ? null : "inventory-full");
    }
    return this.result(false, "unequip", slot, null, "inventory-full");
  }

  /** Drop armor onto a specific inventory cell (empty place or swap compatible armor). */
  unequipToInventorySlot(slot: EquipmentSlotId, inventorySlot: number, expected?: ItemStack): EquipmentTransferResult {
    const current = this.equipment.getSlot(slot).stack;
    if (!current) return this.result(false, "unequip", slot, inventorySlot, "empty-source");
    if (expected && current !== expected) return this.result(false, "unequip", slot, inventorySlot, "stale-source");
    const dest = this.inventory.getSlot(inventorySlot).stack;
    if (!dest) {
      const accepted = this.equipment.unequipIfAccepted(slot, current, (stack) => this.inventory.placeIntoEmptySlot(inventorySlot, stack));
      return this.result(accepted, "unequip", slot, inventorySlot, accepted ? null : "inventory-full");
    }
    const destSlot = ITEM_REGISTRY.get(dest.itemId).equipment?.slot;
    if (destSlot === slot) {
      return this.equipFromInventory(inventorySlot, dest);
    }
    return this.result(false, "unequip", slot, inventorySlot, "not-equipment");
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
