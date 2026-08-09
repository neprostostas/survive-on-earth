export class PrimaryActionInput {
  private queued = false;
  private released = false;
  private held = false;
  private pointerId: number | null = null;
  private enabled = true;

  constructor(private readonly element: HTMLElement) {
    element.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
    window.addEventListener("blur", this.onBlur);
  }

  consumePressed(): boolean {
    const pressed = this.queued;
    this.queued = false;
    return pressed;
  }

  consumeReleased(): boolean {
    const released = this.released;
    this.released = false;
    return released;
  }

  get isHeld(): boolean { return this.held; }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    this.onBlur();
    this.queued = false;
    this.released = false;
  }

  dispose(): void {
    this.element.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
    window.removeEventListener("blur", this.onBlur);
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.enabled) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (this.pointerId !== null) return;
    event.preventDefault();
    this.pointerId = event.pointerId;
    this.held = true;
    this.queued = true;
    this.element.setPointerCapture?.(event.pointerId);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.held = false;
    this.released = true;
  };

  private readonly onBlur = (): void => {
    this.pointerId = null;
    this.released = this.held;
    this.held = false;
  };
}
