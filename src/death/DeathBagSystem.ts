import type { ItemStack } from "../items/ItemSystem.ts";
import { cloneItemStack, createItemStack } from "../items/ItemSystem.ts";
import type { ItemId } from "../items/ItemId.ts";
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import type { PlayerEquipment } from "../equipment/PlayerEquipment.ts";
import type { PlayerWeaponSlot } from "../equipment/PlayerWeaponSlot.ts";
import type { PlayerBackpackSlot } from "../equipment/PlayerBackpackSlot.ts";
import type { PlayerQuickSlot } from "../equipment/PlayerQuickSlot.ts";
import type { PlayerUtilitySlot } from "../equipment/PlayerUtilitySlot.ts";
import type { EquipmentSlotId } from "../equipment/EquipmentTypes.ts";
import type { LocationId } from "../locations/LocationRegistry.ts";

export interface DeathBagSnapshot {
  readonly id: string;
  readonly locationId: LocationId;
  readonly x: number;
  readonly z: number;
  readonly stacks: readonly ItemStack[];
  readonly createdAt: number;
}

export interface SerializedDeathBag {
  readonly id: string;
  readonly locationId: LocationId;
  readonly x: number;
  readonly z: number;
  readonly createdAt: number;
  readonly stacks: readonly { itemId: ItemId; quantity: number; currentDurability?: number }[];
}

/**
 * Captures carried + equipped loadout into a corpse bag tied to a location.
 * Player domains are stripped after snapshot (stack identities conserved in bag as clones).
 */
export class DeathBagSystem {
  private bags: DeathBagSnapshot[] = [];
  private nextId = 1;

  get all(): readonly DeathBagSnapshot[] { return this.bags; }

  bagsAt(locationId: LocationId): readonly DeathBagSnapshot[] {
    return Object.freeze(this.bags.filter((b) => b.locationId === locationId));
  }

  captureAndStrip(params: {
    readonly locationId: LocationId;
    readonly x: number;
    readonly z: number;
    readonly inventory: PlayerInventory;
    readonly equipment: PlayerEquipment;
    readonly weapon: PlayerWeaponSlot;
    readonly backpack: PlayerBackpackSlot;
    readonly quicks: readonly PlayerQuickSlot[];
    readonly utility: PlayerUtilitySlot;
  }): DeathBagSnapshot {
    const stacks: ItemStack[] = [];
    for (const slot of params.inventory.getSlots()) {
      if (slot.stack) stacks.push(cloneItemStack(slot.stack));
    }
    for (const slot of params.equipment.getSlots()) {
      if (slot.stack) stacks.push(cloneItemStack(slot.stack));
    }
    if (params.weapon.current) stacks.push(cloneItemStack(params.weapon.current));
    if (params.backpack.current) stacks.push(cloneItemStack(params.backpack.current));
    for (const quick of params.quicks) {
      if (quick.current) stacks.push(cloneItemStack(quick.current));
    }
    if (params.utility.current) stacks.push(cloneItemStack(params.utility.current));

    for (let i = 0; i < params.inventory.slotCount; i += 1) {
      const s = params.inventory.getSlot(i).stack;
      if (s) params.inventory.exchangeWholeStack(i, s, null);
    }
    params.inventory.setExtraSlotCount(0);

    for (const slot of params.equipment.getSlots()) {
      if (!slot.stack) continue;
      params.equipment.unequipIfAccepted(slot.id as EquipmentSlotId, slot.stack, () => true);
    }
    if (params.weapon.current) params.weapon.unequipIfAccepted(params.weapon.current, () => true);
    if (params.backpack.current) params.backpack.unequipIfAccepted(params.backpack.current, () => true);
    for (const quick of params.quicks) {
      if (quick.current) quick.clearIfAccepted(quick.current, () => true);
    }
    if (params.utility.current) params.utility.unequipIfAccepted(params.utility.current, () => true);

    const bag: DeathBagSnapshot = Object.freeze({
      id: `death-bag-${this.nextId++}`,
      locationId: params.locationId,
      x: params.x,
      z: params.z,
      stacks: Object.freeze(stacks),
      createdAt: Date.now(),
    });
    this.bags = [...this.bags, bag];
    return bag;
  }

  lootInto(bagId: string, inventory: PlayerInventory): { inserted: number; remaining: number; gone: boolean } {
    const index = this.bags.findIndex((b) => b.id === bagId);
    if (index < 0) return { inserted: 0, remaining: 0, gone: true };
    const bag = this.bags[index]!;
    const remainingStacks: ItemStack[] = [];
    let inserted = 0;
    for (const stack of bag.stacks) {
      const partial = inventory.tryInsertAvailable(stack);
      inserted += partial.insertedQuantity;
      if (partial.overflowQuantity > 0) {
        if (stack.currentDurability !== undefined) {
          remainingStacks.push(createItemStack(stack.itemId, 1, { currentDurability: stack.currentDurability }));
        } else {
          remainingStacks.push(createItemStack(stack.itemId as ItemId, partial.overflowQuantity));
        }
      }
    }
    if (remainingStacks.length === 0) {
      this.bags = this.bags.filter((b) => b.id !== bagId);
      return { inserted, remaining: 0, gone: true };
    }
    const next = Object.freeze({ ...bag, stacks: Object.freeze(remainingStacks) });
    this.bags = this.bags.map((b) => (b.id === bagId ? next : b));
    return { inserted, remaining: remainingStacks.length, gone: false };
  }

  clear(): void {
    this.bags = [];
    this.nextId = 1;
  }

  serialize(): readonly SerializedDeathBag[] {
    return Object.freeze(this.bags.map((bag) => Object.freeze({
      id: bag.id,
      locationId: bag.locationId,
      x: bag.x,
      z: bag.z,
      createdAt: bag.createdAt,
      stacks: Object.freeze(bag.stacks.map((s) => {
        if (s.currentDurability !== undefined) {
          return Object.freeze({ itemId: s.itemId, quantity: s.quantity, currentDurability: s.currentDurability });
        }
        return Object.freeze({ itemId: s.itemId, quantity: s.quantity });
      })),
    })));
  }

  load(rows: readonly {
    id: string;
    locationId?: string;
    x: number;
    z: number;
    createdAt?: number;
    stacks: readonly { itemId: ItemId; quantity: number; currentDurability?: number }[];
  }[] | undefined): void {
    this.bags = [];
    this.nextId = 1;
    if (!rows) return;
    for (const row of rows) {
      const stacks: ItemStack[] = [];
      for (const s of row.stacks ?? []) {
        try {
          stacks.push(createItemStack(
            s.itemId,
            s.quantity,
            s.currentDurability !== undefined ? { currentDurability: s.currentDurability } : undefined,
          ));
        } catch { /* skip invalid */ }
      }
      if (stacks.length === 0) continue;
      const match = /^death-bag-(\d+)$/.exec(row.id);
      if (match) this.nextId = Math.max(this.nextId, Number(match[1]) + 1);
      // Pre-locationId saves: treat as current session defaults → home so bags stay recoverable at base.
      const locationId = (row.locationId as LocationId | undefined) ?? "home";
      this.bags.push(Object.freeze({
        id: row.id,
        locationId,
        x: row.x,
        z: row.z,
        createdAt: row.createdAt ?? Date.now(),
        stacks: Object.freeze(stacks),
      }));
    }
  }
}
