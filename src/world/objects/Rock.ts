import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { WorldMaterials } from "../../rendering/Materials";

export interface RockObject {
  root: TransformNode;
  mesh: Mesh;
  meshes: Mesh[];
  baseScale: number;
  radius: number;
  impact(strength: number): void;
  deplete(strength: number): void;
  updateHarvest(delta: number): void;
}

export function createRock(scene: Scene, materials: WorldMaterials, x: number, z: number, variation: number): RockObject {
  const root = new TransformNode(`Rock_${x}_${z}`, scene);
  root.position.set(x, 0, z);
  const visualRoot = new TransformNode("RockVisualRoot", scene);
  visualRoot.parent = root;
  visualRoot.rotation.set(0.08 * (variation % 3), variation * 1.37, -0.05 * (variation % 2));
  const mesh = MeshBuilder.CreateSphere("RockMain", { diameter: 1.4, segments: 10 }, scene);
  mesh.parent = visualRoot;
  mesh.position.y = 0.48;
  mesh.scaling.set(1.04 + (variation % 3) * 0.1, 0.62 + (variation % 4) * 0.06, 0.88);
  mesh.material = materials.rock[variation % materials.rock.length];
  const chip = MeshBuilder.CreateSphere("RockChip", { diameter: 0.58, segments: 8 }, scene);
  chip.parent = visualRoot;
  chip.position.set(0.66, 0.22, -0.25 + (variation % 2) * 0.42);
  chip.rotation.set(0.1, variation * 0.73, -0.08);
  chip.scaling.set(1, 0.68, 0.82);
  chip.material = materials.rock[(variation + 1) % materials.rock.length];
  const pebble = MeshBuilder.CreateSphere("RockPebble", { diameter: 0.28, segments: 8 }, scene);
  pebble.parent = visualRoot;
  pebble.position.set(-0.62, 0.11, 0.3);
  pebble.scaling.y = 0.65;
  pebble.material = materials.rock[(variation + 2) % materials.rock.length];
  const shadow = MeshBuilder.CreateDisc("RockContactShadow", { radius: 0.82, tessellation: 24 }, scene);
  shadow.parent = root;
  shadow.rotation.x = Math.PI / 2;
  shadow.position.y = 0.025;
  shadow.material = materials.contactShadow;
  shadow.isPickable = false;
  const chipStart = chip.position.clone();
  const pebbleStart = pebble.position.clone();
  let hitImpulse = 0;
  let depletionTime = -1;
  return {
    root,
    mesh,
    meshes: [mesh, chip, pebble, shadow],
    baseScale: 0.8 + (variation % 4) * 0.08,
    radius: 0.7,
    impact(strength: number): void { hitImpulse = Math.max(hitImpulse, strength); },
    deplete(strength: number): void {
      if (depletionTime >= 0) return;
      depletionTime = 0;
      hitImpulse = Math.max(hitImpulse, strength * 1.25);
    },
    updateHarvest(delta: number): void {
      hitImpulse = Math.max(0, hitImpulse - delta * 6.2);
      const kick = Math.sin(hitImpulse * Math.PI) * 0.035;
      visualRoot.position.y = Math.abs(kick) * 0.5;
      visualRoot.rotation.z += (kick - visualRoot.rotation.z) * Math.min(1, delta * 18);
      if (depletionTime < 0) return;
      depletionTime += delta;
      const t = Math.min(1, depletionTime / 0.72);
      const pop = Math.sin(Math.min(1, t * 1.8) * Math.PI) * 0.24;
      chip.position.set(chipStart.x + pop, chipStart.y + pop * 0.35, chipStart.z - pop * 0.5);
      pebble.position.set(pebbleStart.x - pop * 0.7, pebbleStart.y + pop * 0.22, pebbleStart.z + pop * 0.6);
      const settle = 1 - t * t;
      visualRoot.scaling.set(0.88 + settle * 0.12, Math.max(0.04, settle), 0.88 + settle * 0.12);
      if (t >= 1) root.setEnabled(false);
    },
  };
}
