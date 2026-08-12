import type { PlayerInventory } from "../inventory/PlayerInventory";
import type { NpcSystem, BarterOffer } from "../npc/NpcSystem";
import { itemName } from "../i18n/contentApi";
import { I18N } from "../i18n/I18n";
import { ITEM_ICONS } from "./itemIcons";

/**
 * Camp NPC UI: dialogue choices + barter offers.
 */
export class NpcPanel {
  private readonly overlay: HTMLElement;
  private openState = false;
  private npcId: string | null = null;
  private tab: "talk" | "trade" = "talk";
  private inventory: PlayerInventory | null = null;

  constructor(
    root: HTMLElement,
    private readonly npcs: NpcSystem,
    private readonly onChoice: (choiceId: string) => void,
    private readonly onTrade: (offerId: string) => void,
    private readonly onVisibility?: (open: boolean) => void,
  ) {
    this.overlay = document.createElement("section");
    this.overlay.className = "station-overlay npc-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.innerHTML = `
      <div class="station-panel npc-panel" role="dialog" aria-modal="true" aria-labelledby="npc-title">
        <header class="station-header">
          <div>
            <small class="station-kicker" data-role="kicker">NPC</small>
            <h2 id="npc-title">Survivor</h2>
          </div>
          <nav class="station-tabs" data-role="tabs"></nav>
          <button type="button" class="station-close" data-role="close" aria-label="Close">×</button>
        </header>
        <div class="npc-body">
          <div class="npc-talk" data-role="talk"></div>
          <div class="npc-trade" data-role="trade" hidden></div>
        </div>
        <p class="station-hint" data-role="tokens"></p>
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
  get currentNpcId(): string | null { return this.npcId; }

  open(npcId: string, inventory: PlayerInventory, preferTab: "talk" | "trade" = "talk"): void {
    this.npcId = npcId;
    this.inventory = inventory;
    this.tab = preferTab;
    this.openState = true;
    this.overlay.classList.add("open");
    this.overlay.setAttribute("aria-hidden", "false");
    this.refresh();
    this.onVisibility?.(true);
  }

  close(): void {
    if (!this.openState) return;
    this.openState = false;
    this.npcId = null;
    this.inventory = null;
    this.npcs.closeDialogue();
    this.overlay.classList.remove("open");
    this.overlay.setAttribute("aria-hidden", "true");
    this.onVisibility?.(false);
  }

  refresh(): void {
    if (!this.openState || !this.npcId) return;
    const def = this.npcs.getNpc(this.npcId);
    const title = this.overlay.querySelector("#npc-title");
    if (title) title.textContent = def?.name ?? this.npcId;
    const kicker = this.overlay.querySelector("[data-role=kicker]");
    if (kicker) kicker.textContent = I18N.t("npc.kicker");
    const tokens = this.overlay.querySelector("[data-role=tokens]");
    if (tokens) tokens.textContent = I18N.t("npc.tokens", { n: this.npcs.tradeTokens });
    this.renderTabs(def?.role === "trader");
    const talk = this.overlay.querySelector<HTMLElement>("[data-role=talk]");
    const trade = this.overlay.querySelector<HTMLElement>("[data-role=trade]");
    if (talk) talk.hidden = this.tab !== "talk";
    if (trade) trade.hidden = this.tab !== "trade";
    if (this.tab === "talk") this.renderTalk();
    else this.renderTrade();
  }

  private renderTabs(canTrade: boolean): void {
    const tabs = this.overlay.querySelector("[data-role=tabs]");
    if (!tabs) return;
    tabs.replaceChildren();
    const defs: { id: "talk" | "trade"; label: string; enabled: boolean }[] = [
      { id: "talk", label: I18N.t("npc.tabTalk"), enabled: true },
      { id: "trade", label: I18N.t("npc.tabTrade"), enabled: canTrade },
    ];
    for (const d of defs) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "station-tab" + (this.tab === d.id ? " active" : "");
      btn.textContent = d.label;
      btn.disabled = !d.enabled;
      if (d.enabled) {
        btn.addEventListener("click", () => {
          this.tab = d.id;
          this.refresh();
        });
      }
      tabs.append(btn);
    }
  }

  private renderTalk(): void {
    const host = this.overlay.querySelector("[data-role=talk]");
    if (!host) return;
    host.replaceChildren();
    const node = this.npcs.activeNode;
    if (!node) {
      const empty = document.createElement("p");
      empty.className = "station-empty";
      empty.textContent = I18N.t("npc.noTalk");
      host.append(empty);
      return;
    }
    const text = document.createElement("p");
    text.className = "npc-line";
    text.textContent = node.text;
    host.append(text);
    const choices = document.createElement("div");
    choices.className = "npc-choices";
    for (const c of node.choices) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "menu-btn";
      btn.textContent = c.label;
      btn.addEventListener("click", () => this.onChoice(c.id));
      choices.append(btn);
    }
    host.append(choices);
  }

  private renderTrade(): void {
    const host = this.overlay.querySelector("[data-role=trade]");
    if (!host || !this.npcId || !this.inventory) return;
    host.replaceChildren();
    const offers = this.npcs.listOffers(this.npcId);
    if (offers.length === 0) {
      const empty = document.createElement("p");
      empty.className = "station-empty";
      empty.textContent = I18N.t("npc.noTrade");
      host.append(empty);
      return;
    }
    for (const offer of offers) {
      host.append(this.offerRow(offer));
    }
  }

  private offerRow(offer: BarterOffer): HTMLElement {
    const row = document.createElement("article");
    row.className = "contract-row";
    const cost = offer.costs
      .map((c) => `${itemName(c.itemId)} ×${c.quantity}`)
      .join(", ");
    const tokenBit = offer.currencyCost ? ` + ${offer.currencyCost} tok` : "";
    const outName = itemName(offer.offer.itemId);
    row.innerHTML = `
      <span class="station-row-icon">${iconFor(offer.offer.itemId)}</span>
      <div class="contract-row-copy">
        <b>${escapeHtml(outName)} ×${offer.offer.quantity}</b>
        <small>${escapeHtml(cost)}${escapeHtml(tokenBit)}</small>
      </div>
      <button type="button" class="menu-btn primary" data-offer="${escapeHtml(offer.id)}">${I18N.t("npc.trade")}</button>`;
    row.querySelector("button")?.addEventListener("click", () => this.onTrade(offer.id));
    return row;
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
