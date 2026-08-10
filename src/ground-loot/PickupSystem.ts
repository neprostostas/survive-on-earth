import type { Interactable } from "../interaction/Interactable";
import type { InteractionPoint } from "../interaction/InteractionTypes";
import type { InteractionSystem } from "../interaction/InteractionSystem";
import { GroundLoot } from "./GroundLoot.ts";
import type { GroundLootSystem } from "./GroundLootSystem.ts";
import type { PickupRejectionSink, PickupResultSink } from "./PickupResult";
import type { PlayerInventory } from "../inventory/PlayerInventory";

function horizontalDistanceSq(a: InteractionPoint, b: InteractionPoint): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

export class PickupSystem {
  private readonly groundLoot: GroundLootSystem;
  private readonly interaction: InteractionSystem;
  private readonly inventory: PlayerInventory;
  private readonly resultSink: PickupResultSink;
  private readonly rejectionSink: PickupRejectionSink | null;

  constructor(
    groundLoot: GroundLootSystem,
    interaction: InteractionSystem,
    inventory: PlayerInventory,
    resultSink: PickupResultSink,
    rejectionSink: PickupRejectionSink | null = null,
  ) {
    this.groundLoot = groundLoot;
    this.interaction = interaction;
    this.inventory = inventory;
    this.resultSink = resultSink;
    this.rejectionSink = rejectionSink;
  }

  tryPickup(target: Interactable, playerPosition: InteractionPoint): boolean {
    if (!(target instanceof GroundLoot)) return false;
    if (!this.inventory.canInsert(target.stack)) {
      this.rejectionSink?.handleInventoryFull();
      return false;
    }
    const stack = this.groundLoot.claim(target, playerPosition, (candidate) => this.inventory.tryInsert(candidate).accepted);
    if (!stack) return false;
    this.interaction.clearTarget(target);
    this.resultSink.handle(Object.freeze({ groundLootId: target.interactionId, stack }));
    return true;
  }

  /**
   * While E / Space is held: collect every active ground pile in range,
   * nearest-first (one vacuum pass per call — typically once per frame).
   * Does not fire inventory-full feedback (caller decides spam policy).
   */
  tryVacuumInRange(playerPosition: InteractionPoint, range: number, maxPerCall = 12): { picked: number; inventoryFull: boolean } {
    const reach = Math.max(0.1, range);
    const candidates = this.groundLoot.active
      .map((entity) => {
        const pos = entity.getInteractionPosition();
        const limit = reach + entity.getInteractionRadius();
        return { entity, distSq: horizontalDistanceSq(playerPosition, pos), limitSq: limit * limit };
      })
      .filter((c) => c.distSq <= c.limitSq)
      .sort((a, b) => a.distSq - b.distSq);

    let picked = 0;
    for (const { entity } of candidates) {
      if (picked >= maxPerCall) break;
      if (!this.inventory.canInsert(entity.stack)) {
        return { picked, inventoryFull: true };
      }
      // Bypass tryPickup's rejection sink; vacuum uses canInsert gate above.
      const stack = this.groundLoot.claim(entity, playerPosition, (candidate) => this.inventory.tryInsert(candidate).accepted);
      if (!stack) continue;
      this.interaction.clearTarget(entity);
      this.resultSink.handle(Object.freeze({ groundLootId: entity.interactionId, stack }));
      picked += 1;
    }
    return { picked, inventoryFull: false };
  }
}