import { Scalar } from "@babylonjs/core/Maths/math.scalar";
import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { CalibrationConfig } from "../config/calibrationConfig";
import type { CollisionWorld } from "../collision/CollisionWorld";
import type { InteractionPoint } from "../interaction/InteractionTypes";

export class PlayerMovement {
  readonly velocity = Vector3.Zero();
  private requestedFacingYaw: number | null = null;

  constructor(
    private readonly rootPosition: Vector3,
    private readonly collisionWorld: CollisionWorld,
    private readonly config: CalibrationConfig,
    private readonly setRotation: (yaw: number) => void,
    private readonly getRotation: () => number,
  ) {}

  update(delta: number, input: Vector2, screenRight: Vector3, screenUp: Vector3, speedMultiplier = 1): void {
    const hasMoveInput = input.lengthSquared() > 0.0001;
    const desiredDirection = screenRight.scale(input.x).addInPlace(screenUp.scale(input.y));
    desiredDirection.y = 0;
    // Normalize only direction — speed comes from movementSpeed * speedMultiplier (sprint = 2×).
    // Previously clamping length >1 cancelled Shift sprint after input scale.
    if (desiredDirection.lengthSquared() > 1) desiredDirection.normalize();
    const speed = this.config.player.movementSpeed * Math.max(0, speedMultiplier);
    const desiredVelocity = desiredDirection.scale(speed);
    const rate = desiredVelocity.lengthSquared() > 0 ? this.config.player.acceleration : this.config.player.deceleration;
    this.moveVelocityToward(desiredVelocity, rate * delta);

    const previous = this.rootPosition.clone();
    const next = this.collisionWorld.move(previous, this.velocity.scale(delta), this.config.player.collisionRadius);
    this.rootPosition.copyFrom(next);
    if (delta > 0) {
      this.velocity.x = (next.x - previous.x) / delta;
      this.velocity.z = (next.z - previous.z) / delta;
    }

    // Requested facing (combat / harvest / interact) always wins.
    // Never face from collision bounce — post-slide velocity points away from props and flipped the character.
    if (this.requestedFacingYaw !== null) {
      if (this.rotateTowards(this.requestedFacingYaw, delta)) this.requestedFacingYaw = null;
      return;
    }
    // Only orient from intentional movement input (desired walk dir), not resolved bounce velocity.
    if (hasMoveInput && desiredDirection.lengthSquared() > 0.001) {
      this.rotateTowards(Math.atan2(desiredDirection.x, desiredDirection.z), delta);
    }
  }

  requestFacing(targetPosition: InteractionPoint): void {
    const dx = targetPosition.x - this.rootPosition.x;
    const dz = targetPosition.z - this.rootPosition.z;
    if (dx * dx + dz * dz > 0.0001) this.requestedFacingYaw = Math.atan2(dx, dz);
  }

  /** Instant root face toward a point (combat start / locked re-aim). */
  snapFacing(targetPosition: InteractionPoint): void {
    const dx = targetPosition.x - this.rootPosition.x;
    const dz = targetPosition.z - this.rootPosition.z;
    if (dx * dx + dz * dz <= 0.0001) return;
    const yaw = Math.atan2(dx, dz);
    this.setRotation(yaw);
    this.requestedFacingYaw = null;
  }

  stop(): void { this.velocity.setAll(0); }

  private moveVelocityToward(target: Vector3, maxDelta: number): void {
    const difference = target.subtract(this.velocity);
    const distance = difference.length();
    if (distance <= maxDelta || distance === 0) this.velocity.copyFrom(target);
    else this.velocity.addInPlace(difference.scale(maxDelta / distance));
  }

  private rotateTowards(targetYaw: number, delta: number): boolean {
    const current = this.getRotation();
    const difference = Math.atan2(Math.sin(targetYaw - current), Math.cos(targetYaw - current));
    const maxTurn = this.config.player.rotationSpeed * delta;
    this.setRotation(current + Scalar.Clamp(difference, -maxTurn, maxTurn));
    return Math.abs(difference) <= maxTurn;
  }
}
