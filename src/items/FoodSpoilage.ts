/**
 * Food perishability domain (pure).
 * Lifetime = ambient seconds until one unit spoils for a given food.
 */
import type { ItemId } from "./ItemId.ts";
import { ITEM_REGISTRY } from "./ItemSystem.ts";

/** Ambient seconds per unit spoiled (lower = faster rot). */
export type SpoilTier = "raw" | "fresh" | "cooked" | "stable";

const TIER_LIFETIME: Readonly<Record<SpoilTier, number>> = Object.freeze({
  raw: 90,
  fresh: 180,
  cooked: 300,
  stable: 0, // never
});

/** Explicit overrides; unspecified food consumables fall into "fresh". */
const ITEM_TIER: Readonly<Partial<Record<ItemId, SpoilTier>>> = Object.freeze({
  "raw-meat": "raw",
  "river-fish": "raw",
  berries: "fresh",
  carrot: "fresh",
  potato: "fresh",
  mushroom: "fresh",
  corn: "fresh",
  beans: "fresh",
  "root-vegetable": "fresh",
  "roasted-meat": "cooked",
  "cooked-fish": "cooked",
  stew: "cooked",
  "roasted-root": "cooked",
  "cooked-berries": "cooked",
  "vegetable-soup": "cooked",
  "meat-stew": "cooked",
  "mushroom-soup": "cooked",
  "survival-meal": "cooked",
  "high-energy-meal": "cooked",
  "warming-meal": "cooked",
  "canned-food": "stable",
  "dry-food": "stable",
  "preserved-food": "stable",
});

export function spoilTierOf(itemId: string): SpoilTier | null {
  const known = ITEM_TIER[itemId as ItemId];
  if (known) return known;
  try {
    const def = ITEM_REGISTRY.get(itemId);
    if (def.category !== "consumable" || !def.consumable) return null;
    if (def.consumable.kind === "food") return "fresh";
    return null; // drinks / heals don't spoil for now
  } catch {
    return null;
  }
}

export function spoilLifetimeSec(itemId: string): number {
  const tier = spoilTierOf(itemId);
  if (!tier) return 0;
  return TIER_LIFETIME[tier];
}

export function isPerishableFood(itemId: string): boolean {
  return spoilLifetimeSec(itemId) > 0;
}

/** Powered fridge nearly stops rot; unpowered fridge is still a bit cooler than pockets. */
export const SPOIL_RATE_PLAYER = 1;
export const SPOIL_RATE_CHEST = 0.9;
export const SPOIL_RATE_FRIDGE_OFF = 0.55;
export const SPOIL_RATE_FRIDGE_ON = 0.08;

export interface SpoilSlotView {
  readonly itemId: string | null;
  readonly quantity: number;
}

/**
 * Advance age for a single inventory/container slot.
 * Returns how many units spoiled (caller reduces quantity).
 */
export function advanceSpoilAge(
  prevAge: number,
  slot: SpoilSlotView,
  dt: number,
  rateMul: number,
): { age: number; spoiledUnits: number } {
  if (dt <= 0 || rateMul <= 0 || !slot.itemId || slot.quantity <= 0) {
    return { age: slot.itemId ? prevAge : 0, spoiledUnits: 0 };
  }
  const life = spoilLifetimeSec(slot.itemId);
  if (life <= 0) return { age: 0, spoiledUnits: 0 };

  let age = Math.max(0, prevAge) + dt * rateMul;
  let qty = slot.quantity;
  let spoiled = 0;
  while (qty > 0 && age >= life) {
    age -= life;
    qty -= 1;
    spoiled += 1;
  }
  if (qty <= 0) age = 0;
  return { age, spoiledUnits: spoiled };
}
