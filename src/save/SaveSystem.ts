import type { ItemId } from "../items/ItemId.ts";
import type { ItemStack } from "../items/ItemSystem.ts";
import { createItemStack, expandToLegalStacks, ITEM_REGISTRY } from "../items/ItemSystem.ts";
import type { LocationId } from "../locations/LocationRegistry.ts";
import type { SerializedGroundLoot } from "../ground-loot/GroundLootSystem.ts";
import type { GameSettings } from "../i18n/I18n.ts";
import type { LocaleId } from "../i18n/locales.ts";
import type { CharacterIdentity } from "../player/CharacterProfile.ts";
import type { CalibrationConfig } from "../config/calibrationConfig.ts";

/** Accepted formats: v1–v5 (v5 adds harvest resource progress). */
export const SAVE_VERSION = 5 as const;
export const SAVE_VERSIONS = Object.freeze([1, 2, 3, 4, 5] as const);
const STORAGE_KEY = "survive-on-earth.save.v1";

export interface SerializedContainer {
  readonly id: string;
  readonly title: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly capacity: number;
  readonly active: boolean;
  readonly slots: readonly (SerializedStack | null)[];
}

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
   * v2+: slot-indexed entries `{ index, itemId, quantity, ... }`.
   */
  readonly inventory: readonly (SerializedStack | SerializedInventorySlot)[];
  readonly inventoryExtraSlots: number;
  readonly equipment: Partial<Record<"head" | "torso" | "legs" | "feet", SerializedStack | null>>;
  readonly weapon: SerializedStack | null;
  readonly backpack: SerializedStack | null;
  readonly quick: SerializedStack | null;
  readonly quick2?: SerializedStack | null;
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
  /** Active ground piles (v3+). */
  readonly groundLoot?: readonly SerializedGroundLoot[];
  /** Loot containers (v3+). */
  readonly worldContainers?: readonly SerializedContainer[];
  /**
   * Client preferences snapshot (v4+). Live keys remain source of truth at runtime;
   * blob carries a backup for continuity / export.
   */
  readonly settings?: Partial<GameSettings>;
  readonly locale?: LocaleId;
  readonly character?: CharacterIdentity;
  /** Camera / visual calibration (v4+). */
  readonly calibration?: CalibrationConfig;
  readonly vehicle?: {
    active?: string | null;
    bike?: Record<string, unknown>;
    atv?: Record<string, unknown>;
    assembled?: boolean;
    parts?: string[];
    fuel?: number;
    condition?: number;
  };
  readonly dungeonResets?: Record<string, unknown>;
  readonly worldEvents?: readonly unknown[];
  readonly deathBags?: readonly {
    id: string;
    x: number;
    z: number;
    createdAt?: number;
    stacks: readonly SerializedStack[];
  }[];
  readonly statusEffects?: readonly { id: string; remaining: number; tickAccum?: number }[];
  readonly locks?: readonly { id: string; locked: boolean; powered?: boolean }[];
  readonly greyhavenVisits?: number;
  readonly campfireQueue?: {
    nextId?: number;
    entries?: readonly { id: string; recipeKey: string; totalTime: number; progress: number }[];
  };
  readonly sneakActive?: boolean;
  /** Tree/rock/plant harvest progress (hits remaining / depleted). */
  readonly harvestResources?: readonly {
    id: string;
    remainingHits: number;
    isDepleted: boolean;
    resultClaimed: boolean;
  }[];
}

export interface SerializedStack {
  readonly itemId: ItemId;
  readonly quantity: number;
  readonly currentDurability?: number;
}

export interface SerializedInventorySlot extends SerializedStack {
  readonly index: number;
}

/** Prefer project identity when durability is present (avoid JSON dropping undefined). */
export function serializeStack(stack: ItemStack): SerializedStack {
  if (stack.currentDurability !== undefined) {
    return Object.freeze({
      itemId: stack.itemId,
      quantity: stack.quantity,
      currentDurability: stack.currentDurability,
    });
  }
  return Object.freeze({
    itemId: stack.itemId,
    quantity: stack.quantity,
  });
}

export function serializeInventorySlot(index: number, stack: ItemStack): SerializedInventorySlot {
  if (stack.currentDurability !== undefined) {
    return Object.freeze({
      index,
      itemId: stack.itemId,
      quantity: stack.quantity,
      currentDurability: stack.currentDurability,
    });
  }
  return Object.freeze({
    index,
    itemId: stack.itemId,
    quantity: stack.quantity,
  });
}

/** Safe stack rebuild — returns null if item id / quantity / durability invalid. */
export function deserializeStack(data: SerializedStack): ItemStack | null {
  const stacks = deserializeStacks(data);
  return stacks[0] ?? null;
}

/** Full legal expansion (oversize quantities are split by maxStack). */
export function deserializeStacks(data: SerializedStack): readonly ItemStack[] {
  try {
    if (!data || typeof data.itemId !== "string") return Object.freeze([]);
    ITEM_REGISTRY.get(data.itemId);
    const quantity = Number(data.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) return Object.freeze([]);
    const options = data.currentDurability !== undefined
      ? { currentDurability: Number(data.currentDurability) }
      : undefined;
    // Prefer createItemStack when legal; expand oversize / corrupted durable stacks.
    try {
      return Object.freeze([createItemStack(data.itemId, quantity, options)]);
    } catch {
      return expandToLegalStacks(Object.freeze({
        itemId: data.itemId as ItemStack["itemId"],
        quantity,
        ...(options?.currentDurability !== undefined
          ? { currentDurability: options.currentDurability }
          : {}),
      }) as ItemStack);
    }
  } catch {
    return Object.freeze([]);
  }
}

function isValidBlob(parsed: unknown): parsed is SaveBlob {
  if (!parsed || typeof parsed !== "object") return false;
  const blob = parsed as SaveBlob;
  if (!SAVE_VERSIONS.includes(blob.version as 1 | 2 | 3 | 4 | 5)) return false;
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
    } catch (error) {
      console.error("[SaveSystem] write failed", error);
      return false;
    }
  }

  load(): SaveBlob | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!isValidBlob(parsed)) {
        console.warn("[SaveSystem] invalid save blob ignored");
        return null;
      }
      return parsed;
    } catch (error) {
      console.error("[SaveSystem] read failed", error);
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
