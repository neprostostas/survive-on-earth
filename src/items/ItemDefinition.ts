import type { EquipmentMetadata } from "../equipment/EquipmentTypes";

export interface MeleeCombatMetadata {
  readonly damage: number;
  readonly attacksPerSecond: number;
  readonly hitRange?: number;
}

export interface BackpackMetadata {
  readonly extraSlots: number;
}

export type ItemRarity = "common" | "uncommon" | "rare" | "epic";
export type ConsumableKind = "heal" | "food" | "drink";

export interface ConsumableMetadata {
  readonly kind: ConsumableKind;
  /** Restore amount applied by the kind (HP / hunger / thirst). */
  readonly amount: number;
  /** Seconds of use channel; 0 = instant. */
  readonly useTime: number;
  /** When true, reject use at full relevant pool. */
  readonly rejectWhenFull: boolean;
}

export interface ItemDefinition {
  readonly id: import("./ItemId").ItemId;
  readonly displayName: string;
  readonly category: "resource" | "armor" | "tool" | "gear" | "consumable" | "ammo" | "material";
  readonly maxStack: number;
  readonly iconId: import("./ItemId").ItemId;
  readonly description?: string;
  readonly rarity?: ItemRarity;
  readonly equipment?: EquipmentMetadata;
  readonly maxDurability?: number;
  readonly meleeCombat?: MeleeCombatMetadata;
  readonly backpack?: BackpackMetadata;
  readonly consumable?: ConsumableMetadata;
  /** Assignable to PlayerQuickSlot. */
  readonly quickSlot?: boolean;
  /** Assignable to PlayerUtilitySlot (torch etc.). */
  readonly utility?: boolean;
}
