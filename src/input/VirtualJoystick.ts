import { Vector2 } from "@babylonjs/core/Maths/math.vector";

export class VirtualJoystick {
  private pointerId: number | null = null;
  private value = Vector2.Zero();
  private readonly keyboardVisual = Vector2.Zero();
  private readonly knob: HTMLElement;

  constructor(private readonly element: HTMLElement, private readonly deadZone: number) {
    const knob = element.querySelector<HTMLElement>(".joystick-knob");
    if (!knob) throw new Error("Joystick knob is missing");
    this.knob = knob;
    element.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
  }

  getVector(): Vector2 { return this.value.clone(); }

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
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (this.pointerId !== null) return;
    this.pointerId = event.pointerId;
    this.element.classList.add("pointer-active");
    this.element.setPointerCapture(event.pointerId);
    this.update(event);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
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
    const bounds = this.element.getBoundingClientRect();
    const radius = bounds.width * 0.34;
    const dx = event.clientX - (bounds.left + bounds.width / 2);
    const dy = event.clientY - (bounds.top + bounds.height / 2);
    const raw = new Vector2(dx / radius, -dy / radius);
    const length = raw.length();
    if (length > 1) raw.scaleInPlace(1 / length);
    if (length < this.deadZone) raw.set(0, 0);
    this.value.copyFrom(raw);
    if (this.keyboardVisual.lengthSquared() < 0.001) this.renderKnob(raw, radius);
  }

  private renderKnob(vector: Vector2, radius = this.element.getBoundingClientRect().width * 0.34): void {
    this.knob.style.transform = `translate3d(${vector.x * radius}px, ${-vector.y * radius}px, 0)`;
  }
}
