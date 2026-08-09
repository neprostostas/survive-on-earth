import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { InteractionType } from "./InteractionTypes";

export interface Interactable {
  readonly interactionId: string;
  readonly interactionType: InteractionType;
  getInteractionPosition(): Readonly<Vector3>;
  getInteractionRadius(): number;
  isInteractionEnabled(): boolean;
}

export interface InteractableOptions {
  id: string;
  type: InteractionType;
  position: () => Readonly<Vector3>;
  radius: () => number;
  enabled: () => boolean;
}

export function createInteractable(options: InteractableOptions): Interactable {
  return {
    interactionId: options.id,
    interactionType: options.type,
    getInteractionPosition: options.position,
    getInteractionRadius: options.radius,
    isInteractionEnabled: options.enabled,
  };
}
