import type { CraftingSystem } from "../crafting/CraftingSystem";
import type { CraftingCategory, CraftingRecipeDefinition, CraftingRecipeId } from "../crafting/CraftingTypes";
import { craftTierLabel } from "../crafting/CraftBenchTiers";
import { isBlueprintItemId } from "../crafting/BlueprintUnlocks";
import type { PlayerInventory } from "../inventory/PlayerInventory";
import { ITEM_REGISTRY } from "../items/ItemSystem";
import { ITEM_ICONS } from "./itemIcons";
import { LocalLoader } from "./Loaders";
import { I18N } from "../i18n/I18n";
import type { StringKey } from "../i18n/strings";
import { itemDesc, itemName } from "../i18n/contentApi";

/** Fold text for locale-aware blueprint search (diacritics + case). */
function foldSearch(text: string): string {
  try {
    return text
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLocaleLowerCase(I18N.currentLocale);
  } catch {
    return text.toLowerCase();
  }
}

const TAB_KEYS: Record<Exclude<CraftingCategory, never>, StringKey> = {
  all: "craft.tab.all",
  weapons: "craft.tab.weapons",
  armor: "craft.tab.armor",
  tools: "craft.tab.tools",
  survival: "craft.tab.consumable",
  materials: "craft.tab.material",
  building: "craft.tab.building",
};

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
  private readonly readyOnlyToggle: HTMLInputElement;
  private readonly emptyFilter: HTMLElement;
  private readonly cells = new Map<CraftingRecipeId, HTMLButtonElement>();
  private openState = false;
  private category: CraftingCategory = "all";
  private selectedId: CraftingRecipeId | null = null;
  private searchQuery = "";
  private readyOnly = false;
  private readonly localLoader = new LocalLoader();

  constructor(
    root: HTMLElement,
    inventory: PlayerInventory,
    private readonly crafting: CraftingSystem,
    private readonly toggleButton: HTMLButtonElement,
    private readonly showStatus: (message: string) => void,
    private readonly onVisibilityChange: (open: boolean) => void,
    private readonly onCrafted?: (recipeId: CraftingRecipeId, outputItemId: string) => void,
    /** When provided, opening is blocked unless this returns true (close always works). */
    private readonly canOpen?: () => boolean,
  ) {
    this.overlay = document.createElement("section");
    this.overlay.className = "crafting-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.innerHTML = `
      <div class="crafting-panel crafting-screen" role="dialog" aria-modal="true" aria-labelledby="crafting-title">
        <header class="crafting-header">
          <div class="crafting-header-titles">
            <small data-role="craft-subtitle">FIELD WORKBENCH</small>
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
          <label class="crafting-ready-filter">
            <input type="checkbox" class="crafting-ready-only" />
            <span data-role="craft-ready-label">Ready only</span>
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
              <b data-role="craft-select">SELECT A BLUEPRINT</b>
              <span data-role="craft-select-hint">Tap an item to see materials and craft it.</span>
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
              <div class="crafting-detail-label" data-role="craft-required">REQUIRED</div>
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
    const readyOnlyToggle = this.overlay.querySelector<HTMLInputElement>(".crafting-ready-only");
    const emptyFilter = this.overlay.querySelector<HTMLElement>(".crafting-empty-filter");
    if (!closeButton || !tabsEl || !gridEl || !detailEl || !searchInput || !readyOnlyToggle || !emptyFilter) {
      throw new Error("Crafting UI failed to mount");
    }
    this.closeButton = closeButton;
    this.tabsEl = tabsEl;
    this.gridEl = gridEl;
    this.detailEl = detailEl;
    this.searchInput = searchInput;
    this.readyOnlyToggle = readyOnlyToggle;
    this.emptyFilter = emptyFilter;
    this.localLoader.attach(this.overlay.querySelector(".crafting-panel") ?? this.overlay);

    for (const id of Object.keys(TAB_KEYS) as CraftingCategory[]) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "crafting-tab";
      btn.dataset.category = id;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", id === this.category ? "true" : "false");
      btn.textContent = I18N.t(TAB_KEYS[id]);
      if (id === this.category) btn.classList.add("active");
      btn.addEventListener("click", () => { this.setCategory(id); });
      this.tabsEl.append(btn);
    }

    for (const recipe of crafting.recipeRegistry.getAll()) {
      const output = ITEM_REGISTRY.get(recipe.output.itemId);
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "crafting-cell";
      cell.dataset.recipeId = recipe.id;
      cell.dataset.category = recipe.category ?? "materials";
      cell.setAttribute("role", "option");
      cell.setAttribute("aria-selected", "false");
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
    this.readyOnlyToggle.addEventListener("change", () => {
      this.readyOnly = this.readyOnlyToggle.checked;
      this.render();
    });

    this.rebuildLocalizedSearch();
    this.applyCraftLocale();
    this.render();
    inventory.subscribe(() => { this.render(); });
    I18N.onChange(() => {
      this.rebuildLocalizedSearch();
      this.applyCraftLocale();
      this.render();
    });
    toggleButton.addEventListener("click", this.toggle);
    closeButton.addEventListener("click", this.close);
    this.overlay.addEventListener("pointerdown", this.onBackdropPointerDown);
  }

  get isOpen(): boolean { return this.openState; }

  toggle = (): void => { this.setOpen(!this.openState); };
  open = (): void => { this.setOpen(true); };
  close = (): void => { this.setOpen(false); };

  /** Re-evaluate craftable / blueprint locks while open. */
  refresh(): void {
    if (!this.openState) return;
    this.render();
  }

  private setOpen(open: boolean): void {
    if (open === this.openState) return;
    if (open && this.canOpen && !this.canOpen()) {
      this.showStatus(I18N.t("notify.needWorkbench"));
      return;
    }
    this.openState = open;
    this.overlay.classList.toggle("open", open);
    this.overlay.setAttribute("aria-hidden", String(!open));
    this.toggleButton.classList.toggle("active", open);
    this.toggleButton.setAttribute("aria-expanded", String(open));
    this.onVisibilityChange(open);
    if (open) {
      this.rebuildLocalizedSearch();
      this.applyCraftLocale();
      this.render();
      this.searchInput.focus({ preventScroll: true });
    } else {
      this.selectedId = null;
      this.toggleButton.focus({ preventScroll: true });
    }
  }

  private categoryLabel(category: CraftingCategory): string {
    return I18N.t(TAB_KEYS[category] ?? "craft.tab.material");
  }

  private applyCraftLocale(): void {
    const t = (k: StringKey) => I18N.t(k);
    const h2 = this.overlay.querySelector("#crafting-title");
    if (h2) h2.textContent = t("craft.title").toUpperCase();
    const sub = this.overlay.querySelector("[data-role=craft-subtitle]");
    if (sub) {
      sub.textContent = craftTierLabel(this.crafting.currentBenchTier).toUpperCase();
    }
    this.searchInput.placeholder = t("craft.search");
    this.emptyFilter.textContent = t("craft.empty");
    const readyLabel = this.overlay.querySelector("[data-role=craft-ready-label]");
    if (readyLabel) readyLabel.textContent = t("craft.readyOnly");
    this.readyOnlyToggle.setAttribute("aria-label", t("craft.readyOnly"));
    const craftBtn = this.detailEl.querySelector(".craft-button");
    if (craftBtn && !this.selectedId) craftBtn.textContent = t("craft.craft");
    this.closeButton.setAttribute("aria-label", t("craft.close"));
    const select = this.overlay.querySelector("[data-role=craft-select]");
    if (select) select.textContent = t("craft.select").toUpperCase();
    const hint = this.overlay.querySelector("[data-role=craft-select-hint]");
    if (hint) hint.textContent = t("craft.selectHint");
    const req = this.overlay.querySelector("[data-role=craft-required]");
    if (req) req.textContent = t("craft.required").toUpperCase();
    this.tabsEl.setAttribute("aria-label", t("craft.title"));
    this.gridEl.setAttribute("aria-label", t("craft.title"));
    for (const btn of this.tabsEl.querySelectorAll<HTMLButtonElement>(".crafting-tab")) {
      const cat = btn.dataset.category as CraftingCategory | undefined;
      if (cat) btn.textContent = this.categoryLabel(cat);
    }
  }

  /** Build search corpus from current locale names + EN authoring names/ids. */
  private recipeSearchBlob(recipe: CraftingRecipeDefinition): string {
    const output = ITEM_REGISTRY.get(recipe.output.itemId);
    const parts: string[] = [
      itemName(output),
      output.displayName,
      recipe.id,
      output.id,
      itemDesc(output),
      output.description ?? "",
    ];
    for (const ing of recipe.ingredients) {
      try {
        const def = ITEM_REGISTRY.get(ing.itemId);
        parts.push(itemName(def), def.displayName, def.id);
      } catch {
        parts.push(ing.itemId);
      }
    }
    return foldSearch(parts.filter(Boolean).join(" "));
  }

  private rebuildLocalizedSearch(): void {
    for (const recipe of this.crafting.recipeRegistry.getAll()) {
      const cell = this.cells.get(recipe.id);
      if (!cell) continue;
      const output = ITEM_REGISTRY.get(recipe.output.itemId);
      const name = itemName(output);
      cell.dataset.search = this.recipeSearchBlob(recipe);
      cell.title = name;
      cell.setAttribute("aria-label", name);
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
    const query = foldSearch(this.searchQuery).trim();
    const tokens = query ? query.split(/\s+/).filter(Boolean) : [];
    let visibleCount = 0;
    let selectionStillVisible = false;

    for (const recipe of this.crafting.recipeRegistry.getAll()) {
      const state = this.crafting.getRecipeState(recipe.id);
      const cell = this.cells.get(recipe.id);
      if (!state || !cell) continue;
      const cat = recipe.category ?? "materials";
      const catOk = this.category === "all" || cat === this.category;
      const hay = cell.dataset.search ?? "";
      const searchOk = tokens.length === 0 || tokens.every((token) => hay.includes(token));
      const readyOk = !this.readyOnly || state.craftable;
      const visible = catOk && searchOk && readyOk;
      cell.hidden = !visible;
      if (visible) {
        visibleCount += 1;
        if (this.selectedId === recipe.id) selectionStillVisible = true;
      }
      cell.classList.toggle("craftable", state.craftable);
      cell.classList.toggle("blocked", !state.craftable);
      cell.classList.toggle("need-bench", state.blockedBy === "need-bench");
      cell.classList.toggle("need-blueprint", state.blockedBy === "need-blueprint");
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
    nameEl.textContent = itemName(output);
    const cat = state.recipe.category ?? "materials";
    catEl.textContent = this.categoryLabel(cat).toUpperCase();
    qtyEl.textContent = state.recipe.output.quantity > 1
      ? I18N.t("craft.creates", { n: state.recipe.output.quantity })
      : itemDesc(output);

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
          <b>${itemName(definition)}</b>
          <small class="crafting-owned">${row.owned} / ${row.ingredient.quantity}</small>
        </span>`;
      ingredients.append(el);
    }

    button.disabled = !state.craftable;
    button.textContent = state.craftable
      ? I18N.t("craft.craft")
      : state.blockedBy === "inventory-full"
        ? I18N.t("inv.full")
        : state.blockedBy === "need-bench"
          ? I18N.t("craft.needBench", { bench: craftTierLabel(state.requiredTier) })
          : state.blockedBy === "need-blueprint"
            ? I18N.t("craft.needBlueprint", {
              name: state.requiredBlueprint && isBlueprintItemId(state.requiredBlueprint)
                ? itemName(ITEM_REGISTRY.get(state.requiredBlueprint))
                : I18N.t("craft.blueprint"),
            })
            : I18N.t("craft.needMaterials");
  }

  private craft(recipeId: CraftingRecipeId): void {
    this.localLoader.show(I18N.t("craft.working"));
    window.setTimeout(() => {
      const result = this.crafting.craft(recipeId);
      this.localLoader.hide();
      if (result.accepted && result.output) {
        this.showStatus(I18N.t("craft.crafted", { name: itemName(ITEM_REGISTRY.get(result.output.itemId)) }));
        this.onCrafted?.(recipeId, result.output.itemId);
      } else if (result.status === "inventory-full") this.showStatus(I18N.t("notify.inventoryFull"));
      else if (result.status === "need-bench") {
        const state = this.crafting.getRecipeState(recipeId);
        this.showStatus(I18N.t("craft.needBench", {
          bench: craftTierLabel(state?.requiredTier ?? 1),
        }));
      } else if (result.status === "need-blueprint") {
        const state = this.crafting.getRecipeState(recipeId);
        const bp = state?.requiredBlueprint;
        this.showStatus(I18N.t("craft.needBlueprint", {
          name: bp && isBlueprintItemId(bp)
            ? itemName(ITEM_REGISTRY.get(bp))
            : I18N.t("craft.blueprint"),
        }));
      } else if (result.status === "not-enough-resources") this.showStatus(I18N.t("craft.needMaterials"));
      this.render();
    }, 160);
  }

  private readonly onBackdropPointerDown = (event: PointerEvent): void => {
    if (event.target === this.overlay) this.close();
  };
}
