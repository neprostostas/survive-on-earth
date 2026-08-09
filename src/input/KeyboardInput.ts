import { Vector2 } from "@babylonjs/core/Maths/math.vector";
import { isIntentionalAttackKey } from "./attackInputRules";

export class KeyboardInput {
  private readonly pressed = new Set<string>();
  private readonly primaryActionKeys = new Set<string>();
  private primaryActionQueued = false;
  private primaryActionReleased = false;
  private primaryActionHeld = false;
  private attackQueued = false;
  private enabled = true;

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.clear);
  }

  getVector(): Vector2 {
    if (!this.enabled) return Vector2.Zero();
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

  consumeAttack(): boolean {
    const queued = this.attackQueued;
    this.attackQueued = false;
    return queued;
  }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    this.clear();
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.clear);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled) {
      if (["KeyE", "Space", "KeyF", "KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
      return;
    }
    if (isIntentionalAttackKey(event.code, event.repeat, this.enabled)) {
      event.preventDefault();
      this.attackQueued = true;
      return;
    }
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
    if (!this.enabled) return;
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
    this.attackQueued = false;
    this.primaryActionReleased = this.primaryActionHeld;
    this.primaryActionKeys.clear();
    this.primaryActionHeld = false;
  };
}
