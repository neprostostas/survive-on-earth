/**
 * Maps placeable pieces → power/water base utilities (domain only).
 */
import type { PowerDeviceKind } from "../base/PowerGrid.ts";

export interface BuiltPowerSpec {
  readonly kind: PowerDeviceKind;
  readonly label: string;
  readonly production: number;
  readonly consumption: number;
  readonly priority: 1 | 2 | 3 | 4 | 5;
  /** Generators need fuel to produce. */
  readonly needsFuel: boolean;
}

export const POWER_PIECE_SPECS: Readonly<Record<string, BuiltPowerSpec>> = Object.freeze({
  "camp-generator": Object.freeze({
    kind: "generator" as const,
    label: "Camp Generator",
    production: 10,
    consumption: 0,
    priority: 1 as const,
    needsFuel: true,
  }),
  "lantern-post": Object.freeze({
    kind: "lamp" as const,
    label: "Lantern Post",
    production: 0,
    consumption: 1,
    priority: 3 as const,
    needsFuel: false,
  }),
  "cold-box": Object.freeze({
    kind: "refrigerator" as const,
    label: "Cold Box",
    production: 0,
    consumption: 2,
    priority: 2 as const,
    needsFuel: false,
  }),
  "base-radio": Object.freeze({
    kind: "radio" as const,
    label: "Base Radio",
    production: 0,
    consumption: 1,
    priority: 4 as const,
    needsFuel: false,
  }),
  furnace: Object.freeze({
    kind: "workstation" as const,
    label: "Furnace Draw",
    production: 0,
    consumption: 1,
    priority: 4 as const,
    needsFuel: false,
  }),
});

export function isPowerBuildPiece(pieceId: string): boolean {
  return pieceId in POWER_PIECE_SPECS;
}

export function powerDeviceIdForPiece(instanceId: string): string {
  return `build-power-${instanceId}`;
}

export function isWaterInfrastructurePiece(pieceId: string): boolean {
  return pieceId === "water-collector";
}

/** Clean units pulled from base tanks per farm watering. */
export const FARM_BASE_IRRIGATION = 8;

export interface BaseUtilityHudSample {
  readonly production: number;
  readonly consumption: number;
  readonly storage: number;
  readonly batteryCapacity: number;
  readonly cleanWater: number;
  readonly cleanCapacity: number;
  readonly dirtyWater: number;
  readonly dirtyCapacity?: number;
  readonly pumpOn: boolean;
  readonly purifierOn: boolean;
  readonly hasCollector?: boolean;
}

export interface BaseUtilityHudView {
  /** e.g. +8 / 3 or −2 */
  readonly powerNetLabel: string;
  /** e.g. 42/100 */
  readonly batteryLabel: string;
  /** e.g. 20/120 */
  readonly cleanLabel: string;
  /** e.g. 5 · dirty buffer (empty string if none) */
  readonly dirtyHint: string;
  /** Clean display, with dirty suffix when buffer has water */
  readonly waterLabel: string;
  readonly net: number;
  readonly deficit: boolean;
  readonly waterLow: boolean;
  readonly catchingRain: boolean;
}

/** Pure presentational snapshot for the home base strip. */
export function formatBaseUtilityHud(sample: BaseUtilityHudSample): BaseUtilityHudView {
  const net = sample.production - sample.consumption;
  const netRounded = Math.round(net * 10) / 10;
  const powerNetLabel = `${netRounded >= 0 ? "+" : ""}${netRounded}`;
  const batteryLabel = `${Math.floor(sample.storage)}/${Math.floor(sample.batteryCapacity)}`;
  const cleanLabel = `${Math.floor(sample.cleanWater)}/${Math.floor(sample.cleanCapacity)}`;
  const dirtyFloor = Math.floor(sample.dirtyWater);
  const dirtyHint = dirtyFloor > 0
    ? `${dirtyFloor}${sample.dirtyCapacity != null ? `/${Math.floor(sample.dirtyCapacity)}` : ""} dirty`
    : "";
  const waterLabel = dirtyHint ? `${cleanLabel} · ${dirtyHint}` : cleanLabel;
  return {
    powerNetLabel,
    batteryLabel,
    cleanLabel,
    dirtyHint,
    waterLabel,
    net: netRounded,
    deficit: net < -0.01 && sample.storage < 1,
    waterLow: sample.cleanWater < FARM_BASE_IRRIGATION,
    catchingRain: !!sample.hasCollector,
  };
}
