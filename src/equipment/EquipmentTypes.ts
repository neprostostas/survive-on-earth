export const EQUIPMENT_SLOT_IDS = Object.freeze(["head", "torso", "legs", "feet"] as const);

export type EquipmentSlotId = typeof EQUIPMENT_SLOT_IDS[number];

export interface EquipmentMetadata {
  readonly slot: EquipmentSlotId;
  readonly armor: number;
  /** 0..1 warmth contribution against cold. */
  readonly warmth?: number;
  /** 0..1 gas/toxin resistance. */
  readonly gasResistance?: number;
}
