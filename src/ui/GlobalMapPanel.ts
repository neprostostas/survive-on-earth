import { I18N } from "../i18n/I18n";
import { locationDesc, locationTitle } from "../i18n/contentApi";
import { LOCATION_REGISTRY, getLocation, type LocationId } from "../locations/LocationRegistry";
import type { LocationManager, TravelMode } from "../locations/LocationManager";
import type { EnergyPool } from "../survival/NeedPool";
import {
  mapPinFor,
  primaryMapLocations,
  OVERWORLD_ENTER_RADIUS,
  OVERWORLD_WALK_SPEED,
  OVERWORLD_RUN_SPEED,
  OVERWORLD_ENERGY_WALK,
  OVERWORLD_ENERGY_RUN,
} from "../locations/MapLayout";
import type { ActiveWorldEvent } from "../world/WorldEventDirector";
import type { RaidSite } from "../raids/RaidSystem";
import { raidMapPins } from "../raids/RaidAnchors";
import { eventMapPins } from "../world/EventAnchors";
import type { StoryActDef } from "../quests/StoryActs";
import type { Vector2 } from "@babylonjs/core/Maths/math.vector";

export interface MapIntelProviders {
  events?: () => readonly ActiveWorldEvent[];
  raids?: () => readonly RaidSite[];
  act?: () => StoryActDef | null;
  power?: () => { production: number; consumption: number; storage: number } | null;
}

export type ExitEdge = "n" | "s" | "e" | "w";

/**
 * LDOE-style exploratory world map:
 * walk off a location edge → traverse pins → press Enter near a site.
 */
export class GlobalMapPanel {
  private readonly overlay: HTMLElement;
  private readonly playerEl: HTMLElement;
  private readonly enterBtn: HTMLButtonElement;
  private readonly infoEl: HTMLElement;
  private readonly energyEl: HTMLElement;
  private readonly hintEl: HTMLElement;
  private openState = false;
  private leftInTransit = false;
  private playerX = 0.42;
  private playerY = 0.55;
  private nearest: LocationId | null = null;
  private intel: MapIntelProviders = {};
  private readonly keys = new Set<string>();

  constructor(
    root: HTMLElement,
    private readonly locations: LocationManager,
    private readonly energy: EnergyPool,
    private readonly onEnterLocation: (id: LocationId) => void,
    private readonly onVisibility: (open: boolean, inTransit: boolean) => void,
  ) {
    this.overlay = document.createElement("section");
    this.overlay.className = "overworld-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.innerHTML = `
      <div class="overworld-frame" role="application" aria-label="${I18N.t("map.title")}">
        <header class="overworld-header">
          <div>
            <small class="overworld-kicker">${I18N.t("map.title")}</small>
            <h2>TRAVEL</h2>
          </div>
          <div class="overworld-energy" aria-live="polite"><span data-role="energy-label">ENERGY</span> <b data-role="energy">100</b></div>
          <div class="overworld-modes" data-role="modes">
            <button type="button" data-mode="walk" class="map-mode active">${I18N.t("map.walk")}</button>
            <button type="button" data-mode="run" class="map-mode">${I18N.t("map.run")}</button>
            <button type="button" data-mode="vehicle" class="map-mode">${I18N.t("map.vehicle")}</button>
          </div>
          <button type="button" class="overworld-close" data-role="close" aria-label="${I18N.t("map.close")}">×</button>
        </header>
        <div class="overworld-intel" data-role="intel"></div>
        <div class="overworld-stage" data-role="stage">
          <div class="overworld-terrain" aria-hidden="true"></div>
          <div class="overworld-haze" aria-hidden="true"></div>
          <div class="overworld-nodes" data-role="nodes"></div>
          <div class="overworld-player" data-role="player" aria-hidden="true">
            <i class="overworld-player-ring"></i>
            <i class="overworld-player-dot"></i>
          </div>
        </div>
        <footer class="overworld-footer">
          <div class="overworld-hint" data-role="hint">Walk to a location. Press ENTER when close.</div>
          <div class="overworld-info" data-role="info">—</div>
          <button type="button" class="menu-btn primary overworld-enter" data-role="enter" disabled>ENTER LOCATION</button>
        </footer>
      </div>`;
    root.append(this.overlay);
    this.playerEl = this.overlay.querySelector("[data-role=player]") as HTMLElement;
    this.enterBtn = this.overlay.querySelector("[data-role=enter]") as HTMLButtonElement;
    this.infoEl = this.overlay.querySelector("[data-role=info]") as HTMLElement;
    this.energyEl = this.overlay.querySelector("[data-role=energy]") as HTMLElement;
    this.hintEl = this.overlay.querySelector("[data-role=hint]") as HTMLElement;

    this.overlay.querySelector("[data-role=close]")?.addEventListener("click", () => this.close());
    this.enterBtn.addEventListener("click", () => this.tryEnterNearest());
    this.overlay.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode as TravelMode;
        this.locations.setTravelMode(mode);
        this.refreshModes();
      });
    });

    window.addEventListener("keydown", this.onKeyDown, true);
    window.addEventListener("keyup", this.onKeyUp, true);
    this.applyMapLocale();
    I18N.onChange(() => {
      this.applyMapLocale();
      if (this.openState) this.refresh();
    });
  }

  private applyMapLocale(): void {
    const t = (k: Parameters<typeof I18N.t>[0]) => I18N.t(k);
    const frame = this.overlay.querySelector(".overworld-frame");
    frame?.setAttribute("aria-label", t("map.title"));
    const kicker = this.overlay.querySelector(".overworld-kicker");
    if (kicker) kicker.textContent = t("map.title");
    const h2 = this.overlay.querySelector(".overworld-header h2");
    if (h2) h2.textContent = t("map.title").toUpperCase();
    const energyLabel = this.overlay.querySelector("[data-role=energy-label]");
    if (energyLabel) energyLabel.textContent = t("hud.energy").toUpperCase();
    for (const btn of this.overlay.querySelectorAll<HTMLButtonElement>("[data-mode]")) {
      const mode = btn.dataset.mode;
      if (mode === "walk") btn.textContent = t("map.walk");
      else if (mode === "run") btn.textContent = t("map.run");
      else if (mode === "vehicle") btn.textContent = t("map.vehicle");
    }
    this.overlay.querySelector("[data-role=close]")?.setAttribute("aria-label", t("map.close"));
    this.hintEl.textContent = t("map.hint");
    if (!this.nearest) this.enterBtn.textContent = t("map.enter");
    else this.refreshEnterState();
  }

  setIntelProviders(providers: MapIntelProviders): void {
    this.intel = providers;
  }

  get isOpen(): boolean { return this.openState; }
  get isInTransit(): boolean { return this.leftInTransit; }

  toggle = (): void => {
    if (this.openState) this.close();
    else this.openFromLocation(this.locations.currentId);
  };

  open = (): void => { this.openFromLocation(this.locations.currentId); };

  /**
   * Browse map without leaving the 3D location (M key).
   */
  openFromLocation(id: LocationId): void {
    this.leftInTransit = false;
    const pin = mapPinFor(id);
    this.playerX = pin.x;
    this.playerY = pin.y;
    this.setOpen(true);
  }

  /**
   * Walked off the 3D map edge — physically left the location on the overworld.
   */
  openFromEdge(id: LocationId, edge: ExitEdge): void {
    this.leftInTransit = true;
    const pin = mapPinFor(id);
    const push = 0.028;
    if (edge === "n") { this.playerX = pin.x; this.playerY = Math.max(0.04, pin.y - push); }
    else if (edge === "s") { this.playerX = pin.x; this.playerY = Math.min(0.96, pin.y + push); }
    else if (edge === "e") { this.playerX = Math.min(0.96, pin.x + push); this.playerY = pin.y; }
    else { this.playerX = Math.max(0.04, pin.x - push); this.playerY = pin.y; }
    this.setOpen(true);
    this.hintEl.textContent = "You left the zone. Walk toward a location marker and press ENTER.";
  }

  close = (): void => {
    // If we left a location for the map, stay in transit only until enter —
    // closing without enter snaps back to that site (safe cancel).
    if (this.leftInTransit) {
      this.leftInTransit = false;
    }
    this.setOpen(false);
  };

  /**
   * Drive map movement from gameplay movement vector (−1..1).
   * Returns true when overworld handled the frame.
   */
  tick(dt: number, movement: Vector2): boolean {
    if (!this.openState || dt <= 0) return false;

    let mx = movement.x;
    let my = -movement.y; // screen Y grows downward; Babylon forward is +screen-up-ish — invert
    // keyboard WASD via keys as fallback when input not suppressed
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) mx -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) mx += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) my -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) my += 1;
    const len = Math.hypot(mx, my);
    if (len > 1e-4) {
      mx /= Math.max(1, len);
      my /= Math.max(1, len);
      const mode = this.locations.mode;
      const speed = mode === "run" ? OVERWORLD_RUN_SPEED : mode === "vehicle" ? OVERWORLD_RUN_SPEED * 1.35 : OVERWORLD_WALK_SPEED;
      const drain = mode === "run" ? OVERWORLD_ENERGY_RUN : mode === "vehicle" ? OVERWORLD_ENERGY_WALK * 0.35 : OVERWORLD_ENERGY_WALK;
      if (this.energy.value <= 0.05 && mode !== "vehicle") {
        // exhausted: very slow crawl homeward only
        this.playerX = clamp01(this.playerX + mx * speed * 0.25 * dt);
        this.playerY = clamp01(this.playerY + my * speed * 0.25 * dt);
      } else {
        this.energy.drain(drain * dt);
        this.playerX = clamp01(this.playerX + mx * speed * dt);
        this.playerY = clamp01(this.playerY + my * speed * dt);
      }
    }

    this.updateNearest();
    this.paintPlayer();
    this.energyEl.textContent = String(Math.floor(this.energy.value));
    this.refreshEnterState();
    return true;
  }

  tryEnterNearest(): boolean {
    if (!this.nearest) return false;
    const check = this.locations.canEnterFromMap(this.nearest);
    if (!check.ok) {
      this.infoEl.textContent = check.reason ?? "Cannot enter";
      return false;
    }
    this.leftInTransit = false;
    this.onEnterLocation(this.nearest);
    this.setOpen(false);
    return true;
  }

  refresh(): void {
    this.renderNodes();
    this.renderIntel();
    this.paintPlayer();
    this.refreshModes();
    this.updateNearest();
    this.refreshEnterState();
    this.energyEl.textContent = String(Math.floor(this.energy.value));
  }

  private setOpen(open: boolean): void {
    if (this.openState === open) return;
    this.openState = open;
    this.overlay.classList.toggle("open", open);
    this.overlay.setAttribute("aria-hidden", String(!open));
    if (open) this.refresh();
    this.onVisibility(open, this.leftInTransit);
  }

  private refreshModes(): void {
    this.overlay.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === this.locations.mode);
      if (btn.dataset.mode === "vehicle") btn.disabled = !this.locations.hasVehicle;
    });
  }

  private renderIntel(): void {
    const el = this.overlay.querySelector("[data-role=intel]");
    if (!el) return;
    const parts: string[] = [];
    const act = this.intel.act?.();
    if (act) parts.push(`<span class="map-intel-act">${escapeHtml(act.title)}</span>`);
    const events = this.intel.events?.() ?? [];
    for (const e of events.slice(0, 2)) {
      if (e.claimed) continue;
      const pin = eventMapPins([e])[0];
      const where = pin ? locationTitle(pin.locationId) : "";
      parts.push(
        where
          ? `${I18N.t("map.event")}: ${escapeHtml(e.title)} · ${escapeHtml(where)}`
          : `${I18N.t("map.event")}: ${escapeHtml(e.title)}`,
      );
    }
    const raids = this.intel.raids?.() ?? [];
    for (const r of raids.slice(0, 3)) {
      if (!r.cleared) parts.push(`${I18N.t("map.raid")}: ${escapeHtml(r.title)} · T${r.threat}`);
    }
    el.innerHTML = parts.length
      ? parts.map((p) => `<div class="map-intel-row">${p}</div>`).join("")
      : `<div class="map-intel-row map-intel-empty">${I18N.t("map.intelEmpty")}</div>`;
  }

  private renderNodes(): void {
    const host = this.overlay.querySelector("[data-role=nodes]");
    if (!host) return;
    host.innerHTML = "";
    for (const pin of primaryMapLocations()) {
      const loc = getLocation(pin.id);
      const unlocked = this.locations.isUnlocked(pin.id);
      const state = this.locations.discoveryState(pin.id);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "overworld-node";
      btn.style.left = `${pin.x * 100}%`;
      btn.style.top = `${pin.y * 100}%`;
      btn.classList.toggle("home", pin.id === "home");
      btn.classList.toggle("current", pin.id === this.locations.currentId && !this.leftInTransit);
      btn.classList.toggle("locked", !unlocked);
      btn.classList.toggle("fog", state === "hidden");
      btn.classList.toggle("visited", state === "visited" || state === "completed");
      if (loc.regionId === "greyhaven") btn.classList.add("region-city");
      if (loc.regionId === "exclusion") btn.classList.add("region-hazard");
      const label = state === "hidden" && !unlocked ? "???" : locationTitle(loc.id);
      btn.innerHTML = `<span class="overworld-node-dot"></span><span class="overworld-node-label">${label}</span>`;
      btn.title = unlocked
        ? `${locationTitle(loc.id)} · D${loc.difficulty}`
        : `${locationTitle(loc.id)} (${I18N.t("map.locked")})`;
      btn.addEventListener("click", () => {
        // soft select / aim toward: snap gently
        if (!unlocked) {
          this.infoEl.textContent = `${locationTitle(loc.id)} — ${I18N.t("map.locked")}`;
          return;
        }
        this.playerX = pin.x;
        this.playerY = pin.y;
        this.updateNearest();
        this.paintPlayer();
        this.refreshEnterState();
      });
      host.append(btn);
    }
    // Open raid compound markers (linked to location pins).
    for (const raidPin of raidMapPins(this.intel.raids?.() ?? [])) {
      const locId = raidPin.locationId;
      const el = document.createElement("div");
      el.className = "overworld-raid-marker";
      el.style.left = `${raidPin.x * 100}%`;
      el.style.top = `${raidPin.y * 100}%`;
      el.title = `${I18N.t("map.raid")}: ${raidPin.title} (T${raidPin.threat})`;
      el.innerHTML = `<span class="overworld-raid-dot"></span><span class="overworld-raid-label">T${raidPin.threat}</span>`;
      el.addEventListener("click", () => {
        if (!this.locations.isUnlocked(locId)) {
          this.locations.unlock(locId);
        }
        this.playerX = raidPin.x;
        this.playerY = raidPin.y;
        this.updateNearest();
        this.paintPlayer();
        this.refreshEnterState();
        this.infoEl.textContent = `${I18N.t("map.raid")}: ${raidPin.title} · ${locationTitle(locId)}`;
      });
      host.append(el);
    }
    // Active world-event markers (anchor location + soft unlock on click).
    for (const evtPin of eventMapPins(this.intel.events?.() ?? [])) {
      const locId = evtPin.locationId;
      const el = document.createElement("div");
      el.className = "overworld-event-marker" + (evtPin.danger >= 4 ? " is-hot" : "");
      el.style.left = `${evtPin.x * 100}%`;
      el.style.top = `${evtPin.y * 100}%`;
      el.title = `${I18N.t("map.event")}: ${evtPin.title} (D${evtPin.danger})`;
      el.innerHTML = `<span class="overworld-event-dot"></span><span class="overworld-event-label">D${evtPin.danger}</span>`;
      el.addEventListener("click", () => {
        if (!this.locations.isUnlocked(locId)) {
          this.locations.unlock(locId);
        }
        this.playerX = evtPin.x;
        this.playerY = evtPin.y;
        this.updateNearest();
        this.paintPlayer();
        this.refreshEnterState();
        this.infoEl.textContent = `${I18N.t("map.event")}: ${evtPin.title} · ${locationTitle(locId)}`;
      });
      host.append(el);
    }
  }

  private paintPlayer(): void {
    this.playerEl.style.left = `${this.playerX * 100}%`;
    this.playerEl.style.top = `${this.playerY * 100}%`;
  }

  private updateNearest(): void {
    let best: LocationId | null = null;
    let bestD = OVERWORLD_ENTER_RADIUS;
    for (const pin of primaryMapLocations()) {
      if (!this.locations.isUnlocked(pin.id)) continue;
      const d = Math.hypot(pin.x - this.playerX, pin.y - this.playerY);
      if (d <= bestD) {
        bestD = d;
        best = pin.id;
      }
    }
    this.nearest = best;
  }

  private refreshEnterState(): void {
    if (!this.nearest) {
      this.enterBtn.disabled = true;
      this.enterBtn.textContent = I18N.t("map.enter");
      this.infoEl.textContent = this.leftInTransit
        ? I18N.t("map.hint")
        : I18N.t("map.hint");
      return;
    }
    const def = getLocation(this.nearest);
    const check = this.locations.canEnterFromMap(this.nearest);
    this.enterBtn.disabled = !check.ok;
    this.enterBtn.textContent = check.ok
      ? `${I18N.t("map.enter")} · ${locationTitle(def.id)}`
      : locationTitle(def.id);
    this.infoEl.textContent = check.ok
      ? `${locationTitle(def.id)} — ${locationDesc(def.id)}`
      : `${locationTitle(def.id)}: ${check.reason ?? I18N.t("map.locked")}`;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.openState) return;
    this.keys.add(e.code);
    if (e.code === "Enter" || e.code === "NumpadEnter" || e.code === "KeyE") {
      e.preventDefault();
      this.tryEnterNearest();
    }
    if (e.code === "Escape") {
      e.preventDefault();
      this.close();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };
}

function clamp01(v: number): number {
  return Math.max(0.02, Math.min(0.98, v));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// silence unused
void LOCATION_REGISTRY;
