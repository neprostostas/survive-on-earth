import { uiIcon } from "./uiIcons";
import { I18N } from "../i18n/I18n";

/**
 * Custom loaders — full-screen (boot / travel) and compact local (panels).
 */

export class FullLoader {
  private readonly el: HTMLElement;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "soi-loader-full";
    this.el.setAttribute("aria-hidden", "true");
    this.el.setAttribute("role", "status");
    this.el.innerHTML = `
      <div class="soi-loader-full-inner">
        <div class="soi-loader-mark" aria-hidden="true">
          <i class="soi-loader-ring"></i>
          <i class="soi-loader-core"></i>
        </div>
        <div class="soi-loader-brand">
          ${uiIcon("fire", "ui-icon-img soi-loader-brand-icon")}
          <span>${I18N.t("menu.brand")}</span>
        </div>
        <div class="soi-loader-label" data-role="label">${I18N.t("loader.loading")}</div>
        <div class="soi-loader-bar"><i data-role="bar"></i></div>
      </div>`;
    root.append(this.el);
  }

  show(label = I18N.t("loader.loading")): void {
    const lab = this.el.querySelector("[data-role=label]");
    if (lab) lab.textContent = label;
    this.el.classList.add("open");
    this.el.setAttribute("aria-hidden", "false");
    const bar = this.el.querySelector<HTMLElement>("[data-role=bar]");
    if (bar) bar.style.width = "18%";
  }

  setProgress(ratio: number): void {
    const bar = this.el.querySelector<HTMLElement>("[data-role=bar]");
    if (bar) bar.style.width = `${Math.max(8, Math.min(100, ratio * 100))}%`;
  }

  hide(): void {
    this.setProgress(1);
    this.el.classList.remove("open");
    this.el.setAttribute("aria-hidden", "true");
  }

  async run<T>(label: string, work: () => T | Promise<T>, minMs = 420): Promise<T> {
    this.show(label);
    this.setProgress(0.25);
    const start = performance.now();
    try {
      const result = await work();
      this.setProgress(0.9);
      const left = minMs - (performance.now() - start);
      if (left > 0) await sleep(left);
      this.setProgress(1);
      return result;
    } finally {
      await sleep(80);
      this.hide();
    }
  }
}

/** Small spinner for inventory/crafting/inline UI. */
export class LocalLoader {
  private readonly el: HTMLElement;

  constructor() {
    this.el = document.createElement("div");
    this.el.className = "soi-loader-local";
    this.el.setAttribute("aria-hidden", "true");
    this.el.innerHTML = `<i class="soi-loader-local-ring" aria-hidden="true"></i><span data-role="label">…</span>`;
  }

  get element(): HTMLElement { return this.el; }

  attach(host: HTMLElement): void {
    host.append(this.el);
  }

  show(label = "…"): void {
    const lab = this.el.querySelector("[data-role=label]");
    if (lab) lab.textContent = label;
    this.el.classList.add("open");
    this.el.setAttribute("aria-hidden", "false");
  }

  hide(): void {
    this.el.classList.remove("open");
    this.el.setAttribute("aria-hidden", "true");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => { setTimeout(r, ms); });
}
