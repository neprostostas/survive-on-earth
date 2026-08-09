import type { ItemId } from "../items/ItemId";

/** Active weapon loadout — separate from armor PlayerEquipment. */
export type WeaponCapableItemId = Extract<ItemId, "hatchet" | "pickaxe">;

export function isWeaponCapableItemId(id: ItemId): id is WeaponCapableItemId {
  return id === "hatchet" || id === "pickaxe";
}
