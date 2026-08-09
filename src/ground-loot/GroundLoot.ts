import type { Interactable } from "../interaction/Interactable";
import type { InteractionPoint } from "../interaction/InteractionTypes";
import type { ItemStack } from "../items/ItemSystem";

export type GroundLootState = "active" | "collecting" | "removed";

export class GroundLoot implements Interactable {
  readonly interactionId: string;
  readonly stack: ItemStack;
  readonly interactionType = "ground-loot" as const;
  private readonly position: InteractionPoint;
  private readonly interactionRadius: number;
  private lifecycle: GroundLootState = "active";

  constructor(
    interactionId: string,
    stack: ItemStack,
    position: InteractionPoint,
    interactionRadius: number,
  ) {
    this.interactionId = interactionId;
    this.stack = stack;
    this.position = Object.freeze({ x: position.x, y: position.y, z: position.z });
    this.interactionRadius = interactionRadius;
  }

  get state(): GroundLootState { return this.lifecycle; }
  getInteractionPosition(): InteractionPoint { return this.position; }
  getInteractionRadius(): number { return this.interactionRadius; }
  isInteractionEnabled(): boolean { return this.lifecycle === "active"; }

  claim(): ItemStack | null {
    return this.claimIfAccepted(() => true);
  }

  claimIfAccepted(accept: (stack: ItemStack) => boolean): ItemStack | null {
    if (this.lifecycle !== "active") return null;
    if (!accept(this.stack)) return null;
    this.lifecycle = "collecting";
    return this.stack;
  }

  remove(): boolean {
    if (this.lifecycle !== "collecting") return false;
    this.lifecycle = "removed";
    return true;
  }
}
