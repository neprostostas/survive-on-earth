import type { Scene } from "@babylonjs/core/scene";
import type { CalibrationConfig } from "../config/calibrationConfig";
import type { CollisionWorld } from "../collision/CollisionWorld";
import type { Lighting } from "../rendering/Lighting";
import { TestLocation } from "./TestLocation";
import type { Interactable } from "../interaction/Interactable";

export class World {
  private readonly location: TestLocation;
  constructor(scene: Scene, collision: CollisionWorld, lighting: Lighting, config: CalibrationConfig) {
    this.location = new TestLocation(scene, collision, lighting, config);
  }
  get interactables(): readonly Interactable[] { return this.location.interactables; }
  get clutterCount(): number { return this.location.clutterCount; }
  update(delta: number): void { this.location.update(delta); }
  applyCalibration(): void { this.location.applyCalibration(); }
}
