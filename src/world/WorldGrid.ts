import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import type { Scene } from "@babylonjs/core/scene";

export class WorldGrid {
  readonly mesh: LinesMesh;
  readonly cellSize: number;

  constructor(scene: Scene, size: number, cellSize: number) {
    this.cellSize = cellSize;
    const lines: Vector3[][] = [];
    for (let value = -size / 2; value <= size / 2 + 0.01; value += cellSize) {
      lines.push([new Vector3(value, 0.025, -size / 2), new Vector3(value, 0.025, size / 2)]);
      lines.push([new Vector3(-size / 2, 0.025, value), new Vector3(size / 2, 0.025, value)]);
    }
    this.mesh = MeshBuilder.CreateLineSystem("DebugGrid", { lines }, scene);
    this.mesh.color = new Color3(0.1, 0.16, 0.1);
    this.mesh.alpha = 0.34;
    this.mesh.isPickable = false;
    this.mesh.setEnabled(false);
  }

  setVisible(visible: boolean): void { this.mesh.setEnabled(visible); }
  dispose(): void { this.mesh.dispose(); }
}
