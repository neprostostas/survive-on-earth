import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import type { DurabilityConsumeResult } from "../inventory/PlayerInventory.ts";
import type { PlayerWeaponSlot } from "../equipment/PlayerWeaponSlot.ts";
import { stackDurability } from "../items/ItemSystem.ts";
import type { HarvestTool } from "./HarvestingTypes.ts";

export type HarvestToolSource = "weapon-slot" | "inventory";

export interface ResolvedHarvestTool {
  readonly source: HarvestToolSource;
  readonly itemId: HarvestTool;
  readonly inventorySlot: number | null;
  readonly current: number;
  readonly max: number;
}

/**
 * Read-only harvest tool gateway:
 * 1) matching equipped weapon
 * 2) lowest matching inventory slot
 * Does not own gameplay state.
 */
export class HarvestToolResolver {
  private readonly inventory: PlayerInventory;
  private readonly weaponSlot: PlayerWeaponSlot;

  constructor(inventory: PlayerInventory, weaponSlot: PlayerWeaponSlot) {
    this.inventory = inventory;
    this.weaponSlot = weaponSlot;
  }

  hasTool(tool: HarvestTool): boolean {
    return this.resolve(tool) !== null;
  }

  resolve(tool: HarvestTool): ResolvedHarvestTool | null {
    const equipped = this.weaponSlot.current;
    if (equipped?.itemId === tool) {
      const durability = stackDurability(equipped);
      if (!durability) return null;
      return Object.freeze({
        source: "weapon-slot",
        itemId: tool,
        inventorySlot: null,
        current: durability.current,
        max: durability.max,
      });
    }
    const slotIndex = this.inventory.findFirstSlotByItemId(tool);
    if (slotIndex === null) return null;
    const stack = this.inventory.getSlot(slotIndex).stack;
    if (!stack) return null;
    const durability = stackDurability(stack);
    if (!durability) return null;
    return Object.freeze({
      source: "inventory",
      itemId: tool,
      inventorySlot: slotIndex,
      current: durability.current,
      max: durability.max,
    });
  }

  /** @deprecated prefer resolve(); kept as slot index for inventory-only views. */
  findToolSlot(tool: HarvestTool): number | null {
    const resolved = this.resolve(tool);
    if (!resolved) return null;
    return resolved.inventorySlot;
  }

  getResolvedDurability(tool: HarvestTool): { readonly slotIndex: number | null; readonly source: HarvestToolSource; readonly current: number; readonly max: number } | null {
    const resolved = this.resolve(tool);
    if (!resolved) return null;
    return Object.freeze({
      slotIndex: resolved.inventorySlot,
      source: resolved.source,
      current: resolved.current,
      max: resolved.max,
    });
  }

  consumeImpactUse(tool: HarvestTool): DurabilityConsumeResult | null {
    const resolved = this.resolve(tool);
    if (!resolved) return null;
    if (resolved.source === "weapon-slot") {
      return this.weaponSlot.tryConsumeDurability(tool, 1);
    }
    if (resolved.inventorySlot === null) return null;
    return this.inventory.tryConsumeDurability(resolved.inventorySlot, tool, 1);
  }
}
