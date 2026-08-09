import { GAME_CONFIG } from "./gameConfig";
import { isVisualQualityPreset, type VisualQualityPreset } from "./visualQualityConfig";

export interface CalibrationConfig {
  camera: {
    yawDeg: number;
    pitchDeg: number;
    orthoHeight: number;
    targetOffsetX: number;
    targetOffsetY: number;
    targetOffsetZ: number;
    followSharpness: number;
  };
  player: {
    visualHeight: number;
    collisionRadius: number;
    movementSpeed: number;
    acceleration: number;
    deceleration: number;
    rotationSpeed: number;
  };
  world: {
    treeScale: number;
    rockScale: number;
    wallHeight: number;
    gridCellSize: number;
  };
  lighting: {
    directionalRotationDeg: number;
    directionalIntensity: number;
    ambientIntensity: number;
    shadowSoftness: number;
  };
  interaction: {
    range: number;
    targetSwitchBias: number;
    facingTieDistance: number;
    indicatorFadeSpeed: number;
  };
  harvesting: {
    hatchetSwingDuration: number;
    hatchetImpactTiming: number;
    pickaxeSwingDuration: number;
    pickaxeImpactTiming: number;
    movementCancelThreshold: number;
    hitReactionStrength: number;
    particleIntensity: number;
  };
  visual: {
    qualityPreset: VisualQualityPreset;
    groundDetail: number;
    dirtIntensity: number;
    clutterDensity: number;
    foliageSway: number;
    contactShadowIntensity: number;
    postProcessIntensity: number;
  };
}

export const DEFAULT_CALIBRATION: CalibrationConfig = {
  camera: {
    yawDeg: 45,
    pitchDeg: 56,
    orthoHeight: 7.6,
    targetOffsetX: 0.2,
    targetOffsetY: 0.9,
    targetOffsetZ: 0.2,
    followSharpness: 10,
  },
  player: {
    visualHeight: 1.8,
    collisionRadius: 0.38,
    movementSpeed: 4.5,
    acceleration: 22,
    deceleration: 28,
    rotationSpeed: 12,
  },
  world: {
    treeScale: 1,
    rockScale: 1,
    wallHeight: 2.4,
    gridCellSize: 2.5,
  },
  lighting: {
    directionalRotationDeg: 132,
    directionalIntensity: 1.05,
    ambientIntensity: 0.72,
    shadowSoftness: 2,
  },
  interaction: {
    range: 1.55,
    targetSwitchBias: 0.2,
    facingTieDistance: 0.08,
    indicatorFadeSpeed: 10,
  },
  harvesting: {
    hatchetSwingDuration: 1.1,
    hatchetImpactTiming: 0.5,
    pickaxeSwingDuration: 0.98,
    pickaxeImpactTiming: 0.49,
    movementCancelThreshold: 0.18,
    hitReactionStrength: 0.55,
    particleIntensity: 0.65,
  },
  visual: {
    qualityPreset: "high",
    groundDetail: 1,
    dirtIntensity: 0.78,
    clutterDensity: 0.72,
    foliageSway: 0.12,
    contactShadowIntensity: 0.32,
    postProcessIntensity: 0.16,
  },
};

export function cloneCalibration(source = DEFAULT_CALIBRATION): CalibrationConfig {
  return JSON.parse(JSON.stringify(source)) as CalibrationConfig;
}

export function loadCalibration(storage: Storage): CalibrationConfig {
  try {
    const currentRaw = storage.getItem(GAME_CONFIG.localStorageKey);
    const raw = currentRaw ?? GAME_CONFIG.legacyCalibrationKeys.map((key) => storage.getItem(key)).find((value) => value !== null) ?? null;
    if (!raw) return cloneCalibration();
    const loaded = JSON.parse(raw) as Partial<CalibrationConfig>;
    const loadedVisual = loaded.visual;
    const loadedCamera = { ...loaded.camera };
    const loadedVisualValues = { ...loadedVisual };
    // Migrate only untouched V4 visual baselines. Explicit user calibration is
    // preserved while the old zoomed-out prototype framing receives F1 values.
    if (!currentRaw && loadedCamera.orthoHeight === 17.5) {
      loadedCamera.orthoHeight = DEFAULT_CALIBRATION.camera.orthoHeight;
      if (loadedCamera.targetOffsetX === 0) loadedCamera.targetOffsetX = DEFAULT_CALIBRATION.camera.targetOffsetX;
      if (loadedCamera.targetOffsetZ === 0) loadedCamera.targetOffsetZ = DEFAULT_CALIBRATION.camera.targetOffsetZ;
    }
    if (!currentRaw && loadedVisualValues.clutterDensity === 0.9) loadedVisualValues.clutterDensity = DEFAULT_CALIBRATION.visual.clutterDensity;
    return {
      camera: { ...DEFAULT_CALIBRATION.camera, ...loadedCamera },
      player: { ...DEFAULT_CALIBRATION.player, ...loaded.player },
      world: { ...DEFAULT_CALIBRATION.world, ...loaded.world },
      lighting: { ...DEFAULT_CALIBRATION.lighting, ...loaded.lighting },
      interaction: { ...DEFAULT_CALIBRATION.interaction, ...loaded.interaction },
      harvesting: { ...DEFAULT_CALIBRATION.harvesting, ...loaded.harvesting },
      visual: {
        ...DEFAULT_CALIBRATION.visual,
        ...loadedVisualValues,
        qualityPreset: isVisualQualityPreset(loadedVisual?.qualityPreset)
          ? loadedVisual.qualityPreset
          : DEFAULT_CALIBRATION.visual.qualityPreset,
      },
    };
  } catch {
    return cloneCalibration();
  }
}
