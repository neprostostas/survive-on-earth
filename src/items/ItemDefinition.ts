import type { ItemId } from "./ItemId";

export interface ItemDefinition {
  readonly id: ItemId;
  readonly displayName: string;
  readonly category: "resource";
  readonly maxStack: number;
  readonly iconId: ItemId;
}
