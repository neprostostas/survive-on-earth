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
}

const SEED_CROPS: ReadonlyMap<ItemId, { crop: ItemId; growTime: number }> = new Map([
  ["berry-seeds", { crop: "berries", growTime: 90 }],
  ["root-seeds", { crop: "root-vegetable", growTime: 120 }],
]);

/** Home agriculture foundation with hydration + wall-clock offline progress. */
export class FarmingSystem {
  private readonly plots = new Map<string, FarmPlot>();

  get all(): readonly FarmPlot[] { return Object.freeze([...this.plots.values()]); }

  ensurePlot(id: string): FarmPlot {
    let plot = this.plots.get(id);
    if (!plot) {
      plot = { id, state: "empty", seedId: null, growth: 0, growthNeeded: 1, hydrated: false };
      this.plots.set(id, plot);
    }
    return plot;
  }

  plant(plotId: string, seedId: ItemId, inventory: PlayerInventory): boolean {
    const crop = SEED_CROPS.get(seedId);
    if (!crop) return false;
    const plot = this.ensurePlot(plotId);
    if (plot.state !== "empty") return false;
    const slot = inventory.findFirstSlotByItemId(seedId);
    if (slot === null) return false;
    const stack = inventory.getSlot(slot).stack;
    if (!stack) return false;
    if (stack.quantity === 1) inventory.exchangeWholeStack(slot, stack, null);
    else inventory.exchangeWholeStack(slot, stack, createItemStack(seedId, stack.quantity - 1));
    plot.state = "planted";
    plot.seedId = seedId;
    plot.growth = 0;
    plot.growthNeeded = crop.growTime;
    plot.hydrated = false;
    return true;
  }

  water(plotId: string, inventory: PlayerInventory): boolean {
    const plot = this.plots.get(plotId);
    if (!plot || plot.state === "empty" || plot.state === "ready") return false;
    const slot = inventory.findFirstSlotByItemId("water-bottle");
    if (slot === null) return false;
    const stack = inventory.getSlot(slot).stack;
    if (!stack) return false;
    if (stack.quantity === 1) inventory.exchangeWholeStack(slot, stack, null);
    else inventory.exchangeWholeStack(slot, stack, createItemStack("water-bottle", stack.quantity - 1));
    plot.hydrated = true;
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
      const rate = plot.hydrated ? 1 : 0.35;
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
    const stack = createItemStack(crop.crop, crop.crop === "berries" ? 4 : 2);
    if (!inventory.tryInsert(stack).accepted) return false;
    plot.state = "empty";
    plot.seedId = null;
    plot.growth = 0;
    plot.hydrated = false;
    return true;
  }

  serialize(): readonly FarmPlot[] {
    return this.all.map((p) => Object.freeze({ ...p }));
  }

  load(plots: readonly FarmPlot[]): void {
    this.plots.clear();
    for (const p of plots) this.plots.set(p.id, { ...p });
  }
}
