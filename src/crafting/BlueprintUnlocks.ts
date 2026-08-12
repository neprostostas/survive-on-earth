/**
 * Learnable blueprint unlocks for mid/high craft recipes.
 */

export type BlueprintId = "blueprint-tool" | "blueprint-weapon" | "blueprint-station";

export const BLUEPRINT_IDS: readonly BlueprintId[] = Object.freeze([
  "blueprint-tool",
  "blueprint-weapon",
  "blueprint-station",
]);

/** Recipe ids gated behind each blueprint. Starters stay free. */
export const BLUEPRINT_RECIPE_UNLOCKS: Readonly<Record<BlueprintId, readonly string[]>> = Object.freeze({
  "blueprint-tool": Object.freeze([
    "reinforced-hatchet",
    "reinforced-pickaxe",
    "advanced-hatchet",
    "advanced-pickaxe",
    "steel-hatchet-craft",
    "steel-pickaxe-craft",
    "advanced-fishing-rod-craft",
  ]),
  "blueprint-weapon": Object.freeze([
    "metal-pipe",
    "crowbar",
    "improved-spear",
    "survival-knife",
    "sledgehammer",
    "machete-craft",
    "cleaver-craft",
    "metal-hammer-craft",
    "pipe-club-craft",
    "long-spear-craft",
    "hunting-bow-craft",
    "improvised-pistol-craft",
    "tactical-axe",
    "service-pistol",
    "heavy-axe-craft",
    "hardened-machete-craft",
    "composite-axe-craft",
    "tactical-spear-craft",
    "industrial-hammer-craft",
  ]),
  "blueprint-station": Object.freeze([
    "solar-panel",
    "battery-bank-core",
    "advanced-circuit",
    "power-cell",
    "servo-assembly",
    "optical-module",
    "precision-component",
    "hardened-alloy",
    "composite-plate",
  ]),
});

const RECIPE_TO_BLUEPRINT = (() => {
  const map = new Map<string, BlueprintId>();
  for (const id of BLUEPRINT_IDS) {
    for (const recipeId of BLUEPRINT_RECIPE_UNLOCKS[id]) {
      map.set(recipeId, id);
    }
  }
  return map;
})();

export function isBlueprintItemId(id: string): id is BlueprintId {
  return (BLUEPRINT_IDS as readonly string[]).includes(id);
}

export function blueprintRequiredForRecipe(recipeId: string): BlueprintId | null {
  return RECIPE_TO_BLUEPRINT.get(recipeId) ?? null;
}

export class BlueprintUnlockSystem {
  private readonly learned = new Set<BlueprintId>();

  has(id: BlueprintId): boolean {
    return this.learned.has(id);
  }

  /** Returns true when newly learned. */
  tryLearn(id: string): boolean {
    if (!isBlueprintItemId(id)) return false;
    if (this.learned.has(id)) return false;
    this.learned.add(id);
    return true;
  }

  isRecipeUnlocked(recipeId: string): boolean {
    const need = blueprintRequiredForRecipe(recipeId);
    if (!need) return true;
    return this.learned.has(need);
  }

  serialize(): readonly BlueprintId[] {
    return Object.freeze([...this.learned]);
  }

  load(ids: readonly string[] | undefined): void {
    this.learned.clear();
    if (!ids) return;
    for (const id of ids) {
      if (isBlueprintItemId(id)) this.learned.add(id);
    }
  }
}

/** Display helper for notify / UI. */
export function blueprintLabel(id: BlueprintId): string {
  const labels: Record<BlueprintId, string> = {
    "blueprint-tool": "Tool Blueprint",
    "blueprint-weapon": "Weapon Blueprint",
    "blueprint-station": "Station Blueprint",
  };
  return labels[id];
}
