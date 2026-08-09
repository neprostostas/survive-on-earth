import { Vector2 } from "@babylonjs/core/Maths/math.vector";
import { KeyboardInput } from "./KeyboardInput";
import { VirtualJoystick } from "./VirtualJoystick";
import { PrimaryActionInput } from "./PrimaryActionInput";
import type { PrimaryActionState } from "../harvesting/HarvestingTypes";

export class InputController {
  private readonly keyboard = new KeyboardInput();
  private readonly joystick: VirtualJoystick;
  private readonly primaryAction: PrimaryActionInput;
  private readonly attackAction: PrimaryActionInput;
  private suppressed = false;

  constructor(joystickElement: HTMLElement, primaryActionElement: HTMLElement, attackActionElement: HTMLElement, deadZone: number) {
    this.joystick = new VirtualJoystick(joystickElement, deadZone);
    this.primaryAction = new PrimaryActionInput(primaryActionElement);
    this.attackAction = new PrimaryActionInput(attackActionElement);
  }

  getMovement(): Vector2 {
    if (this.suppressed) return Vector2.Zero();
    const keyboard = this.keyboard.getVector();
    this.joystick.setKeyboardVisual(keyboard);
    const joystick = this.joystick.getVector();
    const combined = keyboard.lengthSquared() > 0 ? keyboard : joystick;
    if (combined.lengthSquared() > 1) combined.normalize();
    return combined;
  }

  consumePrimaryActionState(): PrimaryActionState {
    if (this.suppressed) return { pressedThisFrame: false, isHeld: false, releasedThisFrame: false };
    const keyboardPressed = this.keyboard.consumePrimaryAction();
    const pointerPressed = this.primaryAction.consumePressed();
    const keyboardReleased = this.keyboard.consumePrimaryActionReleased();
    const pointerReleased = this.primaryAction.consumeReleased();
    return {
      pressedThisFrame: keyboardPressed || pointerPressed,
      isHeld: this.keyboard.isPrimaryActionHeld || this.primaryAction.isHeld,
      releasedThisFrame: keyboardReleased || pointerReleased,
    };
  }

  consumeAttackPressed(): boolean {
    if (this.suppressed) return false;
    return this.keyboard.consumeAttack() || this.attackAction.consumePressed();
  }

  setSuppressed(suppressed: boolean): void {
    if (this.suppressed === suppressed) return;
    this.suppressed = suppressed;
    this.keyboard.setEnabled(!suppressed);
    this.joystick.setEnabled(!suppressed);
    this.primaryAction.setEnabled(!suppressed);
    this.attackAction.setEnabled(!suppressed);
  }

  get isSuppressed(): boolean { return this.suppressed; }

  dispose(): void { this.keyboard.dispose(); this.joystick.dispose(); this.primaryAction.dispose(); this.attackAction.dispose(); }
}
