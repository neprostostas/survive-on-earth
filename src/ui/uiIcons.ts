/** Menu / settings UI icons (plated Game Icons style). */
export type UiIconId =
  | "play" | "continue" | "newgame" | "settings" | "language" | "death" | "skull"
  | "heart" | "volume" | "graphics" | "a11y" | "quality" | "inventory" | "resume"
  | "home" | "globe" | "contrast" | "motion" | "shake" | "damage" | "text" | "scale"
  | "close" | "check" | "level" | "clock" | "map" | "fire" | "survivor";

export function uiIcon(id: UiIconId, className = "ui-icon-img"): string {
  return `<img class="${className}" src="/icons/ui/${id}.svg" alt="" width="28" height="28" draggable="false" />`;
}

export function menuBtnLabel(icon: UiIconId, label: string): string {
  return `<span class="menu-btn-inner">${uiIcon(icon, "ui-icon-img menu-btn-icon")}<span class="menu-btn-text">${label}</span></span>`;
}
