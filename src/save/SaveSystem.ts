import type { ItemId } from "../items/ItemId.ts";
import type { ItemStack } from "../items/ItemSystem.ts";
import { createItemStack, ITEM_REGISTRY } from "../items/ItemSystem.ts";
import type { LocationId } from "../locations/LocationRegistry.ts";

/** Accepted formats: v1 (initial) and v2 (slot-indexed inventory + extended world state). */
export const SAVE_VERSION = 2 as const;
export const SAVE_VERSIONS = Object.freeze([1, 2] as const);
const STORAGE_KEY = "survive-on-earth.save.v1";

export interface SaveBlob {
  readonly version: number;
  readonly savedAt: number;
  readonly playtimeSec?: number;
  readonly locationId: LocationId;
  readonly health: number;
  readonly hunger: number;
  readonly thirst: number;
  readonly energy: number;
  readonly cold?: number;
  readonly xp: { level: number; xp: number; skillPoints: number };
  readonly skills: Record<string, number>;
  /**
   * Inventory contents.
   * v1: bare stacks (order only).
   * v2: slot-indexed entries `{ index, itemId, quantity, ... }`.
   */
  readonly inventory: readonly (SerializedStack | SerializedInventorySlot)[];
  readonly inventoryExtraSlots: number;
  readonly equipment: Partial<Record<"head" | "torso" | "legs" | "feet", SerializedStack | null>>;
  readonly weapon: SerializedStack | null;
  readonly backpack: SerializedStack | null;
  readonly quick: SerializedStack | null;
  readonly utility: SerializedStack | null;
  readonly bunkerAccess: boolean;
  readonly unlockedLocations: readonly LocationId[];
  /** Extended progress (optional — missing on older saves). */
  readonly position?: { readonly x: number; readonly y: number; readonly z: number };
  readonly facingYaw?: number;
  readonly locations?: Record<string, unknown>;
  readonly quests?: Record<string, unknown>;
  readonly achievements?: readonly string[];
  readonly farming?: readonly unknown[];
  readonly building?: readonly unknown[];
  readonly power?: { storage?: number; devices?: unknown[] };
  readonly water?: Record<string, unknown>;
  readonly mailbox?: readonly SerializedStack[];
  readonly worldClock?: number;
  readonly worldDayAccum?: number;
  readonly stats?: Record<string, unknown>;
  readonly journal?: Record<string, unknown>;
  readonly reputation?: Record<string, number>;
  readonly npcs?: { tokens?: number };
  readonly raids?: readonly unknown[];
  readonly contracts?: Record<string, unknown>;
}

export interface SerializedStack {
  readonly itemId: ItemId;
  readonly quantity: number;
  readonly currentDurability?: number;
}

export interface SerializedInventorySlot extends SerializedStack {
  readonly index: number;
}

export function serializeStack(stack: ItemStack): SerializedStack {
  return Object.freeze({
    itemId: stack.itemId,
    quantity: stack.quantity,
    currentDurability: stack.currentDurability,
  });
}

export function serializeInventorySlot(index: number, stack: ItemStack): SerializedInventorySlot {
  return Object.freeze({
    index,
    itemId: stack.itemId,
    quantity: stack.quantity,
    currentDurability: stack.currentDurability,
  });
}

/** Safe stack rebuild — returns null if item id / quantity / durability invalid. */
export function deserializeStack(data: SerializedStack): ItemStack | null {
  try {
    if (!data || typeof data.itemId !== "string") return null;
    ITEM_REGISTRY.get(data.itemId);
    const quantity = Number(data.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) return null;
    const options = data.currentDurability !== undefined
      ? { currentDurability: Number(data.currentDurability) }
      : undefined;
    return createItemStack(data.itemId, quantity, options);
  } catch {
    return null;
  }
}

function isValidBlob(parsed: unknown): parsed is SaveBlob {
  if (!parsed || typeof parsed !== "object") return false;
  const blob = parsed as SaveBlob;
  if (!SAVE_VERSIONS.includes(blob.version as 1 | 2)) return false;
  if (typeof blob.locationId !== "string") return false;
  if (!blob.xp || typeof blob.xp.level !== "number") return false;
  if (!Array.isArray(blob.inventory)) return false;
  return true;
}

export class SaveSystem {
  save(blob: SaveBlob): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
      return true;
    } catch {
      return false;
    }
  }

  load(): SaveBlob | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!isValidBlob(parsed)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  hasSave(): boolean {
    return this.load() !== null;
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const SAVE_SYSTEM = new SaveSystem();
