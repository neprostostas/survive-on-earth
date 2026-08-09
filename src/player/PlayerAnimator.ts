import { Scalar } from "@babylonjs/core/Maths/math.scalar";
import type { PlayerVisual } from "./PlayerVisual";

export class PlayerAnimator {
  private time = 0;
  private locomotionBlend = 0;
  constructor(private readonly visual: PlayerVisual) {}

  update(delta: number, normalizedSpeed: number): void {
    const targetBlend = Scalar.Clamp(normalizedSpeed, 0, 1);
    const blendRate = targetBlend > this.locomotionBlend ? 12 : 8;
    this.locomotionBlend += (targetBlend - this.locomotionBlend) * (1 - Math.exp(-blendRate * delta));
    const moving = this.locomotionBlend;
    this.time += delta * (2 + moving * 7.5);
    const strideWave = Math.sin(this.time);
    const stride = strideWave * 0.6 * moving;
    const idle = Math.sin(this.time * 0.55);
    const relaxedArm = idle * 0.025 * (1 - moving);
    this.visual.leftLeg.rotation.x = stride;
    this.visual.rightLeg.rotation.x = -stride;
    this.visual.leftArm.rotation.x = -stride * 0.72 + relaxedArm;
    this.visual.rightArm.rotation.x = stride * 0.72 - relaxedArm;
    this.visual.bodyPivot.position.y = Math.abs(Math.sin(this.time * 2)) * 0.012 * moving + idle * 0.007 * (1 - moving);
    this.visual.bodyPivot.rotation.x = -0.055 * moving;
    this.visual.bodyPivot.rotation.z = strideWave * 0.01 * moving;
    this.visual.bodyPivot.rotation.y = Math.sin(this.time * 2) * 0.018 * moving + idle * 0.006 * (1 - moving);
  }
}
