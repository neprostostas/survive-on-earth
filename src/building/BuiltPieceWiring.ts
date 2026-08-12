/**
 * Maps build piece catalog IDs → station/container/craft wiring at home.
 * Pure domain helpers (no Babylon / DOM).
 */
import type { WorkstationKind } from "../workstations/WorkstationQueue.ts";
import {
  isCraftBenchPiece as craftPieceCheck,
  builtCraftInteractableId as craftInteractableId,
  CRAFT_BENCH_PIECE_IDS as craftPieceIds,
} from "../crafting/CraftAccess.ts";
import { isPowerBuildPiece } from "./BuiltBaseUtility.ts";
import { isPassagePieceId } from "./BuildingRegistry.ts";

export {
  isCraftBenchPiece,
  builtCraftInteractableId,
  CRAFT_BENCH_PIECE_IDS,
} from "../crafting/CraftAccess.ts";

export {
  isPowerBuildPiece,
  powerDeviceIdForPiece,
  isWaterInfrastructurePiece,
  FARM_BASE_IRRIGATION,
  POWER_PIECE_SPECS,
  formatBaseUtilityHud,
} from "./BuiltBaseUtility.ts";
export type { BaseUtilityHudSample, BaseUtilityHudView } from "./BuiltBaseUtility.ts";

export { isPassagePieceId } from "./BuildingRegistry.ts";

export const STATION_PIECE_TO_KIND: Readonly<Record<string, WorkstationKind>> = Object.freeze({
  campfire: "campfire",
  "woodworking-bench": "woodworking",
  furnace: "furnace",
  "metalwork-bench": "metalwork",
  "chemistry-station": "chemistry",
  "water-collector": "water",
  composter: "composter",
  recycler: "recycler",
});

/** Slot capacity for placeable chests. */
export const CHEST_PIECE_CAPACITY: Readonly<Record<string, number>> = Object.freeze({
  "chest-small": 8,
  "chest-reinforced": 12,
  "metal-chest": 16,
  "medical-cabinet": 10,
  "cold-box": 12,
  "shelf-basic": 6,
  "weapon-rack": 4,
});

export function isStationPiece(pieceId: string): boolean {
  return pieceId in STATION_PIECE_TO_KIND;
}

export function isChestPiece(pieceId: string): boolean {
  return pieceId in CHEST_PIECE_CAPACITY;
}

/** Pure power props that also act as E-targets (not containers / stations). */
export function isStandalonePowerPiece(pieceId: string): boolean {
  return isPowerBuildPiece(pieceId) && !isStationPiece(pieceId) && !isChestPiece(pieceId);
}

/** Fridge piece id (powered chest). */
export function isColdStoragePiece(pieceId: string): boolean {
  return pieceId === "cold-box";
}

export function isDoorPiece(pieceId: string): boolean {
  return isPassagePieceId(pieceId);
}

/** Process stations, craft tables, chests, power props, or doors/gates. */
export function isInteractableBuildPiece(pieceId: string): boolean {
  return isStationPiece(pieceId)
    || craftPieceCheck(pieceId)
    || isChestPiece(pieceId)
    || isStandalonePowerPiece(pieceId)
    || isDoorPiece(pieceId);
}

export function builtStationInteractableId(pieceInstanceId: string): string {
  return `built-station-${pieceInstanceId}`;
}

export function builtPowerInteractableId(pieceInstanceId: string, pieceId: string): string {
  return `built-power-${pieceInstanceId}:${pieceId}`;
}

export function isBuiltPowerInteractionId(interactionId: string): boolean {
  return interactionId.startsWith("built-power-");
}

/** Piece instance id from `built-power-{instance}:{pieceId}`. */
export function pieceInstanceFromBuiltPower(interactionId: string): string | null {
  if (!isBuiltPowerInteractionId(interactionId)) return null;
  const body = interactionId.slice("built-power-".length);
  const colon = body.lastIndexOf(":");
  if (colon <= 0) return null;
  return body.slice(0, colon);
}

export function builtDoorInteractableId(pieceInstanceId: string, pieceId: string): string {
  return `built-door-${pieceInstanceId}:${pieceId}`;
}

export function isBuiltDoorInteractionId(interactionId: string): boolean {
  return interactionId.startsWith("built-door-");
}

export function pieceInstanceFromBuiltDoor(interactionId: string): string | null {
  if (!isBuiltDoorInteractionId(interactionId)) return null;
  const body = interactionId.slice("built-door-".length);
  const colon = body.lastIndexOf(":");
  if (colon <= 0) return null;
  return body.slice(0, colon);
}

export function builtChestContainerId(pieceInstanceId: string): string {
  return `built-chest-${pieceInstanceId}`;
}

/** Alias kept for callers that prefer wiring namespace. */
export function craftInteractableIdFor(pieceInstanceId: string, pieceId: string): string {
  return craftInteractableId(pieceInstanceId, pieceId);
}

export function craftBenchPieceIds(): readonly string[] {
  return craftPieceIds;
}

/** Parse piece instance id from built-chest container interaction id, or null. */
export function pieceIdFromBuiltChestContainer(containerId: string): string | null {
  if (!containerId.startsWith("built-chest-")) return null;
  return containerId.slice("built-chest-".length);
}
