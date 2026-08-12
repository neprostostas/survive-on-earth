/**
 * Warming meal / drink cold clear.
 */
import assert from "node:assert/strict";
import {
  applyWarmingClear,
  isWarmingConsumable,
  warmingColdClear,
} from "../src/survival/WarmingConsumables.ts";
import { ColdPool } from "../src/survival/ColdPool.ts";
import { ConsumableUseSystem } from "../src/consumables/ConsumableUseSystem.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { PlayerQuickSlot } from "../src/equipment/PlayerQuickSlot.ts";
import { HealthPool } from "../src/combat/HealthPool.ts";
import { HungerPool, ThirstPool } from "../src/survival/NeedPool.ts";
import { createItemStack } from "../src/items/ItemSystem.ts";
import { SURVIVAL_CONFIG } from "../src/survival/survivalConfig.ts";

assert.equal(isWarmingConsumable("warming-meal"), true);
assert.equal(isWarmingConsumable("berries"), false);
assert.equal(warmingColdClear("warming-meal"), 45);
assert.equal(applyWarmingClear(20, "warming-meal"), 20);
assert.equal(applyWarmingClear(80, "warm-drink"), 22);

const cold = new ColdPool(100);
cold.set(60);
const inventory = new PlayerInventory();
inventory.tryInsert(createItemStack("warming-meal", 1));
inventory.tryInsert(createItemStack("warm-drink", 1));
const health = new HealthPool(100);
const hunger = new HungerPool(SURVIVAL_CONFIG.hunger.max);
const thirst = new ThirstPool(SURVIVAL_CONFIG.thirst.max);
hunger.set(SURVIVAL_CONFIG.hunger.max);
thirst.set(SURVIVAL_CONFIG.thirst.max);
const quick = [new PlayerQuickSlot(), new PlayerQuickSlot()];
const consumables = new ConsumableUseSystem(inventory, health, hunger, thirst, quick, undefined, cold);

// Full hunger still allows warming-meal because cold > 0
const meal = consumables.useFromInventory(0);
assert.equal(meal.accepted, true, meal.reason ?? "meal");
assert.ok((meal.warmthCleared ?? 0) > 0);
assert.ok(cold.current < 60);
assert.equal(inventory.totalQuantity("warming-meal"), 0);

const before = cold.current;
const drink = consumables.useFromInventory(1);
assert.equal(drink.accepted, true, drink.reason ?? "drink");
assert.ok(cold.current < before);

// No cold left + full thirst → warm-drink rejected
cold.set(0);
inventory.tryInsert(createItemStack("warm-drink", 1));
thirst.set(SURVIVAL_CONFIG.thirst.max);
const slot = inventory.findFirstSlotByItemId("warm-drink");
assert.ok(slot !== null);
const blocked = consumables.useFromInventory(slot);
assert.equal(blocked.accepted, false);

console.log("ok warming consumables");
