import type { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { CalibrationConfig } from "../config/calibrationConfig";
import type { InteractionSystem } from "../interaction/InteractionSystem";
import type { Player } from "../player/Player";
import { HarvestableResource } from "./HarvestableResource";
import { HARVEST_FACING_TOLERANCE_RAD } from "./harvestingConfig";
import { HarvestingSession, type SwingTiming } from "./HarvestingSession";
import type { HarvestingDebugState, PrimaryActionState } from "./HarvestingTypes";
import type { HarvestToolAvailability } from "./PrototypeToolLoadout";
import { createItemResult } from "../items/ItemSystem";
import type { ResourceResultSink } from "../items/ItemResult";

export class HarvestingSystem {
  private readonly session = new HarvestingSession();
  private readonly debugState: HarvestingDebugState = {
    targetId: null,
    resourceKind: null,
    requiredTool: null,
    toolAvailable: false,
    remainingHits: 0,
    totalHits: 0,
    phase: "idle",
    actionHeld: false,
    targetLocked: false,
    lastResourceDepleted: null,
    unavailableFeedback: 0,
  };

  constructor(
    private readonly config: CalibrationConfig,
    private readonly tools: HarvestToolAvailability,
    private readonly player: Player,
    private readonly interaction: InteractionSystem,
    private readonly resultSink: ResourceResultSink,
    private readonly onResourceDepleted: (resource: HarvestableResource) => void,
  ) {}

  get state(): Readonly<HarvestingDebugState> { return this.debugState; }
  get active(): boolean { return this.session.active; }

  update(delta: number, action: PrimaryActionState, movement: Readonly<Vector2>, playerPosition: Readonly<Vector3>): boolean {
    this.debugState.unavailableFeedback = Math.max(0, this.debugState.unavailableFeedback - delta * 2.8);
    const selected = this.interaction.target instanceof HarvestableResource ? this.interaction.target : null;
    let consumedPress = this.session.active;

    if (!this.session.active && action.pressedThisFrame && selected) {
      consumedPress = true;
      if (!this.tools.hasTool(selected.requiredTool)) {
        this.debugState.unavailableFeedback = 1;
        this.syncDebug(selected, action.isHeld);
        return consumedPress;
      }
      this.player.stopMovement();
      this.player.requestFacing(selected.getInteractionPosition());
      this.session.begin(selected, action.isHeld);
      this.interaction.setTargetLock(selected);
    }

    const target = this.session.target;
    if (!target) {
      this.player.clearHarvestPose();
      this.syncDebug(selected, action.isHeld);
      return consumedPress;
    }

    this.player.requestFacing(target.getInteractionPosition());
    const effectiveDistance = this.interaction.measureEffectiveDistance(playerPosition, target);
    const targetValid = target.isInteractionEnabled() && effectiveDistance <= this.config.interaction.range;
    const toolAvailable = this.tools.hasTool(target.requiredTool);
    const facingAligned = this.player.isFacing(target.getInteractionPosition(), HARVEST_FACING_TOLERANCE_RAD);
    const timing = this.timingFor(target.requiredTool);
    const events = this.session.update(
      delta,
      timing,
      action.isHeld,
      facingAligned,
      targetValid,
      movement.length(),
      this.config.harvesting.movementCancelThreshold,
      toolAvailable,
    );

    if (events.impact) {
      const result = target.applyImpact(target.requiredTool);
      if (result.accepted) {
        target.playImpact(playerPosition, this.config.harvesting.hitReactionStrength, this.config.harvesting.particleIntensity);
        this.interaction.acknowledge(target);
      }
      if (result.accepted && result.depleted) {
        const resourceYield = target.claimYield();
        if (!resourceYield) throw new Error(`Depleted resource did not provide a one-shot yield: ${target.resourceId}`);
        const itemResult = createItemResult(target.resourceId, resourceYield.itemId, resourceYield.quantity);
        const resourcePosition = target.getInteractionPosition();
        this.resultSink.handle(itemResult, {
          x: resourcePosition.x,
          y: resourcePosition.y,
          z: resourcePosition.z,
        });
        target.playDepletion(playerPosition, this.config.harvesting.hitReactionStrength, this.config.harvesting.particleIntensity);
        this.debugState.lastResourceDepleted = target.resourceId;
        this.onResourceDepleted(target);
        this.interaction.clearTarget(target);
        this.session.cancel();
      }
    }

    if (this.session.active) {
      this.player.applyHarvestPose(target.requiredTool, this.session.normalizedProgress(timing), this.session.phase);
    } else {
      this.player.clearHarvestPose();
      this.interaction.setTargetLock(null);
    }
    this.syncDebug(this.session.target ?? (target.isDepleted ? null : target), action.isHeld);
    return consumedPress;
  }

  cancel(): void {
    this.session.cancel();
    this.interaction.setTargetLock(null);
    this.player.clearHarvestPose();
  }

  private timingFor(tool: "hatchet" | "pickaxe"): SwingTiming {
    return tool === "hatchet"
      ? { duration: this.config.harvesting.hatchetSwingDuration, impactNormalizedTime: this.config.harvesting.hatchetImpactTiming }
      : { duration: this.config.harvesting.pickaxeSwingDuration, impactNormalizedTime: this.config.harvesting.pickaxeImpactTiming };
  }

  private syncDebug(resource: HarvestableResource | null, actionHeld: boolean): void {
    this.debugState.targetId = resource?.resourceId ?? null;
    this.debugState.resourceKind = resource?.resourceKind ?? null;
    this.debugState.requiredTool = resource?.requiredTool ?? null;
    this.debugState.toolAvailable = resource ? this.tools.hasTool(resource.requiredTool) : false;
    this.debugState.remainingHits = resource?.remainingHits ?? 0;
    this.debugState.totalHits = resource?.totalHits ?? 0;
    this.debugState.phase = this.session.phase;
    this.debugState.actionHeld = actionHeld;
    this.debugState.targetLocked = this.session.active;
  }
}
