import type { ContractSystem, ContractDef } from "../contracts/ContractSystem";
import { I18N } from "../i18n/I18n";

/**
 * Home bulletin: accept contracts from board + claim completed rewards.
 */
export class ContractPanel {
  private readonly overlay: HTMLElement;
  private openState = false;

  constructor(
    root: HTMLElement,
    private readonly contracts: ContractSystem,
    private readonly onAccept: (id: string) => void,
    private readonly onClaim: (id: string) => void,
    private readonly onVisibility?: (open: boolean) => void,
  ) {
    this.overlay = document.createElement("section");
    this.overlay.className = "station-overlay contract-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.innerHTML = `
      <div class="station-panel contract-panel" role="dialog" aria-modal="true" aria-labelledby="contract-title">
        <header class="station-header">
          <div>
            <small class="station-kicker" data-role="kicker">CONTRACTS</small>
            <h2 id="contract-title">Field Board</h2>
          </div>
          <button type="button" class="station-close" data-role="close" aria-label="Close">×</button>
        </header>
        <div class="contract-body">
          <section class="contract-col">
            <h3 class="contract-col-title" data-role="board-title">Board</h3>
            <div class="contract-list" data-role="board"></div>
          </section>
          <section class="contract-col">
            <h3 class="contract-col-title" data-role="active-title">Active</h3>
            <div class="contract-list" data-role="active"></div>
          </section>
        </div>
        <p class="station-hint contract-hint" data-role="hint"></p>
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
    if (kicker) kicker.textContent = I18N.t("contract.kicker");
    const title = this.overlay.querySelector("#contract-title");
    if (title) title.textContent = I18N.t("contract.title");
    const boardT = this.overlay.querySelector("[data-role=board-title]");
    if (boardT) boardT.textContent = I18N.t("contract.board");
    const activeT = this.overlay.querySelector("[data-role=active-title]");
    if (activeT) activeT.textContent = I18N.t("contract.active");
    const hint = this.overlay.querySelector("[data-role=hint]");
    if (hint) hint.textContent = I18N.t("contract.hint");

    this.renderList("board", this.contracts.boardContracts, "accept");
    this.renderList("active", this.contracts.activeContracts, "claim");
  }

  private renderList(role: "board" | "active", rows: readonly ContractDef[], mode: "accept" | "claim"): void {
    const host = this.overlay.querySelector(`[data-role=${role}]`);
    if (!host) return;
    host.replaceChildren();
    if (rows.length === 0) {
      const empty = document.createElement("p");
      empty.className = "station-empty";
      empty.textContent = mode === "accept" ? I18N.t("contract.emptyBoard") : I18N.t("contract.emptyActive");
      host.append(empty);
      return;
    }
    for (const c of rows) {
      const row = document.createElement("article");
      row.className = "contract-row";
      if (c.completed) row.classList.add("is-done");
      if (c.claimed) row.classList.add("is-claimed");
      const status = c.claimed
        ? I18N.t("contract.claimed")
        : c.completed
          ? I18N.t("contract.ready")
          : I18N.t("contract.inProgress");
      row.innerHTML = `
        <div class="contract-row-copy">
          <b>${escapeHtml(c.title)}</b>
          <small>${escapeHtml(c.description)}</small>
          <span class="contract-meta">T${c.difficulty} · +${c.rewardXp} XP · ${escapeHtml(c.factionId)} · ${escapeHtml(status)}</span>
        </div>
        <button type="button" class="menu-btn ${mode === "claim" && c.completed && !c.claimed ? "primary" : ""}" data-id="${escapeHtml(c.id)}"></button>`;
      const btn = row.querySelector("button")!;
      if (mode === "accept") {
        btn.textContent = I18N.t("contract.accept");
        btn.addEventListener("click", () => this.onAccept(c.id));
      } else if (c.claimed) {
        btn.textContent = I18N.t("contract.claimed");
        btn.disabled = true;
      } else if (c.completed) {
        btn.textContent = I18N.t("contract.claim");
        btn.addEventListener("click", () => this.onClaim(c.id));
      } else {
        btn.textContent = I18N.t("contract.working");
        btn.disabled = true;
      }
      host.append(row);
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
