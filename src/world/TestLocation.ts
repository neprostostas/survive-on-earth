import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import type { CalibrationConfig } from "../config/calibrationConfig";
import { GAME_CONFIG } from "../config/gameConfig";
import type { CollisionWorld } from "../collision/CollisionWorld";
import type { Lighting } from "../rendering/Lighting";
import { createInteractable, type Interactable } from "../interaction/Interactable";
import { createWorldMaterials, type WorldMaterials } from "../rendering/Materials";
import { createRock, type RockObject } from "./objects/Rock";
import { createTree, type TreeObject } from "./objects/Tree";
import { createWall, type WallObject } from "./objects/Wall";
import { createBush, type BushObject } from "./objects/Bush";
import { createCrate, type CrateObject } from "./objects/Crate";
import { CampfireObject } from "./objects/Campfire";
import { ProceduralTextureFactory } from "../rendering/ProceduralTextureFactory";
import { GroundSurface } from "./detail/GroundSurface";
import { GroundClutter } from "./detail/GroundClutter";
import { getVisualQualitySettings } from "../config/visualQualityConfig";

interface FloorTile { mesh: Mesh; gridX: number; gridZ: number }

export class TestLocation {
  readonly interactables: Interactable[] = [];
  private readonly materials: WorldMaterials;
  private readonly trees: TreeObject[] = [];
  private readonly rocks: RockObject[] = [];
  private readonly bushes: BushObject[] = [];
  private readonly walls: WallObject[] = [];
  private readonly floors: FloorTile[] = [];
  private readonly staticCasters: Mesh[] = [];
  private readonly houseOrigin = new Vector3(8, 0, -10);
  private readonly textures: ProceduralTextureFactory;
  private readonly ground: GroundSurface;
  private readonly clutter: GroundClutter;
  private crate!: CrateObject;
  private campfire!: CampfireObject;
  private visualTime = 0;

  constructor(
    private readonly scene: Scene,
    private readonly collision: CollisionWorld,
    private readonly lighting: Lighting,
    private readonly config: CalibrationConfig,
  ) {
    this.textures = new ProceduralTextureFactory(scene);
    this.materials = createWorldMaterials(scene, this.textures);
    this.ground = new GroundSurface(scene, this.textures, config);
    this.clutter = new GroundClutter(scene, this.materials, config);
    this.createForest();
    this.createHouse();
    this.createProps();
    this.applyCalibration();
    for (const mesh of this.staticCasters) this.lighting.addCaster(mesh);
  }

  get clutterCount(): number { return this.clutter.count; }

  applyCalibration(): void {
    for (const tree of this.trees) tree.root.scaling.setAll(tree.baseScale * this.config.world.treeScale);
    for (const rock of this.rocks) rock.root.scaling.setAll(rock.baseScale * this.config.world.rockScale);
    this.ground.applyCalibration(this.textures);
    this.clutter.applyCalibration();
    this.materials.contactShadow.alpha = this.config.visual.contactShadowIntensity;
    const cell = this.config.world.gridCellSize;
    for (const floor of this.floors) {
      floor.mesh.position.set(this.houseOrigin.x + floor.gridX * cell, 0.035, this.houseOrigin.z + floor.gridZ * cell);
      floor.mesh.scaling.set(cell * 0.98, 0.08, cell * 0.98);
    }
    for (const wall of this.walls) {
      wall.root.position.set(this.houseOrigin.x + wall.gridX * cell, this.config.world.wallHeight / 2, this.houseOrigin.z + wall.gridZ * cell);
      const length = cell * wall.lengthCells;
      wall.root.rotation.y = wall.horizontal ? 0 : Math.PI / 2;
      wall.root.scaling.set(length, this.config.world.wallHeight, 0.18);
    }
    this.rebuildCollisions();
  }

  update(delta: number): void {
    this.visualTime += delta;
    const sway = this.config.visual.foliageSway;
    for (const tree of this.trees) {
      tree.foliageRoot.rotation.z = Math.sin(this.visualTime * 0.72 + tree.swayPhase) * sway * 0.035;
      tree.foliageRoot.rotation.x = Math.cos(this.visualTime * 0.58 + tree.swayPhase) * sway * 0.022;
    }
    for (const bush of this.bushes) bush.root.rotation.z = Math.sin(this.visualTime * 0.8 + bush.swayPhase) * sway * 0.018;
    this.campfire.update(delta, getVisualQualitySettings(this.config.visual.qualityPreset).fireComplexity);
  }

  private createForest(): void {
    const positions = [
      [-9,1],[-8,4],[-7,8],[-7,11],[-4,13],[-1,12],[5,12],[8,10],[10,5],[11,2],
      [5,-4],[1,-6],[-3,-5],[-6,-3],[-15,-9],[-14,10],[14,-11],[17,4],[-3,19],[18,16],
    ];
    positions.forEach(([x, z], index) => {
      const tree = createTree(this.scene, this.materials, x, z, index);
      this.trees.push(tree);
      this.staticCasters.push(...tree.meshes.filter((mesh) => !mesh.name.includes("ContactShadow")));
      this.interactables.push(createInteractable({
        id: `tree-${String(index + 1).padStart(2, "0")}`,
        type: "resource",
        position: () => tree.root.position,
        radius: () => tree.radius * tree.baseScale * this.config.world.treeScale,
        enabled: () => !tree.root.isDisposed() && tree.root.isEnabled(),
      }));
    });
    const rocks = [[-5,0],[-5,8],[3,10],[7,5],[3,-2],[-12,-7],[13,-7],[-13,14],[6,17],[17,11]];
    rocks.forEach(([x, z], index) => {
      const rock = createRock(this.scene, this.materials, x, z, index);
      this.rocks.push(rock);
      this.staticCasters.push(...rock.meshes.filter((mesh) => !mesh.name.includes("ContactShadow")));
      this.interactables.push(createInteractable({
        id: `rock-${String(index + 1).padStart(2, "0")}`,
        type: "resource",
        position: () => rock.root.position,
        radius: () => rock.radius * rock.baseScale * this.config.world.rockScale,
        enabled: () => !rock.root.isDisposed() && rock.root.isEnabled(),
      }));
    });
    const bushPositions = [[-3,9],[2,12],[-6,4],[6,1],[0,-2],[-11,8]];
    bushPositions.forEach(([x, z], index) => {
      const bush = createBush(this.scene, this.materials, x, z, index);
      bush.root.scaling.setAll(0.86 + (index % 3) * 0.08);
      this.bushes.push(bush);
      this.staticCasters.push(...bush.meshes.filter((mesh) => !mesh.name.includes("ContactShadow")));
    });
  }

  private createHouse(): void {
    for (let z = 0; z < 3; z += 1) {
      for (let x = 0; x < 3; x += 1) {
        const mesh = MeshBuilder.CreateBox("FloorCell", { size: 1 }, this.scene);
        mesh.material = this.materials.floor;
        mesh.receiveShadows = true;
        this.floors.push({ mesh, gridX: x - 1, gridZ: z - 1 });
      }
    }
    for (let x = -1; x <= 1; x += 1) this.walls.push(createWall(this.scene, this.materials, x, -1.5, true));
    for (let z = -1; z <= 1; z += 1) this.walls.push(createWall(this.scene, this.materials, -1.5, z, false));
    this.walls.push(createWall(this.scene, this.materials, 1.5, -1, false));
    this.walls.push(createWall(this.scene, this.materials, 1.5, 1, false));
    this.walls.push(createWall(this.scene, this.materials, -1, 1.5, true));
    this.walls.push(createWall(this.scene, this.materials, 1, 1.5, true));
    for (const wall of this.walls) {
      for (const mesh of wall.meshes) mesh.receiveShadows = true;
      this.staticCasters.push(...wall.meshes);
    }
  }

  private createProps(): void {
    this.crate = createCrate(this.scene, this.materials, 2.2, 1.2);
    this.staticCasters.push(...this.crate.meshes.filter((mesh) => !mesh.name.includes("ContactShadow")));
    this.interactables.push(createInteractable({
      id: "crate-01",
      type: "container",
      position: () => this.crate.root.position,
      radius: () => 0.6,
      enabled: () => !this.crate.root.isDisposed() && this.crate.root.isEnabled(),
    }));
    this.campfire = new CampfireObject(this.scene, this.materials, -4, 4);
    this.staticCasters.push(...this.campfire.shadowCasters);
    this.interactables.push(createInteractable({
      id: "campfire-01",
      type: "station",
      position: () => this.campfire.root.position,
      radius: () => 0.72,
      enabled: () => !this.campfire.root.isDisposed() && this.campfire.root.isEnabled(),
    }));
  }

  private rebuildCollisions(): void {
    this.collision.obstacles.length = 0;
    const half = GAME_CONFIG.worldSize / 2;
    this.collision.addBox(-half - 0.5, 0, 0.5, half, "world boundary");
    this.collision.addBox(half + 0.5, 0, 0.5, half, "world boundary");
    this.collision.addBox(0, -half - 0.5, half, 0.5, "world boundary");
    this.collision.addBox(0, half + 0.5, half, 0.5, "world boundary");
    for (const tree of this.trees) this.collision.addCircle(tree.root.position.x, tree.root.position.z, tree.radius * tree.baseScale * this.config.world.treeScale, "tree");
    for (const rock of this.rocks) this.collision.addCircle(rock.root.position.x, rock.root.position.z, rock.radius * rock.baseScale * this.config.world.rockScale, "rock");
    const cell = this.config.world.gridCellSize;
    for (const wall of this.walls) {
      const x = this.houseOrigin.x + wall.gridX * cell;
      const z = this.houseOrigin.z + wall.gridZ * cell;
      this.collision.addBox(x, z, wall.horizontal ? cell * wall.lengthCells / 2 : 0.13, wall.horizontal ? 0.13 : cell * wall.lengthCells / 2, "wall");
    }
    this.collision.addBox(2.2, 1.2, 0.6, 0.6, "crate");
    this.collision.addCircle(-4, 4, 0.72, "campfire");
  }
}
