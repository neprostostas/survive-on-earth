import { Scalar } from "@babylonjs/core/Maths/math.scalar";
import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { CalibrationConfig } from "../config/calibrationConfig";
import type { CollisionWorld } from "../collision/CollisionWorld";

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

  update(delta: number, input: Vector2, screenRight: Vector3, screenUp: Vector3): void {
    const desiredDirection = screenRight.scale(input.x).addInPlace(screenUp.scale(input.y));
    desiredDirection.y = 0;
    if (desiredDirection.lengthSquared() > 1) desiredDirection.normalize();
    const desiredVelocity = desiredDirection.scale(this.config.player.movementSpeed);
    const rate = desiredVelocity.lengthSquared() > 0 ? this.config.player.acceleration : this.config.player.deceleration;
    this.moveVelocityToward(desiredVelocity, rate * delta);

    const previous = this.rootPosition.clone();
    const next = this.collisionWorld.move(previous, this.velocity.scale(delta), this.config.player.collisionRadius);
    this.rootPosition.copyFrom(next);
    if (delta > 0) {
      this.velocity.x = (next.x - previous.x) / delta;
      this.velocity.z = (next.z - previous.z) / delta;
    }

    const facingDirection = this.velocity.lengthSquared() > 0.01
      ? this.velocity.normalizeToNew()
      : desiredDirection;
    const movementYaw = facingDirection.lengthSquared() > 0.001
      ? Math.atan2(facingDirection.x, facingDirection.z)
      : null;
    if (this.requestedFacingYaw !== null) {
      if (this.rotateTowards(this.requestedFacingYaw, delta)) this.requestedFacingYaw = null;
    } else if (movementYaw !== null) this.rotateTowards(movementYaw, delta);
  }

  requestFacing(targetPosition: Readonly<Vector3>): void {
    const dx = targetPosition.x - this.rootPosition.x;
    const dz = targetPosition.z - this.rootPosition.z;
    if (dx * dx + dz * dz > 0.0001) this.requestedFacingYaw = Math.atan2(dx, dz);
  }

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
