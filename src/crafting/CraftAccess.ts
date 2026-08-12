/**
 * LDOE workbench access — blueprints only at craft tables.
 * Pure domain helpers (no Babylon / DOM).
 */

/** Range from player to a craft surface (world units). */
export const CRAFT_BENCH_RANGE = 2.35;

/** Built pieces that open / enable the blueprints craft UI. */
export const CRAFT_BENCH_PIECE_IDS: readonly string[] = Object.freeze([
  "assembly-bench",
  // Metalwork also acts as a blueprints surface once placed.
  "metalwork-bench",
]);

/** Authored home starter workbench interactable id. */
export const HOME_WORKBENCH_ID = "home-workbench-01";

export function isCraftBenchPiece(pieceId: string): boolean {
  return CRAFT_BENCH_PIECE_IDS.includes(pieceId);
}

export function builtCraftInteractableId(pieceInstanceId: string, pieceId: string): string {
  return `built-craft-${pieceInstanceId}:${pieceId}`;
}

/** True when an interactable id is a craft bench surface. */
export function isCraftBenchInteractionId(interactionId: string): boolean {
  if (interactionId === HOME_WORKBENCH_ID) return true;
  if (interactionId.startsWith("home-workbench")) return true;
  if (interactionId.startsWith("built-craft-")) return true;
  if (interactionId.includes("assembly-bench") || interactionId.includes("metalwork-bench")) return true;
  return false;
}

export interface CraftAccessSample {
  readonly playerX: number;
  readonly playerZ: number;
  readonly range: number;
  readonly benches: readonly { readonly x: number; readonly z: number; readonly enabled: boolean }[];
}

/** Whether the player stands close enough to any enabled craft bench. */
export function playerNearCraftBench(sample: CraftAccessSample): boolean {
  const r = sample.range;
  const r2 = r * r;
  for (const b of sample.benches) {
    if (!b.enabled) continue;
    const dx = b.x - sample.playerX;
    const dz = b.z - sample.playerZ;
    if (dx * dx + dz * dz <= r2) return true;
  }
  return false;
}

export interface CraftBenchNearSample {
  readonly playerX: number;
  readonly playerZ: number;
  readonly range: number;
  readonly benches: readonly {
    readonly x: number;
    readonly z: number;
    readonly enabled: boolean;
    readonly tier: number;
  }[];
}

/** Highest craft-bench tier within range, or -1 if none. */
export function maxCraftBenchTierNear(sample: CraftBenchNearSample): number {
  const r2 = sample.range * sample.range;
  let max = -1;
  for (const b of sample.benches) {
    if (!b.enabled) continue;
    const dx = b.x - sample.playerX;
    const dz = b.z - sample.playerZ;
    if (dx * dx + dz * dz > r2) continue;
    if (b.tier > max) max = b.tier;
  }
  return max;
}
