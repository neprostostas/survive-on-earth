import type { QuestSystem } from "../quests/QuestSystem";
import {
  questProgress,
  questRows,
  type QuestFilter,
} from "../quests/QuestView";
import { questDesc, questTitle } from "../i18n/contentApi";
import { I18N } from "../i18n/I18n";

/**
 * Active / completed quest board with track focus (Q).
 */
export class QuestsPanel {
  private readonly overlay: HTMLElement;
  private openState = false;
  private filter: QuestFilter = "active";

  constructor(
    root: HTMLElement,
    private readonly quests: QuestSystem,
    private readonly onTrackChange?: () => void,
    private readonly onVisibility?: (open: boolean) => void,
  ) {
    this.overlay = document.createElement("section");
    this.overlay.className = "station-overlay quests-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.innerHTML = `
      <div class="station-panel quests-panel" role="dialog" aria-modal="true" aria-labelledby="quests-title">
        <header class="station-header">
          <div>
            <small class="station-kicker" data-role="kicker">QUESTS</small>
            <h2 id="quests-title">Objectives</h2>
          </div>
          <nav class="station-tabs" data-role="tabs"></nav>
          <button type="button" class="station-close" data-role="close" aria-label="Close">×</button>
        </header>
        <div class="quests-body" data-role="list"></div>
        <p class="station-hint" data-role="progress"></p>
      </div>`;
    root.append(this.overlay);
    this.overlay.querySelector("[data-role=close]")?.addEventListener("click", () => this.close());
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });
    I18N.onChange(() => {
      if (this.openState) this.refresh();
    });
  }

  get isOpen(): boolean { return this.openState; }

  toggle(): void {
    if (this.openState) this.close();
    else this.open();
  }

  open(): void {
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
    this.onVisibility?.(false);
  }

  refresh(): void {
    if (!this.openState) return;
    const kicker = this.overlay.querySelector("[data-role=kicker]");
    if (kicker) kicker.textContent = I18N.t("quests.kicker");
    const title = this.overlay.querySelector("#quests-title");
    if (title) title.textContent = I18N.t("quests.title");
    const progress = this.overlay.querySelector("[data-role=progress]");
    if (progress) {
      const p = questProgress(this.quests);
      progress.textContent = I18N.t("quests.progress", { n: p.done, total: p.total });
    }
    this.renderTabs();
    this.renderList();
  }

  private renderTabs(): void {
    const tabs = this.overlay.querySelector("[data-role=tabs]");
    if (!tabs) return;
    tabs.replaceChildren();
    const defs: { id: QuestFilter; label: string }[] = [
      { id: "active", label: I18N.t("quests.filterActive") },
      { id: "done", label: I18N.t("quests.filterDone") },
      { id: "all", label: I18N.t("quests.filterAll") },
    ];
    for (const d of defs) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "station-tab" + (this.filter === d.id ? " active" : "");
      btn.textContent = d.label;
      btn.addEventListener("click", () => {
        this.filter = d.id;
        this.refresh();
      });
      tabs.append(btn);
    }
  }

  private renderList(): void {
    const list = this.overlay.querySelector("[data-role=list]");
    if (!list) return;
    list.replaceChildren();
    const rows = questRows(this.quests, this.filter);
    if (rows.length === 0) {
      const empty = document.createElement("p");
      empty.className = "station-empty";
      empty.textContent = I18N.t("quests.empty");
      list.append(empty);
      return;
    }
    for (const row of rows) {
      const el = document.createElement("article");
      el.className = "contract-row"
        + (row.completed ? " is-done" : "")
        + (row.tracked ? " is-tracked" : "");
      const name = questTitle(row.id, row.title);
      const desc = questDesc(row.id, row.description);
      const meta = row.completed
        ? I18N.t("quests.metaDone", { chain: row.chain })
        : I18N.t("quests.metaProgress", {
          n: row.progress,
          total: row.target,
          chain: row.chain,
        });
      const trackLabel = row.tracked
        ? I18N.t("quests.tracking")
        : I18N.t("quests.track");
      el.innerHTML = `
        <div class="contract-row-copy">
          <b>${escapeHtml(name)}</b>
          <small>${escapeHtml(desc)}</small>
          <span class="contract-meta">${escapeHtml(meta)}${row.tracked ? " · ★" : ""}</span>
        </div>`;
      if (!row.completed) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "menu-btn" + (row.tracked ? "" : " primary");
        btn.textContent = trackLabel;
        btn.disabled = row.tracked;
        btn.addEventListener("click", () => {
          this.quests.setTracked(row.id);
          this.onTrackChange?.();
          this.refresh();
        });
        el.append(btn);
      }
      list.append(el);
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
