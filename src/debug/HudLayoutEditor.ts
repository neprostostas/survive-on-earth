import {
  applyHudLayoutTokens,
  clampHudLayout,
  clampHudMetric,
  cloneHudLayout,
  formatHudLayoutExport,
  HUD_EDITABLE_CONTROLS,
  HUD_LAYOUT,
  type HudEditableField,
  type HudLayoutState,
  type HudMetric,
} from "../config/hudLayoutConfig";

type DragMode = "move" | "resize";

interface DragState {
  field: HudEditableField;
  mode: DragMode;
  startClientX: number;
  startClientY: number;
  origin: HudMetric;
}

/**
 * F4 HUD layout editor: drag controls to move, SE handle to resize,
 * Save/Copy exports values for permanent apply into hudLayoutConfig.
 */
export class HudLayoutEditor {
  private readonly panel: HTMLElement;
  private readonly selectionLabel: HTMLElement;
  private readonly statusLabel: HTMLElement;
  private visible = false;
  private layout: HudLayoutState = cloneHudLayout(HUD_LAYOUT);
  private selected: HudEditableField | null = null;
  private drag: DragState | null = null;
  private readonly handles = new Map<HudEditableField, HTMLElement>();
  private readonly disabledRestore = new Map<HTMLButtonElement, boolean>();

  constructor(
    private readonly uiRoot: HTMLElement,
    private readonly hudRoot: HTMLElement,
    private readonly onOpenChange: (open: boolean) => void,
  ) {
    this.panel = document.createElement("aside");
    this.panel.className = "hud-edit-panel";
    this.panel.innerHTML = `
      <header>
        <div>
          <small>HUD LAYOUT</small>
          <h2>Edit mode</h2>
        </div>
        <span class="panel-key">F4</span>
      </header>
      <p class="hud-edit-hint">Drag a control to <b>move</b>. Green corner = <b>resize</b>. Auto-clamp keeps everything on screen.</p>
      <div class="hud-edit-selected">Selected: <b data-role="selection">none</b></div>
      <div class="hud-edit-actions">
        <button type="button" data-action="copy">Save / Copy</button>
        <button type="button" data-action="reset" class="muted">Reset</button>
        <button type="button" data-action="clamp" class="muted">Clamp</button>
      </div>
      <p class="hud-edit-status" data-role="status" aria-live="polite"></p>
      <ol class="hud-edit-list">
        ${HUD_EDITABLE_CONTROLS.map((c) => `<li data-field="${c.field}">${c.label}</li>`).join("")}
      </ol>
    `;
    this.uiRoot.append(this.panel);
    this.selectionLabel = this.panel.querySelector("[data-role='selection']")!;
    this.statusLabel = this.panel.querySelector("[data-role='status']")!;

    this.panel.addEventListener("pointerdown", (event) => { event.stopPropagation(); });
    this.panel.querySelector("[data-action='copy']")?.addEventListener("click", () => { void this.copyLayout(); });
    this.panel.querySelector("[data-action='reset']")?.addEventListener("click", () => { this.resetDefaults(); });
    this.panel.querySelector("[data-action='clamp']")?.addEventListener("click", () => {
      this.clampAll();
      this.setStatus("Clamped all controls to viewport.");
    });
    this.panel.querySelector(".hud-edit-list")?.addEventListener("click", (event) => {
      const li = (event.target as HTMLElement).closest("li[data-field]");
      if (!li) return;
      const field = li.getAttribute("data-field") as HudEditableField | null;
      if (field) this.select(field);
    });

    // Block real HUD button clicks (inventory/crafting) while editing.
    this.hudRoot.addEventListener("click", this.blockHudClicks, true);

    for (const control of HUD_EDITABLE_CONTROLS) {
      const el = this.hudRoot.querySelector<HTMLElement>(control.selector);
      if (!el) continue;
      el.dataset.hudEdit = control.field;
      const handle = document.createElement("i");
      handle.className = "hud-edit-resize";
      handle.title = "Resize";
      handle.dataset.hudResize = control.field;
      el.append(handle);
      this.handles.set(control.field as HudEditableField, handle);

      el.addEventListener("pointerdown", (event) => {
        this.onControlPointerDown(event, control.field as HudEditableField, "move");
      });
      handle.addEventListener("pointerdown", (event) => {
        this.onControlPointerDown(event, control.field as HudEditableField, "resize");
      });
    }

    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
    window.addEventListener("resize", this.onResize);
  }

  private readonly blockHudClicks = (event: Event): void => {
    if (!this.visible) return;
    event.preventDefault();
    event.stopPropagation();
  };

  get isOpen(): boolean { return this.visible; }

  toggle(): void { this.setVisible(!this.visible); }

  setVisible(visible: boolean): void {
    if (this.visible === visible) return;
    this.visible = visible;
    this.panel.classList.toggle("open", visible);
    document.body.classList.toggle("hud-edit-mode", visible);
    this.hudRoot.classList.toggle("hud-editing", visible);
    if (visible) {
      this.unlockDisabledControls();
      this.apply();
      this.setStatus("Drag controls. Save / Copy → paste values in chat.");
    } else {
      this.drag = null;
      this.clearSelection();
      this.restoreDisabledControls();
    }
    this.onOpenChange(visible);
  }

  /** Disabled HTML buttons discard pointer events — unlock only while editing. */
  private unlockDisabledControls(): void {
    this.disabledRestore.clear();
    for (const control of HUD_EDITABLE_CONTROLS) {
      const el = this.hudRoot.querySelector(control.selector);
      if (!(el instanceof HTMLButtonElement) || !el.disabled) continue;
      this.disabledRestore.set(el, true);
      el.disabled = false;
      el.dataset.hudEditForced = "1";
    }
  }

  private restoreDisabledControls(): void {
    for (const [el, wasDisabled] of this.disabledRestore) {
      if (wasDisabled) el.disabled = true;
      delete el.dataset.hudEditForced;
    }
    this.disabledRestore.clear();
  }

  private apply(): void {
    const clamped = clampHudLayout(this.layout, window.innerWidth, window.innerHeight);
    this.layout = clamped;
    applyHudLayoutTokens(this.hudRoot, this.layout);
  }

  private getMetric(field: HudEditableField): HudMetric {
    return this.layout[field] as HudMetric;
  }

  private setMetric(field: HudEditableField, metric: HudMetric): void {
    const next = clampHudMetric(metric, window.innerWidth, window.innerHeight);
    (this.layout[field] as HudMetric) = next;
    applyHudLayoutTokens(this.hudRoot, this.layout);
  }

  private onControlPointerDown(event: PointerEvent, field: HudEditableField, mode: DragMode): void {
    if (!this.visible) return;
    event.preventDefault();
    event.stopPropagation();
    this.select(field);
    this.drag = {
      field,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      origin: { ...this.getMetric(field) },
    };
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.visible || !this.drag) return;
    const { field, mode, startClientX, startClientY, origin } = this.drag;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (mode === "move") {
      const dx = (event.clientX - startClientX) / vw;
      const dy = (event.clientY - startClientY) / vh;
      this.setMetric(field, {
        centerX: origin.centerX + dx,
        centerY: origin.centerY + dy,
        sizeH: origin.sizeH,
      });
    } else {
      // Resize from center: drag SE increases size proportionally to pointer distance delta.
      const originMetric = origin;
      const startDist = Math.hypot(
        startClientX - originMetric.centerX * vw,
        startClientY - originMetric.centerY * vh,
      );
      const nowDist = Math.hypot(
        event.clientX - originMetric.centerX * vw,
        event.clientY - originMetric.centerY * vh,
      );
      const delta = (nowDist - startDist) / vh; // diameter change in height-fraction ≈ 2 * radius change
      this.setMetric(field, {
        centerX: originMetric.centerX,
        centerY: originMetric.centerY,
        sizeH: originMetric.sizeH + delta * 2,
      });
    }
    this.refreshSelectionReadout();
  };

  private readonly onPointerUp = (): void => {
    if (!this.drag) return;
    this.drag = null;
    this.apply(); // final edge clamp
    this.refreshSelectionReadout();
  };

  private readonly onResize = (): void => {
    if (!this.visible) return;
    this.apply();
  };

  private select(field: HudEditableField): void {
    this.selected = field;
    for (const control of HUD_EDITABLE_CONTROLS) {
      const el = this.hudRoot.querySelector<HTMLElement>(control.selector);
      el?.classList.toggle("hud-edit-selected", control.field === field);
    }
    this.panel.querySelectorAll(".hud-edit-list li").forEach((li) => {
      li.classList.toggle("active", li.getAttribute("data-field") === field);
    });
    this.refreshSelectionReadout();
  }

  private clearSelection(): void {
    this.selected = null;
    this.hudRoot.querySelectorAll(".hud-edit-selected").forEach((el) => el.classList.remove("hud-edit-selected"));
    this.panel.querySelectorAll(".hud-edit-list li.active").forEach((li) => li.classList.remove("active"));
    this.selectionLabel.textContent = "none";
  }

  private refreshSelectionReadout(): void {
    if (!this.selected) {
      this.selectionLabel.textContent = "none";
      return;
    }
    const m = this.getMetric(this.selected);
    const label = HUD_EDITABLE_CONTROLS.find((c) => c.field === this.selected)?.label ?? this.selected;
    this.selectionLabel.textContent =
      `${label}  cx ${m.centerX.toFixed(3)}  cy ${m.centerY.toFixed(3)}  sizeH ${m.sizeH.toFixed(3)}`;
  }

  private clampAll(): void {
    this.layout = clampHudLayout(this.layout, window.innerWidth, window.innerHeight);
    applyHudLayoutTokens(this.hudRoot, this.layout);
    this.refreshSelectionReadout();
  }

  private resetDefaults(): void {
    this.layout = cloneHudLayout(HUD_LAYOUT);
    this.apply();
    this.setStatus("Reset to code defaults.");
    this.refreshSelectionReadout();
  }

  private async copyLayout(): Promise<void> {
    this.clampAll();
    const text = formatHudLayoutExport(this.layout);
    try {
      await navigator.clipboard.writeText(text);
      this.setStatus("Copied to clipboard. Paste here in chat.");
    } catch {
      // Fallback: select-friendly temp area
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.append(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      this.setStatus(ok ? "Copied to clipboard. Paste here in chat." : "Copy failed — select text from console.");
      console.log(text);
    }
  }

  private setStatus(message: string): void {
    this.statusLabel.textContent = message;
  }
}
