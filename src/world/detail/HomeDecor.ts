import { Color3 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";

/** Procedural decorative/story props for Home density (non-interactable unless wired). */
export function createHomeDecorationLayer(scene: Scene): TransformNode {
  const root = new TransformNode("HomeDecor", scene);
  const wood = mat(scene, "HomeWood", new Color3(0.38, 0.24, 0.12));
  const woodDark = mat(scene, "HomeWoodDark", new Color3(0.22, 0.14, 0.08));
  const metal = mat(scene, "HomeMetal", new Color3(0.42, 0.4, 0.36));
  const rust = mat(scene, "HomeRust", new Color3(0.45, 0.28, 0.14));
  const rock = mat(scene, "HomeRock", new Color3(0.48, 0.46, 0.42));
  const cloth = mat(scene, "HomeCloth", new Color3(0.35, 0.32, 0.22));
  const concrete = mat(scene, "HomeConcrete", new Color3(0.5, 0.48, 0.44));

  // Ruined foundation near house (-ish edge of clearing)
  placeBox(scene, root, concrete, 6.5, 0.06, -6.5, 3.2, 0.12, 2.4, 0.15);
  placeBox(scene, root, concrete, 5.2, 0.45, -7.4, 0.35, 0.9, 1.8, 0.4);
  placeBox(scene, root, woodDark, 7.6, 0.35, -5.8, 1.6, 0.7, 0.25, -0.5);
  placeBox(scene, root, wood, 7.1, 0.55, -6.9, 1.1, 0.12, 0.9, 0.8);

  // Abandoned campsite NW
  placeBox(scene, root, woodDark, -10.5, 0.12, 6.5, 1.4, 0.15, 0.9, 0.3);
  placeCyl(scene, root, rust, -9.5, 0.45, 7.2, 0.55, 0.9);
  placeCyl(scene, root, metal, -11.2, 0.4, 5.8, 0.48, 0.8);
  placeBox(scene, root, cloth, -10.8, 0.55, 8.1, 1.8, 0.08, 1.2, 0.6);

  // Scrap / junk near workshop area SE of spawn
  placeBox(scene, root, metal, 4.5, 0.2, 3.2, 0.9, 0.35, 0.55, 0.7);
  placeBox(scene, root, rust, 5.1, 0.18, 2.4, 0.7, 0.28, 0.5, -0.4);
  placeBox(scene, root, wood, 3.6, 0.15, 3.8, 1.2, 0.12, 0.25, 1.1);
  placeCyl(scene, root, metal, 4.2, 0.12, 4.5, 0.55, 0.2);

  // Fallen logs / timber
  placeCyl(scene, root, woodDark, -7.5, 0.18, -2.5, 0.28, 2.8, Math.PI / 2, 0.35);
  placeCyl(scene, root, wood, 12.5, 0.2, 1.5, 0.32, 3.2, Math.PI / 2 + 0.4, -0.2);
  placeCyl(scene, root, woodDark, -2.5, 0.15, 14.5, 0.25, 2.4, Math.PI / 2 - 0.5, 0.1);

  // Tree stumps
  for (const [x, z, s] of [[-3.5, 6.2, 0.7], [9.2, -3.5, 0.55], [-12, -4, 0.65], [1.5, 11, 0.5]] as const) {
    placeCyl(scene, root, woodDark, x, 0.22 * s, z, 0.55 * s, 0.4 * s);
    placeCyl(scene, root, wood, x, 0.42 * s, z, 0.5 * s, 0.08 * s);
  }

  // Fence ruins along travel edge
  for (let i = 0; i < 7; i += 1) {
    const x = -18 + i * 2.1;
    placeBox(scene, root, woodDark, x, 0.55, 20.5, 0.12, 1.1, 0.12, 0);
    if (i % 2 === 0) placeBox(scene, root, wood, x + 0.9, 0.7, 20.5, 1.7, 0.08, 0.08, 0);
  }

  // Rock border chunks
  for (const [x, z, sx, sy, sz] of [
    [-22, 0, 2.2, 1.4, 3], [22, 5, 2.5, 1.6, 2.8], [0, -22, 3, 1.2, 2],
    [-18, -18, 2.4, 1.5, 2.2], [18, 18, 2.8, 1.7, 2.5], [-20, 12, 1.8, 1.3, 2.4],
  ] as const) {
    placeBox(scene, root, rock, x, sy / 2, z, sx, sy, sz, (x + z) * 0.05);
  }

  // Storage area crates visual (decorative)
  placeBox(scene, root, wood, -1.5, 0.35, -2.2, 0.7, 0.7, 0.7, 0.2);
  placeBox(scene, root, woodDark, -0.7, 0.28, -2.5, 0.55, 0.55, 0.55, -0.3);
  placeBox(scene, root, wood, -1.1, 0.85, -2.3, 0.5, 0.4, 0.5, 0.5);

  // Farm area soil patches
  placeBox(scene, root, mat(scene, "HomeSoil", new Color3(0.32, 0.22, 0.12)), -6, 0.04, -1.5, 3.5, 0.06, 2.2, 0.1);
  placeBox(scene, root, mat(scene, "HomeSoil2", new Color3(0.28, 0.2, 0.1)), -6.2, 0.04, 0.8, 2.8, 0.06, 1.6, -0.05);

  // Vehicle parking pad outline SE
  placeBox(scene, root, concrete, 10, 0.03, 8, 4, 0.05, 3, 0);
  placeBox(scene, root, metal, 11.5, 0.15, 7, 0.8, 0.25, 0.6, 0.2);

  // Path worn markers (flat dark strips)
  const path = mat(scene, "HomePath", new Color3(0.34, 0.3, 0.22));
  for (let i = 0; i < 8; i += 1) {
    placeBox(scene, root, path, i * 1.1 - 1, 0.02, 5 - i * 0.65, 0.9, 0.04, 0.55, 0.3);
  }
  for (let i = 0; i < 6; i += 1) {
    placeBox(scene, root, path, -4 + i * 0.4, 0.02, 4 - i * 0.15, 0.7, 0.04, 0.45, -0.2);
  }

  // ── Pass 5 home density packs ──
  const tarp = mat(scene, "HomeTarp", new Color3(0.28, 0.36, 0.22));
  const green = mat(scene, "HomeLeaf", new Color3(0.22, 0.38, 0.16));
  const moss = mat(scene, "HomeMoss", new Color3(0.26, 0.34, 0.14));
  const plastic = mat(scene, "HomePlastic", new Color3(0.45, 0.48, 0.42));
  const yellow = mat(scene, "HomeSign", new Color3(0.7, 0.55, 0.15));

  // Forest edge: denser trees stumps + bushes + mushrooms NW
  for (const [x, z] of [[-14, 10], [-16, 8], [-13, 7], [-15, 12], [-17, 5]] as const) {
    placeCyl(scene, root, woodDark, x, 0.2, z, 0.45, 0.35);
    placeCyl(scene, root, green, x, 0.55, z, 1.1, 0.6);
  }
  for (const [x, z] of [[-12, 9], [-11, 11], [-14, 13]] as const) {
    placeCyl(scene, root, wood, x, 0.08, z, 0.18, 0.12);
    placeCyl(scene, root, moss, x + 0.3, 0.07, z + 0.2, 0.15, 0.1);
  }
  placeCyl(scene, root, woodDark, -15, 0.18, 6, 0.3, 2.6, Math.PI / 2, 0.4);

  // Rocky edge NE
  for (const [x, z, sx, sy, sz] of [
    [16, -8, 1.6, 1.1, 1.4], [18, -6, 1.2, 0.9, 1.5], [19, -10, 2.0, 1.3, 1.8],
    [15, -11, 1.0, 0.7, 1.1], [20, -7.5, 1.4, 1.0, 1.2],
  ] as const) {
    placeBox(scene, root, rock, x, sy / 2, z, sx, sy, sz, (x + z) * 0.04);
  }
  placeBox(scene, root, mat(scene, "HomeGravel", new Color3(0.42, 0.4, 0.36)), 17, 0.03, -9, 4.5, 0.05, 3.5, 0.1);

  // Ruin furniture & debris
  placeBox(scene, root, woodDark, 6.8, 0.4, -8.2, 0.9, 0.08, 0.55, 0.3);
  placeBox(scene, root, wood, 6.4, 0.55, -7.5, 0.35, 0.7, 0.35, 0);
  placeBox(scene, root, cloth, 7.4, 0.3, -6.9, 1.2, 0.12, 0.8, -0.4);
  placeBox(scene, root, rust, 8.2, 0.25, -8.5, 0.6, 0.45, 0.4, 0.6);

  // Starter camp detail
  placeCyl(scene, root, rock, -9.8, 0.12, 6.8, 0.7, 0.15);
  placeCyl(scene, root, mat(scene, "HomeAsh", new Color3(0.2, 0.18, 0.16)), -9.8, 0.18, 6.8, 0.5, 0.08);
  placeBox(scene, root, cloth, -11.5, 0.2, 7.6, 1.4, 0.08, 0.7, 0.2);
  placeBox(scene, root, wood, -10.2, 0.35, 5.4, 0.55, 0.5, 0.55, -0.2);

  // Vehicle area props
  placeCyl(scene, root, rust, 9.2, 0.35, 9.5, 0.9, 0.7);
  placeCyl(scene, root, metal, 8.4, 0.25, 8.6, 0.7, 0.35);
  placeBox(scene, root, metal, 12.2, 0.35, 9.2, 1.1, 0.55, 0.5, 0.4);
  placeBox(scene, root, yellow, 11.2, 0.9, 6.8, 0.08, 1.2, 0.5, 0.1);

  // Farm: barrels, compost, garden markers
  placeCyl(scene, root, rust, -7.5, 0.45, -2.2, 0.7, 0.9);
  placeCyl(scene, root, metal, -8.1, 0.4, 0.2, 0.65, 0.8);
  placeBox(scene, root, wood, -5.2, 0.2, -2.8, 1.6, 0.18, 0.8, 0);
  placeBox(scene, root, green, -4.8, 0.35, -0.5, 0.6, 0.35, 0.6, 0);
  placeBox(scene, root, green, -6.5, 0.32, 0.4, 0.5, 0.3, 0.5, 0.3);

  // Industrial workstation props SE
  placeBox(scene, root, metal, 3.2, 0.5, 1.5, 1.4, 0.9, 0.7, 0.1);
  placeBox(scene, root, rust, 2.4, 0.35, 0.8, 0.6, 0.6, 0.55, -0.3);
  placeCyl(scene, root, metal, 3.8, 0.55, 0.5, 0.35, 1.0);

  // Defense line stubs
  for (let i = 0; i < 5; i += 1) {
    placeBox(scene, root, woodDark, -8 + i * 1.6, 0.7, 16.5, 0.14, 1.4, 0.14, 0);
    if (i < 4) placeBox(scene, root, wood, -7.2 + i * 1.6, 1.0, 16.5, 1.4, 0.1, 0.1, 0);
  }
  placeBox(scene, root, metal, -4, 0.55, 16.4, 1.4, 1.1, 0.2, 0);

  // Decor pack: furniture cluster near home
  placeBox(scene, root, wood, -2.8, 0.35, -4.2, 1.1, 0.08, 0.7, 0.15);
  placeBox(scene, root, woodDark, -3.3, 0.45, -3.7, 0.35, 0.7, 0.35, 0);
  placeBox(scene, root, woodDark, -2.2, 0.45, -4.6, 0.35, 0.7, 0.35, 0.2);
  placeBox(scene, root, wood, -0.5, 0.7, -3.8, 0.9, 1.2, 0.35, 0);
  placeBox(scene, root, plastic, 0.2, 0.28, -4.5, 0.4, 0.4, 0.4, 0.5);
  placeCyl(scene, root, metal, 0.8, 0.25, -3.5, 0.35, 0.45);

  // Industrial clutter: pallets, tires, cables, barrels
  placeBox(scene, root, wood, 5.5, 0.12, 5.2, 1.3, 0.15, 0.9, 0.2);
  placeCyl(scene, root, rust, 6.4, 0.35, 4.5, 0.85, 0.25);
  placeCyl(scene, root, plastic, 4.8, 0.2, 5.8, 0.25, 0.15);
  placeBox(scene, root, metal, 5.9, 0.18, 6.2, 0.9, 0.12, 0.2, 1.2);
  placeCyl(scene, root, rust, 7.0, 0.5, 5.5, 0.6, 1.0);

  // Survivor tent/tarp camp
  placeBox(scene, root, tarp, -13, 0.85, 3.5, 2.2, 0.08, 1.6, 0.25);
  placeBox(scene, root, woodDark, -13.8, 0.55, 2.8, 0.1, 1.1, 0.1, 0);
  placeBox(scene, root, woodDark, -12.2, 0.55, 4.2, 0.1, 1.1, 0.1, 0);
  placeBox(scene, root, cloth, -13.1, 0.2, 3.2, 1.2, 0.08, 0.6, 0.1);

  // Water barrel + tool rack
  placeCyl(scene, root, metal, -4.2, 0.55, 2.2, 0.7, 1.1);
  placeBox(scene, root, woodDark, -3.4, 0.9, 1.5, 0.1, 1.4, 0.8, 0);
  placeBox(scene, root, metal, -3.35, 1.1, 1.3, 0.08, 0.5, 0.08, 0.3);

  // Natural micro props
  for (const [x, z] of [[2, 12], [4, 13], [-5, 9], [7, -12], [-9, -8], [0, -14]] as const) {
    placeCyl(scene, root, green, x, 0.12, z, 0.35 + (x % 3) * 0.05, 0.22);
    placeCyl(scene, root, moss, x + 0.4, 0.08, z - 0.3, 0.22, 0.12);
  }

  // Waste pack
  for (const [x, z] of [[8.5, 2.2], [9.1, 1.6], [7.8, 1.9], [-0.5, 8.5], [1.2, 9.1]] as const) {
    placeBox(scene, root, rust, x, 0.12, z, 0.35, 0.18, 0.3, (x + z) * 0.2);
    placeCyl(scene, root, metal, x + 0.35, 0.1, z + 0.2, 0.2, 0.15);
  }

  // Lighting poles / lanterns
  placeCyl(scene, root, metal, 2.5, 1.1, -1.5, 0.12, 2.2);
  placeCyl(scene, root, yellow, 2.5, 2.15, -1.5, 0.28, 0.2);
  placeCyl(scene, root, metal, -6.5, 1.0, 3.5, 0.12, 2.0);
  placeCyl(scene, root, yellow, -6.5, 2.0, 3.5, 0.25, 0.18);

  // Micro-story: abandoned toolbox + collapsed fence + forgotten supplies
  placeBox(scene, root, metal, 1.5, 0.25, 3.8, 0.55, 0.35, 0.35, 0.4);
  placeBox(scene, root, woodDark, 14, 0.4, 14, 0.12, 0.8, 0.12, 0.6);
  placeBox(scene, root, wood, 14.6, 0.15, 14.3, 1.0, 0.1, 0.1, 0.8);
  placeBox(scene, root, wood, -2.0, 0.25, 7.5, 0.7, 0.35, 0.5, -0.3);
  placeBox(scene, root, cloth, -2.4, 0.15, 8.1, 0.8, 0.08, 0.5, 0.2);

  return root;
}

function mat(scene: Scene, name: string, color: Color3): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = color;
  m.specularColor = Color3.Black();
  m.emissiveColor = color.scale(0.04);
  return m;
}

function placeBox(
  scene: Scene,
  parent: TransformNode,
  material: StandardMaterial,
  x: number, y: number, z: number,
  w: number, h: number, d: number,
  yaw: number,
): void {
  const m = MeshBuilder.CreateBox("HomePropBox", { width: w, height: h, depth: d }, scene);
  m.parent = parent;
  m.position.set(x, y, z);
  m.rotation.y = yaw;
  m.material = material;
  m.receiveShadows = true;
  m.isPickable = false;
}

function placeCyl(
  scene: Scene,
  parent: TransformNode,
  material: StandardMaterial,
  x: number, y: number, z: number,
  diameter: number, height: number,
  rotZ = 0,
  yaw = 0,
): void {
  const m = MeshBuilder.CreateCylinder("HomePropCyl", { diameter, height, tessellation: 8 }, scene);
  m.parent = parent;
  m.position.set(x, y, z);
  m.rotation.z = rotZ;
  m.rotation.y = yaw;
  m.material = material;
  m.receiveShadows = true;
  m.isPickable = false;
}
