import type { Engine } from "@babylonjs/core/Engines/engine";
import { GAME_CONFIG } from "../config/gameConfig";

export class GameLoop {
  constructor(private readonly engine: Engine, private readonly update: (deltaSeconds: number) => void) {}

  start(): void {
    this.engine.runRenderLoop(() => {
      const delta = Math.min(this.engine.getDeltaTime() / 1000, GAME_CONFIG.maxDeltaSeconds);
      this.update(delta);
    });
  }
}
