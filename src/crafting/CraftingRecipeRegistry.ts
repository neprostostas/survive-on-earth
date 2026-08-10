import { ITEM_REGISTRY, createItemStack } from "../items/ItemSystem.ts";
import type { CraftingRecipeDefinition, CraftingRecipeId } from "./CraftingTypes.ts";

const STARTER_RECIPES: readonly CraftingRecipeDefinition[] = Object.freeze([
  Object.freeze({
    id: "hatchet",
    category: "tools" as const,
    output: createItemStack("hatchet", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "pine-log", quantity: 3 }),
      Object.freeze({ itemId: "limestone", quantity: 3 }),
    ]),
  }),
  Object.freeze({
    id: "pickaxe",
    category: "tools" as const,
    output: createItemStack("pickaxe", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "pine-log", quantity: 3 }),
      Object.freeze({ itemId: "limestone", quantity: 3 }),
    ]),
  }),
  Object.freeze({
    id: "spear",
    category: "weapons" as const,
    output: createItemStack("spear", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "pine-log", quantity: 3 }),
    ]),
  }),
  Object.freeze({
    id: "rope",
    category: "materials" as const,
    output: createItemStack("rope", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "plant-fiber", quantity: 5 }),
    ]),
  }),
  Object.freeze({
    id: "cloth",
    category: "materials" as const,
    output: createItemStack("cloth", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "plant-fiber", quantity: 3 }),
    ]),
  }),
  Object.freeze({
    id: "bandage",
    category: "survival" as const,
    output: createItemStack("bandage", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "cloth", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "basic-backpack",
    category: "survival" as const,
    output: createItemStack("basic-backpack", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "plant-fiber", quantity: 8 }),
      Object.freeze({ itemId: "rope", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "torch",
    category: "survival" as const,
    output: createItemStack("torch", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "pine-log", quantity: 1 }),
      Object.freeze({ itemId: "cloth", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "wooden-club",
    category: "weapons" as const,
    output: createItemStack("wooden-club", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "pine-log", quantity: 4 }),
    ]),
  }),
  Object.freeze({
    id: "stone-knife",
    category: "weapons" as const,
    output: createItemStack("stone-knife", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "stone", quantity: 2 }),
      Object.freeze({ itemId: "plant-fiber", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "wood-plank",
    category: "building" as const,
    output: createItemStack("wood-plank", 2),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "pine-log", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "nails",
    category: "materials" as const,
    output: createItemStack("nails", 4),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "scrap-metal", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "charcoal",
    category: "materials" as const,
    output: createItemStack("charcoal", 2),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "pine-log", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "improved-hatchet",
    category: "tools" as const,
    output: createItemStack("hatchet", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "pine-log", quantity: 2 }),
      Object.freeze({ itemId: "iron-bar", quantity: 2 }),
      Object.freeze({ itemId: "rope", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "improved-pickaxe",
    category: "tools" as const,
    output: createItemStack("pickaxe", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "pine-log", quantity: 2 }),
      Object.freeze({ itemId: "iron-bar", quantity: 2 }),
      Object.freeze({ itemId: "rope", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "simple-shirt",
    category: "armor" as const,
    output: createItemStack("shirt", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "cloth", quantity: 4 }),
      Object.freeze({ itemId: "plant-fiber", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "simple-pants",
    category: "armor" as const,
    output: createItemStack("cargo-pants", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "cloth", quantity: 4 }),
      Object.freeze({ itemId: "rope", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "metal-pipe",
    category: "weapons" as const,
    output: createItemStack("metal-pipe", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "iron-bar", quantity: 2 }),
      Object.freeze({ itemId: "scrap-metal", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "crowbar",
    category: "weapons" as const,
    output: createItemStack("crowbar", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "iron-bar", quantity: 3 }),
      Object.freeze({ itemId: "scrap-metal", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "improved-spear",
    category: "weapons" as const,
    output: createItemStack("improved-spear", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "pine-log", quantity: 2 }),
      Object.freeze({ itemId: "iron-bar", quantity: 1 }),
      Object.freeze({ itemId: "rope", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "sticks",
    category: "materials" as const,
    output: createItemStack("stick", 4),
    ingredients: Object.freeze([Object.freeze({ itemId: "pine-log", quantity: 1 })]),
  }),
  Object.freeze({
    id: "hardwood-plank",
    category: "building" as const,
    output: createItemStack("hardwood-plank", 2),
    ingredients: Object.freeze([Object.freeze({ itemId: "hardwood-log", quantity: 1 })]),
  }),
  Object.freeze({
    id: "stone-block",
    category: "building" as const,
    output: createItemStack("stone-block", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "stone", quantity: 3 }),
      Object.freeze({ itemId: "gravel", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "thick-cloth",
    category: "materials" as const,
    output: createItemStack("thick-cloth", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "cloth", quantity: 2 }),
      Object.freeze({ itemId: "rope", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "leather-from-hide",
    category: "materials" as const,
    output: createItemStack("leather", 1),
    ingredients: Object.freeze([Object.freeze({ itemId: "hide", quantity: 2 })]),
  }),
  Object.freeze({
    id: "iron-bar-smelt",
    category: "materials" as const,
    output: createItemStack("iron-bar", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "iron-ore", quantity: 2 }),
      Object.freeze({ itemId: "charcoal", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "copper-bar-smelt",
    category: "materials" as const,
    output: createItemStack("copper-bar", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "copper-ore", quantity: 2 }),
      Object.freeze({ itemId: "charcoal", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "copper-wire",
    category: "materials" as const,
    output: createItemStack("copper-wire", 2),
    ingredients: Object.freeze([Object.freeze({ itemId: "copper-bar", quantity: 1 })]),
  }),
  Object.freeze({
    id: "steel-bar",
    category: "materials" as const,
    output: createItemStack("steel-bar", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "iron-bar", quantity: 2 }),
      Object.freeze({ itemId: "charcoal", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "metal-plate-forge",
    category: "materials" as const,
    output: createItemStack("metal-plate", 1),
    ingredients: Object.freeze([Object.freeze({ itemId: "iron-bar", quantity: 2 })]),
  }),
  Object.freeze({
    id: "bolts",
    category: "materials" as const,
    output: createItemStack("bolts", 4),
    ingredients: Object.freeze([Object.freeze({ itemId: "iron-bar", quantity: 1 })]),
  }),
  Object.freeze({
    id: "screws",
    category: "materials" as const,
    output: createItemStack("screws", 6),
    ingredients: Object.freeze([Object.freeze({ itemId: "scrap-metal", quantity: 1 })]),
  }),
  Object.freeze({
    id: "mechanical-part",
    category: "materials" as const,
    output: createItemStack("mechanical-part", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "gear", quantity: 1 }),
      Object.freeze({ itemId: "bearing", quantity: 1 }),
      Object.freeze({ itemId: "bolts", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "adhesive",
    category: "materials" as const,
    output: createItemStack("adhesive", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "plant-resin", quantity: 2 }),
      Object.freeze({ itemId: "alcohol", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "disinfectant",
    category: "survival" as const,
    output: createItemStack("disinfectant", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "alcohol", quantity: 1 }),
      Object.freeze({ itemId: "clean-water", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "healing-salve",
    category: "survival" as const,
    output: createItemStack("healing-salve", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "medicinal-herb", quantity: 2 }),
      Object.freeze({ itemId: "cloth", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "first-aid-kit",
    category: "survival" as const,
    output: createItemStack("first-aid-kit", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "bandage", quantity: 3 }),
      Object.freeze({ itemId: "antiseptic", quantity: 1 }),
      Object.freeze({ itemId: "cloth", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "roasted-meat",
    category: "survival" as const,
    output: createItemStack("roasted-meat", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "raw-meat", quantity: 1 }),
      Object.freeze({ itemId: "charcoal", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "cooked-fish",
    category: "survival" as const,
    output: createItemStack("cooked-fish", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "river-fish", quantity: 1 }),
      Object.freeze({ itemId: "charcoal", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "roasted-root",
    category: "survival" as const,
    output: createItemStack("roasted-root", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "root-vegetable", quantity: 1 }),
      Object.freeze({ itemId: "charcoal", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "cooked-berries",
    category: "survival" as const,
    output: createItemStack("cooked-berries", 1),
    ingredients: Object.freeze([Object.freeze({ itemId: "berries", quantity: 3 })]),
  }),
  Object.freeze({
    id: "purified-water",
    category: "survival" as const,
    output: createItemStack("purified-water", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "dirty-water", quantity: 1 }),
      Object.freeze({ itemId: "charcoal", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "stew",
    category: "survival" as const,
    output: createItemStack("stew", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "raw-meat", quantity: 1 }),
      Object.freeze({ itemId: "carrot", quantity: 1 }),
      Object.freeze({ itemId: "clean-water", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "reinforced-hatchet",
    category: "tools" as const,
    output: createItemStack("reinforced-hatchet", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "pine-log", quantity: 2 }),
      Object.freeze({ itemId: "iron-bar", quantity: 2 }),
      Object.freeze({ itemId: "rope", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "reinforced-pickaxe",
    category: "tools" as const,
    output: createItemStack("reinforced-pickaxe", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "pine-log", quantity: 2 }),
      Object.freeze({ itemId: "iron-bar", quantity: 2 }),
      Object.freeze({ itemId: "rope", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "advanced-hatchet",
    category: "tools" as const,
    output: createItemStack("advanced-hatchet", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "hardwood-log", quantity: 2 }),
      Object.freeze({ itemId: "steel-bar", quantity: 2 }),
      Object.freeze({ itemId: "leather", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "advanced-pickaxe",
    category: "tools" as const,
    output: createItemStack("advanced-pickaxe", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "hardwood-log", quantity: 2 }),
      Object.freeze({ itemId: "steel-bar", quantity: 2 }),
      Object.freeze({ itemId: "leather", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "reinforced-backpack",
    category: "survival" as const,
    output: createItemStack("reinforced-backpack", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "basic-backpack", quantity: 1 }),
      Object.freeze({ itemId: "leather", quantity: 3 }),
      Object.freeze({ itemId: "rope", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "expedition-backpack",
    category: "survival" as const,
    output: createItemStack("expedition-backpack", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "reinforced-backpack", quantity: 1 }),
      Object.freeze({ itemId: "thick-hide", quantity: 2 }),
      Object.freeze({ itemId: "reinforced-fabric", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "leather-armor",
    category: "armor" as const,
    output: createItemStack("leather-armor", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "leather", quantity: 4 }),
      Object.freeze({ itemId: "rope", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "winter-hat",
    category: "armor" as const,
    output: createItemStack("winter-hat", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "fur", quantity: 2 }),
      Object.freeze({ itemId: "cloth", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "padded-jacket",
    category: "armor" as const,
    output: createItemStack("padded-jacket", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "insulating-fabric", quantity: 3 }),
      Object.freeze({ itemId: "fur", quantity: 2 }),
      Object.freeze({ itemId: "thick-cloth", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "fertilizer",
    category: "materials" as const,
    output: createItemStack("fertilizer", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "compost", quantity: 2 }),
      Object.freeze({ itemId: "bone", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "brick",
    category: "building" as const,
    output: createItemStack("brick", 2),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "stone", quantity: 2 }),
      Object.freeze({ itemId: "gravel", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "hardened-alloy",
    category: "materials" as const,
    output: createItemStack("hardened-alloy", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "steel-bar", quantity: 2 }),
      Object.freeze({ itemId: "charcoal", quantity: 2 }),
      Object.freeze({ itemId: "rare-alloy", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "precision-component",
    category: "materials" as const,
    output: createItemStack("precision-component", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "bearing", quantity: 2 }),
      Object.freeze({ itemId: "gear", quantity: 1 }),
      Object.freeze({ itemId: "copper-wire", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "composite-plate",
    category: "materials" as const,
    output: createItemStack("composite-plate", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "steel-plate", quantity: 1 }),
      Object.freeze({ itemId: "high-density-polymer", quantity: 1 }),
      Object.freeze({ itemId: "adhesive", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "high-density-polymer",
    category: "materials" as const,
    output: createItemStack("high-density-polymer", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "polymer", quantity: 2 }),
      Object.freeze({ itemId: "plastic", quantity: 2 }),
      Object.freeze({ itemId: "solvent", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "advanced-circuit",
    category: "materials" as const,
    output: createItemStack("advanced-circuit", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "circuit-board", quantity: 1 }),
      Object.freeze({ itemId: "copper-wire", quantity: 3 }),
      Object.freeze({ itemId: "electronic-part", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "power-cell",
    category: "materials" as const,
    output: createItemStack("power-cell", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "advanced-battery", quantity: 1 }),
      Object.freeze({ itemId: "copper-wire", quantity: 2 }),
      Object.freeze({ itemId: "chemical-filter", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "chemical-filter",
    category: "materials" as const,
    output: createItemStack("chemical-filter", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "filter", quantity: 1 }),
      Object.freeze({ itemId: "cloth", quantity: 2 }),
      Object.freeze({ itemId: "charcoal", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "filter-cartridge",
    category: "materials" as const,
    output: createItemStack("filter-cartridge", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "chemical-filter", quantity: 1 }),
      Object.freeze({ itemId: "plastic", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "servo-assembly",
    category: "materials" as const,
    output: createItemStack("servo-assembly", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "servo", quantity: 1 }),
      Object.freeze({ itemId: "precision-component", quantity: 1 }),
      Object.freeze({ itemId: "wiring", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "optical-module",
    category: "materials" as const,
    output: createItemStack("optical-module", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "glass-pane", quantity: 2 }),
      Object.freeze({ itemId: "circuit-component", quantity: 1 }),
      Object.freeze({ itemId: "plastic", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "reinforced-fiber",
    category: "materials" as const,
    output: createItemStack("reinforced-fiber", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "plant-fiber", quantity: 6 }),
      Object.freeze({ itemId: "rope", quantity: 1 }),
      Object.freeze({ itemId: "adhesive", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "field-carrier-pack",
    category: "survival" as const,
    output: createItemStack("field-carrier-pack", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "expedition-backpack", quantity: 1 }),
      Object.freeze({ itemId: "reinforced-fiber", quantity: 4 }),
      Object.freeze({ itemId: "composite-plate", quantity: 1 }),
      Object.freeze({ itemId: "thick-hide", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "composite-helmet",
    category: "armor" as const,
    output: createItemStack("composite-helmet", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "composite-plate", quantity: 1 }),
      Object.freeze({ itemId: "thick-cloth", quantity: 2 }),
      Object.freeze({ itemId: "bolts", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "composite-chest",
    category: "armor" as const,
    output: createItemStack("composite-chest", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "composite-plate", quantity: 3 }),
      Object.freeze({ itemId: "reinforced-fiber", quantity: 2 }),
      Object.freeze({ itemId: "leather", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "survival-knife",
    category: "weapons" as const,
    output: createItemStack("survival-knife", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "iron-bar", quantity: 1 }),
      Object.freeze({ itemId: "stick", quantity: 1 }),
      Object.freeze({ itemId: "leather", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "sledgehammer",
    category: "weapons" as const,
    output: createItemStack("sledgehammer", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "iron-bar", quantity: 3 }),
      Object.freeze({ itemId: "pine-log", quantity: 2 }),
      Object.freeze({ itemId: "rope", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "tactical-axe",
    category: "weapons" as const,
    output: createItemStack("tactical-axe", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "steel-bar", quantity: 2 }),
      Object.freeze({ itemId: "hardwood-log", quantity: 1 }),
      Object.freeze({ itemId: "leather", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "hazmat-hood",
    category: "armor" as const,
    output: createItemStack("hazmat-hood", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "rubber", quantity: 2 }),
      Object.freeze({ itemId: "chemical-filter", quantity: 1 }),
      Object.freeze({ itemId: "glass-pane", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "hazmat-suit",
    category: "armor" as const,
    output: createItemStack("hazmat-suit", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "reinforced-fabric", quantity: 3 }),
      Object.freeze({ itemId: "rubber", quantity: 3 }),
      Object.freeze({ itemId: "adhesive", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "reinforced-grip-mod",
    category: "materials" as const,
    output: createItemStack("reinforced-grip-mod", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "leather", quantity: 1 }),
      Object.freeze({ itemId: "tape", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "steel-plate",
    category: "materials" as const,
    output: createItemStack("steel-plate", 1),
    ingredients: Object.freeze([Object.freeze({ itemId: "steel-bar", quantity: 2 })]),
  }),
  Object.freeze({
    id: "composite-legs",
    category: "armor" as const,
    output: createItemStack("composite-legs", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "composite-plate", quantity: 2 }),
      Object.freeze({ itemId: "reinforced-fiber", quantity: 2 }),
      Object.freeze({ itemId: "leather", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "composite-boots",
    category: "armor" as const,
    output: createItemStack("composite-boots", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "composite-plate", quantity: 1 }),
      Object.freeze({ itemId: "rubber", quantity: 2 }),
      Object.freeze({ itemId: "reinforced-fiber", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "ammo-box-pistol",
    category: "tools" as const,
    output: createItemStack("pistol-ammo", 12),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "scrap-metal", quantity: 2 }),
      Object.freeze({ itemId: "gunpowder", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "simple-optic-mod",
    category: "materials" as const,
    output: createItemStack("simple-optic-mod", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "glass-pane", quantity: 1 }),
      Object.freeze({ itemId: "precision-component", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "extended-mag-mod",
    category: "materials" as const,
    output: createItemStack("extended-mag-mod", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "steel-bar", quantity: 1 }),
      Object.freeze({ itemId: "spring", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "battery-bank-core",
    category: "materials" as const,
    output: createItemStack("battery-bank-core", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "power-cell", quantity: 2 }),
      Object.freeze({ itemId: "wiring", quantity: 2 }),
      Object.freeze({ itemId: "steel-plate", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "solar-panel",
    category: "materials" as const,
    output: createItemStack("solar-panel", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "glass-pane", quantity: 2 }),
      Object.freeze({ itemId: "wiring", quantity: 2 }),
      Object.freeze({ itemId: "advanced-circuit", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "service-pistol",
    category: "weapons" as const,
    output: createItemStack("service-pistol", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "steel-bar", quantity: 2 }),
      Object.freeze({ itemId: "precision-component", quantity: 1 }),
      Object.freeze({ itemId: "spring", quantity: 1 }),
    ]),
  }),
  // ── Pass 5 recipes ──
  Object.freeze({
    id: "branch-to-stick",
    category: "materials" as const,
    output: createItemStack("stick", 3),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "branch", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "wood-chips-craft",
    category: "materials" as const,
    output: createItemStack("wood-chips", 4),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "pine-log", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "reinforced-board-craft",
    category: "materials" as const,
    output: createItemStack("reinforced-board", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "hardwood-plank", quantity: 2 }),
      Object.freeze({ itemId: "nails", quantity: 4 }),
    ]),
  }),
  Object.freeze({
    id: "iron-rod-craft",
    category: "materials" as const,
    output: createItemStack("iron-rod", 2),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "iron-bar", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "iron-wire-craft",
    category: "materials" as const,
    output: createItemStack("iron-wire", 4),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "iron-bar", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "iron-plate-craft",
    category: "materials" as const,
    output: createItemStack("iron-plate", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "iron-bar", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "iron-pipe-craft",
    category: "materials" as const,
    output: createItemStack("iron-pipe", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "iron-bar", quantity: 2 }),
      Object.freeze({ itemId: "charcoal", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "screws-craft",
    category: "materials" as const,
    output: createItemStack("screws", 8),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "iron-bar", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "copper-coil-craft",
    category: "materials" as const,
    output: createItemStack("copper-coil", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "copper-wire", quantity: 4 }),
    ]),
  }),
  Object.freeze({
    id: "electrical-contacts-craft",
    category: "materials" as const,
    output: createItemStack("electrical-contacts", 2),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "copper-bar", quantity: 1 }),
      Object.freeze({ itemId: "scrap-metal", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "aluminum-wire-craft",
    category: "materials" as const,
    output: createItemStack("aluminum-wire", 3),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "aluminum-bar", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "lightweight-frame-craft",
    category: "materials" as const,
    output: createItemStack("lightweight-frame", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "aluminum-plate", quantity: 2 }),
      Object.freeze({ itemId: "bolts", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "steel-rod-craft",
    category: "materials" as const,
    output: createItemStack("steel-rod", 2),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "steel-bar", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "hardened-steel-craft",
    category: "materials" as const,
    output: createItemStack("hardened-steel", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "steel-bar", quantity: 2 }),
      Object.freeze({ itemId: "charcoal", quantity: 3 }),
    ]),
  }),
  Object.freeze({
    id: "reinforced-steel-plate-craft",
    category: "materials" as const,
    output: createItemStack("reinforced-steel-plate", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "steel-plate", quantity: 2 }),
      Object.freeze({ itemId: "bolts", quantity: 4 }),
    ]),
  }),
  Object.freeze({
    id: "rubber-strip-craft",
    category: "materials" as const,
    output: createItemStack("rubber-strip", 3),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "rubber", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "rubber-seal-craft",
    category: "materials" as const,
    output: createItemStack("rubber-seal", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "rubber", quantity: 2 }),
      Object.freeze({ itemId: "adhesive", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "tire-material-craft",
    category: "materials" as const,
    output: createItemStack("tire-material", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "rubber", quantity: 3 }),
      Object.freeze({ itemId: "wire", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "reinforced-rubber-craft",
    category: "materials" as const,
    output: createItemStack("reinforced-rubber", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "rubber", quantity: 2 }),
      Object.freeze({ itemId: "wire", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "polymer-housing-craft",
    category: "materials" as const,
    output: createItemStack("polymer-housing", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "high-density-polymer", quantity: 2 }),
      Object.freeze({ itemId: "screws", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "synthetic-resin-craft",
    category: "materials" as const,
    output: createItemStack("synthetic-resin", 2),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "plant-resin", quantity: 3 }),
      Object.freeze({ itemId: "alcohol", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "sealant-craft",
    category: "materials" as const,
    output: createItemStack("sealant", 2),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "rubber", quantity: 1 }),
      Object.freeze({ itemId: "adhesive", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "small-mechanism-craft",
    category: "materials" as const,
    output: createItemStack("small-mechanism", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "gear", quantity: 2 }),
      Object.freeze({ itemId: "spring", quantity: 1 }),
      Object.freeze({ itemId: "screws", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "precision-mechanism-craft",
    category: "materials" as const,
    output: createItemStack("precision-mechanism", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "small-mechanism", quantity: 1 }),
      Object.freeze({ itemId: "bearing", quantity: 2 }),
      Object.freeze({ itemId: "precision-component", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "control-module-craft",
    category: "materials" as const,
    output: createItemStack("control-module", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "circuit-board", quantity: 1 }),
      Object.freeze({ itemId: "relay", quantity: 1 }),
      Object.freeze({ itemId: "wire", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "processor-module-craft",
    category: "materials" as const,
    output: createItemStack("processor-module", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "advanced-circuit", quantity: 1 }),
      Object.freeze({ itemId: "optical-module", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "activated-carbon-craft",
    category: "materials" as const,
    output: createItemStack("activated-carbon", 2),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "charcoal", quantity: 3 }),
      Object.freeze({ itemId: "cloth", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "fastener-pack-craft",
    category: "materials" as const,
    output: createItemStack("fastener-pack", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "nails", quantity: 4 }),
      Object.freeze({ itemId: "screws", quantity: 4 }),
      Object.freeze({ itemId: "bolts", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "reinforced-glass-craft",
    category: "materials" as const,
    output: createItemStack("reinforced-glass", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "glass-pane", quantity: 2 }),
      Object.freeze({ itemId: "plastic", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "optical-glass-craft",
    category: "materials" as const,
    output: createItemStack("optical-glass", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "glass-pane", quantity: 2 }),
      Object.freeze({ itemId: "solvent", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "refined-fuel-craft",
    category: "materials" as const,
    output: createItemStack("refined-fuel", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "fuel-can", quantity: 1 }),
      Object.freeze({ itemId: "fuel-additive", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "generator-fuel-craft",
    category: "materials" as const,
    output: createItemStack("generator-fuel", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "low-grade-fuel", quantity: 2 }),
      Object.freeze({ itemId: "fuel-additive", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "lubricant-craft",
    category: "materials" as const,
    output: createItemStack("lubricant", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "animal-fat", quantity: 2 }),
      Object.freeze({ itemId: "solvent", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "soil-compost-craft",
    category: "materials" as const,
    output: createItemStack("soil", 3),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "compost", quantity: 1 }),
      Object.freeze({ itemId: "gravel", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "vegetable-soup-craft",
    category: "survival" as const,
    output: createItemStack("vegetable-soup", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "root-vegetable", quantity: 1 }),
      Object.freeze({ itemId: "mushroom", quantity: 1 }),
      Object.freeze({ itemId: "clean-water", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "meat-stew-craft",
    category: "survival" as const,
    output: createItemStack("meat-stew", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "roasted-meat", quantity: 1 }),
      Object.freeze({ itemId: "root-vegetable", quantity: 1 }),
      Object.freeze({ itemId: "clean-water", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "mushroom-soup-craft",
    category: "survival" as const,
    output: createItemStack("mushroom-soup", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "mushroom", quantity: 2 }),
      Object.freeze({ itemId: "clean-water", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "survival-meal-craft",
    category: "survival" as const,
    output: createItemStack("survival-meal", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "meat-stew", quantity: 1 }),
      Object.freeze({ itemId: "corn", quantity: 1 }),
      Object.freeze({ itemId: "herbal-drink", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "high-energy-meal-craft",
    category: "survival" as const,
    output: createItemStack("high-energy-meal", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "survival-meal", quantity: 1 }),
      Object.freeze({ itemId: "preserved-food", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "warming-meal-craft",
    category: "survival" as const,
    output: createItemStack("warming-meal", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "roasted-meat", quantity: 1 }),
      Object.freeze({ itemId: "warm-drink", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "herbal-drink-craft",
    category: "survival" as const,
    output: createItemStack("herbal-drink", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "medicinal-herb", quantity: 2 }),
      Object.freeze({ itemId: "clean-water", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "warm-drink-craft",
    category: "survival" as const,
    output: createItemStack("warm-drink", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "clean-water", quantity: 1 }),
      Object.freeze({ itemId: "berries", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "energy-tonic-craft",
    category: "survival" as const,
    output: createItemStack("energy-tonic", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "herbal-drink", quantity: 1 }),
      Object.freeze({ itemId: "berries", quantity: 3 }),
    ]),
  }),
  Object.freeze({
    id: "industrial-adhesive-craft",
    category: "materials" as const,
    output: createItemStack("industrial-adhesive", 2),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "adhesive", quantity: 2 }),
      Object.freeze({ itemId: "plant-resin", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "sterile-bandage-craft",
    category: "survival" as const,
    output: createItemStack("sterile-bandage", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "bandage", quantity: 1 }),
      Object.freeze({ itemId: "antiseptic", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "advanced-medical-kit-craft",
    category: "survival" as const,
    output: createItemStack("advanced-medical-kit", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "first-aid-kit", quantity: 1 }),
      Object.freeze({ itemId: "sterile-bandage", quantity: 2 }),
      Object.freeze({ itemId: "healing-salve", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "bleeding-treatment-craft",
    category: "survival" as const,
    output: createItemStack("bleeding-treatment", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "bandage", quantity: 1 }),
      Object.freeze({ itemId: "cloth", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "toxic-treatment-craft",
    category: "survival" as const,
    output: createItemStack("toxic-treatment", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "antidote", quantity: 1 }),
      Object.freeze({ itemId: "filter", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "stone-hatchet-craft",
    category: "tools" as const,
    output: createItemStack("stone-hatchet", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "stick", quantity: 2 }),
      Object.freeze({ itemId: "stone", quantity: 3 }),
      Object.freeze({ itemId: "plant-fiber", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "steel-hatchet-craft",
    category: "tools" as const,
    output: createItemStack("steel-hatchet", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "steel-bar", quantity: 2 }),
      Object.freeze({ itemId: "hardwood-log", quantity: 1 }),
      Object.freeze({ itemId: "leather", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "stone-pickaxe-craft",
    category: "tools" as const,
    output: createItemStack("stone-pickaxe", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "stick", quantity: 2 }),
      Object.freeze({ itemId: "stone", quantity: 4 }),
      Object.freeze({ itemId: "plant-fiber", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "steel-pickaxe-craft",
    category: "tools" as const,
    output: createItemStack("steel-pickaxe", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "steel-bar", quantity: 2 }),
      Object.freeze({ itemId: "hardwood-log", quantity: 1 }),
      Object.freeze({ itemId: "leather", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "pipe-club-craft",
    category: "weapons" as const,
    output: createItemStack("pipe-club", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "metal-pipe", quantity: 1 }),
      Object.freeze({ itemId: "tape", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "machete-craft",
    category: "weapons" as const,
    output: createItemStack("machete", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "iron-bar", quantity: 2 }),
      Object.freeze({ itemId: "leather", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "cleaver-craft",
    category: "weapons" as const,
    output: createItemStack("cleaver", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "iron-plate", quantity: 1 }),
      Object.freeze({ itemId: "wood-plank", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "metal-hammer-craft",
    category: "weapons" as const,
    output: createItemStack("metal-hammer", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "iron-bar", quantity: 2 }),
      Object.freeze({ itemId: "stick", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "long-spear-craft",
    category: "weapons" as const,
    output: createItemStack("long-spear", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "improved-spear", quantity: 1 }),
      Object.freeze({ itemId: "iron-rod", quantity: 1 }),
      Object.freeze({ itemId: "rope", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "heavy-axe-craft",
    category: "weapons" as const,
    output: createItemStack("heavy-axe", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "steel-bar", quantity: 3 }),
      Object.freeze({ itemId: "hardwood-log", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "composite-axe-craft",
    category: "weapons" as const,
    output: createItemStack("composite-axe", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "hardened-steel", quantity: 2 }),
      Object.freeze({ itemId: "composite-plate", quantity: 1 }),
      Object.freeze({ itemId: "treated-leather", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "hardened-machete-craft",
    category: "weapons" as const,
    output: createItemStack("hardened-machete", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "machete", quantity: 1 }),
      Object.freeze({ itemId: "hardened-steel", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "tactical-spear-craft",
    category: "weapons" as const,
    output: createItemStack("tactical-spear", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "long-spear", quantity: 1 }),
      Object.freeze({ itemId: "composite-plate", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "industrial-hammer-craft",
    category: "weapons" as const,
    output: createItemStack("industrial-hammer", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "heavy-axe", quantity: 1 }),
      Object.freeze({ itemId: "reinforced-steel-plate", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "hunting-bow-craft",
    category: "weapons" as const,
    output: createItemStack("hunting-bow", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "hardwood-log", quantity: 2 }),
      Object.freeze({ itemId: "rope", quantity: 2 }),
      Object.freeze({ itemId: "plant-fiber", quantity: 4 }),
    ]),
  }),
  Object.freeze({
    id: "cloth-hood-craft",
    category: "armor" as const,
    output: createItemStack("cloth-hood", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "cloth", quantity: 3 }),
      Object.freeze({ itemId: "rope", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "cloth-tunic-craft",
    category: "armor" as const,
    output: createItemStack("cloth-tunic", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "cloth", quantity: 5 }),
      Object.freeze({ itemId: "rope", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "cloth-wraps-craft",
    category: "armor" as const,
    output: createItemStack("cloth-wraps", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "cloth", quantity: 4 }),
    ]),
  }),
  Object.freeze({
    id: "cloth-wraps-feet-craft",
    category: "armor" as const,
    output: createItemStack("cloth-wraps-feet", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "cloth", quantity: 2 }),
      Object.freeze({ itemId: "plant-fiber", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "leather-cap-craft",
    category: "armor" as const,
    output: createItemStack("leather-cap", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "leather", quantity: 2 }),
      Object.freeze({ itemId: "rope", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "leather-jacket-craft",
    category: "armor" as const,
    output: createItemStack("leather-jacket", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "leather", quantity: 4 }),
      Object.freeze({ itemId: "rope", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "leather-pants-craft",
    category: "armor" as const,
    output: createItemStack("leather-pants", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "leather", quantity: 3 }),
    ]),
  }),
  Object.freeze({
    id: "leather-boots-craft",
    category: "armor" as const,
    output: createItemStack("leather-boots", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "leather", quantity: 2 }),
      Object.freeze({ itemId: "rubber", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "tactical-helmet-craft",
    category: "armor" as const,
    output: createItemStack("tactical-helmet", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "steel-plate", quantity: 1 }),
      Object.freeze({ itemId: "technical-fabric", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "tactical-boots-craft",
    category: "armor" as const,
    output: createItemStack("tactical-boots", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "leather-boots", quantity: 1 }),
      Object.freeze({ itemId: "rubber", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "arrow-craft",
    category: "tools" as const,
    output: createItemStack("arrow", 6),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "stick", quantity: 3 }),
      Object.freeze({ itemId: "stone", quantity: 1 }),
      Object.freeze({ itemId: "plant-fiber", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "tactical-pants-craft",
    category: "armor" as const,
    output: createItemStack("tactical-pants", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "reinforced-leather", quantity: 2 }),
      Object.freeze({ itemId: "technical-fabric", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "heavy-helmet-craft",
    category: "armor" as const,
    output: createItemStack("heavy-helmet", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "reinforced-steel-plate", quantity: 1 }),
      Object.freeze({ itemId: "thick-cloth", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "heavy-plate-craft",
    category: "armor" as const,
    output: createItemStack("heavy-plate", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "reinforced-steel-plate", quantity: 2 }),
      Object.freeze({ itemId: "thick-hide", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "heavy-greaves-craft",
    category: "armor" as const,
    output: createItemStack("heavy-greaves", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "steel-plate", quantity: 2 }),
      Object.freeze({ itemId: "reinforced-leather", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "heavy-sabatons-craft",
    category: "armor" as const,
    output: createItemStack("heavy-sabatons", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "steel-plate", quantity: 1 }),
      Object.freeze({ itemId: "rubber", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "treated-leather-craft",
    category: "materials" as const,
    output: createItemStack("treated-leather", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "leather", quantity: 1 }),
      Object.freeze({ itemId: "animal-fat", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "reinforced-leather-craft",
    category: "materials" as const,
    output: createItemStack("reinforced-leather", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "treated-leather", quantity: 2 }),
      Object.freeze({ itemId: "wire", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "technical-fabric-craft",
    category: "materials" as const,
    output: createItemStack("technical-fabric", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "reinforced-fabric", quantity: 1 }),
      Object.freeze({ itemId: "plastic", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "composite-fiber-craft",
    category: "materials" as const,
    output: createItemStack("composite-fiber", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "technical-fabric", quantity: 1 }),
      Object.freeze({ itemId: "reinforced-fiber", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "preserved-food-craft",
    category: "survival" as const,
    output: createItemStack("preserved-food", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "roasted-meat", quantity: 1 }),
      Object.freeze({ itemId: "charcoal", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "dry-food-craft",
    category: "survival" as const,
    output: createItemStack("dry-food", 2),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "berries", quantity: 2 }),
      Object.freeze({ itemId: "root-vegetable", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "advanced-fishing-rod-craft",
    category: "tools" as const,
    output: createItemStack("advanced-fishing-rod", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "fishing-rod", quantity: 1 }),
      Object.freeze({ itemId: "steel-rod", quantity: 1 }),
      Object.freeze({ itemId: "rope", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "improvised-pistol-craft",
    category: "weapons" as const,
    output: createItemStack("improvised-pistol", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "metal-pipe", quantity: 1 }),
      Object.freeze({ itemId: "scrap-metal", quantity: 3 }),
      Object.freeze({ itemId: "spring", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "hunting-bow-arrows",
    category: "tools" as const,
    output: createItemStack("arrow", 4),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "stick", quantity: 2 }),
      Object.freeze({ itemId: "plant-fiber", quantity: 2 }),
    ]),
  }),
  // ── Pass 5 salvage loops ──
  Object.freeze({
    id: "salvage-empty-can",
    category: "materials" as const,
    output: createItemStack("scrap-metal", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "empty-can", quantity: 3 }),
    ]),
  }),
  Object.freeze({
    id: "salvage-broken-tool",
    category: "materials" as const,
    output: createItemStack("scrap-metal", 2),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "broken-tool", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "salvage-broken-radio",
    category: "materials" as const,
    output: createItemStack("electronic-part", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "broken-radio", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "salvage-scrap-device",
    category: "materials" as const,
    output: createItemStack("wire", 2),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "scrap-device", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "salvage-bent-pipe",
    category: "materials" as const,
    output: createItemStack("metal-pipe", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "bent-pipe", quantity: 2 }),
    ]),
  }),
  Object.freeze({
    id: "salvage-rusted-mechanism",
    category: "materials" as const,
    output: createItemStack("scrap-metal", 2),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "rusted-mechanism", quantity: 1 }),
    ]),
  }),
  Object.freeze({
    id: "salvage-broken-glass",
    category: "materials" as const,
    output: createItemStack("glass-pane", 1),
    ingredients: Object.freeze([
      Object.freeze({ itemId: "broken-glass", quantity: 4 }),
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
