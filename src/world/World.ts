import type { Scene } from "@babylonjs/core/scene";
import type { CalibrationConfig } from "../config/calibrationConfig";
import type { CollisionWorld } from "../collision/CollisionWorld";
import { TestLocation } from "./TestLocation";
import type { Interactable } from "../interaction/Interactable";
import type { HarvestableResource } from "../harvesting/HarvestableResource";
import type { MinimapMarker } from "../ui/minimapTypes";
import type { LocationId } from "../locations/LocationRegistry";
import type { LocationVisualTheme } from "../locations/LocationVisualTheme";

export class World {
  private readonly location: TestLocation;
  constructor(scene: Scene, collision: CollisionWorld, config: CalibrationConfig) {
    this.location = new TestLocation(scene, collision, config);
  }
  get interactables(): readonly Interactable[] { return this.location.interactables; }
  get harvestables(): readonly HarvestableResource[] { return this.location.harvestables; }
  get clutterCount(): number { return this.location.clutterCount; }
  collectMinimapMarkers(): readonly MinimapMarker[] { return this.location.collectMinimapMarkers(); }
  addInteractable(interactable: Interactable): void { this.location.interactables.push(interactable); }
  removeInteractable(interactable: Interactable): void {
    const index = this.location.interactables.indexOf(interactable);
    if (index >= 0) this.location.interactables.splice(index, 1);
  }
  update(delta: number): void { this.location.update(delta); }
  applyCalibration(): void { this.location.applyCalibration(); }
  removeResourceCollision(resourceId: string): void { this.location.removeResourceCollision(resourceId); }

  /** Load location-specific visual theme into the shared plane. */
  applyLocationVisual(locationId: LocationId): LocationVisualTheme {
    return this.location.applyLocationVisual(locationId);
  }
}
