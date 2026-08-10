import { I18N } from "../i18n/I18n";
import type { GameSettings } from "../i18n/I18n";
import { GAME_AUDIO } from "../audio/GameAudio";
import { CHARACTER_PROFILE } from "../player/CharacterProfile";
import { openCharacterIdentityEditor } from "./CharacterIdentityEditor";
import { menuBtnLabel, uiIcon } from "./uiIcons";

/**
 * Fully custom settings UI — no native select/checkbox/range.
 * Uses one-time event delegation so re-render never stacks handlers.
 */
export class SettingsPanel {
  private readonly overlay: HTMLElement;
  private openState = false;
  private focusCharacter = false;
  private volDragging = false;

  constructor(root: HTMLElement, private readonly onClose?: () => void) {
    this.overlay = document.createElement("section");
    this.overlay.className = "settings-overlay";
    this.overlay.setAttribute("role", "dialog");
    this.overlay.setAttribute("aria-modal", "true");
    this.overlay.setAttribute("aria-label", "Settings");
    root.append(this.overlay);
    this.bindOnce();
    this.render();
    I18N.onChange(() => { if (this.openState && !this.volDragging) this.render(); });
    CHARACTER_PROFILE.onChange(() => { if (this.openState) this.render(); });
  }

  get isOpen(): boolean { return this.openState; }

  open(): void {
    this.focusCharacter = false;
    this.openState = true;
    this.overlay.classList.add("open");
    this.render();
    this.overlay.querySelector<HTMLElement>("[data-role=close]")?.focus();
  }

  openCharacter(): void {
    this.focusCharacter = true;
    this.openState = true;
    this.overlay.classList.add("open");
    this.render();
    this.overlay.querySelector<HTMLElement>("[data-section=character]")?.scrollIntoView({ block: "nearest" });
  }

  close(): void {
    this.openState = false;
    this.focusCharacter = false;
    this.volDragging = false;
    this.overlay.classList.remove("open");
    this.onClose?.();
  }

  private bindOnce(): void {
    this.overlay.addEventListener("click", (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target === this.overlay) {
        this.close();
        return;
      }
      const closeBtn = target.closest<HTMLElement>("[data-role=close]");
      if (closeBtn) {
        this.close();
        return;
      }
      const editBtn = target.closest<HTMLElement>("[data-role=edit-character]");
      if (editBtn) {
        void openCharacterIdentityEditor(this.overlay.parentElement ?? document.body).then(() => {
          if (this.openState) this.render();
        });
        return;
      }
      const choice = target.closest<HTMLButtonElement>("[data-choice]");
      if (choice) {
        this.onChoice(choice.dataset.choice!, choice.dataset.value!);
        return;
      }
      const toggle = target.closest<HTMLButtonElement>("[data-toggle]");
      if (toggle) {
        const key = toggle.dataset.toggle as keyof GameSettings;
        const next = toggle.getAttribute("aria-pressed") !== "true";
        I18N.patchSettings({ [key]: next } as Partial<GameSettings>);
      }
    });

    this.overlay.addEventListener("pointerdown", (e) => {
      const track = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-vol-track]");
      if (!track) return;
      e.preventDefault();
      this.volDragging = true;
      track.setPointerCapture(e.pointerId);
      this.setVolFromClientX(e.clientX, track);
    });
    this.overlay.addEventListener("pointermove", (e) => {
      if (!this.volDragging) return;
      const track = this.overlay.querySelector<HTMLElement>("[data-vol-track]");
      if (!track || !track.hasPointerCapture(e.pointerId)) return;
      this.setVolFromClientX(e.clientX, track);
    });
    this.overlay.addEventListener("pointerup", (e) => {
      const track = this.overlay.querySelector<HTMLElement>("[data-vol-track]");
      if (track?.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);
      this.volDragging = false;
    });
    this.overlay.addEventListener("pointercancel", () => { this.volDragging = false; });
  }

  private onChoice(key: string, value: string): void {
    if (key === "uiScale") {
      I18N.patchSettings({ uiScale: Number(value) });
      return;
    }
    if (key === "textSize") {
      I18N.patchSettings({ textSize: value as GameSettings["textSize"] });
      return;
    }
    if (key === "qualityPreset") {
      I18N.patchSettings({ qualityPreset: value as GameSettings["qualityPreset"] });
    }
  }

  private setVolFromClientX(clientX: number, track: HTMLElement): void {
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
    const vol = Math.round(ratio * 20) / 20;
    I18N.patchSettings({ masterVolume: vol });
    GAME_AUDIO.setMasterVolume(vol);
    GAME_AUDIO.playUiTick();
    // Light live paint without full re-render while dragging
    const fill = track.querySelector<HTMLElement>("[data-vol-fill]");
    const thumb = track.querySelector<HTMLElement>("[data-vol-thumb]");
    const label = this.overlay.querySelector("[data-vol-label]");
    if (fill) fill.style.width = `${ratio * 100}%`;
    if (thumb) thumb.style.left = `${ratio * 100}%`;
    if (label) label.textContent = `${Math.round(ratio * 100)}%`;
  }

  private render(): void {
    const s = I18N.gameSettings;
    const t = (k: Parameters<typeof I18N.t>[0]) => I18N.t(k);
    const identity = CHARACTER_PROFILE.snapshot;
    const genderLabel = identity.gender === "male" ? t("settings.gender.male") : identity.gender === "female" ? t("settings.gender.female") : t("settings.gender.other");
    this.overlay.innerHTML = `
      <div class="settings-panel settings-screen">
        <header class="settings-header">
          <div class="settings-header-title">
            ${uiIcon("settings", "ui-icon-img settings-title-icon")}
            <h2 id="settings-title">${t("settings.title")}</h2>
          </div>
          <button type="button" class="menu-btn ghost settings-close" data-role="close">
            ${menuBtnLabel("close", t("settings.close"))}
          </button>
        </header>
        <div class="settings-body">
          <section class="settings-section${this.focusCharacter ? " highlight" : ""}" data-section="character">
            <h3>${uiIcon("survivor", "ui-icon-img settings-section-icon")}<span>${t("settings.character")}</span></h3>
            <div class="character-summary">
              <div class="character-summary-meta">
                <span class="save-chip">${uiIcon("survivor", "ui-icon-img save-chip-icon")}${escapeHtml(identity.name)}</span>
                <span class="save-chip">${escapeHtml(genderLabel)}</span>
              </div>
              <button type="button" class="menu-btn secondary" data-role="edit-character">
                ${menuBtnLabel("survivor", t("inv.editCharacter"))}
              </button>
            </div>
          </section>
          <section class="settings-section" data-section="accessibility">
            <h3>${uiIcon("a11y", "ui-icon-img settings-section-icon")}<span>${t("settings.accessibility")}</span></h3>
            ${choiceRow(uiIcon("scale"), t("settings.uiScale"), "uiScale",
              [0.8, 0.9, 1, 1.1, 1.25, 1.5].map((v) => ({ value: String(v), label: `${Math.round(v * 100)}%` })),
              nearestUiScale(s.uiScale))}
            ${choiceRow(uiIcon("text"), t("settings.textSize"), "textSize", [
              { value: "normal", label: "A" },
              { value: "large", label: "A+" },
              { value: "xlarge", label: "A++" },
            ], s.textSize)}
            ${toggleRow(uiIcon("contrast"), t("settings.highContrast"), "highContrast", s.highContrast)}
            ${toggleRow(uiIcon("motion"), t("settings.reducedMotion"), "reducedMotion", s.reducedMotion)}
            ${toggleRow(uiIcon("shake"), t("settings.screenShake"), "screenShake", s.screenShake)}
            ${toggleRow(uiIcon("a11y"), t("settings.colorAssist"), "colorAssist", s.colorAssist)}
          </section>
          <section class="settings-section" data-section="graphics">
            <h3>${uiIcon("graphics", "ui-icon-img settings-section-icon")}<span>${t("settings.graphics")}</span></h3>
            ${choiceRow(uiIcon("quality"), t("settings.quality"), "qualityPreset", [
              { value: "low", label: t("settings.quality.low") },
              { value: "medium", label: t("settings.quality.medium") },
              { value: "high", label: t("settings.quality.high") },
              { value: "ultra", label: t("settings.quality.ultra") },
            ], s.qualityPreset)}
            ${toggleRow(uiIcon("damage"), t("settings.damageNumbers"), "damageNumbers", s.damageNumbers)}
          </section>
          <section class="settings-section" data-section="audio">
            <h3>${uiIcon("volume", "ui-icon-img settings-section-icon")}<span>${t("settings.audio")}</span></h3>
            ${volumeRow(uiIcon("volume"), t("settings.masterVolume"), s.masterVolume)}
          </section>
        </div>
      </div>`;
  }
}

function nearestUiScale(value: number): string {
  const options = [0.8, 0.9, 1, 1.1, 1.25, 1.5];
  let best = options[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const o of options) {
    const d = Math.abs(o - value);
    if (d < bestDist) { best = o; bestDist = d; }
  }
  return String(best);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function choiceRow(
  iconHtml: string,
  label: string,
  key: string,
  options: readonly { value: string; label: string }[],
  current: string,
  extraClass = "",
): string {
  return `
    <div class="settings-row-block">
      <span class="settings-row-label">${iconHtml}<span>${label}</span></span>
      <div class="soi-choice-group ${extraClass}" role="listbox" aria-label="${label}">
        ${options.map((o) => `
          <button type="button" class="soi-choice ${o.value === current ? "active" : ""}"
            data-choice="${key}" data-value="${o.value}" role="option" aria-selected="${o.value === current}">
            ${o.value === current ? uiIcon("check", "ui-icon-img choice-check") : ""}
            <span>${o.label}</span>
          </button>`).join("")}
      </div>
    </div>`;
}

function toggleRow(iconHtml: string, label: string, key: string, on: boolean): string {
  return `
    <button type="button" class="soi-toggle-row" data-toggle="${key}" aria-pressed="${on}">
      <span class="soi-toggle-copy">${iconHtml}<span>${label}</span></span>
      <span class="soi-toggle ${on ? "on" : ""}" aria-hidden="true"><i></i></span>
    </button>`;
}

function volumeRow(iconHtml: string, label: string, value: number): string {
  return `
    <div class="settings-row-block">
      <span class="settings-row-label">${iconHtml}<span>${label}</span> <b data-vol-label>${Math.round(value * 100)}%</b></span>
      <div class="soi-vol-track" data-vol-track role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(value * 100)}" tabindex="0">
        <i class="soi-vol-fill" data-vol-fill style="width:${value * 100}%"></i>
        <i class="soi-vol-thumb" data-vol-thumb style="left:${value * 100}%"></i>
      </div>
    </div>`;
}
