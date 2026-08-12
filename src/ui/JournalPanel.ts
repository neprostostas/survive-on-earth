import type { JournalSystem } from "../progression/JournalSystem";
import type { ReputationSystem } from "../progression/ReputationSystem";
import {
  factionRows,
  journalCounts,
  journalNoteRows,
  reputationTierLabelKey,
} from "../progression/JournalView";
import { I18N } from "../i18n/I18n";

type TabId = "notes" | "factions" | "discoveries";

/**
 * Codex: lore notes, faction standing, discovery counts (J).
 */
export class JournalPanel {
  private readonly overlay: HTMLElement;
  private openState = false;
  private tab: TabId = "notes";

  constructor(
    root: HTMLElement,
    private readonly journal: JournalSystem,
    private readonly reputation: ReputationSystem,
    private readonly onVisibility?: (open: boolean) => void,
  ) {
    this.overlay = document.createElement("section");
    this.overlay.className = "station-overlay journal-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.innerHTML = `
      <div class="station-panel journal-panel" role="dialog" aria-modal="true" aria-labelledby="journal-title">
        <header class="station-header">
          <div>
            <small class="station-kicker" data-role="kicker">JOURNAL</small>
            <h2 id="journal-title">Field Journal</h2>
          </div>
          <nav class="station-tabs" data-role="tabs"></nav>
          <button type="button" class="station-close" data-role="close" aria-label="Close">×</button>
        </header>
        <div class="journal-body" data-role="body"></div>
        <p class="station-hint" data-role="hint"></p>
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
    if (kicker) kicker.textContent = I18N.t("journal.kicker");
    const title = this.overlay.querySelector("#journal-title");
    if (title) title.textContent = I18N.t("journal.title");
    const hint = this.overlay.querySelector("[data-role=hint]");
    if (hint) hint.textContent = I18N.t("journal.hint");
    this.renderTabs();
    this.renderBody();
  }

  private renderTabs(): void {
    const tabs = this.overlay.querySelector("[data-role=tabs]");
    if (!tabs) return;
    tabs.replaceChildren();
    const defs: { id: TabId; label: string }[] = [
      { id: "notes", label: I18N.t("journal.tabNotes") },
      { id: "factions", label: I18N.t("journal.tabFactions") },
      { id: "discoveries", label: I18N.t("journal.tabDiscoveries") },
    ];
    for (const d of defs) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "station-tab" + (this.tab === d.id ? " active" : "");
      btn.textContent = d.label;
      btn.addEventListener("click", () => {
        this.tab = d.id;
        this.refresh();
      });
      tabs.append(btn);
    }
  }

  private renderBody(): void {
    const body = this.overlay.querySelector("[data-role=body]");
    if (!body) return;
    body.replaceChildren();
    if (this.tab === "notes") this.renderNotes(body);
    else if (this.tab === "factions") this.renderFactions(body);
    else this.renderDiscoveries(body);
  }

  private renderNotes(host: Element): void {
    const notes = journalNoteRows(this.journal);
    if (notes.length === 0) {
      host.append(emptyLine(I18N.t("journal.emptyNotes")));
      return;
    }
    for (const note of notes) {
      const row = document.createElement("article");
      row.className = "contract-row";
      row.innerHTML = `
        <div class="contract-row-copy">
          <b>${escapeHtml(note.id)}</b>
          <small>${escapeHtml(note.text)}</small>
        </div>`;
      host.append(row);
    }
  }

  private renderFactions(host: Element): void {
    for (const faction of factionRows(this.reputation)) {
      const row = document.createElement("article");
      row.className = "contract-row";
      const tier = I18N.t(reputationTierLabelKey(faction.tier));
      row.innerHTML = `
        <div class="contract-row-copy">
          <b>${escapeHtml(faction.title)}</b>
          <small>${escapeHtml(faction.philosophy)}</small>
          <span class="contract-meta">${escapeHtml(tier)} · ${faction.points}</span>
        </div>`;
      host.append(row);
    }
  }

  private renderDiscoveries(host: Element): void {
    const c = journalCounts(this.journal);
    const lines: { label: string; n: number }[] = [
      { label: I18N.t("journal.countLocations"), n: c.locations },
      { label: I18N.t("journal.countItems"), n: c.items },
      { label: I18N.t("journal.countEnemies"), n: c.enemies },
      { label: I18N.t("journal.countNotes"), n: c.notes },
    ];
    for (const line of lines) {
      const row = document.createElement("article");
      row.className = "contract-row";
      row.innerHTML = `
        <div class="contract-row-copy">
          <b>${escapeHtml(line.label)}</b>
          <span class="contract-meta">${line.n}</span>
        </div>`;
      host.append(row);
    }
  }
}

function emptyLine(text: string): HTMLElement {
  const p = document.createElement("p");
  p.className = "station-empty";
  p.textContent = text;
  return p;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
