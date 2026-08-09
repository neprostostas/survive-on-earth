import type { InteractionPoint, InteractionType } from "./InteractionTypes";

export interface Interactable {
  readonly interactionId: string;
  readonly interactionType: InteractionType;
  getInteractionPosition(): InteractionPoint;
  getInteractionRadius(): number;
  isInteractionEnabled(): boolean;
}

export interface InteractableOptions {
  id: string;
  type: InteractionType;
  position: () => InteractionPoint;
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
