import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Interactable } from "./Interactable";

export interface TargetSelection {
  target: Interactable | null;
  effectiveDistance: number;
  candidateCount: number;
}

export class InteractionTargetSelector {
  private readonly result: TargetSelection = {
    target: null,
    effectiveDistance: Number.POSITIVE_INFINITY,
    candidateCount: 0,
  };

  select(
    interactables: readonly Interactable[],
    playerPosition: Readonly<Vector3>,
    playerYaw: number,
    range: number,
    switchBias: number,
    facingTieDistance: number,
    currentTarget: Interactable | null,
  ): TargetSelection {
    let best: Interactable | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestFacing = Number.NEGATIVE_INFINITY;
    let currentDistance = Number.POSITIVE_INFINITY;
    let candidates = 0;
    const forwardX = Math.sin(playerYaw);
    const forwardZ = Math.cos(playerYaw);

    for (const candidate of interactables) {
      if (!candidate.isInteractionEnabled()) continue;
      const position = candidate.getInteractionPosition();
      const dx = position.x - playerPosition.x;
      const dz = position.z - playerPosition.z;
      const centerDistance = Math.sqrt(dx * dx + dz * dz);
      const effectiveDistance = Math.max(0, centerDistance - candidate.getInteractionRadius());
      if (candidate === currentTarget) currentDistance = effectiveDistance;
      if (effectiveDistance > range) continue;
      candidates += 1;

      const facing = centerDistance > 0.0001 ? (dx * forwardX + dz * forwardZ) / centerDistance : 1;
      const meaningfullyCloser = effectiveDistance < bestDistance - facingTieDistance;
      const nearlyEqualAndBetterFacing = Math.abs(effectiveDistance - bestDistance) <= facingTieDistance && facing > bestFacing;
      if (!best || meaningfullyCloser || nearlyEqualAndBetterFacing) {
        best = candidate;
        bestDistance = effectiveDistance;
        bestFacing = facing;
      }
    }

    const currentValid = currentTarget?.isInteractionEnabled() === true && currentDistance <= range;
    if (currentValid && currentTarget) {
      const challengerIsClearlyBetter = best !== null && best !== currentTarget && bestDistance + switchBias < currentDistance;
      if (!challengerIsClearlyBetter) {
        best = currentTarget;
        bestDistance = currentDistance;
      }
    }

    this.result.target = best;
    this.result.effectiveDistance = best ? bestDistance : Number.POSITIVE_INFINITY;
    this.result.candidateCount = candidates;
    return this.result;
  }

  measureEffectiveDistance(playerPosition: Readonly<Vector3>, target: Interactable): number {
    const position = target.getInteractionPosition();
    const dx = position.x - playerPosition.x;
    const dz = position.z - playerPosition.z;
    return Math.max(0, Math.sqrt(dx * dx + dz * dz) - target.getInteractionRadius());
  }
}
