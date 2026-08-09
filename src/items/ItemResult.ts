import type { ItemId } from "./ItemId";
import type { ItemStack } from "./ItemSystem";

export interface ItemResult {
  readonly sourceId: string;
  readonly itemId: ItemId;
  readonly quantity: number;
  readonly stacks: readonly ItemStack[];
}

export interface ResultWorldPoint { readonly x: number; readonly y: number; readonly z: number }

export interface ResourceResultSink {
  handle(result: ItemResult, position: ResultWorldPoint): void;
}
