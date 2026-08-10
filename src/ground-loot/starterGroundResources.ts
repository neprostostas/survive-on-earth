import type { GroundLootSystem } from "../ground-loot/GroundLootSystem.ts";
import { createItemStack } from "../items/ItemSystem.ts";
import type { ItemId } from "../items/ItemId";

export interface StarterGroundResourceFixture {
  readonly id: string;
  readonly itemId: Extract<ItemId, "pine-log" | "limestone">;
  readonly x: number;
  readonly z: number;
}

/**
 * Deterministic starter bootstrap loose resources near playable spawn.
 * Quantity 1 each — no random placement.
 *
 * Coordinates chosen to avoid Player spawn (0,5), armor calib row (z≈3.05),
 * campfire (-4,4), house+crate (~8,-10), dummies, and known tree/rock positions.
 */
export const STARTER_GROUND_RESOURCES: readonly StarterGroundResourceFixture[] = Object.freeze([
  Object.freeze({ id: "starter-pine-log-01", itemId: "pine-log" as const, x: -6.4, z: 1.2 }),
  Object.freeze({ id: "starter-pine-log-02", itemId: "pine-log" as const, x: -7.1, z: 2.1 }),
  Object.freeze({ id: "starter-pine-log-03", itemId: "pine-log" as const, x: -5.5, z: 2.4 }),
  Object.freeze({ id: "starter-pine-log-04", itemId: "pine-log" as const, x: -6.8, z: 0.3 }),
  Object.freeze({ id: "starter-pine-log-05", itemId: "pine-log" as const, x: -4.9, z: 0.8 }),
  Object.freeze({ id: "starter-pine-log-06", itemId: "pine-log" as const, x: -7.6, z: 1.5 }),
  Object.freeze({ id: "starter-limestone-01", itemId: "limestone" as const, x: 4.2, z: 1.4 }),
  Object.freeze({ id: "starter-limestone-02", itemId: "limestone" as const, x: 5.1, z: 2.2 }),
  Object.freeze({ id: "starter-limestone-03", itemId: "limestone" as const, x: 3.6, z: 2.0 }),
  Object.freeze({ id: "starter-limestone-04", itemId: "limestone" as const, x: 5.6, z: 1.1 }),
  Object.freeze({ id: "starter-limestone-05", itemId: "limestone" as const, x: 4.5, z: 0.4 }),
  Object.freeze({ id: "starter-limestone-06", itemId: "limestone" as const, x: 6.2, z: 1.8 }),
]);

export function countStarterFixtures(itemId: Extract<ItemId, "pine-log" | "limestone">): number {
  return STARTER_GROUND_RESOURCES.filter((fixture) => fixture.itemId === itemId).length;
}

/** Spawns fixed world GroundLoot entities for bootstrap crafting (no tools). */
export function spawnStarterGroundResources(groundLoot: GroundLootSystem): void {
  for (const fixture of STARTER_GROUND_RESOURCES) {
    groundLoot.placeAuthoredStack(
      createItemStack(fixture.itemId, 1),
      Object.freeze({ x: fixture.x, y: 0, z: fixture.z }),
      fixture.id,
    );
  }
}
