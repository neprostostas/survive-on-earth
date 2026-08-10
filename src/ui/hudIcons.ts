/**
 * HUD action button icons — same plated Game Icons style as item icons
 * (circular plate for round buttons). Files under public/icons/hud/
 */
export type HudIconId =
  | "sneak"
  | "blueprints"
  | "inventory"
  | "interact"
  | "hatchet"
  | "pickaxe"
  | "build"
  | "quick1"
  | "quick2"
  | "map"
  | "attack"
  | "hunger"
  | "thirst"
  | "energy"
  | "profile";

export function hudIconImg(id: HudIconId, className = "hud-icon-img"): string {
  return `<img class="${className}" src="/icons/hud/${id}.svg" alt="" width="40" height="40" draggable="false" />`;
}
