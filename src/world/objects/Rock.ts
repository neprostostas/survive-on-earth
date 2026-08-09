import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { WorldMaterials } from "../../rendering/Materials";

export interface RockObject { root: TransformNode; mesh: Mesh; meshes: Mesh[]; baseScale: number; radius: number }

export function createRock(scene: Scene, materials: WorldMaterials, x: number, z: number, variation: number): RockObject {
  const root = new TransformNode(`Rock_${x}_${z}`, scene);
  root.position.set(x, 0, z);
  root.rotation.set(0.08 * (variation % 3), variation * 1.37, -0.05 * (variation % 2));
  const mesh = MeshBuilder.CreateSphere("RockMain", { diameter: 1.4, segments: 10 }, scene);
  mesh.parent = root;
  mesh.position.y = 0.48;
  mesh.scaling.set(1.04 + (variation % 3) * 0.1, 0.62 + (variation % 4) * 0.06, 0.88);
  mesh.material = materials.rock[variation % materials.rock.length];
  const chip = MeshBuilder.CreateSphere("RockChip", { diameter: 0.58, segments: 8 }, scene);
  chip.parent = root;
  chip.position.set(0.66, 0.22, -0.25 + (variation % 2) * 0.42);
  chip.rotation.set(0.1, variation * 0.73, -0.08);
  chip.scaling.set(1, 0.68, 0.82);
  chip.material = materials.rock[(variation + 1) % materials.rock.length];
  const pebble = MeshBuilder.CreateSphere("RockPebble", { diameter: 0.28, segments: 8 }, scene);
  pebble.parent = root;
  pebble.position.set(-0.62, 0.11, 0.3);
  pebble.scaling.y = 0.65;
  pebble.material = materials.rock[(variation + 2) % materials.rock.length];
  const shadow = MeshBuilder.CreateDisc("RockContactShadow", { radius: 0.82, tessellation: 24 }, scene);
  shadow.parent = root;
  shadow.rotation.x = Math.PI / 2;
  shadow.position.y = 0.025;
  shadow.material = materials.contactShadow;
  shadow.isPickable = false;
  return { root, mesh, meshes: [mesh, chip, pebble, shadow], baseScale: 0.8 + (variation % 4) * 0.08, radius: 0.7 };
}
