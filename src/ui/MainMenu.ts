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
 * Full-screen title menu with save summary, language, settings, continue/new.
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
    const primaryContinue = has;
    this.overlay.innerHTML = `
      <div class="main-menu-scene" aria-hidden="true">
        <div class="main-menu-sky"></div>
        <div class="main-menu-glow"></div>
        <div class="main-menu-trees"></div>
        <div class="main-menu-embers"></div>
        <div class="main-menu-horizon"></div>
      </div>
      <div class="main-menu">
        <div class="main-menu-mark" aria-hidden="true">${uiIcon("fire", "ui-icon-img main-menu-mark-img")}</div>
        <div class="main-menu-brand" id="main-menu-brand">${t("menu.brand")}</div>
        <p class="main-menu-sub">${t("menu.sub")}</p>
        <div class="main-menu-save" aria-live="polite">
          ${has ? `
            <div class="save-card">
              <div class="save-card-head">
                ${uiIcon("continue", "ui-icon-img save-card-icon")}
                <div class="save-card-title">${t("menu.ready")}</div>
              </div>
              <div class="save-card-meta">
                <span class="save-chip">${uiIcon("level", "ui-icon-img save-chip-icon")}${t("menu.level")} ${this.summary.level ?? 1}</span>
                <span class="save-chip">${uiIcon("map", "ui-icon-img save-chip-icon")}${this.summary.locationName ?? this.summary.locationId ?? "—"}</span>
                <span class="save-chip">${uiIcon("clock", "ui-icon-img save-chip-icon")}${I18N.formatDuration(this.summary.playtimeSec ?? 0)}</span>
              </div>
            </div>` : `
            <div class="save-card empty">
              ${uiIcon("newgame", "ui-icon-img save-card-icon")}
              <span>${t("menu.noSave")}</span>
            </div>`}
        </div>
        <div class="main-menu-actions">
          <button type="button" data-role="continue" class="menu-btn ${primaryContinue ? "primary" : "secondary"}" ${has ? "" : "disabled"}>
            ${menuBtnLabel("continue", t("menu.continue"))}
          </button>
          <button type="button" data-role="new" class="menu-btn ${primaryContinue ? "secondary" : "primary"}">
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

    this.overlay.querySelector("[data-role=continue]")?.addEventListener("click", (e) => {
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
      primaryContinue ? "[data-role=continue]" : "[data-role=new]",
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
