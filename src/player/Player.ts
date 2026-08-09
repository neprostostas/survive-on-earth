import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { CalibrationConfig } from "../config/calibrationConfig";
import type { CollisionWorld } from "../collision/CollisionWorld";
import { PlayerAnimator } from "./PlayerAnimator";
import { PlayerMovement } from "./PlayerMovement";
import { PlayerVisual } from "./PlayerVisual";

export class Player {
  readonly visual: PlayerVisual;
  readonly movement: PlayerMovement;
  private readonly animator: PlayerAnimator;

  constructor(scene: Scene, collisionWorld: CollisionWorld, private readonly config: CalibrationConfig) {
    this.visual = new PlayerVisual(scene);
    this.visual.root.position.set(0, 0, 5);
    this.visual.setHeight(config.player.visualHeight);
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

  update(delta: number, input: Vector2, screenRight: Vector3, screenUp: Vector3): void {
    this.movement.update(delta, input, screenRight, screenUp);
    const speedRatio = this.movement.velocity.length() / Math.max(this.config.player.movementSpeed, 0.001);
    this.animator.update(delta, speedRatio);
  }

  applyCalibration(): void { this.visual.setHeight(this.config.player.visualHeight); }
  requestFacing(targetPosition: Readonly<Vector3>): void { this.movement.requestFacing(targetPosition); }
}
