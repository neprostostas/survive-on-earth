import type { GroundLootSystem } from "../ground-loot/GroundLootSystem.ts";
import { createItemStack } from "../items/ItemSystem.ts";

/**
 * Deterministic authored Basic Backpack near starter area.
 * Position avoids Player spawn (0,5), armor calib (z≈3.05), trees/rocks,
 * pine/limestone starter rows, campfire, crate, combat dummies.
 *
 * World coordinate: x = 1.6, z = 4.2
 */
export const STARTER_BASIC_BACKPACK = Object.freeze({
  id: "starter-basic-backpack-01",
  itemId: "basic-backpack" as const,
  quantity: 1,
  x: 1.6,
  z: 4.2,
});

/** Spawns exactly one Basic Backpack GroundLoot (qty 1). No tool, no random, no respawn. */
export function spawnStarterBasicBackpack(groundLoot: GroundLootSystem): void {
  groundLoot.placeAuthoredStack(
    createItemStack(STARTER_BASIC_BACKPACK.itemId, STARTER_BASIC_BACKPACK.quantity),
    Object.freeze({ x: STARTER_BASIC_BACKPACK.x, y: 0, z: STARTER_BASIC_BACKPACK.z }),
    STARTER_BASIC_BACKPACK.id,
  );
}
