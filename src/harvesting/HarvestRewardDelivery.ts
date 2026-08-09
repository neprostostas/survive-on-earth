import type { ItemId } from "../items/ItemId";
import type { ItemResult, ResourceResultSink, ResultWorldPoint } from "../items/ItemResult";
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";

export interface HarvestDeliveryResult {
  readonly sourceId: string;
  readonly itemId: ItemId;
  readonly requestedQuantity: number;
  readonly insertedQuantity: number;
  readonly overflowQuantity: number;
}

/**
 * Harvest → Inventory only. Never spawns GroundLoot.
 * Overflow is discarded (documented M15 rule).
 */
export class HarvestRewardDelivery implements ResourceResultSink {
  private last: HarvestDeliveryResult | null = null;
  private deliveryCount = 0;
  private readonly inventory: PlayerInventory;

  constructor(inventory: PlayerInventory) {
    this.inventory = inventory;
  }

  get lastResult(): HarvestDeliveryResult | null { return this.last; }
  get count(): number { return this.deliveryCount; }

  handle(result: ItemResult, _position: ResultWorldPoint): void {
    let insertedQuantity = 0;
    for (const stack of result.stacks) {
      const partial = this.inventory.tryInsertAvailable(stack);
      insertedQuantity += partial.insertedQuantity;
    }
    const overflowQuantity = Math.max(0, result.quantity - insertedQuantity);
    this.last = Object.freeze({
      sourceId: result.sourceId,
      itemId: result.itemId,
      requestedQuantity: result.quantity,
      insertedQuantity,
      overflowQuantity,
    });
    this.deliveryCount += 1;
  }
}
