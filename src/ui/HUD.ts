import { applyHudLayoutTokens } from "../config/hudLayoutConfig";
import { Minimap } from "./Minimap";
import type { MinimapFrame } from "./minimapTypes";
import type { HarvestTool } from "../harvesting/HarvestingTypes";
import type { ItemDefinition } from "../items/ItemDefinition";
import type { ItemId } from "../items/ItemId";
import { ITEM_ICONS } from "./itemIcons";
import { ITEM_REGISTRY } from "../items/ItemSystem";
import { hudIconImg } from "./hudIcons";

export type PrimaryActionContext = "none" | "generic" | "pickup" | HarvestTool;

const PRIMARY_ICONS: Record<Exclude<PrimaryActionContext, "none">, string> = {
  generic: hudIconImg("interact"),
  pickup: hudIconImg("interact"),
  hatchet: hudIconImg("hatchet"),
  pickaxe: hudIconImg("pickaxe"),
  hand: hudIconImg("interact"),
};

const ATTACK_ICON = hudIconImg("attack");
const BUILD_ICON = hudIconImg("build");
const SNEAK_ICON = hudIconImg("sneak");
const BACKPACK_ICON = hudIconImg("inventory");
const BLUEPRINT_ICON = hudIconImg("blueprints");
const MAP_ICON = hudIconImg("map");
const QUICK1_EMPTY = hudIconImg("quick1", "hud-icon-img quick-slot-icon");
const QUICK2_EMPTY = hudIconImg("quick2", "hud-icon-img quick-slot-icon");

function keysBadge(keys: readonly string[]): string {
  return `<span class="action-keys" aria-hidden="true">${keys.map((key) => `<kbd>${key}</kbd>`).join("")}</span>`;
}

function withKeys(iconHtml: string, keys: readonly string[]): string {
  return `${iconHtml}${keysBadge(keys)}`;
}

export class HUD {
  readonly root: HTMLElement;
  readonly joystick: HTMLElement;
  readonly primaryAction: HTMLButtonElement;
  readonly attackAction: HTMLButtonElement;
  readonly inventoryToggle: HTMLButtonElement;
  readonly craftingToggle: HTMLButtonElement;
  readonly quickSlotButton: HTMLButtonElement;
  readonly quickSlot2Button: HTMLButtonElement;
  readonly sneakButton: HTMLButtonElement;
  readonly buildButton: HTMLButtonElement;
  readonly mapButton: HTMLButtonElement;
  private readonly minimap: Minimap;
  private readonly minimapShell: HTMLElement;
  private readonly playerNameEl: HTMLElement;
  private readonly healthFill: HTMLElement;
  private readonly healthTrack: HTMLElement;
  private readonly healthValue: HTMLElement;
  private readonly hungerFill: HTMLElement;
  private readonly thirstFill: HTMLElement;
  private readonly energyFill: HTMLElement;
  private readonly levelLabel: HTMLElement;
  private readonly levelFill: HTMLElement;
  private readonly defeatedFeedback: HTMLElement;
  private primaryContext: PrimaryActionContext = "none";
  private pickupContextKey = "";
  private attackWeaponKey = "fists";
  private attackWeaponDisplayName = "Fists";

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <div class="hud" aria-label="Gameplay HUD">
        <section class="player-status">
          <div class="status-copy">
            <div class="player-status-row">
              <span class="player-name">Survivor</span>
              <span class="hp-value">100</span>
            </div>
            <div class="hp-track" role="progressbar" aria-label="Player health" aria-live="polite" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">
              <div class="hp-fill"></div>
            </div>
            <div class="need-row" aria-label="Survival needs">
              <div class="need-line">
                <img class="need-icon" src="/icons/hud/hunger.svg" alt="" width="18" height="18" draggable="false" title="Hunger" />
                <div class="need-track hunger-track" title="Hunger"><i class="need-fill hunger-fill"></i></div>
              </div>
              <div class="need-line">
                <img class="need-icon" src="/icons/hud/thirst.svg" alt="" width="18" height="18" draggable="false" title="Thirst" />
                <div class="need-track thirst-track" title="Thirst"><i class="need-fill thirst-fill"></i></div>
              </div>
              <div class="need-line">
                <img class="need-icon" src="/icons/hud/energy.svg" alt="" width="18" height="18" draggable="false" title="Energy" />
                <div class="need-track energy-track" title="Energy"><i class="need-fill energy-fill"></i></div>
              </div>
            </div>
          </div>
        </section>

        <div class="joystick" aria-label="Movement joystick">
          <div class="joystick-pad" aria-hidden="true"></div>
          <div class="joystick-arrows" aria-hidden="true">
            <i class="joy-arrow joy-up"></i>
            <i class="joy-arrow joy-right"></i>
            <i class="joy-arrow joy-down"></i>
            <i class="joy-arrow joy-left"></i>
          </div>
          <div class="joystick-knob" aria-hidden="true">
            <i class="joystick-knob-ring"></i>
          </div>
        </div>

        <button class="hud-shell auto-control" type="button" aria-label="Automatic collection unavailable" disabled>
          ${hudIconImg("interact", "hud-icon-img auto-icon")}
          <span class="auto-label">AUTO</span>
        </button>

        <div class="top-right-cluster">
          <button type="button" class="minimap-shell" aria-label="Open location map">
            <canvas class="minimap-canvas" aria-hidden="true"></canvas>
          </button>
          <button class="hud-shell settings-shell" type="button" aria-label="Pause menu">
            <svg class="hud-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="2.8"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>

        <div class="actions" aria-label="Action controls">
          <button class="action shell quick-action quick-action-1" type="button" aria-label="Quick slot 1" title="Quick slot 1">
            ${withKeys(QUICK1_EMPTY, ["1"])}
          </button>
          <button class="action shell quick-action quick-action-2 locked" type="button" aria-label="Quick slot 2" title="Quick slot 2" disabled>
            ${withKeys(QUICK2_EMPTY, ["2"])}
          </button>
          <button class="action shell map-action" type="button" aria-label="World Map" title="Map (M)">
            ${withKeys(MAP_ICON, ["M"])}
          </button>
          <button class="action attack-action" type="button" aria-label="Attack" aria-disabled="true" title="Attack (F / E / Space)">
            ${withKeys(ATTACK_ICON, ["F", "E", "SPC"])}
          </button>
          <button class="action primary" type="button" aria-label="Primary action" title="Interact (E / Space)">
            ${withKeys(PRIMARY_ICONS.generic, ["E", "SPC"])}
          </button>
          <button class="action shell sneak-action" type="button" aria-label="Sneak" title="Sneak (C)">
            ${withKeys(SNEAK_ICON, ["C"])}
          </button>
          <button class="action shell build-action" type="button" aria-label="Build mode" title="Build (G)">
            ${withKeys(BUILD_ICON, ["G"])}
          </button>
        </div>

        <nav class="utility-strip" aria-label="Utility controls">
          <button class="utility-btn crafting-toggle" type="button" aria-label="Open blueprints (B)" aria-expanded="false" title="Blueprints (B)">
            ${BLUEPRINT_ICON}
            <span class="utility-key">B</span>
          </button>
          <button class="utility-btn inventory-toggle" type="button" aria-label="Open inventory (I)" aria-expanded="false" title="Inventory (I)">
            ${BACKPACK_ICON}
            <span class="utility-key">I</span>
          </button>
        </nav>

        <footer class="level-strip" aria-label="Player level">
          <span class="level-label">lvl. 1</span>
          <div class="level-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" aria-label="Experience (visual placeholder)">
            <i class="level-fill" style="width:100%"></i>
          </div>
        </footer>

        <div class="player-defeated-feedback" role="status" aria-live="assertive">PLAYER DEFEATED</div>
      </div>`;

    const hud = root.querySelector<HTMLElement>(".hud");
    if (!hud) throw new Error("HUD failed to mount");
    this.root = hud;
    applyHudLayoutTokens(hud);

    const joystick = root.querySelector<HTMLElement>(".joystick");
    if (!joystick) throw new Error("HUD joystick failed to mount");
    this.joystick = joystick;

    const primaryAction = root.querySelector<HTMLButtonElement>(".action.primary");
    if (!primaryAction) throw new Error("HUD primary action failed to mount");
    this.primaryAction = primaryAction;

    const attackAction = root.querySelector<HTMLButtonElement>(".attack-action");
    if (!attackAction) throw new Error("HUD attack control failed to mount");
    this.attackAction = attackAction;

    const inventoryToggle = root.querySelector<HTMLButtonElement>(".inventory-toggle");
    if (!inventoryToggle) throw new Error("HUD inventory control failed to mount");
    this.inventoryToggle = inventoryToggle;

    const craftingToggle = root.querySelector<HTMLButtonElement>(".crafting-toggle");
    if (!craftingToggle) throw new Error("HUD crafting control failed to mount");
    this.craftingToggle = craftingToggle;

    const minimapCanvas = root.querySelector<HTMLCanvasElement>(".minimap-canvas");
    const minimapShell = root.querySelector<HTMLElement>(".minimap-shell");
    if (!minimapCanvas || !minimapShell) throw new Error("HUD minimap failed to mount");
    this.minimap = new Minimap(minimapCanvas);
    this.minimapShell = minimapShell;

    const playerNameEl = root.querySelector<HTMLElement>(".player-name");
    const healthFill = root.querySelector<HTMLElement>(".hp-fill");
    const healthTrack = root.querySelector<HTMLElement>(".hp-track");
    const healthValue = root.querySelector<HTMLElement>(".hp-value");
    const hungerFill = root.querySelector<HTMLElement>(".hunger-fill");
    const thirstFill = root.querySelector<HTMLElement>(".thirst-fill");
    const energyFill = root.querySelector<HTMLElement>(".energy-fill");
    const levelLabel = root.querySelector<HTMLElement>(".level-label");
    const levelFill = root.querySelector<HTMLElement>(".level-fill");
    const defeatedFeedback = root.querySelector<HTMLElement>(".player-defeated-feedback");
    const quickSlotButton = root.querySelector<HTMLButtonElement>(".quick-action-1");
    const quickSlot2Button = root.querySelector<HTMLButtonElement>(".quick-action-2");
    const sneakButton = root.querySelector<HTMLButtonElement>(".sneak-action");
    const buildButton = root.querySelector<HTMLButtonElement>(".build-action");
    const mapButton = root.querySelector<HTMLButtonElement>(".map-action");
    if (!playerNameEl || !healthFill || !healthTrack || !healthValue || !hungerFill || !thirstFill || !energyFill
      || !levelLabel || !levelFill || !defeatedFeedback || !quickSlotButton || !quickSlot2Button
      || !sneakButton || !buildButton || !mapButton) {
      throw new Error("HUD elements failed to mount");
    }
    this.playerNameEl = playerNameEl;
    this.healthFill = healthFill;
    this.healthTrack = healthTrack;
    this.healthValue = healthValue;
    this.hungerFill = hungerFill;
    this.thirstFill = thirstFill;
    this.energyFill = energyFill;
    this.levelLabel = levelLabel;
    this.levelFill = levelFill;
    this.defeatedFeedback = defeatedFeedback;
    this.quickSlotButton = quickSlotButton;
    this.quickSlot2Button = quickSlot2Button;
    this.sneakButton = sneakButton;
    this.buildButton = buildButton;
    this.mapButton = mapButton;
  }

  get minimapElement(): HTMLElement { return this.minimapShell; }

  setPlayerName(name: string): void {
    this.playerNameEl.textContent = name;
  }

  onMinimapClick(handler: () => void): void {
    this.minimapShell.addEventListener("click", (e) => {
      e.preventDefault();
      handler();
    });
  }

  setPlayerHealth(current: number, max: number): void {
    const ratio = max > 0 ? current / max : 0;
    this.healthFill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
    this.healthTrack.setAttribute("aria-valuenow", String(Math.round(current)));
    this.healthTrack.setAttribute("aria-valuemax", String(Math.round(max)));
    this.healthValue.textContent = String(Math.round(current));
  }

  setDefeated(defeated: boolean): void {
    this.defeatedFeedback.classList.toggle("visible", defeated);
    this.inventoryToggle.disabled = defeated;
    this.craftingToggle.disabled = defeated;
    this.primaryAction.disabled = defeated;
    this.attackAction.disabled = defeated;
    this.quickSlotButton.disabled = defeated;
    this.sneakButton.disabled = defeated;
    this.buildButton.disabled = defeated;
    this.mapButton.disabled = defeated;
  }

  setNeeds(hungerRatio: number, thirstRatio: number, energyRatio: number): void {
    this.hungerFill.style.width = `${clamp01(hungerRatio) * 100}%`;
    this.thirstFill.style.width = `${clamp01(thirstRatio) * 100}%`;
    this.energyFill.style.width = `${clamp01(energyRatio) * 100}%`;
  }

  setLevel(level: number, xpRatio: number): void {
    this.levelLabel.textContent = `lvl. ${level}`;
    this.levelFill.style.width = `${clamp01(xpRatio) * 100}%`;
  }

  setSneakActive(active: boolean): void {
    this.sneakButton.classList.toggle("active", active);
  }

  setBuildActive(active: boolean): void {
    this.buildButton.classList.toggle("active", active);
    this.buildButton.setAttribute("aria-pressed", String(active));
  }

  setQuickSlot(itemId: ItemId | null, quantity: number): void {
    if (!itemId) {
      this.quickSlotButton.innerHTML = withKeys(QUICK1_EMPTY, ["1"]);
      this.quickSlotButton.classList.remove("occupied");
      return;
    }
    const def = ITEM_REGISTRY.get(itemId);
    this.quickSlotButton.innerHTML = withKeys(
      `<span class="quick-item-icon">${ITEM_ICONS[def.iconId]}</span><small class="quick-qty">${quantity}</small>`,
      ["1"],
    );
    this.quickSlotButton.classList.add("occupied");
  }

  updateMinimap(frame: MinimapFrame): void {
    this.minimap.update(frame);
  }

  setPrimaryActionAvailable(available: boolean): void {
    this.primaryAction.classList.toggle("available", available);
    this.primaryAction.setAttribute("aria-label", available ? "Interact with selected target" : "No interaction target nearby");
    this.primaryAction.setAttribute("aria-disabled", String(!available));
  }

  setAttackState(hasTarget: boolean, inRange: boolean, recovering: boolean): void {
    const available = hasTarget && inRange && !recovering;
    this.attackAction.classList.toggle("available", hasTarget && inRange);
    this.attackAction.classList.toggle("recovering", recovering);
    this.attackAction.classList.toggle("out-of-range", hasTarget && !inRange);
    this.attackAction.setAttribute("aria-disabled", String(!available));
    const verb = this.attackWeaponKey === "fists" ? "Punch" : `Attack with ${this.attackWeaponDisplayName}`;
    this.attackAction.setAttribute(
      "aria-label",
      !hasTarget ? "No combat target nearby" : !inRange ? "Combat target out of range" : recovering ? "Attack recovering" : verb,
    );
  }

  setAttackWeapon(itemId: ItemId | null): void {
    const key = itemId ?? "fists";
    if (key === this.attackWeaponKey) return;
    this.attackWeaponKey = key;
    if (key === "fists") {
      this.attackWeaponDisplayName = "Fists";
      this.attackAction.innerHTML = withKeys(ATTACK_ICON, ["F", "E", "SPC"]);
      this.attackAction.classList.remove("has-weapon");
      return;
    }
    const definition = ITEM_REGISTRY.get(key);
    this.attackWeaponDisplayName = definition.displayName;
    this.attackAction.innerHTML = withKeys(`<span class="attack-weapon-icon">${ITEM_ICONS[definition.iconId]}</span>`, ["F", "E", "SPC"]);
    this.attackAction.classList.add("has-weapon");
  }

  setPrimaryActionContext(context: PrimaryActionContext, toolAvailable = true, unavailableFeedback = 0): void {
    const available = context !== "none";
    this.setPrimaryActionAvailable(available);
    if (context !== this.primaryContext) {
      this.primaryContext = context;
      this.pickupContextKey = "";
      this.primaryAction.innerHTML = withKeys(PRIMARY_ICONS[context === "none" ? "generic" : context], ["E", "SPC"]);
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
      this.primaryAction.innerHTML = withKeys(
        `<span class="pickup-action-icon">${ITEM_ICONS[definition.iconId]}</span><span class="pickup-action-copy"><b>${definition.displayName}</b><small>×${quantity}</small></span>`,
        ["E", "SPC"],
      );
    }
    this.primaryAction.classList.remove("missing-tool", "unavailable-flash");
    this.primaryAction.dataset.hint = "";
    this.primaryAction.setAttribute("aria-label", `Pick up ${definition.displayName}, quantity ${quantity}`);
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
