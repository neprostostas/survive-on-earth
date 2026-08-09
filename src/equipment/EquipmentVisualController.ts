import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { PlayerVisual } from "../player/PlayerVisual";
import type { EquipmentSlotId } from "./EquipmentTypes";
import type { PlayerEquipment } from "./PlayerEquipment";

export class EquipmentVisualController {
  readonly meshes: readonly Mesh[];
  private readonly groups: Readonly<Record<EquipmentSlotId, readonly Mesh[]>>;
  private readonly mutableMeshes: Mesh[] = [];

  constructor(scene: Scene, visual: PlayerVisual, equipment: PlayerEquipment) {
    const hatMaterial = this.material(scene, "EquippedDadHatMaterial", new Color3(0.29, 0.39, 0.24));
    const shirtMaterial = this.material(scene, "EquippedShirtMaterial", new Color3(0.22, 0.34, 0.38));
    const pantsMaterial = this.material(scene, "EquippedCargoPantsMaterial", new Color3(0.27, 0.31, 0.20));
    const shoeMaterial = this.material(scene, "EquippedSneakersMaterial", new Color3(0.52, 0.50, 0.43));

    this.groups = Object.freeze({
      head: this.capture(() => { this.createHat(scene, visual, hatMaterial); }),
      torso: this.capture(() => { this.createShirt(scene, visual, shirtMaterial); }),
      legs: this.capture(() => { this.createPants(scene, visual, pantsMaterial); }),
      feet: this.capture(() => { this.createSneakers(scene, visual, shoeMaterial); }),
    });
    this.meshes = Object.freeze([...this.mutableMeshes]);
    for (const slot of equipment.getSlots()) this.setSlotEnabled(slot.id, slot.stack !== null);
    equipment.subscribe((change) => { this.setSlotEnabled(change.slot, change.stack !== null); });
  }

  private createHat(scene: Scene, visual: PlayerVisual, material: StandardMaterial): TransformNode {
    const root = this.root(scene, "EquippedDadHat", visual.bodyPivot);
    const crown = MeshBuilder.CreateCylinder("EquippedDadHatCrown", { height: 0.16, diameterTop: 0.27, diameterBottom: 0.37, tessellation: 14 }, scene);
    this.part(crown, material, root, new Vector3(0, 1.89, 0));
    const top = MeshBuilder.CreateSphere("EquippedDadHatTop", { diameter: 0.29, segments: 12, slice: 0.5 }, scene);
    top.scaling.y = 0.42;
    this.part(top, material, root, new Vector3(0, 1.99, 0));
    const brim = MeshBuilder.CreateBox("EquippedDadHatBrim", { width: 0.34, height: 0.035, depth: 0.27 }, scene);
    brim.rotation.x = -0.1;
    this.part(brim, material, root, new Vector3(0, 1.84, 0.17));
    return root;
  }

  private createShirt(scene: Scene, visual: PlayerVisual, material: StandardMaterial): TransformNode {
    const root = this.root(scene, "EquippedShirt", visual.bodyPivot);
    const torso = MeshBuilder.CreateCapsule("EquippedShirtTorso", { height: 0.68, radius: 0.235, tessellation: 12 }, scene);
    torso.scaling.set(1.07, 1, 0.83);
    this.part(torso, material, root, new Vector3(0, 1.19, 0.005));
    for (const [name, arm] of [["Left", visual.leftArm], ["Right", visual.rightArm]] as const) {
      const sleeve = MeshBuilder.CreateCapsule(`EquippedShirt${name}Sleeve`, { height: 0.23, radius: 0.087, tessellation: 9 }, scene);
      this.part(sleeve, material, arm, new Vector3(0, -0.11, 0));
    }
    return root;
  }

  private createPants(scene: Scene, visual: PlayerVisual, material: StandardMaterial): TransformNode {
    const root = this.root(scene, "EquippedCargoPants", visual.bodyPivot);
    for (const [name, leg] of [["Left", visual.leftLeg], ["Right", visual.rightLeg]] as const) {
      const upper = MeshBuilder.CreateCapsule(`EquippedCargoPants${name}Upper`, { height: 0.43, radius: 0.104, tessellation: 9 }, scene);
      this.part(upper, material, leg, new Vector3(0, -0.215, 0));
      const lower = MeshBuilder.CreateCapsule(`EquippedCargoPants${name}Lower`, { height: 0.39, radius: 0.091, tessellation: 9 }, scene);
      this.part(lower, material, leg, new Vector3(0, -0.605, 0.015));
      const pocket = MeshBuilder.CreateBox(`EquippedCargoPants${name}Pocket`, { width: 0.055, height: 0.16, depth: 0.15 }, scene);
      this.part(pocket, material, leg, new Vector3(name === "Left" ? -0.095 : 0.095, -0.3, 0));
    }
    return root;
  }

  private createSneakers(scene: Scene, visual: PlayerVisual, material: StandardMaterial): TransformNode {
    const root = this.root(scene, "EquippedSneakers", visual.bodyPivot);
    for (const [name, leg] of [["Left", visual.leftLeg], ["Right", visual.rightLeg]] as const) {
      const shoe = MeshBuilder.CreateBox(`EquippedSneakers${name}`, { width: 0.205, height: 0.145, depth: 0.34 }, scene);
      shoe.rotation.x = -0.04;
      this.part(shoe, material, leg, new Vector3(0, -0.80, 0.105));
    }
    return root;
  }

  private root(scene: Scene, name: string, parent: TransformNode): TransformNode {
    const root = new TransformNode(name, scene);
    root.parent = parent;
    return root;
  }

  private capture(build: () => void): readonly Mesh[] {
    const first = this.mutableMeshes.length;
    build();
    return Object.freeze(this.mutableMeshes.slice(first));
  }

  private setSlotEnabled(slot: EquipmentSlotId, enabled: boolean): void {
    for (const mesh of this.groups[slot]) mesh.setEnabled(enabled);
  }

  private part(mesh: Mesh, material: StandardMaterial, parent: TransformNode, position: Vector3): void {
    mesh.material = material;
    mesh.parent = parent;
    mesh.position.copyFrom(position);
    mesh.receiveShadows = true;
    mesh.isPickable = false;
    this.mutableMeshes.push(mesh);
  }

  private material(scene: Scene, name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, scene);
    material.diffuseColor = color;
    material.specularColor.set(0.04, 0.04, 0.04);
    material.specularPower = 24;
    return material;
  }
}
