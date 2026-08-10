import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";
import type { ItemId } from "../items/ItemId";
import { backpackExtraSlots, isBackpackCapableItemId } from "./BackpackTypes";

export type BackpackVisualPose = "worn" | "ground";

/**
 * Shared procedural backpack mesh factory for world Player, inventory preview, and ground loot.
 */
export class BackpackVisuals {
  private readonly fabric: StandardMaterial;
  private readonly fabricDark: StandardMaterial;
  private readonly strap: StandardMaterial;
  private readonly stitch: StandardMaterial;

  constructor(private readonly scene: Scene, materialPrefix = "BackpackVis") {
    this.fabric = this.mat(`${materialPrefix}Fabric`, new Color3(0.34, 0.28, 0.18), 0.06);
    this.fabricDark = this.mat(`${materialPrefix}FabricDark`, new Color3(0.24, 0.19, 0.12), 0.05);
    this.strap = this.mat(`${materialPrefix}Strap`, new Color3(0.20, 0.15, 0.10), 0.08);
    this.stitch = this.mat(`${materialPrefix}Stitch`, new Color3(0.42, 0.34, 0.22), 0.04);
  }

  /**
   * Build a Basic Backpack visual under parent. Returns root + mesh list for shadow casters.
   */
  createBasicBackpack(parent: TransformNode, pose: BackpackVisualPose, namePrefix: string): {
    readonly root: TransformNode;
    readonly meshes: Mesh[];
  } {
    const root = new TransformNode(`${namePrefix}:BasicBackpack`, this.scene);
    root.parent = parent;
    const meshes: Mesh[] = [];

    if (pose === "worn") {
      // Centered between shoulders, behind torso.
      root.position.set(0, 1.22, -0.28);
      root.rotation.set(-0.08, 0, 0);
      root.scaling.setAll(1);
    } else {
      // Slightly flattened lying pose for ground loot.
      root.position.set(0, 0.08, 0);
      root.rotation.set(1.15, 0.35, 0.1);
      root.scaling.setAll(0.95);
    }

    const part = (name: string, mesh: Mesh, material: StandardMaterial, pos: Vector3, rot?: Vector3): void => {
      mesh.name = `${namePrefix}:${name}`;
      mesh.material = material;
      mesh.parent = root;
      mesh.position.copyFrom(pos);
      if (rot) mesh.rotation.copyFrom(rot);
      mesh.receiveShadows = true;
      meshes.push(mesh);
    };

    const body = MeshBuilder.CreateBox(`${namePrefix}Body`, { width: 0.30, height: 0.38, depth: 0.16 }, this.scene);
    body.scaling.set(1, 1, 1);
    part("Body", body, this.fabric, new Vector3(0, 0, 0));

    const frontPocket = MeshBuilder.CreateBox(`${namePrefix}FrontPocket`, { width: 0.20, height: 0.14, depth: 0.05 }, this.scene);
    part("FrontPocket", frontPocket, this.fabricDark, new Vector3(0, -0.04, 0.10));

    const flap = MeshBuilder.CreateBox(`${namePrefix}Flap`, { width: 0.32, height: 0.10, depth: 0.17 }, this.scene);
    part("Flap", flap, this.fabricDark, new Vector3(0, 0.16, 0.02), new Vector3(0.35, 0, 0));

    const topRidge = MeshBuilder.CreateBox(`${namePrefix}TopRidge`, { width: 0.28, height: 0.04, depth: 0.12 }, this.scene);
    part("TopRidge", topRidge, this.stitch, new Vector3(0, 0.18, -0.01));

    for (const x of [-0.09, 0.09] as const) {
      const strap = MeshBuilder.CreateBox(`${namePrefix}Strap`, { width: 0.045, height: 0.42, depth: 0.035 }, this.scene);
      part(`Strap${x}`, strap, this.strap, new Vector3(x, 0.02, 0.12), new Vector3(-0.55, 0, 0));
    }

    const buckle = MeshBuilder.CreateBox(`${namePrefix}Buckle`, { width: 0.06, height: 0.035, depth: 0.02 }, this.scene);
    part("Buckle", buckle, this.stitch, new Vector3(0, 0.08, 0.12));

    return { root, meshes };
  }

  /** Equip visual visibility from backpack item id (null = hide). */
  static isRenderedBackpack(itemId: ItemId | null): itemId is ItemId {
    return itemId !== null && isBackpackCapableItemId(itemId) && backpackExtraSlots(itemId) > 0;
  }

  private mat(name: string, color: Color3, specular: number): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.specularColor.set(specular, specular, specular);
    material.specularPower = 22;
    return material;
  }
}

/**
 * Attaches / detaches equipped backpack presentation on a PlayerVisual-like bodyPivot parent.
 */
export class BackpackEquipPresentation {
  private readonly factory: BackpackVisuals;
  private readonly mount: TransformNode;
  private currentRoot: TransformNode | null = null;
  private currentMeshes: Mesh[] = [];
  private readonly namePrefix: string;

  constructor(scene: Scene, bodyPivot: TransformNode, namePrefix: string) {
    this.factory = new BackpackVisuals(scene, namePrefix);
    this.mount = bodyPivot;
    this.namePrefix = namePrefix;
  }

  get meshes(): readonly Mesh[] { return this.currentMeshes; }

  setEquippedItemId(itemId: ItemId | null): void {
    this.clear();
    if (!BackpackVisuals.isRenderedBackpack(itemId)) return;
    // M18 only has basic-backpack; future ids still use factory when added.
    const built = this.factory.createBasicBackpack(this.mount, "worn", this.namePrefix);
    this.currentRoot = built.root;
    this.currentMeshes = built.meshes;
  }

  clear(): void {
    if (this.currentRoot) {
      this.currentRoot.dispose();
      this.currentRoot = null;
    }
    this.currentMeshes = [];
  }
}
