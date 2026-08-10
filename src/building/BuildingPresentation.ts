import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import type { CollisionWorld } from "../collision/CollisionWorld";
import { BUILD_CONFIG, gridToWorld } from "./buildConfig";
import { BUILD_PIECES, type BuildingRegistry, type PlacedBuildPiece } from "./BuildingRegistry";

interface PieceVisual {
  readonly root: Mesh;
  readonly collides: boolean;
}

/**
 * Procedural LDOE-ish base meshes + placement ghost.
 * Not a copyrighted asset recreation — proportional grid blocks.
 */
export class BuildingPresentation {
  private readonly visuals = new Map<string, PieceVisual>();
  private readonly ghostRoot: Mesh;
  private readonly mats: {
    floor: StandardMaterial;
    wall: StandardMaterial;
    door: StandardMaterial;
    furniture: StandardMaterial;
    station: StandardMaterial;
    ghostOk: StandardMaterial;
    ghostBad: StandardMaterial;
  };

  constructor(
    private readonly scene: Scene,
    private readonly collision: CollisionWorld,
  ) {
    this.mats = {
      floor: this.mat("BuildFloor", new Color3(0.42, 0.36, 0.26)),
      wall: this.mat("BuildWall", new Color3(0.5, 0.4, 0.28)),
      door: this.mat("BuildDoor", new Color3(0.38, 0.28, 0.18)),
      furniture: this.mat("BuildFurniture", new Color3(0.45, 0.38, 0.3)),
      station: this.mat("BuildStation", new Color3(0.4, 0.42, 0.45)),
      ghostOk: this.mat("BuildGhostOk", new Color3(0.35, 0.75, 0.35), 0.45),
      ghostBad: this.mat("BuildGhostBad", new Color3(0.85, 0.25, 0.2), 0.45),
    };
    this.ghostRoot = MeshBuilder.CreateBox("BuildGhost", { width: BUILD_CONFIG.cellSize * 0.92, height: 0.18, depth: BUILD_CONFIG.cellSize * 0.92 }, scene);
    this.ghostRoot.material = this.mats.ghostOk;
    this.ghostRoot.isPickable = false;
    this.ghostRoot.setEnabled(false);
  }

  sync(registry: BuildingRegistry): void {
    const live = new Set(registry.all.map((p) => p.id));
    for (const [id, visual] of this.visuals) {
      if (live.has(id)) continue;
      this.collision.remove(`Build:${id}`);
      visual.root.dispose(false, false);
      this.visuals.delete(id);
    }
    for (const piece of registry.all) {
      if (this.visuals.has(piece.id)) continue;
      this.spawn(piece);
    }
  }

  setGhost(visible: boolean, gx: number, gz: number, rotation: number, valid: boolean, pieceId: string | null): void {
    if (!visible) {
      this.ghostRoot.setEnabled(false);
      return;
    }
    const { x, z } = gridToWorld(gx, gz);
    const def = pieceId ? BUILD_PIECES.find((p) => p.id === pieceId) : null;
    const cat = def?.category ?? "floor";
    const dims = dimsFor(cat);
    // Rebuild ghost scale
    this.ghostRoot.scaling.set(
      dims.w / (BUILD_CONFIG.cellSize * 0.92),
      dims.h / 0.18,
      dims.d / (BUILD_CONFIG.cellSize * 0.92),
    );
    this.ghostRoot.position.set(x, dims.h / 2, z);
    this.ghostRoot.rotation.y = (rotation * Math.PI) / 180;
    this.ghostRoot.material = valid ? this.mats.ghostOk : this.mats.ghostBad;
    this.ghostRoot.setEnabled(true);
  }

  private spawn(piece: PlacedBuildPiece): void {
    const def = BUILD_PIECES.find((p) => p.id === piece.pieceId);
    const cat = def?.category ?? "floor";
    const dims = dimsFor(cat);
    const { x, z } = gridToWorld(piece.gridX, piece.gridZ);
    const mesh = MeshBuilder.CreateBox(`BuildPiece:${piece.id}`, {
      width: dims.w,
      height: dims.h,
      depth: dims.d,
    }, this.scene);
    mesh.position.set(x, dims.h / 2, z);
    mesh.rotation.y = (piece.rotation * Math.PI) / 180;
    mesh.material = this.mats[matKey(cat)];
    mesh.isPickable = false;
    mesh.receiveShadows = true;

    // Decor details
    if (cat === "door") {
      const gap = MeshBuilder.CreateBox(`BuildDoorGap:${piece.id}`, {
        width: dims.w * 0.35,
        height: dims.h * 0.75,
        depth: dims.d * 1.05,
      }, this.scene);
      gap.parent = mesh;
      gap.position.set(0, -dims.h * 0.05, 0);
      gap.material = this.mats.door;
      gap.visibility = 0.35;
      gap.isPickable = false;
    }

    const collides = cat === "wall" || cat === "door" || cat === "furniture" || cat === "station";
    if (collides) {
      this.collision.addBox(x, z, dims.w * 0.48, dims.d * 0.48, `Build:${piece.id}`);
    }
    this.visuals.set(piece.id, { root: mesh, collides });
  }

  private mat(name: string, color: Color3, alpha = 1): StandardMaterial {
    const m = new StandardMaterial(name, this.scene);
    m.diffuseColor = color;
    m.specularColor = new Color3(0.05, 0.05, 0.04);
    m.emissiveColor = color.scale(0.08);
    if (alpha < 1) {
      m.alpha = alpha;
      m.transparencyMode = 2;
    }
    return m;
  }
}

function matKey(cat: string): "floor" | "wall" | "door" | "furniture" | "station" {
  if (cat === "wall" || cat === "door" || cat === "furniture" || cat === "station" || cat === "floor") return cat;
  return "furniture";
}

function dimsFor(category: string): { w: number; h: number; d: number } {
  const c = BUILD_CONFIG.cellSize;
  switch (category) {
    case "floor":
      return { w: c * 0.98, h: 0.12, d: c * 0.98 };
    case "wall":
      return { w: c * 0.98, h: 2.35, d: c * 0.22 };
    case "door":
      return { w: c * 0.85, h: 2.2, d: c * 0.2 };
    case "station":
      return { w: c * 0.7, h: 0.95, d: c * 0.7 };
    default:
      return { w: c * 0.55, h: 0.7, d: c * 0.55 };
  }
}
