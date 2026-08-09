export const GAME_CONFIG = {
  worldSize: 56,
  maxDeltaSeconds: 1 / 20,
  cameraDistance: 32,
  joystickDeadZone: 0.12,
  localStorageKey: "survive-on-earth.calibration.v7",
  legacyCalibrationKeys: ["survive-on-earth.calibration.v6", "survive-on-earth.calibration.v5", "survive-on-earth.calibration.v4", "survive-on-earth.calibration.v3", "survive-on-earth.calibration.v2", "survive-on-earth.calibration.v1"],
} as const;
