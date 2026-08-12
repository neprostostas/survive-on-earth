import type { PlayerInventory } from "../inventory/PlayerInventory";
import type { VehicleId, VehiclePart, VehicleSystem } from "../vehicle/VehicleSystem";
import { itemName } from "../i18n/contentApi";
import { I18N } from "../i18n/I18n";
import { ITEM_ICONS } from "./itemIcons";

const VEHICLE_TABS: readonly { id: VehicleId; labelKey: "vehicle.bike" | "vehicle.atv" }[] = Object.freeze([
  { id: "salvaged-bike", labelKey: "vehicle.bike" },
  { id: "trailrunner-atv", labelKey: "vehicle.atv" },
]);

const PART_LABEL_KEYS: Record<VehiclePart, Parameters<typeof I18N.t>[0]> = {
  frame: "vehicle.part.frame",
  wheels: "vehicle.part.wheels",
  engine: "vehicle.part.engine",
  "fuel-tank": "vehicle.part.fuelTank",
  mechanics: "vehicle.part.mechanics",
  electronics: "vehicle.part.electronics",
  suspension: "vehicle.part.suspension",
};

/**
 * Assembly-bench UI: install parts, set active vehicle, refuel.
 */
export class VehiclePanel {
  private readonly overlay: HTMLElement;
  private openState = false;
  private inventory: PlayerInventory | null = null;
  private selected: VehicleId = "salvaged-bike";

  constructor(
    root: HTMLElement,
    private readonly vehicles: VehicleSystem,
    private readonly onChanged: () => void,
    private readonly onVisibility?: (open: boolean) => void,
  ) {
    this.overlay = document.createElement("section");
    this.overlay.className = "station-overlay vehicle-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.innerHTML = `
      <div class="station-panel vehicle-panel" role="dialog" aria-modal="true" aria-labelledby="vehicle-title">
        <header class="station-header">
          <div>
            <small class="station-kicker" data-role="kicker">VEHICLE</small>
            <h2 id="vehicle-title">Assembly</h2>
          </div>
          <nav class="station-tabs" data-role="tabs"></nav>
          <button type="button" class="station-close" data-role="close" aria-label="Close">×</button>
        </header>
        <div class="station-body vehicle-body">
          <div class="station-list" data-role="list" role="listbox"></div>
          <aside class="station-side">
            <div class="vehicle-status" data-role="status"></div>
            <button type="button" class="menu-btn primary station-start" data-role="refuel">Refuel</button>
            <button type="button" class="menu-btn station-start" data-role="activate">Set active</button>
            <p class="station-hint" data-role="hint"></p>
          </aside>
        </div>
      </div>`;
    root.append(this.overlay);
    this.overlay.querySelector("[data-role=close]")?.addEventListener("click", () => this.close());
    this.overlay.querySelector("[data-role=refuel]")?.addEventListener("click", () => this.tryRefuel());
    this.overlay.querySelector("[data-role=activate]")?.addEventListener("click", () => this.tryActivate());
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });
    I18N.onChange(() => {
      if (this.openState) this.refresh();
    });
  }

  get isOpen(): boolean { return this.openState; }

  open(inventory: PlayerInventory): void {
    this.inventory = inventory;
    this.openState = true;
    this.overlay.classList.add("open");
    this.overlay.setAttribute("aria-hidden", "false");
    this.refresh();
    this.onVisibility?.(true);
  }

  close(): void {
    if (!this.openState) return;
    this.openState = false;
    this.overlay.classList.remove("open");
    this.overlay.setAttribute("aria-hidden", "true");
    this.inventory = null;
    this.onVisibility?.(false);
  }

  refresh(): void {
    if (!this.openState || !this.inventory) return;
    this.applyLocaleChrome();
    this.renderTabs();
    this.renderList();
    this.renderStatus();
  }

  private applyLocaleChrome(): void {
    const kicker = this.overlay.querySelector("[data-role=kicker]");
    if (kicker) kicker.textContent = I18N.t("vehicle.kicker");
    const title = this.overlay.querySelector("#vehicle-title");
    if (title) title.textContent = I18N.t("vehicle.title");
    const refuel = this.overlay.querySelector("[data-role=refuel]");
    if (refuel) refuel.textContent = I18N.t("vehicle.refuel");
    const activate = this.overlay.querySelector("[data-role=activate]");
    if (activate) activate.textContent = I18N.t("vehicle.setActive");
  }

  private renderTabs(): void {
    const tabs = this.overlay.querySelector("[data-role=tabs]");
    if (!tabs) return;
    tabs.replaceChildren();
    for (const tab of VEHICLE_TABS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "station-tab" + (this.selected === tab.id ? " active" : "");
      btn.textContent = I18N.t(tab.labelKey);
      btn.addEventListener("click", () => {
        this.selected = tab.id;
        this.refresh();
      });
      tabs.append(btn);
    }
  }

  private renderList(): void {
    const list = this.overlay.querySelector("[data-role=list]");
    if (!list || !this.inventory) return;
    const inv = this.inventory;
    const view = this.vehicles.view(this.selected, inv);
    list.replaceChildren();
    for (const row of view.parts) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "station-row";
      btn.classList.toggle("is-ready", row.canInstall);
      btn.classList.toggle("is-blocked", !row.installed && !row.canInstall);
      btn.classList.toggle("is-selected", row.installed);
      const partName = I18N.t(PART_LABEL_KEYS[row.part]);
      const matName = itemName(row.itemId);
      const state = row.installed
        ? I18N.t("vehicle.partInstalled")
        : row.canInstall
          ? I18N.t("vehicle.partInstall")
          : I18N.t("vehicle.partNeed", { name: matName });
      btn.innerHTML = `
        <span class="station-row-icon">${iconFor(row.itemId)}</span>
        <span class="station-row-copy">
          <b>${escapeHtml(partName)}</b>
          <small>${escapeHtml(matName)} ×1</small>
        </span>
        <span class="station-row-time">${escapeHtml(state)}</span>`;
      if (row.canInstall) {
        btn.addEventListener("click", () => {
          if (!this.inventory) return;
          const ok = this.vehicles.install(row.part, this.inventory, this.selected);
          if (ok) {
            this.onChanged();
            this.refresh();
          }
        });
      } else {
        btn.disabled = row.installed;
      }
      list.append(btn);
    }
  }

  private renderStatus(): void {
    const status = this.overlay.querySelector("[data-role=status]");
    const hint = this.overlay.querySelector("[data-role=hint]");
    if (!status || !this.inventory) return;
    const view = this.vehicles.view(this.selected, this.inventory);
    const pct = Math.round(view.progress * 100);
    const fuel = `${Math.floor(view.fuel)}/${Math.floor(view.fuelCapacity)}`;
    status.innerHTML = `
      <div class="station-queue-title">${escapeHtml(I18N.t(this.selected === "trailrunner-atv" ? "vehicle.atv" : "vehicle.bike"))}</div>
      <p class="station-hint">${escapeHtml(I18N.t("vehicle.progress", { pct: String(pct) }))}</p>
      <p class="station-hint">${escapeHtml(I18N.t("vehicle.fuel", { value: fuel }))}</p>
      <p class="station-hint">${escapeHtml(I18N.t("vehicle.condition", { pct: String(Math.floor(view.condition)) }))}</p>
      <p class="station-hint">${view.assembled
        ? (view.isActive ? escapeHtml(I18N.t("vehicle.activeNow")) : escapeHtml(I18N.t("vehicle.ready")))
        : escapeHtml(I18N.t("vehicle.incomplete"))}</p>`;
    if (hint) {
      hint.textContent = view.assembled
        ? I18N.t("vehicle.hintReady")
        : I18N.t("vehicle.hintParts");
    }
    const refuel = this.overlay.querySelector<HTMLButtonElement>("[data-role=refuel]");
    const activate = this.overlay.querySelector<HTMLButtonElement>("[data-role=activate]");
    if (refuel) refuel.disabled = !view.assembled || view.fuel >= view.fuelCapacity;
    if (activate) activate.disabled = !view.assembled || view.isActive;
  }

  private tryRefuel(): void {
    if (!this.inventory) return;
    const ok = this.vehicles.refuelVehicle(this.inventory, this.selected);
    if (!ok) {
      const hint = this.overlay.querySelector("[data-role=hint]");
      if (hint) hint.textContent = I18N.t("vehicle.needFuelCan");
      return;
    }
    this.onChanged();
    this.refresh();
  }

  private tryActivate(): void {
    if (!this.vehicles.setActive(this.selected)) return;
    this.onChanged();
    this.refresh();
  }
}

function iconFor(itemId: string): string {
  const src = ITEM_ICONS[itemId as keyof typeof ITEM_ICONS];
  if (src) return `<img src="${src}" alt="" />`;
  return `<span class="station-row-fallback">${escapeHtml(itemId.slice(0, 2).toUpperCase())}</span>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
