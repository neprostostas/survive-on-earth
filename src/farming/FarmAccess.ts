/**
 * Pure helpers for farm-plot interact routing (no Babylon / DOM).
 */
import type { ItemId } from "../items/ItemId.ts";
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import type { FarmPlot, FarmPlotState } from "./FarmingSystem.ts";

export const FARM_SEED_PRIORITY: readonly ItemId[] = Object.freeze([
  "berry-seeds",
  "herb-seeds",
  "root-seeds",
]);

export type FarmInteractKind = "plant" | "water" | "fertilize" | "harvest" | "status";

export interface FarmInteractDecision {
  readonly kind: FarmInteractKind;
  /** Seed chosen when planting. */
  readonly seedId: ItemId | null;
  /** Soft fail label for notify (when can't do preferred action). */
  readonly blocked: "need-seed" | "need-water" | "inv-full" | null;
  readonly growthPct: number;
  readonly state: FarmPlotState;
}

export function farmPlotInteractableId(plotId: string): string {
  return `farm-plot-${plotId}`;
}

export function plotIdFromInteractable(interactionId: string): string | null {
  if (!interactionId.startsWith("farm-plot-")) return null;
  return interactionId.slice("farm-plot-".length);
}

export function isFarmPlotInteractionId(interactionId: string): boolean {
  return interactionId.startsWith("farm-plot-");
}

export function isFarmSeed(itemId: string): boolean {
  return (FARM_SEED_PRIORITY as readonly string[]).includes(itemId);
}

/**
 * Prefer seeds on the quick bar (left→right), then catalog priority order.
 */
export function pickPlantSeed(
  inventory: PlayerInventory,
  preferredQuick?: readonly (ItemId | null | undefined)[],
): ItemId | null {
  if (preferredQuick) {
    for (const id of preferredQuick) {
      if (!id || !isFarmSeed(id)) continue;
      if (inventory.totalQuantity(id) > 0) return id;
    }
  }
  for (const id of FARM_SEED_PRIORITY) {
    if (inventory.totalQuantity(id) > 0) return id;
  }
  return null;
}

export function listHeldSeeds(inventory: PlayerInventory): readonly ItemId[] {
  return Object.freeze(FARM_SEED_PRIORITY.filter((id) => inventory.totalQuantity(id) > 0));
}

export function hasWaterSource(inventory: PlayerInventory, baseCanIrrigate = false): boolean {
  if (baseCanIrrigate) return true;
  return (
    inventory.totalQuantity("clean-water") > 0
    || inventory.totalQuantity("water-bottle") > 0
    || inventory.totalQuantity("rain-water") > 0
  );
}

export interface FarmInteractOptions {
  readonly preferredQuickSeeds?: readonly (ItemId | null | undefined)[];
  /** Base tank can cover irrigation cost. */
  readonly baseCanIrrigate?: boolean;
}

/**
 * Preferred E action on a farm plot.
 * Priority: harvest → plant → water → fertilize → status.
 */
export function decideFarmInteract(
  plot: FarmPlot,
  inventory: PlayerInventory,
  options?: FarmInteractOptions,
): FarmInteractDecision {
  const growthPct = plot.growthNeeded > 0
    ? Math.min(100, Math.floor((plot.growth / plot.growthNeeded) * 100))
    : 0;

  if (plot.state === "ready") {
    return {
      kind: "harvest",
      seedId: null,
      blocked: null,
      growthPct: 100,
      state: plot.state,
    };
  }

  if (plot.state === "empty") {
    const seed = pickPlantSeed(inventory, options?.preferredQuickSeeds);
    if (!seed) {
      return {
        kind: "status",
        seedId: null,
        blocked: "need-seed",
        growthPct: 0,
        state: plot.state,
      };
    }
    return {
      kind: "plant",
      seedId: seed,
      blocked: null,
      growthPct: 0,
      state: plot.state,
    };
  }

  // planted / growing
  if (!plot.hydrated) {
    if (!hasWaterSource(inventory, options?.baseCanIrrigate === true)) {
      return {
        kind: "status",
        seedId: plot.seedId,
        blocked: "need-water",
        growthPct,
        state: plot.state,
      };
    }
    return {
      kind: "water",
      seedId: plot.seedId,
      blocked: null,
      growthPct,
      state: plot.state,
    };
  }

  if (!plot.fertilized && inventory.totalQuantity("fertilizer") > 0) {
    return {
      kind: "fertilize",
      seedId: plot.seedId,
      blocked: null,
      growthPct,
      state: plot.state,
    };
  }

  return {
    kind: "status",
    seedId: plot.seedId,
    blocked: null,
    growthPct,
    state: plot.state,
  };
}
