import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";
import type { ProceduralTextureFactory } from "./ProceduralTextureFactory";

export interface WorldMaterials {
  trunk: StandardMaterial;
  foliage: StandardMaterial[];
  rock: StandardMaterial[];
  wall: StandardMaterial;
  wallTrim: StandardMaterial;
  floor: StandardMaterial;
  wood: StandardMaterial;
  ember: StandardMaterial;
  bush: StandardMaterial;
  dryGrass: StandardMaterial;
  metal: StandardMaterial;
  fire: StandardMaterial[];
  smoke: StandardMaterial;
  contactShadow: StandardMaterial;
  pineNeedles: StandardMaterial;
}

function matte(scene: Scene, name: string, color: Color3): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = color;
  material.specularColor.set(0.025, 0.025, 0.025);
  return material;
}

export function createWorldMaterials(scene: Scene, textures: ProceduralTextureFactory): WorldMaterials {
  const bark = textures.createBarkTexture();
  const woodTexture = textures.createWoodTexture();
  const trunk = matte(scene, "trunk", new Color3(0.42, 0.30, 0.18));
  trunk.diffuseTexture = bark;
  trunk.specularPower = 24;
  const wood = matte(scene, "utilityWood", new Color3(0.72, 0.58, 0.39));
  wood.diffuseTexture = woodTexture;
  wood.specularPower = 32;
  const contactShadow = matte(scene, "contactShadow", Color3.Black());
  contactShadow.opacityTexture = textures.createSoftCircleTexture();
  contactShadow.alpha = 0.32;
  contactShadow.disableLighting = true;
  contactShadow.backFaceCulling = false;
  const flameAmber = matte(scene, "flameAmber", new Color3(1, 0.42, 0.05));
  flameAmber.emissiveColor = new Color3(1, 0.18, 0.01);
  flameAmber.disableLighting = true;
  flameAmber.alpha = 0.88;
  const flameGold = matte(scene, "flameGold", new Color3(1, 0.72, 0.12));
  flameGold.emissiveColor = new Color3(1, 0.42, 0.03);
  flameGold.disableLighting = true;
  flameGold.alpha = 0.92;
  const smoke = matte(scene, "smoke", new Color3(0.34, 0.36, 0.32));
  smoke.alpha = 0.18;
  smoke.disableLighting = true;
  smoke.backFaceCulling = false;
  return {
    trunk,
    foliage: [
      matte(scene, "pineDark", new Color3(0.18, 0.31, 0.22)),
      matte(scene, "pineMid", new Color3(0.23, 0.37, 0.25)),
      matte(scene, "pineLight", new Color3(0.28, 0.41, 0.27)),
    ],
    rock: [
      matte(scene, "rockWarm", new Color3(0.38, 0.38, 0.33)),
      matte(scene, "rockCool", new Color3(0.31, 0.34, 0.32)),
      matte(scene, "rockLight", new Color3(0.44, 0.43, 0.36)),
    ],
    wall: matte(scene, "plasterWall", new Color3(0.60, 0.55, 0.43)),
    wallTrim: matte(scene, "wallTimber", new Color3(0.27, 0.18, 0.10)),
    floor: wood,
    wood,
    ember: matte(scene, "embers", new Color3(0.88, 0.29, 0.07)),
    bush: matte(scene, "bush", new Color3(0.25, 0.54, 0.19)),
    dryGrass: matte(scene, "dryGrass", new Color3(0.43, 0.54, 0.22)),
    metal: matte(scene, "metalAccent", new Color3(0.27, 0.29, 0.27)),
    fire: [flameAmber, flameGold],
    smoke,
    contactShadow,
    pineNeedles: matte(scene, "pineNeedles", new Color3(0.25, 0.28, 0.16)),
  };
}
