import type { Interactable } from "../interaction/Interactable";
import type { InteractionPoint } from "../interaction/InteractionTypes";
import type { ItemResult, ResourceResultSink, ResultWorldPoint } from "../items/ItemResult";
import type { ItemStack } from "../items/ItemSystem";
import { GroundLoot } from "./GroundLoot.ts";
import { GROUND_LOOT_CONFIG } from "./groundLootConfig.ts";

export interface GroundLootRegistry {
  addInteractable(interactable: Interactable): void;
  removeInteractable(interactable: Interactable): void;
}

export interface GroundLootPresentation {
  spawn(entity: GroundLoot): void;
  collect(entity: GroundLoot, playerPosition: InteractionPoint): void;
  update(delta: number): readonly string[];
  remove(entity: GroundLoot): void;
}

export interface SerializedGroundLoot {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly itemId: ItemStack["itemId"];
  readonly quantity: number;
  readonly currentDurability?: number;
}

export function groundLootPosition(source: ResultWorldPoint, index: number, count: number): InteractionPoint {
  const safeCount = Math.max(1, count);
  const angle = safeCount === 1 ? Math.PI * 0.25 : -Math.PI * 0.5 + index * Math.PI * 2 / safeCount;
  return Object.freeze({
    x: source.x + Math.cos(angle) * GROUND_LOOT_CONFIG.spawnRadius,
    y: source.y + GROUND_LOOT_CONFIG.spawnHeight,
    z: source.z + Math.sin(angle) * GROUND_LOOT_CONFIG.spawnRadius,
  });
}

export class GroundLootSystem implements ResourceResultSink {
  private readonly entities = new Map<string, GroundLoot>();
  private readonly materializedResults = new WeakSet<ItemResult>();
  private nextId = 1;
  private readonly registry: GroundLootRegistry;
  private readonly presentation: GroundLootPresentation | null;

  constructor(
    registry: GroundLootRegistry,
    presentation: GroundLootPresentation | null = null,
  ) {
    this.registry = registry;
    this.presentation = presentation;
  }

  get active(): readonly GroundLoot[] {
    return [...this.entities.values()].filter((entity) => entity.state === "active");
  }

  get activeCount(): number { return this.active.length; }

  find(id: string): GroundLoot | null { return this.entities.get(id) ?? null; }

  handle(result: ItemResult, sourcePosition: ResultWorldPoint): void {
    this.materialize(result, sourcePosition);
  }

  materialize(result: ItemResult, sourcePosition: ResultWorldPoint): readonly GroundLoot[] {
    if (this.materializedResults.has(result)) return [];
    this.materializedResults.add(result);
    const spawned = result.stacks.map((stack, index) => {
      const id = `ground-loot-${String(this.nextId++).padStart(4, "0")}`;
      const entity = new GroundLoot(
        id,
        stack,
        groundLootPosition(sourcePosition, index, result.stacks.length),
        GROUND_LOOT_CONFIG.interactionRadius,
      );
      this.entities.set(id, entity);
      this.registry.addInteractable(entity);
      this.presentation?.spawn(entity);
      return entity;
    });
    return Object.freeze(spawned);
  }

  /**
   * Authored fixed world item at an absolute XZ (no harvest ring scatter).
   * Used for starter bootstrap resources and other intentional world pickups.
   */
  placeAuthoredStack(stack: ItemStack, position: ResultWorldPoint, sourceLabel: string): GroundLoot {
    void sourceLabel;
    const id = `ground-loot-${String(this.nextId++).padStart(4, "0")}`;
    return this.spawnAt(id, stack, Object.freeze({
      x: position.x,
      y: position.y + GROUND_LOOT_CONFIG.spawnHeight,
      z: position.z,
    }));
  }

  /** Restore a pile with an exact interaction id (save load). */
  restoreEntity(id: string, stack: ItemStack, position: InteractionPoint): GroundLoot {
    const match = /^ground-loot-(\d+)$/.exec(id);
    if (match) this.nextId = Math.max(this.nextId, Number(match[1]) + 1);
    return this.spawnAt(id, stack, Object.freeze({
      x: position.x,
      y: position.y,
      z: position.z,
    }));
  }

  /** Remove every active/collecting entity (new game / load). */
  clearAll(): void {
    for (const entity of [...this.entities.values()]) {
      this.registry.removeInteractable(entity);
      this.presentation?.remove(entity);
      this.entities.delete(entity.interactionId);
    }
    this.nextId = 1;
  }

  serialize(): readonly SerializedGroundLoot[] {
    return Object.freeze(this.active.map((entity) => {
      const p = entity.getInteractionPosition();
      const stack = entity.stack;
      return Object.freeze({
        id: entity.interactionId,
        x: p.x,
        y: p.y,
        z: p.z,
        itemId: stack.itemId,
        quantity: stack.quantity,
        currentDurability: stack.currentDurability,
      });
    }));
  }

  claim(
    entity: GroundLoot,
    playerPosition: InteractionPoint,
    accept: (stack: GroundLoot["stack"]) => boolean = () => true,
  ): GroundLoot["stack"] | null {
    if (this.entities.get(entity.interactionId) !== entity) return null;
    const stack = entity.claimIfAccepted(accept);
    if (!stack) return null;
    this.registry.removeInteractable(entity);
    if (this.presentation) this.presentation.collect(entity, playerPosition);
    else this.finishRemoval(entity.interactionId);
    return stack;
  }

  update(delta: number): void {
    if (!this.presentation) return;
    for (const id of this.presentation.update(delta)) this.finishRemoval(id);
  }

  private spawnAt(id: string, stack: ItemStack, position: InteractionPoint): GroundLoot {
    const entity = new GroundLoot(id, stack, position, GROUND_LOOT_CONFIG.interactionRadius);
    this.entities.set(id, entity);
    this.registry.addInteractable(entity);
    this.presentation?.spawn(entity);
    return entity;
  }

  private finishRemoval(id: string): void {
    const entity = this.entities.get(id);
    if (!entity || !entity.remove()) return;
    this.presentation?.remove(entity);
    this.entities.delete(id);
  }
}
