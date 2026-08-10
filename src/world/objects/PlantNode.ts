import { Color3 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

/** Procedural low-poly plant cluster (fiber) or berry bush. */
export function createPlantNode(
  scene: Scene,
  kind: "fiber" | "berry",
  x: number,
  z: number,
  seed: number,
): { root: TransformNode; radius: number; deplete: () => void } {
  const root = new TransformNode(kind === "fiber" ? "FiberPlant" : "BerryBush", scene);
  root.position.set(x, 0, z);
  const mats = ensurePlantMaterials(scene);
  const bodyMat = kind === "fiber" ? mats.fiber : mats.berryLeaf;
  const accentMat = kind === "fiber" ? mats.fiberTip : mats.berry;
  for (let i = 0; i < (kind === "fiber" ? 5 : 4); i += 1) {
    const blade = MeshBuilder.CreateCylinder(`PlantBlade${i}`, {
      height: kind === "fiber" ? 0.55 + (seed % 3) * 0.06 : 0.42,
      diameterTop: 0.04,
      diameterBottom: 0.12,
      tessellation: 5,
    }, scene);
    blade.parent = root;
    const a = (i / 5) * Math.PI * 2 + seed * 0.2;
    blade.position.set(Math.cos(a) * 0.12, 0.28, Math.sin(a) * 0.12);
    blade.rotation.z = Math.sin(a) * 0.25;
    blade.material = bodyMat;
    blade.isPickable = false;
  }
  if (kind === "berry") {
    for (let i = 0; i < 6; i += 1) {
      const berry = MeshBuilder.CreateSphere(`Berry${i}`, { diameter: 0.09, segments: 4 }, scene);
      berry.parent = root;
      const a = (i / 6) * Math.PI * 2;
      berry.position.set(Math.cos(a) * 0.18, 0.35 + (i % 2) * 0.06, Math.sin(a) * 0.18);
      berry.material = accentMat;
      berry.isPickable = false;
    }
  } else {
    const tip = MeshBuilder.CreateSphere("FiberTip", { diameter: 0.14, segments: 4 }, scene);
    tip.parent = root;
    tip.position.y = 0.55;
    tip.material = accentMat;
    tip.isPickable = false;
  }
  return {
    root,
    radius: 0.45,
    deplete: () => {
      for (const child of root.getChildMeshes()) {
        if (kind === "berry" && child.name.startsWith("Berry")) child.setEnabled(false);
        else if (kind === "fiber") child.scaling.setAll(0.55);
      }
    },
  };
}

const MAT_KEY = Symbol.for("survive.plantMats");

function ensurePlantMaterials(scene: Scene): {
  fiber: StandardMaterial;
  fiberTip: StandardMaterial;
  berryLeaf: StandardMaterial;
  berry: StandardMaterial;
} {
  const bag = scene as Scene & { [MAT_KEY]?: ReturnType<typeof ensurePlantMaterials> };
  if (bag[MAT_KEY]) return bag[MAT_KEY];
  const fiber = new StandardMaterial("PlantFiberMat", scene);
  fiber.diffuseColor = new Color3(0.32, 0.52, 0.28);
  fiber.specularColor = Color3.Black();
  const fiberTip = new StandardMaterial("PlantFiberTipMat", scene);
  fiberTip.diffuseColor = new Color3(0.72, 0.68, 0.38);
  fiberTip.specularColor = Color3.Black();
  const berryLeaf = new StandardMaterial("BerryLeafMat", scene);
  berryLeaf.diffuseColor = new Color3(0.22, 0.42, 0.2);
  berryLeaf.specularColor = Color3.Black();
  const berry = new StandardMaterial("BerryFruitMat", scene);
  berry.diffuseColor = new Color3(0.62, 0.14, 0.22);
  berry.specularColor = Color3.Black();
  const pack = { fiber, fiberTip, berryLeaf, berry };
  bag[MAT_KEY] = pack;
  return pack;
}

export type PlantNode = ReturnType<typeof createPlantNode>;
