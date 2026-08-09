export const EQUIPMENT_SLOT_IDS = Object.freeze(["head", "torso", "legs", "feet"] as const);

export type EquipmentSlotId = typeof EQUIPMENT_SLOT_IDS[number];

export interface EquipmentMetadata {
  readonly slot: EquipmentSlotId;
  readonly armor: number;
}
