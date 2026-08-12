/**
 * Warming consumables clear environmental cold.
 */
export type WarmingItemId = "warming-meal" | "warm-drink";

/** Absolute cold points removed (ColdPool max is typically 100). */
export const WARMING_COLD_CLEAR: Readonly<Record<WarmingItemId, number>> = Object.freeze({
  "warming-meal": 45,
  "warm-drink": 22,
});

export function isWarmingConsumable(itemId: string): itemId is WarmingItemId {
  return itemId === "warming-meal" || itemId === "warm-drink";
}

export function warmingColdClear(itemId: string): number {
  if (!isWarmingConsumable(itemId)) return 0;
  return WARMING_COLD_CLEAR[itemId];
}

/** Apply clear against current cold; returns amount actually removed. */
export function applyWarmingClear(currentCold: number, itemId: string): number {
  const clear = warmingColdClear(itemId);
  if (clear <= 0 || currentCold <= 0) return 0;
  return Math.min(currentCold, clear);
}
