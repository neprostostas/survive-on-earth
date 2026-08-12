/**
 * Extended vehicle domain: Salvaged Bike + Trailrunner ATV.
 */

import type { ItemId } from "../items/ItemId.ts";
import { createItemStack } from "../items/ItemSystem.ts";
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";

export type VehicleId = "salvaged-bike" | "trailrunner-atv";
export type VehiclePart = "frame" | "wheels" | "engine" | "fuel-tank" | "mechanics" | "electronics" | "suspension";

export const BIKE_PARTS: readonly VehiclePart[] = Object.freeze(["frame", "wheels", "engine", "fuel-tank", "mechanics"]);
export const ATV_PARTS: readonly VehiclePart[] = Object.freeze(["frame", "wheels", "engine", "fuel-tank", "mechanics", "electronics", "suspension"]);

export const PART_ITEMS: Readonly<Record<VehiclePart, ItemId>> = Object.freeze({
  frame: "metal-plate",
  wheels: "rubber",
  engine: "engine-part",
  "fuel-tank": "metal-plate",
  mechanics: "bearing",
  electronics: "wiring",
  suspension: "spring",
});

export function partsForVehicle(id: VehicleId): readonly VehiclePart[] {
  return id === "trailrunner-atv" ? ATV_PARTS : BIKE_PARTS;
}

export function partItemId(part: VehiclePart): ItemId {
  return PART_ITEMS[part];
}

interface VehicleState {
  installed: Set<VehiclePart>;
  assembled: boolean;
  fuel: number;
  condition: number;
  fuelCapacity: number;
  cargoSlots: number;
}

function emptyVehicle(capacity: number, cargo: number): VehicleState {
  return {
    installed: new Set(),
    assembled: false,
    fuel: 0,
    condition: 100,
    fuelCapacity: capacity,
    cargoSlots: cargo,
  };
}

export interface VehiclePartRow {
  readonly part: VehiclePart;
  readonly itemId: ItemId;
  readonly installed: boolean;
  readonly canInstall: boolean;
}

export interface VehicleView {
  readonly id: VehicleId;
  readonly assembled: boolean;
  readonly progress: number;
  readonly fuel: number;
  readonly fuelCapacity: number;
  readonly condition: number;
  readonly cargoSlots: number;
  readonly isActive: boolean;
  readonly parts: readonly VehiclePartRow[];
}

export class VehicleSystem {
  private readonly vehicles: Record<VehicleId, VehicleState> = {
    "salvaged-bike": emptyVehicle(40, 4),
    "trailrunner-atv": emptyVehicle(70, 8),
  };
  private active: VehicleId | null = null;

  get activeId(): VehicleId | null { return this.active; }
  get isAssembled(): boolean { return this.vehicles["salvaged-bike"].assembled; }
  get fuelLevel(): number { return this.vehicles[this.active ?? "salvaged-bike"].fuel; }
  get conditionPercent(): number { return this.vehicles[this.active ?? "salvaged-bike"].condition; }
  get progress(): number {
    const v = this.vehicles["salvaged-bike"];
    return v.installed.size / BIKE_PARTS.length;
  }
  get atvProgress(): number {
    const v = this.vehicles["trailrunner-atv"];
    return v.installed.size / ATV_PARTS.length;
  }
  get cargoFreeSlots(): number {
    const v = this.vehicles[this.active ?? "salvaged-bike"];
    return v.assembled ? v.cargoSlots : 0;
  }
  get hasAnyVehicle(): boolean {
    return this.vehicles["salvaged-bike"].assembled || this.vehicles["trailrunner-atv"].assembled;
  }

  isVehicleAssembled(id: VehicleId): boolean {
    return this.vehicles[id].assembled;
  }

  view(id: VehicleId, inventory: PlayerInventory | null = null): VehicleView {
    const v = this.vehicles[id];
    const list = partsForVehicle(id);
    const need = list.length;
    const parts: VehiclePartRow[] = list.map((part) => {
      const installed = v.installed.has(part);
      const itemId = PART_ITEMS[part];
      let can = false;
      if (!v.assembled && !installed && inventory) {
        can = this.canInstall(part, id) && inventory.findFirstSlotByItemId(itemId) !== null;
      }
      return Object.freeze({ part, itemId, installed, canInstall: can });
    });
    return Object.freeze({
      id,
      assembled: v.assembled,
      progress: need > 0 ? v.installed.size / need : 0,
      fuel: v.fuel,
      fuelCapacity: v.fuelCapacity,
      condition: v.condition,
      cargoSlots: v.cargoSlots,
      isActive: this.active === id,
      parts: Object.freeze(parts),
    });
  }

  canInstall(part: VehiclePart, vehicle: VehicleId = "salvaged-bike"): boolean {
    const list = partsForVehicle(vehicle);
    if (!(list as readonly string[]).includes(part)) return false;
    const v = this.vehicles[vehicle];
    return !v.assembled && !v.installed.has(part);
  }

  install(part: VehiclePart, inventory: PlayerInventory, vehicle: VehicleId = "salvaged-bike"): boolean {
    if (!this.canInstall(part, vehicle)) return false;
    const itemId = PART_ITEMS[part];
    const slot = inventory.findFirstSlotByItemId(itemId);
    if (slot === null) return false;
    const stack = inventory.getSlot(slot).stack;
    if (!stack) return false;
    if (stack.quantity === 1) inventory.exchangeWholeStack(slot, stack, null);
    else inventory.exchangeWholeStack(slot, stack, createItemStack(itemId, stack.quantity - 1));
    const v = this.vehicles[vehicle];
    v.installed.add(part);
    const need = partsForVehicle(vehicle).length;
    if (v.installed.size >= need) {
      v.assembled = true;
      if (!this.active) this.active = vehicle;
    }
    return true;
  }

  setActive(id: VehicleId): boolean {
    if (!this.vehicles[id].assembled) return false;
    this.active = id;
    return true;
  }

  refuel(inventory: PlayerInventory): boolean {
    const id = this.active ?? "salvaged-bike";
    const v = this.vehicles[id];
    if (!v.assembled) return false;
    if (v.fuel >= v.fuelCapacity) return false;
    const slot = inventory.findFirstSlotByItemId("fuel-can");
    if (slot === null) return false;
    const stack = inventory.getSlot(slot).stack;
    if (!stack) return false;
    if (stack.quantity === 1) inventory.exchangeWholeStack(slot, stack, null);
    else inventory.exchangeWholeStack(slot, stack, createItemStack("fuel-can", stack.quantity - 1));
    v.fuel = Math.min(v.fuelCapacity, v.fuel + (id === "trailrunner-atv" ? 22 : 15));
    return true;
  }

  /** Refuel a specific assembled vehicle (UI selection). */
  refuelVehicle(inventory: PlayerInventory, id: VehicleId): boolean {
    if (!this.vehicles[id].assembled) return false;
    const prev = this.active;
    this.active = id;
    const ok = this.refuel(inventory);
    if (!ok && prev) this.active = prev;
    else if (!ok) this.active = prev;
    return ok;
  }

  tryTravelConsume(distanceUnits = 1): boolean {
    const id = this.active ?? "salvaged-bike";
    const v = this.vehicles[id];
    if (!v.assembled) return false;
    const mul = id === "trailrunner-atv" ? 4 : 3;
    const cost = Math.max(1, Math.ceil(distanceUnits * mul));
    if (v.fuel < cost) return false;
    v.fuel -= cost;
    v.condition = Math.max(0, v.condition - (id === "trailrunner-atv" ? 0.35 : 0.5));
    return true;
  }

  travelSpeedMul(): number {
    if (!this.active) return 1;
    return this.active === "trailrunner-atv" ? 1.45 : 1.2;
  }

  serialize(): {
    active: VehicleId | null;
    bike: ReturnType<VehicleSystem["snapshot"]>;
    atv: ReturnType<VehicleSystem["snapshot"]>;
  } {
    return {
      active: this.active,
      bike: this.snapshot("salvaged-bike"),
      atv: this.snapshot("trailrunner-atv"),
    };
  }

  private snapshot(id: VehicleId) {
    const v = this.vehicles[id];
    return {
      assembled: v.assembled,
      parts: [...v.installed] as VehiclePart[],
      fuel: v.fuel,
      condition: v.condition,
    };
  }

  load(data: {
    assembled?: boolean;
    parts?: VehiclePart[];
    fuel?: number;
    condition?: number;
    active?: VehicleId | null;
    bike?: { assembled?: boolean; parts?: VehiclePart[]; fuel?: number; condition?: number };
    atv?: { assembled?: boolean; parts?: VehiclePart[]; fuel?: number; condition?: number };
  } | undefined): void {
    // Always clear both vehicles first so New Game / empty blob cannot leak state.
    this.loadOne("salvaged-bike", {});
    this.loadOne("trailrunner-atv", {});
    this.active = null;
    if (!data) return;
    // Structured dual-vehicle saves
    if (data.bike || data.atv || data.active !== undefined) {
      this.loadOne("salvaged-bike", data.bike ?? {});
      this.loadOne("trailrunner-atv", data.atv ?? {});
      const prefer = data.active;
      if (prefer && this.vehicles[prefer]?.assembled) this.active = prefer;
      else if (this.vehicles["salvaged-bike"].assembled) this.active = "salvaged-bike";
      else if (this.vehicles["trailrunner-atv"].assembled) this.active = "trailrunner-atv";
      return;
    }
    // Back-compat: bike-only flat shape
    this.loadOne("salvaged-bike", data);
    if (data.assembled || (data.parts?.length ?? 0) >= 5) this.active = "salvaged-bike";
  }

  private loadOne(id: VehicleId, data: { assembled?: boolean; parts?: VehiclePart[]; fuel?: number; condition?: number }): void {
    const v = this.vehicles[id];
    v.installed.clear();
    for (const p of data.parts ?? []) v.installed.add(p);
    const need = partsForVehicle(id).length;
    v.assembled = !!data.assembled || v.installed.size >= need;
    v.fuel = data.fuel ?? 0;
    v.condition = data.condition ?? 100;
  }
}
