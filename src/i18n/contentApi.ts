import type { ItemId } from "../items/ItemId";
import type { ItemDefinition } from "../items/ItemDefinition";
import { ITEM_REGISTRY } from "../items/ItemSystem";
import { getLocation, type LocationId } from "../locations/LocationRegistry";
import { I18N } from "./I18n";

/** Localized item display name. EN registry is authoring fallback only. */
export function itemName(idOrDef: ItemId | string | ItemDefinition): string {
  const id = typeof idOrDef === "string" ? idOrDef : idOrDef.id;
  let fallback = id;
  try {
    fallback = typeof idOrDef === "object" && "displayName" in idOrDef
      ? idOrDef.displayName
      : ITEM_REGISTRY.get(id).displayName;
  } catch { /* keep id */ }
  return I18N.tx(`item.${id}.name`, fallback);
}

export function itemDesc(idOrDef: ItemId | string | ItemDefinition): string {
  const id = typeof idOrDef === "string" ? idOrDef : idOrDef.id;
  let fallback = "";
  try {
    fallback = typeof idOrDef === "object" && "description" in idOrDef
      ? (idOrDef.description ?? "")
      : (ITEM_REGISTRY.get(id).description ?? "");
  } catch { /* empty */ }
  if (!fallback && !I18N.hasContentKey(`item.${id}.desc`)) return "";
  return I18N.tx(`item.${id}.desc`, fallback);
}

export function locationTitle(id: LocationId | string): string {
  let fallback = String(id);
  try {
    fallback = getLocation(id as LocationId).title;
  } catch { /* keep id */ }
  return I18N.tx(`loc.${id}.title`, fallback);
}

export function locationDesc(id: LocationId | string): string {
  let fallback = "";
  try {
    fallback = getLocation(id as LocationId).description ?? "";
  } catch { /* empty */ }
  return I18N.tx(`loc.${id}.desc`, fallback || String(id));
}

export function achievementTitle(id: string, fallback: string): string {
  return I18N.tx(`ach.${id}.title`, fallback);
}

export function achievementDesc(id: string, fallback: string): string {
  return I18N.tx(`ach.${id}.desc`, fallback);
}

export function questTitle(id: string, fallback: string): string {
  return I18N.tx(`quest.${id}.title`, fallback);
}

export function questDesc(id: string, fallback: string): string {
  return I18N.tx(`quest.${id}.desc`, fallback);
}

export function buildingTitle(id: string, fallback: string): string {
  return I18N.tx(`build.${id}.title`, fallback);
}
