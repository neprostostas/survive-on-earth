import type { ItemDefinition } from "./ItemDefinition";
import type { ItemId } from "./ItemId";
import type { ItemResult } from "./ItemResult";
import { EQUIPMENT_SLOT_IDS } from "../equipment/EquipmentTypes.ts";

export interface ItemStack {
  readonly itemId: ItemId;
  readonly quantity: number;
  readonly currentDurability?: number;
}

export interface StackMergeResult {
  readonly stack: ItemStack;
  readonly remainder: ItemStack | null;
}

export interface ItemStackCreateOptions {
  readonly currentDurability?: number;
}

function def(partial: ItemDefinition): ItemDefinition {
  return Object.freeze({
    rarity: "common",
    ...partial,
    equipment: partial.equipment ? Object.freeze({ ...partial.equipment }) : undefined,
    meleeCombat: partial.meleeCombat ? Object.freeze({ ...partial.meleeCombat }) : undefined,
    backpack: partial.backpack ? Object.freeze({ ...partial.backpack }) : undefined,
    consumable: partial.consumable ? Object.freeze({ ...partial.consumable }) : undefined,
  });
}

const INITIAL_DEFINITIONS: readonly ItemDefinition[] = Object.freeze([
  def({ id: "pine-log", displayName: "Pine Log", category: "resource", maxStack: 20, iconId: "pine-log", description: "Cut timber from pine trees." }),
  def({ id: "limestone", displayName: "Limestone", category: "resource", maxStack: 20, iconId: "limestone", description: "Mined rock for tools and walls." }),
  def({ id: "plant-fiber", displayName: "Plant Fiber", category: "material", maxStack: 40, iconId: "plant-fiber", description: "Soft plant strands for rope and cloth." }),
  def({ id: "rope", displayName: "Rope", category: "material", maxStack: 20, iconId: "rope", description: "Twisted fiber cordage." }),
  def({ id: "cloth", displayName: "Cloth", category: "material", maxStack: 30, iconId: "cloth" }),
  def({ id: "stone", displayName: "Stone", category: "material", maxStack: 30, iconId: "stone" }),
  def({ id: "wood-plank", displayName: "Wood Plank", category: "material", maxStack: 30, iconId: "wood-plank" }),
  def({ id: "iron-ore", displayName: "Iron Ore", category: "material", maxStack: 30, iconId: "iron-ore" }),
  def({ id: "iron-bar", displayName: "Iron Bar", category: "material", maxStack: 20, iconId: "iron-bar" }),
  def({ id: "leather", displayName: "Leather", category: "material", maxStack: 20, iconId: "leather" }),
  def({ id: "scrap-metal", displayName: "Scrap Metal", category: "material", maxStack: 30, iconId: "scrap-metal" }),
  def({ id: "nails", displayName: "Nails", category: "material", maxStack: 50, iconId: "nails" }),
  def({ id: "tape", displayName: "Tape", category: "material", maxStack: 20, iconId: "tape" }),
  def({ id: "bottle", displayName: "Bottle", category: "material", maxStack: 10, iconId: "bottle" }),
  def({ id: "charcoal", displayName: "Charcoal", category: "material", maxStack: 30, iconId: "charcoal" }),
  def({ id: "dad-hat", displayName: "Dad Hat", category: "armor", maxStack: 1, iconId: "dad-hat", equipment: { slot: "head", armor: 2 } }),
  def({ id: "shirt", displayName: "Shirt", category: "armor", maxStack: 1, iconId: "shirt", equipment: { slot: "torso", armor: 3 } }),
  def({ id: "cargo-pants", displayName: "Cargo Pants", category: "armor", maxStack: 1, iconId: "cargo-pants", equipment: { slot: "legs", armor: 3 } }),
  def({ id: "sneakers", displayName: "Sneakers", category: "armor", maxStack: 1, iconId: "sneakers", equipment: { slot: "feet", armor: 0 } }),
  def({ id: "reinforced-cap", displayName: "Reinforced Cap", category: "armor", maxStack: 1, iconId: "reinforced-cap", equipment: { slot: "head", armor: 4 }, rarity: "uncommon" }),
  def({ id: "jacket", displayName: "Jacket", category: "armor", maxStack: 1, iconId: "jacket", equipment: { slot: "torso", armor: 5 }, rarity: "uncommon" }),
  def({ id: "reinforced-pants", displayName: "Reinforced Pants", category: "armor", maxStack: 1, iconId: "reinforced-pants", equipment: { slot: "legs", armor: 5 }, rarity: "uncommon" }),
  def({ id: "boots", displayName: "Boots", category: "armor", maxStack: 1, iconId: "boots", equipment: { slot: "feet", armor: 2 }, rarity: "uncommon" }),
  def({ id: "makeshift-armor", displayName: "Makeshift Armor", category: "armor", maxStack: 1, iconId: "makeshift-armor", equipment: { slot: "torso", armor: 7 }, rarity: "rare" }),
  def({ id: "hatchet", displayName: "Hatchet", category: "tool", maxStack: 1, iconId: "hatchet", maxDurability: 50, meleeCombat: { damage: 7, attacksPerSecond: 0.9 } }),
  def({ id: "pickaxe", displayName: "Pickaxe", category: "tool", maxStack: 1, iconId: "pickaxe", maxDurability: 50, meleeCombat: { damage: 7, attacksPerSecond: 1.1 } }),
  def({ id: "spear", displayName: "Spear", category: "tool", maxStack: 1, iconId: "spear", maxDurability: 100, meleeCombat: { damage: 10, attacksPerSecond: 1.0, hitRange: 1.35 } }),
  def({ id: "wooden-club", displayName: "Wooden Club", category: "tool", maxStack: 1, iconId: "wooden-club", maxDurability: 40, meleeCombat: { damage: 8, attacksPerSecond: 1.2 } }),
  def({ id: "stone-knife", displayName: "Stone Knife", category: "tool", maxStack: 1, iconId: "stone-knife", maxDurability: 45, meleeCombat: { damage: 6, attacksPerSecond: 1.6, hitRange: 1.05 } }),
  def({ id: "metal-pipe", displayName: "Metal Pipe", category: "tool", maxStack: 1, iconId: "metal-pipe", maxDurability: 80, meleeCombat: { damage: 11, attacksPerSecond: 0.95 }, rarity: "uncommon" }),
  def({ id: "crowbar", displayName: "Crowbar", category: "tool", maxStack: 1, iconId: "crowbar", maxDurability: 90, meleeCombat: { damage: 12, attacksPerSecond: 0.85 }, rarity: "uncommon" }),
  def({ id: "improved-spear", displayName: "Improved Spear", category: "tool", maxStack: 1, iconId: "improved-spear", maxDurability: 140, meleeCombat: { damage: 13, attacksPerSecond: 1.0, hitRange: 1.5 }, rarity: "rare" }),
  def({ id: "basic-pistol", displayName: "Basic Pistol", category: "tool", maxStack: 1, iconId: "basic-pistol", maxDurability: 60, description: "Short-range firearm foundation.", rarity: "rare" }),
  def({ id: "pistol-ammo", displayName: "Pistol Ammo", category: "ammo", maxStack: 40, iconId: "pistol-ammo" }),
  def({ id: "torch", displayName: "Torch", category: "tool", maxStack: 1, iconId: "torch", maxDurability: 80, utility: true, description: "Handheld light source." }),
  def({ id: "basic-backpack", displayName: "Basic Backpack", category: "gear", maxStack: 1, iconId: "basic-backpack", backpack: { extraSlots: 5 }, description: "+5 carrying slots." }),
  def({ id: "reinforced-backpack", displayName: "Reinforced Backpack", category: "gear", maxStack: 1, iconId: "reinforced-backpack", backpack: { extraSlots: 10 }, rarity: "uncommon", description: "+10 carrying slots." }),
  def({ id: "expedition-backpack", displayName: "Expedition Backpack", category: "gear", maxStack: 1, iconId: "expedition-backpack", backpack: { extraSlots: 15 }, rarity: "rare", description: "+15 carrying slots." }),
  def({ id: "winter-hat", displayName: "Winter Hat", category: "armor", maxStack: 1, iconId: "winter-hat", equipment: { slot: "head", armor: 2, warmth: 0.22 }, rarity: "uncommon" }),
  def({ id: "padded-jacket", displayName: "Padded Jacket", category: "armor", maxStack: 1, iconId: "padded-jacket", equipment: { slot: "torso", armor: 4, warmth: 0.35 }, rarity: "uncommon" }),
  def({ id: "insulated-pants", displayName: "Insulated Pants", category: "armor", maxStack: 1, iconId: "insulated-pants", equipment: { slot: "legs", armor: 3, warmth: 0.28 }, rarity: "uncommon" }),
  def({ id: "winter-boots", displayName: "Winter Boots", category: "armor", maxStack: 1, iconId: "winter-boots", equipment: { slot: "feet", armor: 2, warmth: 0.2 }, rarity: "uncommon" }),
  def({ id: "gas-mask", displayName: "Gas Mask", category: "armor", maxStack: 1, iconId: "gas-mask", equipment: { slot: "head", armor: 3, gasResistance: 0.75 }, rarity: "rare", description: "Reduces toxic gas damage." }),
  def({ id: "rusted-key", displayName: "Rusted Key", category: "material", maxStack: 1, iconId: "rusted-key", rarity: "uncommon" }),
  def({ id: "security-badge", displayName: "Security Badge", category: "material", maxStack: 1, iconId: "security-badge", rarity: "rare" }),
  def({ id: "maintenance-key", displayName: "Maintenance Key", category: "material", maxStack: 1, iconId: "maintenance-key", rarity: "uncommon" }),
  def({ id: "vault-key", displayName: "Vault Key", category: "material", maxStack: 1, iconId: "vault-key", rarity: "epic" }),
  def({ id: "trade-token", displayName: "Trade Token", category: "material", maxStack: 99, iconId: "trade-token", description: "Soft barter currency for NPC traders." }),
  def({ id: "berry-seeds", displayName: "Berry Seeds", category: "material", maxStack: 30, iconId: "berry-seeds" }),
  def({ id: "root-seeds", displayName: "Root Seeds", category: "material", maxStack: 30, iconId: "root-seeds" }),
  def({ id: "root-vegetable", displayName: "Root Vegetable", category: "consumable", maxStack: 15, iconId: "root-vegetable", quickSlot: true, consumable: { kind: "food", amount: 22, useTime: 1, rejectWhenFull: true } }),
  def({ id: "medicinal-herb", displayName: "Medicinal Herb", category: "material", maxStack: 20, iconId: "medicinal-herb" }),
  def({ id: "raw-meat", displayName: "Raw Meat", category: "consumable", maxStack: 10, iconId: "raw-meat", quickSlot: true, consumable: { kind: "food", amount: 10, useTime: 1.2, rejectWhenFull: true } }),
  def({ id: "roasted-meat", displayName: "Roasted Meat", category: "consumable", maxStack: 10, iconId: "roasted-meat", quickSlot: true, consumable: { kind: "food", amount: 45, useTime: 1.4, rejectWhenFull: true } }),
  def({ id: "fishing-rod", displayName: "Fishing Rod", category: "tool", maxStack: 1, iconId: "fishing-rod", maxDurability: 40 }),
  def({ id: "river-fish", displayName: "River Fish", category: "consumable", maxStack: 10, iconId: "river-fish", quickSlot: true, consumable: { kind: "food", amount: 18, useTime: 1, rejectWhenFull: true } }),
  def({ id: "first-aid-kit", displayName: "First Aid Kit", category: "consumable", maxStack: 5, iconId: "first-aid-kit", quickSlot: true, consumable: { kind: "heal", amount: 55, useTime: 2, rejectWhenFull: true }, rarity: "uncommon" }),
  def({ id: "antidote", displayName: "Antidote", category: "consumable", maxStack: 5, iconId: "antidote", quickSlot: true, consumable: { kind: "heal", amount: 5, useTime: 0.8, rejectWhenFull: false }, rarity: "uncommon" }),
  def({ id: "pain-relief", displayName: "Pain Relief", category: "consumable", maxStack: 8, iconId: "pain-relief", quickSlot: true, consumable: { kind: "heal", amount: 12, useTime: 0.6, rejectWhenFull: false } }),
  def({ id: "engine-part", displayName: "Engine Part", category: "material", maxStack: 10, iconId: "engine-part" }),
  def({ id: "rubber", displayName: "Rubber", category: "material", maxStack: 20, iconId: "rubber" }),
  def({ id: "wiring", displayName: "Wiring Bundle", category: "material", maxStack: 20, iconId: "wiring" }),
  def({ id: "bearing", displayName: "Bearing", category: "material", maxStack: 20, iconId: "bearing" }),
  def({ id: "metal-plate", displayName: "Metal Plate", category: "material", maxStack: 20, iconId: "metal-plate" }),
  def({ id: "fuel-can", displayName: "Fuel Can", category: "material", maxStack: 5, iconId: "fuel-can" }),
  def({ id: "wire", displayName: "Wire", category: "material", maxStack: 30, iconId: "wire" }),
  def({ id: "circuit-component", displayName: "Circuit Component", category: "material", maxStack: 15, iconId: "circuit-component" }),
  def({ id: "battery", displayName: "Battery", category: "material", maxStack: 10, iconId: "battery" }),
  def({ id: "bulb", displayName: "Bulb", category: "material", maxStack: 15, iconId: "bulb" }),
  def({ id: "fuse", displayName: "Fuse", category: "material", maxStack: 10, iconId: "fuse", description: "Factory breaker component." }),
  def({ id: "noise-maker", displayName: "Noise Maker", category: "material", maxStack: 5, iconId: "noise-maker", description: "Throwable decoy for infected attraction." }),
  def({ id: "warden-maul", displayName: "Warden Maul", category: "tool", maxStack: 1, iconId: "warden-maul", maxDurability: 180, meleeCombat: { damage: 22, attacksPerSecond: 0.7, hitRange: 1.4 }, rarity: "epic", description: "Unique heavy mace from The Warden." }),
  def({ id: "blacksite-plate", displayName: "Blacksite Plate", category: "armor", maxStack: 1, iconId: "blacksite-plate", equipment: { slot: "torso", armor: 14, gasResistance: 0.2 }, rarity: "epic" }),
  def({ id: "berries", displayName: "Berries", category: "consumable", maxStack: 20, iconId: "berries", quickSlot: true, consumable: { kind: "food", amount: 12, useTime: 0.4, rejectWhenFull: true } }),
  def({ id: "water-bottle", displayName: "Water Bottle", category: "consumable", maxStack: 5, iconId: "water-bottle", quickSlot: true, consumable: { kind: "drink", amount: 35, useTime: 0.8, rejectWhenFull: true } }),
  def({ id: "bandage", displayName: "Bandage", category: "consumable", maxStack: 10, iconId: "bandage", quickSlot: true, consumable: { kind: "heal", amount: 25, useTime: 1.2, rejectWhenFull: true } }),
  def({ id: "canned-food", displayName: "Canned Food", category: "consumable", maxStack: 10, iconId: "canned-food", quickSlot: true, consumable: { kind: "food", amount: 40, useTime: 1.5, rejectWhenFull: true } }),
  def({ id: "bunker-access-card", displayName: "Bunker Access Card", category: "material", maxStack: 1, iconId: "bunker-access-card", rarity: "epic", description: "Opens gated bunker terminals." }),
  def({ id: "hardwood-log", displayName: "Hardwood Log", category: "resource", maxStack: 20, iconId: "hardwood-log", description: "Dense timber from mature trees.", rarity: "uncommon" }),
  def({ id: "hardwood-plank", displayName: "Hardwood Plank", category: "material", maxStack: 30, iconId: "hardwood-plank", rarity: "uncommon" }),
  def({ id: "treated-wood", displayName: "Treated Wood", category: "material", maxStack: 20, iconId: "treated-wood", rarity: "rare" }),
  def({ id: "stick", displayName: "Stick", category: "material", maxStack: 40, iconId: "stick" }),
  def({ id: "wood-scrap", displayName: "Wood Scrap", category: "material", maxStack: 40, iconId: "wood-scrap" }),
  def({ id: "sawdust", displayName: "Sawdust", category: "material", maxStack: 50, iconId: "sawdust" }),
  def({ id: "gravel", displayName: "Gravel", category: "material", maxStack: 40, iconId: "gravel" }),
  def({ id: "stone-block", displayName: "Stone Block", category: "material", maxStack: 20, iconId: "stone-block" }),
  def({ id: "refined-stone", displayName: "Refined Stone", category: "material", maxStack: 20, iconId: "refined-stone", rarity: "uncommon" }),
  def({ id: "concrete-mix", displayName: "Concrete Mix", category: "material", maxStack: 20, iconId: "concrete-mix", rarity: "uncommon" }),
  def({ id: "brick", displayName: "Brick", category: "material", maxStack: 30, iconId: "brick" }),
  def({ id: "dry-grass", displayName: "Dry Grass", category: "material", maxStack: 40, iconId: "dry-grass" }),
  def({ id: "plant-resin", displayName: "Plant Resin", category: "material", maxStack: 20, iconId: "plant-resin" }),
  def({ id: "thick-cloth", displayName: "Thick Cloth", category: "material", maxStack: 20, iconId: "thick-cloth", rarity: "uncommon" }),
  def({ id: "reinforced-fabric", displayName: "Reinforced Fabric", category: "material", maxStack: 15, iconId: "reinforced-fabric", rarity: "rare" }),
  def({ id: "insulating-fabric", displayName: "Insulating Fabric", category: "material", maxStack: 15, iconId: "insulating-fabric", rarity: "uncommon" }),
  def({ id: "hide", displayName: "Hide", category: "material", maxStack: 20, iconId: "hide" }),
  def({ id: "thick-hide", displayName: "Thick Hide", category: "material", maxStack: 15, iconId: "thick-hide", rarity: "uncommon" }),
  def({ id: "fur", displayName: "Fur", category: "material", maxStack: 20, iconId: "fur" }),
  def({ id: "animal-fat", displayName: "Animal Fat", category: "material", maxStack: 20, iconId: "animal-fat" }),
  def({ id: "bone", displayName: "Bone", category: "material", maxStack: 30, iconId: "bone" }),
  def({ id: "sinew", displayName: "Sinew", category: "material", maxStack: 20, iconId: "sinew" }),
  def({ id: "copper-ore", displayName: "Copper Ore", category: "material", maxStack: 30, iconId: "copper-ore" }),
  def({ id: "copper-bar", displayName: "Copper Bar", category: "material", maxStack: 20, iconId: "copper-bar", rarity: "uncommon" }),
  def({ id: "copper-wire", displayName: "Copper Wire", category: "material", maxStack: 30, iconId: "copper-wire" }),
  def({ id: "aluminum-ore", displayName: "Light Ore", category: "material", maxStack: 30, iconId: "aluminum-ore" }),
  def({ id: "aluminum-bar", displayName: "Light Metal Bar", category: "material", maxStack: 20, iconId: "aluminum-bar", rarity: "uncommon" }),
  def({ id: "aluminum-plate", displayName: "Light Metal Plate", category: "material", maxStack: 20, iconId: "aluminum-plate", rarity: "uncommon" }),
  def({ id: "steel-bar", displayName: "Steel Bar", category: "material", maxStack: 15, iconId: "steel-bar", rarity: "rare" }),
  def({ id: "steel-plate", displayName: "Steel Plate", category: "material", maxStack: 15, iconId: "steel-plate", rarity: "rare" }),
  def({ id: "metal-fragments", displayName: "Metal Fragments", category: "material", maxStack: 40, iconId: "metal-fragments" }),
  def({ id: "bolts", displayName: "Bolts", category: "material", maxStack: 50, iconId: "bolts" }),
  def({ id: "screws", displayName: "Screws", category: "material", maxStack: 50, iconId: "screws", rarity: "common", description: "Assorted fasteners." }),
  def({ id: "metal-pipe-part", displayName: "Metal Pipe Segment", category: "material", maxStack: 20, iconId: "metal-pipe-part" }),
  def({ id: "gear", displayName: "Gear", category: "material", maxStack: 20, iconId: "gear" }),
  def({ id: "spring", displayName: "Spring", category: "material", maxStack: 20, iconId: "spring" }),
  def({ id: "chain", displayName: "Chain", category: "material", maxStack: 15, iconId: "chain" }),
  def({ id: "piston", displayName: "Piston", category: "material", maxStack: 10, iconId: "piston", rarity: "uncommon" }),
  def({ id: "rubber-part", displayName: "Rubber Part", category: "material", maxStack: 20, iconId: "rubber-part" }),
  def({ id: "filter", displayName: "Filter", category: "material", maxStack: 15, iconId: "filter" }),
  def({ id: "mechanical-part", displayName: "Mechanical Part", category: "material", maxStack: 15, iconId: "mechanical-part", rarity: "uncommon" }),
  def({ id: "cable", displayName: "Cable", category: "material", maxStack: 25, iconId: "cable" }),
  def({ id: "small-battery", displayName: "Small Battery", category: "material", maxStack: 15, iconId: "small-battery" }),
  def({ id: "circuit-board", displayName: "Circuit Board", category: "material", maxStack: 10, iconId: "circuit-board", rarity: "rare" }),
  def({ id: "electronic-part", displayName: "Electronic Part", category: "material", maxStack: 20, iconId: "electronic-part" }),
  def({ id: "motor", displayName: "Motor", category: "material", maxStack: 5, iconId: "motor", rarity: "rare" }),
  def({ id: "plastic", displayName: "Plastic", category: "material", maxStack: 30, iconId: "plastic" }),
  def({ id: "plastic-sheet", displayName: "Plastic Sheet", category: "material", maxStack: 20, iconId: "plastic-sheet" }),
  def({ id: "polymer", displayName: "Polymer", category: "material", maxStack: 15, iconId: "polymer", rarity: "uncommon" }),
  def({ id: "adhesive", displayName: "Adhesive", category: "material", maxStack: 20, iconId: "adhesive" }),
  def({ id: "hose", displayName: "Hose", category: "material", maxStack: 15, iconId: "hose" }),
  def({ id: "alcohol", displayName: "Alcohol", category: "material", maxStack: 15, iconId: "alcohol" }),
  def({ id: "solvent", displayName: "Solvent", category: "material", maxStack: 15, iconId: "solvent" }),
  def({ id: "disinfectant", displayName: "Disinfectant", category: "material", maxStack: 15, iconId: "disinfectant" }),
  def({ id: "fertilizer", displayName: "Fertilizer", category: "material", maxStack: 20, iconId: "fertilizer" }),
  def({ id: "gunpowder", displayName: "Propellant Mix", category: "material", maxStack: 30, iconId: "gunpowder", rarity: "uncommon", description: "Fictional crafting powder for ammunition." }),
  def({ id: "dirty-water", displayName: "Dirty Water", category: "consumable", maxStack: 5, iconId: "dirty-water", quickSlot: true, consumable: { kind: "drink", amount: 10, useTime: 0.6, rejectWhenFull: true } }),
  def({ id: "clean-water", displayName: "Clean Water", category: "consumable", maxStack: 5, iconId: "clean-water", quickSlot: true, consumable: { kind: "drink", amount: 40, useTime: 0.7, rejectWhenFull: true } }),
  def({ id: "canteen", displayName: "Canteen", category: "consumable", maxStack: 1, iconId: "canteen", quickSlot: true, consumable: { kind: "drink", amount: 55, useTime: 1, rejectWhenFull: true }, rarity: "uncommon" }),
  def({ id: "carrot", displayName: "Carrot", category: "consumable", maxStack: 20, iconId: "carrot", quickSlot: true, consumable: { kind: "food", amount: 14, useTime: 0.5, rejectWhenFull: true } }),
  def({ id: "potato", displayName: "Potato", category: "consumable", maxStack: 20, iconId: "potato", rarity: "common", description: "Starchy root.", quickSlot: true, consumable: { kind: "food", amount: 16, useTime: 0.6, rejectWhenFull: true } }),
  def({ id: "mushroom", displayName: "Mushroom", category: "consumable", maxStack: 20, iconId: "mushroom", quickSlot: true, consumable: { kind: "food", amount: 10, useTime: 0.4, rejectWhenFull: true } }),
  def({ id: "cooked-fish", displayName: "Grilled Fish", category: "consumable", maxStack: 10, iconId: "cooked-fish", quickSlot: true, consumable: { kind: "food", amount: 38, useTime: 1.2, rejectWhenFull: true } }),
  def({ id: "stew", displayName: "Hearty Stew", category: "consumable", maxStack: 5, iconId: "stew", quickSlot: true, consumable: { kind: "food", amount: 55, useTime: 1.8, rejectWhenFull: true }, rarity: "uncommon" }),
  def({ id: "carrot-seeds", displayName: "Carrot Seeds", category: "material", maxStack: 30, iconId: "carrot-seeds" }),
  def({ id: "potato-seeds", displayName: "Potato Seeds", category: "material", maxStack: 30, iconId: "potato-seeds" }),
  def({ id: "herb-seeds", displayName: "Herb Seeds", category: "material", maxStack: 30, iconId: "herb-seeds" }),
  def({ id: "compost", displayName: "Compost", category: "material", maxStack: 20, iconId: "compost" }),
  def({ id: "low-grade-fuel", displayName: "Low-Grade Fuel", category: "material", maxStack: 10, iconId: "low-grade-fuel" }),
  def({ id: "cement", displayName: "Cement", category: "material", maxStack: 20, iconId: "cement" }),
  def({ id: "rebar", displayName: "Rebar", category: "material", maxStack: 20, iconId: "rebar", rarity: "uncommon" }),
  def({ id: "insulation-sheet", displayName: "Insulation Sheet", category: "material", maxStack: 15, iconId: "insulation-sheet" }),
  def({ id: "rare-alloy", displayName: "Rare Alloy", category: "material", maxStack: 10, iconId: "rare-alloy", rarity: "epic" }),
  def({ id: "military-electronics", displayName: "Field Electronics", category: "material", maxStack: 8, iconId: "military-electronics", rarity: "epic" }),
  def({ id: "servo", displayName: "Servo", category: "material", maxStack: 10, iconId: "servo", rarity: "rare" }),
  def({ id: "advanced-battery", displayName: "Advanced Battery", category: "material", maxStack: 5, iconId: "advanced-battery", rarity: "rare" }),
  def({ id: "reinforced-hatchet", displayName: "Reinforced Hatchet", category: "tool", maxStack: 1, iconId: "reinforced-hatchet", maxDurability: 90, meleeCombat: { damage: 9, attacksPerSecond: 0.95 }, rarity: "uncommon" }),
  def({ id: "advanced-hatchet", displayName: "Steel Hatchet", category: "tool", maxStack: 1, iconId: "advanced-hatchet", maxDurability: 140, meleeCombat: { damage: 11, attacksPerSecond: 1.0 }, rarity: "rare" }),
  def({ id: "reinforced-pickaxe", displayName: "Reinforced Pickaxe", category: "tool", maxStack: 1, iconId: "reinforced-pickaxe", maxDurability: 90, meleeCombat: { damage: 9, attacksPerSecond: 1.15 }, rarity: "uncommon" }),
  def({ id: "advanced-pickaxe", displayName: "Mining Pick", category: "tool", maxStack: 1, iconId: "advanced-pickaxe", maxDurability: 140, meleeCombat: { damage: 11, attacksPerSecond: 1.2 }, rarity: "rare" }),
  def({ id: "shotgun-shell", displayName: "Scatter Shell", category: "ammo", maxStack: 30, iconId: "shotgun-shell" }),
  def({ id: "rifle-ammo", displayName: "Rifle Round", category: "ammo", maxStack: 40, iconId: "rifle-ammo" }),
  def({ id: "antiseptic", displayName: "Antiseptic", category: "material", maxStack: 15, iconId: "antiseptic" }),
  def({ id: "purified-water", displayName: "Purified Water", category: "consumable", maxStack: 5, iconId: "purified-water", quickSlot: true, consumable: { kind: "drink", amount: 50, useTime: 0.8, rejectWhenFull: true } }),
  def({ id: "healing-salve", displayName: "Healing Salve", category: "consumable", maxStack: 8, iconId: "healing-salve", quickSlot: true, consumable: { kind: "heal", amount: 18, useTime: 1, rejectWhenFull: true } }),
  def({ id: "roasted-root", displayName: "Roasted Root", category: "consumable", maxStack: 10, iconId: "roasted-root", quickSlot: true, consumable: { kind: "food", amount: 32, useTime: 1.1, rejectWhenFull: true } }),
  def({ id: "cooked-berries", displayName: "Cooked Berry Mix", category: "consumable", maxStack: 15, iconId: "cooked-berries", quickSlot: true, consumable: { kind: "food", amount: 22, useTime: 0.8, rejectWhenFull: true } }),
  def({ id: "leather-armor", displayName: "Leather Vest", category: "armor", maxStack: 1, iconId: "leather-armor", equipment: { slot: "torso", armor: 6 }, rarity: "uncommon" }),
  def({ id: "tactical-vest", displayName: "Scout Vest", category: "armor", maxStack: 1, iconId: "tactical-vest", equipment: { slot: "torso", armor: 10 }, rarity: "rare" }),
  def({ id: "hardened-alloy", displayName: "Hardened Alloy", category: "material", maxStack: 15, iconId: "hardened-alloy", rarity: "epic", description: "High-tier structural alloy." }),
  def({ id: "precision-component", displayName: "Precision Component", category: "material", maxStack: 15, iconId: "precision-component", rarity: "rare", description: "Fine machining part." }),
  def({ id: "composite-plate", displayName: "Composite Plate", category: "material", maxStack: 12, iconId: "composite-plate", rarity: "epic", description: "Layered armor plate stock." }),
  def({ id: "industrial-ceramic", displayName: "Industrial Ceramic", category: "material", maxStack: 15, iconId: "industrial-ceramic", rarity: "rare", description: "Heat-resistant ceramic." }),
  def({ id: "high-density-polymer", displayName: "High-Density Polymer", category: "material", maxStack: 15, iconId: "high-density-polymer", rarity: "rare", description: "Dense synthetic stock." }),
  def({ id: "power-cell", displayName: "Power Cell", category: "material", maxStack: 10, iconId: "power-cell", rarity: "rare", description: "Dense energy storage unit." }),
  def({ id: "advanced-circuit", displayName: "Advanced Circuit", category: "material", maxStack: 12, iconId: "advanced-circuit", rarity: "epic", description: "High-grade logic board." }),
  def({ id: "servo-assembly", displayName: "Servo Assembly", category: "material", maxStack: 8, iconId: "servo-assembly", rarity: "rare", description: "Actuator stack." }),
  def({ id: "optical-module", displayName: "Optical Module", category: "material", maxStack: 10, iconId: "optical-module", rarity: "rare", description: "Lens and sensor pack." }),
  def({ id: "reinforced-fiber", displayName: "Reinforced Fiber", category: "material", maxStack: 20, iconId: "reinforced-fiber", rarity: "uncommon", description: "Industrial fiber weave." }),
  def({ id: "thermal-insulation", displayName: "Thermal Insulation", category: "material", maxStack: 15, iconId: "thermal-insulation", rarity: "uncommon", description: "Temperature barrier sheets." }),
  def({ id: "chemical-filter", displayName: "Chemical Filter", category: "material", maxStack: 12, iconId: "chemical-filter", rarity: "uncommon", description: "Hazard filter media." }),
  def({ id: "reactor-component", displayName: "Reactor Component", category: "material", maxStack: 5, iconId: "reactor-component", rarity: "epic", description: "Facility reactor fragment." }),
  def({ id: "security-module", displayName: "Security Module", category: "material", maxStack: 8, iconId: "security-module", rarity: "epic", description: "Access control hardware." }),
  def({ id: "dungeon-token", displayName: "Echo Token", category: "material", maxStack: 99, iconId: "dungeon-token", rarity: "uncommon", description: "Bunker secure reward currency." }),
  def({ id: "bunker-keycard-l2", displayName: "Security Card L2", category: "material", maxStack: 1, iconId: "bunker-keycard-l2", rarity: "rare", description: "Opens mid floors." }),
  def({ id: "bunker-keycard-l3", displayName: "Security Card L3", category: "material", maxStack: 1, iconId: "bunker-keycard-l3", rarity: "epic", description: "Opens deep floors." }),
  def({ id: "filter-cartridge", displayName: "Filter Cartridge", category: "material", maxStack: 10, iconId: "filter-cartridge", rarity: "uncommon", description: "Hazmat breathing filter." }),
  def({ id: "field-carrier-pack", displayName: "Field Carrier Pack", category: "gear", maxStack: 1, iconId: "field-carrier-pack", rarity: "epic", description: "Endgame backpack +20 slots.", backpack: { extraSlots: 20 } }),
  def({ id: "composite-helmet", displayName: "Composite Helmet", category: "armor", maxStack: 1, iconId: "composite-helmet", rarity: "epic", equipment: { slot: "head", armor: 8 } }),
  def({ id: "composite-chest", displayName: "Composite Chest", category: "armor", maxStack: 1, iconId: "composite-chest", rarity: "epic", equipment: { slot: "torso", armor: 14 } }),
  def({ id: "composite-legs", displayName: "Composite Legs", category: "armor", maxStack: 1, iconId: "composite-legs", rarity: "epic", equipment: { slot: "legs", armor: 10 } }),
  def({ id: "composite-boots", displayName: "Composite Boots", category: "armor", maxStack: 1, iconId: "composite-boots", rarity: "epic", equipment: { slot: "feet", armor: 5 } }),
  def({ id: "hazmat-hood", displayName: "Hazmat Hood", category: "armor", maxStack: 1, iconId: "hazmat-hood", rarity: "rare", equipment: { slot: "head", armor: 3, gasResistance: 0.9 } }),
  def({ id: "hazmat-suit", displayName: "Hazmat Suit", category: "armor", maxStack: 1, iconId: "hazmat-suit", rarity: "rare", equipment: { slot: "torso", armor: 6, gasResistance: 0.9 } }),
  def({ id: "tactical-axe", displayName: "Tactical Axe", category: "tool", maxStack: 1, iconId: "tactical-axe", rarity: "rare", maxDurability: 120, meleeCombat: { damage: 14, attacksPerSecond: 0.9 } }),
  def({ id: "sledgehammer", displayName: "Sledgehammer", category: "tool", maxStack: 1, iconId: "sledgehammer", rarity: "uncommon", maxDurability: 100, meleeCombat: { damage: 16, attacksPerSecond: 0.65, hitRange: 1.25 } }),
  def({ id: "survival-knife", displayName: "Survival Knife", category: "tool", maxStack: 1, iconId: "survival-knife", maxDurability: 60, meleeCombat: { damage: 7, attacksPerSecond: 1.7, hitRange: 1.0 } }),
  def({ id: "service-pistol", displayName: "Service Pistol", category: "tool", maxStack: 1, iconId: "service-pistol", rarity: "uncommon", maxDurability: 90, description: "Ranged-capable firearm tier." }),
  def({ id: "pump-scattergun", displayName: "Pump Scattergun", category: "tool", maxStack: 1, iconId: "pump-scattergun", rarity: "rare", maxDurability: 90, description: "Ranged-capable firearm tier." }),
  def({ id: "hunting-carbine", displayName: "Hunting Carbine", category: "tool", maxStack: 1, iconId: "hunting-carbine", rarity: "rare", maxDurability: 90, description: "Ranged-capable firearm tier." }),
  def({ id: "helix-edge", displayName: "Helix Edge", category: "tool", maxStack: 1, iconId: "helix-edge", rarity: "epic", maxDurability: 200, meleeCombat: { damage: 26, attacksPerSecond: 0.95, hitRange: 1.35 }, description: "Unique Helix Core reward." }),
  def({ id: "smg-kit", displayName: "Compact Automatic", category: "tool", maxStack: 1, iconId: "smg-kit", rarity: "rare", maxDurability: 90, description: "Ranged-capable firearm tier." }),
  def({ id: "reinforced-grip-mod", displayName: "Reinforced Grip", category: "material", maxStack: 5, iconId: "reinforced-grip-mod", rarity: "uncommon", description: "Weapon mod: grip." }),
  def({ id: "extended-mag-mod", displayName: "Extended Magazine", category: "material", maxStack: 5, iconId: "extended-mag-mod", rarity: "uncommon", description: "Weapon mod: magazine." }),
  def({ id: "simple-optic-mod", displayName: "Simple Optic", category: "material", maxStack: 5, iconId: "simple-optic-mod", rarity: "uncommon", description: "Weapon mod: sight." }),
  def({ id: "solar-panel", displayName: "Solar Panel", category: "material", maxStack: 5, iconId: "solar-panel", rarity: "rare", description: "Base power device part." }),
  def({ id: "battery-bank-core", displayName: "Battery Bank Core", category: "material", maxStack: 3, iconId: "battery-bank-core", rarity: "rare", description: "Energy storage core." }),
  def({ id: "fabrication-frame", displayName: "Fabrication Frame", category: "material", maxStack: 5, iconId: "fabrication-frame", rarity: "epic", description: "Advanced station frame." }),
  def({ id: "glass-pane", displayName: "Glass Pane", category: "material", maxStack: 20, iconId: "glass-pane", description: "Salvaged vehicle glass." }),
  // ── Pass 5 content saturation ──
  def({ id: "branch", displayName: "Branch", category: "material", maxStack: 40, iconId: "branch", rarity: "common", description: "Snap branches for sticks and fire." }),
  def({ id: "wood-chips", displayName: "Wood Chips", category: "material", maxStack: 50, iconId: "wood-chips", rarity: "common", description: "Shavings for compost and fuel." }),
  def({ id: "reinforced-board", displayName: "Reinforced Board", category: "material", maxStack: 20, iconId: "reinforced-board", rarity: "uncommon", description: "Hardened structural board." }),
  def({ id: "iron-rod", displayName: "Iron Rod", category: "material", maxStack: 25, iconId: "iron-rod", rarity: "common", description: "Round stock for frames and weapons." }),
  def({ id: "iron-wire", displayName: "Iron Wire", category: "material", maxStack: 30, iconId: "iron-wire", rarity: "common", description: "Drawn iron wire." }),
  def({ id: "iron-plate", displayName: "Iron Plate", category: "material", maxStack: 20, iconId: "iron-plate", rarity: "common", description: "Flattened iron sheet." }),
  def({ id: "iron-pipe", displayName: "Iron Pipe", category: "material", maxStack: 15, iconId: "iron-pipe", rarity: "uncommon", description: "Hollow iron conduit." }),
  def({ id: "copper-coil", displayName: "Copper Coil", category: "material", maxStack: 15, iconId: "copper-coil", rarity: "uncommon", description: "Wound copper for motors." }),
  def({ id: "electrical-contacts", displayName: "Electrical Contacts", category: "material", maxStack: 15, iconId: "electrical-contacts", rarity: "uncommon", description: "Terminal pads for circuits." }),
  def({ id: "aluminum-wire", displayName: "Aluminum Wire", category: "material", maxStack: 25, iconId: "aluminum-wire", rarity: "uncommon", description: "Lightweight conductive wire." }),
  def({ id: "lightweight-frame", displayName: "Lightweight Frame", category: "material", maxStack: 10, iconId: "lightweight-frame", rarity: "rare", description: "Aluminum structural frame." }),
  def({ id: "steel-rod", displayName: "Steel Rod", category: "material", maxStack: 20, iconId: "steel-rod", rarity: "uncommon", description: "Stiff steel stock." }),
  def({ id: "hardened-steel", displayName: "Hardened Steel", category: "material", maxStack: 12, iconId: "hardened-steel", rarity: "rare", description: "Heat-treated steel stock." }),
  def({ id: "reinforced-steel-plate", displayName: "Reinforced Steel Plate", category: "material", maxStack: 10, iconId: "reinforced-steel-plate", rarity: "rare", description: "Heavy armor/structure plate." }),
  def({ id: "lightweight-alloy", displayName: "Lightweight Alloy", category: "material", maxStack: 10, iconId: "lightweight-alloy", rarity: "epic", description: "Endgame light alloy." }),
  def({ id: "heat-resistant-alloy", displayName: "Heat Resistant Alloy", category: "material", maxStack: 8, iconId: "heat-resistant-alloy", rarity: "epic", description: "Withstands furnace temperatures." }),
  def({ id: "corrosion-resistant-alloy", displayName: "Corrosion Resistant Alloy", category: "material", maxStack: 8, iconId: "corrosion-resistant-alloy", rarity: "epic", description: "Exclusion-safe metal." }),
  def({ id: "technical-fabric", displayName: "Technical Fabric", category: "material", maxStack: 12, iconId: "technical-fabric", rarity: "rare", description: "Synthetic weave for gear." }),
  def({ id: "composite-fiber", displayName: "Composite Fiber", category: "material", maxStack: 10, iconId: "composite-fiber", rarity: "epic", description: "High-tensile fiber weave." }),
  def({ id: "treated-leather", displayName: "Treated Leather", category: "material", maxStack: 15, iconId: "treated-leather", rarity: "uncommon", description: "Oiled durable hide." }),
  def({ id: "reinforced-leather", displayName: "Reinforced Leather", category: "material", maxStack: 12, iconId: "reinforced-leather", rarity: "rare", description: "Layered combat leather." }),
  def({ id: "insulated-hide", displayName: "Insulated Hide", category: "material", maxStack: 12, iconId: "insulated-hide", rarity: "rare", description: "Fur-backed cold protection." }),
  def({ id: "rubber-strip", displayName: "Rubber Strip", category: "material", maxStack: 25, iconId: "rubber-strip", rarity: "common", description: "Cut rubber banding." }),
  def({ id: "rubber-seal", displayName: "Rubber Seal", category: "material", maxStack: 15, iconId: "rubber-seal", rarity: "uncommon", description: "Waterproof gasket." }),
  def({ id: "tire-material", displayName: "Tire Material", category: "material", maxStack: 15, iconId: "tire-material", rarity: "uncommon", description: "Vehicle rubber compound." }),
  def({ id: "reinforced-rubber", displayName: "Reinforced Rubber", category: "material", maxStack: 12, iconId: "reinforced-rubber", rarity: "rare", description: "Wire-embedded rubber." }),
  def({ id: "polymer-housing", displayName: "Polymer Housing", category: "material", maxStack: 12, iconId: "polymer-housing", rarity: "rare", description: "Device casing shell." }),
  def({ id: "synthetic-resin", displayName: "Synthetic Resin", category: "material", maxStack: 20, iconId: "synthetic-resin", rarity: "uncommon", description: "Casting/adhesive resin." }),
  def({ id: "industrial-adhesive", displayName: "Industrial Adhesive", category: "material", maxStack: 15, iconId: "industrial-adhesive", rarity: "uncommon", description: "High-strength glue." }),
  def({ id: "sealant", displayName: "Sealant", category: "material", maxStack: 15, iconId: "sealant", rarity: "uncommon", description: "Weatherproof seal compound." }),
  def({ id: "valve", displayName: "Valve", category: "material", maxStack: 15, iconId: "valve", rarity: "uncommon", description: "Flow control fitting." }),
  def({ id: "coupling", displayName: "Coupling", category: "material", maxStack: 15, iconId: "coupling", rarity: "uncommon", description: "Pipe join fitting." }),
  def({ id: "small-mechanism", displayName: "Small Mechanism", category: "material", maxStack: 12, iconId: "small-mechanism", rarity: "uncommon", description: "Clockwork subassembly." }),
  def({ id: "precision-mechanism", displayName: "Precision Mechanism", category: "material", maxStack: 8, iconId: "precision-mechanism", rarity: "rare", description: "Fine machined assembly." }),
  def({ id: "transmission-part", displayName: "Transmission Part", category: "material", maxStack: 8, iconId: "transmission-part", rarity: "rare", description: "Vehicle drivetrain piece." }),
  def({ id: "transformer-part", displayName: "Transformer Part", category: "material", maxStack: 10, iconId: "transformer-part", rarity: "rare", description: "Power conversion core." }),
  def({ id: "relay", displayName: "Relay", category: "material", maxStack: 15, iconId: "relay", rarity: "uncommon", description: "Switched electrical contact." }),
  def({ id: "sensor", displayName: "Sensor", category: "material", maxStack: 12, iconId: "sensor", rarity: "rare", description: "Detection module." }),
  def({ id: "control-module", displayName: "Control Module", category: "material", maxStack: 8, iconId: "control-module", rarity: "rare", description: "Station controller board." }),
  def({ id: "processor-module", displayName: "Processor Module", category: "material", maxStack: 6, iconId: "processor-module", rarity: "epic", description: "Advanced logic unit." }),
  def({ id: "industrial-controller", displayName: "Industrial Controller", category: "material", maxStack: 5, iconId: "industrial-controller", rarity: "epic", description: "Facility automation brain." }),
  def({ id: "navigation-module", displayName: "Navigation Module", category: "material", maxStack: 5, iconId: "navigation-module", rarity: "epic", description: "Guidance/map electronics." }),
  def({ id: "industrial-reagent", displayName: "Industrial Reagent", category: "material", maxStack: 20, iconId: "industrial-reagent", rarity: "uncommon", description: "Process chemical." }),
  def({ id: "acidic-reagent", displayName: "Acidic Reagent", category: "material", maxStack: 15, iconId: "acidic-reagent", rarity: "rare", description: "Handle with protection." }),
  def({ id: "fuel-additive", displayName: "Fuel Additive", category: "material", maxStack: 15, iconId: "fuel-additive", rarity: "uncommon", description: "Improves combustion burn." }),
  def({ id: "activated-carbon", displayName: "Activated Carbon", category: "material", maxStack: 20, iconId: "activated-carbon", rarity: "uncommon", description: "Filter media." }),
  def({ id: "roofing-material", displayName: "Roofing Material", category: "material", maxStack: 15, iconId: "roofing-material", rarity: "uncommon", description: "Shelter covering sheets." }),
  def({ id: "fastener-pack", displayName: "Fastener Pack", category: "material", maxStack: 20, iconId: "fastener-pack", rarity: "common", description: "Mixed nails, bolts, screws." }),
  def({ id: "broken-glass", displayName: "Broken Glass", category: "material", maxStack: 30, iconId: "broken-glass", rarity: "common", description: "Dangerous shards — reprocess carefully." }),
  def({ id: "reinforced-glass", displayName: "Reinforced Glass", category: "material", maxStack: 12, iconId: "reinforced-glass", rarity: "rare", description: "Laminated security glass." }),
  def({ id: "optical-glass", displayName: "Optical Glass", category: "material", maxStack: 8, iconId: "optical-glass", rarity: "rare", description: "Clear glass for optics." }),
  def({ id: "heat-resistant-ceramic", displayName: "Heat Resistant Ceramic", category: "material", maxStack: 10, iconId: "heat-resistant-ceramic", rarity: "rare", description: "Kiln-stable ceramic." }),
  def({ id: "rain-water", displayName: "Rain Water", category: "consumable", maxStack: 10, iconId: "rain-water", rarity: "common", description: "Collected runoff — purify first.", quickSlot: true, consumable: {kind:"drink",amount:12,useTime:0.8,rejectWhenFull:true} }),
  def({ id: "water-container", displayName: "Water Container", category: "material", maxStack: 5, iconId: "water-container", rarity: "uncommon", description: "Bulk liquid vessel." }),
  def({ id: "refined-fuel", displayName: "Refined Fuel", category: "material", maxStack: 10, iconId: "refined-fuel", rarity: "rare", description: "Clean-burning refined fuel." }),
  def({ id: "generator-fuel", displayName: "Generator Fuel", category: "material", maxStack: 8, iconId: "generator-fuel", rarity: "uncommon", description: "Stationary generator mix." }),
  def({ id: "lubricant", displayName: "Lubricant", category: "material", maxStack: 15, iconId: "lubricant", rarity: "uncommon", description: "Keeps mechanisms free." }),
  def({ id: "soil", displayName: "Soil", category: "material", maxStack: 30, iconId: "soil", rarity: "common", description: "Planting medium." }),
  def({ id: "corn-seeds", displayName: "Corn Seeds", category: "material", maxStack: 30, iconId: "corn-seeds", rarity: "common", description: "Field crop seeds." }),
  def({ id: "bean-seeds", displayName: "Bean Seeds", category: "material", maxStack: 30, iconId: "bean-seeds", rarity: "common", description: "Climbing bean seeds." }),
  def({ id: "rare-seeds", displayName: "Rare Seeds", category: "material", maxStack: 10, iconId: "rare-seeds", rarity: "rare", description: "High-yield experimental seed stock." }),
  def({ id: "corn", displayName: "Corn", category: "consumable", maxStack: 15, iconId: "corn", rarity: "common", description: "Raw cereal crop.", quickSlot: true, consumable: {kind:"food",amount:14,useTime:1,rejectWhenFull:true} }),
  def({ id: "beans", displayName: "Beans", category: "consumable", maxStack: 15, iconId: "beans", rarity: "common", description: "Protein legumes.", quickSlot: true, consumable: {kind:"food",amount:14,useTime:1,rejectWhenFull:true} }),
  def({ id: "dry-food", displayName: "Dry Rations", category: "consumable", maxStack: 12, iconId: "dry-food", rarity: "common", description: "Long-life dry pack.", quickSlot: true, consumable: {kind:"food",amount:28,useTime:1.2,rejectWhenFull:true} }),
  def({ id: "preserved-food", displayName: "Preserved Food", category: "consumable", maxStack: 10, iconId: "preserved-food", rarity: "uncommon", description: "Cured sealed meal.", quickSlot: true, consumable: {kind:"food",amount:40,useTime:1.3,rejectWhenFull:true} }),
  def({ id: "vegetable-soup", displayName: "Vegetable Soup", category: "consumable", maxStack: 8, iconId: "vegetable-soup", rarity: "uncommon", description: "Warm vegetable broth.", quickSlot: true, consumable: {kind:"food",amount:35,useTime:1.5,rejectWhenFull:true} }),
  def({ id: "meat-stew", displayName: "Meat Stew", category: "consumable", maxStack: 8, iconId: "meat-stew", rarity: "uncommon", description: "Hearty stew.", quickSlot: true, consumable: {kind:"food",amount:50,useTime:1.6,rejectWhenFull:true} }),
  def({ id: "mushroom-soup", displayName: "Mushroom Soup", category: "consumable", maxStack: 8, iconId: "mushroom-soup", rarity: "uncommon", description: "Earthy forest soup.", quickSlot: true, consumable: {kind:"food",amount:32,useTime:1.4,rejectWhenFull:true} }),
  def({ id: "survival-meal", displayName: "Survival Meal", category: "consumable", maxStack: 6, iconId: "survival-meal", rarity: "rare", description: "Balanced field meal.", quickSlot: true, consumable: {kind:"food",amount:55,useTime:1.5,rejectWhenFull:true} }),
  def({ id: "high-energy-meal", displayName: "High Energy Meal", category: "consumable", maxStack: 5, iconId: "high-energy-meal", rarity: "rare", description: "Combat endurance meal.", quickSlot: true, consumable: {kind:"food",amount:65,useTime:1.6,rejectWhenFull:true} }),
  def({ id: "warming-meal", displayName: "Warming Meal", category: "consumable", maxStack: 6, iconId: "warming-meal", rarity: "uncommon", description: "Restores warmth feel.", quickSlot: true, consumable: {kind:"food",amount:40,useTime:1.5,rejectWhenFull:true} }),
  def({ id: "herbal-drink", displayName: "Herbal Drink", category: "consumable", maxStack: 8, iconId: "herbal-drink", rarity: "uncommon", description: "Mild medicinal drink.", quickSlot: true, consumable: {kind:"drink",amount:25,useTime:0.9,rejectWhenFull:true} }),
  def({ id: "warm-drink", displayName: "Warm Drink", category: "consumable", maxStack: 8, iconId: "warm-drink", rarity: "common", description: "Hot tin cup brew.", quickSlot: true, consumable: {kind:"drink",amount:22,useTime:0.8,rejectWhenFull:true} }),
  def({ id: "energy-tonic", displayName: "Energy Tonic", category: "consumable", maxStack: 5, iconId: "energy-tonic", rarity: "rare", description: "Restores stamina energy.", quickSlot: true, consumable: {kind:"drink",amount:40,useTime:0.7,rejectWhenFull:false} }),
  def({ id: "sterile-bandage", displayName: "Sterile Bandage", category: "consumable", maxStack: 10, iconId: "sterile-bandage", rarity: "uncommon", description: "Clean wound wrap.", quickSlot: true, consumable: {kind:"heal",amount:40,useTime:1.1,rejectWhenFull:true} }),
  def({ id: "advanced-medical-kit", displayName: "Advanced Medical Kit", category: "consumable", maxStack: 3, iconId: "advanced-medical-kit", rarity: "rare", description: "Field trauma kit.", quickSlot: true, consumable: {kind:"heal",amount:75,useTime:2.2,rejectWhenFull:true} }),
  def({ id: "bleeding-treatment", displayName: "Bleeding Treatment", category: "consumable", maxStack: 8, iconId: "bleeding-treatment", rarity: "uncommon", description: "Clotting dressing.", quickSlot: true, consumable: {kind:"heal",amount:20,useTime:1,rejectWhenFull:false} }),
  def({ id: "toxic-treatment", displayName: "Toxic Exposure Treatment", category: "consumable", maxStack: 6, iconId: "toxic-treatment", rarity: "rare", description: "Counters poison exposure.", quickSlot: true, consumable: {kind:"heal",amount:15,useTime:1.2,rejectWhenFull:false} }),
  def({ id: "empty-can", displayName: "Empty Can", category: "material", maxStack: 30, iconId: "empty-can", rarity: "common", description: "Scrap can for salvage." }),
  def({ id: "broken-tool", displayName: "Broken Tool", category: "material", maxStack: 10, iconId: "broken-tool", rarity: "common", description: "Salvage for parts." }),
  def({ id: "broken-radio", displayName: "Broken Radio", category: "material", maxStack: 5, iconId: "broken-radio", rarity: "uncommon", description: "Dead electronics salvage." }),
  def({ id: "scrap-device", displayName: "Scrap Device", category: "material", maxStack: 8, iconId: "scrap-device", rarity: "uncommon", description: "Unknown junk electronics." }),
  def({ id: "bent-pipe", displayName: "Bent Pipe", category: "material", maxStack: 15, iconId: "bent-pipe", rarity: "common", description: "Damaged pipe stock." }),
  def({ id: "rusted-mechanism", displayName: "Rusted Mechanism", category: "material", maxStack: 10, iconId: "rusted-mechanism", rarity: "common", description: "Seized mechanism — salvage metal." }),
  def({ id: "old-coin", displayName: "Old Coin", category: "material", maxStack: 50, iconId: "old-coin", rarity: "uncommon", description: "Soft barter valuable." }),
  def({ id: "antique-watch", displayName: "Antique Watch", category: "material", maxStack: 5, iconId: "antique-watch", rarity: "rare", description: "Trade curiosity." }),
  def({ id: "sealed-electronics", displayName: "Sealed Electronics", category: "material", maxStack: 5, iconId: "sealed-electronics", rarity: "rare", description: "Factory-sealed board." }),
  def({ id: "rare-component", displayName: "Rare Component", category: "material", maxStack: 5, iconId: "rare-component", rarity: "epic", description: "Scarce fabrication piece." }),
  def({ id: "map-fragment", displayName: "Map Fragment", category: "material", maxStack: 10, iconId: "map-fragment", rarity: "uncommon", description: "Partial chart of a region." }),
  def({ id: "quest-package", displayName: "Sealed Package", category: "material", maxStack: 1, iconId: "quest-package", rarity: "uncommon", description: "Delivery package for NPCs." }),
  def({ id: "medical-sample", displayName: "Medical Sample", category: "material", maxStack: 5, iconId: "medical-sample", rarity: "rare", description: "Quarantine specimen." }),
  def({ id: "lost-supplies", displayName: "Lost Supplies", category: "material", maxStack: 3, iconId: "lost-supplies", rarity: "uncommon", description: "Recovered cache crate contents marker." }),
  def({ id: "blueprint-tool", displayName: "Tool Blueprint", category: "material", maxStack: 1, iconId: "blueprint-tool", rarity: "rare", description: "Unlocks advanced tool crafts." }),
  def({ id: "blueprint-weapon", displayName: "Weapon Blueprint", category: "material", maxStack: 1, iconId: "blueprint-weapon", rarity: "rare", description: "Unlocks mid-tier weapon crafts." }),
  def({ id: "blueprint-station", displayName: "Station Blueprint", category: "material", maxStack: 1, iconId: "blueprint-station", rarity: "epic", description: "Unlocks station upgrades." }),
  def({ id: "stone-hatchet", displayName: "Stone Hatchet", category: "tool", maxStack: 1, iconId: "stone-hatchet", rarity: "common", maxDurability: 40, meleeCombat: {damage:6,attacksPerSecond:0.95}, description: "Primitive tree tool." }),
  def({ id: "steel-hatchet", displayName: "Steel Hatchet", category: "tool", maxStack: 1, iconId: "steel-hatchet", rarity: "rare", maxDurability: 140, meleeCombat: {damage:12,attacksPerSecond:0.95}, description: "Hardened steel felling axe." }),
  def({ id: "stone-pickaxe", displayName: "Stone Pickaxe", category: "tool", maxStack: 1, iconId: "stone-pickaxe", rarity: "common", maxDurability: 40, meleeCombat: {damage:6,attacksPerSecond:1.15}, description: "Primitive mining tool." }),
  def({ id: "steel-pickaxe", displayName: "Steel Pickaxe", category: "tool", maxStack: 1, iconId: "steel-pickaxe", rarity: "rare", maxDurability: 140, meleeCombat: {damage:12,attacksPerSecond:1.15}, description: "Hardened mining pick." }),
  def({ id: "advanced-fishing-rod", displayName: "Advanced Fishing Rod", category: "tool", maxStack: 1, iconId: "advanced-fishing-rod", rarity: "uncommon", maxDurability: 80, description: "Better catch rates on open water." }),
  def({ id: "pipe-club", displayName: "Pipe Club", category: "tool", maxStack: 1, iconId: "pipe-club", rarity: "common", maxDurability: 70, meleeCombat: {damage:10,attacksPerSecond:1}, description: "Makeshift bludgeon." }),
  def({ id: "machete", displayName: "Machete", category: "tool", maxStack: 1, iconId: "machete", rarity: "uncommon", maxDurability: 90, meleeCombat: {damage:13,attacksPerSecond:1.15,hitRange:1.2}, description: "Brush and combat blade." }),
  def({ id: "cleaver", displayName: "Cleaver", category: "tool", maxStack: 1, iconId: "cleaver", rarity: "uncommon", maxDurability: 85, meleeCombat: {damage:14,attacksPerSecond:1}, description: "Heavy chopping blade." }),
  def({ id: "metal-hammer", displayName: "Metal Hammer", category: "tool", maxStack: 1, iconId: "metal-hammer", rarity: "uncommon", maxDurability: 95, meleeCombat: {damage:12,attacksPerSecond:0.9}, description: "Repair and smash tool." }),
  def({ id: "long-spear", displayName: "Long Spear", category: "tool", maxStack: 1, iconId: "long-spear", rarity: "rare", maxDurability: 120, meleeCombat: {damage:14,attacksPerSecond:0.95,hitRange:1.65}, description: "Extended reach polearm." }),
  def({ id: "heavy-axe", displayName: "Heavy Axe", category: "tool", maxStack: 1, iconId: "heavy-axe", rarity: "rare", maxDurability: 110, meleeCombat: {damage:18,attacksPerSecond:0.7,hitRange:1.25}, description: "Two-handed felling weapon." }),
  def({ id: "composite-axe", displayName: "Composite Axe", category: "tool", maxStack: 1, iconId: "composite-axe", rarity: "epic", maxDurability: 160, meleeCombat: {damage:20,attacksPerSecond:0.85,hitRange:1.2}, description: "Endgame hybrid combat axe." }),
  def({ id: "hardened-machete", displayName: "Hardened Machete", category: "tool", maxStack: 1, iconId: "hardened-machete", rarity: "epic", maxDurability: 150, meleeCombat: {damage:18,attacksPerSecond:1.1,hitRange:1.25}, description: "Military-grade bush blade." }),
  def({ id: "tactical-spear", displayName: "Tactical Spear", category: "tool", maxStack: 1, iconId: "tactical-spear", rarity: "epic", maxDurability: 160, meleeCombat: {damage:17,attacksPerSecond:1,hitRange:1.7}, description: "Precision endgame spear." }),
  def({ id: "industrial-hammer", displayName: "Industrial Hammer", category: "tool", maxStack: 1, iconId: "industrial-hammer", rarity: "epic", maxDurability: 170, meleeCombat: {damage:22,attacksPerSecond:0.65,hitRange:1.3}, description: "Breaker-class heavy hammer." }),
  def({ id: "hunting-bow", displayName: "Hunting Bow", category: "tool", maxStack: 1, iconId: "hunting-bow", rarity: "uncommon", maxDurability: 70, description: "Quiet ranged hunting weapon." }),
  def({ id: "improvised-pistol", displayName: "Improvised Pistol", category: "tool", maxStack: 1, iconId: "improvised-pistol", rarity: "uncommon", maxDurability: 50, description: "Unstable short-range firearm." }),
  def({ id: "heavy-pistol", displayName: "Heavy Pistol", category: "tool", maxStack: 1, iconId: "heavy-pistol", rarity: "rare", maxDurability: 100, description: "High-caliber service sidearm." }),
  def({ id: "assault-rifle", displayName: "Assault Rifle", category: "tool", maxStack: 1, iconId: "assault-rifle", rarity: "epic", maxDurability: 120, description: "Automatic mid-range rifle." }),
  def({ id: "tactical-shotgun", displayName: "Tactical Shotgun", category: "tool", maxStack: 1, iconId: "tactical-shotgun", rarity: "epic", maxDurability: 110, description: "Close-quarters combat shotgun." }),
  def({ id: "precision-rifle", displayName: "Precision Rifle", category: "tool", maxStack: 1, iconId: "precision-rifle", rarity: "epic", maxDurability: 130, description: "Long range precision platform." }),
  def({ id: "arrow", displayName: "Arrow", category: "ammo", maxStack: 40, iconId: "arrow", rarity: "common", description: "Shaft for hunting bows." }),
  def({ id: "cloth-hood", displayName: "Cloth Hood", category: "armor", maxStack: 1, iconId: "cloth-hood", rarity: "common", equipment: { slot: "head", armor: 2 } }),
  def({ id: "cloth-tunic", displayName: "Cloth Tunic", category: "armor", maxStack: 1, iconId: "cloth-tunic", rarity: "common", equipment: { slot: "torso", armor: 4 } }),
  def({ id: "cloth-wraps", displayName: "Cloth Wraps", category: "armor", maxStack: 1, iconId: "cloth-wraps", rarity: "common", equipment: { slot: "legs", armor: 3 } }),
  def({ id: "cloth-wraps-feet", displayName: "Cloth Footwraps", category: "armor", maxStack: 1, iconId: "cloth-wraps-feet", rarity: "common", equipment: { slot: "feet", armor: 1 } }),
  def({ id: "leather-cap", displayName: "Leather Cap", category: "armor", maxStack: 1, iconId: "leather-cap", rarity: "uncommon", equipment: { slot: "head", armor: 4 } }),
  def({ id: "leather-jacket", displayName: "Leather Jacket", category: "armor", maxStack: 1, iconId: "leather-jacket", rarity: "uncommon", equipment: { slot: "torso", armor: 7 } }),
  def({ id: "leather-pants", displayName: "Leather Pants", category: "armor", maxStack: 1, iconId: "leather-pants", rarity: "uncommon", equipment: { slot: "legs", armor: 5 } }),
  def({ id: "leather-boots", displayName: "Leather Boots", category: "armor", maxStack: 1, iconId: "leather-boots", rarity: "uncommon", equipment: { slot: "feet", armor: 3 } }),
  def({ id: "tactical-helmet", displayName: "Tactical Helmet", category: "armor", maxStack: 1, iconId: "tactical-helmet", rarity: "rare", equipment: { slot: "head", armor: 7 } }),
  def({ id: "tactical-pants", displayName: "Tactical Pants", category: "armor", maxStack: 1, iconId: "tactical-pants", rarity: "rare", equipment: { slot: "legs", armor: 8 } }),
  def({ id: "tactical-boots", displayName: "Tactical Boots", category: "armor", maxStack: 1, iconId: "tactical-boots", rarity: "rare", equipment: { slot: "feet", armor: 4 } }),
  def({ id: "heavy-helmet", displayName: "Heavy Helmet", category: "armor", maxStack: 1, iconId: "heavy-helmet", rarity: "rare", equipment: { slot: "head", armor: 10 } }),
  def({ id: "heavy-plate", displayName: "Heavy Plate", category: "armor", maxStack: 1, iconId: "heavy-plate", rarity: "rare", equipment: { slot: "torso", armor: 16 } }),
  def({ id: "heavy-greaves", displayName: "Heavy Greaves", category: "armor", maxStack: 1, iconId: "heavy-greaves", rarity: "rare", equipment: { slot: "legs", armor: 12 } }),
  def({ id: "heavy-sabatons", displayName: "Heavy Sabatons", category: "armor", maxStack: 1, iconId: "heavy-sabatons", rarity: "rare", equipment: { slot: "feet", armor: 6 } }),
]);

export class ItemRegistry {
  private readonly definitions: ReadonlyMap<ItemId, ItemDefinition>;
  private readonly all: readonly ItemDefinition[];

  constructor(definitions: readonly ItemDefinition[]) {
    const map = new Map<ItemId, ItemDefinition>();
    for (const definition of definitions) {
      if (map.has(definition.id)) throw new Error(`Duplicate item definition: ${definition.id}`);
      if (!Number.isInteger(definition.maxStack) || definition.maxStack < 1) throw new Error(`Invalid max stack for item: ${definition.id}`);
      if (definition.category === "armor") {
        if (!definition.equipment || !EQUIPMENT_SLOT_IDS.includes(definition.equipment.slot) || !Number.isFinite(definition.equipment.armor) || definition.equipment.armor < 0) {
          throw new Error(`Invalid equipment metadata for item: ${definition.id}`);
        }
      } else if (definition.equipment) throw new Error(`Non-armor item cannot declare equipment metadata: ${definition.id}`);
      if (definition.maxDurability !== undefined) {
        if (definition.category !== "tool") throw new Error(`Only tools may declare maxDurability: ${definition.id}`);
        if (!Number.isInteger(definition.maxDurability) || definition.maxDurability < 1) {
          throw new Error(`Invalid maxDurability for item: ${definition.id}`);
        }
      }
      if (definition.meleeCombat !== undefined) {
        if (!Number.isFinite(definition.meleeCombat.damage) || definition.meleeCombat.damage <= 0) {
          throw new Error(`Invalid melee damage for item: ${definition.id}`);
        }
        if (!Number.isFinite(definition.meleeCombat.attacksPerSecond) || definition.meleeCombat.attacksPerSecond <= 0) {
          throw new Error(`Invalid melee attack speed for item: ${definition.id}`);
        }
        if (definition.meleeCombat.hitRange !== undefined
          && (!Number.isFinite(definition.meleeCombat.hitRange) || definition.meleeCombat.hitRange <= 0)) {
          throw new Error(`Invalid melee hitRange for item: ${definition.id}`);
        }
      }
      if (definition.backpack !== undefined) {
        if (definition.category !== "gear") throw new Error(`Only gear may declare backpack metadata: ${definition.id}`);
        if (!Number.isInteger(definition.backpack.extraSlots) || definition.backpack.extraSlots < 1) {
          throw new Error(`Invalid backpack.extraSlots for item: ${definition.id}`);
        }
      } else if (definition.category === "gear") {
        throw new Error(`Gear item must declare backpack metadata: ${definition.id}`);
      }
      if (definition.consumable !== undefined) {
        if (definition.category !== "consumable") throw new Error(`Only consumable category may declare consumable metadata: ${definition.id}`);
        if (!Number.isFinite(definition.consumable.amount) || definition.consumable.amount <= 0) {
          throw new Error(`Invalid consumable amount: ${definition.id}`);
        }
      } else if (definition.category === "consumable") {
        throw new Error(`Consumable item must declare consumable metadata: ${definition.id}`);
      }
      map.set(definition.id, definition);
    }
    this.definitions = map;
    this.all = Object.freeze([...map.values()]);
  }

  has(id: string): id is ItemId { return this.definitions.has(id as ItemId); }

  get(id: ItemId | string): ItemDefinition {
    const definition = this.definitions.get(id as ItemId);
    if (!definition) throw new Error(`Unknown item definition: ${id}`);
    return definition;
  }

  getAll(): readonly ItemDefinition[] { return this.all; }
}

export const ITEM_REGISTRY = new ItemRegistry(INITIAL_DEFINITIONS);

export function createItemStack(itemId: ItemId, quantity: number, options?: ItemStackCreateOptions): ItemStack {
  const definition = ITEM_REGISTRY.get(itemId);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > definition.maxStack) {
    throw new RangeError(`Invalid ${itemId} stack quantity ${quantity}; expected 1..${definition.maxStack}`);
  }
  const maxDurability = definition.maxDurability;
  if (maxDurability === undefined) {
    if (options?.currentDurability !== undefined) {
      throw new RangeError(`Item ${itemId} does not support durability`);
  }
  return Object.freeze({ itemId, quantity });
  }
  const currentDurability = options?.currentDurability ?? maxDurability;
  if (!Number.isInteger(currentDurability) || currentDurability < 1 || currentDurability > maxDurability) {
    throw new RangeError(`Invalid ${itemId} durability ${currentDurability}; expected 1..${maxDurability}`);
  }
  return Object.freeze({ itemId, quantity, currentDurability });
}

export function cloneItemStack(stack: ItemStack): ItemStack {
  return stack.currentDurability === undefined
    ? createItemStack(stack.itemId, stack.quantity)
    : createItemStack(stack.itemId, stack.quantity, { currentDurability: stack.currentDurability });
}

export function createItemStacks(itemId: ItemId, totalQuantity: number): readonly ItemStack[] {
  if (!Number.isInteger(totalQuantity) || totalQuantity < 1) throw new RangeError(`Invalid total item quantity: ${totalQuantity}`);
  const maxStack = ITEM_REGISTRY.get(itemId).maxStack;
  const stacks: ItemStack[] = [];
  let remaining = totalQuantity;
  while (remaining > 0) {
    const quantity = Math.min(maxStack, remaining);
    stacks.push(createItemStack(itemId, quantity));
    remaining -= quantity;
  }
  return Object.freeze(stacks);
}

export function mergeItemStacks(left: ItemStack, right: ItemStack): StackMergeResult {
  validateStack(left);
  validateStack(right);
  if (left.itemId !== right.itemId) throw new Error(`Cannot merge different item types: ${left.itemId} and ${right.itemId}`);
  if (left.currentDurability !== undefined || right.currentDurability !== undefined) {
    throw new Error(`Cannot merge durable tool stacks: ${left.itemId}`);
  }
  const maxStack = ITEM_REGISTRY.get(left.itemId).maxStack;
  const combined = left.quantity + right.quantity;
  return Object.freeze({
    stack: createItemStack(left.itemId, Math.min(maxStack, combined)),
    remainder: combined > maxStack ? createItemStack(left.itemId, combined - maxStack) : null,
  });
}

export function createItemResult(sourceId: string, itemId: ItemId, quantity: number): ItemResult {
  if (!sourceId) throw new Error("Item result source ID is required");
  return Object.freeze({ sourceId, itemId, quantity, stacks: createItemStacks(itemId, quantity) });
}

export function stackDurability(stack: ItemStack): { readonly current: number; readonly max: number } | null {
  const max = ITEM_REGISTRY.get(stack.itemId).maxDurability;
  if (max === undefined) return null;
  const current = stack.currentDurability;
  if (current === undefined || !Number.isInteger(current) || current < 1 || current > max) {
    throw new RangeError(`Invalid durable stack state for ${stack.itemId}: ${String(current)} / ${max}`);
  }
  return Object.freeze({ current, max });
}

function validateStack(stack: ItemStack): void {
  const definition = ITEM_REGISTRY.get(stack.itemId);
  if (!Number.isInteger(stack.quantity) || stack.quantity < 1 || stack.quantity > definition.maxStack) {
    throw new RangeError(`Invalid ${stack.itemId} stack quantity: ${stack.quantity}`);
  }
  if (definition.maxDurability === undefined) {
    if (stack.currentDurability !== undefined) throw new RangeError(`Non-durable ${stack.itemId} has currentDurability`);
    return;
  }
  if (!Number.isInteger(stack.currentDurability) || stack.currentDurability! < 1 || stack.currentDurability! > definition.maxDurability) {
    throw new RangeError(`Invalid ${stack.itemId} durability: ${String(stack.currentDurability)}`);
  }
}
