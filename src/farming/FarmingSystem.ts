import type { ItemId } from "../items/ItemId.ts";
import { createItemStack } from "../items/ItemSystem.ts";
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";

export type FarmPlotState = "empty" | "planted" | "growing" | "ready";

export interface FarmPlot {
  readonly id: string;
  state: FarmPlotState;
  seedId: ItemId | null;
  growth: number;
  growthNeeded: number;
  hydrated: boolean;
  /** Fertilizer speeds growth and bumps harvest yield once per plant cycle. */
  fertilized: boolean;
}

const WATER_ITEM_IDS: readonly ItemId[] = Object.freeze(["clean-water", "water-bottle", "rain-water"]);

const SEED_CROPS: ReadonlyMap<ItemId, { crop: ItemId; growTime: number; yield: number }> = new Map([
  ["berry-seeds", { crop: "berries", growTime: 90, yield: 4 }],
  ["root-seeds", { crop: "root-vegetable", growTime: 120, yield: 2 }],
  ["herb-seeds", { crop: "medicinal-herb", growTime: 100, yield: 3 }],
]);

const FERTILIZER_GROWTH_MULT = 1.45;
const FERTILIZER_YIELD_BONUS = 2;

/** Home agriculture foundation with hydration + wall-clock offline progress. */
export class FarmingSystem {
  private readonly plots = new Map<string, FarmPlot>();

  get all(): readonly FarmPlot[] { return Object.freeze([...this.plots.values()]); }

  getPlot(id: string): FarmPlot | null {
    return this.plots.get(id) ?? null;
  }

  ensurePlot(id: string): FarmPlot {
    let plot = this.plots.get(id);
    if (!plot) {
      plot = {
        id,
        state: "empty",
        seedId: null,
        growth: 0,
        growthNeeded: 1,
        hydrated: false,
        fertilized: false,
      };
      this.plots.set(id, plot);
    }
    return plot;
  }

  plant(plotId: string, seedId: ItemId, inventory: PlayerInventory): boolean {
    const crop = SEED_CROPS.get(seedId);
    if (!crop) return false;
    const plot = this.ensurePlot(plotId);
    if (plot.state !== "empty") return false;
    if (!consumeOne(inventory, seedId)) return false;
    plot.state = "planted";
    plot.seedId = seedId;
    plot.growth = 0;
    plot.growthNeeded = crop.growTime;
    plot.hydrated = false;
    plot.fertilized = false;
    return true;
  }

  water(plotId: string, inventory: PlayerInventory, options?: {
    /** When true (and base tank paid separately), mark hydrated without inv water. */
    fromBaseTank?: boolean;
  }): boolean {
    const plot = this.plots.get(plotId);
    if (!plot || plot.state === "empty" || plot.state === "ready") return false;
    if (options?.fromBaseTank !== true) {
      if (!consumeFirstAvailable(inventory, WATER_ITEM_IDS)) return false;
    }
    plot.hydrated = true;
    if (plot.state === "planted") plot.state = "growing";
    return true;
  }

  /** Apply fertilizer bag to a growing or planted plot (consumes 1). */
  fertilize(plotId: string, inventory: PlayerInventory): boolean {
    const plot = this.plots.get(plotId);
    if (!plot || plot.state === "empty" || plot.state === "ready") return false;
    if (plot.fertilized) return false;
    if (!consumeOne(inventory, "fertilizer")) return false;
    plot.fertilized = true;
    if (plot.state === "planted") plot.state = "growing";
    return true;
  }

  rainHydrateAll(): void {
    for (const plot of this.plots.values()) {
      if (plot.state === "planted" || plot.state === "growing") {
        plot.hydrated = true;
        if (plot.state === "planted") plot.state = "growing";
      }
    }
  }

  tick(delta: number): void {
    if (delta <= 0) return;
    for (const plot of this.plots.values()) {
      if (plot.state !== "growing" && plot.state !== "planted") continue;
      let rate = plot.hydrated ? 1 : 0.35;
      if (plot.fertilized) rate *= FERTILIZER_GROWTH_MULT;
      plot.growth += delta * rate;
      if (plot.state === "planted" && plot.growth > 0) plot.state = "growing";
      if (plot.growth >= plot.growthNeeded) {
        plot.state = "ready";
        plot.growth = plot.growthNeeded;
      }
    }
  }

  /** Offline catch-up with clamp. */
  applyElapsedSeconds(seconds: number): void {
    const clamp = Math.min(Math.max(0, seconds), 8 * 3600);
    this.tick(clamp);
  }

  harvest(plotId: string, inventory: PlayerInventory): boolean {
    const plot = this.plots.get(plotId);
    if (!plot || plot.state !== "ready" || !plot.seedId) return false;
    const crop = SEED_CROPS.get(plot.seedId);
    if (!crop) return false;
    const amount = crop.yield + (plot.fertilized ? FERTILIZER_YIELD_BONUS : 0);
    const stack = createItemStack(crop.crop, amount);
    if (!inventory.tryInsert(stack).accepted) return false;
    plot.state = "empty";
    plot.seedId = null;
    plot.growth = 0;
    plot.hydrated = false;
    plot.fertilized = false;
    return true;
  }

  serialize(): readonly FarmPlot[] {
    return this.all.map((p) => Object.freeze({
      id: p.id,
      state: p.state,
      seedId: p.seedId,
      growth: p.growth,
      growthNeeded: p.growthNeeded,
      hydrated: p.hydrated,
      fertilized: p.fertilized === true,
    }));
  }

  load(plots: readonly FarmPlot[]): void {
    this.plots.clear();
    for (const p of plots) {
      this.plots.set(p.id, {
        id: p.id,
        state: p.state,
        seedId: p.seedId,
        growth: p.growth,
        growthNeeded: p.growthNeeded,
        hydrated: p.hydrated,
        fertilized: p.fertilized === true,
      });
    }
  }
}

function consumeOne(inventory: PlayerInventory, itemId: ItemId): boolean {
  const slot = inventory.findFirstSlotByItemId(itemId);
  if (slot === null) return false;
  const stack = inventory.getSlot(slot).stack;
  if (!stack) return false;
  if (stack.quantity === 1) inventory.exchangeWholeStack(slot, stack, null);
  else inventory.exchangeWholeStack(slot, stack, createItemStack(itemId, stack.quantity - 1));
  return true;
}

function consumeFirstAvailable(inventory: PlayerInventory, itemIds: readonly ItemId[]): boolean {
  for (const id of itemIds) {
    if (consumeOne(inventory, id)) return true;
  }
  return false;
}
