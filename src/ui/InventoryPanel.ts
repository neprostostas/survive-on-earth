import type { EquipmentSystem } from "../equipment/EquipmentSystem";
import { EQUIPMENT_SLOT_IDS, type EquipmentSlotId } from "../equipment/EquipmentTypes";
import type { PlayerEquipment } from "../equipment/PlayerEquipment";
import type { PlayerWeaponSlot } from "../equipment/PlayerWeaponSlot";
import type { WeaponEquipSystem } from "../equipment/WeaponEquipSystem";
import { isWeaponCapableItemId } from "../equipment/WeaponTypes";
import type { PickupRejectionSink } from "../ground-loot/PickupResult";
import { INVENTORY_CONFIG } from "../inventory/inventoryConfig";
import type { PlayerInventory } from "../inventory/PlayerInventory";
import { ITEM_REGISTRY, stackDurability, type ItemStack } from "../items/ItemSystem";
import { ITEM_ICONS } from "./itemIcons";

type Selection =
  | { readonly source: "inventory"; readonly index: number; readonly stack: ItemStack }
  | { readonly source: "equipment"; readonly slot: EquipmentSlotId; readonly stack: ItemStack }
  | { readonly source: "weapon"; readonly stack: ItemStack };

const SLOT_LABELS: Readonly<Record<EquipmentSlotId, string>> = Object.freeze({
  head: "Head",
  torso: "Torso",
  legs: "Legs",
  feet: "Feet",
});

export class InventoryPanel implements PickupRejectionSink {
  private readonly inventory: PlayerInventory;
  private readonly equipment: PlayerEquipment;
  private readonly equipmentSystem: EquipmentSystem;
  private readonly weaponSlot: PlayerWeaponSlot;
  private readonly weaponEquipSystem: WeaponEquipSystem;
  private readonly toggleButton: HTMLButtonElement;
  private readonly onVisibilityChange: (open: boolean) => void;
  private readonly overlay: HTMLElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly slots: readonly HTMLButtonElement[];
  private readonly equipmentSlots: Readonly<Record<EquipmentSlotId, HTMLButtonElement>>;
  private readonly weaponSlotButton: HTMLButtonElement;
  private readonly armorValue: HTMLElement;
  private readonly selectionName: HTMLElement;
  private readonly selectionStats: HTMLElement;
  private readonly actionButton: HTMLButtonElement;
  private readonly preview: HTMLElement;
  private readonly fullFeedback: HTMLElement;
  private openState = false;
  private feedbackTimer: number | null = null;
  private selected: Selection | null = null;

  constructor(
    root: HTMLElement,
    inventory: PlayerInventory,
    equipment: PlayerEquipment,
    equipmentSystem: EquipmentSystem,
    weaponSlot: PlayerWeaponSlot,
    weaponEquipSystem: WeaponEquipSystem,
    toggleButton: HTMLButtonElement,
    onVisibilityChange: (open: boolean) => void,
  ) {
    this.inventory = inventory;
    this.equipment = equipment;
    this.equipmentSystem = equipmentSystem;
    this.weaponSlot = weaponSlot;
    this.weaponEquipSystem = weaponEquipSystem;
    this.toggleButton = toggleButton;
    this.onVisibilityChange = onVisibilityChange;
    this.overlay = document.createElement("section");
    this.overlay.className = "inventory-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.innerHTML = `
      <div class="inventory-panel" role="dialog" aria-modal="true" aria-labelledby="inventory-title">
        <header><div><small>PLAYER LOADOUT</small><h2 id="inventory-title">INVENTORY</h2></div><button class="inventory-close" type="button" aria-label="Close inventory">×</button></header>
        <div class="inventory-content">
          <section class="equipment-section" aria-labelledby="equipment-title">
            <div class="equipment-heading"><h3 id="equipment-title">ARMOR</h3><span class="armor-stat" aria-label="Total armor">ARMOR <b>0</b></span></div>
            <div class="equipment-layout">
              <div class="equipment-slot-list" aria-label="Four armor slots"></div>
              <div class="equipment-preview" aria-hidden="true">
                <svg viewBox="0 0 100 190"><circle class="preview-head" cx="50" cy="25" r="17"/><path class="preview-torso" d="M31 47Q50 39 69 47l8 56H23z"/><path class="preview-legs" d="M27 101h21l-5 57H25zm25 0h21l2 57H57z"/><path class="preview-feet" d="M23 156h21l6 18H19zm34 0h20l5 18H52z"/></svg>
              </div>
            </div>
            <div class="weapon-section" aria-labelledby="weapon-title">
              <h3 id="weapon-title">WEAPON</h3>
              <button type="button" class="equipment-slot weapon-slot" data-role="weapon-slot" aria-label="Weapon slot, empty">
                <span class="equipment-slot-label">Weapon</span>
                <span class="equipment-slot-content"></span>
              </button>
            </div>
          </section>
          <section class="inventory-storage" aria-labelledby="storage-title">
            <div class="inventory-storage-heading"><h3 id="storage-title">BASE STORAGE</h3><small>${INVENTORY_CONFIG.baseSlotCount} SLOTS</small></div>
            <div class="inventory-grid" aria-label="${INVENTORY_CONFIG.baseSlotCount} base inventory slots"></div>
            <div class="inventory-selection" aria-live="polite"><div><b class="selection-name">SELECT AN ITEM</b><small class="selection-stats">Resources, armor, and tools</small></div><button class="inventory-action" type="button" hidden></button></div>
          </section>
        </div>
      </div>`;
    root.append(this.overlay);
    this.fullFeedback = document.createElement("div");
    this.fullFeedback.className = "inventory-full-feedback";
    this.fullFeedback.setAttribute("role", "status");
    this.fullFeedback.setAttribute("aria-live", "polite");
    this.fullFeedback.textContent = "Inventory full";
    root.append(this.fullFeedback);

    const grid = this.overlay.querySelector<HTMLElement>(".inventory-grid");
    const equipmentList = this.overlay.querySelector<HTMLElement>(".equipment-slot-list");
    const closeButton = this.overlay.querySelector<HTMLButtonElement>(".inventory-close");
    const armorValue = this.overlay.querySelector<HTMLElement>(".armor-stat b");
    const selectionName = this.overlay.querySelector<HTMLElement>(".selection-name");
    const selectionStats = this.overlay.querySelector<HTMLElement>(".selection-stats");
    const actionButton = this.overlay.querySelector<HTMLButtonElement>(".inventory-action");
    const preview = this.overlay.querySelector<HTMLElement>(".equipment-preview");
    const weaponSlotButton = this.overlay.querySelector<HTMLButtonElement>('[data-role="weapon-slot"]');
    if (!grid || !equipmentList || !closeButton || !armorValue || !selectionName || !selectionStats || !actionButton || !preview || !weaponSlotButton) {
      throw new Error("Inventory UI failed to mount");
    }
    grid.style.setProperty("--inventory-columns", String(INVENTORY_CONFIG.columns));
    this.closeButton = closeButton;
    this.armorValue = armorValue;
    this.selectionName = selectionName;
    this.selectionStats = selectionStats;
    this.actionButton = actionButton;
    this.preview = preview;
    this.weaponSlotButton = weaponSlotButton;

    this.slots = Object.freeze(Array.from({ length: INVENTORY_CONFIG.baseSlotCount }, (_, index) => {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "inventory-slot";
      slot.dataset.slotIndex = String(index);
      slot.setAttribute("aria-label", `Empty inventory slot ${index + 1}`);
      slot.addEventListener("click", () => { this.selectInventory(index); });
      grid.append(slot);
      return slot;
    }));

    const equipmentSlots = {} as Record<EquipmentSlotId, HTMLButtonElement>;
    for (const slotId of EQUIPMENT_SLOT_IDS) {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "equipment-slot";
      slot.dataset.equipmentSlot = slotId;
      slot.innerHTML = `<span class="equipment-slot-label">${SLOT_LABELS[slotId]}</span><span class="equipment-slot-content"></span>`;
      slot.addEventListener("click", () => { this.selectEquipment(slotId); });
      equipmentList.append(slot);
      equipmentSlots[slotId] = slot;
    }
    this.equipmentSlots = Object.freeze(equipmentSlots);
    this.weaponSlotButton.addEventListener("click", () => { this.selectWeapon(); });

    this.renderSlots(Array.from({ length: INVENTORY_CONFIG.baseSlotCount }, (_, index) => index));
    this.renderEquipment();
    this.renderWeapon();
    inventory.subscribe((result) => {
      this.renderSlots(result.changedSlotIndexes);
      this.validateSelection();
    });
    equipment.subscribe(() => {
      this.renderEquipment();
      this.validateSelection();
    });
    weaponSlot.subscribe(() => {
      this.renderWeapon();
      this.validateSelection();
    });
    toggleButton.addEventListener("click", this.toggle);
    closeButton.addEventListener("click", this.close);
    actionButton.addEventListener("click", this.performSelectedAction);
    this.overlay.addEventListener("pointerdown", this.onBackdropPointerDown);
  }

  get isOpen(): boolean { return this.openState; }

  toggle = (): void => { this.setOpen(!this.openState); };
  open = (): void => { this.setOpen(true); };
  close = (): void => { this.setOpen(false); };

  handleInventoryFull(): void {
    this.showStatus("Inventory full");
  }

  showStatus(message: string): void {
    this.fullFeedback.textContent = message;
    this.fullFeedback.classList.add("visible");
    if (this.feedbackTimer !== null) window.clearTimeout(this.feedbackTimer);
    this.feedbackTimer = window.setTimeout(() => {
      this.fullFeedback.classList.remove("visible");
      this.feedbackTimer = null;
    }, INVENTORY_CONFIG.fullFeedbackDurationMs);
  }

  private setOpen(open: boolean): void {
    if (this.openState === open) return;
    this.openState = open;
    this.overlay.classList.toggle("open", open);
    this.overlay.setAttribute("aria-hidden", String(!open));
    this.toggleButton.classList.toggle("active", open);
    this.toggleButton.setAttribute("aria-expanded", String(open));
    if (!open) this.clearSelection();
    this.onVisibilityChange(open);
    if (open) this.closeButton.focus({ preventScroll: true });
    else this.toggleButton.focus({ preventScroll: true });
  }

  private renderSlots(indexes: readonly number[]): void {
    for (const index of indexes) {
      const slot = this.inventory.getSlot(index);
      const element = this.slots[slot.index];
      if (!element) continue;
      element.classList.toggle("occupied", slot.stack !== null);
      element.classList.toggle("selected", this.selected?.source === "inventory" && this.selected.index === index);
      if (!slot.stack) {
        element.replaceChildren();
        element.setAttribute("aria-label", `Empty inventory slot ${index + 1}`);
        continue;
      }
      const definition = ITEM_REGISTRY.get(slot.stack.itemId);
      const durability = stackDurability(slot.stack);
      const durabilityBar = durability
        ? `<i class="inventory-durability" style="--durability:${(durability.current / durability.max).toFixed(4)}" aria-hidden="true"></i>`
        : "";
      element.innerHTML = `<span class="inventory-item-icon">${ITEM_ICONS[definition.iconId]}</span><b class="inventory-quantity">${slot.stack.quantity}</b>${durabilityBar}`;
      element.setAttribute(
        "aria-label",
        durability
          ? `${definition.displayName}, quantity ${slot.stack.quantity}, durability ${durability.current} of ${durability.max}`
          : `${definition.displayName}, quantity ${slot.stack.quantity}`,
      );
    }
  }

  private renderEquipment(): void {
    this.armorValue.textContent = String(this.equipment.totalArmor);
    for (const slot of this.equipment.getSlots()) {
      const element = this.equipmentSlots[slot.id];
      const content = element.querySelector<HTMLElement>(".equipment-slot-content");
      if (!content) continue;
      element.classList.toggle("occupied", slot.stack !== null);
      element.classList.toggle("selected", this.selected?.source === "equipment" && this.selected.slot === slot.id);
      this.preview.classList.toggle(`has-${slot.id}`, slot.stack !== null);
      if (!slot.stack) {
        content.replaceChildren();
        element.setAttribute("aria-label", `${SLOT_LABELS[slot.id]} armor slot, empty`);
        continue;
      }
      const definition = ITEM_REGISTRY.get(slot.stack.itemId);
      content.innerHTML = `<span class="inventory-item-icon">${ITEM_ICONS[definition.iconId]}</span><small>+${definition.equipment?.armor ?? 0}</small>`;
      element.setAttribute("aria-label", `${SLOT_LABELS[slot.id]}: ${definition.displayName}`);
    }
  }

  private renderWeapon(): void {
    const stack = this.weaponSlot.current;
    const content = this.weaponSlotButton.querySelector<HTMLElement>(".equipment-slot-content");
    if (!content) return;
    this.weaponSlotButton.classList.toggle("occupied", stack !== null);
    this.weaponSlotButton.classList.toggle("selected", this.selected?.source === "weapon");
    if (!stack) {
      content.replaceChildren();
      this.weaponSlotButton.setAttribute("aria-label", "Weapon slot, empty");
      return;
    }
    const definition = ITEM_REGISTRY.get(stack.itemId);
    const durability = stackDurability(stack);
    const durabilityBar = durability
      ? `<i class="inventory-durability" style="--durability:${(durability.current / durability.max).toFixed(4)}" aria-hidden="true"></i>`
      : "";
    content.innerHTML = `<span class="inventory-item-icon">${ITEM_ICONS[definition.iconId]}</span>${durabilityBar}`;
    this.weaponSlotButton.setAttribute(
      "aria-label",
      durability
        ? `Weapon: ${definition.displayName}, durability ${durability.current} of ${durability.max}`
        : `Weapon: ${definition.displayName}`,
    );
  }

  private selectInventory(index: number): void {
    const stack = this.inventory.getSlot(index).stack;
    if (!stack) { this.clearSelection(); return; }
    this.selected = Object.freeze({ source: "inventory", index, stack });
    this.renderSelection();
  }

  private selectEquipment(slot: EquipmentSlotId): void {
    const stack = this.equipment.getSlot(slot).stack;
    if (!stack) { this.clearSelection(); return; }
    this.selected = Object.freeze({ source: "equipment", slot, stack });
    this.renderSelection();
  }

  private selectWeapon(): void {
    const stack = this.weaponSlot.current;
    if (!stack) { this.clearSelection(); return; }
    this.selected = Object.freeze({ source: "weapon", stack });
    this.renderSelection();
  }

  private renderSelection(): void {
    for (const [index, slot] of this.slots.entries()) {
      slot.classList.toggle("selected", this.selected?.source === "inventory" && this.selected.index === index);
    }
    for (const slotId of EQUIPMENT_SLOT_IDS) {
      this.equipmentSlots[slotId].classList.toggle("selected", this.selected?.source === "equipment" && this.selected.slot === slotId);
    }
    this.weaponSlotButton.classList.toggle("selected", this.selected?.source === "weapon");
    if (!this.selected) {
      this.selectionName.textContent = "SELECT AN ITEM";
      this.selectionStats.textContent = "Resources, armor, and tools";
      this.actionButton.hidden = true;
      return;
    }
    const definition = ITEM_REGISTRY.get(this.selected.stack.itemId);
    this.selectionName.textContent = definition.displayName.toUpperCase();

    if (this.selected.source === "weapon" || (this.selected.source === "inventory" && isWeaponCapableItemId(this.selected.stack.itemId) && definition.meleeCombat)) {
      const durability = stackDurability(this.selected.stack);
      const melee = definition.meleeCombat;
      this.selectionStats.textContent = durability && melee
        ? `WEAPON · ${durability.current} / ${durability.max} · ${melee.damage} dmg · ${melee.attacksPerSecond}/s`
        : "WEAPON";
      this.actionButton.textContent = this.selected.source === "inventory" ? "EQUIP" : "UNEQUIP";
      this.actionButton.hidden = false;
      return;
    }

    if (!definition.equipment) {
      const durability = stackDurability(this.selected.stack);
      this.selectionStats.textContent = durability
        ? `${definition.category.toUpperCase()} · ${durability.current} / ${durability.max}`
        : `${definition.category.toUpperCase()} · ${this.selected.stack.quantity} / ${definition.maxStack}`;
      this.actionButton.hidden = true;
      return;
    }
    this.selectionStats.textContent = `${SLOT_LABELS[definition.equipment.slot].toUpperCase()} · ARMOR +${definition.equipment.armor}`;
    this.actionButton.textContent = this.selected.source === "inventory" ? "EQUIP" : "UNEQUIP";
    this.actionButton.hidden = false;
  }

  private clearSelection(): void {
    this.selected = null;
    this.renderSelection();
  }

  private validateSelection(): void {
    if (!this.selected) return;
    const current = this.selected.source === "inventory"
      ? this.inventory.getSlot(this.selected.index).stack
      : this.selected.source === "equipment"
        ? this.equipment.getSlot(this.selected.slot).stack
        : this.weaponSlot.current;
    if (current !== this.selected.stack) this.clearSelection();
  }

  private readonly performSelectedAction = (): void => {
    const selection = this.selected;
    if (!selection) return;
    if (selection.source === "weapon") {
      const result = this.weaponEquipSystem.unequipToInventory(selection.stack);
      if (result.accepted || result.reason === "stale-source" || result.reason === "empty-source") this.clearSelection();
      else if (result.reason === "inventory-full") this.handleInventoryFull();
      return;
    }
    if (selection.source === "inventory" && isWeaponCapableItemId(selection.stack.itemId) && ITEM_REGISTRY.get(selection.stack.itemId).meleeCombat) {
      const result = this.weaponEquipSystem.equipFromInventory(selection.index, selection.stack);
      if (result.accepted || result.reason === "stale-source" || result.reason === "empty-source" || result.reason === "not-weapon") {
        this.clearSelection();
      }
      return;
    }
    const result = selection.source === "inventory"
      ? this.equipmentSystem.equipFromInventory(selection.index, selection.stack)
      : this.equipmentSystem.unequipToInventory(selection.slot, selection.stack);
    if (result.accepted || result.reason === "stale-source" || result.reason === "empty-source") this.clearSelection();
    else if (result.reason === "inventory-full") this.handleInventoryFull();
  };

  private readonly onBackdropPointerDown = (event: PointerEvent): void => {
    if (event.target === this.overlay) this.close();
  };
}
