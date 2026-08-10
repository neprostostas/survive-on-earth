import { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Engine } from "@babylonjs/core/Engines/engine";
import type { Scene } from "@babylonjs/core/scene";
import type { CalibrationConfig } from "../config/calibrationConfig";
import { BUILD_CONFIG } from "../building/buildConfig";
import { GAME_CONFIG } from "../config/gameConfig";

/** Max orthographic height above the calibrated/default floor. */
const ORTHO_ZOOM_MAX_BOOST = 14;
/** Exponential smoothing rate for ortho zoom (higher = snappier). */
const ORTHO_ZOOM_SMOOTH = 11;
/** Wheel / trackpad pinch → ortho delta scale. */
const ORTHO_WHEEL_SENS = 0.014;
/** Touch-pinch → ortho delta scale. */
const ORTHO_PINCH_SENS = 0.045;

/**
 * Fixed orthographic gameplay camera.
 * User zoom (wheel / trackpad pinch): only pull back — never below default ortho.
 */
export class GameCamera {
  readonly camera: FreeCamera;
  readonly screenRight = Vector3.Right();
  readonly screenUp = Vector3.Forward();
  private readonly smoothTarget = Vector3.Zero();
  private readonly renderTarget = Vector3.Zero();
  private readonly viewDirection = Vector3.Zero();
  private readonly viewUp = Vector3.Zero();
  private initialized = false;
  /** Remaining screen-shake intensity (0 = idle). */
  private shake = 0;
  /** Target/extra ortho for build mode (eased, never jumps). */
  private buildOrthoBoost = 0;
  private buildOrthoBoostTarget = 0;
  /**
   * Extra ortho above calibrated default (always ≥ 0).
   * Target is driven by wheel/pinch; current eases toward target each frame.
   */
  private zoomBoost = 0;
  private zoomBoostTarget = 0;
  private pinchLastDistance = 0;
  private readonly canvas: HTMLCanvasElement;
  private zoomEnabled = true;

  constructor(scene: Scene, private readonly engine: Engine, private readonly config: CalibrationConfig) {
    this.camera = new FreeCamera("FixedGameplayCamera", Vector3.Zero(), scene);
    this.camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 120;
    this.camera.inputs.clear();
    scene.activeCamera = this.camera;
    const canvas = this.engine.getRenderingCanvas();
    if (!canvas) throw new Error("GameCamera requires a rendering canvas");
    this.canvas = canvas;
    this.bindZoomInputs();
  }

  /**
   * Calibrated framing is the zoom-in floor — cannot go closer than this.
   * User zoom only adds boost above it (plus optional build pullback).
   */
  get effectiveOrthoHeight(): number {
    return this.config.camera.orthoHeight + this.zoomBoost + this.buildOrthoBoost;
  }

  setZoomEnabled(enabled: boolean): void {
    this.zoomEnabled = enabled;
  }

  update(delta: number, playerPosition: Vector3): void {
    if (delta > 0) {
      const t = 1 - Math.exp(-ORTHO_ZOOM_SMOOTH * delta);
      this.zoomBoost += (this.zoomBoostTarget - this.zoomBoost) * t;
      if (Math.abs(this.zoomBoostTarget - this.zoomBoost) < 0.0005) this.zoomBoost = this.zoomBoostTarget;
      this.buildOrthoBoost += (this.buildOrthoBoostTarget - this.buildOrthoBoost) * t;
      if (Math.abs(this.buildOrthoBoostTarget - this.buildOrthoBoost) < 0.0005) {
        this.buildOrthoBoost = this.buildOrthoBoostTarget;
      }
    }

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
    const worldUnitsPerPixel = this.effectiveOrthoHeight / Math.max(this.engine.getRenderHeight(), 1);
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

    if (this.shake > 0) {
      const amp = this.shake * 0.12;
      const t = performance.now() * 0.045;
      this.camera.position.x += Math.sin(t * 1.7) * amp;
      this.camera.position.y += Math.cos(t * 2.1) * amp * 0.35;
      this.camera.position.z += Math.cos(t * 1.3) * amp;
      this.shake = Math.max(0, this.shake - delta * 3.2);
    }

    this.camera.setTarget(this.renderTarget);
    this.applyProjection();
  }

  /** Hit / impact feedback. Magnitude ~0.25–0.8. Caller gates on settings. */
  pulseShake(magnitude = 0.4): void {
    this.shake = Math.min(1.2, this.shake + magnitude);
  }

  /** LDOE build mode: slight camera pullback (smoothed in update). */
  setBuildModeBoost(enabled: boolean): void {
    this.buildOrthoBoostTarget = enabled ? BUILD_CONFIG.cameraOrthoBoost : 0;
    if (!enabled) {
      // Instant clear when leaving builder — no lingering “zoomed out” state.
      this.buildOrthoBoost = 0;
    }
  }

  /** Reset user zoom + build boost to default framing (e.g. new game). */
  resetFraming(): void {
    this.zoomBoost = 0;
    this.zoomBoostTarget = 0;
    this.buildOrthoBoost = 0;
    this.buildOrthoBoostTarget = 0;
    this.applyProjection();
  }

  applyProjection(): void {
    const height = this.effectiveOrthoHeight;
    const aspect = this.engine.getRenderWidth() / Math.max(this.engine.getRenderHeight(), 1);
    this.camera.orthoTop = height / 2;
    this.camera.orthoBottom = -height / 2;
    this.camera.orthoLeft = -height * aspect / 2;
    this.camera.orthoRight = height * aspect / 2;
  }

  dispose(): void {
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.canvas.removeEventListener("touchstart", this.onTouchStart);
    this.canvas.removeEventListener("touchmove", this.onTouchMove);
    this.canvas.removeEventListener("touchend", this.onTouchEnd);
    this.canvas.removeEventListener("touchcancel", this.onTouchEnd);
  }

  private bindZoomInputs(): void {
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.canvas.addEventListener("touchstart", this.onTouchStart, { passive: true });
    this.canvas.addEventListener("touchmove", this.onTouchMove, { passive: false });
    this.canvas.addEventListener("touchend", this.onTouchEnd, { passive: true });
    this.canvas.addEventListener("touchcancel", this.onTouchEnd, { passive: true });
  }

  /**
   * Mouse wheel or trackpad pinch (macOS sends wheel + ctrlKey for pinch).
   * deltaY > 0 → zoom out (higher ortho); deltaY < 0 → zoom in toward default only.
   */
  private readonly onWheel = (event: WheelEvent): void => {
    if (!this.zoomEnabled) return;
    // Always own wheel over the game canvas so the page never scrolls/zooms the browser chrome.
    event.preventDefault();
    let dy = event.deltaY;
    if (event.deltaMode === 1) dy *= 16; // lines → pixels
    if (event.deltaMode === 2) dy *= 800; // pages → rough pixels
    // Trackpad pinch on macOS is usually wheel + ctrlKey; plain wheel zooms too.
    const amount = dy * ORTHO_WHEEL_SENS * (event.ctrlKey ? 1.35 : 1);
    this.applyZoomDelta(amount);
  };

  private readonly onTouchStart = (event: TouchEvent): void => {
    if (!this.zoomEnabled || event.touches.length !== 2) {
      this.pinchLastDistance = 0;
      return;
    }
    this.pinchLastDistance = touchDistance(event.touches[0], event.touches[1]);
  };

  private readonly onTouchMove = (event: TouchEvent): void => {
    if (!this.zoomEnabled || event.touches.length !== 2) return;
    event.preventDefault();
    const dist = touchDistance(event.touches[0], event.touches[1]);
    if (this.pinchLastDistance > 0.5) {
      // Fingers further apart → zoom in (lower ortho); closer → zoom out.
      const delta = (this.pinchLastDistance - dist) * ORTHO_PINCH_SENS;
      this.applyZoomDelta(delta);
    }
    this.pinchLastDistance = dist;
  };

  private readonly onTouchEnd = (event: TouchEvent): void => {
    if (event.touches.length < 2) this.pinchLastDistance = 0;
  };

  /** Positive delta = zoom out (raise ortho). Negative = zoom in (lower toward floor). */
  private applyZoomDelta(delta: number): void {
    this.zoomBoostTarget = clamp(this.zoomBoostTarget + delta, 0, ORTHO_ZOOM_MAX_BOOST);
  }
}

function touchDistance(a: Touch, b: Touch): number {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
