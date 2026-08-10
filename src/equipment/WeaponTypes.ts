import type { ItemId } from "../items/ItemId";

/** Held mesh ids currently available in PlayerVisual tool set. */
export type HeldWeaponVisualId = "hatchet" | "pickaxe" | "spear";

const WEAPON_CAPABLE: ReadonlySet<ItemId> = new Set([
  "hatchet",
  "pickaxe",
  "spear",
  "wooden-club",
  "stone-knife",
  "metal-pipe",
  "crowbar",
  "improved-spear",
  "reinforced-hatchet",
  "advanced-hatchet",
  "reinforced-pickaxe",
  "advanced-pickaxe",
  "warden-maul",
  "survival-knife",
  "sledgehammer",
  "tactical-axe",
  "helix-edge",
  "service-pistol",
  "pump-scattergun",
  "hunting-carbine",
  "smg-kit",
  "stone-hatchet",
  "steel-hatchet",
  "stone-pickaxe",
  "steel-pickaxe",
  "pipe-club",
  "machete",
  "cleaver",
  "metal-hammer",
  "long-spear",
  "heavy-axe",
  "composite-axe",
  "hardened-machete",
  "tactical-spear",
  "industrial-hammer",
  "hunting-bow",
  "improvised-pistol",
  "heavy-pistol",
  "assault-rifle",
  "tactical-shotgun",
  "precision-rifle",
]);

export function isWeaponCapableItemId(itemId: ItemId): boolean {
  return WEAPON_CAPABLE.has(itemId);
}

/**
 * Map weapon items onto available held visuals.
 * New weapons reuse closest silhouette until dedicated meshes exist.
 */
export function toHeldWeaponVisualId(itemId: ItemId): HeldWeaponVisualId | null {
  if (
    itemId === "hatchet" || itemId === "reinforced-hatchet" || itemId === "advanced-hatchet"
    || itemId === "wooden-club" || itemId === "crowbar" || itemId === "metal-pipe" || itemId === "warden-maul"
    || itemId === "tactical-axe" || itemId === "sledgehammer" || itemId === "helix-edge"
    || itemId === "stone-hatchet" || itemId === "steel-hatchet" || itemId === "pipe-club"
    || itemId === "machete" || itemId === "cleaver" || itemId === "metal-hammer"
    || itemId === "heavy-axe" || itemId === "composite-axe" || itemId === "hardened-machete"
    || itemId === "industrial-hammer"
  ) return "hatchet";
  if (
    itemId === "pickaxe" || itemId === "reinforced-pickaxe" || itemId === "advanced-pickaxe"
    || itemId === "stone-knife" || itemId === "survival-knife"
    || itemId === "stone-pickaxe" || itemId === "steel-pickaxe"
  ) return "pickaxe";
  if (
    itemId === "spear" || itemId === "improved-spear"
    || itemId === "long-spear" || itemId === "tactical-spear"
  ) return "spear";
  // Firearms / bows show as clutched spear-like until dedicated meshes exist.
  if (
    itemId === "service-pistol" || itemId === "pump-scattergun"
    || itemId === "hunting-carbine" || itemId === "smg-kit" || itemId === "basic-pistol"
    || itemId === "improvised-pistol" || itemId === "heavy-pistol"
    || itemId === "assault-rifle" || itemId === "tactical-shotgun"
    || itemId === "precision-rifle" || itemId === "hunting-bow"
  ) return "spear";
  return null;
}
