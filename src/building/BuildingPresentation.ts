import { Color3 } from "@babylonjs/core/Maths/math.color";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { CollisionWorld } from "../collision/CollisionWorld";
import { BUILD_CONFIG, gridToWorld } from "./buildConfig";
import { BUILD_PIECES, type BuildingRegistry, type PlacedBuildPiece } from "./BuildingRegistry";

interface PieceVisual {
  readonly root: Mesh;
  readonly collides: boolean;
  /** Closed orientation (radians). Used when swinging doors/gates open. */
  readonly closedYaw?: number;
  /** Collision half-extents while closed. */
  readonly collideHalfW?: number;
  readonly collideHalfD?: number;
  readonly worldX?: number;
  readonly worldZ?: number;
  readonly isPassage?: boolean;
  /** Local lamp head mesh for emissive pulse when powered. */
  readonly lampGlow?: Mesh;
  readonly lampLight?: PointLight;
  /** True when collision box currently in the world. */
  collisionActive: boolean;
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
    lanternMetal: StandardMaterial;
    lanternGlow: StandardMaterial;
    ghostOk: StandardMaterial;
    ghostBad: StandardMaterial;
    ghostRepair: StandardMaterial;
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
      lanternMetal: this.mat("BuildLanternMetal", new Color3(0.28, 0.3, 0.32)),
      lanternGlow: this.mat("BuildLanternGlow", new Color3(1, 0.82, 0.42)),
      ghostOk: this.mat("BuildGhostOk", new Color3(0.35, 0.75, 0.35), 0.45),
      ghostBad: this.mat("BuildGhostBad", new Color3(0.85, 0.25, 0.2), 0.45),
      ghostRepair: this.mat("BuildGhostRepair", new Color3(0.35, 0.65, 0.95), 0.5),
    };
    this.mats.lanternGlow.emissiveColor = new Color3(0.55, 0.38, 0.08);
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
      visual.lampLight?.dispose();
      visual.root.dispose(false, false);
      this.visuals.delete(id);
    }
    for (const piece of registry.all) {
      if (this.visuals.has(piece.id)) continue;
      this.spawn(piece);
    }
    // Refresh passage swing after spawn/load so open doors stay walked-through.
    this.syncPassageStates(new Map(registry.all.map((p) => [p.id, p.isOpen === true])));
    this.syncHpVisuals(registry);
  }

  /** Dim damaged pieces so repair targets read at a glance. */
  syncHpVisuals(registry: BuildingRegistry): void {
    for (const piece of registry.all) {
      const visual = this.visuals.get(piece.id);
      if (!visual) continue;
      const ratio = piece.maxHp > 0 ? Math.max(0, Math.min(1, piece.hp / piece.maxHp)) : 1;
      // Full health: normal; critical: darker / more transparent.
      visual.root.visibility = 0.5 + ratio * 0.5;
      if (ratio < 0.999) {
        visual.root.scaling.y = 0.92 + ratio * 0.08;
      } else {
        visual.root.scaling.y = 1;
      }
    }
  }

  /**
   * Toggle lantern point lights + glow by piece instance id.
   * Missing entries for existing lanterns are treated as off.
   */
  syncLanternLights(litByPieceId: ReadonlyMap<string, boolean>): void {
    for (const [id, visual] of this.visuals) {
      const light = visual.lampLight;
      if (!light) continue;
      const lit = litByPieceId.get(id) === true;
      light.setEnabled(lit);
      light.intensity = lit ? 1.15 : 0;
      if (visual.lampGlow) {
        visual.lampGlow.visibility = lit ? 1 : 0.18;
        const mat = visual.lampGlow.material as StandardMaterial | null;
        if (mat) {
          mat.emissiveColor = lit
            ? new Color3(0.95, 0.72, 0.22)
            : new Color3(0.12, 0.1, 0.05);
        }
      }
    }
  }

  /**
   * Open doors/gates: swing leaf ~95° and drop blockage so the player can walk through.
   */
  syncPassageStates(openByPieceId: ReadonlyMap<string, boolean>): void {
    for (const [id, visual] of this.visuals) {
      if (!visual.isPassage) continue;
      const open = openByPieceId.get(id) === true;
      const closedYaw = visual.closedYaw ?? 0;
      // Swing outward around hinge (positive Y).
      visual.root.rotation.y = closedYaw + (open ? (Math.PI * 0.52) : 0);
      visual.root.visibility = open ? 0.88 : 1;
      if (!visual.collides) continue;
      if (open) {
        if (visual.collisionActive) {
          this.collision.remove(`Build:${id}`);
          visual.collisionActive = false;
        }
      } else if (!visual.collisionActive) {
        const hx = visual.collideHalfW ?? 0.4;
        const hz = visual.collideHalfD ?? 0.2;
        this.collision.addBox(
          visual.worldX ?? visual.root.position.x,
          visual.worldZ ?? visual.root.position.z,
          hx,
          hz,
          `Build:${id}`,
        );
        visual.collisionActive = true;
      }
    }
  }

  setGhost(
    visible: boolean,
    gx: number,
    gz: number,
    rotation: number,
    valid: boolean,
    pieceId: string | null,
    mode: "place" | "demolish" | "repair" = "place",
  ): void {
    if (!visible) {
      this.ghostRoot.setEnabled(false);
      return;
    }
    const { x, z } = gridToWorld(gx, gz);
    const def = pieceId ? BUILD_PIECES.find((p) => p.id === pieceId) : null;
    const cat = def?.category ?? (mode === "repair" || mode === "demolish" ? "wall" : "floor");
    const dims = dimsFor(cat);
    this.ghostRoot.scaling.set(
      dims.w / (BUILD_CONFIG.cellSize * 0.92),
      dims.h / 0.18,
      dims.d / (BUILD_CONFIG.cellSize * 0.92),
    );
    this.ghostRoot.position.set(x, dims.h / 2, z);
    this.ghostRoot.rotation.y = (rotation * Math.PI) / 180;
    if (mode === "repair") this.ghostRoot.material = valid ? this.mats.ghostRepair : this.mats.ghostBad;
    else this.ghostRoot.material = valid ? this.mats.ghostOk : this.mats.ghostBad;
    this.ghostRoot.setEnabled(true);
  }

  private spawn(piece: PlacedBuildPiece): void {
    const def = BUILD_PIECES.find((p) => p.id === piece.pieceId);
    const cat = def?.category ?? "floor";
    const dims = dimsFor(cat);
    const { x, z } = gridToWorld(piece.gridX, piece.gridZ);

    if (piece.pieceId === "lantern-post") {
      this.spawnLantern(piece.id, x, z);
      return;
    }

    if (cat === "door") {
      this.spawnPassage(piece, x, z, dims);
      return;
    }

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

    const collides = cat === "wall" || cat === "furniture" || cat === "station";
    if (collides) {
      this.collision.addBox(x, z, dims.w * 0.48, dims.d * 0.48, `Build:${piece.id}`);
    }
    this.visuals.set(piece.id, {
      root: mesh,
      collides,
      collisionActive: collides,
      worldX: x,
      worldZ: z,
      collideHalfW: dims.w * 0.48,
      collideHalfD: dims.d * 0.48,
    });
  }

  private spawnPassage(
    piece: PlacedBuildPiece,
    x: number,
    z: number,
    dims: { w: number; h: number; d: number },
  ): void {
    const closedYaw = (piece.rotation * Math.PI) / 180;
    // Thin door leaf; slightly taller passage for gates.
    const isGate = piece.pieceId.includes("gate");
    const leafW = isGate ? dims.w * 0.95 : dims.w * 0.9;
    const leafD = isGate ? dims.d * 1.1 : dims.d;
    const mesh = MeshBuilder.CreateBox(`BuildPiece:${piece.id}`, {
      width: leafW,
      height: dims.h,
      depth: leafD,
    }, this.scene);
    mesh.position.set(x, dims.h / 2, z);
    mesh.rotation.y = closedYaw;
    mesh.material = this.mats.door;
    mesh.isPickable = false;
    mesh.receiveShadows = true;

    const gap = MeshBuilder.CreateBox(`BuildDoorGap:${piece.id}`, {
      width: leafW * 0.32,
      height: dims.h * 0.72,
      depth: leafD * 1.08,
    }, this.scene);
    gap.parent = mesh;
    gap.position.set(0, -dims.h * 0.04, 0);
    gap.material = this.mats.door;
    gap.visibility = 0.32;
    gap.isPickable = false;

    const halfW = leafW * 0.45;
    const halfD = Math.max(0.14, leafD * 0.55);
    this.collision.addBox(x, z, halfW, halfD, `Build:${piece.id}`);
    this.visuals.set(piece.id, {
      root: mesh,
      collides: true,
      isPassage: true,
      closedYaw,
      worldX: x,
      worldZ: z,
      collideHalfW: halfW,
      collideHalfD: halfD,
      collisionActive: true,
    });
  }

  private spawnLantern(pieceId: string, x: number, z: number): void {
    const root = MeshBuilder.CreateCylinder(`BuildPiece:${pieceId}`, {
      height: 0.12,
      diameter: 0.42,
      tessellation: 10,
    }, this.scene);
    root.position.set(x, 0.06, z);
    root.material = this.mats.lanternMetal;
    root.isPickable = false;
    root.receiveShadows = true;

    const pole = MeshBuilder.CreateCylinder(`BuildLanternPole:${pieceId}`, {
      height: 1.85,
      diameter: 0.09,
      tessellation: 8,
    }, this.scene);
    pole.parent = root;
    pole.position.y = 0.95;
    pole.material = this.mats.lanternMetal;
    pole.isPickable = false;

    const arm = MeshBuilder.CreateBox(`BuildLanternArm:${pieceId}`, {
      width: 0.42,
      height: 0.06,
      depth: 0.06,
    }, this.scene);
    arm.parent = root;
    arm.position.set(0.18, 1.78, 0);
    arm.material = this.mats.lanternMetal;
    arm.isPickable = false;

    const glowMat = this.mats.lanternGlow.clone(`BuildLanternGlowMat:${pieceId}`) as StandardMaterial;
    glowMat.emissiveColor = new Color3(0.12, 0.1, 0.05);
    const glow = MeshBuilder.CreateSphere(`BuildLanternGlow:${pieceId}`, {
      diameter: 0.28,
      segments: 8,
    }, this.scene);
    glow.parent = root;
    glow.position.set(0.32, 1.58, 0);
    glow.material = glowMat;
    glow.isPickable = false;
    glow.visibility = 0.18;

    const light = new PointLight(`BuildLanternLight:${pieceId}`, new Vector3(x + 0.32, 1.64, z), this.scene);
    light.diffuse = new Color3(1, 0.78, 0.42);
    light.specular = new Color3(0.35, 0.28, 0.12);
    light.range = 7.5;
    light.intensity = 0;
    light.setEnabled(false);

    this.collision.addBox(x, z, 0.22, 0.22, `Build:${pieceId}`);
    this.visuals.set(pieceId, {
      root,
      collides: true,
      collisionActive: true,
      worldX: x,
      worldZ: z,
      collideHalfW: 0.22,
      collideHalfD: 0.22,
      lampGlow: glow,
      lampLight: light,
    });
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
