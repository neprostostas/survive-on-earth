import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import type { CalibrationConfig } from "../config/calibrationConfig";
import { GAME_CONFIG } from "../config/gameConfig";
import { getVisualQualitySettings } from "../config/visualQualityConfig";
import type { LocationVisualTheme } from "../locations/LocationVisualTheme";

/**
 * Fixed orthographic shadow span for the full playable plane.
 * Auto-extend from the initial casters (spawn only) clips shadows a few meters away;
 * a stable world-sized frustum keeps character shadows valid everywhere without per-frame shimmer.
 */
const SHADOW_FRUSTUM_SIZE = GAME_CONFIG.worldSize * 1.4;
const SHADOW_MIN_Z = 1;
const SHADOW_MAX_Z = 120;
const SHADOW_LIGHT_DISTANCE = 55;

export class Lighting {
  readonly shadows: ShadowGenerator;
  private readonly ambient: HemisphericLight;
  private readonly sun: DirectionalLight;
  private locationTheme: LocationVisualTheme | null = null;

  constructor(scene: Scene, private readonly config: CalibrationConfig) {
    this.ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
    this.ambient.diffuse = new Color3(0.94, 0.97, 0.88);
    this.ambient.groundColor = new Color3(0.38, 0.42, 0.32);
    this.sun = new DirectionalLight("sun", new Vector3(-0.5, -1, -0.5), scene);
    this.sun.diffuse = new Color3(1, 0.94, 0.8);
    this.sun.specular = new Color3(0.14, 0.13, 0.1);
    this.sun.autoUpdateExtends = false;
    this.sun.autoCalcShadowZBounds = false;
    this.sun.shadowFrustumSize = SHADOW_FRUSTUM_SIZE;
    this.sun.shadowMinZ = SHADOW_MIN_Z;
    this.sun.shadowMaxZ = SHADOW_MAX_Z;
    this.shadows = new ShadowGenerator(2048, this.sun);
    this.shadows.usePercentageCloserFiltering = true;
    this.shadows.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
    this.shadows.bias = 0.0012;
    this.shadows.normalBias = 0.018;
    this.applyCalibration();
  }

  addCaster(mesh: AbstractMesh): void { this.shadows.addShadowCaster(mesh); }

  applyLocationTheme(theme: LocationVisualTheme): void {
    this.locationTheme = theme;
    this.ambient.diffuse = theme.ambient;
    this.ambient.groundColor = theme.ambientGround;
    this.sun.diffuse = theme.sun;
    this.applyCalibration();
  }

  applyCalibration(): void {
    const angle = this.config.lighting.directionalRotationDeg * Math.PI / 180;
    this.sun.direction.set(Math.sin(angle) * 0.72, -1, Math.cos(angle) * 0.72).normalize();
    this.sun.position.set(
      -this.sun.direction.x * SHADOW_LIGHT_DISTANCE,
      -this.sun.direction.y * SHADOW_LIGHT_DISTANCE,
      -this.sun.direction.z * SHADOW_LIGHT_DISTANCE,
    );
    const themeMulSun = this.locationTheme?.sunIntensity ?? 1;
    const themeMulAmb = this.locationTheme?.ambientIntensity ?? 1;
    this.sun.intensity = this.config.lighting.directionalIntensity * 0.9 * themeMulSun;
    this.ambient.intensity = Math.min(1.2, (this.config.lighting.ambientIntensity + 0.2) * themeMulAmb);
    const requestedSoftness = this.config.lighting.shadowSoftness;
    const presetQuality = getVisualQualitySettings(this.config.visual.qualityPreset).shadowQuality;
    const calibratedQuality = requestedSoftness < 1.5 ? 0 : requestedSoftness < 2.5 ? 1 : 2;
    const quality = Math.min(presetQuality, calibratedQuality);
    this.shadows.filteringQuality = quality === 0 ? ShadowGenerator.QUALITY_LOW : quality === 1 ? ShadowGenerator.QUALITY_MEDIUM : ShadowGenerator.QUALITY_HIGH;
    this.shadows.setDarkness(this.locationTheme?.biome === "underground" || this.locationTheme?.biome === "bunker" ? 0.28 : 0.12);
  }
}
