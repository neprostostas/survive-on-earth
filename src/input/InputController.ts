import { Vector2 } from "@babylonjs/core/Maths/math.vector";
import { KeyboardInput } from "./KeyboardInput";
import { VirtualJoystick } from "./VirtualJoystick";
import { PrimaryActionInput } from "./PrimaryActionInput";

export class InputController {
  private readonly keyboard = new KeyboardInput();
  private readonly joystick: VirtualJoystick;
  private readonly primaryAction: PrimaryActionInput;

  constructor(joystickElement: HTMLElement, primaryActionElement: HTMLElement, deadZone: number) {
    this.joystick = new VirtualJoystick(joystickElement, deadZone);
    this.primaryAction = new PrimaryActionInput(primaryActionElement);
  }

  getMovement(): Vector2 {
    const keyboard = this.keyboard.getVector();
    this.joystick.setKeyboardVisual(keyboard);
    const joystick = this.joystick.getVector();
    const combined = keyboard.lengthSquared() > 0 ? keyboard : joystick;
    if (combined.lengthSquared() > 1) combined.normalize();
    return combined;
  }

  consumePrimaryAction(): boolean {
    const keyboardPressed = this.keyboard.consumePrimaryAction();
    const pointerPressed = this.primaryAction.consumePressed();
    return keyboardPressed || pointerPressed;
  }

  dispose(): void { this.keyboard.dispose(); this.joystick.dispose(); this.primaryAction.dispose(); }
}
