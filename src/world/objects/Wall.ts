import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import type { WorldMaterials } from "../../rendering/Materials";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

export interface WallObject { root: TransformNode; mesh: Mesh; meshes: Mesh[]; gridX: number; gridZ: number; horizontal: boolean; lengthCells: number }

export function createWall(scene: Scene, materials: WorldMaterials, gridX: number, gridZ: number, horizontal: boolean, lengthCells = 1): WallObject {
  const root = new TransformNode("CalibrationWallRoot", scene);
  const mesh = MeshBuilder.CreateBox("CalibrationWallPanel", { width: 1, height: 0.82, depth: 1 }, scene);
  mesh.parent = root;
  mesh.position.y = -0.06;
  mesh.material = materials.wall;
  // Keep every cell inside its own bounds. Oversized coplanar beams overlapped at
  // the seams and produced visible z-fighting while the camera was moving.
  const topBeam = MeshBuilder.CreateBox("WallTopBeam", { width: 0.995, height: 0.1, depth: 1.08 }, scene);
  topBeam.parent = root;
  topBeam.position.y = horizontal ? 0.462 : 0.458;
  topBeam.material = materials.wallTrim;
  const postA = MeshBuilder.CreateBox("WallPost", { width: 0.065, height: 1, depth: 1.06 }, scene);
  postA.parent = root;
  postA.position.x = -0.466;
  postA.material = materials.wallTrim;
  const postB = postA.clone("WallPost");
  postB.parent = root;
  postB.position.x = 0.466;
  return { root, mesh, meshes: [mesh, topBeam, postA, postB], gridX, gridZ, horizontal, lengthCells };
}
