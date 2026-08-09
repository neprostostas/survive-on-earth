import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { WorldMaterials } from "../../rendering/Materials";

export interface CrateObject { root: TransformNode; meshes: Mesh[] }

export function createCrate(scene: Scene, materials: WorldMaterials, x: number, z: number): CrateObject {
  const root = new TransformNode("CrateRoot", scene);
  root.position.set(x, 0, z);
  root.rotation.y = -0.08;
  const meshes: Mesh[] = [];
  for (let side = -1; side <= 1; side += 2) {
    for (let plank = 0; plank < 4; plank += 1) {
      const panel = MeshBuilder.CreateBox("CratePlank", { width: 0.27, height: 0.84, depth: 0.09 }, scene);
      panel.parent = root;
      panel.position.set(-0.42 + plank * 0.28, 0.48, side * 0.52);
      panel.material = materials.wood;
      meshes.push(panel);
      const sidePanel = MeshBuilder.CreateBox("CrateSidePlank", { width: 0.09, height: 0.84, depth: 0.27 }, scene);
      sidePanel.parent = root;
      sidePanel.position.set(side * 0.52, 0.48, -0.42 + plank * 0.28);
      sidePanel.material = materials.wood;
      meshes.push(sidePanel);
    }
  }
  for (let plank = 0; plank < 4; plank += 1) {
    const lid = MeshBuilder.CreateBox("CrateLidPlank", { width: 0.27, height: 0.1, depth: 1.12 }, scene);
    lid.parent = root;
    lid.position.set(-0.42 + plank * 0.28, 0.94, 0);
    lid.material = materials.wood;
    meshes.push(lid);
  }
  for (const y of [0.22, 0.78]) {
    const band = MeshBuilder.CreateBox("CrateBand", { width: 1.15, height: 0.075, depth: 1.17 }, scene);
    band.parent = root;
    band.position.y = y;
    band.material = materials.metal;
    meshes.push(band);
  }
  const latch = MeshBuilder.CreateBox("CrateLatch", { width: 0.18, height: 0.23, depth: 0.08 }, scene);
  latch.parent = root;
  latch.position.set(0, 0.69, 0.575);
  latch.material = materials.metal;
  meshes.push(latch);
  const shadow = MeshBuilder.CreateDisc("CrateContactShadow", { radius: 0.76, tessellation: 24 }, scene);
  shadow.parent = root;
  shadow.rotation.x = Math.PI / 2;
  shadow.position.y = 0.025;
  shadow.material = materials.contactShadow;
  meshes.push(shadow);
  return { root, meshes };
}
