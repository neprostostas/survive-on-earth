import type { ItemId } from "../items/ItemId.ts";
import { ITEM_REGISTRY, createItemStack } from "../items/ItemSystem.ts";
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import {
  BUILD_CONFIG,
  gridToWorld,
  layerForCategory,
  tabForCategory,
  type BuildLayer,
  type BuildTab,
} from "./buildConfig.ts";
import { isDamaged, repairCostFor } from "./BuildingRepair.ts";
export { isDamaged, missingHpRatio, repairCostFor, repairHealAmount } from "./BuildingRepair.ts";
export type { RepairCostLine } from "./BuildingRepair.ts";

export interface BuildPieceDef {
  readonly id: string;
  readonly title: string;
  readonly category: "floor" | "wall" | "door" | "furniture" | "station";
  readonly cost: ReadonlyArray<{ itemId: ItemId; quantity: number }>;
  readonly maxHp: number;
}

export const BUILD_PIECES: readonly BuildPieceDef[] = Object.freeze([
  Object.freeze({
    id: "floor-l1",
    title: "Wood Floor",
    category: "floor" as const,
    cost: Object.freeze([{ itemId: "wood-plank" as const, quantity: 2 }]),
    maxHp: 80,
  }),
  Object.freeze({
    id: "wall-l1",
    title: "Wood Wall",
    category: "wall" as const,
    cost: Object.freeze([
      { itemId: "wood-plank" as const, quantity: 3 },
      { itemId: "nails" as const, quantity: 2 },
    ]),
    maxHp: 120,
  }),
  Object.freeze({
    id: "door-l1",
    title: "Wood Door",
    category: "door" as const,
    cost: Object.freeze([
      { itemId: "wood-plank" as const, quantity: 4 },
      { itemId: "nails" as const, quantity: 4 },
    ]),
    maxHp: 100,
  }),
  Object.freeze({
    id: "chest-small",
    title: "Small Chest",
    category: "furniture" as const,
    cost: Object.freeze([
      { itemId: "wood-plank" as const, quantity: 6 },
      { itemId: "nails" as const, quantity: 4 },
    ]),
    maxHp: 60,
  }),
  Object.freeze({
    id: "campfire",
    title: "Campfire",
    category: "station" as const,
    cost: Object.freeze([
      { itemId: "pine-log" as const, quantity: 5 },
      { itemId: "stone" as const, quantity: 3 },
    ]),
    maxHp: 50,
  }),
  Object.freeze({
    id: "woodworking-bench",
    title: "Woodworking Bench",
    category: "station" as const,
    cost: Object.freeze([
      { itemId: "pine-log" as const, quantity: 6 },
      { itemId: "wood-plank" as const, quantity: 4 },
    ]),
    maxHp: 70,
  }),
  Object.freeze({
    id: "furnace",
    title: "Furnace",
    category: "station" as const,
    cost: Object.freeze([
      { itemId: "stone" as const, quantity: 10 },
      { itemId: "charcoal" as const, quantity: 2 },
    ]),
    maxHp: 90,
  }),
  Object.freeze({
    id: "chest-reinforced",
    title: "Reinforced Chest",
    category: "furniture" as const,
    cost: Object.freeze([
      { itemId: "wood-plank" as const, quantity: 8 },
      { itemId: "iron-bar" as const, quantity: 2 },
      { itemId: "nails" as const, quantity: 6 },
    ]),
    maxHp: 140,
  }),
  Object.freeze({
    id: "metal-chest",
    title: "Metal Chest",
    category: "furniture" as const,
    cost: Object.freeze([
      { itemId: "iron-plate" as const, quantity: 4 },
      { itemId: "bolts" as const, quantity: 4 },
    ]),
    maxHp: 200,
  }),
  Object.freeze({
    id: "wall-l2",
    title: "Reinforced Wall",
    category: "wall" as const,
    cost: Object.freeze([
      { itemId: "wood-plank" as const, quantity: 4 },
      { itemId: "stone" as const, quantity: 4 },
      { itemId: "nails" as const, quantity: 4 },
    ]),
    maxHp: 200,
  }),
  Object.freeze({
    id: "wall-stone",
    title: "Stone Wall",
    category: "wall" as const,
    cost: Object.freeze([
      { itemId: "stone-block" as const, quantity: 4 },
      { itemId: "cement" as const, quantity: 1 },
    ]),
    maxHp: 280,
  }),
  Object.freeze({
    id: "door-reinforced",
    title: "Reinforced Door",
    category: "door" as const,
    cost: Object.freeze([
      { itemId: "wood-plank" as const, quantity: 4 },
      { itemId: "iron-bar" as const, quantity: 2 },
      { itemId: "bolts" as const, quantity: 2 },
    ]),
    maxHp: 180,
  }),
  Object.freeze({
    id: "gate-wood",
    title: "Wood Gate",
    category: "door" as const,
    cost: Object.freeze([
      { itemId: "wood-plank" as const, quantity: 8 },
      { itemId: "nails" as const, quantity: 8 },
      { itemId: "rope" as const, quantity: 1 },
    ]),
    maxHp: 160,
  }),
  Object.freeze({
    id: "table-basic",
    title: "Wood Table",
    category: "furniture" as const,
    cost: Object.freeze([
      { itemId: "wood-plank" as const, quantity: 4 },
      { itemId: "nails" as const, quantity: 2 },
    ]),
    maxHp: 40,
  }),
  Object.freeze({
    id: "chair-basic",
    title: "Wood Chair",
    category: "furniture" as const,
    cost: Object.freeze([
      { itemId: "wood-plank" as const, quantity: 2 },
      { itemId: "nails" as const, quantity: 1 },
    ]),
    maxHp: 30,
  }),
  Object.freeze({
    id: "shelf-basic",
    title: "Shelf",
    category: "furniture" as const,
    cost: Object.freeze([
      { itemId: "wood-plank" as const, quantity: 3 },
      { itemId: "nails" as const, quantity: 2 },
    ]),
    maxHp: 40,
  }),
  Object.freeze({
    id: "lantern-post",
    title: "Lantern Post",
    category: "furniture" as const,
    cost: Object.freeze([
      { itemId: "iron-rod" as const, quantity: 1 },
      { itemId: "glass-pane" as const, quantity: 1 },
      { itemId: "charcoal" as const, quantity: 1 },
    ]),
    maxHp: 35,
  }),
  Object.freeze({
    id: "metalwork-bench",
    title: "Metalwork Bench",
    category: "station" as const,
    cost: Object.freeze([
      { itemId: "iron-bar" as const, quantity: 4 },
      { itemId: "wood-plank" as const, quantity: 4 },
      { itemId: "bolts" as const, quantity: 4 },
    ]),
    maxHp: 100,
  }),
  Object.freeze({
    id: "assembly-bench",
    title: "Assembly Bench",
    category: "station" as const,
    cost: Object.freeze([
      { itemId: "iron-plate" as const, quantity: 2 },
      { itemId: "wood-plank" as const, quantity: 6 },
      { itemId: "screws" as const, quantity: 6 },
    ]),
    maxHp: 110,
  }),
  Object.freeze({
    id: "chemistry-station",
    title: "Chemistry Station",
    category: "station" as const,
    cost: Object.freeze([
      { itemId: "glass-pane" as const, quantity: 2 },
      { itemId: "plastic" as const, quantity: 3 },
      { itemId: "iron-bar" as const, quantity: 2 },
    ]),
    maxHp: 90,
  }),
  Object.freeze({
    id: "water-collector",
    title: "Water Collector",
    category: "station" as const,
    cost: Object.freeze([
      { itemId: "plastic" as const, quantity: 4 },
      { itemId: "cloth" as const, quantity: 2 },
      { itemId: "tape" as const, quantity: 2 },
    ]),
    maxHp: 50,
  }),
  Object.freeze({
    id: "camp-generator",
    title: "Camp Generator",
    category: "station" as const,
    cost: Object.freeze([
      { itemId: "scrap-metal" as const, quantity: 8 },
      { itemId: "iron-bar" as const, quantity: 3 },
      { itemId: "wire" as const, quantity: 4 },
      { itemId: "bolts" as const, quantity: 4 },
    ]),
    maxHp: 100,
  }),
  Object.freeze({
    id: "composter",
    title: "Composter",
    category: "station" as const,
    cost: Object.freeze([
      { itemId: "wood-plank" as const, quantity: 6 },
      { itemId: "nails" as const, quantity: 4 },
    ]),
    maxHp: 45,
  }),
  Object.freeze({
    id: "recycler",
    title: "Recycler",
    category: "station" as const,
    cost: Object.freeze([
      { itemId: "scrap-metal" as const, quantity: 6 },
      { itemId: "iron-bar" as const, quantity: 2 },
      { itemId: "bolts" as const, quantity: 4 },
    ]),
    maxHp: 85,
  }),
  Object.freeze({
    id: "weapon-rack",
    title: "Weapon Rack",
    category: "furniture" as const,
    cost: Object.freeze([
      { itemId: "wood-plank" as const, quantity: 5 },
      { itemId: "iron-rod" as const, quantity: 2 },
    ]),
    maxHp: 55,
  }),
  Object.freeze({
    id: "medical-cabinet",
    title: "Medical Cabinet",
    category: "furniture" as const,
    cost: Object.freeze([
      { itemId: "wood-plank" as const, quantity: 4 },
      { itemId: "glass-pane" as const, quantity: 1 },
      { itemId: "nails" as const, quantity: 3 },
    ]),
    maxHp: 50,
  }),
  Object.freeze({
    id: "cold-box",
    title: "Cold Box",
    category: "furniture" as const,
    cost: Object.freeze([
      { itemId: "scrap-metal" as const, quantity: 6 },
      { itemId: "iron-bar" as const, quantity: 3 },
      { itemId: "wire" as const, quantity: 2 },
      { itemId: "bolts" as const, quantity: 4 },
    ]),
    maxHp: 90,
  }),
  Object.freeze({
    id: "base-radio",
    title: "Base Radio",
    category: "furniture" as const,
    cost: Object.freeze([
      { itemId: "scrap-metal" as const, quantity: 3 },
      { itemId: "wire" as const, quantity: 3 },
      { itemId: "plastic" as const, quantity: 2 },
      { itemId: "screws" as const, quantity: 2 },
    ]),
    maxHp: 45,
  }),
]);

export interface PlacedBuildPiece {
  readonly id: string;
  readonly pieceId: string;
  readonly gridX: number;
  readonly gridZ: number;
  readonly rotation: 0 | 90 | 180 | 270;
  readonly hp: number;
  readonly maxHp: number;
  readonly level: number;
  readonly layer: BuildLayer;
  /** Doors/gates: player-toggle open passage (default closed). */
  readonly isOpen?: boolean;
}

export type PlaceBlockReason =
  | "not-selected"
  | "unknown-piece"
  | "out-of-bounds"
  | "slot-occupied"
  | "needs-floor"
  | "not-adjacent"
  | "not-enough-resources"
  | "invalid-cell";

function countOwned(inventory: PlayerInventory, itemId: ItemId): number {
  let total = 0;
  for (let i = 0; i < inventory.slotCount; i += 1) {
    const stack = inventory.getSlot(i).stack;
    if (stack?.itemId === itemId) total += stack.quantity;
  }
  return total;
}

/** Atomic multi-item consume by lowest slots — no partial commit. */
function tryConsumeCost(
  inventory: PlayerInventory,
  cost: ReadonlyArray<{ itemId: ItemId; quantity: number }>,
): boolean {
  for (const line of cost) {
    ITEM_REGISTRY.get(line.itemId);
    if (countOwned(inventory, line.itemId) < line.quantity) return false;
  }
  for (const line of cost) {
    let remaining = line.quantity;
    for (let i = 0; i < inventory.slotCount && remaining > 0; i += 1) {
      const stack = inventory.getSlot(i).stack;
      if (!stack || stack.itemId !== line.itemId) continue;
      const take = Math.min(stack.quantity, remaining);
      if (stack.quantity === take) inventory.exchangeWholeStack(i, stack, null);
      else inventory.exchangeWholeStack(i, stack, createItemStack(stack.itemId, stack.quantity - take));
      remaining -= take;
    }
    if (remaining > 0) throw new Error("Build cost consume invariant failed");
  }
  return true;
}

function getDef(pieceId: string): BuildPieceDef | undefined {
  return BUILD_PIECES.find((p) => p.id === pieceId);
}

export function isPassagePieceId(pieceId: string): boolean {
  const def = getDef(pieceId);
  return def?.category === "door";
}

/**
 * LDOE-style grid base builder domain (Home only).
 * Floors first; walls/doors/furniture on floor cells; Build vs Furniture tabs.
 */
export class BuildingRegistry {
  private pieces: PlacedBuildPiece[] = [];
  private nextId = 1;
  private modeOpen = false;
  private selectedPieceId: string | null = "floor-l1";
  private rotation: 0 | 90 | 180 | 270 = 0;
  private activeTab: BuildTab = "build";
  private demolishMode = false;
  private repairMode = false;

  get isBuildMode(): boolean { return this.modeOpen; }
  get selected(): string | null { return this.selectedPieceId; }
  get currentRotation(): 0 | 90 | 180 | 270 { return this.rotation; }
  get all(): readonly PlacedBuildPiece[] { return this.pieces; }
  get tab(): BuildTab { return this.activeTab; }
  get isDemolishMode(): boolean { return this.demolishMode; }
  get isRepairMode(): boolean { return this.repairMode; }

  open(): void { this.modeOpen = true; }
  close(): void {
    this.modeOpen = false;
    this.demolishMode = false;
    this.repairMode = false;
  }
  toggle(): void {
    if (this.modeOpen) this.close();
    else this.open();
  }

  setTab(tab: BuildTab): void {
    this.activeTab = tab;
    this.demolishMode = false;
    this.repairMode = false;
    // Auto-select first piece in tab if current is wrong tab
    const current = this.selectedPieceId ? getDef(this.selectedPieceId) : null;
    if (!current || tabForCategory(current.category) !== tab) {
      const first = BUILD_PIECES.find((p) => tabForCategory(p.category) === tab);
      this.selectedPieceId = first?.id ?? null;
    }
  }

  setDemolishMode(on: boolean): void {
    this.demolishMode = on;
    if (on) this.repairMode = false;
  }

  setRepairMode(on: boolean): void {
    this.repairMode = on;
    if (on) this.demolishMode = false;
  }

  select(pieceId: string): void {
    const def = getDef(pieceId);
    if (!def) return;
    this.selectedPieceId = pieceId;
    this.activeTab = tabForCategory(def.category);
    this.demolishMode = false;
    this.repairMode = false;
  }

  rotate(): void {
    this.rotation = ((this.rotation + 90) % 360) as 0 | 90 | 180 | 270;
  }

  piecesInTab(tab: BuildTab): readonly BuildPieceDef[] {
    return BUILD_PIECES.filter((p) => tabForCategory(p.category) === tab);
  }

  getSelectedDef(): BuildPieceDef | null {
    return this.selectedPieceId ? getDef(this.selectedPieceId) ?? null : null;
  }

  pieceAt(gridX: number, gridZ: number, layer: BuildLayer): PlacedBuildPiece | null {
    return this.pieces.find((p) => p.gridX === gridX && p.gridZ === gridZ && p.layer === layer) ?? null;
  }

  hasFloor(gridX: number, gridZ: number): boolean {
    return this.pieceAt(gridX, gridZ, "floor") !== null;
  }

  private floorCount(): number {
    return this.pieces.filter((p) => p.layer === "floor").length;
  }

  private isAdjacentToFloor(gridX: number, gridZ: number): boolean {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
    return dirs.some(([dx, dz]) => this.hasFloor(gridX + dx, gridZ + dz));
  }

  private inHomeBounds(gridX: number, gridZ: number): boolean {
    return Math.hypot(gridX, gridZ) <= BUILD_CONFIG.homeRadiusCells + 0.01;
  }

  /**
   * LDOE rules:
   * - floor: first free anywhere in lot; later floors must be orthogonal-adjacent to an existing floor
   * - wall/door: only on a floor cell, one structure per cell
   * - furniture/station: only on a floor cell, one furniture per cell
   */
  validatePlace(gridX: number, gridZ: number, pieceId?: string | null): PlaceBlockReason | null {
    const id = pieceId ?? this.selectedPieceId;
    if (!id) return "not-selected";
    const def = getDef(id);
    if (!def) return "unknown-piece";
    if (!this.inHomeBounds(gridX, gridZ)) return "out-of-bounds";

    const layer = layerForCategory(def.category);
    if (this.pieceAt(gridX, gridZ, layer)) return "slot-occupied";

    if (def.category === "floor") {
      // First floor free in lot; further floors expand from existing (LDOE).
      if (this.floorCount() === 0) return null;
      if (!this.isAdjacentToFloor(gridX, gridZ)) return "not-adjacent";
      return null;
    }

    // Walls, doors, furniture, stations require a floor tile (LDOE floors-first).
    if (!this.hasFloor(gridX, gridZ)) return "needs-floor";
    return null;
  }

  canPlace(gridX: number, gridZ: number): boolean {
    return this.validatePlace(gridX, gridZ) === null;
  }

  canAfford(inventory: PlayerInventory, pieceId?: string | null): boolean {
    const id = pieceId ?? this.selectedPieceId;
    const def = id ? getDef(id) : null;
    if (!def) return false;
    return def.cost.every((line) => countOwned(inventory, line.itemId) >= line.quantity);
  }

  costOwnedSummary(inventory: PlayerInventory, pieceId?: string | null): readonly { itemId: ItemId; need: number; have: number }[] {
    const id = pieceId ?? this.selectedPieceId;
    const def = id ? getDef(id) : null;
    if (!def) return Object.freeze([]);
    return Object.freeze(def.cost.map((line) => Object.freeze({
      itemId: line.itemId,
      need: line.quantity,
      have: countOwned(inventory, line.itemId),
    })));
  }

  /**
   * Place with transactional material deduction.
   * On fail: no piece, no material loss.
   */
  placeWithCost(inventory: PlayerInventory, gridX: number, gridZ: number): { piece: PlacedBuildPiece | null; reason: PlaceBlockReason | null } {
    const blocked = this.validatePlace(gridX, gridZ);
    if (blocked) return { piece: null, reason: blocked };
    const def = this.getSelectedDef();
    if (!def) return { piece: null, reason: "not-selected" };
    if (!this.canAfford(inventory)) return { piece: null, reason: "not-enough-resources" };
    if (!tryConsumeCost(inventory, def.cost)) return { piece: null, reason: "not-enough-resources" };
    const piece = this.createPiece(def, gridX, gridZ);
    this.pieces = [...this.pieces, piece];
    return { piece, reason: null };
  }

  /** Domain-only place without cost (debug / load restore). */
  place(gridX: number, gridZ: number): PlacedBuildPiece | null {
    if (this.validatePlace(gridX, gridZ)) return null;
    const def = this.getSelectedDef();
    if (!def) return null;
    const piece = this.createPiece(def, gridX, gridZ);
    this.pieces = [...this.pieces, piece];
    return piece;
  }

  /** Remove topmost piece on cell (furniture → structure → floor) like LDOE pick-up / demolish. */
  demolishAt(gridX: number, gridZ: number): PlacedBuildPiece | null {
    const order: BuildLayer[] = ["furniture", "structure", "floor"];
    for (const layer of order) {
      const piece = this.pieceAt(gridX, gridZ, layer);
      if (!piece) continue;
      // Cannot remove floor while structure/furniture still on cell
      if (layer === "floor") {
        if (this.pieceAt(gridX, gridZ, "structure") || this.pieceAt(gridX, gridZ, "furniture")) continue;
      }
      this.pieces = this.pieces.filter((p) => p.id !== piece.id);
      return piece;
    }
    return null;
  }

  private createPiece(def: BuildPieceDef, gridX: number, gridZ: number): PlacedBuildPiece {
    return Object.freeze({
      id: `build-${this.nextId++}`,
      pieceId: def.id,
      gridX,
      gridZ,
      rotation: this.rotation,
      hp: def.maxHp,
      maxHp: def.maxHp,
      level: 1,
      layer: layerForCategory(def.category),
      ...(def.category === "door" ? { isOpen: false as const } : {}),
    });
  }

  /** Topmost piece under cursor (furniture → structure → floor). */
  topPieceAt(gridX: number, gridZ: number): PlacedBuildPiece | null {
    const order: BuildLayer[] = ["furniture", "structure", "floor"];
    for (const layer of order) {
      const piece = this.pieceAt(gridX, gridZ, layer);
      if (piece) return piece;
    }
    return null;
  }

  /** Open/close door or gate. Returns new isOpen, or null if not a passage piece. */
  togglePassage(instanceId: string): boolean | null {
    const current = this.pieces.find((p) => p.id === instanceId);
    if (!current || !isPassagePieceId(current.pieceId)) return null;
    const isOpen = current.isOpen !== true;
    this.pieces = this.pieces.map((p) =>
      (p.id === instanceId ? Object.freeze({ ...p, isOpen }) : p));
    return isOpen;
  }

  isPassageOpen(instanceId: string): boolean {
    const p = this.pieces.find((x) => x.id === instanceId);
    return p?.isOpen === true;
  }

  /** Prefer damaged piece if any on the cell; else topmost. */
  repairTargetAt(gridX: number, gridZ: number): PlacedBuildPiece | null {
    const order: BuildLayer[] = ["furniture", "structure", "floor"];
    let damaged: PlacedBuildPiece | null = null;
    let top: PlacedBuildPiece | null = null;
    for (const layer of order) {
      const piece = this.pieceAt(gridX, gridZ, layer);
      if (!piece) continue;
      if (!top) top = piece;
      if (piece.hp < piece.maxHp) {
        damaged = piece;
        break;
      }
    }
    return damaged ?? top;
  }

  /** Nearest non-floor structure/furniture to world XZ within maxDist. */
  nearestStructure(worldX: number, worldZ: number, maxDist: number): PlacedBuildPiece | null {
    let best: PlacedBuildPiece | null = null;
    let bestD = maxDist;
    for (const piece of this.pieces) {
      if (piece.layer === "floor") continue;
      const p = gridToWorld(piece.gridX, piece.gridZ);
      const d = Math.hypot(p.x - worldX, p.z - worldZ);
      if (d < bestD) {
        bestD = d;
        best = piece;
      }
    }
    return best;
  }

  /**
   * Apply damage. Returns destroyed piece snapshot when HP hit 0, else the updated piece, or null if missing.
   */
  damagePiece(id: string, amount: number): { destroyed: boolean; piece: PlacedBuildPiece | null } {
    const current = this.pieces.find((p) => p.id === id);
    if (!current || amount <= 0) return { destroyed: false, piece: current ?? null };
    const hp = Math.max(0, current.hp - amount);
    if (hp <= 0) {
      this.pieces = this.pieces.filter((p) => p.id !== id);
      return { destroyed: true, piece: current };
    }
    const next = Object.freeze({ ...current, hp });
    this.pieces = this.pieces.map((p) => (p.id === id ? next : p));
    return { destroyed: false, piece: next };
  }

  /** @deprecated use damagePiece */
  damage(id: string, amount: number): boolean {
    const r = this.damagePiece(id, amount);
    return r.piece !== null || r.destroyed;
  }

  repair(id: string, amount: number): boolean {
    const current = this.pieces.find((p) => p.id === id);
    if (!current || amount <= 0) return false;
    const hp = Math.min(current.maxHp, current.hp + amount);
    this.pieces = this.pieces.map((p) => (p.id === id ? Object.freeze({ ...p, hp }) : p));
    return true;
  }

  /** Full heal after paying materials. */
  repairFull(id: string): boolean {
    const current = this.pieces.find((p) => p.id === id);
    if (!current || current.hp >= current.maxHp) return false;
    this.pieces = this.pieces.map((p) =>
      (p.id === id ? Object.freeze({ ...p, hp: p.maxHp }) : p));
    return true;
  }

  /**
   * Repair damaged piece at cell (material cost ≈ missing HP fraction).
   */
  tryRepairAt(
    inventory: PlayerInventory,
    gridX: number,
    gridZ: number,
  ): {
    ok: boolean;
    reason: "none" | "full" | "need-materials" | null;
    piece: PlacedBuildPiece | null;
    cost: readonly { itemId: ItemId; quantity: number }[];
  } {
    const target = this.repairTargetAt(gridX, gridZ);
    if (!target) return { ok: false, reason: "none", piece: null, cost: Object.freeze([]) };
    if (!isDamaged(target)) {
      return { ok: false, reason: "full", piece: target, cost: Object.freeze([]) };
    }
    const def = getDef(target.pieceId);
    if (!def) return { ok: false, reason: "none", piece: null, cost: Object.freeze([]) };
    const cost = repairCostFor(target, def);
    if (!tryConsumeCost(inventory, cost)) {
      return { ok: false, reason: "need-materials", piece: target, cost };
    }
    this.repairFull(target.id);
    const fixed = this.pieces.find((p) => p.id === target.id) ?? null;
    return { ok: true, reason: null, piece: fixed, cost };
  }

  serialize(): readonly PlacedBuildPiece[] { return this.pieces; }

  load(pieces: readonly PlacedBuildPiece[]): void {
    this.pieces = pieces.map((p) => {
      const def = getDef(p.pieceId);
      const isDoor = def?.category === "door";
      return Object.freeze({
        ...p,
        maxHp: p.maxHp ?? def?.maxHp ?? 80,
        level: p.level ?? 1,
        layer: p.layer ?? (def ? layerForCategory(def.category) : "floor"),
        ...(isDoor ? { isOpen: p.isOpen === true } : { isOpen: undefined }),
      });
    });
    this.nextId = pieces.reduce((max, p) => Math.max(max, Number(p.id.replace(/\D/g, "")) || 0), 0) + 1;
  }

  clear(): void {
    this.pieces = [];
    this.nextId = 1;
  }
}

