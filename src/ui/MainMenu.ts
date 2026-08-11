import { I18N } from "../i18n/I18n";
import type { LocationId } from "../locations/LocationRegistry";
import { confirmDialog } from "./ConfirmDialog";
import { FullLoader } from "./Loaders";
import { LanguageSelectScreen } from "./LanguageSelectScreen";
import { SettingsPanel } from "./SettingsPanel";
import { menuBtnLabel, uiIcon } from "./uiIcons";

export interface MainMenuSaveSummary {
  readonly hasSave: boolean;
  readonly level?: number;
  readonly locationId?: LocationId | string;
  readonly locationName?: string;
  readonly playtimeSec?: number;
  readonly lastPlayedAt?: number;
}

/**
 * Full-screen title menu with save summary, language, settings, new game.
 * With a save present, continue is activated by selecting the save card.
 */
export class MainMenu {
  private readonly overlay: HTMLElement;
  private openState = true;
  private summary: MainMenuSaveSummary = { hasSave: false };
  private readonly settings: SettingsPanel;
  private readonly language: LanguageSelectScreen;
  private readonly loader: FullLoader;
  private starting = false;
  private confirming = false;

  constructor(
    root: HTMLElement,
    private readonly getSummary: () => MainMenuSaveSummary,
    private readonly onPlay: (mode: "new" | "continue") => void,
  ) {
    this.overlay = document.createElement("section");
    this.overlay.className = "main-menu-overlay open";
    this.overlay.setAttribute("role", "dialog");
    this.overlay.setAttribute("aria-modal", "true");
    this.overlay.setAttribute("aria-labelledby", "main-menu-brand");
    this.overlay.style.pointerEvents = "auto";
    root.append(this.overlay);
    this.settings = new SettingsPanel(root);
    this.language = new LanguageSelectScreen(root, () => undefined);
    // Loader on body so it never sits under a re-opened menu hit layer.
    this.loader = new FullLoader(document.body);
    this.render();
    I18N.onChange(() => { if (this.openState && !this.starting && !this.confirming) this.render(); });
  }

  get isOpen(): boolean { return this.openState; }

  refresh(): void {
    this.summary = this.getSummary();
    if (this.openState && !this.starting && !this.confirming) this.render();
  }

  open(): void {
    this.openState = true;
    this.starting = false;
    this.confirming = false;
    this.overlay.classList.add("open");
    this.overlay.style.pointerEvents = "auto";
    this.refresh();
  }

  close(): void {
    this.openState = false;
    this.overlay.classList.remove("open");
    this.overlay.style.pointerEvents = "none";
    this.settings.close();
    this.language.close();
  }

  private render(): void {
    this.summary = this.getSummary();
    const t = (k: Parameters<typeof I18N.t>[0]) => I18N.t(k);
    const has = this.summary.hasSave;
    const locationLabel = this.summary.locationName ?? this.summary.locationId ?? "—";
    const lastPlayed = this.summary.lastPlayedAt
      ? I18N.formatDate(this.summary.lastPlayedAt)
      : null;
    const continueAria = `${t("menu.continue")}: ${locationLabel}`;

    this.overlay.innerHTML = `
      <div class="main-menu-scene" aria-hidden="true">
        <div class="main-menu-sky"></div>
        <div class="main-menu-haze"></div>
        <div class="main-menu-glow"></div>
        <div class="main-menu-trees"></div>
        <div class="main-menu-embers"></div>
        <div class="main-menu-horizon"></div>
        <div class="main-menu-vignette"></div>
      </div>
      <div class="main-menu">
        <header class="main-menu-hero">
          <div class="main-menu-mark" aria-hidden="true">${uiIcon("fire", "ui-icon-img main-menu-mark-img")}</div>
          <div class="main-menu-brand" id="main-menu-brand">${t("menu.brand")}</div>
          <p class="main-menu-sub">${t("menu.sub")}</p>
        </header>

        <section class="main-menu-save" aria-live="polite">
          ${has ? `
            <button type="button" class="save-slot save-slot--action" data-role="continue-save" aria-label="${escapeHtml(continueAria)}">
              <div class="save-slot-accent" aria-hidden="true"></div>
              <div class="save-slot-inner">
                <div class="save-slot-top">
                  <span class="save-slot-kicker">${t("menu.ready")}</span>
                  ${lastPlayed ? `<time class="save-slot-time" datetime="${new Date(this.summary.lastPlayedAt!).toISOString()}">${t("menu.lastPlayed")} · ${lastPlayed}</time>` : ""}
                </div>
                <h3 class="save-slot-location">${escapeHtml(String(locationLabel))}</h3>
                <div class="save-slot-stats" role="list">
                  <div class="save-stat" role="listitem">
                    <span class="save-stat-icon" aria-hidden="true">${uiIcon("level", "ui-icon-img save-stat-icon-img")}</span>
                    <div class="save-stat-copy">
                      <span class="save-stat-label">${t("menu.level")}</span>
                      <span class="save-stat-value">${this.summary.level ?? 1}</span>
                    </div>
                  </div>
                  <div class="save-stat" role="listitem">
                    <span class="save-stat-icon" aria-hidden="true">${uiIcon("clock", "ui-icon-img save-stat-icon-img")}</span>
                    <div class="save-stat-copy">
                      <span class="save-stat-label">${t("menu.playtime")}</span>
                      <span class="save-stat-value">${I18N.formatDuration(this.summary.playtimeSec ?? 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>` : `
            <div class="save-slot save-slot--empty">
              <div class="save-slot-empty-icon" aria-hidden="true">${uiIcon("newgame", "ui-icon-img save-slot-empty-img")}</div>
              <p class="save-slot-empty-copy">${t("menu.noSave")}</p>
            </div>`}
        </section>

        <div class="main-menu-actions">
          <button type="button" data-role="new" class="menu-btn ${has ? "secondary" : "primary"}">
            ${menuBtnLabel("newgame", t("menu.newGame"))}
          </button>
          <div class="main-menu-secondary">
            <button type="button" data-role="settings" class="menu-btn ghost">
              ${menuBtnLabel("settings", t("menu.settings"))}
            </button>
            <button type="button" data-role="language" class="menu-btn ghost">
              ${menuBtnLabel("language", t("menu.language"))}
            </button>
          </div>
        </div>
        <div class="main-menu-version">${t("menu.version")}</div>
      </div>`;

    this.overlay.querySelector("[data-role=continue-save]")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!this.summary.hasSave || this.starting || this.confirming) return;
      void this.startPlay("continue");
    });
    this.overlay.querySelector("[data-role=new]")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.starting || this.confirming) return;
      void this.startNewGame();
    });
    this.overlay.querySelector("[data-role=settings]")?.addEventListener("click", () => {
      if (this.starting || this.confirming) return;
      this.language.close();
      this.settings.open();
    });
    this.overlay.querySelector("[data-role=language]")?.addEventListener("click", () => {
      if (this.starting || this.confirming) return;
      this.settings.close();
      this.language.openChange();
    });
    const focusTarget = this.overlay.querySelector<HTMLButtonElement>(
      has ? "[data-role=continue-save]" : "[data-role=new]",
    );
    if (!this.confirming) focusTarget?.focus({ preventScroll: true });
  }

  private async startNewGame(): Promise<void> {
    if (this.starting || this.confirming) return;

    // Only warn when wiping a real save — no second "New Game" when there's nothing to overwrite.
    if (this.summary.hasSave) {
      this.confirming = true;
      let ok = false;
      try {
        ok = await confirmDialog(document.body, {
          title: I18N.t("menu.confirmTitle"),
          body: I18N.t("menu.confirmNew"),
          confirmLabel: I18N.t("menu.confirmStart"),
          cancelLabel: I18N.t("menu.confirmCancel"),
          danger: true,
        });
      } finally {
        this.confirming = false;
      }
      if (!ok) return;
    }

    await this.startPlay("new");
  }

  private async startPlay(mode: "new" | "continue"): Promise<void> {
    if (this.starting) return;
    this.starting = true;
    this.confirming = false;
    this.settings.close();
    this.language.close();
    // Fully leave the title screen before spinning up the world (avoids layered hit traps).
    this.openState = false;
    this.overlay.classList.remove("open");
    this.overlay.style.pointerEvents = "none";
    try {
      await this.loader.run(mode === "continue" ? "Loading save…" : "Preparing world…", () => {
        this.onPlay(mode);
      }, 420);
    } catch (error) {
      console.error("[MainMenu.startPlay]", error);
      this.starting = false;
      this.open();
      return;
    }
    this.starting = false;
    // beginPlay() closes on success; on failure it re-opens the menu itself.
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
