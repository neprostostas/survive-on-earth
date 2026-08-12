/**
 * Craft bench tier + recycler station domain checks.
 */
import assert from "node:assert/strict";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemStack } from "../src/items/ItemSystem.ts";
import { CraftingSystem } from "../src/crafting/CraftingSystem.ts";
import { CRAFTING_RECIPES } from "../src/crafting/CraftingRecipeRegistry.ts";
import {
  CRAFT_TIER_ASSEMBLY,
  CRAFT_TIER_FIELD,
  CRAFT_TIER_METALWORK,
  craftTierFromInteractionId,
  requiredCraftTier,
  canCraftAtTier,
} from "../src/crafting/CraftBenchTiers.ts";
import { maxCraftBenchTierNear } from "../src/crafting/CraftAccess.ts";
import { StationSystem } from "../src/workstations/StationSystem.ts";
import { getStationProcess } from "../src/workstations/StationRecipes.ts";
import { STATION_PIECE_TO_KIND, isStationPiece } from "../src/building/BuiltPieceWiring.ts";

// Interaction tier mapping
assert.equal(craftTierFromInteractionId("home-workbench-01"), CRAFT_TIER_FIELD);
assert.equal(craftTierFromInteractionId("built-craft-1:assembly-bench"), CRAFT_TIER_ASSEMBLY);
assert.equal(craftTierFromInteractionId("built-craft-2:metalwork-bench"), CRAFT_TIER_METALWORK);

// Recipe tiers
assert.equal(requiredCraftTier(CRAFTING_RECIPES.get("rope")), CRAFT_TIER_FIELD);
assert.equal(requiredCraftTier(CRAFTING_RECIPES.get("improved-hatchet")), CRAFT_TIER_ASSEMBLY);
assert.equal(requiredCraftTier(CRAFTING_RECIPES.get("steel-bar")), CRAFT_TIER_METALWORK);
assert.equal(requiredCraftTier(CRAFTING_RECIPES.get("salvage-scrap-device")), CRAFT_TIER_ASSEMBLY);
assert.equal(canCraftAtTier(CRAFTING_RECIPES.get("improved-hatchet"), CRAFT_TIER_FIELD), false);
assert.equal(canCraftAtTier(CRAFTING_RECIPES.get("improved-hatchet"), CRAFT_TIER_ASSEMBLY), true);

// Near max tier
assert.equal(maxCraftBenchTierNear({
  playerX: 0, playerZ: 0, range: 3,
  benches: [
    { x: 0, z: 0, enabled: true, tier: 0 },
    { x: 1, z: 0, enabled: true, tier: 2 },
  ],
}), 2);
assert.equal(maxCraftBenchTierNear({
  playerX: 0, playerZ: 0, range: 1,
  benches: [{ x: 5, z: 0, enabled: true, tier: 2 }],
}), -1);

// CraftingSystem enforces
{
  const inv = new PlayerInventory();
  inv.tryInsert(createItemStack("pine-log", 10));
  inv.tryInsert(createItemStack("iron-bar", 4));
  inv.tryInsert(createItemStack("rope", 2));
  const crafts = new CraftingSystem(inv);
  crafts.setActiveBenchTier(CRAFT_TIER_FIELD);
  const blocked = crafts.getRecipeState("improved-hatchet");
  assert.equal(blocked?.blockedBy, "need-bench");
  assert.equal(crafts.craft("improved-hatchet").status, "need-bench");
  crafts.setActiveBenchTier(CRAFT_TIER_ASSEMBLY);
  const ok = crafts.getRecipeState("improved-hatchet");
  assert.equal(ok?.craftable, true);
  assert.equal(crafts.craft("improved-hatchet").accepted, true);
  console.log("ok craft bench tiers");
}

// Recycler station
assert.equal(isStationPiece("recycler"), true);
assert.equal(STATION_PIECE_TO_KIND.recycler, "recycler");
assert.ok(getStationProcess("recycler:scrap-device"));
{
  const inv = new PlayerInventory();
  inv.tryInsert(createItemStack("scrap-device", 1));
  const stations = new StationSystem();
  assert.equal(stations.tryStart("recycler:scrap-device", "recycler", inv).accepted, true);
  const mid = stations.tick(3);
  assert.equal(mid.length, 0);
  stations.tick(2);
  const snap = stations.serialize();
  assert.equal(snap.recycler.entries.length, 1);
  const restored = new StationSystem();
  restored.load(snap);
  const done = restored.tick(20);
  assert.equal(done[0].stack.itemId, "wire");
  assert.equal(done[0].stack.quantity, 2);
  console.log("ok recycler salvage + save");
}

console.log("all craft-tier / recycler checks passed");
