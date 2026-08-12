import type { AchievementSystem } from "../progression/Achievements";
import {
  achievementProgress,
  achievementRows,
  type AchievementFilter,
} from "../progression/AchievementView";
import { achievementTitle } from "../i18n/contentApi";
import { I18N } from "../i18n/I18n";

/**
 * Trophy board: unlocked / locked achievements (Y).
 */
export class AchievementsPanel {
  private readonly overlay: HTMLElement;
  private openState = false;
  private filter: AchievementFilter = "all";

  constructor(
    root: HTMLElement,
    private readonly achievements: AchievementSystem,
    private readonly onVisibility?: (open: boolean) => void,
  ) {
    this.overlay = document.createElement("section");
    this.overlay.className = "station-overlay achievements-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.innerHTML = `
      <div class="station-panel achievements-panel" role="dialog" aria-modal="true" aria-labelledby="achievements-title">
        <header class="station-header">
          <div>
            <small class="station-kicker" data-role="kicker">ACHIEVEMENTS</small>
            <h2 id="achievements-title">Trophies</h2>
          </div>
          <nav class="station-tabs" data-role="tabs"></nav>
          <button type="button" class="station-close" data-role="close" aria-label="Close">×</button>
        </header>
        <div class="achievements-body" data-role="list"></div>
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
    if (kicker) kicker.textContent = I18N.t("achievements.kicker");
    const title = this.overlay.querySelector("#achievements-title");
    if (title) title.textContent = I18N.t("achievements.title");
    const progress = this.overlay.querySelector("[data-role=progress]");
    if (progress) {
      const p = achievementProgress(this.achievements);
      progress.textContent = I18N.t("achievements.progress", { n: p.unlocked, total: p.total });
    }
    this.renderTabs();
    this.renderList();
  }

  private renderTabs(): void {
    const tabs = this.overlay.querySelector("[data-role=tabs]");
    if (!tabs) return;
    tabs.replaceChildren();
    const defs: { id: AchievementFilter; label: string }[] = [
      { id: "all", label: I18N.t("achievements.filterAll") },
      { id: "unlocked", label: I18N.t("achievements.filterUnlocked") },
      { id: "locked", label: I18N.t("achievements.filterLocked") },
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
    const rows = achievementRows(this.achievements, this.filter);
    if (rows.length === 0) {
      const empty = document.createElement("p");
      empty.className = "station-empty";
      empty.textContent = I18N.t("achievements.empty");
      list.append(empty);
      return;
    }
    for (const row of rows) {
      const el = document.createElement("article");
      el.className = "contract-row" + (row.unlocked ? " is-done" : " is-claimed");
      const name = achievementTitle(row.id, row.title);
      el.innerHTML = `
        <div class="contract-row-copy">
          <b>${escapeHtml(name)}</b>
          <small>${escapeHtml(row.description)}</small>
          <span class="contract-meta">${escapeHtml(row.category)}${row.unlocked ? " · ✓" : ""}</span>
        </div>`;
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
