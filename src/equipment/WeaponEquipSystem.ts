import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import { ITEM_REGISTRY, type ItemStack } from "../items/ItemSystem.ts";
import { isWeaponCapableItemId } from "./WeaponTypes.ts";
import type { PlayerWeaponSlot } from "./PlayerWeaponSlot.ts";

export type WeaponOperation = "equip" | "unequip";
export type WeaponFailureReason =
  | "empty-source"
  | "not-weapon"
  | "stale-source"
  | "inventory-full";

export interface WeaponTransferResult {
  readonly accepted: boolean;
  readonly operation: WeaponOperation;
  readonly inventorySlot: number | null;
  readonly reason: WeaponFailureReason | null;
}

/**
 * Coordinates PlayerInventory ↔ PlayerWeaponSlot without touching armor EquipmentSystem.
 */
export class WeaponEquipSystem {
  private latest: WeaponTransferResult | null = null;
  private readonly inventory: PlayerInventory;
  private readonly weaponSlot: PlayerWeaponSlot;
  private readonly beforeTransfer: () => void;

  constructor(
    inventory: PlayerInventory,
    weaponSlot: PlayerWeaponSlot,
    /** Cancels in-flight melee before equip/unequip mutates the active weapon. */
    beforeTransfer: () => void = () => {},
  ) {
    this.inventory = inventory;
    this.weaponSlot = weaponSlot;
    this.beforeTransfer = beforeTransfer;
  }

  get lastResult(): WeaponTransferResult | null { return this.latest; }

  equipFromInventory(inventorySlot: number, expected?: ItemStack): WeaponTransferResult {
    const current = this.inventory.getSlot(inventorySlot).stack;
    if (!current) return this.result(false, "equip", inventorySlot, "empty-source");
    if (expected && current !== expected) return this.result(false, "equip", inventorySlot, "stale-source");
    if (!isWeaponCapableItemId(current.itemId) || !ITEM_REGISTRY.get(current.itemId).meleeCombat) {
      return this.result(false, "equip", inventorySlot, "not-weapon");
    }
    this.beforeTransfer();
    const accepted = this.weaponSlot.equipIfAccepted(current, (previous) => {
      // Swap previous into vacated inventory slot (or clear if empty).
      return this.inventory.exchangeWholeStack(inventorySlot, current, previous);
    });
    return this.result(accepted, "equip", inventorySlot, accepted ? null : "stale-source");
  }

  unequipToInventory(expected?: ItemStack): WeaponTransferResult {
    const current = this.weaponSlot.current;
    if (!current) return this.result(false, "unequip", null, "empty-source");
    if (expected && current !== expected) return this.result(false, "unequip", null, "stale-source");
    this.beforeTransfer();
    const accepted = this.weaponSlot.unequipIfAccepted(current, (stack) => this.inventory.tryInsert(stack).accepted);
    return this.result(accepted, "unequip", null, accepted ? null : "inventory-full");
  }

  private result(
    accepted: boolean,
    operation: WeaponOperation,
    inventorySlot: number | null,
    reason: WeaponFailureReason | null,
  ): WeaponTransferResult {
    this.latest = Object.freeze({ accepted, operation, inventorySlot, reason });
    return this.latest;
  }
}
