import { ITEM_REGISTRY, createItemStack } from "../items/ItemSystem.ts";
import type { CraftingRecipeDefinition, CraftingRecipeId } from "./CraftingTypes.ts";

const STARTER_RECIPES: readonly CraftingRecipeDefinition[] = Object.freeze([
  Object.freeze({
    id: "hatchet",
    output: createItemStack("hatchet", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "pine-log", quantity: 3 }),
      Object.freeze({ itemId: "limestone", quantity: 3 }),
    ]),
  }),
  Object.freeze({
    id: "pickaxe",
    output: createItemStack("pickaxe", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "pine-log", quantity: 3 }),
      Object.freeze({ itemId: "limestone", quantity: 3 }),
    ]),
  }),
]);

export class CraftingRecipeRegistry {
  private readonly recipes: ReadonlyMap<CraftingRecipeId, CraftingRecipeDefinition>;
  private readonly all: readonly CraftingRecipeDefinition[];

  constructor(definitions: readonly CraftingRecipeDefinition[]) {
    const map = new Map<CraftingRecipeId, CraftingRecipeDefinition>();
    for (const definition of definitions) {
      if (map.has(definition.id)) throw new Error(`Duplicate crafting recipe: ${definition.id}`);
      createItemStack(definition.output.itemId, definition.output.quantity);
      if (definition.ingredients.length < 1) throw new Error(`Crafting recipe has no ingredients: ${definition.id}`);
      const ingredientIds = new Set<string>();
      const ingredients = definition.ingredients.map((ingredient) => {
        ITEM_REGISTRY.get(ingredient.itemId);
        if (!Number.isInteger(ingredient.quantity) || ingredient.quantity < 1) throw new Error(`Invalid ingredient quantity in recipe: ${definition.id}`);
        if (ingredientIds.has(ingredient.itemId)) throw new Error(`Duplicate ingredient in recipe: ${definition.id}`);
        ingredientIds.add(ingredient.itemId);
        return Object.freeze({ ...ingredient });
      });
      map.set(definition.id, Object.freeze({
        ...definition,
        output: createItemStack(definition.output.itemId, definition.output.quantity),
        ingredients: Object.freeze(ingredients),
      }));
    }
    this.recipes = map;
    this.all = Object.freeze([...map.values()]);
  }

  find(id: string): CraftingRecipeDefinition | null {
    return this.recipes.get(id as CraftingRecipeId) ?? null;
  }

  get(id: CraftingRecipeId): CraftingRecipeDefinition {
    const recipe = this.recipes.get(id);
    if (!recipe) throw new Error(`Unknown crafting recipe: ${id}`);
    return recipe;
  }

  getAll(): readonly CraftingRecipeDefinition[] { return this.all; }
}

export const CRAFTING_RECIPES = new CraftingRecipeRegistry(STARTER_RECIPES);
