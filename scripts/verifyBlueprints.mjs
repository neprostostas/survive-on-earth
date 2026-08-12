/**
 * Blueprint learn + craft gate.
 */
import assert from "node:assert/strict";
import {
  BlueprintUnlockSystem,
  BLUEPRINT_RECIPE_UNLOCKS,
  blueprintRequiredForRecipe,
  isBlueprintItemId,
} from "../src/crafting/BlueprintUnlocks.ts";
import { CraftingSystem } from "../src/crafting/CraftingSystem.ts";
import { CRAFT_TIER_FIELD } from "../src/crafting/CraftBenchTiers.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";

assert.equal(isBlueprintItemId("blueprint-tool"), true);
assert.equal(isBlueprintItemId("hatchet"), false);
assert.equal(blueprintRequiredForRecipe("hatchet"), null);
assert.equal(blueprintRequiredForRecipe("crowbar"), "blueprint-weapon");
assert.equal(blueprintRequiredForRecipe("reinforced-hatchet"), "blueprint-tool");
assert.equal(blueprintRequiredForRecipe("solar-panel"), "blueprint-station");

const unlocks = new BlueprintUnlockSystem();
assert.equal(unlocks.isRecipeUnlocked("hatchet"), true);
assert.equal(unlocks.isRecipeUnlocked("crowbar"), false);
assert.equal(unlocks.tryLearn("blueprint-weapon"), true);
assert.equal(unlocks.tryLearn("blueprint-weapon"), false);
assert.equal(unlocks.isRecipeUnlocked("crowbar"), true);
assert.equal(unlocks.has("blueprint-weapon"), true);

const round = unlocks.serialize();
const loaded = new BlueprintUnlockSystem();
loaded.load(round);
assert.equal(loaded.has("blueprint-weapon"), true);
assert.equal(loaded.isRecipeUnlocked("crowbar"), true);

const crafts = new CraftingSystem(new PlayerInventory(), undefined, new BlueprintUnlockSystem());
crafts.setActiveBenchTier(CRAFT_TIER_FIELD);
assert.equal(crafts.getRecipeState("crowbar")?.blockedBy, "need-blueprint");
assert.equal(crafts.craft("crowbar").status, "need-blueprint");
assert.equal(crafts.getRecipeState("hatchet")?.blockedBy, "not-enough-resources");
assert.ok(BLUEPRINT_RECIPE_UNLOCKS["blueprint-tool"].includes("steel-hatchet-craft"));

console.log("ok blueprint unlocks");
