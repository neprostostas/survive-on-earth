import type { ItemId } from "./ItemId";
import type { EquipmentMetadata } from "../equipment/EquipmentTypes";

export interface MeleeCombatMetadata {
  readonly damage: number;
  readonly attacksPerSecond: number;
}

export interface ItemDefinition {
  readonly id: ItemId;
  readonly displayName: string;
  readonly category: "resource" | "armor" | "tool";
  readonly maxStack: number;
  readonly iconId: ItemId;
  readonly equipment?: EquipmentMetadata;
  /** Metadata only for durable tools (e.g. Hatchet/Pickaxe). Max uses before removal. */
  readonly maxDurability?: number;
  /** Explicit melee combat capability — not implied by category=tool alone. */
  readonly meleeCombat?: MeleeCombatMetadata;
}
