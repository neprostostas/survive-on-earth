import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import type { DurabilityConsumeResult } from "../inventory/PlayerInventory.ts";
import type { PlayerWeaponSlot } from "../equipment/PlayerWeaponSlot.ts";
import { stackDurability } from "../items/ItemSystem.ts";
import type { ItemId } from "../items/ItemId.ts";
import type { HarvestTool } from "./HarvestingTypes.ts";

export type HarvestToolSource = "weapon-slot" | "inventory";

export interface ResolvedHarvestTool {
  readonly source: HarvestToolSource;
  readonly itemId: ItemId | "hand";
  readonly harvestTool: HarvestTool;
  readonly inventorySlot: number | null;
  readonly current: number;
  readonly max: number;
}

const HATCHET_FAMILY: readonly ItemId[] = Object.freeze([
  "stone-hatchet", "hatchet", "reinforced-hatchet", "advanced-hatchet", "steel-hatchet",
]);
const PICKAXE_FAMILY: readonly ItemId[] = Object.freeze([
  "stone-pickaxe", "pickaxe", "reinforced-pickaxe", "advanced-pickaxe", "steel-pickaxe",
]);

function familyFor(tool: HarvestTool): readonly ItemId[] {
  if (tool === "hatchet") return HATCHET_FAMILY;
  if (tool === "pickaxe") return PICKAXE_FAMILY;
  return [];
}

/**
 * Read-only harvest tool gateway:
 * 1) matching equipped weapon family
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
    if (tool === "hand") return true;
    return this.resolve(tool) !== null;
  }

  resolve(tool: HarvestTool): ResolvedHarvestTool | null {
    if (tool === "hand") {
      return Object.freeze({
        source: "inventory",
        itemId: "hand",
        harvestTool: "hand",
        inventorySlot: null,
        current: 1,
        max: 1,
      });
    }
    const family = familyFor(tool);
    const equipped = this.weaponSlot.current;
    if (equipped && (family as readonly string[]).includes(equipped.itemId)) {
      const durability = stackDurability(equipped);
      if (!durability) return null;
      return Object.freeze({
        source: "weapon-slot",
        itemId: equipped.itemId,
        harvestTool: tool,
        inventorySlot: null,
        current: durability.current,
        max: durability.max,
      });
    }
    for (const itemId of family) {
      const slotIndex = this.inventory.findFirstSlotByItemId(itemId);
      if (slotIndex === null) continue;
      const stack = this.inventory.getSlot(slotIndex).stack;
      if (!stack) continue;
      const durability = stackDurability(stack);
      if (!durability) continue;
      return Object.freeze({
        source: "inventory",
        itemId,
        harvestTool: tool,
        inventorySlot: slotIndex,
        current: durability.current,
        max: durability.max,
      });
    }
    return null;
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
    if (tool === "hand") {
      return Object.freeze({
        accepted: true,
        slotIndex: -1,
        itemId: "plant-fiber",
        before: 1,
        after: 1,
        broke: false,
        maxDurability: 1,
      });
    }
    const resolved = this.resolve(tool);
    if (!resolved) return null;
    if (resolved.source === "weapon-slot") {
      return this.weaponSlot.tryConsumeDurability(resolved.itemId as ItemId, 1);
    }
    if (resolved.inventorySlot === null || resolved.itemId === "hand") return null;
    return this.inventory.tryConsumeDurability(resolved.inventorySlot, resolved.itemId, 1);
  }
}
