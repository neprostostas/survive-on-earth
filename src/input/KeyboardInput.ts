import { Vector2 } from "@babylonjs/core/Maths/math.vector";

export class KeyboardInput {
  private readonly pressed = new Set<string>();
  private readonly primaryActionKeys = new Set<string>();
  private primaryActionQueued = false;
  private primaryActionReleased = false;
  private primaryActionHeld = false;

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.clear);
  }

  getVector(): Vector2 {
    const x = Number(this.pressed.has("KeyD") || this.pressed.has("ArrowRight")) - Number(this.pressed.has("KeyA") || this.pressed.has("ArrowLeft"));
    const y = Number(this.pressed.has("KeyW") || this.pressed.has("ArrowUp")) - Number(this.pressed.has("KeyS") || this.pressed.has("ArrowDown"));
    const result = new Vector2(x, y);
    if (result.lengthSquared() > 1) result.normalize();
    return result;
  }

  consumePrimaryAction(): boolean {
    const queued = this.primaryActionQueued;
    this.primaryActionQueued = false;
    return queued;
  }

  consumePrimaryActionReleased(): boolean {
    const released = this.primaryActionReleased;
    this.primaryActionReleased = false;
    return released;
  }

  get isPrimaryActionHeld(): boolean { return this.primaryActionHeld; }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.clear);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if ((event.code === "KeyE" || event.code === "Space") && !event.repeat) {
      event.preventDefault();
      this.primaryActionQueued = true;
      this.primaryActionKeys.add(event.code);
      this.primaryActionHeld = this.primaryActionKeys.size > 0;
      return;
    }
    if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
      event.preventDefault();
      this.pressed.add(event.code);
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
    if (event.code === "KeyE" || event.code === "Space") {
      event.preventDefault();
      this.primaryActionKeys.delete(event.code);
      if (this.primaryActionHeld && this.primaryActionKeys.size === 0) this.primaryActionReleased = true;
      this.primaryActionHeld = this.primaryActionKeys.size > 0;
    }
  };
  private readonly clear = (): void => {
    this.pressed.clear();
    this.primaryActionQueued = false;
    this.primaryActionReleased = this.primaryActionHeld;
    this.primaryActionKeys.clear();
    this.primaryActionHeld = false;
  };
}
