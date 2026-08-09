export type InteractionType = "resource" | "container" | "station";

export interface InteractionDebugState {
  readonly targetId: string | null;
  readonly targetType: InteractionType | null;
  readonly effectiveDistance: number;
  readonly candidateCount: number;
  readonly lastInteractionId: string | null;
}
