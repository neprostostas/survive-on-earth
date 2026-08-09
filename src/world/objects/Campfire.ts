import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { WorldMaterials } from "../../rendering/Materials";

export class CampfireObject {
  readonly root: TransformNode;
  readonly meshes: Mesh[] = [];
  readonly shadowCasters: Mesh[] = [];
  private readonly flames: Mesh[] = [];
  private readonly smoke: Mesh[] = [];
  private readonly light: PointLight;
  private time = 0;

  constructor(scene: Scene, materials: WorldMaterials, x: number, z: number) {
    this.root = new TransformNode("CampfireRoot", scene);
    this.root.position.set(x, 0, z);
    for (let i = 0; i < 9; i += 1) {
      const angle = i / 9 * Math.PI * 2;
      const stone = MeshBuilder.CreateSphere("FireStone", { diameter: 0.36, segments: 8 }, scene);
      stone.parent = this.root;
      stone.position.set(Math.cos(angle) * 0.58, 0.17, Math.sin(angle) * 0.58);
      stone.scaling.set(1.15, 0.72, 0.92);
      stone.rotation.y = angle;
      stone.material = materials.rock[i % materials.rock.length];
      this.meshes.push(stone);
      this.shadowCasters.push(stone);
    }
    for (let i = 0; i < 3; i += 1) {
      const log = MeshBuilder.CreateCylinder("CampfireLog", { height: 1.05, diameter: 0.18, tessellation: 8 }, scene);
      log.parent = this.root;
      log.position.y = 0.24 + i * 0.035;
      log.rotation.z = Math.PI / 2;
      log.rotation.y = i / 3 * Math.PI;
      log.material = materials.trunk;
      this.meshes.push(log);
      this.shadowCasters.push(log);
    }
    const ember = MeshBuilder.CreateCylinder("CampfireEmbers", { height: 0.09, diameter: 0.72, tessellation: 14 }, scene);
    ember.parent = this.root;
    ember.position.y = 0.09;
    ember.material = materials.ember;
    this.meshes.push(ember);
    for (let i = 0; i < 4; i += 1) {
      const flame = MeshBuilder.CreateCylinder("StylizedFlame", { height: 0.72 - i * 0.08, diameterTop: 0, diameterBottom: 0.34 - i * 0.035, tessellation: 7 }, scene);
      flame.parent = this.root;
      flame.position.set((i % 2 ? 1 : -1) * 0.09, 0.5 + (i % 3) * 0.07, (i < 2 ? 1 : -1) * 0.07);
      flame.material = materials.fire[i % materials.fire.length];
      flame.isPickable = false;
      this.flames.push(flame);
      this.meshes.push(flame);
    }
    for (let i = 0; i < 4; i += 1) {
      const puff = MeshBuilder.CreateSphere("SmokePuff", { diameter: 0.34, segments: 7 }, scene);
      puff.parent = this.root;
      puff.material = materials.smoke;
      puff.isPickable = false;
      this.smoke.push(puff);
      this.meshes.push(puff);
    }
    const shadow = MeshBuilder.CreateDisc("CampfireContactShadow", { radius: 0.78, tessellation: 24 }, scene);
    shadow.parent = this.root;
    shadow.rotation.x = Math.PI / 2;
    shadow.position.y = 0.024;
    shadow.material = materials.contactShadow;
    this.meshes.push(shadow);
    this.light = new PointLight("CampfireWarmth", new Vector3(x, 1.1, z), scene);
    this.light.diffuse = new Color3(1, 0.45, 0.12);
    this.light.range = 4.5;
    this.light.intensity = 0.14;
  }

  update(delta: number, complexity: number): void {
    this.time += delta;
    this.flames.forEach((flame, index) => {
      const wave = Math.sin(this.time * (5.1 + index * 0.37) + index * 1.7);
      flame.scaling.set(0.92 + wave * 0.08, 0.9 + wave * 0.14, 0.92 - wave * 0.05);
      flame.rotation.y = this.time * (0.22 + index * 0.04) + index;
      flame.setEnabled(index < Math.ceil(4 * complexity));
    });
    this.smoke.forEach((puff, index) => {
      const cycle = (this.time * (0.16 + index * 0.012) + index * 0.24) % 1;
      puff.position.set(Math.sin(this.time * 0.7 + index) * 0.14 * cycle, 0.85 + cycle * 2.1, Math.cos(this.time * 0.55 + index) * 0.1 * cycle);
      const scale = 0.45 + cycle * 1.1;
      puff.scaling.setAll(scale);
      puff.visibility = Math.sin(cycle * Math.PI) * 0.8;
      puff.setEnabled(index < Math.ceil(4 * complexity));
    });
    this.light.intensity = (0.11 + Math.sin(this.time * 7.3) * 0.025) * complexity;
  }
}
