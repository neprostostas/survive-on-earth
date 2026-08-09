export type VisualQualityPreset = "low" | "medium" | "high" | "ultra";

export interface VisualQualitySettings {
  detailMultiplier: number;
  shadowQuality: 0 | 1 | 2;
  postProcessMultiplier: number;
  fireComplexity: number;
}

const PRESETS: Record<VisualQualityPreset, VisualQualitySettings> = {
  low: { detailMultiplier: 0.35, shadowQuality: 0, postProcessMultiplier: 0.35, fireComplexity: 0.5 },
  medium: { detailMultiplier: 0.65, shadowQuality: 1, postProcessMultiplier: 0.7, fireComplexity: 0.75 },
  high: { detailMultiplier: 1, shadowQuality: 1, postProcessMultiplier: 1, fireComplexity: 1 },
  ultra: { detailMultiplier: 1.3, shadowQuality: 2, postProcessMultiplier: 1.15, fireComplexity: 1.2 },
};

export function getVisualQualitySettings(preset: VisualQualityPreset): VisualQualitySettings {
  return PRESETS[preset];
}

export function isVisualQualityPreset(value: unknown): value is VisualQualityPreset {
  return value === "low" || value === "medium" || value === "high" || value === "ultra";
}
