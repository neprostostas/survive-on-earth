import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import type { PlayerWeaponSlot } from "../equipment/PlayerWeaponSlot.ts";
import { HarvestToolResolver } from "./HarvestToolResolver.ts";

/**
 * Production harvest tool gateway alias used by Game and older imports.
 * Prefer `HarvestToolResolver` by name; this subclass is identical.
 * Delegates impact spend via `consumeImpactUse` (weapon slot preferred).
 */
export class InventoryHarvestTools extends HarvestToolResolver {
  constructor(inventory: PlayerInventory, weaponSlot: PlayerWeaponSlot) {
    super(inventory, weaponSlot);
  }
}

export type { ResolvedHarvestTool, HarvestToolSource } from "./HarvestToolResolver.ts";
export { HarvestToolResolver } from "./HarvestToolResolver.ts";
