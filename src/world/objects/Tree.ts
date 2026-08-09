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
  impact(strength: number): void;
  deplete(playerX: number, playerZ: number, strength: number): void;
  updateHarvest(delta: number): void;
}

export function createTree(scene: Scene, materials: WorldMaterials, x: number, z: number, variation: number): TreeObject {
  const root = new TransformNode(`Tree_${x}_${z}`, scene);
  root.position.set(x, 0, z);
  const depletionPivot = new TransformNode("TreeDepletionPivot", scene);
  depletionPivot.parent = root;
  const visualRoot = new TransformNode("TreeVisualRoot", scene);
  visualRoot.parent = depletionPivot;
  visualRoot.rotation.y = variation * 1.71;
  const foliageRoot = new TransformNode("TreeFoliageRoot", scene);
  foliageRoot.parent = visualRoot;
  const meshes: Mesh[] = [];
  const baseScale = 0.88 + (variation % 5) * 0.045;
  const trunkHeight = 3.75 + (variation % 3) * 0.16;
  const trunk = MeshBuilder.CreateCylinder("TreeTrunk", { height: trunkHeight, diameterTop: 0.28, diameterBottom: 0.62, tessellation: 9, subdivisions: 3 }, scene);
  trunk.position.y = trunkHeight / 2;
  trunk.parent = visualRoot;
  trunk.material = materials.trunk;
  meshes.push(trunk);
  for (let rootIndex = 0; rootIndex < 4; rootIndex += 1) {
    const angle = rootIndex / 4 * Math.PI * 2 + variation * 0.31;
    const flare = MeshBuilder.CreateCylinder("TreeRootFlare", { height: 0.95, diameterTop: 0.12, diameterBottom: 0.24, tessellation: 6 }, scene);
    flare.parent = visualRoot;
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
    const lateral = lowerCrown ? 0.3 + (layer % 3) * 0.13 : layer < 6 ? 0.16 + (layer % 2) * 0.11 : 0.04;
    const foliage = MeshBuilder.CreateSphere("TreeFoliageCluster", { diameter: 2, segments: 10 }, scene);
    foliage.position.set(
      Math.cos(angle) * lateral,
      lowerCrown ? 3.42 + (layer % 3) * 0.17 + ((variation + layer) % 2) * 0.1 : layer < 6 ? 4.08 + (layer % 2) * 0.2 : 4.55,
      Math.sin(angle) * lateral,
    );
    foliage.rotation.set(0.05 * Math.sin(angle), angle, 0.045 * Math.cos(angle));
    const width = lowerCrown ? 0.98 + ((variation + layer) % 3) * 0.07 : layer < 6 ? 0.84 + (layer % 2) * 0.06 : 0.67;
    foliage.scaling.set(width, lowerCrown ? 0.72 + (layer % 2) * 0.09 : 0.69, width * (0.78 + (layer % 3) * 0.07));
    foliage.parent = foliageRoot;
    foliage.material = materials.foliage[(variation + layer) % materials.foliage.length];
    meshes.push(foliage);
  }
  const needleBed = MeshBuilder.CreateDisc("TreeNeedleBed", { radius: 0.78, tessellation: 18 }, scene);
  needleBed.rotation.x = Math.PI / 2;
  needleBed.position.y = 0.025;
  needleBed.parent = visualRoot;
  needleBed.material = materials.pineNeedles;
  meshes.push(needleBed);
  const shadow = MeshBuilder.CreateDisc("TreeContactShadow", { radius: 0.72, tessellation: 24 }, scene);
  shadow.rotation.x = Math.PI / 2;
  shadow.position.y = 0.031;
  shadow.parent = root;
  shadow.material = materials.contactShadow;
  shadow.isPickable = false;
  meshes.push(shadow);
  let hitImpulse = 0;
  let depletionTime = -1;
  let depletionStrength = 1;
  return {
    root,
    foliageRoot,
    meshes,
    baseScale,
    radius: 0.56,
    swayPhase: variation * 0.83,
    impact(strength: number): void { hitImpulse = Math.max(hitImpulse, strength); },
    deplete(playerX: number, playerZ: number, strength: number): void {
      if (depletionTime >= 0) return;
      const awayX = root.position.x - playerX;
      const awayZ = root.position.z - playerZ;
      depletionPivot.rotation.y = Math.atan2(awayX, awayZ);
      depletionTime = 0;
      depletionStrength = strength;
      hitImpulse = Math.max(hitImpulse, strength * 1.35);
    },
    updateHarvest(delta: number): void {
      hitImpulse = Math.max(0, hitImpulse - delta * 4.8);
      const kick = Math.sin(hitImpulse * Math.PI) * 0.045 * depletionStrength;
      visualRoot.rotation.x = kick;
      visualRoot.rotation.z = -kick * 0.7;
      if (depletionTime < 0) return;
      depletionTime += delta;
      const t = Math.min(1, depletionTime / 1.12);
      const eased = t * t * (3 - 2 * t);
      depletionPivot.rotation.x = eased * 1.48;
      if (t >= 1) root.setEnabled(false);
    },
  };
}
