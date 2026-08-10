import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import type { CalibrationConfig } from "../config/calibrationConfig";
import { GAME_CONFIG } from "../config/gameConfig";
import type { CollisionWorld } from "../collision/CollisionWorld";
import { createInteractable, type Interactable } from "../interaction/Interactable";
import { createWorldMaterials, type WorldMaterials } from "../rendering/Materials";
import { createRock, type RockObject } from "./objects/Rock";
import { createTree, type TreeObject } from "./objects/Tree";
import { createWall, type WallObject } from "./objects/Wall";
import { createCrate, type CrateObject } from "./objects/Crate";
import { CampfireObject } from "./objects/Campfire";
import { ProceduralTextureFactory } from "../rendering/ProceduralTextureFactory";
import { GroundSurface } from "./detail/GroundSurface";
import { GroundClutter } from "./detail/GroundClutter";
import { getVisualQualitySettings } from "../config/visualQualityConfig";
import { HarvestableResource } from "../harvesting/HarvestableResource";
import { HarvestImpactEffects } from "./detail/HarvestImpactEffects";
import type { MinimapMarker } from "../ui/minimapTypes";
import { createPlantNode, type PlantNode } from "./objects/PlantNode";
import { createHomeDecorationLayer } from "./detail/HomeDecor";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { LocationId } from "../locations/LocationRegistry";
import { getLocationVisualTheme, type LocationVisualTheme } from "../locations/LocationVisualTheme";
import { createBiomePropPack } from "./detail/BiomePropPacks";
import { createSeededRng, hashString, rngAwayFromOrigin } from "../locations/locationRng";

interface FloorTile { mesh: Mesh; gridX: number; gridZ: number }

/** World XZ of the 3×3 house floor center (middle cell). */
export const HOME_HOUSE_ORIGIN = Object.freeze({ x: 8, z: -10 });

export class TestLocation {
  readonly interactables: Interactable[] = [];
  readonly harvestables: HarvestableResource[] = [];
  private readonly materials: WorldMaterials;
  private readonly trees: TreeObject[] = [];
  private readonly rocks: RockObject[] = [];
  private readonly plants: PlantNode[] = [];
  private readonly walls: WallObject[] = [];
  private readonly floors: FloorTile[] = [];
  private readonly houseOrigin = new Vector3(HOME_HOUSE_ORIGIN.x, 0, HOME_HOUSE_ORIGIN.z);
  private readonly textures: ProceduralTextureFactory;
  private readonly ground: GroundSurface;
  private readonly clutter: GroundClutter;
  private readonly harvestEffects: HarvestImpactEffects;
  private crate!: CrateObject;
  private campfire!: CampfireObject;
  private visualTime = 0;
  private readonly homeDecorRoot: TransformNode;
  /** Prop packs keyed by locationId — never share meshes across sites. */
  private readonly locationPacks = new Map<string, TransformNode>();
  private activePackId: string | null = null;
  private currentTheme: LocationVisualTheme = getLocationVisualTheme("home");
  private currentLocationId: LocationId = "home";
  /** Home baseline positions captured once at boot. */
  private readonly homeTreePos: { x: number; z: number }[] = [];
  private readonly homeRockPos: { x: number; z: number }[] = [];
  private readonly homePlantPos: { x: number; z: number }[] = [];
  private homeCrateX = 2.2;
  private homeCrateZ = 1.2;
  private homeCampX = -4;
  private homeCampZ = 4;

  constructor(
    private readonly scene: Scene,
    private readonly collision: CollisionWorld,
    private readonly config: CalibrationConfig,
  ) {
    this.textures = new ProceduralTextureFactory(scene);
    this.materials = createWorldMaterials(scene, this.textures);
    this.ground = new GroundSurface(scene, this.textures, config);
    this.clutter = new GroundClutter(scene, this.materials, config);
    this.harvestEffects = new HarvestImpactEffects(scene, this.materials);
    this.createForest();
    this.createHouse();
    this.createProps();
    this.homeDecorRoot = createHomeDecorationLayer(scene);
    this.captureHomeLayout();
    this.applyCalibration();
    this.applyLocationVisual("home");
  }

  get lastTheme(): LocationVisualTheme { return this.currentTheme; }

  private captureHomeLayout(): void {
    for (const t of this.trees) this.homeTreePos.push({ x: t.root.position.x, z: t.root.position.z });
    for (const r of this.rocks) this.homeRockPos.push({ x: r.root.position.x, z: r.root.position.z });
    for (const p of this.plants) this.homePlantPos.push({ x: p.root.position.x, z: p.root.position.z });
    this.homeCrateX = this.crate.root.position.x;
    this.homeCrateZ = this.crate.root.position.z;
    this.homeCampX = this.campfire.root.position.x;
    this.homeCampZ = this.campfire.root.position.z;
  }

  /**
   * Re-skin + re-layout the plane for a destination. Natural objects move, packs
   * are unique per locationId, house/crate/training props home-only.
   */
  applyLocationVisual(locationId: LocationId): LocationVisualTheme {
    const theme = getLocationVisualTheme(locationId);
    this.currentTheme = theme;
    this.currentLocationId = locationId;
    this.ground.applyTheme(theme);
    this.ground.applyLayoutSeed(hashString(locationId));
    this.clutter.setThemeDensity(theme.clutterDensity);

    for (const floor of this.floors) floor.mesh.setEnabled(theme.showHouse);
    for (const wall of this.walls) {
      wall.root.setEnabled(theme.showHouse);
      for (const mesh of wall.meshes) mesh.setEnabled(theme.showHouse);
    }
    this.homeDecorRoot.setEnabled(theme.showHomeDecor);
    this.campfire.root.setEnabled(theme.showCampfire);
    this.crate.root.setEnabled(theme.showCrate && locationId === "home");

    this.relayoutNaturalObjects(locationId, theme);

    // Hide previous location pack; enable/create unique pack for this site
    if (this.activePackId && this.activePackId !== locationId) {
      this.locationPacks.get(this.activePackId)?.setEnabled(false);
    }
    this.activePackId = locationId === "home" ? null : locationId;
    if (locationId !== "home") {
      let pack = this.locationPacks.get(locationId);
      if (!pack) {
        pack = createBiomePropPack(this.scene, theme.biome, hashString(locationId) ^ 0xa5a5a5a5);
        this.locationPacks.set(locationId, pack);
      }
      pack.setEnabled(true);
    } else {
      for (const pack of this.locationPacks.values()) pack.setEnabled(false);
    }

    this.rebuildCollisions();
    return theme;
  }

  private relayoutNaturalObjects(locationId: LocationId, theme: LocationVisualTheme): void {
    if (locationId === "home") {
      this.trees.forEach((tree, i) => {
        const p = this.homeTreePos[i];
        if (p) tree.root.position.set(p.x, 0, p.z);
        tree.root.setEnabled(true);
        tree.root.scaling.setAll(tree.baseScale * this.config.world.treeScale * theme.treeScale);
      });
      this.rocks.forEach((rock, i) => {
        const p = this.homeRockPos[i];
        if (p) rock.root.position.set(p.x, 0, p.z);
        rock.root.setEnabled(i / Math.max(1, this.rocks.length) < theme.rockVisibility);
        rock.root.scaling.setAll(rock.baseScale * this.config.world.rockScale * theme.rockScale);
      });
      this.plants.forEach((plant, i) => {
        const p = this.homePlantPos[i];
        if (p) plant.root.position.set(p.x, 0, p.z);
        plant.root.setEnabled(true);
      });
      this.crate.root.position.set(this.homeCrateX, 0, this.homeCrateZ);
      this.campfire.root.position.set(this.homeCampX, 0, this.homeCampZ);
      return;
    }

    const rng = createSeededRng(hashString(locationId) ^ 0xC0FFEE);
    const placeAway = () => {
      const p = rngAwayFromOrigin(rng, 5.5, 22);
      return p;
    };

    this.trees.forEach((tree, index) => {
      const visible = index / Math.max(1, this.trees.length) < theme.treeVisibility;
      tree.root.setEnabled(visible);
      if (visible) {
        const p = placeAway();
        tree.root.position.set(p.x, 0, p.z);
        tree.root.scaling.setAll(tree.baseScale * this.config.world.treeScale * theme.treeScale * (0.85 + rng() * 0.35));
        tree.root.rotation.y = rng() * Math.PI * 2;
      }
    });
    this.rocks.forEach((rock, index) => {
      const visible = index / Math.max(1, this.rocks.length) < theme.rockVisibility;
      rock.root.setEnabled(visible);
      if (visible) {
        const p = placeAway();
        rock.root.position.set(p.x, 0, p.z);
        rock.root.scaling.setAll(rock.baseScale * this.config.world.rockScale * theme.rockScale * (0.8 + rng() * 0.5));
        rock.root.rotation.y = rng() * Math.PI * 2;
      }
    });
    this.plants.forEach((plant, index) => {
      const visible = index / Math.max(1, this.plants.length) < theme.plantVisibility;
      plant.root.setEnabled(visible);
      if (visible) {
        const p = placeAway();
        plant.root.position.set(p.x, 0, p.z);
        plant.root.rotation.y = rng() * Math.PI * 2;
      }
    });

    if (theme.showCampfire) {
      const p = placeAway();
      this.campfire.root.position.set(p.x, 0, p.z);
    }
  }

  get clutterCount(): number { return this.clutter.count; }

  /** Live minimap markers sourced from location geometry / harvest state. */
  collectMinimapMarkers(): readonly MinimapMarker[] {
    const markers: MinimapMarker[] = [];
    const cell = this.config.world.gridCellSize;
    if (this.currentTheme.showHouse) {
      const houseHalf = cell * 1.5;
      markers.push(Object.freeze({
        kind: "house-floor",
        x: this.houseOrigin.x,
        z: this.houseOrigin.z,
        halfX: houseHalf,
        halfZ: houseHalf,
      }));
      for (const wall of this.walls) {
        const cx = this.houseOrigin.x + wall.gridX * cell;
        const cz = this.houseOrigin.z + wall.gridZ * cell;
        const halfLen = cell * wall.lengthCells / 2;
        if (wall.horizontal) {
          markers.push(Object.freeze({ kind: "wall", x0: cx - halfLen, z0: cz, x1: cx + halfLen, z1: cz }));
        } else {
          markers.push(Object.freeze({ kind: "wall", x0: cx, z0: cz - halfLen, x1: cx, z1: cz + halfLen }));
        }
      }
    }
    for (let index = 0; index < this.trees.length; index += 1) {
      const resource = this.harvestables[index];
      if (resource?.isDepleted) continue;
      const tree = this.trees[index];
      if (!tree.root.isEnabled()) continue;
      markers.push(Object.freeze({ kind: "tree", x: tree.root.position.x, z: tree.root.position.z }));
    }
    for (let index = 0; index < this.rocks.length; index += 1) {
      const resource = this.harvestables[this.trees.length + index];
      if (resource?.isDepleted) continue;
      const rock = this.rocks[index];
      if (!rock.root.isEnabled()) continue;
      markers.push(Object.freeze({ kind: "rock", x: rock.root.position.x, z: rock.root.position.z }));
    }
    if (this.crate.root.isEnabled()) {
      markers.push(Object.freeze({ kind: "crate", x: this.crate.root.position.x, z: this.crate.root.position.z }));
    }
    if (this.campfire.root.isEnabled()) {
      markers.push(Object.freeze({ kind: "campfire", x: this.campfire.root.position.x, z: this.campfire.root.position.z }));
    }
    return Object.freeze(markers);
  }

  removeResourceCollision(resourceId: string): void { this.collision.remove(resourceId); }

  applyCalibration(): void {
    const treeMul = this.currentTheme.treeScale;
    const rockMul = this.currentTheme.rockScale;
    for (const tree of this.trees) {
      if (!tree.root.isEnabled()) continue;
      tree.root.scaling.setAll(tree.baseScale * this.config.world.treeScale * treeMul);
    }
    for (const rock of this.rocks) {
      if (!rock.root.isEnabled()) continue;
      rock.root.scaling.setAll(rock.baseScale * this.config.world.rockScale * rockMul);
    }
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
    for (const resource of this.harvestables) resource.updateVisual(delta);
    this.harvestEffects.update(delta);
    this.campfire.update(delta, getVisualQualitySettings(this.config.visual.qualityPreset).fireComplexity);
  }

  private createForest(): void {
    // Dense Home rim + forest edge + stone edge micro-regions.
    const positions = [
      [-9,1],[-8,4],[-7,8],[-7,11],[-4,13],[-1,12],[5,12],[8,10],[10,5],[11,2],
      [5,-4],[1,-6],[-3,-5],[-6,-3],[-15,-9],[-14,10],[14,-11],[17,4],[-3,19],[18,16],
      // Outer forest wall
      [-20,8],[-19,-6],[-17,16],[-16,-14],[16,18],[19,-8],[20,10],[-12,20],[12,20],[-8,-18],
      [6,-17],[-21,2],[21,-2],[15,-16],[-15,5],[8,18],[-18,-11],[18,14],[-10,-16],[10,-19],
      // Young / inner edge trees
      [-11,9],[-9,-6],[12,7],[13,-4],[-5,15],[2,14],[-14,0],[0,-12],
    ];
    positions.forEach(([x, z], index) => {
      const tree = createTree(this.scene, this.materials, x, z, index);
      this.trees.push(tree);
      const resource = new HarvestableResource({
        id: `tree-${String(index + 1).padStart(2, "0")}`,
        kind: "pine-tree",
        position: () => tree.root.position,
        radius: () => tree.radius * tree.baseScale * this.config.world.treeScale,
        visualEnabled: () => !tree.root.isDisposed() && tree.root.isEnabled(),
        visual: {
          impact: (_playerPosition, strength, particleIntensity) => {
            tree.impact(strength);
            this.harvestEffects.spawn("pine-tree", tree.root.position, particleIntensity);
          },
          deplete: (playerPosition, strength, particleIntensity) => {
            tree.deplete(playerPosition.x, playerPosition.z, strength);
            this.harvestEffects.spawn("pine-tree", tree.root.position, particleIntensity, true);
          },
          update: (delta) => { tree.updateHarvest(delta); },
        },
      });
      this.harvestables.push(resource);
      this.interactables.push(resource);
    });
    const rocks = [
      [-5,0],[-5,8],[3,10],[7,5],[3,-2],[-12,-7],[13,-7],[-13,14],[6,17],[17,11],
      [-18,4],[18,6],[-16,-16],[16,-14],[0,18],[4,-15],[-8,16],[14,12],[-20,-3],[9,15],
    ];
    rocks.forEach(([x, z], index) => {
      const rock = createRock(this.scene, this.materials, x, z, index);
      this.rocks.push(rock);
      const resource = new HarvestableResource({
        id: `rock-${String(index + 1).padStart(2, "0")}`,
        kind: "limestone-rock",
        position: () => rock.root.position,
        radius: () => rock.radius * rock.baseScale * this.config.world.rockScale,
        visualEnabled: () => !rock.root.isDisposed() && rock.root.isEnabled(),
        visual: {
          impact: (_playerPosition, strength, particleIntensity) => {
            rock.impact(strength);
            this.harvestEffects.spawn("limestone-rock", rock.root.position, particleIntensity);
          },
          deplete: (_playerPosition, strength, particleIntensity) => {
            rock.deplete(strength);
            this.harvestEffects.spawn("limestone-rock", rock.root.position, particleIntensity, true);
          },
          update: (delta) => { rock.updateHarvest(delta); },
        },
      });
      this.harvestables.push(resource);
      this.interactables.push(resource);
    });
    this.createPlantResources();
  }

  private createPlantResources(): void {
    const fibers: Array<[number, number]> = [
      [-6.5, 5.5], [-3.2, 7.8], [4.5, 8.2], [6.8, 3.4], [-8.2, -1.5], [2.2, -4.5],
      [-10, 3], [7.5, -1.5], [-2, 11], [9, 4.5], [-4.5, -3.5], [1, 7],
    ];
    fibers.forEach(([x, z], index) => {
      const plant = createPlantNode(this.scene, "fiber", x, z, index + 3);
      this.plants.push(plant);
      const resource = new HarvestableResource({
        id: `fiber-${String(index + 1).padStart(2, "0")}`,
        kind: "fiber-plant",
        position: () => plant.root.position,
        radius: () => plant.radius,
        visualEnabled: () => !plant.root.isDisposed() && plant.root.isEnabled(),
        visual: {
          impact: () => { /* soft plant sway omitted */ },
          deplete: () => { plant.deplete(); },
          update: () => { /* static */ },
        },
      });
      this.harvestables.push(resource);
      this.interactables.push(resource);
    });
    const berries: Array<[number, number]> = [
      [-1.8, 8.5], [1.4, 9.1], [5.2, -3.2], [-5.5, 2.1],
      [8.5, 1], [-7, 10], [3.5, 6.5], [-0.5, -3],
    ];
    berries.forEach(([x, z], index) => {
      const plant = createPlantNode(this.scene, "berry", x, z, index + 11);
      this.plants.push(plant);
      const resource = new HarvestableResource({
        id: `berry-${String(index + 1).padStart(2, "0")}`,
        kind: "berry-bush",
        position: () => plant.root.position,
        radius: () => plant.radius,
        visualEnabled: () => !plant.root.isDisposed() && plant.root.isEnabled(),
        visual: {
          impact: () => { /* soft */ },
          deplete: () => { plant.deplete(); },
          update: () => { /* static */ },
        },
      });
      this.harvestables.push(resource);
      this.interactables.push(resource);
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
    }
  }

  private createProps(): void {
    // Center of the 3×3 house floor grid (houseOrigin is the middle cell).
    const crateX = this.houseOrigin.x;
    const crateZ = this.houseOrigin.z;
    this.crate = createCrate(this.scene, this.materials, crateX, crateZ);
    this.homeCrateX = crateX;
    this.homeCrateZ = crateZ;
    this.interactables.push(createInteractable({
      id: "crate-01",
      type: "container",
      position: () => this.crate.root.position,
      radius: () => 0.6,
      enabled: () => !this.crate.root.isDisposed() && this.crate.root.isEnabled(),
    }));
    this.campfire = new CampfireObject(this.scene, this.materials, -4, 4);
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
    for (let index = 0; index < this.trees.length; index += 1) {
      const resource = this.harvestables[index];
      const tree = this.trees[index];
      if (!tree.root.isEnabled()) continue;
      if (!resource?.isDepleted) this.collision.addCircle(tree.root.position.x, tree.root.position.z, tree.radius * tree.baseScale * this.config.world.treeScale * this.currentTheme.treeScale, resource?.resourceId ?? `tree-${index + 1}`);
    }
    for (let index = 0; index < this.rocks.length; index += 1) {
      const resource = this.harvestables[this.trees.length + index];
      const rock = this.rocks[index];
      if (!rock.root.isEnabled()) continue;
      if (!resource?.isDepleted) this.collision.addCircle(rock.root.position.x, rock.root.position.z, rock.radius * rock.baseScale * this.config.world.rockScale * this.currentTheme.rockScale, resource?.resourceId ?? `rock-${index + 1}`);
    }
    const cell = this.config.world.gridCellSize;
    if (this.currentTheme.showHouse) {
      for (const wall of this.walls) {
        const x = this.houseOrigin.x + wall.gridX * cell;
        const z = this.houseOrigin.z + wall.gridZ * cell;
        this.collision.addBox(x, z, wall.horizontal ? cell * wall.lengthCells / 2 : 0.13, wall.horizontal ? 0.13 : cell * wall.lengthCells / 2, "wall");
      }
    }
    if (this.crate.root.isEnabled()) {
      this.collision.addBox(this.crate.root.position.x, this.crate.root.position.z, 0.6, 0.6, "crate");
    }
    if (this.campfire.root.isEnabled()) {
      this.collision.addCircle(this.campfire.root.position.x, this.campfire.root.position.z, 0.72, "campfire");
    }
    // Landmark soft collision offset unique per location
    if (this.currentTheme.biome !== "home") {
      const seed = hashString(this.currentLocationId);
      const lx = ((seed % 17) - 8) * 1.4 + 8;
      const lz = ((((seed >>> 8) % 17) - 8) * 1.4) - 6;
      this.collision.addBox(lx, lz, 1.8, 1.8, "landmark");
    }
  }
}
