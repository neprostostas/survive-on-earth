import { I18N } from "../i18n/I18n";

/**
 * Custom confirm dialog — never use window.confirm/alert.
 * Always mounts on document.body so #ui-root zoom/pointer-events cannot swallow clicks.
 */
export interface ConfirmOptions {
  readonly title: string;
  readonly body: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly danger?: boolean;
}

export function confirmDialog(_root: HTMLElement | null | undefined, options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const host = document.body;
    const overlay = document.createElement("section");
    overlay.className = "soi-confirm-overlay open";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.style.pointerEvents = "auto";
    const okIcon = options.danger ? "skull" : "check";
    // Lazy import avoided — keep icons as plain text fallbacks if UI icons fail.
    // Inline img mirrors menu buttons without coupling hit-targets to nested spans incorrectly.
    overlay.innerHTML = `
      <div class="soi-confirm-panel" role="document">
        <div class="soi-confirm-mark" aria-hidden="true">
          <img class="ui-icon-img confirm-mark-img" src="/icons/ui/${okIcon}.svg" alt="" width="28" height="28" draggable="false" />
        </div>
        <h2 class="soi-confirm-title">${escapeHtml(options.title)}</h2>
        <p class="soi-confirm-body">${escapeHtml(options.body)}</p>
        <div class="soi-confirm-actions">
          <button type="button" class="menu-btn ghost" data-role="cancel">${escapeHtml(options.cancelLabel ?? I18N.t("confirm.cancel"))}</button>
          <button type="button" class="menu-btn ${options.danger ? "danger" : "primary"}" data-role="ok">${escapeHtml(options.confirmLabel ?? I18N.t("confirm.ok"))}</button>
        </div>
      </div>`;
    host.append(overlay);

    let settled = false;
    const finish = (value: boolean): void => {
      if (settled) return;
      settled = true;
      overlay.classList.remove("open");
      overlay.remove();
      window.removeEventListener("keydown", onKey, true);
      resolve(value);
    };

    const cancelBtn = overlay.querySelector<HTMLButtonElement>("[data-role=cancel]");
    const okBtn = overlay.querySelector<HTMLButtonElement>("[data-role=ok]");
    cancelBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      finish(false);
    });
    okBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      finish(true);
    });
    overlay.addEventListener("pointerdown", (e) => {
      if (e.target === overlay) {
        e.preventDefault();
        finish(false);
      }
    });
    const onKey = (e: KeyboardEvent): void => {
      if (e.code === "Escape") { e.preventDefault(); finish(false); }
      if (e.code === "Enter") { e.preventDefault(); finish(true); }
    };
    window.addEventListener("keydown", onKey, true);
    // Defer focus so main-menu focus() after render does not steal it.
    requestAnimationFrame(() => {
      okBtn?.focus({ preventScroll: true });
    });
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
