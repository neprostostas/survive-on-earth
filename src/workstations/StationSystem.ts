import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import { createItemStack, type ItemStack } from "../items/ItemSystem.ts";
import type { ItemId } from "../items/ItemId.ts";
import { getStationProcess, processesForStation, stationProcessInputs, type StationProcessDef } from "./StationRecipes.ts";
import { WorkstationQueue, type WorkstationKind } from "./WorkstationQueue.ts";

export type StationStartFailure =
  | "unknown-process"
  | "wrong-station"
  | "not-enough-input"
  | "not-enough-fuel"
  | "queue-full";

const MAX_QUEUE = 4;

export interface StationCompletion {
  readonly processId: string;
  readonly stack: ItemStack;
}

/**
 * Domain for LDOE-style timed station processing.
 * Consumes input (+ fuel) up-front; delivers output when queue finishes.
 */
export class StationSystem {
  private readonly queues: Record<WorkstationKind, WorkstationQueue> = {
    campfire: new WorkstationQueue("campfire"),
    woodworking: new WorkstationQueue("woodworking"),
    furnace: new WorkstationQueue("furnace"),
    metalwork: new WorkstationQueue("metalwork"),
    chemistry: new WorkstationQueue("chemistry"),
    water: new WorkstationQueue("water"),
    composter: new WorkstationQueue("composter"),
    recycler: new WorkstationQueue("recycler"),
  };

  queueOf(kind: WorkstationKind): WorkstationQueue {
    return this.queues[kind];
  }

  processes(kind: WorkstationKind): readonly StationProcessDef[] {
    return processesForStation(kind);
  }

  setFrozen(frozen: boolean): void {
    for (const q of Object.values(this.queues)) q.setFrozen(frozen);
  }

  canStart(processId: string, station: WorkstationKind, inventory: PlayerInventory): {
    ok: boolean;
    reason: StationStartFailure | null;
    process: StationProcessDef | null;
  } {
    const process = getStationProcess(processId);
    if (!process) return { ok: false, reason: "unknown-process", process: null };
    if (process.station !== station) return { ok: false, reason: "wrong-station", process };
    if (this.queues[station].queue.length >= MAX_QUEUE) {
      return { ok: false, reason: "queue-full", process };
    }
    for (const need of stationProcessInputs(process)) {
      if (inventory.totalQuantity(need.itemId) < need.quantity) {
        return { ok: false, reason: "not-enough-input", process };
      }
    }
    if (process.fuel && inventory.totalQuantity(process.fuel.itemId) < process.fuel.quantity) {
      return { ok: false, reason: "not-enough-fuel", process };
    }
    return { ok: true, reason: null, process };
  }

  tryStart(processId: string, station: WorkstationKind, inventory: PlayerInventory): {
    accepted: boolean;
    reason: StationStartFailure | null;
  } {
    const check = this.canStart(processId, station, inventory);
    if (!check.ok || !check.process) return { accepted: false, reason: check.reason };
    const process = check.process;
    const needs: { itemId: ItemId; quantity: number }[] = [
      ...stationProcessInputs(process),
    ];
    if (process.fuel && process.fuel.quantity > 0) {
      needs.push({ itemId: process.fuel.itemId, quantity: process.fuel.quantity });
    }
    if (needs.length > 0 && !removeItems(inventory, needs)) {
      return { accepted: false, reason: "not-enough-input" };
    }
    const enqueued = this.queues[station].enqueue(process.id, process.timeSec);
    if (!enqueued) {
      // Refund should be rare (queue race); re-insert consumed stacks best-effort.
      for (const n of needs) {
        inventory.tryInsert(createItemStack(n.itemId, n.quantity));
      }
      return { accepted: false, reason: "queue-full" };
    }
    return { accepted: true, reason: null };
  }

  /** Advance all queues; return finished outputs to deliver. */
  tick(delta: number): readonly StationCompletion[] {
    const done: StationCompletion[] = [];
    for (const kind of Object.keys(this.queues) as WorkstationKind[]) {
      const finished = this.queues[kind].tick(delta);
      for (const processId of finished) {
        const process = getStationProcess(processId);
        if (!process) continue;
        try {
          done.push(Object.freeze({
            processId,
            stack: createItemStack(process.output.itemId, process.output.quantity),
          }));
        } catch { /* invalid catalog */ }
      }
    }
    return Object.freeze(done);
  }

  serialize(): {
    campfire: ReturnType<WorkstationQueue["serialize"]>;
    woodworking: ReturnType<WorkstationQueue["serialize"]>;
    furnace: ReturnType<WorkstationQueue["serialize"]>;
    metalwork: ReturnType<WorkstationQueue["serialize"]>;
    chemistry: ReturnType<WorkstationQueue["serialize"]>;
    water: ReturnType<WorkstationQueue["serialize"]>;
    composter: ReturnType<WorkstationQueue["serialize"]>;
    recycler: ReturnType<WorkstationQueue["serialize"]>;
  } {
    return {
      campfire: this.queues.campfire.serialize(),
      woodworking: this.queues.woodworking.serialize(),
      furnace: this.queues.furnace.serialize(),
      metalwork: this.queues.metalwork.serialize(),
      chemistry: this.queues.chemistry.serialize(),
      water: this.queues.water.serialize(),
      composter: this.queues.composter.serialize(),
      recycler: this.queues.recycler.serialize(),
    };
  }

  load(data: {
    campfire?: Parameters<WorkstationQueue["load"]>[0];
    woodworking?: Parameters<WorkstationQueue["load"]>[0];
    furnace?: Parameters<WorkstationQueue["load"]>[0];
    metalwork?: Parameters<WorkstationQueue["load"]>[0];
    chemistry?: Parameters<WorkstationQueue["load"]>[0];
    water?: Parameters<WorkstationQueue["load"]>[0];
    composter?: Parameters<WorkstationQueue["load"]>[0];
    recycler?: Parameters<WorkstationQueue["load"]>[0];
    /** Legacy save single-queue field. */
    legacyCampfire?: Parameters<WorkstationQueue["load"]>[0];
  } | undefined): void {
    this.queues.campfire.load(data?.campfire ?? data?.legacyCampfire);
    this.queues.woodworking.load(data?.woodworking);
    this.queues.furnace.load(data?.furnace);
    this.queues.metalwork.load(data?.metalwork);
    this.queues.chemistry.load(data?.chemistry);
    this.queues.water.load(data?.water);
    this.queues.composter.load(data?.composter);
    this.queues.recycler.load(data?.recycler);
  }

  clear(): void {
    this.load(undefined);
  }
}

/** Remove stackable materials from inventory (lowest slots first). */
function removeItems(inventory: PlayerInventory, needs: readonly { itemId: ItemId; quantity: number }[]): boolean {
  for (const need of needs) {
    if (inventory.totalQuantity(need.itemId) < need.quantity) return false;
  }
  for (const need of needs) {
    let left = need.quantity;
    for (let i = 0; i < inventory.slotCount && left > 0; i += 1) {
      const stack = inventory.getSlot(i).stack;
      if (!stack || stack.itemId !== need.itemId) continue;
      if (stack.currentDurability !== undefined) {
        // Durables are single-unit tools — only remove if full item counts as 1.
        if (left < 1) break;
        if (!inventory.exchangeWholeStack(i, stack, null)) return false;
        left -= 1;
        continue;
      }
      const take = Math.min(left, stack.quantity);
      if (take === stack.quantity) {
        if (!inventory.exchangeWholeStack(i, stack, null)) return false;
      } else {
        if (!inventory.exchangeWholeStack(i, stack, createItemStack(stack.itemId, stack.quantity - take))) return false;
      }
      left -= take;
    }
    if (left > 0) return false;
  }
  return true;
}
