export type HarvestTool = "hatchet" | "pickaxe" | "hand";
export type HarvestResourceKind = "pine-tree" | "limestone-rock" | "fiber-plant" | "berry-bush";
export type HarvestPhase = "idle" | "aligning" | "wind-up" | "recovery";

export interface PrimaryActionState {
  pressedThisFrame: boolean;
  isHeld: boolean;
  releasedThisFrame: boolean;
}

export interface HarvestImpactResult {
  accepted: boolean;
  depleted: boolean;
  remainingHits: number;
}

export interface HarvestingDebugState {
  targetId: string | null;
  resourceKind: HarvestResourceKind | null;
  requiredTool: HarvestTool | null;
  toolAvailable: boolean;
  remainingHits: number;
  totalHits: number;
  phase: HarvestPhase;
  actionHeld: boolean;
  targetLocked: boolean;
  lastResourceDepleted: string | null;
  unavailableFeedback: number;
}
