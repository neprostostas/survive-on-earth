import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";

export class PlayerVisual {
  readonly root: TransformNode;
  readonly bodyPivot: TransformNode;
  readonly leftArm: TransformNode;
  readonly rightArm: TransformNode;
  readonly leftLeg: TransformNode;
  readonly rightLeg: TransformNode;
  readonly meshes: Mesh[] = [];
  private readonly baseHeight = 1.8;

  constructor(scene: Scene) {
    this.root = new TransformNode("PlayerRoot", scene);
    this.bodyPivot = new TransformNode("BodyPivot", scene);
    this.bodyPivot.parent = this.root;

    const skin = this.material(scene, "playerSkin", new Color3(0.56, 0.36, 0.25));
    const shirt = this.material(scene, "playerShirt", new Color3(0.18, 0.29, 0.25));
    const jacket = this.material(scene, "playerJacket", new Color3(0.23, 0.34, 0.28));
    const trousers = this.material(scene, "playerTrousers", new Color3(0.16, 0.18, 0.17));
    const boots = this.material(scene, "playerBoots", new Color3(0.10, 0.08, 0.06));
    const leather = this.material(scene, "playerLeather", new Color3(0.20, 0.13, 0.08));
    const hair = this.material(scene, "playerHair", new Color3(0.12, 0.075, 0.045));

    const torso = MeshBuilder.CreateCapsule("Body", { height: 0.72, radius: 0.255, tessellation: 10 }, scene);
    torso.scaling.set(1.08, 1, 0.8);
    this.part("Body", torso, shirt, this.bodyPivot, new Vector3(0, 1.2, 0));
    const chest = MeshBuilder.CreateBox("JacketChest", { width: 0.48, height: 0.38, depth: 0.12 }, scene);
    this.part("JacketChest", chest, jacket, this.bodyPivot, new Vector3(0, 1.32, 0.19));
    const pelvis = MeshBuilder.CreateCapsule("Pelvis", { height: 0.31, radius: 0.22, tessellation: 9 }, scene);
    pelvis.rotation.z = Math.PI / 2;
    this.part("Pelvis", pelvis, trousers, this.bodyPivot, new Vector3(0, 0.91, 0));
    const neck = MeshBuilder.CreateCylinder("Neck", { height: 0.18, diameter: 0.16, tessellation: 9 }, scene);
    this.part("Neck", neck, skin, this.bodyPivot, new Vector3(0, 1.51, 0));
    const head = MeshBuilder.CreateSphere("Head", { diameter: 0.38, segments: 10 }, scene);
    head.scaling.set(0.92, 1.08, 0.94);
    this.part("Head", head, skin, this.bodyPivot, new Vector3(0, 1.69, 0));
    const hairCap = MeshBuilder.CreateSphere("Hair", { diameter: 0.39, segments: 9, slice: 0.55 }, scene);
    hairCap.scaling.set(0.93, 0.58, 0.95);
    this.part("Hair", hairCap, hair, this.bodyPivot, new Vector3(0, 1.82, -0.015));
    for (const x of [-0.29, 0.29]) {
      const shoulder = MeshBuilder.CreateSphere("Shoulder", { diameter: 0.23, segments: 8 }, scene);
      shoulder.scaling.set(1, 0.82, 0.9);
      this.part("Shoulder", shoulder, jacket, this.bodyPivot, new Vector3(x, 1.4, 0));
    }
    const belt = MeshBuilder.CreateBox("Belt", { width: 0.45, height: 0.075, depth: 0.3 }, scene);
    this.part("Belt", belt, leather, this.bodyPivot, new Vector3(0, 0.99, 0));
    const backpack = MeshBuilder.CreateBox("Backpack", { width: 0.36, height: 0.48, depth: 0.18 }, scene);
    backpack.scaling.set(1, 1, 0.9);
    this.part("Backpack", backpack, leather, this.bodyPivot, new Vector3(0, 1.25, -0.24));
    for (const x of [-0.15, 0.15]) {
      const strap = MeshBuilder.CreateBox("BackpackStrap", { width: 0.055, height: 0.48, depth: 0.045 }, scene);
      this.part("BackpackStrap", strap, leather, this.bodyPivot, new Vector3(x, 1.27, 0.205));
    }

    this.leftArm = this.limb(scene, "LeftArm", -0.33, 1.4, skin, shirt, false);
    this.rightArm = this.limb(scene, "RightArm", 0.33, 1.4, skin, shirt, false);
    this.leftLeg = this.limb(scene, "LeftLeg", -0.13, 0.88, boots, trousers, true);
    this.rightLeg = this.limb(scene, "RightLeg", 0.13, 0.88, boots, trousers, true);
  }

  setHeight(height: number): void {
    this.root.scaling.setAll(height / this.baseHeight);
  }

  private limb(scene: Scene, name: string, x: number, y: number, endMaterial: StandardMaterial, upperMaterial: StandardMaterial, leg: boolean): TransformNode {
    const pivot = new TransformNode(`${name}Pivot`, scene);
    pivot.parent = this.bodyPivot;
    pivot.position.set(x, y, 0);
    const upperLength = leg ? 0.43 : 0.38;
    const lowerLength = leg ? 0.43 : 0.35;
    const radius = leg ? 0.105 : 0.085;
    const upper = MeshBuilder.CreateCapsule(`${name}Upper`, { height: upperLength, radius, tessellation: 7 }, scene);
    this.part(`${name}Upper`, upper, upperMaterial, pivot, new Vector3(0, -upperLength / 2, 0));
    const lower = MeshBuilder.CreateCapsule(`${name}Lower`, { height: lowerLength, radius: radius * 0.86, tessellation: 7 }, scene);
    this.part(`${name}Lower`, lower, endMaterial, pivot, new Vector3(0, -upperLength - lowerLength / 2 + 0.04, leg ? 0.015 : 0));
    if (leg) {
      const foot = MeshBuilder.CreateBox(`${name}Foot`, { width: 0.19, height: 0.13, depth: 0.31 }, scene);
      this.part(`${name}Foot`, foot, endMaterial, pivot, new Vector3(0, -upperLength - lowerLength + 0.06, 0.09));
    } else {
      const hand = MeshBuilder.CreateSphere(`${name}Hand`, { diameter: 0.17, segments: 7 }, scene);
      this.part(`${name}Hand`, hand, endMaterial, pivot, new Vector3(0, -upperLength - lowerLength + 0.05, 0));
    }
    return pivot;
  }

  private part(name: string, mesh: Mesh, material: StandardMaterial, parent: TransformNode, position: Vector3): void {
    mesh.name = name;
    mesh.material = material;
    mesh.parent = parent;
    mesh.position.copyFrom(position);
    mesh.receiveShadows = true;
    this.meshes.push(mesh);
  }

  private material(scene: Scene, name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, scene);
    material.diffuseColor = color;
    material.specularColor.set(0.05, 0.05, 0.05);
    material.specularPower = 32;
    return material;
  }
}
