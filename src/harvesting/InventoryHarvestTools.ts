import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import type { HarvestTool } from "./HarvestingTypes.ts";

/**
 * Production harvesting tool availability sourced only from PlayerInventory.
 * Lowest matching slot index resolves first; no cached ownership flags.
 */
export class InventoryHarvestTools {
  private readonly inventory: PlayerInventory;

  constructor(inventory: PlayerInventory) {
    this.inventory = inventory;
  }

  hasTool(tool: HarvestTool): boolean {
    return this.findToolSlot(tool) !== null;
  }

  findToolSlot(tool: HarvestTool): number | null {
    return this.inventory.findFirstSlotByItemId(tool);
  }
}
