import type { ItemStack } from "../items/ItemSystem";

export interface PickupResult {
  readonly groundLootId: string;
  readonly stack: ItemStack;
}

export interface PickupResultSink {
  handle(result: PickupResult): void;
}

export interface PickupRejectionSink {
  handleInventoryFull(): void;
}

export class TemporaryPickupResultSink implements PickupResultSink {
  lastResult: PickupResult | null = null;
  resultCount = 0;

  handle(result: PickupResult): void {
    this.lastResult = result;
    this.resultCount += 1;
  }
}
