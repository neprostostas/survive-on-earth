/**
 * Food spoilage + cold-box wiring domain.
 */
import assert from "node:assert/strict";
import {
  advanceSpoilAge,
  isPerishableFood,
  spoilLifetimeSec,
  spoilTierOf,
  SPOIL_RATE_FRIDGE_ON,
  SPOIL_RATE_PLAYER,
} from "../src/items/FoodSpoilage.ts";
import { SpoilageSystem } from "../src/inventory/SpoilageSystem.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemStack } from "../src/items/ItemSystem.ts";
import { WorldContainerEntity } from "../src/containers/WorldContainer.ts";
import {
  CHEST_PIECE_CAPACITY,
  isChestPiece,
  isColdStoragePiece,
  isStandalonePowerPiece,
  POWER_PIECE_SPECS,
  powerDeviceIdForPiece,
} from "../src/building/BuiltPieceWiring.ts";
import { PowerGrid } from "../src/base/PowerGrid.ts";

assert.equal(spoilTierOf("raw-meat"), "raw");
assert.equal(spoilTierOf("canned-food"), "stable");
assert.equal(isPerishableFood("raw-meat"), true);
assert.equal(isPerishableFood("canned-food"), false);
assert.equal(isPerishableFood("bandage"), false);
assert.ok(spoilLifetimeSec("raw-meat") > 0);
assert.equal(spoilLifetimeSec("canned-food"), 0);

// Unit spoil over lifetime
{
  let age = 0;
  const life = spoilLifetimeSec("raw-meat");
  const step = advanceSpoilAge(age, { itemId: "raw-meat", quantity: 3 }, life, 1);
  assert.equal(step.spoiledUnits, 1);
  assert.ok(step.age < life);
  age = step.age;
  const rest = advanceSpoilAge(age, { itemId: "raw-meat", quantity: 2 }, life * 2.5, 1);
  assert.equal(rest.spoiledUnits, 2);
}

// Powered fridge is much slower
{
  const life = spoilLifetimeSec("berries");
  const ambient = advanceSpoilAge(0, { itemId: "berries", quantity: 5 }, life, SPOIL_RATE_PLAYER);
  assert.equal(ambient.spoiledUnits, 1);
  const cold = advanceSpoilAge(0, { itemId: "berries", quantity: 5 }, life, SPOIL_RATE_FRIDGE_ON);
  assert.equal(cold.spoiledUnits, 0, "fridge should not spoil full unit in 1× life at 0.08 rate");
}

// Player inventory integration
{
  const inv = new PlayerInventory();
  assert.equal(inv.tryInsert(createItemStack("raw-meat", 2)).accepted, true);
  const spoil = new SpoilageSystem();
  const life = spoilLifetimeSec("raw-meat");
  const n = spoil.tickPlayer(inv, life * 1.05, SPOIL_RATE_PLAYER);
  assert.equal(n, 1);
  assert.equal(inv.totalQuantity("raw-meat"), 1);
  const snap = spoil.serialize();
  assert.ok(Object.keys(snap).length >= 1);
  const spoil2 = new SpoilageSystem();
  spoil2.load(snap);
  assert.ok(Object.keys(spoil2.serialize()).length >= 1);
}

// Container integration
{
  const box = new WorldContainerEntity(
    "built-chest-build-9",
    "Cold Box",
    { x: 0, y: 0, z: 0 },
    12,
    [createItemStack("raw-meat", 1)],
    "storage",
  );
  const spoil = new SpoilageSystem();
  const life = spoilLifetimeSec("raw-meat");
  assert.equal(spoil.tickContainer(box, life, SPOIL_RATE_FRIDGE_ON), 0);
  assert.equal(spoil.tickContainer(box, life / SPOIL_RATE_FRIDGE_ON + 1, SPOIL_RATE_FRIDGE_ON), 1);
  assert.equal(box.inventory.getSlot(0), null);
}

// Wiring: cold-box is chest + power, not standalone E-power
assert.equal(isChestPiece("cold-box"), true);
assert.equal(isColdStoragePiece("cold-box"), true);
assert.equal(CHEST_PIECE_CAPACITY["cold-box"], 12);
assert.equal(isStandalonePowerPiece("cold-box"), false);
assert.ok(POWER_PIECE_SPECS["cold-box"]);
assert.equal(POWER_PIECE_SPECS["cold-box"].kind, "refrigerator");
assert.equal(isStandalonePowerPiece("camp-generator"), true);

{
  const grid = new PowerGrid();
  const id = powerDeviceIdForPiece("build-3");
  const spec = POWER_PIECE_SPECS["cold-box"];
  grid.syncBuildDevice({
    id,
    kind: spec.kind,
    label: spec.label,
    production: spec.production,
    consumption: spec.consumption,
    priority: spec.priority,
    enabled: true,
  });
  assert.equal(grid.isPowered(id), false, "no gen → fridge unpowered");
  grid.syncBuildDevice({
    id: powerDeviceIdForPiece("build-gen"),
    kind: "generator",
    label: "G",
    production: 10,
    consumption: 0,
    priority: 1,
    enabled: true,
    fueled: true,
  });
  assert.equal(grid.isPowered(id), true);
}

console.log("ok food spoilage + cold-box");
