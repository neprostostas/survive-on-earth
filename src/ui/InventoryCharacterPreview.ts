import { Engine } from "@babylonjs/core/Engines/engine";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Logger } from "@babylonjs/core/Misc/logger";
import { Scene } from "@babylonjs/core/scene";
import { EquipmentApparelVisuals } from "../equipment/EquipmentApparelVisuals";
import { BackpackEquipPresentation } from "../equipment/BackpackVisuals";
import type { PlayerEquipment } from "../equipment/PlayerEquipment";
import type { HeldWeaponVisualId } from "../equipment/WeaponTypes";
import type { ItemId } from "../items/ItemId";
import { CHARACTER_PROFILE } from "../player/CharacterProfile";
import { PlayerVisual } from "../player/PlayerVisual";

// Inventory may create a second Engine; ensure BJS banner stays muted even if this loads first.
Logger.LogLevels = Logger.ErrorLogLevel;

/**
 * Isolated Babylon preview of production equipment / weapon state.
 * Visual-only: no collision, combat, health, or movement domain.
 * Drag on the canvas to orbit the survivor.
 */
export class InventoryCharacterPreview {
  private readonly engine: Engine;
  private readonly scene: Scene;
  private readonly visual: PlayerVisual;
  private readonly apparel: EquipmentApparelVisuals;
  private readonly backpackVisual: BackpackEquipPresentation;
  private readonly camera: FreeCamera;
  private active = false;
  private motionFrozen = false;
  private idleTime = 0;
  private lastRenderMs = 0;
  private yaw = Math.PI * 0.04;
  private baseYaw = Math.PI * 0.04;
  private dragPointerId: number | null = null;
  private dragLastX = 0;
  private userControlled = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: false,
      stencil: false,
      adaptToDeviceRatio: true,
      powerPreference: "low-power",
    });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.08, 0.1, 0.09, 0);
    this.scene.autoClear = true;

    this.camera = new FreeCamera("InvCharCam", new Vector3(0.1, 0.92, 5.05), this.scene);
    this.camera.setTarget(new Vector3(0, 0.82, 0));
    this.camera.fov = 0.46;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 40;
    this.camera.inputs.clear();

    const hemi = new HemisphericLight("InvCharHemi", new Vector3(0.15, 1, 0.25), this.scene);
    hemi.intensity = 0.92;
    hemi.diffuse = new Color3(0.9, 0.92, 0.86);
    hemi.groundColor = new Color3(0.18, 0.2, 0.17);
    const key = new DirectionalLight("InvCharKey", new Vector3(-0.35, -0.85, -0.4), this.scene);
    key.intensity = 0.55;
    key.diffuse = new Color3(0.95, 0.94, 0.88);

    this.visual = new PlayerVisual(this.scene);
    this.visual.root.position.set(0, 0, 0);
    this.visual.root.rotation.y = this.yaw;
    this.applyIdentityPresentation();
    this.apparel = new EquipmentApparelVisuals(this.scene, this.visual, "InvEq");
    this.backpackVisual = new BackpackEquipPresentation(this.scene, this.visual.bodyPivot, "InvPack");
    this.applyInventoryPose(false);
    this.bindOrbit();
  }

  get isActive(): boolean { return this.active; }

  setActive(active: boolean): void {
    if (this.active === active) return;
    this.active = active;
    if (active) {
      this.applyIdentityPresentation();
      this.resize();
      this.lastRenderMs = performance.now();
      this.engine.runRenderLoop(this.renderFrame);
    } else {
      this.engine.stopRenderLoop(this.renderFrame);
      this.endDrag();
    }
  }

  setMotionFrozen(frozen: boolean): void {
    this.motionFrozen = frozen;
  }

  /** Refresh height / silhouette from character profile. */
  applyIdentityPresentation(): void {
    this.visual.applyGender(CHARACTER_PROFILE.gender);
    // Slightly shorter framing vs world so helmets stay inside the preview frame.
    this.visual.setHeight(CHARACTER_PROFILE.presentationHeight(1.68));
  }

  syncEquipment(equipment: PlayerEquipment): void {
    this.apparel.syncFrom(equipment);
  }

  setHeldWeapon(tool: HeldWeaponVisualId | null): void {
    this.visual.setHeldWeapon(tool);
    this.applyInventoryPose(!!tool);
  }

  setEquippedBackpack(itemId: ItemId | null): void {
    this.backpackVisual.setEquippedItemId(itemId);
  }

  resize(): void {
    if (!this.canvas.clientWidth || !this.canvas.clientHeight) return;
    this.engine.resize();
  }

  dispose(): void {
    this.setActive(false);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
    this.scene.dispose();
    this.engine.dispose();
  }

  private bindOrbit(): void {
    this.canvas.style.touchAction = "none";
    this.canvas.style.cursor = "grab";
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
  }

  private readonly onPointerDown = (e: PointerEvent): void => {
    if (!this.active || e.button !== 0) return;
    this.dragPointerId = e.pointerId;
    this.dragLastX = e.clientX;
    this.userControlled = true;
    this.canvas.style.cursor = "grabbing";
    this.canvas.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (this.dragPointerId !== e.pointerId) return;
    const dx = e.clientX - this.dragLastX;
    this.dragLastX = e.clientX;
    this.yaw += dx * 0.01;
    this.visual.root.rotation.y = this.yaw;
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    if (this.dragPointerId !== e.pointerId) return;
    this.endDrag();
  };

  private endDrag(): void {
    this.dragPointerId = null;
    this.canvas.style.cursor = "grab";
  }

  private readonly renderFrame = (): void => {
    if (!this.active) return;
    const now = performance.now();
    const delta = this.motionFrozen ? 0 : Math.min(0.05, (now - this.lastRenderMs) / 1000);
    this.lastRenderMs = now;
    if (delta > 0) {
      this.idleTime += delta;
      if (!this.userControlled && this.dragPointerId === null) {
        const sway = Math.sin(this.idleTime * 0.55) * 0.08;
        this.visual.root.rotation.y = this.baseYaw + sway;
        this.yaw = this.visual.root.rotation.y;
      }
      this.visual.bodyPivot.position.y = Math.sin(this.idleTime * 1.1) * 0.006;
    }
    this.scene.render();
  };

  private applyInventoryPose(holdingTool: boolean): void {
    this.visual.leftLeg.rotation.set(0.04, 0, 0);
    this.visual.rightLeg.rotation.set(-0.02, 0, 0);
    this.visual.leftArm.rotation.set(0.1, 0, 0.1);
    if (holdingTool) {
      this.visual.rightArm.rotation.set(-0.35, 0.08, -0.18);
    } else {
      this.visual.rightArm.rotation.set(0.08, 0, -0.06);
    }
    this.visual.bodyPivot.rotation.set(0, 0, 0);
    this.visual.bodyPivot.position.y = 0;
  }
}
