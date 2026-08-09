import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import type { CalibrationConfig } from "../config/calibrationConfig";
import { getVisualQualitySettings } from "../config/visualQualityConfig";

export class Lighting {
  readonly shadows: ShadowGenerator;
  private readonly ambient: HemisphericLight;
  private readonly sun: DirectionalLight;

  constructor(scene: Scene, private readonly config: CalibrationConfig) {
    this.ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
    this.ambient.diffuse = new Color3(0.92, 0.96, 0.86);
    this.ambient.groundColor = new Color3(0.42, 0.45, 0.34);
    this.sun = new DirectionalLight("sun", new Vector3(-0.5, -1, -0.5), scene);
    this.sun.position.set(18, 30, 18);
    this.sun.diffuse = new Color3(1, 0.95, 0.82);
    this.sun.specular = new Color3(0.18, 0.17, 0.13);
    // The player is a shadow caster. Re-fitting the directional-light frustum
    // every frame as the player moves shifts every shadow texel and makes the
    // whole scene shimmer. Babylon will calculate the bounds on the first
    // render, then keep that projection stable.
    this.sun.autoUpdateExtends = false;
    this.sun.autoCalcShadowZBounds = false;
    this.shadows = new ShadowGenerator(2048, this.sun);
    this.shadows.usePercentageCloserFiltering = true;
    this.shadows.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
    this.shadows.bias = 0.0012;
    this.shadows.normalBias = 0.018;
    this.applyCalibration();
  }

  addCaster(mesh: AbstractMesh): void { this.shadows.addShadowCaster(mesh); }

  applyCalibration(): void {
    const angle = this.config.lighting.directionalRotationDeg * Math.PI / 180;
    this.sun.direction.set(Math.sin(angle) * 0.72, -1, Math.cos(angle) * 0.72).normalize();
    this.sun.intensity = this.config.lighting.directionalIntensity * 0.86;
    this.ambient.intensity = Math.min(1, this.config.lighting.ambientIntensity + 0.16);
    const requestedSoftness = this.config.lighting.shadowSoftness;
    const presetQuality = getVisualQualitySettings(this.config.visual.qualityPreset).shadowQuality;
    const calibratedQuality = requestedSoftness < 1.5 ? 0 : requestedSoftness < 2.5 ? 1 : 2;
    const quality = Math.min(presetQuality, calibratedQuality);
    this.shadows.filteringQuality = quality === 0 ? ShadowGenerator.QUALITY_LOW : quality === 1 ? ShadowGenerator.QUALITY_MEDIUM : ShadowGenerator.QUALITY_HIGH;
    this.shadows.setDarkness(0.12);
  }
}
