import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import type { WorldContainerEntity } from "../containers/WorldContainer.ts";
import { itemName } from "../i18n/contentApi";
import { ITEM_ICONS } from "./itemIcons";
import type { ItemId } from "../items/ItemId";
import type { ItemStack } from "../items/ItemSystem";

/**
 * Storage transfer UI: container slots ↔ player inventory pockets.
 * Click container → take. Click inventory → deposit.
 */
export class ContainerPanel {
  private readonly overlay: HTMLElement;
  private openState = false;
  private container: WorldContainerEntity | null = null;
  private inventory: PlayerInventory | null = null;
  private readonly onClose: () => void;
  private readonly onChanged: () => void;

  constructor(
    root: HTMLElement,
    handlers: {
      onClose?: () => void;
      onChanged?: () => void;
      onVisibility?: (open: boolean) => void;
    } = {},
  ) {
    this.onClose = handlers.onClose ?? (() => {});
    this.onChanged = handlers.onChanged ?? (() => {});
    this.overlay = document.createElement("section");
    this.overlay.className = "container-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.innerHTML = `
      <div class="container-panel" role="dialog" aria-modal="true" aria-labelledby="container-title">
        <header class="container-header">
          <div>
            <small class="container-kicker">STORAGE</small>
            <h2 id="container-title">Chest</h2>
          </div>
          <button type="button" class="container-close" data-role="close" aria-label="Close">×</button>
        </header>
        <div class="container-body">
          <section class="container-col" aria-label="Chest">
            <h3 class="container-col-title" data-role="chest-title">Chest</h3>
            <div class="container-grid" data-role="chest-grid"></div>
          </section>
          <section class="container-col" aria-label="Inventory">
            <h3 class="container-col-title">Inventory</h3>
            <div class="container-grid" data-role="inv-grid"></div>
          </section>
        </div>
        <footer class="container-footer">
          <button type="button" class="menu-btn" data-role="take-all">TAKE ALL</button>
          <p class="container-hint">Click a stack to transfer</p>
        </footer>
      </div>`;
    root.append(this.overlay);

    this.overlay.querySelector("[data-role=close]")?.addEventListener("click", () => this.close());
    this.overlay.querySelector("[data-role=take-all]")?.addEventListener("click", () => this.takeAll());
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });

    this.visibility = handlers.onVisibility;
  }

  private readonly visibility?: (open: boolean) => void;

  get isOpen(): boolean { return this.openState; }
  get currentContainerId(): string | null { return this.container?.interactionId ?? null; }

  open(container: WorldContainerEntity, inventory: PlayerInventory): void {
    this.container = container;
    this.inventory = inventory;
    this.openState = true;
    this.overlay.classList.add("open");
    this.overlay.setAttribute("aria-hidden", "false");
    const title = this.overlay.querySelector("#container-title");
    if (title) title.textContent = container.inventory.title;
    const chestTitle = this.overlay.querySelector("[data-role=chest-title]");
    if (chestTitle) chestTitle.textContent = container.inventory.title;
    this.refresh();
    this.visibility?.(true);
  }

  close(): void {
    if (!this.openState) return;
    this.openState = false;
    this.container = null;
    this.inventory = null;
    this.overlay.classList.remove("open");
    this.overlay.setAttribute("aria-hidden", "true");
    this.visibility?.(false);
    this.onClose();
  }

  refresh(): void {
    if (!this.openState || !this.container || !this.inventory) return;
    this.renderChest();
    this.renderInventory();
  }

  private renderChest(): void {
    const grid = this.overlay.querySelector("[data-role=chest-grid]");
    if (!grid || !this.container) return;
    grid.replaceChildren();
    for (let i = 0; i < this.container.inventory.slotCount; i += 1) {
      const stack = this.container.inventory.getSlot(i);
      grid.append(this.slotButton("chest", i, stack));
    }
  }

  private renderInventory(): void {
    const grid = this.overlay.querySelector("[data-role=inv-grid]");
    if (!grid || !this.inventory) return;
    grid.replaceChildren();
    for (let i = 0; i < this.inventory.slotCount; i += 1) {
      const stack = this.inventory.getSlot(i).stack;
      grid.append(this.slotButton("inv", i, stack));
    }
  }

  private slotButton(side: "chest" | "inv", index: number, stack: ItemStack | null): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "container-slot" + (stack ? "" : " is-empty");
    if (stack) {
      const id = stack.itemId as ItemId;
      const icon = ITEM_ICONS[id] ?? `<span class="container-slot-fallback">${id.slice(0, 2).toUpperCase()}</span>`;
      btn.innerHTML = `${icon}<span class="container-slot-qty">${stack.quantity}</span>`;
      btn.title = `${itemName(id)} ×${stack.quantity}`;
    } else {
      btn.title = "Empty";
    }
    btn.addEventListener("click", () => {
      if (side === "chest") this.takeFromChest(index);
      else this.depositFromInventory(index);
    });
    return btn;
  }

  private takeFromChest(index: number): void {
    if (!this.container || !this.inventory) return;
    const stack = this.container.inventory.take(index);
    if (!stack) return;
    if (this.inventory.tryInsert(stack).accepted) {
      this.onChanged();
      this.refresh();
      return;
    }
    this.container.inventory.place(index, stack);
  }

  private depositFromInventory(index: number): void {
    if (!this.container || !this.inventory) return;
    const stack = this.inventory.getSlot(index).stack;
    if (!stack) return;
    if (!this.container.inventory.tryInsert(stack)) return;
    this.inventory.exchangeWholeStack(index, stack, null);
    this.onChanged();
    this.refresh();
  }

  private takeAll(): void {
    if (!this.container || !this.inventory) return;
    let moved = 0;
    for (let i = 0; i < this.container.inventory.slotCount; i += 1) {
      const stack = this.container.inventory.take(i);
      if (!stack) continue;
      if (this.inventory.tryInsert(stack).accepted) moved += 1;
      else {
        this.container.inventory.place(i, stack);
        break;
      }
    }
    if (moved > 0) this.onChanged();
    this.refresh();
  }
}
