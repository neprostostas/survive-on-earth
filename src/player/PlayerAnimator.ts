import { Scalar } from "@babylonjs/core/Maths/math.scalar";
import type { PlayerVisual } from "./PlayerVisual";
import type { HarvestPhase, HarvestTool } from "../harvesting/HarvestingTypes";
import type { FistSide } from "../combat/MeleeCombatSystem";
import type { MeleeCombatProfile } from "../combat/MeleeCombatProfile";
import { UNARMED_MELEE_PROFILE } from "../combat/MeleeCombatProfile";

/**
 * Procedural poses. actionPoseSuppressesLocomotion avoids locomotion overwriting
 * arms/torso while melee/harvest swing is active (pose reapplied after update).
 */
export class PlayerAnimator {
  private time = 0;
  private locomotionBlend = 0;
  private crouchBlend = 0;
  private actionPoseActive = false;

  constructor(private readonly visual: PlayerVisual) {}

  get crouchAmount(): number { return this.crouchBlend; }

  update(delta: number, normalizedSpeed: number, sneaking = false): void {
    const crouchTarget = sneaking ? 1 : 0;
    this.crouchBlend += (crouchTarget - this.crouchBlend) * (1 - Math.exp(-10 * delta));
    const c = this.crouchBlend;
    // Allow >1 when sprinting so cadence picks up (still clip amplitude at 1).
    const targetBlend = this.actionPoseActive ? 0 : Scalar.Clamp(normalizedSpeed, 0, 2);
    const blendRate = targetBlend > this.locomotionBlend ? 12 : 8;
    this.locomotionBlend += (targetBlend - this.locomotionBlend) * (1 - Math.exp(-blendRate * delta));
    const cadence = this.locomotionBlend;
    const moving = Math.min(this.locomotionBlend, 1);
    // Crouch walk is slower cadence / shorter stride; sprint faster.
    this.time += delta * (2 + cadence * (7.5 - c * 3.2));
    const strideWave = Math.sin(this.time);
    const strideScale = 0.6 - c * 0.28;
    const stride = strideWave * strideScale * moving;
    const idle = Math.sin(this.time * 0.55);
    const relaxedArm = idle * 0.025 * (1 - moving);
    // Knees bend forward in crouch + locomotion swing.
    const crouchKnee = c * 0.95;
    this.visual.leftLeg.rotation.x = stride + crouchKnee;
    this.visual.rightLeg.rotation.x = -stride + crouchKnee;
    if (this.actionPoseActive) {
      // Soft lower body crouch remains while arms owned by action pose.
      this.visual.bodyPivot.position.y = -c * 0.28 + (-Math.sin(Math.PI * 0) * 0);
      this.visual.bodyPivot.rotation.x = -0.08 * c;
      return;
    }
    this.visual.leftArm.rotation.x = -stride * 0.72 + relaxedArm - c * 0.35;
    // Held tools: carry with blade/head hanging naturally (arm slightly forward).
    if (this.visual.isHoldingTool) {
      this.visual.rightArm.rotation.x = -0.35 + stride * 0.2 + relaxedArm * 0.4 - c * 0.2;
      this.visual.rightArm.rotation.z = -0.18;
      this.visual.rightArm.rotation.y = 0.08;
      this.visual.leftArm.rotation.z = 0.06;
    } else {
      this.visual.rightArm.rotation.x = stride * 0.72 - relaxedArm - c * 0.35;
      this.visual.rightArm.rotation.z = 0;
      this.visual.rightArm.rotation.y = 0;
      this.visual.leftArm.rotation.z = 0;
    }
    const bob = Math.abs(Math.sin(this.time * 2)) * 0.012 * moving * (1 - c * 0.4) + idle * 0.007 * (1 - moving);
    // Drop hips / torso for readable crouch silhouette.
    this.visual.bodyPivot.position.y = bob - c * 0.32;
    this.visual.bodyPivot.rotation.x = -0.055 * moving - c * 0.22;
    this.visual.bodyPivot.rotation.z = strideWave * 0.01 * moving;
    this.visual.bodyPivot.rotation.y = Math.sin(this.time * 2) * 0.018 * moving + idle * 0.006 * (1 - moving);
  }

  applyHarvestPose(tool: HarvestTool, progress: number, phase: HarvestPhase): void {
    this.actionPoseActive = true;
    this.visual.showHarvestTool(tool === "hand" ? "hatchet" : tool);
    const visualTool = tool === "hand" || tool === "hatchet" ? "hatchet" : "pickaxe";
    if (phase === "aligning") {
      this.applyToolReadyPose(visualTool);
      return;
    }
    const impactAt = tool === "hand" ? 0.55 : tool === "hatchet" ? 0.5 : 0.49;
    this.applyOverheadChop(visualTool, progress, impactAt);
  }

  clearHarvestPose(): void {
    this.actionPoseActive = false;
    this.visual.hideHarvestTool();
    this.visual.leftArm.rotation.set(0, 0, 0);
    this.visual.rightArm.rotation.set(0, 0, 0);
    this.visual.bodyPivot.rotation.set(0, 0, 0);
    this.visual.bodyPivot.position.y = 0;
  }

  applyMeleeAttackPose(progress: number, profile: MeleeCombatProfile, fist: FistSide): void {
    this.actionPoseActive = true;
    if (profile.source === "fists") {
      this.applyFistAttackPose(progress, fist);
      return;
    }
    const src = String(profile.source);
    if (src.includes("hatchet") || src === "wooden-club" || src === "crowbar" || src === "metal-pipe" || src === "warden-maul") {
      this.applyOverheadChop("hatchet", progress, profile.impactNormalizedTime);
      return;
    }
    if (src.includes("pickaxe") || src === "stone-knife") {
      this.applyOverheadChop("pickaxe", progress, profile.impactNormalizedTime);
      return;
    }
    // Spear: raised overhand stab down-forward, then settle to ready (not reverse arc).
    this.applyOverheadThrust(progress, profile.impactNormalizedTime);
  }

  clearMeleeAttackPose(): void {
    this.actionPoseActive = false;
    this.visual.setUnarmedAttackVisual(false);
    this.visual.leftArm.rotation.set(0, 0, 0);
    this.visual.rightArm.rotation.set(0, 0, 0);
    this.visual.bodyPivot.rotation.set(0, 0, 0);
    this.visual.bodyPivot.position.y = 0;
  }

  applyFistAttackPose(progress: number, fist: FistSide): void {
    void UNARMED_MELEE_PROFILE;
    this.actionPoseActive = true;
    this.visual.setUnarmedAttackVisual(true);
    const impactAt = UNARMED_MELEE_PROFILE.impactNormalizedTime;
    const strike = this.oneWayStrike(progress, impactAt);
    const side = fist === "right" ? 1 : -1;
    const strikingArm = fist === "right" ? this.visual.rightArm : this.visual.leftArm;
    const guardArm = fist === "right" ? this.visual.leftArm : this.visual.rightArm;
    const restX = -0.25;
    const impactX = -1.7;
    strikingArm.rotation.x = restX + (impactX - restX) * strike;
    strikingArm.rotation.z = -side * (0.12 + strike * 0.04);
    strikingArm.rotation.y = 0;
    guardArm.rotation.x = -0.2 - strike * 0.12;
    guardArm.rotation.z = side * 0.1;
    guardArm.rotation.y = 0;
    this.visual.bodyPivot.rotation.y = 0;
    this.visual.bodyPivot.rotation.x = strike * 0.05;
    this.visual.bodyPivot.rotation.z = 0;
    this.visual.bodyPivot.position.y = -Math.sin(Math.PI * strike) * 0.012;
  }

  clearFistAttackPose(): void {
    this.clearMeleeAttackPose();
  }

  /** Ready hold — tool hangs head-down. */
  private applyToolReadyPose(tool: "hatchet" | "pickaxe"): void {
    void tool;
    this.visual.rightArm.rotation.x = -0.35;
    this.visual.rightArm.rotation.y = 0.08;
    this.visual.rightArm.rotation.z = -0.18;
    this.visual.leftArm.rotation.x = -0.15;
    this.visual.leftArm.rotation.y = 0;
    this.visual.leftArm.rotation.z = 0.08;
    this.visual.bodyPivot.rotation.set(0, 0, 0);
    this.visual.bodyPivot.position.y = 0;
  }

  /**
   * Overhead chop: TOP (raised) → IMPACT (down through target) → READY hold.
   * Never drives a bottom-to-top reverse swing.
   */
  private applyOverheadChop(tool: "hatchet" | "pickaxe", progress: number, impactAt: number): void {
    // More negative X ≈ hand higher/behind → less negative ≈ lower/down-forward (verified for Babylon).
    const topX = tool === "hatchet" ? -2.45 : -2.35;
    const topZ = -0.12;
    const impactX = tool === "hatchet" ? -0.55 : -0.7;
    const impactZ = tool === "hatchet" ? -0.4 : -0.32;
    const readyX = -0.35;
    const readyZ = -0.18;
    this.applyTopDownArm(progress, impactAt, topX, topZ, impactX, impactZ, readyX, readyZ, tool === "pickaxe" ? 0.16 : 0.12);
  }

  /** Overhand spear: raise tip then drive down-forward to ready. */
  private applyOverheadThrust(progress: number, impactAt: number): void {
    const topX = -2.2;
    const topZ = -0.08;
    const impactX = -1.0;
    const impactZ = -0.18;
    const readyX = -0.45;
    const readyZ = -0.12;
    this.applyTopDownArm(progress, impactAt, topX, topZ, impactX, impactZ, readyX, readyZ, 0.1);
  }

  private applyTopDownArm(
    progress: number,
    impactAt: number,
    topX: number,
    topZ: number,
    impactX: number,
    impactZ: number,
    readyX: number,
    readyZ: number,
    bodyLean: number,
  ): void {
    const clampedImpact = Math.min(Math.max(impactAt, 0.08), 0.92);
    let rightX: number;
    let rightZ: number;
    let pose: number; // 0 top … 1 impact for body lean/bob during attack half
    if (progress <= clampedImpact) {
      const t = this.smooth(Math.min(1, progress / clampedImpact));
      rightX = topX + (impactX - topX) * t;
      rightZ = topZ + (impactZ - topZ) * t;
      pose = t;
    } else {
      // Settle to ready hold — not back up overhead.
      const t = this.smooth(Math.min(1, (progress - clampedImpact) / (1 - clampedImpact)));
      rightX = impactX + (readyX - impactX) * t;
      rightZ = impactZ + (readyZ - impactZ) * t;
      pose = 1 - t;
    }
    this.visual.rightArm.rotation.x = rightX;
    this.visual.rightArm.rotation.y = 0.1;
    this.visual.rightArm.rotation.z = rightZ;
    this.visual.leftArm.rotation.x = -0.2 - pose * 0.45;
    this.visual.leftArm.rotation.y = 0;
    this.visual.leftArm.rotation.z = 0.1 + pose * 0.05;
    this.visual.bodyPivot.rotation.y = 0;
    this.visual.bodyPivot.rotation.x = -0.02 + pose * bodyLean;
    this.visual.bodyPivot.rotation.z = 0;
    this.visual.bodyPivot.position.y = -Math.sin(Math.PI * pose) * 0.022;
  }

  /** Triangle 0→1→0 for simple one-direction blends (fists). */
  private oneWayStrike(progress: number, impactAt: number): number {
    const clampedImpact = Math.min(Math.max(impactAt, 0.05), 0.95);
    if (progress <= clampedImpact) return this.smooth(Math.min(1, progress / clampedImpact));
    return 1 - this.smooth(Math.min(1, (progress - clampedImpact) / (1 - clampedImpact)));
  }

  private smooth(value: number): number { return value * value * (3 - 2 * value); }
}
