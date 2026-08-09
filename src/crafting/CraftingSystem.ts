import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import { createItemStack } from "../items/ItemSystem.ts";
import { CRAFTING_RECIPES, type CraftingRecipeRegistry } from "./CraftingRecipeRegistry.ts";
import type { CraftResult, CraftingRecipeState } from "./CraftingTypes.ts";

export class CraftingSystem {
  private readonly inventory: PlayerInventory;
  private readonly recipes: CraftingRecipeRegistry;
  private latest: CraftResult | null = null;

  constructor(inventory: PlayerInventory, recipes: CraftingRecipeRegistry = CRAFTING_RECIPES) {
    this.inventory = inventory;
    this.recipes = recipes;
  }

  get lastResult(): CraftResult | null { return this.latest; }
  get recipeRegistry(): CraftingRecipeRegistry { return this.recipes; }

  getRecipeState(recipeId: string): CraftingRecipeState | null {
    const recipe = this.recipes.find(recipeId);
    if (!recipe) return null;
    const ingredients = Object.freeze(recipe.ingredients.map((ingredient) => Object.freeze({
      ingredient,
      owned: this.inventory.totalQuantity(ingredient.itemId),
    })));
    const transaction = this.inventory.previewConsumeAndInsert(recipe.ingredients, recipe.output);
    return Object.freeze({
      recipe,
      ingredients,
      craftable: transaction.accepted,
      blockedBy: transaction.reason === "not-enough-items" ? "not-enough-resources" : transaction.reason,
    });
  }

  craft(recipeId: string): CraftResult {
    const recipe = this.recipes.find(recipeId);
    if (!recipe) return this.result(false, recipeId, "invalid-recipe", null);
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
