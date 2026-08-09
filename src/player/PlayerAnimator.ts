import { Scalar } from "@babylonjs/core/Maths/math.scalar";
import type { PlayerVisual } from "./PlayerVisual";
import type { HarvestPhase, HarvestTool } from "../harvesting/HarvestingTypes";

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
    this.visual.leftArm.rotation.z = 0;
    this.visual.rightArm.rotation.z = 0;
  }

  applyHarvestPose(tool: HarvestTool, progress: number, phase: HarvestPhase): void {
    this.visual.showHarvestTool(tool);
    if (phase === "aligning") {
      this.visual.leftArm.rotation.x = -0.15;
      this.visual.rightArm.rotation.x = -0.2;
      this.visual.bodyPivot.rotation.x = 0;
      return;
    }
    const impactAt = tool === "hatchet" ? 0.5 : 0.49;
    const wind = Math.min(1, progress / impactAt);
    const recovery = Math.max(0, (progress - impactAt) / (1 - impactAt));
    const strike = progress <= impactAt
      ? this.smooth(wind)
      : 1 - this.smooth(recovery);
    if (tool === "hatchet") {
      this.visual.rightArm.rotation.x = -1.45 + strike * 2.35;
      this.visual.leftArm.rotation.x = -1.2 + strike * 1.85;
      this.visual.rightArm.rotation.z = -0.14;
      this.visual.leftArm.rotation.z = 0.2;
      this.visual.bodyPivot.rotation.y = -0.22 + strike * 0.4;
      this.visual.bodyPivot.rotation.x = 0.04 + strike * 0.12;
    } else {
      this.visual.rightArm.rotation.x = -1.9 + strike * 2.8;
      this.visual.leftArm.rotation.x = -1.65 + strike * 2.35;
      this.visual.rightArm.rotation.z = -0.08;
      this.visual.leftArm.rotation.z = 0.13;
      this.visual.bodyPivot.rotation.x = -0.08 + strike * 0.28;
      this.visual.bodyPivot.rotation.y = 0.04;
    }
    this.visual.bodyPivot.position.y = -Math.sin(Math.PI * Math.min(1, progress)) * 0.035;
  }

  clearHarvestPose(): void {
    this.visual.hideHarvestTool();
    this.visual.leftArm.rotation.z = 0;
    this.visual.rightArm.rotation.z = 0;
  }

  private smooth(value: number): number { return value * value * (3 - 2 * value); }
}
