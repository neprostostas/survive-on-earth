import type { CraftingSystem } from "../crafting/CraftingSystem";
import type { CraftingCategory, CraftingRecipeId } from "../crafting/CraftingTypes";
import type { PlayerInventory } from "../inventory/PlayerInventory";
import { ITEM_REGISTRY } from "../items/ItemSystem";
import { ITEM_ICONS } from "./itemIcons";
import { LocalLoader } from "./Loaders";

/** LDOE-style category order for the blueprints workbench. */
const CATEGORY_TABS: readonly { id: CraftingCategory; label: string }[] = Object.freeze([
  { id: "all", label: "ALL" },
  { id: "weapons", label: "WEAPONS" },
  { id: "armor", label: "ARMOR" },
  { id: "tools", label: "TOOLS" },
  { id: "survival", label: "FOOD" },
  { id: "materials", label: "PARTS" },
  { id: "building", label: "BUILD" },
]);

/**
 * Blueprints UI matches LDOE: dense icon grid + detail pane on select.
 * Ingredients and CRAFT only appear after tapping a recipe cell.
 */
export class CraftingPanel {
  private readonly overlay: HTMLElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly tabsEl: HTMLElement;
  private readonly gridEl: HTMLElement;
  private readonly detailEl: HTMLElement;
  private readonly searchInput: HTMLInputElement;
  private readonly emptyFilter: HTMLElement;
  private readonly cells = new Map<CraftingRecipeId, HTMLButtonElement>();
  private openState = false;
  private category: CraftingCategory = "all";
  private selectedId: CraftingRecipeId | null = null;
  private searchQuery = "";
  private readonly localLoader = new LocalLoader();

  constructor(
    root: HTMLElement,
    inventory: PlayerInventory,
    private readonly crafting: CraftingSystem,
    private readonly toggleButton: HTMLButtonElement,
    private readonly showStatus: (message: string) => void,
    private readonly onVisibilityChange: (open: boolean) => void,
    private readonly onCrafted?: (recipeId: CraftingRecipeId, outputItemId: string) => void,
  ) {
    this.overlay = document.createElement("section");
    this.overlay.className = "crafting-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.innerHTML = `
      <div class="crafting-panel crafting-screen" role="dialog" aria-modal="true" aria-labelledby="crafting-title">
        <header class="crafting-header">
          <div class="crafting-header-titles">
            <small>FIELD WORKBENCH</small>
            <h2 id="crafting-title">BLUEPRINTS</h2>
          </div>
          <label class="crafting-search">
            <span class="crafting-search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
              </svg>
            </span>
            <input type="search" class="crafting-search-input" placeholder="Search blueprints…" autocomplete="off" spellcheck="false" enterkeyhint="search" />
          </label>
          <button class="crafting-close" type="button" aria-label="Close blueprints">×</button>
        </header>
        <nav class="crafting-tabs" role="tablist" aria-label="Blueprint categories"></nav>
        <div class="crafting-body">
          <div class="crafting-grid-scroll">
            <div class="crafting-grid" role="listbox" aria-label="Blueprints"></div>
            <p class="crafting-empty-filter" hidden>No blueprints match your search.</p>
          </div>
          <aside class="crafting-detail" aria-live="polite">
            <div class="crafting-detail-empty">
              <b>SELECT A BLUEPRINT</b>
              <span>Tap an item to see materials and craft it.</span>
            </div>
            <div class="crafting-detail-body" hidden>
              <div class="crafting-detail-head">
                <div class="crafting-output-icon crafting-detail-icon"></div>
                <div class="crafting-detail-titles">
                  <small class="crafting-detail-cat"></small>
                  <h3 class="crafting-detail-name"></h3>
                  <span class="crafting-detail-qty"></span>
                </div>
              </div>
              <div class="crafting-detail-label">REQUIRED</div>
              <div class="crafting-ingredients" role="list"></div>
              <button class="craft-button" type="button">CRAFT</button>
            </div>
          </aside>
        </div>
      </div>`;
    root.append(this.overlay);

    const closeButton = this.overlay.querySelector<HTMLButtonElement>(".crafting-close");
    const tabsEl = this.overlay.querySelector<HTMLElement>(".crafting-tabs");
    const gridEl = this.overlay.querySelector<HTMLElement>(".crafting-grid");
    const detailEl = this.overlay.querySelector<HTMLElement>(".crafting-detail");
    const searchInput = this.overlay.querySelector<HTMLInputElement>(".crafting-search-input");
    const emptyFilter = this.overlay.querySelector<HTMLElement>(".crafting-empty-filter");
    if (!closeButton || !tabsEl || !gridEl || !detailEl || !searchInput || !emptyFilter) {
      throw new Error("Crafting UI failed to mount");
    }
    this.closeButton = closeButton;
    this.tabsEl = tabsEl;
    this.gridEl = gridEl;
    this.detailEl = detailEl;
    this.searchInput = searchInput;
    this.emptyFilter = emptyFilter;
    this.localLoader.attach(this.overlay.querySelector(".crafting-panel") ?? this.overlay);

    for (const tab of CATEGORY_TABS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "crafting-tab";
      btn.dataset.category = tab.id;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", tab.id === this.category ? "true" : "false");
      btn.textContent = tab.label;
      if (tab.id === this.category) btn.classList.add("active");
      btn.addEventListener("click", () => { this.setCategory(tab.id); });
      this.tabsEl.append(btn);
    }

    for (const recipe of crafting.recipeRegistry.getAll()) {
      const output = ITEM_REGISTRY.get(recipe.output.itemId);
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "crafting-cell";
      cell.dataset.recipeId = recipe.id;
      cell.dataset.category = recipe.category ?? "materials";
      cell.dataset.search = [
        output.displayName,
        recipe.id,
        output.id,
        output.description ?? "",
        ...recipe.ingredients.map((ing) => {
          try { return ITEM_REGISTRY.get(ing.itemId).displayName; } catch { return ing.itemId; }
        }),
      ].join(" ").toLowerCase();
      cell.setAttribute("role", "option");
      cell.setAttribute("aria-selected", "false");
      cell.title = output.displayName;
      cell.setAttribute("aria-label", output.displayName);
      cell.innerHTML = `
        <span class="crafting-cell-icon">${ITEM_ICONS[output.iconId]}</span>
        <b class="crafting-cell-qty" ${recipe.output.quantity > 1 ? "" : "hidden"}>×${recipe.output.quantity}</b>
        <span class="crafting-cell-ready" aria-hidden="true"></span>`;
      cell.addEventListener("click", () => { this.selectRecipe(recipe.id); });
      this.gridEl.append(cell);
      this.cells.set(recipe.id, cell);
    }

    const craftButton = this.detailEl.querySelector<HTMLButtonElement>(".craft-button");
    craftButton?.addEventListener("click", () => {
      if (this.selectedId) this.craft(this.selectedId);
    });

    this.searchInput.addEventListener("input", () => {
      this.searchQuery = this.searchInput.value;
      this.render();
    });
    this.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.searchInput.value) {
        e.stopPropagation();
        this.searchInput.value = "";
        this.searchQuery = "";
        this.render();
      }
    });

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
      this.searchInput.focus({ preventScroll: true });
    } else {
      this.selectedId = null;
      this.toggleButton.focus({ preventScroll: true });
    }
  }

  private setCategory(category: CraftingCategory): void {
    if (this.category === category) return;
    this.category = category;
    for (const btn of this.tabsEl.querySelectorAll<HTMLButtonElement>(".crafting-tab")) {
      const active = btn.dataset.category === category;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", String(active));
    }
    // Keep selection if still in filter; otherwise clear detail.
    if (this.selectedId) {
      const recipe = this.crafting.recipeRegistry.find(this.selectedId);
      const recipeCat = recipe?.category ?? "materials";
      if (category !== "all" && recipeCat !== category) this.selectedId = null;
    }
    this.render();
  }

  private selectRecipe(recipeId: CraftingRecipeId): void {
    this.selectedId = recipeId;
    this.render();
  }

  private render(): void {
    const query = this.searchQuery.trim().toLowerCase();
    let visibleCount = 0;
    let selectionStillVisible = false;

    for (const recipe of this.crafting.recipeRegistry.getAll()) {
      const state = this.crafting.getRecipeState(recipe.id);
      const cell = this.cells.get(recipe.id);
      if (!state || !cell) continue;
      const cat = recipe.category ?? "materials";
      const catOk = this.category === "all" || cat === this.category;
      const searchOk = !query || (cell.dataset.search ?? "").includes(query);
      const visible = catOk && searchOk;
      cell.hidden = !visible;
      if (visible) {
        visibleCount += 1;
        if (this.selectedId === recipe.id) selectionStillVisible = true;
      }
      cell.classList.toggle("craftable", state.craftable);
      cell.classList.toggle("blocked", !state.craftable);
      const selected = this.selectedId === recipe.id && visible;
      cell.classList.toggle("selected", selected);
      cell.setAttribute("aria-selected", String(selected));
    }

    if (this.selectedId && !selectionStillVisible) this.selectedId = null;
    this.emptyFilter.hidden = visibleCount > 0;
    this.renderDetail();
  }

  private renderDetail(): void {
    const emptyEl = this.detailEl.querySelector<HTMLElement>(".crafting-detail-empty");
    const bodyEl = this.detailEl.querySelector<HTMLElement>(".crafting-detail-body");
    if (!emptyEl || !bodyEl) return;

    if (!this.selectedId) {
      emptyEl.hidden = false;
      bodyEl.hidden = true;
      this.detailEl.classList.remove("has-selection");
      return;
    }

    const state = this.crafting.getRecipeState(this.selectedId);
    if (!state) {
      emptyEl.hidden = false;
      bodyEl.hidden = true;
      this.detailEl.classList.remove("has-selection");
      return;
    }

    emptyEl.hidden = true;
    bodyEl.hidden = false;
    this.detailEl.classList.add("has-selection");

    const output = ITEM_REGISTRY.get(state.recipe.output.itemId);
    const iconHost = bodyEl.querySelector<HTMLElement>(".crafting-detail-icon");
    const nameEl = bodyEl.querySelector<HTMLElement>(".crafting-detail-name");
    const catEl = bodyEl.querySelector<HTMLElement>(".crafting-detail-cat");
    const qtyEl = bodyEl.querySelector<HTMLElement>(".crafting-detail-qty");
    const ingredients = bodyEl.querySelector<HTMLElement>(".crafting-ingredients");
    const button = bodyEl.querySelector<HTMLButtonElement>(".craft-button");
    if (!iconHost || !nameEl || !catEl || !qtyEl || !ingredients || !button) return;

    iconHost.innerHTML = `${ITEM_ICONS[output.iconId]}<b>×${state.recipe.output.quantity}</b>`;
    nameEl.textContent = output.displayName;
    const cat = state.recipe.category ?? "materials";
    catEl.textContent = CATEGORY_TABS.find((t) => t.id === cat)?.label ?? "BLUEPRINT";
    qtyEl.textContent = state.recipe.output.quantity > 1
      ? `Creates ×${state.recipe.output.quantity}`
      : (output.description ?? "");

    ingredients.replaceChildren();
    for (const row of state.ingredients) {
      const definition = ITEM_REGISTRY.get(row.ingredient.itemId);
      const enough = row.owned >= row.ingredient.quantity;
      const el = document.createElement("div");
      el.className = `crafting-ingredient${enough ? "" : " missing"}`;
      el.setAttribute("role", "listitem");
      el.dataset.itemId = row.ingredient.itemId;
      el.innerHTML = `
        <span class="crafting-ingredient-icon">${ITEM_ICONS[definition.iconId]}</span>
        <span class="crafting-ingredient-meta">
          <b>${definition.displayName}</b>
          <small class="crafting-owned">${row.owned} / ${row.ingredient.quantity}</small>
        </span>`;
      ingredients.append(el);
    }

    button.disabled = !state.craftable;
    button.textContent = state.craftable
      ? "CRAFT"
      : state.blockedBy === "inventory-full"
        ? "INVENTORY FULL"
        : "NEED RESOURCES";
  }

  private craft(recipeId: CraftingRecipeId): void {
    this.localLoader.show("Crafting…");
    window.setTimeout(() => {
      const result = this.crafting.craft(recipeId);
      this.localLoader.hide();
      if (result.accepted && result.output) {
        this.showStatus(`Crafted ${ITEM_REGISTRY.get(result.output.itemId).displayName}`);
        this.onCrafted?.(recipeId, result.output.itemId);
      } else if (result.status === "inventory-full") this.showStatus("Inventory full");
      else if (result.status === "not-enough-resources") this.showStatus("Not enough resources");
      this.render();
    }, 160);
  }

  private readonly onBackdropPointerDown = (event: PointerEvent): void => {
    if (event.target === this.overlay) this.close();
  };
}
