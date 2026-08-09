export type InteractionType = "resource" | "container" | "station" | "ground-loot";

export interface InteractionPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface InteractionDebugState {
  readonly targetId: string | null;
  readonly targetType: InteractionType | null;
  readonly effectiveDistance: number;
  readonly candidateCount: number;
  readonly lastInteractionId: string | null;
}
