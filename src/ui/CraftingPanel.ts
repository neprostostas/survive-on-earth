import type { CraftingSystem } from "../crafting/CraftingSystem";
import type { CraftingRecipeId } from "../crafting/CraftingTypes";
import type { PlayerInventory } from "../inventory/PlayerInventory";
import { ITEM_REGISTRY } from "../items/ItemSystem";
import { ITEM_ICONS } from "./itemIcons";

export class CraftingPanel {
  private readonly overlay: HTMLElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly cards: ReadonlyMap<CraftingRecipeId, HTMLElement>;
  private openState = false;

  constructor(
    root: HTMLElement,
    inventory: PlayerInventory,
    private readonly crafting: CraftingSystem,
    private readonly toggleButton: HTMLButtonElement,
    private readonly showStatus: (message: string) => void,
    private readonly onVisibilityChange: (open: boolean) => void,
  ) {
    this.overlay = document.createElement("section");
    this.overlay.className = "crafting-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.innerHTML = `
      <div class="crafting-panel" role="dialog" aria-modal="true" aria-labelledby="crafting-title">
        <header><div><small>STARTER RECIPES</small><h2 id="crafting-title">BLUEPRINTS</h2></div><button class="crafting-close" type="button" aria-label="Close blueprints">×</button></header>
        <div class="crafting-intro"><b>FIELD TOOLS</b><span>Craft one item instantly from resources in your Inventory.</span></div>
        <div class="crafting-recipes" aria-label="Available crafting recipes"></div>
      </div>`;
    root.append(this.overlay);
    const closeButton = this.overlay.querySelector<HTMLButtonElement>(".crafting-close");
    const recipeList = this.overlay.querySelector<HTMLElement>(".crafting-recipes");
    if (!closeButton || !recipeList) throw new Error("Crafting UI failed to mount");
    this.closeButton = closeButton;

    const cards = new Map<CraftingRecipeId, HTMLElement>();
    for (const recipe of crafting.recipeRegistry.getAll()) {
      const output = ITEM_REGISTRY.get(recipe.output.itemId);
      const card = document.createElement("article");
      card.className = "crafting-card";
      card.dataset.recipeId = recipe.id;
      card.innerHTML = `
        <div class="crafting-output-icon">${ITEM_ICONS[output.iconId]}<b>×${recipe.output.quantity}</b></div>
        <div class="crafting-card-copy"><small>STARTER BLUEPRINT</small><h3>${output.displayName}</h3><div class="crafting-ingredients"></div></div>
        <button class="craft-button" type="button">CRAFT</button>`;
      const ingredients = card.querySelector<HTMLElement>(".crafting-ingredients");
      const craftButton = card.querySelector<HTMLButtonElement>(".craft-button");
      if (!ingredients || !craftButton) throw new Error(`Crafting card failed to mount: ${recipe.id}`);
      for (const ingredient of recipe.ingredients) {
        const definition = ITEM_REGISTRY.get(ingredient.itemId);
        const row = document.createElement("div");
        row.className = "crafting-ingredient";
        row.dataset.itemId = ingredient.itemId;
        row.innerHTML = `<span class="crafting-ingredient-icon">${ITEM_ICONS[definition.iconId]}</span><span><b>${definition.displayName}</b><small class="crafting-owned"></small></span>`;
        ingredients.append(row);
      }
      craftButton.addEventListener("click", () => { this.craft(recipe.id); });
      recipeList.append(card);
      cards.set(recipe.id, card);
    }
    this.cards = cards;
    this.render();
    inventory.subscribe(() => { this.render(); });
    toggleButton.addEventListener("click", this.toggle);
    closeButton.addEventListener("click", this.close);
    this.overlay.addEventListener("pointerdown", this.onBackdropPointerDown);
  }

  get isOpen(): boolean { return this.openState; }

  toggle = (): void => { this.setOpen(!this.openState); };
  open = (): void => { this.setOpen(true); };
  close = (): void => { this.setOpen(false); };

  private setOpen(open: boolean): void {
    if (open === this.openState) return;
    this.openState = open;
    this.overlay.classList.toggle("open", open);
    this.overlay.setAttribute("aria-hidden", String(!open));
    this.toggleButton.classList.toggle("active", open);
    this.toggleButton.setAttribute("aria-expanded", String(open));
    this.onVisibilityChange(open);
    if (open) {
      this.render();
      this.closeButton.focus({ preventScroll: true });
    } else this.toggleButton.focus({ preventScroll: true });
  }

  private render(): void {
    for (const recipe of this.crafting.recipeRegistry.getAll()) {
      const state = this.crafting.getRecipeState(recipe.id);
      const card = this.cards.get(recipe.id);
      if (!state || !card) continue;
      card.classList.toggle("craftable", state.craftable);
      card.classList.toggle("blocked", !state.craftable);
      for (const ingredient of state.ingredients) {
        const row = card.querySelector<HTMLElement>(`.crafting-ingredient[data-item-id="${ingredient.ingredient.itemId}"]`);
        const count = row?.querySelector<HTMLElement>(".crafting-owned");
        if (!row || !count) continue;
        const enough = ingredient.owned >= ingredient.ingredient.quantity;
        row.classList.toggle("missing", !enough);
        count.textContent = `${ingredient.owned} / ${ingredient.ingredient.quantity}`;
      }
      const button = card.querySelector<HTMLButtonElement>(".craft-button");
      if (!button) continue;
      button.disabled = !state.craftable;
      button.textContent = state.craftable ? "CRAFT" : state.blockedBy === "inventory-full" ? "INVENTORY FULL" : "NEED RESOURCES";
    }
  }

  private craft(recipeId: CraftingRecipeId): void {
    const result = this.crafting.craft(recipeId);
    if (result.accepted && result.output) {
      this.showStatus(`Crafted ${ITEM_REGISTRY.get(result.output.itemId).displayName}`);
    } else if (result.status === "inventory-full") this.showStatus("Inventory full");
    else if (result.status === "not-enough-resources") this.showStatus("Not enough resources");
    this.render();
  }

  private readonly onBackdropPointerDown = (event: PointerEvent): void => {
    if (event.target === this.overlay) this.close();
  };
}
