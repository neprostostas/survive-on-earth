import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { WorldMaterials } from "../../rendering/Materials";
import type { FarmPlotState } from "../../farming/FarmingSystem";

export interface FarmBedObject {
  readonly plotId: string;
  readonly root: TransformNode;
  readonly meshes: Mesh[];
  setEnabled(enabled: boolean): void;
  /** Update crop silhouette from farming domain state. */
  applyState(state: FarmPlotState, growth01: number, fertilized: boolean, hydrated: boolean): void;
}

/**
 * Raised soil bed + sprout stages for home garden plots.
 */
export function createFarmBed(
  scene: Scene,
  materials: WorldMaterials,
  plotId: string,
  x: number,
  z: number,
): FarmBedObject {
  const root = new TransformNode(`FarmBed_${plotId}`, scene);
  root.position.set(x, 0, z);
  const meshes: Mesh[] = [];

  const soil = MeshBuilder.CreateBox("FarmSoil", { width: 1.6, height: 0.1, depth: 1.1 }, scene);
  soil.parent = root;
  soil.position.y = 0.05;
  soil.material = materials.dryGrass;
  meshes.push(soil);

  const rim = MeshBuilder.CreateBox("FarmRim", { width: 1.72, height: 0.14, depth: 1.22 }, scene);
  rim.parent = root;
  rim.position.y = 0.06;
  rim.scaling.set(1, 1, 1);
  rim.material = materials.wood;
  // Hollow rim via slightly lower center already; keep as frame under soil edge.
  rim.position.y = 0.04;
  meshes.push(rim);
  // Put soil slightly higher so rim shows as border.
  soil.position.y = 0.1;

  const postA = MeshBuilder.CreateBox("FarmPostA", { width: 0.08, height: 0.45, depth: 0.08 }, scene);
  postA.parent = root;
  postA.position.set(-0.78, 0.28, -0.5);
  postA.material = materials.wood;
  meshes.push(postA);
  const postB = postA.clone("FarmPostB") as Mesh;
  postB.parent = root;
  postB.position.set(0.78, 0.28, -0.5);
  meshes.push(postB);

  const sprouts: Mesh[] = [];
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const sprout = MeshBuilder.CreateBox(
        `FarmSprout_${row}_${col}`,
        { width: 0.12, height: 0.35, depth: 0.12 },
        scene,
      );
      sprout.parent = root;
      sprout.position.set(-0.45 + col * 0.45, 0.18, -0.22 + row * 0.4);
      sprout.material = materials.bush;
      sprouts.push(sprout);
      meshes.push(sprout);
    }
  }

  const readyBloom = MeshBuilder.CreateSphere("FarmBloom", { diameter: 0.28, segments: 6 }, scene);
  readyBloom.parent = root;
  readyBloom.position.set(0, 0.45, 0);
  readyBloom.material = materials.bush;
  readyBloom.setEnabled(false);
  meshes.push(readyBloom);

  const wetTint = MeshBuilder.CreateBox("FarmWet", { width: 1.5, height: 0.02, depth: 1 }, scene);
  wetTint.parent = root;
  wetTint.position.y = 0.14;
  wetTint.material = materials.contactShadow;
  wetTint.setEnabled(false);
  meshes.push(wetTint);

  for (const mesh of meshes) {
    mesh.isPickable = false;
    mesh.receiveShadows = true;
  }

  return {
    plotId,
    root,
    meshes,
    setEnabled(enabled: boolean) {
      root.setEnabled(enabled);
    },
    applyState(state, growth01, fertilized, hydrated) {
      const g = Math.max(0, Math.min(1, growth01));
      if (state === "empty") {
        for (const s of sprouts) {
          s.setEnabled(false);
        }
        readyBloom.setEnabled(false);
      } else if (state === "ready") {
        for (const s of sprouts) {
          s.setEnabled(true);
          s.scaling.set(1.15, 1.2, 1.15);
          s.position.y = 0.28;
        }
        readyBloom.setEnabled(true);
      } else {
        readyBloom.setEnabled(false);
        const stage = g < 0.25 ? 0.35 : g < 0.55 ? 0.65 : 1;
        for (let i = 0; i < sprouts.length; i += 1) {
          const s = sprouts[i]!;
          // Reveal sprouts gradually left→right
          const unlock = i / sprouts.length;
          s.setEnabled(g > unlock * 0.55 || g > 0.05);
          s.scaling.set(
            stage * (fertilized ? 1.1 : 1),
            stage * (0.45 + g * 0.75),
            stage * (fertilized ? 1.1 : 1),
          );
          s.position.y = 0.16 + g * 0.18;
        }
      }
      wetTint.setEnabled(hydrated && state !== "empty" && state !== "ready");
    },
  };
}
