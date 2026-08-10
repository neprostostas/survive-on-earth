/**
 * Lightweight logistics abstraction — not physical conveyor meshes.
 * Stations pull/push via filtered transfer nodes.
 */

import type { ItemId } from "../items/ItemId.ts";
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import { createItemStack, type ItemStack } from "../items/ItemSystem.ts";

export type LogisticsFilter = "any" | "wood" | "metal" | "food" | "component" | ItemId;

export interface TransferNode {
  readonly id: string;
  readonly label: string;
  filter: LogisticsFilter;
  throughputPerSec: number;
  enabled: boolean;
  /** Inventory endpoint — external ID reference only */
  readonly sourceId: string;
  readonly destId: string;
}

export class LogisticsNetwork {
  private readonly nodes = new Map<string, TransferNode>();
  private readonly inventories = new Map<string, PlayerInventory>();
  private carryAccum = new Map<string, number>();

  registerInventory(id: string, inv: PlayerInventory): void {
    this.inventories.set(id, inv);
  }

  addNode(node: TransferNode): void {
    this.nodes.set(node.id, node);
    this.carryAccum.set(node.id, 0);
  }

  removeNode(id: string): void {
    this.nodes.delete(id);
    this.carryAccum.delete(id);
  }

  get list(): readonly TransferNode[] { return [...this.nodes.values()]; }

  /** Move filtered stacks between registered inventories when powered. */
  tick(dt: number, powered: boolean): number {
    if (!powered || dt <= 0) return 0;
    let moved = 0;
    for (const node of this.nodes.values()) {
      if (!node.enabled) continue;
      const src = this.inventories.get(node.sourceId);
      const dst = this.inventories.get(node.destId);
      if (!src || !dst) continue;
      const acc = (this.carryAccum.get(node.id) ?? 0) + node.throughputPerSec * dt;
      let units = Math.floor(acc);
      if (units < 1) {
        this.carryAccum.set(node.id, acc);
        continue;
      }
      this.carryAccum.set(node.id, acc - units);
      for (let i = 0; i < src.slotCount && units > 0; i += 1) {
        const stack = src.getSlot(i).stack;
        if (!stack || !matchesFilter(stack, node.filter)) continue;
        const takeQty = Math.min(units, stack.quantity);
        const taken = createItemStack(
          stack.itemId,
          takeQty,
          stack.currentDurability !== undefined ? { currentDurability: stack.currentDurability } : undefined,
        );
        const remainder = stack.quantity === takeQty
          ? null
          : createItemStack(stack.itemId, stack.quantity - takeQty);
        if (!src.exchangeWholeStack(i, stack, remainder)) continue;
        if (dst.tryInsert(taken).accepted) {
          moved += takeQty;
          units -= takeQty;
        } else {
          // return on failure — best-effort restore
          src.tryInsert(taken);
          break;
        }
      }
    }
    return moved;
  }
}

function matchesFilter(stack: ItemStack, filter: LogisticsFilter): boolean {
  if (filter === "any") return true;
  if (filter === stack.itemId) return true;
  const id = stack.itemId;
  if (filter === "wood") return id.includes("wood") || id.includes("log") || id.includes("plank") || id === "stick";
  if (filter === "metal") return id.includes("iron") || id.includes("steel") || id.includes("scrap") || id.includes("alloy") || id.includes("plate");
  if (filter === "food") return id.includes("berry") || id.includes("meat") || id.includes("food") || id.includes("fish") || id.includes("root");
  if (filter === "component") {
    return id.includes("circuit") || id.includes("component") || id.includes("servo") || id.includes("module") || id.includes("filter");
  }
  return false;
}
