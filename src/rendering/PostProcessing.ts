import type { Scene } from "@babylonjs/core/scene";
import type { CalibrationConfig } from "../config/calibrationConfig";
import { getVisualQualitySettings } from "../config/visualQualityConfig";

export class PostProcessing {
  enabled = true;

  constructor(private readonly scene: Scene, private readonly config: CalibrationConfig) {
    this.applyCalibration();
  }

  applyCalibration(): void {
    const processing = this.scene.imageProcessingConfiguration;
    const quality = getVisualQualitySettings(this.config.visual.qualityPreset);
    const intensity = this.config.visual.postProcessIntensity * quality.postProcessMultiplier;
    processing.isEnabled = intensity > 0.001;
    processing.toneMappingEnabled = false;
    processing.exposure = 1.04;
    processing.contrast = 0.94 + intensity * 0.04;
    processing.vignetteEnabled = false;
    this.enabled = processing.isEnabled;
  }
}
