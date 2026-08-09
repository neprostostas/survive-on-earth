import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { WorldMaterials } from "../../rendering/Materials";

export interface TreeObject {
  root: TransformNode;
  foliageRoot: TransformNode;
  meshes: Mesh[];
  baseScale: number;
  radius: number;
  swayPhase: number;
}

export function createTree(scene: Scene, materials: WorldMaterials, x: number, z: number, variation: number): TreeObject {
  const root = new TransformNode(`Tree_${x}_${z}`, scene);
  root.position.set(x, 0, z);
  root.rotation.y = variation * 1.71;
  const foliageRoot = new TransformNode("TreeFoliageRoot", scene);
  foliageRoot.parent = root;
  const meshes: Mesh[] = [];
  const baseScale = 0.88 + (variation % 5) * 0.045;
  const trunkHeight = 3.75 + (variation % 3) * 0.16;
  const trunk = MeshBuilder.CreateCylinder("TreeTrunk", { height: trunkHeight, diameterTop: 0.28, diameterBottom: 0.62, tessellation: 9, subdivisions: 3 }, scene);
  trunk.position.y = trunkHeight / 2;
  trunk.parent = root;
  trunk.material = materials.trunk;
  meshes.push(trunk);
  for (let rootIndex = 0; rootIndex < 4; rootIndex += 1) {
    const angle = rootIndex / 4 * Math.PI * 2 + variation * 0.31;
    const flare = MeshBuilder.CreateCylinder("TreeRootFlare", { height: 0.95, diameterTop: 0.12, diameterBottom: 0.24, tessellation: 6 }, scene);
    flare.parent = root;
    flare.material = materials.trunk;
    flare.rotation.z = Math.PI / 2.35;
    flare.rotation.y = angle;
    flare.position.set(Math.cos(angle) * 0.28, 0.13, Math.sin(angle) * 0.28);
    meshes.push(flare);
  }
  const clusters = 7;
  for (let layer = 0; layer < clusters; layer += 1) {
    const angle = layer * 2.13 + variation * 0.77;
    const lowerCrown = layer < 4;
    const lateral = lowerCrown ? 0.52 : layer < 6 ? 0.27 : 0;
    const foliage = MeshBuilder.CreateSphere("TreeFoliageCluster", { diameter: 2, segments: 10 }, scene);
    foliage.position.set(
      Math.cos(angle) * lateral,
      lowerCrown ? 3.55 + (layer % 2) * 0.22 : layer < 6 ? 4.25 : 4.72,
      Math.sin(angle) * lateral,
    );
    foliage.rotation.y = angle;
    const width = lowerCrown ? 1.08 + (variation % 3) * 0.035 : layer < 6 ? 0.92 : 0.72;
    foliage.scaling.set(width, lowerCrown ? 0.82 : 0.76, width * 0.92);
    foliage.parent = foliageRoot;
    foliage.material = materials.foliage[(variation + layer) % materials.foliage.length];
    meshes.push(foliage);
  }
  const needleBed = MeshBuilder.CreateDisc("TreeNeedleBed", { radius: 0.78, tessellation: 18 }, scene);
  needleBed.rotation.x = Math.PI / 2;
  needleBed.position.y = 0.025;
  needleBed.parent = root;
  needleBed.material = materials.pineNeedles;
  meshes.push(needleBed);
  const shadow = MeshBuilder.CreateDisc("TreeContactShadow", { radius: 0.72, tessellation: 24 }, scene);
  shadow.rotation.x = Math.PI / 2;
  shadow.position.y = 0.031;
  shadow.parent = root;
  shadow.material = materials.contactShadow;
  shadow.isPickable = false;
  meshes.push(shadow);
  return { root, foliageRoot, meshes, baseScale, radius: 0.56, swayPhase: variation * 0.83 };
}
