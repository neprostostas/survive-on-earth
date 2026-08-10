import { I18N } from "../i18n/I18n";
import { LanguageSelectScreen } from "./LanguageSelectScreen";
import { SettingsPanel } from "./SettingsPanel";
import { menuBtnLabel, uiIcon } from "./uiIcons";

export interface PauseSummary {
  readonly level: number;
  readonly locationName: string;
  readonly sessionPlaytimeSec: number;
  readonly saveOk?: boolean;
}

export class PauseMenu {
  private readonly overlay: HTMLElement;
  private openState = false;
  private summary: PauseSummary = { level: 1, locationName: "Home", sessionPlaytimeSec: 0 };
  private readonly settings: SettingsPanel;
  private readonly language: LanguageSelectScreen;

  constructor(
    root: HTMLElement,
    private readonly getSummary: () => PauseSummary,
    private readonly onResume: () => void,
    private readonly onMainMenu: () => void,
    private readonly onInventory: () => void,
  ) {
    this.overlay = document.createElement("section");
    this.overlay.className = "pause-menu-overlay";
    this.overlay.setAttribute("role", "dialog");
    this.overlay.setAttribute("aria-modal", "true");
    root.append(this.overlay);
    this.settings = new SettingsPanel(root);
    this.language = new LanguageSelectScreen(root, () => undefined);
    this.render();
    I18N.onChange(() => { if (this.openState) this.render(); });
  }

  get isOpen(): boolean { return this.openState; }

  open(): void {
    this.openState = true;
    this.summary = this.getSummary();
    this.overlay.classList.add("open");
    this.render();
  }

  close(): void {
    this.openState = false;
    this.overlay.classList.remove("open");
    this.settings.close();
    this.language.close();
  }

  toggle(): void {
    if (this.openState) this.close();
    else this.open();
  }

  private render(): void {
    const t = (k: Parameters<typeof I18N.t>[0]) => I18N.t(k);
    this.overlay.innerHTML = `
      <div class="pause-menu" role="document">
        <div class="pause-mark" aria-hidden="true">${uiIcon("survivor", "ui-icon-img pause-mark-img")}</div>
        <h2 id="pause-title">${t("pause.title")}</h2>
        <div class="pause-summary" aria-live="polite">
          <span class="save-chip">${uiIcon("level", "ui-icon-img save-chip-icon")}${t("menu.level")} ${this.summary.level}</span>
          <span class="save-chip">${uiIcon("map", "ui-icon-img save-chip-icon")}${this.summary.locationName}</span>
          <span class="save-chip">${uiIcon("clock", "ui-icon-img save-chip-icon")}${I18N.formatDuration(this.summary.sessionPlaytimeSec)}</span>
        </div>
        <nav class="pause-actions" aria-labelledby="pause-title">
          <button type="button" data-role="resume" class="menu-btn primary">${menuBtnLabel("resume", t("pause.resume"))}</button>
          <button type="button" data-role="inventory" class="menu-btn secondary">${menuBtnLabel("inventory", t("pause.inventory"))}</button>
          <button type="button" data-role="settings" class="menu-btn secondary">${menuBtnLabel("settings", t("pause.settings"))}</button>
          <button type="button" data-role="language" class="menu-btn secondary">${menuBtnLabel("language", t("pause.language"))}</button>
          <button type="button" data-role="controls" class="menu-btn ghost">${menuBtnLabel("text", t("pause.controls"))}</button>
          <button type="button" data-role="menu" class="menu-btn ghost">${menuBtnLabel("home", t("pause.mainMenu"))}</button>
        </nav>
        <p class="pause-controls-hint" data-controls hidden>${t("pause.controlsBody")}</p>
      </div>`;
    this.overlay.querySelector("[data-role=resume]")?.addEventListener("click", () => {
      this.close();
      this.onResume();
    });
    this.overlay.querySelector("[data-role=inventory]")?.addEventListener("click", () => {
      this.close();
      this.onInventory();
    });
    this.overlay.querySelector("[data-role=settings]")?.addEventListener("click", () => {
      this.language.close();
      this.settings.open();
    });
    this.overlay.querySelector("[data-role=language]")?.addEventListener("click", () => {
      this.settings.close();
      this.language.openChange();
    });
    this.overlay.querySelector("[data-role=controls]")?.addEventListener("click", () => {
      const hint = this.overlay.querySelector<HTMLElement>("[data-controls]");
      if (hint) hint.hidden = !hint.hidden;
    });
    this.overlay.querySelector("[data-role=menu]")?.addEventListener("click", () => {
      this.close();
      this.onMainMenu();
    });
    this.overlay.querySelector<HTMLElement>("[data-role=resume]")?.focus();
  }
}
