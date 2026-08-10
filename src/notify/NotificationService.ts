export type NotifyKind = "info" | "warn" | "success" | "error";

const KIND_LABEL: Record<NotifyKind, string> = {
  info: "Note",
  warn: "Caution",
  success: "Done",
  error: "Alert",
};

const MAX_VISIBLE = 5;
const DEFAULT_MS = 2400;

/**
 * Lightweight toast rail — top-right stack, not a bottom-center dump.
 */
export class NotificationService {
  private readonly root: HTMLElement;

  constructor(host: HTMLElement) {
    this.root = document.createElement("div");
    this.root.className = "game-toasts";
    this.root.setAttribute("aria-live", "polite");
    this.root.setAttribute("aria-relevant", "additions");
    host.append(this.root);
  }

  push(message: string, kind: NotifyKind = "info", durationMs = DEFAULT_MS): void {
    const text = message.trim();
    if (!text) return;

    const isAchievement = /^Achievement:\s*/i.test(text);
    const displayText = isAchievement ? text.replace(/^Achievement:\s*/i, "") : text;
    const hold = isAchievement ? Math.max(durationMs, 3200) : durationMs;

    const el = document.createElement("div");
    el.className = `game-toast game-toast-${kind}${isAchievement ? " game-toast-achievement" : ""}`;
    el.innerHTML = `
      <span class="game-toast-accent" aria-hidden="true"></span>
      <span class="game-toast-mark" aria-hidden="true">${markSvg(kind, isAchievement)}</span>
      <span class="game-toast-copy">
        <span class="game-toast-kind">${escapeHtml(isAchievement ? "Achievement" : KIND_LABEL[kind])}</span>
        <span class="game-toast-msg">${escapeHtml(displayText)}</span>
      </span>`;

    // Newest on top
    this.root.prepend(el);
    while (this.root.childElementCount > MAX_VISIBLE) {
      this.root.lastElementChild?.remove();
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => { el.classList.add("visible"); });
    });

    const dismiss = (): void => {
      el.classList.remove("visible");
      el.classList.add("leaving");
      window.setTimeout(() => { el.remove(); }, 280);
    };
    window.setTimeout(dismiss, hold);
  }
}

function markSvg(kind: NotifyKind, achievement: boolean): string {
  if (achievement) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H5a3 3 0 0 0 3 3M17 6h2a3 3 0 0 1-3 3"/></svg>`;
  }
  switch (kind) {
    case "success":
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7 10 17l-5-5"/></svg>`;
    case "warn":
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2.5 20h19L12 3z"/><path d="M12 10v4M12 17h.01"/></svg>`;
    case "error":
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/></svg>`;
    default:
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>`;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
