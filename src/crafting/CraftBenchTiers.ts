/**
 * Blueprint craft tier gate by bench type (LDOE loop).
 * Field workbench = tier 0; Assembly = 1; Metalwork = 2.
 * Pure domain (no Babylon / DOM).
 */
import type { CraftingRecipeDefinition } from "./CraftingTypes.ts";

export const CRAFT_TIER_FIELD = 0;
export const CRAFT_TIER_ASSEMBLY = 1;
export const CRAFT_TIER_METALWORK = 2;

/** Items whose presence in an ingredient list pushes a recipe to metalwork. */
const METALWORK_INGREDIENTS = new Set([
  "steel-bar",
  "iron-plate",
  "metal-plate",
  "bolts",
  "screws",
  "copper-wire",
  "electronic-part",
  "hardened-alloy",
  "spring",
  "gear",
]);

/** Items that require at least an assembly bench. */
const ASSEMBLY_INGREDIENTS = new Set([
  "iron-bar",
  "iron-ore",
  "copper-bar",
  "copper-ore",
  "leather",
  "thick-cloth",
  "nails",
  "mechanical-part",
  "scrap-device",
]);

/** Explicit overrides when heuristic is wrong. */
const RECIPE_TIER_OVERRIDES: ReadonlyMap<string, number> = new Map([
  ["basic-backpack", CRAFT_TIER_ASSEMBLY],
  ["simple-shirt", CRAFT_TIER_FIELD],
  ["simple-pants", CRAFT_TIER_FIELD],
  ["nails", CRAFT_TIER_FIELD],
  ["screws", CRAFT_TIER_ASSEMBLY],
  ["bolts", CRAFT_TIER_METALWORK],
  ["metal-plate-forge", CRAFT_TIER_METALWORK],
  ["steel-bar", CRAFT_TIER_METALWORK],
  ["iron-bar-smelt", CRAFT_TIER_ASSEMBLY],
  ["copper-bar-smelt", CRAFT_TIER_ASSEMBLY],
]);

/**
 * Minimum craft-bench tier required for a blueprint.
 * Higher benches unlock all lower tiers.
 */
export function requiredCraftTier(recipe: CraftingRecipeDefinition): number {
  const override = RECIPE_TIER_OVERRIDES.get(recipe.id);
  if (override !== undefined) return override;

  if (recipe.id.startsWith("salvage-")) return CRAFT_TIER_ASSEMBLY;
  if (recipe.id.startsWith("improved-") || recipe.id.includes("reinforced")) {
    return CRAFT_TIER_ASSEMBLY;
  }

  const out = recipe.output.itemId;
  if (
    out === "service-pistol"
    || out === "pump-scattergun"
    || out === "hunting-carbine"
    || out === "smg-kit"
  ) {
    return CRAFT_TIER_METALWORK;
  }

  let tier = CRAFT_TIER_FIELD;
  for (const ing of recipe.ingredients) {
    if (METALWORK_INGREDIENTS.has(ing.itemId)) {
      return CRAFT_TIER_METALWORK;
    }
    if (ASSEMBLY_INGREDIENTS.has(ing.itemId)) {
      tier = Math.max(tier, CRAFT_TIER_ASSEMBLY);
    }
  }

  if (recipe.category === "armor" && tier < CRAFT_TIER_ASSEMBLY) {
    if (out !== "shirt" && out !== "cargo-pants" && !out.startsWith("cloth-")) {
      tier = Math.max(tier, CRAFT_TIER_ASSEMBLY);
    }
  }

  return tier;
}

/** Tier unlocked by standing at a craft interactable. */
export function craftTierFromInteractionId(interactionId: string): number {
  if (interactionId.includes("metalwork")) return CRAFT_TIER_METALWORK;
  if (interactionId.includes("assembly")) return CRAFT_TIER_ASSEMBLY;
  return CRAFT_TIER_FIELD;
}

export function craftTierLabel(tier: number): string {
  if (tier >= CRAFT_TIER_METALWORK) return "Metalwork Bench";
  if (tier >= CRAFT_TIER_ASSEMBLY) return "Assembly Bench";
  return "Field Workbench";
}

export function canCraftAtTier(recipe: CraftingRecipeDefinition, playerTier: number): boolean {
  return playerTier >= requiredCraftTier(recipe);
}
