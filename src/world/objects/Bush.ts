import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { WorldMaterials } from "../../rendering/Materials";

export interface BushObject { root: TransformNode; meshes: Mesh[]; swayPhase: number }

export function createBush(scene: Scene, materials: WorldMaterials, x: number, z: number, variation: number): BushObject {
  const root = new TransformNode(`Bush_${variation}`, scene);
  root.position.set(x, 0, z);
  root.rotation.y = variation * 1.19;
  const meshes: Mesh[] = [];
  for (let i = 0; i < 4; i += 1) {
    const angle = i / 4 * Math.PI * 2 + variation * 0.4;
    const cluster = MeshBuilder.CreateSphere("BushCluster", { diameter: 0.88, segments: 9 }, scene);
    cluster.parent = root;
    cluster.position.set(Math.cos(angle) * 0.32, 0.42 + (i % 2) * 0.12, Math.sin(angle) * 0.32);
    cluster.scaling.set(1.05, 0.78, 0.92);
    cluster.material = i % 3 === 0 ? materials.foliage[2] : materials.bush;
    meshes.push(cluster);
  }
  const shadow = MeshBuilder.CreateDisc("BushContactShadow", { radius: 0.58, tessellation: 18 }, scene);
  shadow.parent = root;
  shadow.rotation.x = Math.PI / 2;
  shadow.position.y = 0.025;
  shadow.material = materials.contactShadow;
  meshes.push(shadow);
  return { root, meshes, swayPhase: variation * 0.67 };
}
