import type { ItemId } from "./ItemId";
import type { EquipmentMetadata } from "../equipment/EquipmentTypes";

export interface ItemDefinition {
  readonly id: ItemId;
  readonly displayName: string;
  readonly category: "resource" | "armor" | "tool";
  readonly maxStack: number;
  readonly iconId: ItemId;
  readonly equipment?: EquipmentMetadata;
}
