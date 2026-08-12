import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import { itemName } from "../i18n/contentApi";
import { I18N } from "../i18n/I18n";
import type { WorkstationKind } from "./WorkstationQueue.ts";
import type { StationSystem } from "./StationSystem.ts";
import type { StationProcessDef } from "./StationRecipes.ts";
import { stationProcessInputs } from "./StationRecipes.ts";
import { ITEM_ICONS } from "../ui/itemIcons";

const STATION_TITLE: Record<WorkstationKind, string> = {
  campfire: "Campfire",
  woodworking: "Chopping Bench",
  furnace: "Furnace",
  metalwork: "Metalwork Bench",
  chemistry: "Chemistry Station",
  water: "Water Collector",
  composter: "Composter",
  recycler: "Recycler",
};

/**
 * Compact station UI: process list + live queue (LDOE-style timed craft).
 */
export class StationPanel {
  private readonly overlay: HTMLElement;
  private openState = false;
  private station: WorkstationKind = "campfire";
  private inventory: PlayerInventory | null = null;
  private selectedId: string | null = null;
  private furnaceUnlocked = false;
  private metalworkUnlocked = false;
  private chemistryUnlocked = false;
  private waterUnlocked = false;
  private composterUnlocked = false;
  private recyclerUnlocked = false;

  constructor(
    root: HTMLElement,
    private readonly stations: StationSystem,
    private readonly onStart: (processId: string, station: WorkstationKind) => { accepted: boolean; reason: string | null },
    private readonly onVisibility?: (open: boolean) => void,
  ) {
    this.overlay = document.createElement("section");
    this.overlay.className = "station-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.innerHTML = `
      <div class="station-panel" role="dialog" aria-modal="true" aria-labelledby="station-title">
        <header class="station-header">
          <div>
            <small class="station-kicker">STATION</small>
            <h2 id="station-title">Campfire</h2>
          </div>
          <nav class="station-tabs" data-role="tabs"></nav>
          <button type="button" class="station-close" data-role="close" aria-label="Close">×</button>
        </header>
        <div class="station-body">
          <div class="station-list" data-role="list" role="listbox"></div>
          <aside class="station-side">
            <div class="station-queue" data-role="queue"></div>
            <button type="button" class="menu-btn primary station-start" data-role="start" disabled>START</button>
            <p class="station-hint" data-role="hint">Select a process</p>
          </aside>
        </div>
      </div>`;
    root.append(this.overlay);
    this.overlay.querySelector("[data-role=close]")?.addEventListener("click", () => this.close());
    this.overlay.querySelector("[data-role=start]")?.addEventListener("click", () => this.tryStartSelected());
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });
  }

  get isOpen(): boolean { return this.openState; }
  get currentStation(): WorkstationKind { return this.station; }

  open(station: WorkstationKind, inventory: PlayerInventory, options?: {
    furnaceUnlocked?: boolean;
    metalworkUnlocked?: boolean;
    chemistryUnlocked?: boolean;
    waterUnlocked?: boolean;
    composterUnlocked?: boolean;
    recyclerUnlocked?: boolean;
  }): void {
    this.station = station;
    this.inventory = inventory;
    this.furnaceUnlocked = options?.furnaceUnlocked === true;
    this.metalworkUnlocked = options?.metalworkUnlocked === true;
    this.chemistryUnlocked = options?.chemistryUnlocked === true;
    this.waterUnlocked = options?.waterUnlocked === true;
    this.composterUnlocked = options?.composterUnlocked === true;
    this.recyclerUnlocked = options?.recyclerUnlocked === true;
    this.selectedId = null;
    this.openState = true;
    this.overlay.classList.add("open");
    this.overlay.setAttribute("aria-hidden", "false");
    this.renderTabs();
    const title = this.overlay.querySelector("#station-title");
    if (title) title.textContent = STATION_TITLE[station] ?? station;
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

  /** Call while open so queue progress stays live. */
  tick(): void {
    if (!this.openState) return;
    this.renderQueue();
  }

  refresh(): void {
    if (!this.openState || !this.inventory) return;
    this.renderTabs();
    this.renderList();
    this.renderQueue();
    this.renderStartState();
  }

  private renderTabs(): void {
    const tabs = this.overlay.querySelector("[data-role=tabs]");
    if (!tabs) return;
    tabs.replaceChildren();
    const defs: { kind: WorkstationKind; label: string; enabled: boolean; lockHint?: string }[] = [
      { kind: "campfire", label: "Cook", enabled: true },
      { kind: "woodworking", label: "Chop", enabled: true },
      { kind: "furnace", label: "Smelt", enabled: this.furnaceUnlocked, lockHint: "Build a furnace first" },
      { kind: "metalwork", label: "Metal", enabled: this.metalworkUnlocked, lockHint: "Build a metalwork bench first" },
      { kind: "chemistry", label: "Chem", enabled: this.chemistryUnlocked, lockHint: "Build a chemistry station first" },
      { kind: "water", label: "Water", enabled: this.waterUnlocked, lockHint: "Build a water collector first" },
      { kind: "composter", label: "Compost", enabled: this.composterUnlocked, lockHint: "Build a composter first" },
      { kind: "recycler", label: "Scrap", enabled: this.recyclerUnlocked, lockHint: "Build a recycler first" },
    ];
    for (const def of defs) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "station-tab" + (this.station === def.kind ? " active" : "");
      btn.textContent = def.label;
      btn.disabled = !def.enabled;
      btn.title = def.enabled ? def.label : (def.lockHint ?? def.label);
      if (def.enabled) {
        btn.addEventListener("click", () => {
          this.station = def.kind;
          this.selectedId = null;
          const title = this.overlay.querySelector("#station-title");
          if (title) title.textContent = STATION_TITLE[def.kind] ?? def.kind;
          this.refresh();
        });
      }
      tabs.append(btn);
    }
  }

  private tryStartSelected(): void {
    if (!this.selectedId) return;
    const result = this.onStart(this.selectedId, this.station);
    this.refresh();
    if (!result.accepted) {
      const hint = this.overlay.querySelector("[data-role=hint]");
      if (hint) hint.textContent = failMessage(result.reason);
    }
  }

  private renderList(): void {
    const list = this.overlay.querySelector("[data-role=list]");
    if (!list || !this.inventory) return;
    const inv = this.inventory;
    const processes = this.stations.processes(this.station);
    list.replaceChildren();
    for (const process of processes) {
      const check = this.stations.canStart(process.id, this.station, inv);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "station-row";
      btn.setAttribute("role", "option");
      btn.classList.toggle("is-selected", this.selectedId === process.id);
      btn.classList.toggle("is-ready", check.ok);
      btn.classList.toggle("is-blocked", !check.ok);
      btn.innerHTML = `
        <span class="station-row-icon">${iconFor(process.output.itemId)}</span>
        <span class="station-row-copy">
          <b>${escapeHtml(process.title)}</b>
          <small>${formatCost(process)}</small>
        </span>
        <span class="station-row-time">${process.timeSec}s</span>`;
      btn.addEventListener("click", () => {
        this.selectedId = process.id;
        this.refresh();
      });
      list.append(btn);
    }
    if (processes.length === 0) {
      const empty = document.createElement("p");
      empty.className = "station-empty";
      empty.textContent = "No processes at this station.";
      list.append(empty);
    }
  }

  private renderQueue(): void {
    const box = this.overlay.querySelector("[data-role=queue]");
    if (!box) return;
    const q = this.stations.queueOf(this.station);
    box.replaceChildren();
    const head = document.createElement("div");
    head.className = "station-queue-title";
    head.textContent = `Queue (${q.queue.length}/4)`;
    box.append(head);
    if (q.queue.length === 0) {
      const empty = document.createElement("p");
      empty.className = "station-queue-empty";
      empty.textContent = "Idle — nothing cooking.";
      box.append(empty);
      return;
    }
    for (let i = 0; i < q.queue.length; i += 1) {
      const entry = q.queue[i]!;
      const process = this.stations.processes(this.station).find((p) => p.id === entry.recipeKey)
        ?? null;
      const row = document.createElement("div");
      row.className = "station-queue-row" + (i === 0 ? " is-active" : "");
      const pct = entry.totalTime > 0 ? Math.min(100, (entry.progress / entry.totalTime) * 100) : 0;
      const left = Math.max(0, entry.totalTime - entry.progress);
      row.innerHTML = `
        <div class="station-queue-meta">
          <b>${escapeHtml(process?.title ?? entry.recipeKey)}</b>
          <span>${i === 0 ? `${left.toFixed(1)}s left` : "Waiting"}</span>
        </div>
        <div class="station-queue-bar"><i style="width:${pct.toFixed(1)}%"></i></div>`;
      box.append(row);
    }
  }

  private renderStartState(): void {
    const start = this.overlay.querySelector<HTMLButtonElement>("[data-role=start]");
    const hint = this.overlay.querySelector("[data-role=hint]");
    if (!start || !hint || !this.inventory) return;
    if (!this.selectedId) {
      start.disabled = true;
      hint.textContent = "Select a process";
      return;
    }
    const check = this.stations.canStart(this.selectedId, this.station, this.inventory);
    start.disabled = !check.ok;
    if (check.ok) {
      hint.textContent = "Materials will be taken when you start.";
    } else {
      hint.textContent = failMessage(check.reason);
    }
  }
}

function formatCost(process: StationProcessDef): string {
  const parts: string[] = [];
  const mats = stationProcessInputs(process);
  if (mats.length > 0) {
    parts.push(mats.map((m) => `${m.quantity}× ${itemName(m.itemId)}`).join(" + "));
  } else {
    parts.push("free");
  }
  if (process.fuel) {
    parts.push(
      `fuel ${process.fuel.quantity}× ${itemName(process.fuel.itemId)}`,
    );
  }
  parts.push(
    `→ ${process.output.quantity}× ${itemName(process.output.itemId)}`,
  );
  return parts.join(" · ");
}

function iconFor(itemId: string): string {
  const src = ITEM_ICONS[itemId as keyof typeof ITEM_ICONS];
  if (src) return `<img src="${src}" alt="" width="28" height="28" draggable="false" />`;
  return `<span class="station-row-fallback">${itemId.slice(0, 2).toUpperCase()}</span>`;
}

function failMessage(reason: string | null): string {
  switch (reason) {
    case "not-enough-input": return "Need more materials";
    case "not-enough-fuel": return "Need more fuel";
    case "queue-full": return "Queue full (max 4)";
    case "wrong-station": return "Wrong station";
    case "unknown-process": return "Unknown process";
    default: return reason ?? "Can't start";
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Keep I18N import used for future locale pass.
void I18N;
