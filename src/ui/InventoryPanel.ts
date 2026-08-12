import { resolvePlayerMeleeProfile } from "../combat/resolvePlayerMeleeProfile";
import type { BackpackEquipSystem } from "../equipment/BackpackEquipSystem";
import type { EquipmentSystem } from "../equipment/EquipmentSystem";
import { EQUIPMENT_SLOT_IDS, type EquipmentSlotId } from "../equipment/EquipmentTypes";
import type { PlayerBackpackSlot } from "../equipment/PlayerBackpackSlot";
import type { PlayerEquipment } from "../equipment/PlayerEquipment";
import type { PlayerWeaponSlot } from "../equipment/PlayerWeaponSlot";
import type { WeaponEquipSystem } from "../equipment/WeaponEquipSystem";
import { isBackpackCapableItemId } from "../equipment/BackpackTypes";
import { isWeaponCapableItemId, toHeldWeaponVisualId } from "../equipment/WeaponTypes";
import { PlayerQuickSlot } from "../equipment/PlayerQuickSlot";
import type { QuickSlotSystem } from "../equipment/QuickSlotSystem";
import type { PickupRejectionSink } from "../ground-loot/PickupResult";
import { INVENTORY_CONFIG } from "../inventory/inventoryConfig";
import type { PlayerInventory } from "../inventory/PlayerInventory";
import { isBlueprintItemId } from "../crafting/BlueprintUnlocks";
import { resolveItemActions } from "../items/ItemActions";
import { ITEM_REGISTRY, stackDurability, type ItemStack } from "../items/ItemSystem";
import { InventoryCharacterPreview } from "./InventoryCharacterPreview";
import { CHARACTER_PROFILE, type CharacterGender } from "../player/CharacterProfile";
import { ITEM_ICONS } from "./itemIcons";
import { I18N } from "../i18n/I18n";
import { itemName } from "../i18n/contentApi";

const PENCIL_SVG = `<svg class="inv-pencil-svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;

type Selection =
  | { readonly source: "inventory"; readonly index: number; readonly stack: ItemStack }
  | { readonly source: "equipment"; readonly slot: EquipmentSlotId; readonly stack: ItemStack }
  | { readonly source: "weapon"; readonly stack: ItemStack }
  | { readonly source: "backpack"; readonly stack: ItemStack }
  | { readonly source: "quick"; readonly index: 0 | 1; readonly stack: ItemStack };

type DragOrigin =
  | { readonly kind: "inventory"; readonly index: number }
  | { readonly kind: "equipment"; readonly slot: EquipmentSlotId }
  | { readonly kind: "weapon" }
  | { readonly kind: "backpack" }
  | { readonly kind: "quick"; readonly index: 0 | 1 };

type DropTarget =
  | { readonly kind: "inventory"; readonly index: number }
  | { readonly kind: "equipment"; readonly slot: EquipmentSlotId }
  | { readonly kind: "weapon" }
  | { readonly kind: "backpack" }
  | { readonly kind: "quick"; readonly index: 0 | 1 };

interface ActiveDrag {
  origin: DragOrigin;
  stack: ItemStack;
  pointerId: number;
  startX: number;
  startY: number;
  active: boolean;
  ghost: HTMLElement | null;
  over: HTMLElement | null;
}

function slotLabel(id: EquipmentSlotId): string {
  return ({ head: "Head", torso: "Torso", legs: "Legs", feet: "Feet" } as const)[id];
}

/** Presentation-only silhouette SVGs (original, not LDOE art). */
const ARMOR_SILHOUETTES: Readonly<Record<EquipmentSlotId, string>> = Object.freeze({
  head: `<svg class="inv-slot-sil" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="4.2"/><path d="M6.5 20c1.2-3.2 3.1-4.6 5.5-4.6s4.3 1.4 5.5 4.6"/></svg>`,
  torso: `<svg class="inv-slot-sil" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5 5 8.2v4.3l2.2.8V19h9.6v-5.7l2.2-.8V8.2L16 5.5 14.2 7h-4.4z"/></svg>`,
  legs: `<svg class="inv-slot-sil" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 4h7.6l.7 7.5-1.5.4-.6 8.1H12.6l-.4-6.6h-1.4l-.4 6.6H8.6l-.6-8.1-1.5-.4z"/></svg>`,
  feet: `<svg class="inv-slot-sil" viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 14.5h5.2l1.1 1.2h6.7v2.8H5.5zm1.2-5.2h4.1l.9 4.2H6.2z"/></svg>`,
});

const WEAPON_SIL = `<svg class="inv-slot-sil" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 3.8 20.2 11l-1.6 1.6-2.4-2.4-5.4 5.4-1.1-.3-.3-1.1 5.4-5.4-2.4-2.4z"/><path d="m8.6 14.4-3.8 5.8 5.8-3.8"/></svg>`;
const BACKPACK_SIL = `<svg class="inv-slot-sil" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7.2V5.8A2.2 2.2 0 0 1 10.2 3.6h3.6A2.2 2.2 0 0 1 16 5.8v1.4"/><rect x="6.2" y="7.2" width="11.6" height="13" rx="1.6"/><path d="M9 11.2h6v2.2H9z"/></svg>`;
const QUICK_SIL = `<svg class="inv-slot-sil" viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="5.5" width="13" height="13" rx="2"/><path d="M9 12h6M12 9v6"/></svg>`;

const STAT_ICONS = Object.freeze({
  damage: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 17.5 6.5l1.2 1.2L6.2 20.2zm13.2-14.4 1.3 1.3-1.6 1.6-1.3-1.3z"/></svg>`,
  armor: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 5.5 6v5.4c0 4.2 2.7 7.8 6.5 9.4 3.8-1.6 6.5-5.2 6.5-9.4V6z"/></svg>`,
  speed: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13h7l-1.5 7L20 11h-7l1.5-7z"/></svg>`,
  aps: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.2"/><path d="M12 7.2v5.1l3.4 2"/></svg>`,
});

const DRAG_THRESHOLD_PX = 6;
/** UI capacity for backpack storage cells — must cover highest backpack.extraSlots. */
const BACKPACK_STORAGE_UI_COUNT = INVENTORY_CONFIG.reservedExtraSlotCapacity;

export interface InventoryLiveFrame {
  readonly currentHealth: number;
  readonly maxHealth: number;
  readonly moveSpeed: number;
  readonly motionFrozen: boolean;
}

/**
 * LDOE-style full-screen Inventory / character screen.
 * Presentation only over production Inventory + Equipment + Weapon + Backpack state.
 */
export class InventoryPanel implements PickupRejectionSink {
  // I18N chrome applied on open
  private readonly inventory: PlayerInventory;
  private readonly equipment: PlayerEquipment;
  private readonly equipmentSystem: EquipmentSystem;
  private readonly weaponSlot: PlayerWeaponSlot;
  private readonly weaponEquipSystem: WeaponEquipSystem;
  private readonly backpackSlot: PlayerBackpackSlot;
  private readonly backpackEquipSystem: BackpackEquipSystem;
  private readonly quickSlots: readonly [PlayerQuickSlot, PlayerQuickSlot];
  private readonly quickSystems: readonly [QuickSlotSystem, QuickSlotSystem];
  private readonly toggleButton: HTMLButtonElement;
  private readonly onVisibilityChange: (open: boolean) => void;
  private readonly overlay: HTMLElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly pocketSlots: readonly HTMLButtonElement[];
  private readonly backpackStorageButtons: readonly HTMLButtonElement[];
  private readonly equipmentSlots: Readonly<Record<EquipmentSlotId, HTMLButtonElement>>;
  private readonly weaponSlotButton: HTMLButtonElement;
  private readonly backpackShell: HTMLButtonElement;
  private readonly quickSlotButtons: readonly [HTMLButtonElement, HTMLButtonElement];
  private readonly backpackSectionLabel: HTMLElement;
  private readonly backpackSectionMeta: HTMLElement;
  private readonly selectionName: HTMLElement;
  private readonly selectionStats: HTMLElement;
  private readonly actionButton: HTMLButtonElement;
  private readonly splitButton: HTMLButtonElement;
  private readonly stripUse: HTMLButtonElement;
  private readonly stripSplit: HTMLButtonElement;
  private readonly stripDelete: HTMLButtonElement;
  private readonly hpValue: HTMLElement;
  private readonly hpFill: HTMLElement;
  private readonly statDamage: HTMLElement;
  private readonly statArmor: HTMLElement;
  private readonly statSpeed: HTMLElement;
  private readonly statAps: HTMLElement;
  private readonly preview: InventoryCharacterPreview;
  private readonly charTitle: HTMLElement;
  private readonly nameView: HTMLElement;
  private readonly nameEditRow: HTMLElement;
  private readonly nameInput: HTMLInputElement;
  private readonly namePencil: HTMLButtonElement;
  private readonly nameSave: HTMLButtonElement;
  private readonly genderMale: HTMLButtonElement;
  private readonly genderFemale: HTMLButtonElement;
  private readonly fullFeedback: HTMLElement;
  private readonly itemTooltip: HTMLElement;
  private openState = false;
  private nameEditing = false;
  private feedbackTimer: number | null = null;
  private selected: Selection | null = null;
  private drag: ActiveDrag | null = null;
  private suppressClick = false;
  private lastHpKey = "";
  private onUseItem: ((slotIndex: number, stack: ItemStack) => boolean) | null = null;
  private onQuickAssign: ((slotIndex: number, stack: ItemStack) => boolean) | null = null;
  private onDeleteItem: ((slotIndex: number, stack: ItemStack) => boolean) | null = null;

  constructor(
    root: HTMLElement,
    inventory: PlayerInventory,
    equipment: PlayerEquipment,
    equipmentSystem: EquipmentSystem,
    weaponSlot: PlayerWeaponSlot,
    weaponEquipSystem: WeaponEquipSystem,
    backpackSlot: PlayerBackpackSlot,
    backpackEquipSystem: BackpackEquipSystem,
    quickSlots: readonly [PlayerQuickSlot, PlayerQuickSlot],
    quickSystems: readonly [QuickSlotSystem, QuickSlotSystem],
    toggleButton: HTMLButtonElement,
    onVisibilityChange: (open: boolean) => void,
  ) {
    this.inventory = inventory;
    this.equipment = equipment;
    this.equipmentSystem = equipmentSystem;
    this.weaponSlot = weaponSlot;
    this.weaponEquipSystem = weaponEquipSystem;
    this.backpackSlot = backpackSlot;
    this.backpackEquipSystem = backpackEquipSystem;
    this.quickSlots = quickSlots;
    this.quickSystems = quickSystems;
    this.toggleButton = toggleButton;
    this.onVisibilityChange = onVisibilityChange;
    this.overlay = document.createElement("section");
    this.overlay.className = "inventory-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.innerHTML = `
      <div class="inventory-panel inventory-screen" role="dialog" aria-modal="true" aria-labelledby="inventory-title">
        <button class="inventory-close" type="button" aria-label="Close inventory">×</button>
        <div class="inventory-screen-body">
          <aside class="inv-left" aria-label="Inventory storage">
            <header class="inv-left-header">
              <h2 id="inventory-title">INVENTORY</h2>
            </header>
            <div class="inv-section-label"><span>POCKETS</span><small>${INVENTORY_CONFIG.baseSlotCount}</small></div>
            <div class="inventory-grid" aria-label="${INVENTORY_CONFIG.baseSlotCount} pocket inventory slots"></div>
            <div class="inv-section-label muted" data-role="backpack-section-label"><span>BACKPACK</span><small data-role="backpack-section-meta">LOCKED</small></div>
            <div class="inv-backpack-future" data-role="backpack-future"></div>
            <div class="inv-selection" aria-live="polite">
              <div>
                <b class="selection-name">SELECT AN ITEM</b>
                <small class="selection-stats">Tap armor or tools · drag to equip</small>
              </div>
              <div class="inv-selection-actions">
                <button class="inventory-action" type="button" hidden></button>
                <button class="inventory-split" type="button" hidden></button>
            </div>
            </div>
            <div class="inv-action-strip" aria-label="Item actions">
              <button type="button" class="inv-shell-btn" data-role="strip-use" disabled title="Not available">USE</button>
              <button type="button" class="inv-shell-btn" data-role="strip-split" disabled title="Not available">SPLIT</button>
              <button type="button" class="inv-shell-btn" data-role="strip-delete" disabled title="Not available">DELETE</button>
            </div>
          </aside>
          <section class="inv-character" aria-label="Character equipment">
            <header class="inv-char-header">
              <div class="inv-char-title-block">
                <div class="inv-name-view" data-role="name-view">
                  <div class="inv-char-title" data-role="char-name">PLAYER</div>
                  <button type="button" class="inv-name-pencil" data-role="name-pencil" title="Edit name" aria-label="Edit name">${PENCIL_SVG}</button>
                </div>
                <div class="inv-name-edit-row" data-role="name-edit-row" hidden>
                  <input type="text" class="inv-name-input" data-role="name-input" maxlength="20" autocomplete="off" spellcheck="false" enterkeyhint="done" />
                  <button type="button" class="inv-name-save" data-role="name-save" hidden>Save</button>
                </div>
              </div>
              <div class="inv-char-hp" aria-label="Player health">
                <div class="inv-hp-row"><span>HP</span><b class="inv-hp-value">100 / 100</b></div>
                <div class="inv-hp-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">
                  <i class="inv-hp-fill"></i>
                </div>
              </div>
            </header>
            <div class="inv-character-stage">
              <div class="inv-equip-col inv-equip-left" aria-label="Weapon, pack, and quick slots">
                <button type="button" class="equipment-slot weapon-slot inv-eq-slot" data-role="weapon-slot" data-drop="weapon" aria-label="Weapon slot, empty">
                  <span class="inv-eq-glyph" data-role="weapon-empty">${WEAPON_SIL}</span>
                  <span class="equipment-slot-content"></span>
                </button>
                <button type="button" class="equipment-slot inv-eq-slot" data-role="backpack-equip" data-drop="backpack" aria-label="Backpack slot, empty">
                  <span class="inv-eq-glyph" data-role="backpack-empty">${BACKPACK_SIL}</span>
                  <span class="equipment-slot-content"></span>
                </button>
                <button type="button" class="equipment-slot inv-eq-slot quick-slot" data-role="quick-equip-0" data-drop="quick" data-quick-index="0" aria-label="Quick slot 1, empty">
                  <span class="inv-eq-glyph" data-role="quick-empty">${QUICK_SIL}</span>
                  <span class="equipment-slot-content"></span>
                  <span class="inv-quick-key" aria-hidden="true">1</span>
                </button>
                <button type="button" class="equipment-slot inv-eq-slot quick-slot" data-role="quick-equip-1" data-drop="quick" data-quick-index="1" aria-label="Quick slot 2, empty">
                  <span class="inv-eq-glyph" data-role="quick-empty">${QUICK_SIL}</span>
                  <span class="equipment-slot-content"></span>
                  <span class="inv-quick-key" aria-hidden="true">2</span>
                </button>
              </div>
              <div class="inv-preview-wrap">
                <canvas class="inv-character-canvas" aria-label="Character preview — drag to rotate"></canvas>
                <span class="inv-orbit-hint" aria-hidden="true">Drag to rotate</span>
                <div class="inv-gender-toggle" role="group" aria-label="Gender">
                  <button type="button" class="inv-gender-btn" data-role="gender-male" data-gender="male" aria-label="Male" title="Male">♂</button>
                  <button type="button" class="inv-gender-btn" data-role="gender-female" data-gender="female" aria-label="Female" title="Female">♀</button>
                </div>
              </div>
              <div class="inv-equip-col inv-equip-right" data-role="armor-column" aria-label="Armor slots"></div>
            </div>
            <footer class="inv-stats" aria-label="Character stats">
              <div class="inv-stat" data-stat="damage"><span class="inv-stat-icon">${STAT_ICONS.damage}</span><div><small>DAMAGE</small><b class="inv-stat-damage">6</b></div></div>
              <div class="inv-stat" data-stat="armor"><span class="inv-stat-icon">${STAT_ICONS.armor}</span><div><small>ARMOR</small><b class="inv-stat-armor">0</b></div></div>
              <div class="inv-stat" data-stat="speed"><span class="inv-stat-icon">${STAT_ICONS.speed}</span><div><small>SPEED</small><b class="inv-stat-speed">4.5</b></div></div>
              <div class="inv-stat" data-stat="aps"><span class="inv-stat-icon">${STAT_ICONS.aps}</span><div><small>ATK SPD</small><b class="inv-stat-aps">1.8</b></div></div>
            </footer>
          </section>
        </div>
      </div>`;
    root.append(this.overlay);
    this.fullFeedback = document.createElement("div");
    this.fullFeedback.className = "inventory-full-feedback";
    this.fullFeedback.setAttribute("role", "status");
    this.fullFeedback.setAttribute("aria-live", "polite");
    this.fullFeedback.textContent = I18N.t("inv.full");
    root.append(this.fullFeedback);
    this.itemTooltip = document.createElement("div");
    this.itemTooltip.className = "inv-item-tooltip";
    this.itemTooltip.setAttribute("role", "tooltip");
    this.itemTooltip.hidden = true;
    // Body: escape #ui-root zoom so fixed left/top match getBoundingClientRect (viewport).
    document.body.append(this.itemTooltip);

    const grid = this.overlay.querySelector<HTMLElement>(".inventory-grid");
    const armorColumn = this.overlay.querySelector<HTMLElement>('[data-role="armor-column"]');
    const backpackFuture = this.overlay.querySelector<HTMLElement>('[data-role="backpack-future"]');
    const closeButton = this.overlay.querySelector<HTMLButtonElement>(".inventory-close");
    const selectionName = this.overlay.querySelector<HTMLElement>(".selection-name");
    const selectionStats = this.overlay.querySelector<HTMLElement>(".selection-stats");
    const actionButton = this.overlay.querySelector<HTMLButtonElement>(".inventory-action");
    const splitButton = this.overlay.querySelector<HTMLButtonElement>(".inventory-split");
    const stripUse = this.overlay.querySelector<HTMLButtonElement>('[data-role="strip-use"]');
    const stripSplit = this.overlay.querySelector<HTMLButtonElement>('[data-role="strip-split"]');
    const stripDelete = this.overlay.querySelector<HTMLButtonElement>('[data-role="strip-delete"]');
    const weaponSlotButton = this.overlay.querySelector<HTMLButtonElement>('[data-role="weapon-slot"]');
    const backpackShell = this.overlay.querySelector<HTMLButtonElement>('[data-role="backpack-equip"]');
    const quick0 = this.overlay.querySelector<HTMLButtonElement>('[data-role="quick-equip-0"]');
    const quick1 = this.overlay.querySelector<HTMLButtonElement>('[data-role="quick-equip-1"]');
    const canvas = this.overlay.querySelector<HTMLCanvasElement>(".inv-character-canvas");
    const charTitle = this.overlay.querySelector<HTMLElement>('[data-role="char-name"]');
    const nameView = this.overlay.querySelector<HTMLElement>('[data-role="name-view"]');
    const nameEditRow = this.overlay.querySelector<HTMLElement>('[data-role="name-edit-row"]');
    const nameInput = this.overlay.querySelector<HTMLInputElement>('[data-role="name-input"]');
    const namePencil = this.overlay.querySelector<HTMLButtonElement>('[data-role="name-pencil"]');
    const nameSave = this.overlay.querySelector<HTMLButtonElement>('[data-role="name-save"]');
    const genderMale = this.overlay.querySelector<HTMLButtonElement>('[data-role="gender-male"]');
    const genderFemale = this.overlay.querySelector<HTMLButtonElement>('[data-role="gender-female"]');
    const hpValue = this.overlay.querySelector<HTMLElement>(".inv-hp-value");
    const hpFill = this.overlay.querySelector<HTMLElement>(".inv-hp-fill");
    const statDamage = this.overlay.querySelector<HTMLElement>(".inv-stat-damage");
    const statArmor = this.overlay.querySelector<HTMLElement>(".inv-stat-armor");
    const statSpeed = this.overlay.querySelector<HTMLElement>(".inv-stat-speed");
    const statAps = this.overlay.querySelector<HTMLElement>(".inv-stat-aps");
    const backpackSectionLabel = this.overlay.querySelector<HTMLElement>('[data-role="backpack-section-label"]');
    const backpackSectionMeta = this.overlay.querySelector<HTMLElement>('[data-role="backpack-section-meta"]');
    if (
      !grid || !armorColumn || !backpackFuture || !closeButton || !selectionName || !selectionStats ||
      !actionButton || !splitButton || !stripUse || !stripSplit || !stripDelete ||
      !weaponSlotButton || !backpackShell || !quick0 || !quick1 || !canvas ||
      !charTitle || !nameView || !nameEditRow || !nameInput || !namePencil || !nameSave ||
      !genderMale || !genderFemale ||
      !hpValue || !hpFill || !statDamage || !statArmor || !statSpeed || !statAps ||
      !backpackSectionLabel || !backpackSectionMeta
    ) {
      throw new Error("Inventory UI failed to mount");
    }
    grid.style.setProperty("--inventory-columns", String(INVENTORY_CONFIG.columns));
    this.closeButton = closeButton;
    this.selectionName = selectionName;
    this.selectionStats = selectionStats;
    this.actionButton = actionButton;
    this.splitButton = splitButton;
    this.stripUse = stripUse;
    this.stripSplit = stripSplit;
    this.stripDelete = stripDelete;
    this.weaponSlotButton = weaponSlotButton;
    this.backpackShell = backpackShell;
    this.quickSlotButtons = Object.freeze([quick0, quick1]) as readonly [HTMLButtonElement, HTMLButtonElement];
    this.backpackSectionLabel = backpackSectionLabel;
    this.backpackSectionMeta = backpackSectionMeta;
    this.charTitle = charTitle;
    this.nameView = nameView;
    this.nameEditRow = nameEditRow;
    this.nameInput = nameInput;
    this.namePencil = namePencil;
    this.nameSave = nameSave;
    this.genderMale = genderMale;
    this.genderFemale = genderFemale;
    this.hpValue = hpValue;
    this.hpFill = hpFill;
    this.statDamage = statDamage;
    this.statArmor = statArmor;
    this.statSpeed = statSpeed;
    this.statAps = statAps;
    this.preview = new InventoryCharacterPreview(canvas);
    this.syncCharacterIdentityUi();
    CHARACTER_PROFILE.onChange(() => {
      this.syncCharacterIdentityUi();
      if (this.openState) this.preview.applyIdentityPresentation();
    });
    this.bindNameEditing();
    this.bindGenderToggle();
    this.pocketSlots = Object.freeze(Array.from({ length: INVENTORY_CONFIG.baseSlotCount }, (_, index) => {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "inventory-slot";
      slot.dataset.drop = "inventory";
      slot.dataset.slotIndex = String(index);
      slot.dataset.pocketIndex = String(index);
      slot.setAttribute("aria-label", "Empty inventory slot");
      slot.addEventListener("pointerdown", (event) => { this.beginDrag(event, { kind: "inventory", index }); });
      slot.addEventListener("click", (event) => {
        if (this.consumeSuppressedClick(event)) return;
        this.selectInventory(index);
      });
      grid.append(slot);
      return slot;
    }));

    this.backpackStorageButtons = Object.freeze(Array.from({ length: BACKPACK_STORAGE_UI_COUNT }, (_, local) => {
      const index = INVENTORY_CONFIG.baseSlotCount + local;
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "inventory-slot inv-backpack-slot inv-future-slot";
      slot.dataset.slotIndex = String(index);
      slot.disabled = true;
      slot.setAttribute("aria-label", "Backpack storage locked");
      slot.title = "Basic Backpack required";
      slot.addEventListener("pointerdown", (event) => {
        if (slot.disabled) return;
        this.beginDrag(event, { kind: "inventory", index });
      });
      slot.addEventListener("click", (event) => {
        if (this.consumeSuppressedClick(event)) return;
        if (slot.disabled) return;
        this.selectInventory(index);
      });
      backpackFuture.append(slot);
      return slot;
    }));

    const equipmentSlots = {} as Record<EquipmentSlotId, HTMLButtonElement>;
    for (const slotId of EQUIPMENT_SLOT_IDS) {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "equipment-slot inv-eq-slot";
      slot.dataset.drop = "equipment";
      slot.dataset.equipmentSlot = slotId;
      slot.innerHTML = `<span class="inv-eq-glyph" data-role="empty-sil">${ARMOR_SILHOUETTES[slotId]}</span><span class="equipment-slot-content"></span>`;
      slot.addEventListener("pointerdown", (event) => { this.beginDrag(event, { kind: "equipment", slot: slotId }); });
      slot.addEventListener("click", (event) => {
        if (this.consumeSuppressedClick(event)) return;
        // Re-click selected worn armor → unequip into pockets (discoverable remove).
        if (
          this.selected?.source === "equipment"
          && this.selected.slot === slotId
          && this.equipment.getSlot(slotId).stack
        ) {
          this.unequipArmorSlot(slotId, this.selected.stack);
          return;
        }
        this.selectEquipment(slotId);
      });
      slot.addEventListener("dblclick", (event) => {
        event.preventDefault();
        if (this.consumeSuppressedClick(event)) return;
        const stack = this.equipment.getSlot(slotId).stack;
        if (stack) this.unequipArmorSlot(slotId, stack);
      });
      armorColumn.append(slot);
      equipmentSlots[slotId] = slot;
    }
    this.equipmentSlots = Object.freeze(equipmentSlots);

    this.weaponSlotButton.addEventListener("pointerdown", (event) => { this.beginDrag(event, { kind: "weapon" }); });
    this.weaponSlotButton.addEventListener("click", (event) => {
      if (this.consumeSuppressedClick(event)) return;
      if (this.selected?.source === "weapon" && this.weaponSlot.current) {
        this.performSelectedAction();
        return;
      }
      this.selectWeapon();
    });
    this.weaponSlotButton.addEventListener("dblclick", (event) => {
      event.preventDefault();
      if (this.consumeSuppressedClick(event)) return;
      const stack = this.weaponSlot.current;
      if (!stack) return;
      this.selected = Object.freeze({ source: "weapon", stack });
      this.performSelectedAction();
    });
    this.backpackShell.addEventListener("pointerdown", (event) => { this.beginDrag(event, { kind: "backpack" }); });
    this.backpackShell.addEventListener("click", (event) => {
      if (this.consumeSuppressedClick(event)) return;
      if (this.selected?.source === "backpack" && this.backpackSlot.current) {
        this.performSelectedAction();
        return;
      }
      this.selectBackpack();
    });
    this.backpackShell.addEventListener("dblclick", (event) => {
      event.preventDefault();
      if (this.consumeSuppressedClick(event)) return;
      const stack = this.backpackSlot.current;
      if (!stack) return;
      this.selected = Object.freeze({ source: "backpack", stack });
      this.performSelectedAction();
    });

    for (const index of [0, 1] as const) {
      const button = this.quickSlotButtons[index];
      button.addEventListener("pointerdown", (event) => { this.beginDrag(event, { kind: "quick", index }); });
      button.addEventListener("click", (event) => {
        if (this.consumeSuppressedClick(event)) return;
        if (this.selected?.source === "quick" && this.selected.index === index && this.quickSlots[index].current) {
          this.performSelectedAction();
          return;
        }
        this.selectQuick(index);
      });
      button.addEventListener("dblclick", (event) => {
        event.preventDefault();
        if (this.consumeSuppressedClick(event)) return;
        const stack = this.quickSlots[index].current;
        if (!stack) return;
        this.selected = Object.freeze({ source: "quick", index, stack });
        this.performSelectedAction();
      });
    }

    this.syncBackpackStorageUi();
    this.renderSlots(Array.from({ length: this.inventory.slotCount }, (_, index) => index));
    this.renderEquipment();
    this.renderWeapon();
    this.renderBackpackEquip();
    this.renderQuickSlots();
    this.renderStats(4.5);
    this.syncPreview();

    inventory.subscribe((result) => {
      this.renderSlots(result.changedSlotIndexes);
      this.validateSelection();
    });
    inventory.subscribeCapacity(() => {
      this.syncBackpackStorageUi();
      this.renderSlots(Array.from({ length: this.inventory.slotCount }, (_, index) => index));
      this.validateSelection();
    });
    equipment.subscribe(() => {
      this.renderEquipment();
      this.renderStats();
      this.syncPreview();
      this.validateSelection();
    });
    weaponSlot.subscribe(() => {
      this.renderWeapon();
      this.renderStats();
      this.syncPreview();
      this.validateSelection();
    });
    backpackSlot.subscribe(() => {
      this.renderBackpackEquip();
      this.syncBackpackStorageUi();
      this.syncPreview();
      this.validateSelection();
    });
    for (const quick of quickSlots) {
      quick.subscribe(() => {
        this.renderQuickSlots();
        this.validateSelection();
      });
    }
    I18N.onChange(() => {
      this.applyLocaleChrome();
      this.syncBackpackStorageUi();
      this.renderSlots(Array.from({ length: this.inventory.slotCount }, (_, index) => index));
      this.renderEquipment();
      this.renderWeapon();
      this.renderBackpackEquip();
      this.renderQuickSlots();
      this.renderSelection();
      this.renderStats();
    });
    toggleButton.addEventListener("click", this.toggle);
    closeButton.addEventListener("click", this.close);
    actionButton.addEventListener("click", this.performSelectedAction);
    splitButton.addEventListener("click", this.performSplitSelected);
    stripUse.addEventListener("click", this.performStripUse);
    stripSplit.addEventListener("click", this.performSplitSelected);
    stripDelete.addEventListener("click", this.performStripDelete);
    this.overlay.addEventListener("pointerdown", this.onBackdropPointerDown);
    this.overlay.addEventListener("pointerover", this.onItemTooltipOver);
    this.overlay.addEventListener("pointerout", this.onItemTooltipOut);
    this.overlay.addEventListener("pointermove", this.onItemTooltipMove);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
    window.addEventListener("resize", this.onWindowResize);
  }

  get isOpen(): boolean { return this.openState; }

  /** True when backpack equipment slot is gameplay-interactive (always true in M18). */
  get backpackGameplayInteractive(): boolean {
    return !this.backpackShell.disabled;
  }

  setItemActionHandlers(handlers: {
    use?: (slotIndex: number, stack: ItemStack) => boolean;
    quickAssign?: (slotIndex: number, stack: ItemStack) => boolean;
    delete?: (slotIndex: number, stack: ItemStack) => boolean;
  }): void {
    this.onUseItem = handlers.use ?? null;
    this.onQuickAssign = handlers.quickAssign ?? null;
    this.onDeleteItem = handlers.delete ?? null;
  }

  get utilityGameplayInteractive(): boolean {
    // Legacy alias: both quick slots are always interactive.
    return true;
  }

  get quickBarInteractive(): boolean {
    return this.quickSlotButtons.every((btn) => !btn.disabled);
  }

  get pocketSlotCount(): number { return this.pocketSlots.length; }

  /** Visible BACKPACK storage cells (locked or active). M18 = 5 for Basic Backpack. */
  get futureBackpackShellCount(): number { return this.backpackStorageButtons.length; }

  /** Active backpack storage slot count in the UI domain. */
  get activeBackpackStorageSlotCount(): number {
    return Math.max(0, this.inventory.slotCount - INVENTORY_CONFIG.baseSlotCount);
  }

  toggle = (): void => { this.setOpen(!this.openState); };
  open = (): void => { this.setOpen(true); };
  close = (): void => { this.setOpen(false); };

  /** Live health / speed / freeze while panel open — production HealthPool + config only. */
  updateLiveFrame(frame: InventoryLiveFrame): void {
    if (!this.openState) return;
    this.preview.setMotionFrozen(frame.motionFrozen);
    this.setHealthDisplay(frame.currentHealth, frame.maxHealth);
    this.statSpeed.textContent = formatStat(frame.moveSpeed, 1);
    const profile = resolvePlayerMeleeProfile(this.weaponSlot);
    this.statDamage.textContent = String(profile.damage);
    this.statAps.textContent = formatStat(profile.attacksPerSecond, 1);
    this.statArmor.textContent = String(this.equipment.totalArmor);
  }

  handleInventoryFull(): void {
    this.showStatus(I18N.t("inv.full"));
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
    this.applyLocaleChrome();
    this.overlay.classList.toggle("open", open);
    this.overlay.setAttribute("aria-hidden", String(!open));
    this.toggleButton.classList.toggle("active", open);
    this.toggleButton.setAttribute("aria-expanded", String(open));
    if (!open) {
      this.cancelNameEdit();
      this.clearSelection();
      this.cancelDrag();
      this.hideItemTooltip();
      this.preview.setActive(false);
    } else {
      // Always re-read domain on open — bulk restore/clear may have run while closed
      // with an empty changedSlotIndexes list (or before panel existed after page reload).
      this.syncBackpackStorageUi();
      this.renderSlots(Array.from({ length: this.inventory.slotCount }, (_, index) => index));
      this.renderEquipment();
      this.renderWeapon();
      this.renderBackpackEquip();
      this.renderQuickSlots();
      this.renderSelection();
      this.renderStats();
      this.syncPreview();
      this.preview.setActive(true);
      requestAnimationFrame(() => { this.preview.resize(); });
    }
    this.onVisibilityChange(open);
    if (open) this.closeButton.focus({ preventScroll: true });
    else this.toggleButton.focus({ preventScroll: true });
  }

  private readonly onWindowResize = (): void => {
    if (this.openState) this.preview.resize();
  };

  private syncPreview(): void {
    this.preview.syncEquipment(this.equipment);
    const weapon = this.weaponSlot.current;
    this.preview.setHeldWeapon(weapon ? toHeldWeaponVisualId(weapon.itemId) : null);
    this.preview.setEquippedBackpack(this.backpackSlot.current?.itemId ?? null);
    this.preview.applyIdentityPresentation();
  }

  private syncCharacterIdentityUi(): void {
    if (!this.nameEditing) {
      this.charTitle.textContent = CHARACTER_PROFILE.name;
    }
    const gender = CHARACTER_PROFILE.gender;
    this.genderMale.classList.toggle("active", gender === "male");
    this.genderFemale.classList.toggle("active", gender === "female");
    this.genderMale.setAttribute("aria-pressed", String(gender === "male"));
    this.genderFemale.setAttribute("aria-pressed", String(gender === "female"));
  }

  private bindNameEditing(): void {
    this.namePencil.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.beginNameEdit();
    });
    this.nameSave.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.commitNameEdit();
    });
    this.nameInput.addEventListener("input", () => { this.syncNameSaveVisibility(); });
    this.nameInput.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.code === "Enter") {
        e.preventDefault();
        this.commitNameEdit();
      } else if (e.code === "Escape") {
        e.preventDefault();
        this.cancelNameEdit();
      }
    });
    this.nameInput.addEventListener("keyup", (e) => { e.stopPropagation(); });
    this.nameInput.addEventListener("keypress", (e) => { e.stopPropagation(); });
  }

  private beginNameEdit(): void {
    this.nameEditing = true;
    this.nameView.hidden = true;
    this.nameEditRow.hidden = false;
    this.nameInput.value = CHARACTER_PROFILE.name;
    this.syncNameSaveVisibility();
    requestAnimationFrame(() => {
      this.nameInput.focus({ preventScroll: true });
      this.nameInput.select();
    });
  }

  private cancelNameEdit(): void {
    this.nameEditing = false;
    this.nameEditRow.hidden = true;
    this.nameView.hidden = false;
    this.nameSave.hidden = true;
    this.charTitle.textContent = CHARACTER_PROFILE.name;
  }

  private commitNameEdit(): void {
    if (!this.nameEditing) return;
    CHARACTER_PROFILE.setName(this.nameInput.value);
    this.cancelNameEdit();
  }

  private syncNameSaveVisibility(): void {
    const draft = this.nameInput.value.trim();
    const dirty = draft.length > 0 && draft !== CHARACTER_PROFILE.name;
    this.nameSave.hidden = !dirty;
  }

  private bindGenderToggle(): void {
    const pick = (gender: CharacterGender): void => {
      CHARACTER_PROFILE.setGender(gender);
    };
    this.genderMale.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      pick("male");
    });
    this.genderFemale.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      pick("female");
    });
  }

  private setHealthDisplay(current: number, max: number): void {
    const safeMax = Math.max(1, Math.round(max));
    const safeCurrent = Math.max(0, Math.min(safeMax, Math.round(current)));
    const key = `${safeCurrent}/${safeMax}`;
    if (key === this.lastHpKey) return;
    this.lastHpKey = key;
    this.hpValue.textContent = `${safeCurrent} / ${safeMax}`;
    const pct = (safeCurrent / safeMax) * 100;
    this.hpFill.style.width = `${pct}%`;
    const track = this.hpFill.parentElement;
    track?.setAttribute("aria-valuenow", String(safeCurrent));
    track?.setAttribute("aria-valuemax", String(safeMax));
  }

  private renderStats(overrideSpeed?: number): void {
    const profile = resolvePlayerMeleeProfile(this.weaponSlot);
    this.statDamage.textContent = String(profile.damage);
    this.statArmor.textContent = String(this.equipment.totalArmor);
    this.statAps.textContent = formatStat(profile.attacksPerSecond, 1);
    if (overrideSpeed !== undefined) this.statSpeed.textContent = formatStat(overrideSpeed, 1);
  }

  private inventoryButton(index: number): HTMLButtonElement | null {
    if (index >= 0 && index < INVENTORY_CONFIG.baseSlotCount) return this.pocketSlots[index] ?? null;
    const local = index - INVENTORY_CONFIG.baseSlotCount;
    if (local >= 0 && local < this.backpackStorageButtons.length) return this.backpackStorageButtons[local] ?? null;
    return null;
  }

  private syncBackpackStorageUi(): void {
    const activeExtra = this.inventory.extraSlots;
    const unlocked = activeExtra > 0;
    const packName = this.backpackSlot.current
      ? itemName(ITEM_REGISTRY.get(this.backpackSlot.current.itemId))
      : null;
    this.backpackSectionLabel.classList.toggle("muted", !unlocked);
    this.backpackSectionMeta.textContent = unlocked
      ? `+${activeExtra}${packName ? ` · ${packName}` : ""}`
      : "LOCKED";
    // Only paint as many cells as the equipped backpack grants; when locked, show a small locked preview.
    const showCount = unlocked ? activeExtra : Math.min(5, this.backpackStorageButtons.length);
    for (let local = 0; local < this.backpackStorageButtons.length; local += 1) {
      const index = INVENTORY_CONFIG.baseSlotCount + local;
      const button = this.backpackStorageButtons[local];
      const visible = local < showCount;
      const active = unlocked && local < activeExtra;
      button.hidden = !visible;
      button.disabled = !active;
      button.classList.toggle("inv-future-slot", !active);
      button.classList.toggle("inv-backpack-locked", !active);
      if (active) {
        button.dataset.drop = "inventory";
        button.removeAttribute("title");
        button.setAttribute("aria-hidden", "false");
        button.setAttribute("aria-label", `Backpack storage ${local + 1}`);
      } else if (visible) {
        delete button.dataset.drop;
        button.title = unlocked ? "Locked slot" : "Equip a backpack to unlock storage";
        button.setAttribute(
          "aria-label",
          unlocked ? "Backpack storage locked" : "Backpack storage locked — equip a backpack",
        );
        button.setAttribute("aria-hidden", "true");
        button.classList.remove("occupied", "selected");
        button.replaceChildren();
      }
      void index;
    }
    if (unlocked) {
      this.renderSlots(Array.from({ length: activeExtra }, (_, i) => INVENTORY_CONFIG.baseSlotCount + i));
    }
  }

  private renderSlots(indexes: readonly number[]): void {
    for (const index of indexes) {
      if (index < 0 || index >= this.inventory.slotCount) continue;
      const element = this.inventoryButton(index);
      if (!element || element.disabled) continue;
      const slot = this.inventory.getSlot(index);
      element.classList.toggle("occupied", slot.stack !== null);
      element.classList.toggle("selected", this.selected?.source === "inventory" && this.selected.index === index);
      if (!slot.stack) {
        element.replaceChildren();
        element.setAttribute("aria-label", index < INVENTORY_CONFIG.baseSlotCount ? "Empty inventory slot" : "Empty backpack slot");
        clearItemTooltip(element);
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
          ? `${itemName(definition)}, quantity ${slot.stack.quantity}, durability ${durability.current} of ${durability.max}`
          : `${itemName(definition)}, quantity ${slot.stack.quantity}`,
      );
      setItemTooltip(element, itemName(definition));
    }
  }

  private renderEquipment(): void {
    for (const slot of this.equipment.getSlots()) {
      const element = this.equipmentSlots[slot.id];
      const content = element.querySelector<HTMLElement>(".equipment-slot-content");
      const empty = element.querySelector<HTMLElement>('[data-role="empty-sil"]');
      if (!content) continue;
      element.classList.toggle("occupied", slot.stack !== null);
      element.classList.toggle("selected", this.selected?.source === "equipment" && this.selected.slot === slot.id);
      if (!slot.stack) {
        content.replaceChildren();
        empty?.classList.remove("hidden");
        element.setAttribute("aria-label", `${slotLabel(slot.id)} armor slot, empty`);
        clearItemTooltip(element);
        continue;
      }
      empty?.classList.add("hidden");
      const definition = ITEM_REGISTRY.get(slot.stack.itemId);
      content.innerHTML = `<span class="inventory-item-icon">${ITEM_ICONS[definition.iconId]}</span>`;
      element.setAttribute("aria-label", `${slotLabel(slot.id)}: ${itemName(definition)}`);
      const armor = definition.equipment?.armor ?? 0;
      setItemTooltip(element, armor > 0 ? `${itemName(definition)} · Armor +${armor}` : itemName(definition));
    }
  }

  private renderWeapon(): void {
    const stack = this.weaponSlot.current;
    const content = this.weaponSlotButton.querySelector<HTMLElement>(".equipment-slot-content");
    const empty = this.weaponSlotButton.querySelector<HTMLElement>('[data-role="weapon-empty"]');
    if (!content) return;
    this.weaponSlotButton.classList.toggle("occupied", stack !== null);
    this.weaponSlotButton.classList.toggle("selected", this.selected?.source === "weapon");
    if (!stack) {
      content.replaceChildren();
      empty?.classList.remove("hidden");
      this.weaponSlotButton.setAttribute("aria-label", "Weapon slot, empty");
      clearItemTooltip(this.weaponSlotButton);
      return;
    }
    empty?.classList.add("hidden");
    const definition = ITEM_REGISTRY.get(stack.itemId);
    const durability = stackDurability(stack);
    const durabilityBar = durability
      ? `<i class="inventory-durability" style="--durability:${(durability.current / durability.max).toFixed(4)}" aria-hidden="true"></i>`
      : "";
    content.innerHTML = `<span class="inventory-item-icon">${ITEM_ICONS[definition.iconId]}</span>${durabilityBar}`;
    this.weaponSlotButton.setAttribute(
      "aria-label",
      durability
        ? `Weapon: ${itemName(definition)}, durability ${durability.current} of ${durability.max}`
        : `Weapon: ${itemName(definition)}`,
    );
    setItemTooltip(this.weaponSlotButton, itemName(definition));
  }

  private renderBackpackEquip(): void {
    const stack = this.backpackSlot.current;
    const content = this.backpackShell.querySelector<HTMLElement>(".equipment-slot-content");
    const empty = this.backpackShell.querySelector<HTMLElement>('[data-role="backpack-empty"]');
    if (!content) return;
    this.backpackShell.classList.toggle("occupied", stack !== null);
    this.backpackShell.classList.toggle("selected", this.selected?.source === "backpack");
    if (!stack) {
      content.replaceChildren();
      empty?.classList.remove("hidden");
      this.backpackShell.setAttribute("aria-label", "Backpack slot, empty");
      clearItemTooltip(this.backpackShell);
      return;
    }
    empty?.classList.add("hidden");
    const definition = ITEM_REGISTRY.get(stack.itemId);
    content.innerHTML = `<span class="inventory-item-icon">${ITEM_ICONS[definition.iconId]}</span>`;
    this.backpackShell.setAttribute("aria-label", `Backpack: ${itemName(definition)}`);
    setItemTooltip(this.backpackShell, itemName(definition));
  }

  private renderQuickSlots(): void {
    for (const index of [0, 1] as const) {
      const button = this.quickSlotButtons[index];
      const stack = this.quickSlots[index].current;
      const content = button.querySelector<HTMLElement>(".equipment-slot-content");
      const empty = button.querySelector<HTMLElement>('[data-role="quick-empty"]');
      if (!content) continue;
      button.classList.toggle("occupied", stack !== null);
      button.classList.toggle("selected", this.selected?.source === "quick" && this.selected.index === index);
      const label = index === 0 ? "Quick slot 1" : "Quick slot 2";
      if (!stack) {
        content.replaceChildren();
        empty?.classList.remove("hidden");
        button.setAttribute("aria-label", `${label}, empty`);
        clearItemTooltip(button);
        continue;
      }
      empty?.classList.add("hidden");
      const definition = ITEM_REGISTRY.get(stack.itemId);
      content.innerHTML = `<span class="inventory-item-icon">${ITEM_ICONS[definition.iconId]}</span><b class="inventory-quantity">${stack.quantity}</b>`;
      button.setAttribute("aria-label", `${label}: ${itemName(definition)} ×${stack.quantity}`);
      setItemTooltip(button, itemName(definition));
    }
  }

  private beginDrag(event: PointerEvent, origin: DragOrigin): void {
    if (event.button !== 0 || !this.openState) return;
    const stack = this.readOriginStack(origin);
    if (!stack) return;
    if (event.target instanceof HTMLElement && event.target.closest(".inventory-close, .inventory-action, .inv-shell-btn")) return;
    this.hideItemTooltip();
    this.drag = {
      origin,
      stack,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      ghost: null,
      over: null,
    };
    try { (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); } catch { /* ignore */ }
  }

  private consumeSuppressedClick(event: Event): boolean {
    if (!this.suppressClick) return false;
    this.suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.active) {
      if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;
      drag.active = true;
      const definition = ITEM_REGISTRY.get(drag.stack.itemId);
      const ghost = document.createElement("div");
      ghost.className = "inventory-drag-ghost";
      ghost.innerHTML = `<span class="inventory-item-icon">${ITEM_ICONS[definition.iconId]}</span>`;
      document.body.append(ghost);
      drag.ghost = ghost;
      this.overlay.classList.add("is-dragging");
      this.markOriginDragging(true);
    }
    if (drag.ghost) {
      drag.ghost.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
    }
    const target = this.dropTargetFromPoint(event.clientX, event.clientY);
    const element = this.elementForDrop(target);
    if (drag.over !== element) {
      drag.over?.classList.remove("drag-over", "drag-over-invalid");
      drag.over = element;
      if (element && target) {
        const valid = this.canDrop(drag.origin, drag.stack, target);
        element.classList.add(valid ? "drag-over" : "drag-over-invalid");
      }
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const wasActive = drag.active;
    const target = wasActive ? this.dropTargetFromPoint(event.clientX, event.clientY) : null;
    if (wasActive) {
      this.suppressClick = true;
      if (target) this.applyDrop(drag.origin, drag.stack, target);
    }
    this.cancelDrag();
  };

  private cancelDrag(): void {
    const drag = this.drag;
    if (!drag) return;
    drag.ghost?.remove();
    drag.over?.classList.remove("drag-over", "drag-over-invalid");
    this.markOriginDragging(false);
    this.overlay.classList.remove("is-dragging");
    this.drag = null;
  }

  private markOriginDragging(active: boolean): void {
    const drag = this.drag;
    if (!drag) return;
    const element = this.elementForOrigin(drag.origin);
    element?.classList.toggle("dragging-source", active);
  }

  private readOriginStack(origin: DragOrigin): ItemStack | null {
    if (origin.kind === "inventory") return this.inventory.getSlot(origin.index).stack;
    if (origin.kind === "equipment") return this.equipment.getSlot(origin.slot).stack;
    if (origin.kind === "backpack") return this.backpackSlot.current;
    if (origin.kind === "quick") return this.quickSlots[origin.index].current;
    return this.weaponSlot.current;
  }

  private elementForOrigin(origin: DragOrigin): HTMLElement | null {
    if (origin.kind === "inventory") return this.inventoryButton(origin.index);
    if (origin.kind === "equipment") return this.equipmentSlots[origin.slot];
    if (origin.kind === "backpack") return this.backpackShell;
    if (origin.kind === "quick") return this.quickSlotButtons[origin.index];
    return this.weaponSlotButton;
  }

  private elementForDrop(target: DropTarget | null): HTMLElement | null {
    if (!target) return null;
    if (target.kind === "inventory") return this.inventoryButton(target.index);
    if (target.kind === "equipment") return this.equipmentSlots[target.slot];
    if (target.kind === "backpack") return this.backpackShell;
    if (target.kind === "quick") return this.quickSlotButtons[target.index];
    return this.weaponSlotButton;
  }

  private dropTargetFromPoint(x: number, y: number): DropTarget | null {
    const el = document.elementFromPoint(x, y);
    if (!(el instanceof Element)) return null;
    const dropEl = el.closest<HTMLElement>("[data-drop]");
    if (!dropEl || !this.overlay.contains(dropEl)) return null;
    const kind = dropEl.dataset.drop;
    if (kind === "inventory") {
      const index = Number(dropEl.dataset.slotIndex);
      if (!Number.isInteger(index) || index < 0 || index >= this.inventory.slotCount) return null;
      return { kind: "inventory", index };
    }
    if (kind === "equipment") {
      const slot = dropEl.dataset.equipmentSlot as EquipmentSlotId | undefined;
      if (!slot || !EQUIPMENT_SLOT_IDS.includes(slot)) return null;
      return { kind: "equipment", slot };
    }
    if (kind === "weapon") return { kind: "weapon" };
    if (kind === "backpack") return { kind: "backpack" };
    if (kind === "quick") {
      const q = Number(dropEl.dataset.quickIndex);
      if (q !== 0 && q !== 1) return null;
      return { kind: "quick", index: q };
    }
    return null;
  }

  private canDrop(origin: DragOrigin, stack: ItemStack, target: DropTarget): boolean {
    if (origin.kind === "inventory" && target.kind === "inventory") {
      return origin.index !== target.index;
    }
    if (origin.kind === "inventory" && target.kind === "equipment") {
      return ITEM_REGISTRY.get(stack.itemId).equipment?.slot === target.slot;
    }
    if (origin.kind === "inventory" && target.kind === "weapon") {
      return isWeaponCapableItemId(stack.itemId) && !!ITEM_REGISTRY.get(stack.itemId).meleeCombat;
    }
    if (origin.kind === "inventory" && target.kind === "backpack") {
      return isBackpackCapableItemId(stack.itemId) && !!ITEM_REGISTRY.get(stack.itemId).backpack
        && this.inventory.isBasePocketIndex(origin.index);
    }
    if (origin.kind === "inventory" && target.kind === "quick") {
      return PlayerQuickSlot.isCompatible(stack.itemId);
    }
    if (origin.kind === "equipment" && target.kind === "inventory") {
      const dest = this.inventory.getSlot(target.index).stack;
      return !dest || ITEM_REGISTRY.get(dest.itemId).equipment?.slot === origin.slot;
    }
    if (origin.kind === "weapon" && target.kind === "inventory") {
      const dest = this.inventory.getSlot(target.index).stack;
      return !dest || (isWeaponCapableItemId(dest.itemId) && !!ITEM_REGISTRY.get(dest.itemId).meleeCombat);
    }
    if (origin.kind === "backpack" && target.kind === "inventory") {
      const dest = this.inventory.getSlot(target.index).stack;
      return this.inventory.isBasePocketIndex(target.index)
        && (!dest || (isBackpackCapableItemId(dest.itemId) && !!ITEM_REGISTRY.get(dest.itemId).backpack));
    }
    if (origin.kind === "quick" && target.kind === "inventory") {
      return true;
    }
    if (origin.kind === "quick" && target.kind === "quick") {
      return origin.index !== target.index;
    }
    if (origin.kind === "equipment" && target.kind === "equipment") {
      return origin.slot === target.slot;
    }
    if (origin.kind === "weapon" && target.kind === "weapon") return true;
    if (origin.kind === "backpack" && target.kind === "backpack") return true;
    return false;
  }

  private applyDrop(origin: DragOrigin, stack: ItemStack, target: DropTarget): void {
    if (origin.kind === "inventory" && target.kind === "inventory") {
      if (origin.index === target.index) return;
      const live = this.inventory.getSlot(origin.index).stack;
      if (live !== stack) return;
      this.inventory.rearrangeSlots(origin.index, target.index);
      this.clearSelection();
      return;
    }

    if (origin.kind === "inventory" && target.kind === "weapon") {
      if (!isWeaponCapableItemId(stack.itemId) || !ITEM_REGISTRY.get(stack.itemId).meleeCombat) {
        this.showStatus("Not a weapon");
        return;
      }
      const result = this.weaponEquipSystem.equipFromInventory(origin.index, stack);
      if (result.accepted) this.clearSelection();
      else if (result.reason === "not-weapon") this.showStatus("Not a weapon");
      return;
    }

    if (origin.kind === "inventory" && target.kind === "backpack") {
      if (!isBackpackCapableItemId(stack.itemId) || !ITEM_REGISTRY.get(stack.itemId).backpack) {
        this.showStatus("Not a backpack");
        return;
      }
      const result = this.backpackEquipSystem.equipFromInventory(origin.index, stack);
      if (result.accepted) this.clearSelection();
      else this.reportBackpackFailure(result.reason);
      return;
    }

    if (origin.kind === "inventory" && target.kind === "quick") {
      if (!PlayerQuickSlot.isCompatible(stack.itemId)) {
        this.showStatus("Can't put that item here");
        return;
      }
      const result = this.quickSystems[target.index].assignFromInventory(origin.index, stack);
      if (result.accepted) {
        this.clearSelection();
      } else if (result.reason === "inventory-full") this.handleInventoryFull();
      else this.showStatus("Quick slot rejected");
      return;
    }

    if (origin.kind === "inventory" && target.kind === "equipment") {
      const armorSlot = ITEM_REGISTRY.get(stack.itemId).equipment?.slot;
      if (armorSlot !== target.slot) {
        this.showStatus(`Needs ${slotLabel(target.slot)} slot`);
        return;
      }
      const result = this.equipmentSystem.equipFromInventory(origin.index, stack);
      if (result.accepted) this.clearSelection();
      else if (result.reason === "not-equipment") this.showStatus("Not armor");
      return;
    }

    if (origin.kind === "weapon" && target.kind === "inventory") {
      const result = this.weaponEquipSystem.unequipToInventorySlot(target.index, stack);
      if (result.accepted) this.clearSelection();
      else if (result.reason === "inventory-full") this.handleInventoryFull();
      else if (result.reason === "not-weapon") this.showStatus("Can't swap with that item");
      return;
    }

    if (origin.kind === "backpack" && target.kind === "inventory") {
      const result = this.backpackEquipSystem.unequipToInventorySlot(target.index, stack);
      if (result.accepted) this.clearSelection();
      else this.reportBackpackFailure(result.reason);
      return;
    }

    if (origin.kind === "quick" && target.kind === "inventory") {
      const result = this.quickSystems[origin.index].clearToInventory(stack);
      if (result.accepted) this.clearSelection();
      else if (result.reason === "inventory-full") this.handleInventoryFull();
      return;
    }

    if (origin.kind === "quick" && target.kind === "quick" && origin.index !== target.index) {
      // Swap the two quick bar stacks in place.
      const a = this.quickSlots[origin.index];
      const b = this.quickSlots[target.index];
      const aStack = a.current;
      const bStack = b.current;
      if (aStack !== stack) return;
      if (aStack) a.clearIfAccepted(aStack, () => true);
      if (bStack) b.clearIfAccepted(bStack, () => true);
      if (bStack) a.assignIfAccepted(bStack, () => true);
      if (aStack) b.assignIfAccepted(aStack, () => true);
      this.clearSelection();
      return;
    }

    if (origin.kind === "equipment" && target.kind === "inventory") {
      const result = this.equipmentSystem.unequipToInventorySlot(origin.slot, target.index, stack);
      if (result.accepted) this.clearSelection();
      else if (result.reason === "inventory-full") this.handleInventoryFull();
      else if (result.reason === "not-equipment") this.showStatus("Can't swap with that item");
      return;
    }
  }

  private reportBackpackFailure(reason: string | null): void {
    if (reason === "backpack-not-empty") this.showStatus("EMPTY BACKPACK FIRST");
    else if (reason === "inventory-full") this.handleInventoryFull();
    else if (reason === "source-in-backpack-storage") this.showStatus("Equip from pockets");
    else if (reason === "not-backpack") this.showStatus("Not a backpack");
  }

  private selectInventory(index: number): void {
    if (index < 0 || index >= this.inventory.slotCount) { this.clearSelection(); return; }
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

  private selectQuick(index: 0 | 1): void {
    const stack = this.quickSlots[index].current;
    if (!stack) { this.clearSelection(); return; }
    this.selected = Object.freeze({ source: "quick", index, stack });
    this.renderSelection();
  }

  /** Unequip worn armor into free inventory space. */
  private unequipArmorSlot(slot: EquipmentSlotId, expected: ItemStack): void {
    const result = this.equipmentSystem.unequipToInventory(slot, expected);
    if (result.accepted || result.reason === "stale-source" || result.reason === "empty-source") {
      this.clearSelection();
      return;
    }
    if (result.reason === "inventory-full") this.handleInventoryFull();
    else this.showStatus("Can't unequip");
  }

  private selectWeapon(): void {
    const stack = this.weaponSlot.current;
    if (!stack) { this.clearSelection(); return; }
    this.selected = Object.freeze({ source: "weapon", stack });
    this.renderSelection();
  }

  private selectBackpack(): void {
    const stack = this.backpackSlot.current;
    if (!stack) { this.clearSelection(); return; }
    this.selected = Object.freeze({ source: "backpack", stack });
    this.renderSelection();
  }

  private renderSelection(): void {
    for (let index = 0; index < this.inventory.slotCount; index += 1) {
      const slot = this.inventoryButton(index);
      slot?.classList.toggle("selected", this.selected?.source === "inventory" && this.selected.index === index);
    }
    for (const slotId of EQUIPMENT_SLOT_IDS) {
      this.equipmentSlots[slotId].classList.toggle("selected", this.selected?.source === "equipment" && this.selected.slot === slotId);
    }
    this.weaponSlotButton.classList.toggle("selected", this.selected?.source === "weapon");
    this.backpackShell.classList.toggle("selected", this.selected?.source === "backpack");
    for (const index of [0, 1] as const) {
      this.quickSlotButtons[index].classList.toggle(
        "selected",
        this.selected?.source === "quick" && this.selected.index === index,
      );
    }
    if (!this.selected) {
      this.selectionName.textContent = I18N.t("inv.select").toUpperCase();
      this.selectionStats.textContent = I18N.t("inv.selectHint");
      this.actionButton.hidden = true;
      this.splitButton.hidden = true;
      this.syncActionStrip({ use: false, split: false, delete: false });
      return;
    }
    const definition = ITEM_REGISTRY.get(this.selected.stack.itemId);
    this.selectionName.textContent = itemName(definition).toUpperCase();
    const equipLabel = this.selected.source === "inventory" ? I18N.t("inv.equip") : I18N.t("inv.unequip");
    const stripActions = this.selected.source === "inventory"
      ? resolveItemActions({ source: "inventory", stack: this.selected.stack })
      : Object.freeze([] as const);
    const canUse = stripActions.includes("use");
    // Need at least one free cell so the half-stack has a place of its own.
    const canSplit = stripActions.includes("split") && this.inventory.emptySlotCount > 0;
    const canDelete = stripActions.includes("delete");
    this.syncActionStrip({ use: canUse, split: canSplit, delete: canDelete });
    this.splitButton.textContent = I18N.t("inv.split");
    this.splitButton.hidden = !canSplit;

    if (this.selected.source === "backpack" || (this.selected.source === "inventory" && isBackpackCapableItemId(this.selected.stack.itemId) && definition.backpack)) {
      const extra = definition.backpack?.extraSlots ?? 0;
      this.selectionStats.textContent = `${I18N.t("inv.backpack").toUpperCase()} · +${extra}`;
      this.actionButton.textContent = equipLabel;
      this.actionButton.hidden = false;
      return;
    }

    if (this.selected.source === "weapon" || (this.selected.source === "inventory" && isWeaponCapableItemId(this.selected.stack.itemId) && definition.meleeCombat)) {
      const durability = stackDurability(this.selected.stack);
      const melee = definition.meleeCombat;
      this.selectionStats.textContent = durability && melee
        ? `${I18N.t("inv.weapon").toUpperCase()} · ${durability.current} / ${durability.max} · ${melee.damage} · ${melee.attacksPerSecond}/s`
        : I18N.t("inv.weapon").toUpperCase();
      this.actionButton.textContent = this.selected.source === "inventory" ? I18N.t("inv.equip") : I18N.t("inv.unequip");
      this.actionButton.hidden = false;
      return;
    }

    if (this.selected.source === "quick") {
      this.selectionStats.textContent = `${I18N.t("inv.quick").toUpperCase()} ${this.selected.index + 1} · ${this.selected.stack.quantity}`;
      this.actionButton.textContent = I18N.t("inv.unequip");
      this.actionButton.hidden = false;
      return;
    }

    if (!definition.equipment) {
      const durability = stackDurability(this.selected.stack);
      const consumable = definition.consumable;
      if (this.selected.source === "inventory" && consumable) {
        this.selectionStats.textContent = `${definition.category.toUpperCase()} · ${this.selected.stack.quantity} · ${I18N.t("inv.use")}`;
        this.actionButton.textContent = I18N.t("inv.use");
        this.actionButton.hidden = false;
        return;
      }
      // Any inventory stack can move to empty quick hotbar slots (like a pocket cell).
      if (this.selected.source === "inventory") {
        this.selectionStats.textContent = durability
          ? `${definition.category.toUpperCase()} · ${durability.current} / ${durability.max}`
          : `${definition.category.toUpperCase()} · ${this.selected.stack.quantity} / ${definition.maxStack}`;
        this.actionButton.textContent = I18N.t("inv.assign");
        this.actionButton.hidden = false;
        return;
      }
      this.selectionStats.textContent = durability
        ? `${definition.category.toUpperCase()} · ${durability.current} / ${durability.max}`
        : `${definition.category.toUpperCase()} · ${this.selected.stack.quantity} / ${definition.maxStack}`;
      this.actionButton.hidden = true;
      return;
    }
    this.selectionStats.textContent = `${slotLabel(definition.equipment.slot).toUpperCase()} · ${I18N.t("inv.armor", { n: definition.equipment.armor })}`;
    this.actionButton.textContent = equipLabel;
    this.actionButton.hidden = false;
  }

  private syncActionStrip(flags: { use: boolean; split: boolean; delete: boolean }): void {
    const apply = (btn: HTMLButtonElement, enabled: boolean, labelKey: "inv.use" | "inv.split" | "inv.delete"): void => {
      btn.disabled = !enabled;
      btn.classList.toggle("available", enabled);
      btn.title = enabled ? I18N.t(labelKey) : I18N.t("inv.notAvailable");
      btn.setAttribute("aria-disabled", enabled ? "false" : "true");
    };
    apply(this.stripUse, flags.use, "inv.use");
    apply(this.stripSplit, flags.split, "inv.split");
    apply(this.stripDelete, flags.delete, "inv.delete");
  }

  private clearSelection(): void {
    this.selected = null;
    this.renderSelection();
  }

  private validateSelection(): void {
    if (!this.selected) return;
    let current: ItemStack | null = null;
    if (this.selected.source === "inventory") {
      if (this.selected.index >= this.inventory.slotCount) {
        this.clearSelection();
        return;
      }
      current = this.inventory.getSlot(this.selected.index).stack;
    } else if (this.selected.source === "equipment") {
      current = this.equipment.getSlot(this.selected.slot).stack;
    } else if (this.selected.source === "backpack") {
      current = this.backpackSlot.current;
    } else if (this.selected.source === "quick") {
      current = this.quickSlots[this.selected.index].current;
    } else {
      current = this.weaponSlot.current;
    }
    if (current !== this.selected.stack) this.clearSelection();
  }

  private readonly performSelectedAction = (): void => {
    const selection = this.selected;
    if (!selection) return;
    if (selection.source === "equipment") {
      this.unequipArmorSlot(selection.slot, selection.stack);
      return;
    }
    if (selection.source === "backpack") {
      const result = this.backpackEquipSystem.unequipToInventory(selection.stack);
      if (result.accepted || result.reason === "stale-source" || result.reason === "empty-source") this.clearSelection();
      else this.reportBackpackFailure(result.reason);
      return;
    }
    if (selection.source === "weapon") {
      const result = this.weaponEquipSystem.unequipToInventory(selection.stack);
    if (result.accepted || result.reason === "stale-source" || result.reason === "empty-source") this.clearSelection();
    else if (result.reason === "inventory-full") this.handleInventoryFull();
      return;
    }
    if (selection.source === "quick") {
      const result = this.quickSystems[selection.index].clearToInventory(selection.stack);
      if (result.accepted || result.reason === "empty-source" || result.reason === "stale-source") this.clearSelection();
      else if (result.reason === "inventory-full") this.handleInventoryFull();
      return;
    }
    // inventory source below
    if (isBackpackCapableItemId(selection.stack.itemId) && ITEM_REGISTRY.get(selection.stack.itemId).backpack) {
      const result = this.backpackEquipSystem.equipFromInventory(selection.index, selection.stack);
      if (result.accepted || result.reason === "stale-source" || result.reason === "empty-source") this.clearSelection();
      else this.reportBackpackFailure(result.reason);
      return;
    }
    if (isWeaponCapableItemId(selection.stack.itemId) && ITEM_REGISTRY.get(selection.stack.itemId).meleeCombat) {
      const result = this.weaponEquipSystem.equipFromInventory(selection.index, selection.stack);
      if (result.accepted || result.reason === "stale-source" || result.reason === "empty-source" || result.reason === "not-weapon") {
        this.clearSelection();
      }
      return;
    }
    if (
      (ITEM_REGISTRY.get(selection.stack.itemId).consumable || isBlueprintItemId(selection.stack.itemId))
      && this.onUseItem
    ) {
      if (this.onUseItem(selection.index, selection.stack)) this.clearSelection();
      else this.showStatus("Can't use");
      return;
    }
    // Move any inventory stack into the first free quick slot (or replace slot 1 if both filled).
    if (this.onQuickAssign && PlayerQuickSlot.isCompatible(selection.stack.itemId)) {
      if (this.onQuickAssign(selection.index, selection.stack)) {
        this.clearSelection();
      } else this.showStatus("Quick slot rejected");
      return;
    }
    if (!ITEM_REGISTRY.get(selection.stack.itemId).equipment) {
      return;
    }
    const result = this.equipmentSystem.equipFromInventory(selection.index, selection.stack);
    if (result.accepted || result.reason === "stale-source" || result.reason === "empty-source") this.clearSelection();
    else if (result.reason === "inventory-full") this.handleInventoryFull();
    else if (result.reason === "not-equipment") this.showStatus("Not armor");
    else if (result.reason === "wrong-slot") this.showStatus("Can't equip");
  };

  private readonly performStripUse = (): void => {
    const selection = this.selected;
    if (!selection || selection.source !== "inventory") return;
    const id = selection.stack.itemId;
    if ((!ITEM_REGISTRY.get(id).consumable && !isBlueprintItemId(id)) || !this.onUseItem) return;
    if (this.onUseItem(selection.index, selection.stack)) this.clearSelection();
    else this.showStatus("Can't use");
  };

  private readonly performSplitSelected = (): void => {
    const selection = this.selected;
    if (!selection || selection.source !== "inventory") return;
    const stack = this.inventory.getSlot(selection.index).stack;
    if (!stack || stack !== selection.stack) {
      this.clearSelection();
      return;
    }
    if (stack.quantity < 2 || stack.currentDurability !== undefined) return;
    const take = Math.floor(stack.quantity / 2);
    if (!this.inventory.trySplitStack(selection.index, take)) {
      this.handleInventoryFull();
      return;
    }
    // Stack identity changes after split — refresh selection to the remainder if still there.
    const remainder = this.inventory.getSlot(selection.index).stack;
    if (remainder) this.selected = Object.freeze({ source: "inventory", index: selection.index, stack: remainder });
    else this.selected = null;
    this.renderSelection();
  };

  private readonly performStripDelete = (): void => {
    const selection = this.selected;
    if (!selection || selection.source !== "inventory" || !this.onDeleteItem) return;
    if (this.onDeleteItem(selection.index, selection.stack)) this.clearSelection();
  };

  private readonly onBackdropPointerDown = (event: PointerEvent): void => {
    if (event.target === this.overlay) this.close();
  };

  private readonly onItemTooltipOver = (event: PointerEvent): void => {
    if (!this.openState || this.drag) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!this.overlay.contains(target)) return;
    const host = target.closest<HTMLElement>("[data-tooltip]");
    if (!host || !this.overlay.contains(host)) return;
    const name = host.getAttribute("data-tooltip");
    if (!name) return;
    this.showItemTooltip(host, name);
  };

  private readonly onItemTooltipOut = (event: PointerEvent): void => {
    if (!this.openState) return;
    const from = event.target;
    if (!(from instanceof Element)) return;
    const host = from.closest("[data-tooltip]");
    if (!(host instanceof HTMLElement) || !this.overlay.contains(host)) return;
    const related = event.relatedTarget;
    if (related instanceof Node && host.contains(related)) return;
    // Leaving a tooltip host for another still inside a different slot — re-eval on next over.
    this.hideItemTooltip();
  };

  private readonly onItemTooltipMove = (event: PointerEvent): void => {
    if (!this.openState || this.drag) return;
    const target = event.target;
    if (!(target instanceof Element) || !this.overlay.contains(target)) return;
    const host = target.closest<HTMLElement>("[data-tooltip]");
    if (!host || !this.overlay.contains(host)) {
      this.hideItemTooltip();
      return;
    }
    const name = host.getAttribute("data-tooltip");
    if (!name) return;
    this.showItemTooltip(host, name);
  };

  private showItemTooltip(host: HTMLElement, name: string): void {
    // Geometry first (no style writes yet) to avoid layout thrash.
    const rect = host.getBoundingClientRect();
    // Approx width from text — keep tip near host without measuring tip (not yet laid out).
    const tipW = Math.min(280, Math.max(80, name.length * 7.4 + 24));
    const tipH = 30;
    let left = rect.left + rect.width / 2 - tipW / 2;
    let top = rect.top - tipH - 8;
    left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
    if (top < 8) top = rect.bottom + 8;

    this.itemTooltip.textContent = name;
    this.itemTooltip.style.left = `${Math.round(left)}px`;
    this.itemTooltip.style.top = `${Math.round(top)}px`;
    this.itemTooltip.hidden = false;
    this.itemTooltip.classList.add("visible");
  }

  private hideItemTooltip(): void {
    this.itemTooltip.hidden = true;
    this.itemTooltip.classList.remove("visible");
    this.itemTooltip.textContent = "";
  }

  private applyLocaleChrome(): void {
    const t = (k: Parameters<typeof I18N.t>[0]) => I18N.t(k);
    const title = this.overlay.querySelector("#inventory-title");
    if (title) title.textContent = t("inv.title").toUpperCase();
    const headers = this.overlay.querySelectorAll(".inv-section-label > span");
    if (headers[0]) headers[0].textContent = t("inv.pockets").toUpperCase();
    if (headers[1]) headers[1].textContent = t("inv.backpack").toUpperCase();
    const strip = this.overlay.querySelectorAll<HTMLButtonElement>(".inv-shell-btn");
    if (strip[0]) strip[0].textContent = t("inv.use");
    if (strip[1]) strip[1].textContent = t("inv.split");
    if (strip[2]) strip[2].textContent = t("inv.delete");
    this.splitButton.textContent = t("inv.split");
    // Re-apply enablement titles from selection state.
    if (this.openState) this.renderSelection();
    else this.syncActionStrip({ use: false, split: false, delete: false });
    this.namePencil.title = t("inv.editName");
    this.namePencil.setAttribute("aria-label", t("inv.editName"));
    this.nameSave.textContent = t("char.save");
    this.genderMale.title = t("settings.gender.male");
    this.genderMale.setAttribute("aria-label", t("settings.gender.male"));
    this.genderFemale.title = t("settings.gender.female");
    this.genderFemale.setAttribute("aria-label", t("settings.gender.female"));
    this.overlay.querySelector(".inv-gender-toggle")?.setAttribute("aria-label", t("char.gender"));
    this.overlay.querySelector(".inventory-close")?.setAttribute("aria-label", t("inv.close"));
    this.fullFeedback.textContent = t("inv.full");
  }
}

function formatStat(value: number, digits: number): string {
  const fixed = value.toFixed(digits);
  return fixed.replace(/\.0$/, "");
}

function setItemTooltip(el: HTMLElement, name: string): void {
  el.setAttribute("data-tooltip", name);
  el.classList.add("has-item-tooltip");
}

function clearItemTooltip(el: HTMLElement): void {
  el.removeAttribute("data-tooltip");
  el.classList.remove("has-item-tooltip");
}
