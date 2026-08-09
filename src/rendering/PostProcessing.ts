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
    // Image processing was a soft, milky grade; keep it extremely light unless the player raises the slider.
    processing.isEnabled = intensity > 0.04;
    processing.toneMappingEnabled = false;
    processing.exposure = 1 + intensity * 0.08;
    processing.contrast = 1 + intensity * 0.1;
    processing.vignetteEnabled = false;
    this.enabled = processing.isEnabled;
  }
}
