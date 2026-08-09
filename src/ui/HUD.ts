import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Interactable } from "../interaction/Interactable";
import { applyHudLayoutTokens } from "../config/hudLayoutConfig";
import { Minimap } from "./Minimap";
import type { HarvestTool } from "../harvesting/HarvestingTypes";
import type { ItemDefinition } from "../items/ItemDefinition";
import { ITEM_ICONS } from "./itemIcons";

export type PrimaryActionContext = "none" | "generic" | "pickup" | HarvestTool;

const PRIMARY_ICONS: Record<Exclude<PrimaryActionContext, "none">, string> = {
  generic: `<svg class="hud-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.7 12.3V8a1.6 1.6 0 0 1 3.2 0v3-5.2a1.6 1.6 0 0 1 3.2 0V11 7a1.6 1.6 0 0 1 3.2 0v5.3-2.4a1.6 1.6 0 0 1 3.2 0v4.2c0 4.3-2.8 6.9-6.8 6.9h-.9c-2.6 0-4.3-1.2-5.7-3.2l-2.6-3.9a1.7 1.7 0 0 1 2.7-2l1.5 1.8"/></svg>`,
  pickup: `<svg class="hud-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M5 18.5h14"/></svg>`,
  hatchet: `<svg class="hud-icon tool-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 21 15.2 8.3"/><path d="m11.8 5.7 2.1-2.8 7.2 4.2-1.7 3.1-4.2-1.9z"/><path d="m6.9 18.7 2.4 1.4"/></svg>`,
  pickaxe: `<svg class="hud-icon tool-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21 14.6 7.2"/><path d="M3.3 8.5c4-3.8 10.4-5 17.4-1.5M14.6 7.2l4.8 4.1"/></svg>`,
};

export class HUD {
  readonly joystick: HTMLElement;
  readonly primaryAction: HTMLButtonElement;
  readonly inventoryToggle: HTMLButtonElement;
  readonly craftingToggle: HTMLButtonElement;
  private readonly minimap: Minimap;
  private primaryContext: PrimaryActionContext = "none";
  private pickupContextKey = "";

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <div class="hud" aria-label="Gameplay HUD">
        <section class="player-status">
          <div class="status-copy">
            <span class="player-name">SURVIVOR <b>LV. 1</b></span>
            <div class="hp-track"><div class="hp-fill"></div><span>100</span></div>
          </div>
        </section>
        <div class="joystick" aria-label="Movement joystick"><div class="joystick-ring"></div><div class="joystick-knob"></div></div>
        <button class="hud-shell auto-control" type="button" aria-label="Automatic collection unavailable" disabled>
          <svg class="hud-icon auto-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.7 8.1A7.5 7.5 0 1 0 19 15"/><path d="m18.7 3.8.1 4.5-4.5.1"/></svg>
          <span class="auto-label">AUTO</span>
        </button>
        <div class="top-right-cluster">
          <button class="hud-shell social-shell" type="button" aria-label="Social unavailable" disabled>
            <svg class="hud-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="2.7"/><path d="M3.8 18c.4-3.2 2.1-4.8 5.2-4.8s4.8 1.6 5.2 4.8"/><circle cx="17" cy="9" r="2.1"/><path d="M15.4 13.7c2.9-.8 4.7.6 5 3.4"/></svg>
          </button>
          <button class="hud-shell settings-shell" type="button" aria-label="Settings unavailable" disabled>
            <svg class="hud-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/></svg>
          </button>
          <div class="minimap-shell" aria-label="Local minimap"><canvas class="minimap-canvas"></canvas><i class="minimap-north">N</i></div>
        </div>
        <div class="actions" aria-label="Action controls">
          <button class="action shell build-action" type="button" aria-label="Building unavailable" disabled><svg class="hud-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 20 9.2-9.2M11.7 5.8l2.7-2.7 6.5 6.5-2.7 2.7z"/><path d="m3.5 18.4 2.1 2.1"/></svg></button>
          <button class="action shell quick-action" type="button" aria-label="Quick slot unavailable" disabled><svg class="hud-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7.5h10a2 2 0 0 1 2 2V20H5V9.5a2 2 0 0 1 2-2Z"/><path d="M9 7.5V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8v1.7M8.2 12h7.6M8.2 15.5h7.6"/></svg></button>
          <button class="action shell attack-action" type="button" aria-label="Attack unavailable" disabled><svg class="hud-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 11.8V7.2a1.7 1.7 0 0 1 3.4 0v3.2-5a1.7 1.7 0 0 1 3.4 0v5-4a1.7 1.7 0 0 1 3.4 0v5.3-2.6a1.7 1.7 0 0 1 3.4 0v5.2c0 4.1-2.8 6.7-6.8 6.7h-1.5c-2.2 0-3.8-.8-5.2-2.4l-3.7-4.4a1.8 1.8 0 0 1 2.6-2.5l2.1 1.8"/></svg></button>
          <button class="action primary" type="button" aria-label="Primary action"><svg class="hud-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.7 12.3V8a1.6 1.6 0 0 1 3.2 0v3-5.2a1.6 1.6 0 0 1 3.2 0V11 7a1.6 1.6 0 0 1 3.2 0v5.3-2.4a1.6 1.6 0 0 1 3.2 0v4.2c0 4.3-2.8 6.9-6.8 6.9h-.9c-2.6 0-4.3-1.2-5.7-3.2l-2.6-3.9a1.7 1.7 0 0 1 2.7-2l1.5 1.8"/></svg></button>
          <button class="action shell sneak-action" type="button" aria-label="Sneak unavailable" disabled><svg class="hud-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="14.8" cy="4.5" r="2.2"/><path d="m13.7 8-3.1 3.8-4.2.5M10.7 11.8l4 2.1 3.4 4M14.7 13.9l-2.1 5.6M7.8 18.8H4"/></svg></button>
        </div>
        <nav class="utility-strip" aria-label="Utility controls">
          <button disabled aria-label="Chat unavailable">C</button><button disabled aria-label="Season unavailable">S</button>
          <button disabled aria-label="Events unavailable">!</button><button class="inventory-toggle" type="button" aria-label="Open inventory" aria-expanded="false">I</button>
          <button class="crafting-toggle" type="button" aria-label="Open blueprints" aria-expanded="false">B</button>
        </nav>
      </div>`;
    const hud = root.querySelector<HTMLElement>(".hud");
    if (!hud) throw new Error("HUD failed to mount");
    applyHudLayoutTokens(hud);
    const joystick = root.querySelector<HTMLElement>(".joystick");
    if (!joystick) throw new Error("HUD joystick failed to mount");
    const primaryAction = root.querySelector<HTMLButtonElement>(".action.primary");
    if (!primaryAction) throw new Error("HUD primary action failed to mount");
    this.joystick = joystick;
    this.primaryAction = primaryAction;
    const inventoryToggle = root.querySelector<HTMLButtonElement>(".inventory-toggle");
    if (!inventoryToggle) throw new Error("HUD inventory control failed to mount");
    this.inventoryToggle = inventoryToggle;
    const craftingToggle = root.querySelector<HTMLButtonElement>(".crafting-toggle");
    if (!craftingToggle) throw new Error("HUD blueprints control failed to mount");
    this.craftingToggle = craftingToggle;
    const minimapCanvas = root.querySelector<HTMLCanvasElement>(".minimap-canvas");
    if (!minimapCanvas) throw new Error("HUD minimap failed to mount");
    this.minimap = new Minimap(minimapCanvas);
  }

  updateMinimap(player: Readonly<Vector3>, facingYaw: number, interactables: readonly Interactable[]): void {
    this.minimap.update(player, facingYaw, interactables);
  }

  setPrimaryActionAvailable(available: boolean): void {
    this.primaryAction.classList.toggle("available", available);
    this.primaryAction.setAttribute("aria-label", available ? "Interact with selected target" : "No interaction target nearby");
    this.primaryAction.setAttribute("aria-disabled", String(!available));
  }

  setPrimaryActionContext(context: PrimaryActionContext, toolAvailable = true, unavailableFeedback = 0): void {
    const available = context !== "none";
    this.setPrimaryActionAvailable(available);
    if (context !== this.primaryContext) {
      this.primaryContext = context;
      this.pickupContextKey = "";
      this.primaryAction.innerHTML = PRIMARY_ICONS[context === "none" ? "generic" : context];
    }
    const isTool = context === "hatchet" || context === "pickaxe";
    this.primaryAction.classList.toggle("missing-tool", isTool && !toolAvailable);
    this.primaryAction.classList.toggle("unavailable-flash", unavailableFeedback > 0.05);
    const label = context === "hatchet" ? "Hatchet" : context === "pickaxe" ? "Pickaxe" : "Interact";
    this.primaryAction.dataset.hint = isTool && !toolAvailable ? `${label} required` : "";
    this.primaryAction.setAttribute("aria-label", available ? (isTool && !toolAvailable ? `${label} required` : `${label} action`) : "No interaction target nearby");
  }

  setGroundLootActionContext(definition: ItemDefinition, quantity: number): void {
    this.setPrimaryActionAvailable(true);
    const contextKey = `${definition.id}:${quantity}`;
    if (this.primaryContext !== "pickup" || this.pickupContextKey !== contextKey) {
      this.primaryContext = "pickup";
      this.pickupContextKey = contextKey;
      this.primaryAction.innerHTML = `<span class="pickup-action-icon">${ITEM_ICONS[definition.iconId]}</span><span class="pickup-action-copy"><b>${definition.displayName}</b><small>×${quantity}</small></span>`;
    }
    this.primaryAction.classList.remove("missing-tool", "unavailable-flash");
    this.primaryAction.dataset.hint = "";
    this.primaryAction.setAttribute("aria-label", `Pick up ${definition.displayName}, quantity ${quantity}`);
  }
}
