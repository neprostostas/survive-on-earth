/**
 * World-event trader caravans: seeded barter offers (no loot dump).
 */
import type { ItemId } from "../items/ItemId.ts";
import { createItemStack } from "../items/ItemSystem.ts";
import type { BarterOffer } from "./NpcSystem.ts";
import type { WorldEventKind } from "../world/WorldEventDirector.ts";

export type BarterEventKind = "trader" | "rare-trader" | "scavenger-market";

export function isBarterEventKind(kind: string): kind is BarterEventKind {
  return kind === "trader" || kind === "rare-trader" || kind === "scavenger-market";
}

export function eventTraderNpcId(eventId: string): string {
  return `event-trader-${eventId}`;
}

export function isEventTraderNpcId(npcId: string): boolean {
  return npcId.startsWith("event-trader-");
}

export function eventIdFromTraderNpc(npcId: string): string | null {
  if (!isEventTraderNpcId(npcId)) return null;
  return npcId.slice("event-trader-".length) || null;
}

/** Shared dialogue node for all event caravans. */
export const CARAVAN_DIALOGUE_ID = "caravan-hello";

type OfferTemplate = {
  readonly id: string;
  readonly costs: ReadonlyArray<{ itemId: ItemId; quantity: number }>;
  readonly offerItem: ItemId;
  readonly offerQty: number;
  readonly currencyCost?: number;
};

const COMMON_POOL: readonly OfferTemplate[] = Object.freeze([
  Object.freeze({
    id: "bandages",
    costs: Object.freeze([{ itemId: "plant-fiber" as const, quantity: 8 }]),
    offerItem: "bandage" as const,
    offerQty: 3,
  }),
  Object.freeze({
    id: "nails-pack",
    costs: Object.freeze([{ itemId: "scrap-metal" as const, quantity: 5 }]),
    offerItem: "nails" as const,
    offerQty: 10,
  }),
  Object.freeze({
    id: "clean-water",
    costs: Object.freeze([{ itemId: "trade-token" as const, quantity: 1 }]),
    offerItem: "clean-water" as const,
    offerQty: 2,
  }),
  Object.freeze({
    id: "rope",
    costs: Object.freeze([{ itemId: "plant-fiber" as const, quantity: 10 }]),
    offerItem: "rope" as const,
    offerQty: 2,
  }),
  Object.freeze({
    id: "token-for-scrap",
    costs: Object.freeze([{ itemId: "scrap-metal" as const, quantity: 12 }]),
    offerItem: "trade-token" as const,
    offerQty: 1,
  }),
]);

const RARE_POOL: readonly OfferTemplate[] = Object.freeze([
  Object.freeze({
    id: "bp-weapon",
    costs: Object.freeze([
      { itemId: "trade-token" as const, quantity: 3 },
      { itemId: "scrap-metal" as const, quantity: 8 },
    ]),
    offerItem: "blueprint-weapon" as const,
    offerQty: 1,
  }),
  Object.freeze({
    id: "bp-tool",
    costs: Object.freeze([
      { itemId: "trade-token" as const, quantity: 3 },
      { itemId: "iron-bar" as const, quantity: 2 },
    ]),
    offerItem: "blueprint-tool" as const,
    offerQty: 1,
  }),
  Object.freeze({
    id: "ammo-box",
    costs: Object.freeze([{ itemId: "trade-token" as const, quantity: 2 }]),
    offerItem: "pistol-ammo" as const,
    offerQty: 12,
  }),
  Object.freeze({
    id: "first-aid",
    costs: Object.freeze([
      { itemId: "trade-token" as const, quantity: 2 },
      { itemId: "cloth" as const, quantity: 4 },
    ]),
    offerItem: "first-aid-kit" as const,
    offerQty: 1,
  }),
  Object.freeze({
    id: "alloy",
    costs: Object.freeze([{ itemId: "iron-bar" as const, quantity: 4 }]),
    offerItem: "hardened-alloy" as const,
    offerQty: 1,
  }),
]);

const EPIC_POOL: readonly OfferTemplate[] = Object.freeze([
  Object.freeze({
    id: "bp-station",
    costs: Object.freeze([
      { itemId: "trade-token" as const, quantity: 5 },
      { itemId: "advanced-circuit" as const, quantity: 1 },
    ]),
    offerItem: "blueprint-station" as const,
    offerQty: 1,
  }),
  Object.freeze({
    id: "power-cell",
    costs: Object.freeze([{ itemId: "trade-token" as const, quantity: 4 }]),
    offerItem: "power-cell" as const,
    offerQty: 1,
  }),
  Object.freeze({
    id: "servo",
    costs: Object.freeze([
      { itemId: "trade-token" as const, quantity: 3 },
      { itemId: "scrap-metal" as const, quantity: 10 },
    ]),
    offerItem: "servo-assembly" as const,
    offerQty: 1,
  }),
]);

function poolFor(kind: BarterEventKind): readonly OfferTemplate[] {
  if (kind === "trader") return COMMON_POOL;
  if (kind === "scavenger-market") return Object.freeze([...COMMON_POOL, ...RARE_POOL]);
  return Object.freeze([...RARE_POOL, ...EPIC_POOL]);
}

function offerCount(kind: BarterEventKind): number {
  if (kind === "trader") return 3;
  if (kind === "scavenger-market") return 4;
  return 4;
}

/** Deterministic mulberry32. */
function rng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function caravanOffersFor(kind: WorldEventKind | string, seed: number): readonly BarterOffer[] {
  if (!isBarterEventKind(kind)) return Object.freeze([]);
  const pool = [...poolFor(kind)];
  const rand = rng(seed * 7919 + 17);
  // Fisher–Yates
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  const n = Math.min(offerCount(kind), pool.length);
  const picked = pool.slice(0, n);
  return Object.freeze(picked.map((t, index) => Object.freeze({
    id: `${kind}-${seed}-${t.id}-${index}`,
    costs: t.costs,
    offer: createItemStack(t.offerItem, t.offerQty),
    currencyCost: t.currencyCost,
  })));
}

export function caravanDisplayName(kind: BarterEventKind): string {
  if (kind === "rare-trader") return "Rare Caravan";
  if (kind === "scavenger-market") return "Scavenger Stall";
  return "Wayfarer Trader";
}
