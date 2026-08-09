import { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Engine } from "@babylonjs/core/Engines/engine";
import type { Scene } from "@babylonjs/core/scene";
import type { CalibrationConfig } from "../config/calibrationConfig";
import { GAME_CONFIG } from "../config/gameConfig";

export class GameCamera {
  readonly camera: FreeCamera;
  readonly screenRight = Vector3.Right();
  readonly screenUp = Vector3.Forward();
  private readonly smoothTarget = Vector3.Zero();
  private readonly renderTarget = Vector3.Zero();
  private readonly viewDirection = Vector3.Zero();
  private readonly viewUp = Vector3.Zero();
  private initialized = false;

  constructor(scene: Scene, private readonly engine: Engine, private readonly config: CalibrationConfig) {
    this.camera = new FreeCamera("FixedGameplayCamera", Vector3.Zero(), scene);
    this.camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 120;
    this.camera.inputs.clear();
    scene.activeCamera = this.camera;
  }

  update(delta: number, playerPosition: Vector3): void {
    const desiredTarget = playerPosition.add(new Vector3(
      this.config.camera.targetOffsetX,
      this.config.camera.targetOffsetY,
      this.config.camera.targetOffsetZ,
    ));
    if (!this.initialized) {
      this.smoothTarget.copyFrom(desiredTarget);
      this.initialized = true;
    } else {
      const blend = 1 - Math.exp(-this.config.camera.followSharpness * delta);
      Vector3.LerpToRef(this.smoothTarget, desiredTarget, blend, this.smoothTarget);
    }

    const yaw = this.config.camera.yawDeg * Math.PI / 180;
    const pitch = this.config.camera.pitchDeg * Math.PI / 180;
    const horizontal = Math.cos(pitch) * GAME_CONFIG.cameraDistance;
    const vertical = Math.sin(pitch) * GAME_CONFIG.cameraDistance;

    this.screenUp.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
    this.screenRight.set(this.screenUp.z, 0, -this.screenUp.x).normalize();

    // Snap only the rendered camera transform to the screen pixel grid. The
    // simulation and smooth follow target stay continuous, so controls remain
    // fluid while static geometry no longer crawls between subpixels.
    this.viewDirection.set(-Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)).normalize();
    Vector3.CrossToRef(this.viewDirection, this.screenRight, this.viewUp);
    this.viewUp.normalize();
    const worldUnitsPerPixel = this.config.camera.orthoHeight / Math.max(this.engine.getRenderHeight(), 1);
    const rightCoordinate = Vector3.Dot(this.smoothTarget, this.screenRight);
    const upCoordinate = Vector3.Dot(this.smoothTarget, this.viewUp);
    const snappedRight = Math.round(rightCoordinate / worldUnitsPerPixel) * worldUnitsPerPixel;
    const snappedUp = Math.round(upCoordinate / worldUnitsPerPixel) * worldUnitsPerPixel;
    this.renderTarget.copyFrom(this.smoothTarget);
    const rightCorrection = snappedRight - rightCoordinate;
    const upCorrection = snappedUp - upCoordinate;
    this.renderTarget.addInPlaceFromFloats(
      this.screenRight.x * rightCorrection + this.viewUp.x * upCorrection,
      this.screenRight.y * rightCorrection + this.viewUp.y * upCorrection,
      this.screenRight.z * rightCorrection + this.viewUp.z * upCorrection,
    );

    this.camera.position.set(
      this.renderTarget.x + Math.sin(yaw) * horizontal,
      this.renderTarget.y + vertical,
      this.renderTarget.z + Math.cos(yaw) * horizontal,
    );
    this.camera.setTarget(this.renderTarget);
    this.applyProjection();
  }

  applyProjection(): void {
    const height = this.config.camera.orthoHeight;
    const aspect = this.engine.getRenderWidth() / Math.max(this.engine.getRenderHeight(), 1);
    this.camera.orthoTop = height / 2;
    this.camera.orthoBottom = -height / 2;
    this.camera.orthoLeft = -height * aspect / 2;
    this.camera.orthoRight = height * aspect / 2;
  }
}
