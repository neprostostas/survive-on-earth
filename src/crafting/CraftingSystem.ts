import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import { createItemStack } from "../items/ItemSystem.ts";
import { CRAFTING_RECIPES, type CraftingRecipeRegistry } from "./CraftingRecipeRegistry.ts";
import { canCraftAtTier, requiredCraftTier } from "./CraftBenchTiers.ts";
import {
  blueprintRequiredForRecipe,
  type BlueprintUnlockSystem,
} from "./BlueprintUnlocks.ts";
import type { CraftResult, CraftingRecipeState } from "./CraftingTypes.ts";

export class CraftingSystem {
  private readonly inventory: PlayerInventory;
  private readonly recipes: CraftingRecipeRegistry;
  private readonly unlocks: BlueprintUnlockSystem | null;
  private latest: CraftResult | null = null;
  /** Highest craft bench tier the player currently has access to. */
  private benchTier = 0;

  constructor(
    inventory: PlayerInventory,
    recipes: CraftingRecipeRegistry = CRAFTING_RECIPES,
    unlocks: BlueprintUnlockSystem | null = null,
  ) {
    this.inventory = inventory;
    this.recipes = recipes;
    this.unlocks = unlocks;
  }

  get lastResult(): CraftResult | null { return this.latest; }
  get recipeRegistry(): CraftingRecipeRegistry { return this.recipes; }
  get currentBenchTier(): number { return this.benchTier; }

  /** Called while near a craft surface (before panel open / each craft). */
  setActiveBenchTier(tier: number): void {
    this.benchTier = Math.max(0, Math.floor(tier));
  }

  getRecipeState(recipeId: string): CraftingRecipeState | null {
    const recipe = this.recipes.find(recipeId);
    if (!recipe) return null;
    const requiredTier = requiredCraftTier(recipe);
    const ingredients = Object.freeze(recipe.ingredients.map((ingredient) => Object.freeze({
      ingredient,
      owned: this.inventory.totalQuantity(ingredient.itemId),
    })));
    const requiredBlueprint = blueprintRequiredForRecipe(recipeId);
    if (this.unlocks && requiredBlueprint && !this.unlocks.isRecipeUnlocked(recipeId)) {
      return Object.freeze({
        recipe,
        ingredients,
        craftable: false,
        blockedBy: "need-blueprint" as const,
        requiredTier,
        requiredBlueprint,
      });
    }
    if (!canCraftAtTier(recipe, this.benchTier)) {
      return Object.freeze({
        recipe,
        ingredients,
        craftable: false,
        blockedBy: "need-bench" as const,
        requiredTier,
        requiredBlueprint,
      });
    }
    const transaction = this.inventory.previewConsumeAndInsert(recipe.ingredients, recipe.output);
    return Object.freeze({
      recipe,
      ingredients,
      craftable: transaction.accepted,
      blockedBy: transaction.reason === "not-enough-items"
        ? "not-enough-resources"
        : transaction.reason === "inventory-full"
          ? "inventory-full"
          : null,
      requiredTier,
      requiredBlueprint,
    });
  }

  craft(recipeId: string): CraftResult {
    const recipe = this.recipes.find(recipeId);
    if (!recipe) return this.result(false, recipeId, "invalid-recipe", null);
    if (this.unlocks && !this.unlocks.isRecipeUnlocked(recipeId)) {
      return this.result(false, recipeId, "need-blueprint", null);
    }
    if (!canCraftAtTier(recipe, this.benchTier)) {
      return this.result(false, recipeId, "need-bench", null);
    }
    const output = createItemStack(recipe.output.itemId, recipe.output.quantity);
    const transaction = this.inventory.tryConsumeAndInsert(recipe.ingredients, output);
    if (!transaction.accepted) {
      const status = transaction.reason === "not-enough-items" ? "not-enough-resources" : "inventory-full";
      return this.result(false, recipeId, status, null);
    }
    return this.result(true, recipeId, "crafted", output);
  }

  private result(accepted: boolean, recipeId: string, status: CraftResult["status"], output: CraftResult["output"]): CraftResult {
    this.latest = Object.freeze({ accepted, recipeId, status, output });
    return this.latest;
  }
}
