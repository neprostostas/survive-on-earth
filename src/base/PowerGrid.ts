/**
 * Simple base power grid — generator output vs consumer demand.
 * Not a circuit simulator.
 */

export type PowerDeviceKind =
  | "generator"
  | "advanced-generator"
  | "solar"
  | "battery"
  | "lamp"
  | "floodlight"
  | "workstation"
  | "refrigerator"
  | "radio"
  | "water-pump"
  | "turret"
  | "alarm";

export interface PowerDevice {
  readonly id: string;
  readonly kind: PowerDeviceKind;
  readonly label: string;
  readonly production: number;
  readonly consumption: number;
  readonly priority: 1 | 2 | 3 | 4 | 5;
  enabled: boolean;
  fueled?: boolean;
}

export class PowerGrid {
  private readonly devices = new Map<string, PowerDevice>();
  private storedEnergy = 0;
  readonly batteryCapacity = 100;

  addDevice(device: PowerDevice): void {
    this.devices.set(device.id, device);
  }

  removeDevice(id: string): void {
    this.devices.delete(id);
  }

  get list(): readonly PowerDevice[] { return [...this.devices.values()]; }

  get production(): number {
    let p = 0;
    for (const d of this.devices.values()) {
      if (!d.enabled) continue;
      if (d.kind === "generator" || d.kind === "advanced-generator") {
        if (d.fueled === false) continue;
      }
      p += d.production;
    }
    return p;
  }

  get consumption(): number {
    let c = 0;
    for (const d of this.devices.values()) {
      if (d.enabled) c += d.consumption;
    }
    return c;
  }

  get storage(): number { return this.storedEnergy; }
  get net(): number { return this.production - this.consumption; }

  /** Advance energy buffer by dt seconds. Solar uses dayFactor 0..1. */
  tick(dt: number, dayFactor = 1): void {
    let prod = 0;
    let cons = 0;
    for (const d of this.devices.values()) {
      if (!d.enabled) continue;
      if (d.kind === "solar") prod += d.production * Math.max(0, dayFactor);
      else if (d.kind === "generator" || d.kind === "advanced-generator") {
        if (d.fueled !== false) prod += d.production;
      } else prod += d.production;
      cons += d.consumption;
    }
    const net = (prod - cons) * dt;
    this.storedEnergy = Math.max(0, Math.min(this.batteryCapacity, this.storedEnergy + net));
  }

  isPowered(deviceId: string): boolean {
    const d = this.devices.get(deviceId);
    if (!d || !d.enabled) return false;
    if (d.consumption <= 0) return true;
    return this.production + this.storedEnergy > 0.01;
  }

  ensureHomeDefaults(): void {
    if (this.devices.size > 0) return;
    this.addDevice({ id: "gen-1", kind: "generator", label: "Camp Generator", production: 8, consumption: 0, priority: 1, enabled: false, fueled: false });
    this.addDevice({ id: "lamp-1", kind: "lamp", label: "Workshop Lamp", production: 0, consumption: 1, priority: 3, enabled: true });
    this.addDevice({ id: "radio-1", kind: "radio", label: "Base Radio", production: 0, consumption: 1, priority: 4, enabled: false });
    this.addDevice({ id: "fridge-1", kind: "refrigerator", label: "Cold Box", production: 0, consumption: 2, priority: 2, enabled: false });
  }

  serialize(): { storage: number; devices: PowerDevice[] } {
    return {
      storage: this.storedEnergy,
      devices: [...this.devices.values()].map((d) => ({ ...d })),
    };
  }

  load(data: { storage?: number; devices?: PowerDevice[] }): void {
    this.devices.clear();
    this.storedEnergy = data.storage ?? 0;
    for (const d of data.devices ?? []) this.devices.set(d.id, { ...d });
  }
}
