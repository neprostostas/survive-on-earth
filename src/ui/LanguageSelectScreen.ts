import { I18N } from "../i18n/I18n";
import type { LocaleId } from "../i18n/locales";
import { menuBtnLabel, uiIcon } from "./uiIcons";

type LangPickerMode = "bootstrap" | "change";

/**
 * Language picker:
 * - bootstrap — first launch when no explicit locale is stored
 * - change — anytime from main menu / pause Language button
 */
export class LanguageSelectScreen {
  private readonly overlay: HTMLElement;
  private openState = false;
  private mode: LangPickerMode = "bootstrap";

  constructor(root: HTMLElement, private readonly onDone: () => void) {
    this.overlay = document.createElement("section");
    this.overlay.className = "lang-select-overlay";
    this.overlay.setAttribute("role", "dialog");
    this.overlay.setAttribute("aria-modal", "true");
    root.append(this.overlay);
    this.overlay.addEventListener("click", (e) => {
      if (this.mode === "change" && e.target === this.overlay) this.close();
    });
    this.render();
  }

  get isOpen(): boolean { return this.openState; }
  get shouldShow(): boolean { return !I18N.hasExplicitLocale; }

  /** First-launch flow: Continue applies locale and advances. */
  open(): void {
    this.mode = "bootstrap";
    this.show();
  }

  /** In-game / menu language switch (separate from Settings). */
  openChange(): void {
    this.mode = "change";
    this.show();
  }

  close(): void {
    this.openState = false;
    this.overlay.classList.remove("open");
    this.overlay.style.pointerEvents = "none";
  }

  private show(): void {
    this.openState = true;
    this.overlay.classList.add("open");
    this.overlay.style.pointerEvents = "auto";
    this.render();
  }

  private render(): void {
    const isChange = this.mode === "change";
    const title = I18N.t("lang.title");
    const confirmLabel = isChange ? I18N.t("settings.close") : I18N.t("lang.continue");
    const confirmIcon = isChange ? "close" as const : "play" as const;
    this.overlay.innerHTML = `
      <div class="lang-select-panel">
        ${isChange ? `
          <button type="button" class="menu-btn ghost lang-select-x" data-role="close" aria-label="${I18N.t("settings.close")}">
            ${menuBtnLabel("close", I18N.t("settings.close"))}
          </button>` : ""}
        <div class="lang-select-mark" aria-hidden="true">${uiIcon("globe", "ui-icon-img lang-mark-img")}</div>
        <h1>${title}</h1>
        ${isChange ? "" : `<p class="lang-select-hint">${I18N.t("lang.hint")}</p>`}
        <ul class="lang-select-list" role="listbox" aria-label="${title}">
          ${I18N.locales.map((id) => `
            <li>
              <button type="button" class="lang-option ${I18N.currentLocale === id ? "selected" : ""}" data-locale="${id}" role="option" aria-selected="${I18N.currentLocale === id}">
                <span class="lang-option-flag" aria-hidden="true">${localeGlyph(id)}</span>
                <span class="lang-option-name">${I18N.nativeNames[id]}</span>
                ${I18N.currentLocale === id ? uiIcon("check", "ui-icon-img lang-option-check") : ""}
              </button>
            </li>`).join("")}
        </ul>
        <button type="button" class="menu-btn primary" data-role="go">
          ${menuBtnLabel(confirmIcon, confirmLabel)}
        </button>
      </div>`;

    for (const btn of this.overlay.querySelectorAll<HTMLButtonElement>("[data-locale]")) {
      btn.addEventListener("click", () => {
        I18N.setLocale(btn.dataset.locale as LocaleId);
        this.render();
      });
    }
    this.overlay.querySelector("[data-role=go]")?.addEventListener("click", () => {
      I18N.setLocale(I18N.currentLocale);
      this.close();
      if (!isChange) this.onDone();
    });
    this.overlay.querySelector("[data-role=close]")?.addEventListener("click", () => {
      this.close();
    });
    const focusEl = this.overlay.querySelector<HTMLElement>(
      isChange ? "[data-role=close]" : "[data-role=go]",
    );
    focusEl?.focus({ preventScroll: true });
  }
}

function localeGlyph(id: LocaleId): string {
  const map: Partial<Record<LocaleId, string>> = {
    en: "EN",
    uk: "UA",
    pl: "PL",
    de: "DE",
    es: "ES",
    fr: "FR",
    it: "IT",
    pt: "PT",
    tr: "TR",
    cs: "CS",
    ro: "RO",
    ja: "JP",
    ko: "KR",
  };
  return map[id] ?? id.toUpperCase().slice(0, 2);
}
