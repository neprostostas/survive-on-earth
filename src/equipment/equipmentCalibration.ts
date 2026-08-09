import type { GroundLootSystem } from "../ground-loot/GroundLootSystem";
import type { ItemId } from "../items/ItemId";
import { createItemResult } from "../items/ItemSystem";

const CALIBRATION_ITEMS: readonly ItemId[] = Object.freeze(["dad-hat", "shirt", "cargo-pants", "sneakers"]);

export function spawnEquipmentCalibrationLoot(groundLoot: GroundLootSystem): void {
  CALIBRATION_ITEMS.forEach((itemId, index) => {
    groundLoot.materialize(
      createItemResult(`equipment-calibration:${itemId}`, itemId, 1),
      Object.freeze({ x: -3.35 + index * 1.05, y: 0, z: 3.05 }),
    );
  });
}
