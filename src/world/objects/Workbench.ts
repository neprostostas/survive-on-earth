import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { WorldMaterials } from "../../rendering/Materials";

export interface WorkbenchObject {
  root: TransformNode;
  meshes: Mesh[];
}

/**
 * Low LDOE-style table/workbench: thick top, legs, tools silhouette.
 * Pure presentation — interactables stay separate.
 */
export function createWorkbench(scene: Scene, materials: WorldMaterials, x: number, z: number): WorkbenchObject {
  const root = new TransformNode("WorkbenchRoot", scene);
  root.position.set(x, 0, z);
  root.rotation.y = 0.35;
  const meshes: Mesh[] = [];

  const top = MeshBuilder.CreateBox("WorkbenchTop", { width: 1.35, height: 0.12, depth: 0.72 }, scene);
  top.parent = root;
  top.position.set(0, 0.82, 0);
  top.material = materials.wood;
  meshes.push(top);

  const apron = MeshBuilder.CreateBox("WorkbenchApron", { width: 1.28, height: 0.1, depth: 0.64 }, scene);
  apron.parent = root;
  apron.position.set(0, 0.72, 0);
  apron.material = materials.wood;
  meshes.push(apron);

  for (const [sx, sz] of [[-0.55, -0.26], [0.55, -0.26], [-0.55, 0.26], [0.55, 0.26]] as const) {
    const leg = MeshBuilder.CreateBox("WorkbenchLeg", { width: 0.1, height: 0.72, depth: 0.1 }, scene);
    leg.parent = root;
    leg.position.set(sx, 0.36, sz);
    leg.material = materials.wood;
    meshes.push(leg);
  }

  // Rear shelf / backboard
  const backboard = MeshBuilder.CreateBox("WorkbenchBack", { width: 1.3, height: 0.38, depth: 0.08 }, scene);
  backboard.parent = root;
  backboard.position.set(0, 1.08, -0.28);
  backboard.material = materials.wood;
  meshes.push(backboard);

  // Metal vise / clamp silhouette
  const clampBase = MeshBuilder.CreateBox("WorkbenchClamp", { width: 0.22, height: 0.1, depth: 0.22 }, scene);
  clampBase.parent = root;
  clampBase.position.set(0.42, 0.92, 0.12);
  clampBase.material = materials.metal;
  meshes.push(clampBase);
  const clampJaw = MeshBuilder.CreateBox("WorkbenchClampJaw", { width: 0.08, height: 0.18, depth: 0.14 }, scene);
  clampJaw.parent = root;
  clampJaw.position.set(0.42, 1.02, 0.18);
  clampJaw.material = materials.metal;
  meshes.push(clampJaw);

  // Tool rack bars
  for (let i = 0; i < 3; i += 1) {
    const tool = MeshBuilder.CreateBox(`WorkbenchTool${i}`, { width: 0.06, height: 0.28, depth: 0.06 }, scene);
    tool.parent = root;
    tool.position.set(-0.4 + i * 0.22, 1.12, -0.22);
    tool.rotation.z = 0.15 * (i - 1);
    tool.material = materials.metal;
    meshes.push(tool);
  }

  const shadow = MeshBuilder.CreateDisc("WorkbenchContactShadow", { radius: 0.78, tessellation: 22 }, scene);
  shadow.parent = root;
  shadow.rotation.x = Math.PI / 2;
  shadow.position.y = 0.02;
  shadow.scaling.set(1.2, 1, 0.85);
  shadow.material = materials.contactShadow;
  meshes.push(shadow);

  for (const mesh of meshes) {
    mesh.isPickable = false;
    mesh.receiveShadows = true;
  }

  return { root, meshes };
}
