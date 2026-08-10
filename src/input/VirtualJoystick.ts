import { Vector2 } from "@babylonjs/core/Maths/math.vector";

export class VirtualJoystick {
  private pointerId: number | null = null;
  private value = Vector2.Zero();
  private readonly keyboardVisual = Vector2.Zero();
  private readonly knob: HTMLElement;
  private enabled = true;
  private cachedRadius = 28;
  private boundsLeft = 0;
  private boundsTop = 0;
  private boundsW = 1;
  private boundsH = 1;

  constructor(private readonly element: HTMLElement, private readonly deadZone: number) {
    const knob = element.querySelector<HTMLElement>(".joystick-knob");
    if (!knob) throw new Error("Joystick knob is missing");
    this.knob = knob;
    element.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
    window.addEventListener("resize", this.refreshMetrics);
    this.refreshMetrics();
  }

  getVector(): Vector2 { return this.value.clone(); }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    this.pointerId = null;
    this.value.set(0, 0);
    this.keyboardVisual.set(0, 0);
    this.element.classList.remove("pointer-active", "keyboard-input");
    this.renderKnob(Vector2.Zero());
  }

  setKeyboardVisual(vector: Vector2): void {
    if (this.keyboardVisual.equalsWithEpsilon(vector, 0.001)) return;
    this.keyboardVisual.copyFrom(vector);
    const active = vector.lengthSquared() > 0.001;
    this.element.classList.toggle("keyboard-input", active);
    this.renderKnob(active ? vector : this.value);
  }

  dispose(): void {
    this.element.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
    window.removeEventListener("resize", this.refreshMetrics);
  }

  private readonly refreshMetrics = (): void => {
    const w = this.element.clientWidth;
    const h = this.element.clientHeight;
    if (w > 0) {
      this.boundsW = w;
      this.boundsH = h > 0 ? h : w;
      this.cachedRadius = w * 0.28;
    }
  };

  private captureBounds(): void {
    const bounds = this.element.getBoundingClientRect();
    this.boundsLeft = bounds.left;
    this.boundsTop = bounds.top;
    this.boundsW = bounds.width;
    this.boundsH = bounds.height;
    this.cachedRadius = bounds.width * 0.28;
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.enabled) return;
    if (this.pointerId !== null) return;
    this.pointerId = event.pointerId;
    this.element.classList.add("pointer-active");
    this.element.setPointerCapture(event.pointerId);
    this.captureBounds();
    this.update(event);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.enabled) return;
    if (event.pointerId === this.pointerId) this.update(event);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.element.classList.remove("pointer-active");
    this.value.set(0, 0);
    this.renderKnob(this.keyboardVisual);
  };

  private update(event: PointerEvent): void {
    event.preventDefault();
    const radius = this.cachedRadius || 28;
    const dx = event.clientX - (this.boundsLeft + this.boundsW / 2);
    const dy = event.clientY - (this.boundsTop + this.boundsH / 2);
    const raw = new Vector2(dx / radius, -dy / radius);
    const length = raw.length();
    if (length > 1) raw.scaleInPlace(1 / length);
    if (length < this.deadZone) raw.set(0, 0);
    this.value.copyFrom(raw);
    if (this.keyboardVisual.lengthSquared() < 0.001) this.renderKnob(raw, radius);
  }

  private renderKnob(vector: Vector2, radius = this.cachedRadius): void {
    // Knob anchors at center; offset in CSS pixels (positive y = up in input, negative screen Y).
    this.knob.style.transform = `translate(calc(-50% + ${vector.x * radius}px), calc(-50% + ${-vector.y * radius}px))`;
  }
}
