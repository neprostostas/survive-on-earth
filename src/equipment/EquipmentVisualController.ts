import type { Scene } from "@babylonjs/core/scene";
import type { PlayerVisual } from "../player/PlayerVisual";
import type { PlayerEquipment } from "./PlayerEquipment";
import type { PlayerBackpackSlot } from "./PlayerBackpackSlot";
import { EquipmentApparelVisuals } from "./EquipmentApparelVisuals";
import { BackpackEquipPresentation } from "./BackpackVisuals";

/**
 * World-player clothing + backpack projection.
 * Armor reads PlayerEquipment; backpack reads PlayerBackpackSlot. Never owns domain truth.
 */
export class EquipmentVisualController {
  readonly meshes: import("@babylonjs/core/Meshes/mesh").Mesh[];
  private readonly apparel: EquipmentApparelVisuals;
  private readonly backpack: BackpackEquipPresentation;
  private readonly equipment: PlayerEquipment;
  private readonly backpackSlot: PlayerBackpackSlot;

  constructor(scene: Scene, visual: PlayerVisual, equipment: PlayerEquipment, backpackSlot: PlayerBackpackSlot) {
    this.equipment = equipment;
    this.backpackSlot = backpackSlot;
    this.apparel = new EquipmentApparelVisuals(scene, visual, "WorldEq");
    this.backpack = new BackpackEquipPresentation(scene, visual.bodyPivot, "WorldPack");
    this.meshes = [...this.apparel.meshes];
    this.resync();
    equipment.subscribe((change) => { this.apparel.setSlotEnabled(change.slot, change.stack !== null); });
    backpackSlot.subscribe((_prev, stack) => {
      this.backpack.setEquippedItemId(stack?.itemId ?? null);
      this.meshes.length = 0;
      this.meshes.push(...this.apparel.meshes, ...this.backpack.meshes);
    });
  }

  /** Re-read equipment domain after save load. */
  resync(): void {
    this.apparel.syncFrom(this.equipment);
    this.backpack.setEquippedItemId(this.backpackSlot.current?.itemId ?? null);
    this.meshes.length = 0;
    this.meshes.push(...this.apparel.meshes, ...this.backpack.meshes);
  }
}
