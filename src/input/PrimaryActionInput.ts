export class PrimaryActionInput {
  private queued = false;

  constructor(private readonly element: HTMLElement) {
    element.addEventListener("pointerdown", this.onPointerDown);
  }

  consumePressed(): boolean {
    const pressed = this.queued;
    this.queued = false;
    return pressed;
  }

  dispose(): void { this.element.removeEventListener("pointerdown", this.onPointerDown); }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    this.queued = true;
  };
}
