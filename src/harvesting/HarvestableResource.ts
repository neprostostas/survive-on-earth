import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Interactable } from "../interaction/Interactable";
import type { HarvestImpactResult, HarvestResourceKind, HarvestTool } from "./HarvestingTypes";
import type { ItemId } from "../items/ItemId";

export interface ResourceYield { readonly itemId: ItemId; readonly quantity: number }

export const HARVESTING_RESOURCES: Record<HarvestResourceKind, { requiredTool: HarvestTool; totalHits: number; yield: ResourceYield }> = {
  "pine-tree": { requiredTool: "hatchet", totalHits: 4, yield: Object.freeze({ itemId: "pine-log", quantity: 3 }) },
  "limestone-rock": { requiredTool: "pickaxe", totalHits: 5, yield: Object.freeze({ itemId: "limestone", quantity: 3 }) },
  "fiber-plant": { requiredTool: "hand", totalHits: 2, yield: Object.freeze({ itemId: "plant-fiber", quantity: 2 }) },
  "berry-bush": { requiredTool: "hand", totalHits: 1, yield: Object.freeze({ itemId: "berries", quantity: 3 }) },
};

export interface HarvestableVisual {
  impact(playerPosition: Readonly<Vector3>, strength: number, particleIntensity: number): void;
  deplete(playerPosition: Readonly<Vector3>, strength: number, particleIntensity: number): void;
  update(delta: number): void;
}

export interface HarvestableResourceOptions {
  id: string;
  kind: HarvestResourceKind;
  position: () => Readonly<Vector3>;
  radius: () => number;
  visualEnabled: () => boolean;
  visual: HarvestableVisual;
}

export class HarvestableResource implements Interactable {
  readonly interactionType = "resource" as const;
  readonly requiredTool: HarvestTool;
  readonly totalHits: number;
  remainingHits: number;
  isDepleted = false;
  private resultClaimed = false;
  private readonly options: HarvestableResourceOptions;

  constructor(options: HarvestableResourceOptions) {
    this.options = options;
    const definition = HARVESTING_RESOURCES[options.kind];
    this.requiredTool = definition.requiredTool;
    this.totalHits = definition.totalHits;
    this.remainingHits = definition.totalHits;
  }

  get interactionId(): string { return this.options.id; }
  get resourceId(): string { return this.options.id; }
  get resourceKind(): HarvestResourceKind { return this.options.kind; }
  getInteractionPosition(): Readonly<Vector3> { return this.options.position(); }
  getInteractionRadius(): number { return this.options.radius(); }
  isInteractionEnabled(): boolean { return !this.isDepleted && this.options.visualEnabled(); }

  applyImpact(tool: HarvestTool | null): HarvestImpactResult {
    if (this.isDepleted || tool !== this.requiredTool) return { accepted: false, depleted: this.isDepleted, remainingHits: this.remainingHits };
    this.remainingHits = Math.max(0, this.remainingHits - 1);
    this.isDepleted = this.remainingHits === 0;
    return { accepted: true, depleted: this.isDepleted, remainingHits: this.remainingHits };
  }

  claimYield(): ResourceYield | null {
    if (!this.isDepleted || this.resultClaimed) return null;
    this.resultClaimed = true;
    return HARVESTING_RESOURCES[this.resourceKind].yield;
  }

  playImpact(playerPosition: Readonly<Vector3>, strength: number, particleIntensity: number): void {
    this.options.visual.impact(playerPosition, strength, particleIntensity);
  }

  playDepletion(playerPosition: Readonly<Vector3>, strength: number, particleIntensity: number): void {
    this.options.visual.deplete(playerPosition, strength, particleIntensity);
  }

  updateVisual(delta: number): void { this.options.visual.update(delta); }
}
