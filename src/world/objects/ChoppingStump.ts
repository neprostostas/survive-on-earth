import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { WorldMaterials } from "../../rendering/Materials";

export interface ChoppingStumpObject {
  root: TransformNode;
  meshes: Mesh[];
}

/**
 * Home woodworking prop — low stump + axe handle silhouette for the chop station.
 */
export function createChoppingStump(
  scene: Scene,
  materials: WorldMaterials,
  x: number,
  z: number,
): ChoppingStumpObject {
  const root = new TransformNode("ChoppingStumpRoot", scene);
  root.position.set(x, 0, z);
  root.rotation.y = -0.55;
  const meshes: Mesh[] = [];

  const trunk = MeshBuilder.CreateCylinder(
    "ChopStumpBody",
    { height: 0.52, diameterTop: 0.72, diameterBottom: 0.86, tessellation: 12 },
    scene,
  );
  trunk.parent = root;
  trunk.position.y = 0.26;
  trunk.material = materials.trunk;
  meshes.push(trunk);

  const top = MeshBuilder.CreateCylinder(
    "ChopStumpTop",
    { height: 0.06, diameter: 0.7, tessellation: 14 },
    scene,
  );
  top.parent = root;
  top.position.y = 0.54;
  top.material = materials.wood;
  meshes.push(top);

  // Buried roots / chips ring
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2 + 0.2;
    const chip = MeshBuilder.CreateBox(
      "ChopStumpChip",
      { width: 0.18, height: 0.08, depth: 0.12 },
      scene,
    );
    chip.parent = root;
    chip.position.set(Math.cos(angle) * 0.42, 0.05, Math.sin(angle) * 0.42);
    chip.rotation.y = angle;
    chip.material = materials.wood;
    meshes.push(chip);
  }

  // Axe buried in the face
  const handle = MeshBuilder.CreateBox(
    "ChopStumpAxeHandle",
    { width: 0.07, height: 0.55, depth: 0.07 },
    scene,
  );
  handle.parent = root;
  handle.position.set(0.08, 0.72, 0.05);
  handle.rotation.z = 0.55;
  handle.rotation.x = -0.12;
  handle.material = materials.wood;
  meshes.push(handle);

  const blade = MeshBuilder.CreateBox(
    "ChopStumpAxeBlade",
    { width: 0.28, height: 0.12, depth: 0.06 },
    scene,
  );
  blade.parent = root;
  blade.position.set(0.22, 0.9, 0.06);
  blade.rotation.z = 0.55;
  blade.material = materials.metal;
  meshes.push(blade);

  const shadow = MeshBuilder.CreateDisc("ChopStumpShadow", { radius: 0.55, tessellation: 18 }, scene);
  shadow.parent = root;
  shadow.rotation.x = Math.PI / 2;
  shadow.position.y = 0.02;
  shadow.material = materials.contactShadow;
  meshes.push(shadow);

  for (const mesh of meshes) {
    mesh.isPickable = false;
    mesh.receiveShadows = true;
  }

  return { root, meshes };
}
