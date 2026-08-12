/**
 * Repair cost math for damaged build pieces (domain only).
 */
import type { ItemId } from "../items/ItemId.ts";
import type { BuildPieceDef, PlacedBuildPiece } from "./BuildingRegistry.ts";

export interface RepairCostLine {
  readonly itemId: ItemId;
  readonly quantity: number;
}

/** Fraction of missing HP (0 = full, 1 = almost gone). */
export function missingHpRatio(piece: Pick<PlacedBuildPiece, "hp" | "maxHp">): number {
  if (piece.maxHp <= 0) return 0;
  return Math.max(0, Math.min(1, (piece.maxHp - piece.hp) / piece.maxHp));
}

export function isDamaged(piece: Pick<PlacedBuildPiece, "hp" | "maxHp">): boolean {
  return piece.hp < piece.maxHp;
}

/**
 * Materials needed to fully restore the piece.
 * ~50% of catalog cost scaled by missing HP (min 1 unit per material line when damaged).
 */
export function repairCostFor(
  piece: Pick<PlacedBuildPiece, "hp" | "maxHp">,
  def: BuildPieceDef,
): readonly RepairCostLine[] {
  const ratio = missingHpRatio(piece);
  if (ratio <= 0) return Object.freeze([]);
  const scale = Math.max(0.15, ratio * 0.55);
  const lines: RepairCostLine[] = [];
  for (const line of def.cost) {
    const qty = Math.max(1, Math.ceil(line.quantity * scale));
    lines.push(Object.freeze({ itemId: line.itemId, quantity: qty }));
  }
  return Object.freeze(lines);
}

/** HP restored when paying full repairCostFor (always full heal). */
export function repairHealAmount(piece: Pick<PlacedBuildPiece, "hp" | "maxHp">): number {
  return Math.max(0, piece.maxHp - piece.hp);
}
