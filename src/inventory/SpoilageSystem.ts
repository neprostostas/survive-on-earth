/**
 * Slot-age tracker for perishable food across player inv + world containers.
 */
import {
  advanceSpoilAge,
  isPerishableFood,
  type SpoilSlotView,
} from "../items/FoodSpoilage.ts";
import { createItemStack, type ItemStack } from "../items/ItemSystem.ts";
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import type { WorldContainerEntity } from "../containers/WorldContainer.ts";

export type SpoilInventoryHost = {
  readonly slotCount: number;
  getSlot(index: number): { stack: ItemStack | null } | ItemStack | null;
  /** Reduce qty or clear: host-specific. */
  writeStack(index: number, stack: ItemStack | null): void;
};

function stackFromHost(host: SpoilInventoryHost, index: number): ItemStack | null {
  const raw = host.getSlot(index);
  if (!raw) return null;
  if ("stack" in raw) return raw.stack;
  return raw;
}

export class SpoilageSystem {
  private readonly ages = new Map<string, number>();

  clear(): void {
    this.ages.clear();
  }

  /** Units removed this tick from a host. */
  tickHost(prefix: string, host: SpoilInventoryHost, dt: number, rateMul: number): number {
    if (dt <= 0) return 0;
    let total = 0;
    for (let i = 0; i < host.slotCount; i += 1) {
      const key = `${prefix}:${i}`;
      const stack = stackFromHost(host, i);
      const view: SpoilSlotView = {
        itemId: stack?.itemId ?? null,
        quantity: stack?.quantity ?? 0,
      };
      if (!stack || !view.itemId || !isPerishableFood(view.itemId)) {
        this.ages.delete(key);
        continue;
      }
      const prev = this.ages.get(key) ?? 0;
      const result = advanceSpoilAge(prev, view, dt, rateMul);
      this.ages.set(key, result.age);
      if (result.spoiledUnits <= 0) continue;
      total += result.spoiledUnits;
      const left = stack.quantity - result.spoiledUnits;
      if (left <= 0) host.writeStack(i, null);
      else {
        host.writeStack(
          i,
          stack.currentDurability !== undefined
            ? createItemStack(stack.itemId, left, { currentDurability: stack.currentDurability })
            : createItemStack(stack.itemId, left),
        );
      }
    }
    return total;
  }

  tickPlayer(inventory: PlayerInventory, dt: number, rateMul: number): number {
    return this.tickHost("player", {
      slotCount: inventory.slotCount,
      getSlot: (i) => inventory.getSlot(i),
      writeStack: (i, stack) => {
        const current = inventory.getSlot(i).stack;
        if (!current && !stack) return;
        // exchangeWholeStack needs expected identity when clearing/reducing.
        if (!current) return;
        if (!stack) inventory.exchangeWholeStack(i, current, null);
        else inventory.exchangeWholeStack(i, current, stack);
      },
    }, dt, rateMul);
  }

  tickContainer(container: WorldContainerEntity, dt: number, rateMul: number): number {
    const inv = container.inventory;
    return this.tickHost(`cont:${container.interactionId}`, {
      slotCount: inv.slotCount,
      getSlot: (i) => inv.getSlot(i),
      writeStack: (i, stack) => { inv.place(i, stack); },
    }, dt, rateMul);
  }

  serialize(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [k, v] of this.ages) {
      if (v > 0.05) out[k] = Math.round(v * 10) / 10;
    }
    return out;
  }

  load(data: Record<string, number> | undefined): void {
    this.ages.clear();
    if (!data) return;
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === "number" && Number.isFinite(v) && v > 0) this.ages.set(k, v);
    }
  }
}
