/** Carrying inventory: permanent POCKETS + optional backpack expansion. */
export const INVENTORY_CONFIG = Object.freeze({
  /** Permanent base POCKET indices 0..baseSlotCount-1. Never renumbered. */
  baseSlotCount: 10,
  /**
   * Internal storage length beyond base for equipped backpack extra slots.
   * Large enough for future tiers without reallocating live arrays.
   */
  reservedExtraSlotCapacity: 25,
  columns: 5,
  fullFeedbackDurationMs: 1100,
});

export function inventoryStorageLength(): number {
  return INVENTORY_CONFIG.baseSlotCount + INVENTORY_CONFIG.reservedExtraSlotCapacity;
}
