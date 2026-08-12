import type { ItemId } from "../items/ItemId";
import type { ItemStack } from "../items/ItemSystem";

/** Recipe ids expand freely; keep as string union of known + legacy recipes. */
export type CraftingRecipeId = string;

export type CraftingCategory = "all" | "weapons" | "tools" | "armor" | "survival" | "building" | "materials";

export interface CraftingIngredient {
  readonly itemId: ItemId;
  readonly quantity: number;
}

export interface CraftingRecipeDefinition {
  readonly id: CraftingRecipeId;
  readonly output: ItemStack;
  readonly ingredients: readonly CraftingIngredient[];
  readonly category?: CraftingCategory;
}

export type CraftStatus =
  | "crafted"
  | "not-enough-resources"
  | "inventory-full"
  | "invalid-recipe"
  | "need-bench"
  | "need-blueprint";

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
  readonly blockedBy: "not-enough-resources" | "inventory-full" | "need-bench" | "need-blueprint" | null;
  /** 0 field / 1 assembly / 2 metalwork. */
  readonly requiredTier: number;
  /** Blueprint item id required when blocked by need-blueprint. */
  readonly requiredBlueprint?: string | null;
}
