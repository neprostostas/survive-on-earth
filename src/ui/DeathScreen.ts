import { I18N } from "../i18n/I18n";
import { menuBtnLabel, uiIcon } from "./uiIcons";

export interface DeathInfo {
  readonly locationName: string;
  readonly cause?: string;
}

export class DeathScreen {
  private readonly overlay: HTMLElement;
  private openState = false;
  private info: DeathInfo = { locationName: "Unknown" };

  constructor(
    root: HTMLElement,
    private readonly onRespawn: () => void,
    private readonly onMainMenu?: () => void,
  ) {
    this.overlay = document.createElement("section");
    this.overlay.className = "death-screen-overlay";
    this.overlay.setAttribute("role", "alertdialog");
    this.overlay.setAttribute("aria-modal", "true");
    this.overlay.setAttribute("aria-labelledby", "death-title");
    root.append(this.overlay);
    this.render();
    I18N.onChange(() => { if (this.openState) this.render(); });
  }

  get isOpen(): boolean { return this.openState; }

  open(info?: DeathInfo): void {
    if (info) this.info = info;
    this.openState = true;
    this.overlay.classList.add("open");
    this.render();
  }

  close(): void {
    this.openState = false;
    this.overlay.classList.remove("open");
  }

  private render(): void {
    const t = (k: Parameters<typeof I18N.t>[0]) => I18N.t(k);
    this.overlay.innerHTML = `
      <div class="death-screen">
        <div class="death-vignette" aria-hidden="true"></div>
        <div class="death-mark" aria-hidden="true">${uiIcon("death", "ui-icon-img death-mark-img")}</div>
        <h2 id="death-title" class="death-title">${t("death.title")}</h2>
        <p class="death-hint">${t("death.hint")}</p>
        <dl class="death-meta">
          <div class="death-meta-row">
            ${uiIcon("map", "ui-icon-img death-meta-icon")}
            <div><dt>${t("death.location")}</dt><dd>${escapeHtml(this.info.locationName)}</dd></div>
          </div>
          <div class="death-meta-row">
            ${uiIcon("skull", "ui-icon-img death-meta-icon")}
            <div><dt>${t("death.cause")}</dt><dd>${escapeHtml(this.info.cause ?? t("death.causeDefault"))}</dd></div>
          </div>
        </dl>
        <div class="death-actions">
          <button type="button" class="menu-btn primary" data-role="respawn">
            ${menuBtnLabel("heart", t("death.respawn"))}
          </button>
          ${this.onMainMenu ? `<button type="button" class="menu-btn ghost" data-role="menu">${menuBtnLabel("home", t("death.mainMenu"))}</button>` : ""}
        </div>
      </div>`;
    this.overlay.querySelector("[data-role=respawn]")?.addEventListener("click", () => {
      this.close();
      this.onRespawn();
    });
    this.overlay.querySelector("[data-role=menu]")?.addEventListener("click", () => {
      this.close();
      this.onMainMenu?.();
    });
    this.overlay.querySelector<HTMLElement>("[data-role=respawn]")?.focus();
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
