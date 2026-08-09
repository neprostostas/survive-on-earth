import type { Interactable } from "../interaction/Interactable";
import type { InteractionPoint } from "../interaction/InteractionTypes";
import type { InteractionSystem } from "../interaction/InteractionSystem";
import { GroundLoot } from "./GroundLoot.ts";
import type { GroundLootSystem } from "./GroundLootSystem.ts";
import type { PickupRejectionSink, PickupResultSink } from "./PickupResult";
import type { PlayerInventory } from "../inventory/PlayerInventory";

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
}
