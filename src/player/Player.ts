import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { CalibrationConfig } from "../config/calibrationConfig";
import type { CollisionWorld } from "../collision/CollisionWorld";
import { PlayerAnimator } from "./PlayerAnimator";
import { PlayerMovement } from "./PlayerMovement";
import { PlayerVisual } from "./PlayerVisual";
import { CHARACTER_PROFILE } from "./CharacterProfile";
import type { HarvestPhase, HarvestTool } from "../harvesting/HarvestingTypes";
import type { HeldWeaponVisualId } from "../equipment/WeaponTypes";
import type { InteractionPoint } from "../interaction/InteractionTypes";
import type { CombatPoint } from "../combat/CombatTarget";
import type { FistSide } from "../combat/MeleeCombatSystem";
import { HealthPool } from "../combat/HealthPool";
import { PLAYER_HEALTH_CONFIG } from "../enemies/enemyConfig";

export class Player {
  readonly visual: PlayerVisual;
  readonly movement: PlayerMovement;
  readonly health = new HealthPool(PLAYER_HEALTH_CONFIG.maxHealth);
  private readonly animator: PlayerAnimator;

  constructor(scene: Scene, collisionWorld: CollisionWorld, private readonly config: CalibrationConfig) {
    this.visual = new PlayerVisual(scene);
    this.visual.root.position.set(0, 0, 5);
    this.visual.applyGender(CHARACTER_PROFILE.gender);
    this.visual.setHeight(CHARACTER_PROFILE.presentationHeight(config.player.visualHeight));
    this.movement = new PlayerMovement(
      this.visual.root.position,
      collisionWorld,
      config,
      (yaw) => { this.visual.root.rotation.y = yaw; },
      () => this.visual.root.rotation.y,
    );
    this.animator = new PlayerAnimator(this.visual);
  }

  get position(): Vector3 { return this.visual.root.position; }
  get facingYaw(): number { return this.visual.root.rotation.y; }

  update(delta: number, input: Vector2, screenRight: Vector3, screenUp: Vector3, sneaking = false, speedMultiplier = 1): void {
    this.movement.update(delta, input, screenRight, screenUp, speedMultiplier);
    const walkCap = Math.max(this.config.player.movementSpeed, 0.001);
    const speedRatio = this.movement.velocity.length() / walkCap;
    this.animator.update(delta, speedRatio, sneaking);
  }

  /** Visual crouch blend 0..1 (for nameplates / other systems). */
  get crouchAmount(): number { return this.animator.crouchAmount; }

  applyCalibration(): void {
    this.visual.applyGender(CHARACTER_PROFILE.gender);
    this.visual.setHeight(CHARACTER_PROFILE.presentationHeight(this.config.player.visualHeight));
  }
  requestFacing(targetPosition: InteractionPoint): void { this.movement.requestFacing(targetPosition); }
  stopMovement(): void { this.movement.stop(); }

  isFacing(targetPosition: InteractionPoint, toleranceRad: number): boolean {
    const dx = targetPosition.x - this.position.x;
    const dz = targetPosition.z - this.position.z;
    if (dx * dx + dz * dz < 0.0001) return true;
    const targetYaw = Math.atan2(dx, dz);
    const difference = Math.atan2(Math.sin(targetYaw - this.facingYaw), Math.cos(targetYaw - this.facingYaw));
    return Math.abs(difference) <= toleranceRad;
  }

  applyHarvestPose(tool: HarvestTool, progress: number, phase: HarvestPhase): void {
    this.animator.applyHarvestPose(tool, progress, phase);
  }

  clearHarvestPose(): void { this.animator.clearHarvestPose(); }
  getCombatPosition(): CombatPoint { return this.position; }
  faceCombatTarget(position: CombatPoint): void { this.movement.snapFacing(position); }

  applyMeleeAttackPose(progress: number, profile: import("../combat/MeleeCombatProfile").MeleeCombatProfile, fist: FistSide): void {
    this.animator.applyMeleeAttackPose(progress, profile, fist);
  }

  clearMeleeAttackPose(): void { this.animator.clearMeleeAttackPose(); }

  setHeldWeapon(tool: HeldWeaponVisualId | null): void {
    this.visual.setHeldWeapon(tool);
  }
}
