import { I18N } from "../i18n/I18n";
import type { MinimapFrame } from "./minimapTypes";
import { Minimap } from "./Minimap";
import { uiIcon } from "./uiIcons";

/**
 * Location map expanded from the HUD minimap with a FLIP animation.
 * Floats as a centered square over the live world — no full-screen wash.
 * Mounted on document.body so #ui-root zoom does not skew viewport centering.
 */
export class LocalMapPanel {
  private readonly overlay: HTMLElement;
  private readonly stage: HTMLElement;
  private readonly titleEl: HTMLElement;
  private readonly map: Minimap;
  private openState = false;
  private animating = false;
  private lastFrame: MinimapFrame | null = null;
  private locationTitle = "Location";
  private readonly onOpenChange: (open: boolean) => void;

  constructor(_root: HTMLElement, onOpenChange: (open: boolean) => void = () => undefined) {
    this.onOpenChange = onOpenChange;
    this.overlay = document.createElement("section");
    this.overlay.className = "local-map-overlay";
    this.overlay.setAttribute("role", "dialog");
    this.overlay.setAttribute("aria-modal", "true");
    this.overlay.setAttribute("aria-label", "Location map");
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.innerHTML = `
      <div class="local-map-backdrop" data-role="close"></div>
      <div class="local-map-stage" data-role="stage">
        <canvas class="local-map-canvas" aria-label="Location map canvas"></canvas>
      </div>
      <header class="local-map-chrome" aria-hidden="true">
        <div class="local-map-title-row">
          ${uiIcon("map", "ui-icon-img local-map-icon")}
          <div>
            <div class="local-map-kicker">Local map</div>
            <h2 class="local-map-title" data-role="title">Location</h2>
          </div>
        </div>
        <button type="button" class="menu-btn ghost local-map-close" data-role="close">
          <span class="menu-btn-inner">${uiIcon("close", "ui-icon-img menu-btn-icon")}<span class="menu-btn-text">Close</span></span>
        </button>
      </header>
      <p class="local-map-hint" aria-hidden="true">Tap outside or Close · Esc</p>`;
    // Body: escape #ui-root zoom so fixed centering uses real viewport pixels.
    document.body.append(this.overlay);

    const stage = this.overlay.querySelector<HTMLElement>("[data-role=stage]");
    const canvas = this.overlay.querySelector<HTMLCanvasElement>(".local-map-canvas");
    const titleEl = this.overlay.querySelector<HTMLElement>("[data-role=title]");
    if (!stage || !canvas || !titleEl) throw new Error("Local map failed to mount");
    this.stage = stage;
    this.titleEl = titleEl;
    this.map = new Minimap(canvas, { worldRadius: 42, square: true, orientation: "world" });

    for (const el of this.overlay.querySelectorAll("[data-role=close]")) {
      el.addEventListener("click", () => this.close());
    }
    window.addEventListener("keydown", this.onKey, true);
    window.addEventListener("resize", this.onResize);
    this.applyLocalMapLocale();
    I18N.onChange(() => this.applyLocalMapLocale());
  }

  private applyLocalMapLocale(): void {
    this.titleEl.textContent = this.locationTitle;
    const kicker = this.overlay.querySelector(".local-map-kicker");
    if (kicker) kicker.textContent = I18N.t("map.localTitle");
    this.overlay.setAttribute("aria-label", I18N.t("map.localTitle"));
    const closeText = this.overlay.querySelector(".menu-btn-text");
    if (closeText) closeText.textContent = I18N.t("map.close");
    const hint = this.overlay.querySelector(".local-map-hint");
    if (hint) hint.textContent = I18N.t("map.localHint");
  }

  get isOpen(): boolean { return this.openState; }

  setLocationTitle(title: string): void {
    this.locationTitle = title;
    this.applyLocalMapLocale();
  }

  update(frame: MinimapFrame): void {
    this.lastFrame = frame;
    if (this.openState) {
      this.map.setWorldRadius(Math.max(28, frame.worldHalfExtent * 1.05));
      this.map.update(frame);
    }
  }

  openFrom(source: HTMLElement): void {
    if (this.openState || this.animating) return;
    this.openState = true;
    this.animating = true;
    this.titleEl.textContent = this.locationTitle;
    this.overlay.classList.add("open", "expanding");
    this.overlay.setAttribute("aria-hidden", "false");

    const rect = source.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    this.stage.style.left = `${rect.left + rect.width / 2}px`;
    this.stage.style.top = `${rect.top + rect.height / 2}px`;
    this.stage.style.width = `${size}px`;
    this.stage.style.height = `${size}px`;
    this.stage.style.borderRadius = "50%";
    this.stage.style.transform = "translate(-50%, -50%)";
    this.stage.style.opacity = "1";

    if (this.lastFrame) {
      this.map.setWorldRadius(Math.max(28, this.lastFrame.worldHalfExtent * 1.05));
      this.map.update(this.lastFrame);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.applyCenteredLayout();
        this.overlay.classList.add("expanded");
        if (this.lastFrame) this.map.update(this.lastFrame);
      });
    });

    const done = (): void => {
      this.stage.removeEventListener("transitionend", done);
      this.animating = false;
      this.overlay.classList.remove("expanding");
      // Re-measure after layout settles so the canvas is not clipped at the bottom.
      this.applyCenteredLayout();
      if (this.lastFrame) this.map.update(this.lastFrame);
    };
    this.stage.addEventListener("transitionend", done);
    window.setTimeout(done, 520);
    this.onOpenChange(true);
    this.overlay.querySelector<HTMLElement>(".local-map-close")?.focus({ preventScroll: true });
  }

  close(): void {
    if (!this.openState || this.animating) return;
    this.animating = true;
    this.overlay.classList.remove("expanded");
    this.overlay.classList.add("collapsing");

    this.stage.style.left = "50%";
    this.stage.style.top = "50%";
    this.stage.style.width = "12vh";
    this.stage.style.height = "12vh";
    this.stage.style.borderRadius = "50%";
    this.stage.style.transform = "translate(-50%, -50%)";
    this.stage.style.opacity = "0.55";

    const finish = (): void => {
      this.stage.removeEventListener("transitionend", finish);
      this.openState = false;
      this.animating = false;
      this.overlay.classList.remove("open", "collapsing");
      this.overlay.setAttribute("aria-hidden", "true");
      this.stage.style.opacity = "1";
      this.stage.style.width = "";
      this.stage.style.height = "";
      this.stage.style.left = "";
      this.stage.style.top = "";
      this.stage.style.borderRadius = "";
      this.stage.style.transform = "";
      this.onOpenChange(false);
    };
    this.stage.addEventListener("transitionend", finish);
    window.setTimeout(finish, 420);
  }

  toggleFrom(source: HTMLElement): void {
    if (this.openState) this.close();
    else this.openFrom(source);
  }

  /** True viewport-centered square (fits under chrome / above hint). */
  private applyCenteredLayout(): void {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const safeTop = this.readSafeInset("top");
    const safeBottom = this.readSafeInset("bottom");
    const safeLeft = this.readSafeInset("left");
    const safeRight = this.readSafeInset("right");
    // Symmetric outer margin so the map center = screen center.
    const edgeY = Math.max(safeTop, safeBottom, vh * 0.08, 52);
    const edgeX = Math.max(safeLeft, safeRight, vw * 0.04, 16);
    const availW = Math.max(120, vw - edgeX * 2);
    const availH = Math.max(120, vh - edgeY * 2);
    const size = Math.floor(Math.min(availW, availH));

    this.stage.style.left = "50%";
    this.stage.style.top = "50%";
    this.stage.style.width = `${size}px`;
    this.stage.style.height = `${size}px`;
    this.stage.style.borderRadius = "1.2vh";
    this.stage.style.transform = "translate(-50%, -50%)";
    this.stage.style.opacity = "1";
  }

  private readSafeInset(side: "top" | "bottom" | "left" | "right"): number {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(`env(safe-area-inset-${side})`);
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  }

  private readonly onResize = (): void => {
    if (!this.openState || this.animating) return;
    this.applyCenteredLayout();
    if (this.lastFrame) this.map.update(this.lastFrame);
  };

  private readonly onKey = (e: KeyboardEvent): void => {
    if (!this.openState) return;
    if (e.code === "Escape") {
      e.preventDefault();
      this.close();
    }
  };
}
