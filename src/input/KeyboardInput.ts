import { Vector2 } from "@babylonjs/core/Maths/math.vector";

export class KeyboardInput {
  private readonly pressed = new Set<string>();
  private primaryActionQueued = false;

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

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.clear);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if ((event.code === "KeyE" || event.code === "Space") && !event.repeat) {
      event.preventDefault();
      this.primaryActionQueued = true;
      return;
    }
    if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
      event.preventDefault();
      this.pressed.add(event.code);
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => { this.pressed.delete(event.code); };
  private readonly clear = (): void => { this.pressed.clear(); this.primaryActionQueued = false; };
}
