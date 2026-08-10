/** LDOE-aligned home base grid (cell ≈ 1.4 player heights at default). */
export const BUILD_CONFIG = Object.freeze({
  /** World units per build cell. */
  cellSize: 2.5,
  /** How far ahead of the survivor the placement cursor sits (cells). */
  placeReachCells: 1.15,
  /** Soft home footprint radius in cells from origin (rough LDOE home lot). */
  homeRadiusCells: 12,
  /**
   * Slight camera pullback while builder is open.
   * Keep small — large boosts make exit feel like a sudden zoom-in.
   */
  cameraOrthoBoost: 1.2,
});

export type BuildLayer = "floor" | "structure" | "furniture";
export type BuildTab = "build" | "furniture";

export function layerForCategory(category: "floor" | "wall" | "door" | "furniture" | "station"): BuildLayer {
  if (category === "floor") return "floor";
  if (category === "wall" || category === "door") return "structure";
  return "furniture";
}

export function tabForCategory(category: "floor" | "wall" | "door" | "furniture" | "station"): BuildTab {
  return category === "furniture" || category === "station" ? "furniture" : "build";
}

export function worldToGrid(x: number, z: number, cellSize = BUILD_CONFIG.cellSize): { gx: number; gz: number } {
  return {
    gx: Math.round(x / cellSize),
    gz: Math.round(z / cellSize),
  };
}

export function gridToWorld(gx: number, gz: number, cellSize = BUILD_CONFIG.cellSize): { x: number; z: number } {
  return { x: gx * cellSize, z: gz * cellSize };
}

/** Placement cursor: one cell ahead of the survivor along facing. */
export function cursorGridFromPlayer(
  x: number,
  z: number,
  facingYaw: number,
  cellSize = BUILD_CONFIG.cellSize,
  reach = BUILD_CONFIG.placeReachCells,
): { gx: number; gz: number } {
  const tx = x + Math.sin(facingYaw) * cellSize * reach;
  const tz = z + Math.cos(facingYaw) * cellSize * reach;
  return worldToGrid(tx, tz, cellSize);
}
