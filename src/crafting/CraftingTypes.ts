import type { ItemId } from "../items/ItemId";
import type { ItemStack } from "../items/ItemSystem";

export type CraftingRecipeId = "hatchet" | "pickaxe";

export interface CraftingIngredient {
  readonly itemId: ItemId;
  readonly quantity: number;
}

export interface CraftingRecipeDefinition {
  readonly id: CraftingRecipeId;
  readonly output: ItemStack;
  readonly ingredients: readonly CraftingIngredient[];
}

export type CraftStatus = "crafted" | "not-enough-resources" | "inventory-full" | "invalid-recipe";

export interface CraftResult {
  readonly accepted: boolean;
  readonly recipeId: string;
  readonly status: CraftStatus;
  readonly output: ItemStack | null;
}

export interface CraftingIngredientState {
  readonly ingredient: CraftingIngredient;
  readonly owned: number;
}

export interface CraftingRecipeState {
  readonly recipe: CraftingRecipeDefinition;
  readonly ingredients: readonly CraftingIngredientState[];
  readonly craftable: boolean;
  readonly blockedBy: "not-enough-resources" | "inventory-full" | null;
}
