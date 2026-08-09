import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import type { CalibrationConfig } from "../config/calibrationConfig";
import type { Interactable } from "./Interactable";
import { InteractionTargetSelector } from "./InteractionTargetSelector";
import type { InteractionDebugState } from "./InteractionTypes";

export class InteractionSystem {
  private readonly selector = new InteractionTargetSelector();
  private readonly indicator: Mesh;
  private readonly indicatorMaterial: StandardMaterial;
  private readonly debugState: InteractionDebugState & {
    targetId: string | null;
    targetType: Interactable["interactionType"] | null;
    effectiveDistance: number;
    candidateCount: number;
    lastInteractionId: string | null;
  } = {
    targetId: null,
    targetType: null,
    effectiveDistance: Number.POSITIVE_INFINITY,
    candidateCount: 0,
    lastInteractionId: null,
  };
  private currentTarget: Interactable | null = null;
  private indicatorAlpha = 0;
  private interactionPulse = 0;

  constructor(
    scene: Scene,
    private readonly interactables: readonly Interactable[],
    private readonly config: CalibrationConfig,
  ) {
    this.indicatorMaterial = new StandardMaterial("InteractionIndicatorMaterial", scene);
    this.indicatorMaterial.diffuseColor = new Color3(0.59, 0.57, 0.32);
    this.indicatorMaterial.emissiveColor = new Color3(0.22, 0.23, 0.10);
    this.indicatorMaterial.specularColor = Color3.Black();
    this.indicatorMaterial.disableLighting = true;
    this.indicatorMaterial.alpha = 0;
    this.indicator = MeshBuilder.CreateTorus("InteractionTargetIndicator", { diameter: 2, thickness: 0.055, tessellation: 40 }, scene);
    this.indicator.material = this.indicatorMaterial;
    this.indicator.isPickable = false;
    this.indicator.setEnabled(false);
  }

  get target(): Interactable | null { return this.currentTarget; }
  get hasTarget(): boolean { return this.currentTarget !== null; }
  get state(): Readonly<InteractionDebugState> { return this.debugState; }

  update(delta: number, playerPosition: Readonly<Vector3>, playerYaw: number): void {
    const selection = this.selector.select(
      this.interactables,
      playerPosition,
      playerYaw,
      this.config.interaction.range,
      this.config.interaction.targetSwitchBias,
      this.config.interaction.facingTieDistance,
      this.currentTarget,
    );
    this.currentTarget = selection.target;
    this.debugState.targetId = selection.target?.interactionId ?? null;
    this.debugState.targetType = selection.target?.interactionType ?? null;
    this.debugState.effectiveDistance = selection.effectiveDistance;
    this.debugState.candidateCount = selection.candidateCount;
    this.updateIndicator(delta);
  }

  tryInteract(playerPosition: Readonly<Vector3>, requestFacing: (targetPosition: Readonly<Vector3>) => void): boolean {
    const target = this.currentTarget;
    if (!target || !target.isInteractionEnabled()) return false;
    const effectiveDistance = this.selector.measureEffectiveDistance(playerPosition, target);
    if (effectiveDistance > this.config.interaction.range) return false;
    requestFacing(target.getInteractionPosition());
    this.debugState.lastInteractionId = target.interactionId;
    this.debugState.effectiveDistance = effectiveDistance;
    this.interactionPulse = 1;
    return true;
  }

  private updateIndicator(delta: number): void {
    const targetAlpha = this.currentTarget ? 1 : 0;
    const fadeBlend = 1 - Math.exp(-this.config.interaction.indicatorFadeSpeed * delta);
    this.indicatorAlpha += (targetAlpha - this.indicatorAlpha) * fadeBlend;
    this.interactionPulse = Math.max(0, this.interactionPulse - delta * 3.4);

    if (this.currentTarget) {
      const position = this.currentTarget.getInteractionPosition();
      if (!this.indicator.isEnabled() || this.indicatorAlpha < 0.05) this.indicator.position.set(position.x, 0.07, position.z);
      else {
        this.indicator.position.x += (position.x - this.indicator.position.x) * fadeBlend;
        this.indicator.position.z += (position.z - this.indicator.position.z) * fadeBlend;
      }
      const radius = this.currentTarget.getInteractionRadius() + 0.16;
      const pulseScale = 1 + Math.sin(this.interactionPulse * Math.PI) * 0.18;
      this.indicator.scaling.set(radius * pulseScale, 1, radius * pulseScale);
    }

    this.indicatorMaterial.alpha = this.indicatorAlpha * (0.46 + this.interactionPulse * 0.22);
    this.indicator.setEnabled(this.indicatorAlpha > 0.01);
  }
}
