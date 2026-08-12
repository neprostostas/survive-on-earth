import type { BuildingRegistry, BuildPieceDef } from "../building/BuildingRegistry";
import type { BuildTab } from "../building/buildConfig";
import type { PlayerInventory } from "../inventory/PlayerInventory";
import { ITEM_REGISTRY } from "../items/ItemSystem";
import { ITEM_ICONS } from "./itemIcons";
import { menuBtnLabel, uiIcon } from "./uiIcons";
import { I18N } from "../i18n/I18n";
import { buildingTitle } from "../i18n/contentApi";

/**
 * LDOE Base Builder chrome: Build / Furniture tabs, piece grid, cost, rotate, demolish, exit.
 */
export class BuildModePanel {
  private readonly overlay: HTMLElement;
  private openState = false;
  private inventory: PlayerInventory | null = null;

  constructor(
    root: HTMLElement,
    private readonly building: BuildingRegistry,
    private readonly onPlace: () => void,
    private readonly onExit: () => void,
    private readonly onChanged: () => void,
  ) {
    this.overlay = document.createElement("section");
    this.overlay.className = "build-mode-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    root.append(this.overlay);
    this.overlay.addEventListener("click", (e) => {
      const t = e.target as HTMLElement;
      if (t.closest("[data-role=exit]")) {
        this.onExit();
        return;
      }
      if (t.closest("[data-role=place]")) {
        this.onPlace();
        return;
      }
      if (t.closest("[data-role=rotate]")) {
        this.building.rotate();
        this.onChanged();
        this.render();
        return;
      }
      if (t.closest("[data-role=demolish]")) {
        this.building.setDemolishMode(!this.building.isDemolishMode);
        this.onChanged();
        this.render();
        return;
      }
      if (t.closest("[data-role=repair]")) {
        this.building.setRepairMode(!this.building.isRepairMode);
        this.onChanged();
        this.render();
        return;
      }
      const tab = t.closest<HTMLElement>("[data-tab]");
      if (tab?.dataset.tab) {
        this.building.setTab(tab.dataset.tab as BuildTab);
        this.onChanged();
        this.render();
        return;
      }
      const piece = t.closest<HTMLElement>("[data-piece]");
      if (piece?.dataset.piece) {
        this.building.select(piece.dataset.piece);
        this.onChanged();
        this.render();
      }
    });
    I18N.onChange(() => {
      if (this.openState) this.render();
    });
  }

  get isOpen(): boolean { return this.openState; }

  open(inventory: PlayerInventory): void {
    this.inventory = inventory;
    this.openState = true;
    this.overlay.classList.add("open");
    this.overlay.setAttribute("aria-hidden", "false");
    this.render();
  }

  close(): void {
    this.openState = false;
    this.overlay.classList.remove("open");
    this.overlay.setAttribute("aria-hidden", "true");
  }

  refresh(inventory: PlayerInventory): void {
    this.inventory = inventory;
    if (this.openState) this.render();
  }

  private render(): void {
    if (!this.inventory) return;
    const inv = this.inventory;
    const tab = this.building.tab;
    const pieces = this.building.piecesInTab(tab);
    const selected = this.building.getSelectedDef();
    const costs = this.building.costOwnedSummary(inv);
    const afford = selected ? this.building.canAfford(inv) : false;
    const demolish = this.building.isDemolishMode;
    const repair = this.building.isRepairMode;

    this.overlay.innerHTML = `
      <div class="build-mode-panel" role="dialog" aria-label="${I18N.t("build.title")}">
        <header class="build-mode-header">
          <div class="build-mode-title">
            ${uiIcon("home", "ui-icon-img build-mode-title-icon")}
            <div>
              <small>HOME BASE</small>
              <h2>${I18N.t("build.title").toUpperCase()}</h2>
            </div>
          </div>
          <button type="button" class="menu-btn ghost" data-role="exit">${menuBtnLabel("close", I18N.t("build.close"))}</button>
        </header>
        <nav class="build-mode-tabs" role="tablist">
          <button type="button" class="build-tab ${tab === "build" ? "active" : ""}" data-tab="build" role="tab">${I18N.t("build.structures")}</button>
          <button type="button" class="build-tab ${tab === "furniture" ? "active" : ""}" data-tab="furniture" role="tab">${I18N.t("build.furniture")}</button>
        </nav>
        <div class="build-mode-grid" role="listbox" aria-label="Build pieces">
          ${pieces.map((p) => this.cellHtml(p, inv)).join("")}
        </div>
        <div class="build-mode-detail">
          ${demolish ? `
            <div class="build-mode-selected">
              <b>${I18N.t("build.remove").toUpperCase()}</b>
              <span>${I18N.t("build.hintRemove")}</span>
            </div>` : repair ? `
            <div class="build-mode-selected">
              <b>${I18N.t("build.repair").toUpperCase()}</b>
              <span>${I18N.t("build.hintRepair")}</span>
            </div>` : selected ? `
            <div class="build-mode-selected">
              <b>${escapeHtml(buildingTitle(selected.id, selected.title))}</b>
              <div class="build-mode-costs">
                ${costs.map((c) => {
                  const def = ITEM_REGISTRY.get(c.itemId);
                  const ok = c.have >= c.need;
                  return `<span class="build-cost ${ok ? "ok" : "missing"}">
                    <span class="build-cost-icon">${ITEM_ICONS[def.iconId]}</span>
                    ${c.have}/${c.need}
                  </span>`;
                }).join("")}
              </div>
            </div>` : `<div class="build-mode-selected"><b>Select a blueprint</b></div>`}
          <div class="build-mode-actions">
            <button type="button" class="menu-btn ghost ${demolish ? "active" : ""}" data-role="demolish">${I18N.t("build.remove")}</button>
            <button type="button" class="menu-btn ghost ${repair ? "active" : ""}" data-role="repair">${I18N.t("build.repair")}</button>
            <button type="button" class="menu-btn secondary" data-role="rotate">ROTATE R</button>
            <button type="button" class="menu-btn primary" data-role="place" ${!demolish && !repair && (!selected || !afford) ? "disabled" : ""}>
              ${demolish ? I18N.t("build.remove") : repair ? I18N.t("build.repair") : I18N.t("build.place")}
            </button>
          </div>
        </div>
        <p class="build-mode-hint">${I18N.t("build.hint")}</p>
      </div>`;
  }

  private cellHtml(p: BuildPieceDef, inv: PlayerInventory): string {
    const selected = this.building.selected === p.id && !this.building.isDemolishMode && !this.building.isRepairMode;
    const afford = this.building.canAfford(inv, p.id);
    const iconItem = p.cost[0] ? ITEM_REGISTRY.get(p.cost[0].itemId) : null;
    const icon = iconItem ? ITEM_ICONS[iconItem.iconId] : "";
    return `
      <button type="button" class="build-cell ${selected ? "selected" : ""} ${afford ? "affordable" : "blocked"}"
        data-piece="${p.id}" role="option" aria-selected="${selected}" title="${escapeHtml(buildingTitle(p.id, p.title))}">
        <span class="build-cell-icon">${icon}</span>
        <span class="build-cell-name">${escapeHtml(shortName(buildingTitle(p.id, p.title)))}</span>
      </button>`;
  }
}

function shortName(title: string): string {
  return title.replace(/^Wood |^Reinforced |^Stone |^Metal /i, "").slice(0, 12);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
