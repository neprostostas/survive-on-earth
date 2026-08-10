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
import { EQUIPMENT_SLOT_IDS } from "./EquipmentTypes";

/**
 * Procedural apparel meshes attached to a PlayerVisual hierarchy.
 * Shared by world character and inventory preview — single geometry source.
 */
export class EquipmentApparelVisuals {
  readonly meshes: readonly Mesh[];
  private readonly groups: Readonly<Record<EquipmentSlotId, readonly Mesh[]>>;
  private readonly mutableMeshes: Mesh[] = [];

  constructor(
    private readonly scene: Scene,
    private readonly visual: PlayerVisual,
    private readonly namePrefix: string,
  ) {
    const hatMaterial = this.material(`${namePrefix}DadHat`, new Color3(0.29, 0.39, 0.24));
    const shirtMaterial = this.material(`${namePrefix}Shirt`, new Color3(0.22, 0.34, 0.38));
    const pantsMaterial = this.material(`${namePrefix}CargoPants`, new Color3(0.27, 0.31, 0.20));
    const shoeMaterial = this.material(`${namePrefix}Sneakers`, new Color3(0.52, 0.50, 0.43));

    this.groups = Object.freeze({
      head: this.capture(() => { this.createHat(hatMaterial); }),
      torso: this.capture(() => { this.createShirt(shirtMaterial); }),
      legs: this.capture(() => { this.createPants(pantsMaterial); }),
      feet: this.capture(() => { this.createSneakers(shoeMaterial); }),
    });
    this.meshes = Object.freeze([...this.mutableMeshes]);
    for (const id of EQUIPMENT_SLOT_IDS) this.setSlotEnabled(id, false);
  }

  /** Projection only — reads production PlayerEquipment snapshot. */
  syncFrom(equipment: PlayerEquipment): void {
    for (const slot of equipment.getSlots()) {
      this.setSlotEnabled(slot.id, slot.stack !== null);
    }
  }

  setSlotEnabled(slot: EquipmentSlotId, enabled: boolean): void {
    for (const mesh of this.groups[slot]) mesh.setEnabled(enabled);
  }

  private createHat(material: StandardMaterial): void {
    const root = this.root(`${this.namePrefix}DadHat`, this.visual.bodyPivot);
    const crown = MeshBuilder.CreateCylinder(`${this.namePrefix}DadHatCrown`, {
      height: 0.16, diameterTop: 0.27, diameterBottom: 0.37, tessellation: 14,
    }, this.scene);
    this.part(crown, material, root, new Vector3(0, 1.89, 0));
    const top = MeshBuilder.CreateSphere(`${this.namePrefix}DadHatTop`, { diameter: 0.29, segments: 12, slice: 0.5 }, this.scene);
    top.scaling.y = 0.42;
    this.part(top, material, root, new Vector3(0, 1.99, 0));
    const brim = MeshBuilder.CreateBox(`${this.namePrefix}DadHatBrim`, { width: 0.34, height: 0.035, depth: 0.27 }, this.scene);
    brim.rotation.x = -0.1;
    this.part(brim, material, root, new Vector3(0, 1.84, 0.17));
  }

  private createShirt(material: StandardMaterial): void {
    const root = this.root(`${this.namePrefix}Shirt`, this.visual.bodyPivot);
    const torso = MeshBuilder.CreateCapsule(`${this.namePrefix}ShirtTorso`, {
      height: 0.68, radius: 0.235, tessellation: 12,
    }, this.scene);
    torso.scaling.set(1.07, 1, 0.83);
    this.part(torso, material, root, new Vector3(0, 1.19, 0.005));
    for (const [name, arm] of [["Left", this.visual.leftArm], ["Right", this.visual.rightArm]] as const) {
      const sleeve = MeshBuilder.CreateCapsule(`${this.namePrefix}Shirt${name}Sleeve`, {
        height: 0.23, radius: 0.087, tessellation: 9,
      }, this.scene);
      this.part(sleeve, material, arm, new Vector3(0, -0.11, 0));
    }
  }

  private createPants(material: StandardMaterial): void {
    this.root(`${this.namePrefix}CargoPants`, this.visual.bodyPivot);
    for (const [name, leg] of [["Left", this.visual.leftLeg], ["Right", this.visual.rightLeg]] as const) {
      const upper = MeshBuilder.CreateCapsule(`${this.namePrefix}CargoPants${name}Upper`, {
        height: 0.43, radius: 0.104, tessellation: 9,
      }, this.scene);
      this.part(upper, material, leg, new Vector3(0, -0.215, 0));
      const lower = MeshBuilder.CreateCapsule(`${this.namePrefix}CargoPants${name}Lower`, {
        height: 0.39, radius: 0.091, tessellation: 9,
      }, this.scene);
      this.part(lower, material, leg, new Vector3(0, -0.605, 0.015));
      const pocket = MeshBuilder.CreateBox(`${this.namePrefix}CargoPants${name}Pocket`, {
        width: 0.055, height: 0.16, depth: 0.15,
      }, this.scene);
      this.part(pocket, material, leg, new Vector3(name === "Left" ? -0.095 : 0.095, -0.3, 0));
    }
  }

  private createSneakers(material: StandardMaterial): void {
    this.root(`${this.namePrefix}Sneakers`, this.visual.bodyPivot);
    for (const [name, leg] of [["Left", this.visual.leftLeg], ["Right", this.visual.rightLeg]] as const) {
      const shoe = MeshBuilder.CreateBox(`${this.namePrefix}Sneakers${name}`, {
        width: 0.205, height: 0.145, depth: 0.34,
      }, this.scene);
      shoe.rotation.x = -0.04;
      this.part(shoe, material, leg, new Vector3(0, -0.80, 0.105));
    }
  }

  private root(name: string, parent: TransformNode): TransformNode {
    const node = new TransformNode(name, this.scene);
    node.parent = parent;
    return node;
  }

  private capture(build: () => void): readonly Mesh[] {
    const first = this.mutableMeshes.length;
    build();
    return Object.freeze(this.mutableMeshes.slice(first));
  }

  private part(mesh: Mesh, material: StandardMaterial, parent: TransformNode, position: Vector3): void {
    mesh.material = material;
    mesh.parent = parent;
    mesh.position.copyFrom(position);
    mesh.receiveShadows = true;
    mesh.isPickable = false;
    this.mutableMeshes.push(mesh);
  }

  private material(name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.specularColor.set(0.04, 0.04, 0.04);
    material.specularPower = 24;
    return material;
  }
}
