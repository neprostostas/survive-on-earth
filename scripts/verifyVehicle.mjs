/**
 * Vehicle assembly domain: parts install → assembled → fuel travel.
 */
import assert from "node:assert/strict";
import {
  ATV_PARTS,
  BIKE_PARTS,
  PART_ITEMS,
  partsForVehicle,
  VehicleSystem,
} from "../src/vehicle/VehicleSystem.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemStack } from "../src/items/ItemSystem.ts";

const inv = new PlayerInventory();
/** @param {string} id @param {number} qty */
function give(id, qty) {
  let left = qty;
  while (left > 0) {
    const take = Math.min(left, 20);
    assert.equal(inv.tryInsert(createItemStack(/** @type {any} */ (id), take)).accepted, true, `give ${id}`);
    left -= take;
  }
}

assert.equal(BIKE_PARTS.length, 5);
assert.equal(ATV_PARTS.length, 7);
assert.equal(partsForVehicle("salvaged-bike").length, 5);
assert.equal(PART_ITEMS.engine, "engine-part");

const vehicles = new VehicleSystem();
assert.equal(vehicles.hasAnyVehicle, false);
assert.equal(vehicles.view("salvaged-bike").progress, 0);

// Install all bike parts
for (const part of BIKE_PARTS) {
  const item = PART_ITEMS[part];
  give(item, 1);
  assert.equal(vehicles.canInstall(part, "salvaged-bike"), true, part);
  assert.equal(vehicles.install(part, inv, "salvaged-bike"), true, `install ${part}`);
}
assert.equal(vehicles.isVehicleAssembled("salvaged-bike"), true);
assert.equal(vehicles.hasAnyVehicle, true);
assert.equal(vehicles.activeId, "salvaged-bike");
assert.equal(vehicles.view("salvaged-bike").progress, 1);

// Refuel + travel
give("fuel-can", 2);
assert.equal(vehicles.refuel(inv), true);
assert.ok(vehicles.fuelLevel >= 15);
assert.equal(vehicles.tryTravelConsume(1), true);
assert.ok(vehicles.fuelLevel < 40);

// ATV cannot share incomplete installs from empty
assert.equal(vehicles.isVehicleAssembled("trailrunner-atv"), false);
for (const part of ATV_PARTS) {
  give(PART_ITEMS[part], 1);
  assert.equal(vehicles.install(part, inv, "trailrunner-atv"), true, `atv ${part}`);
}
assert.equal(vehicles.isVehicleAssembled("trailrunner-atv"), true);
assert.equal(vehicles.setActive("trailrunner-atv"), true);
assert.equal(vehicles.activeId, "trailrunner-atv");

// Serialize round-trip
const blob = vehicles.serialize();
const loaded = new VehicleSystem();
loaded.load(blob);
assert.equal(loaded.hasAnyVehicle, true);
assert.equal(loaded.activeId, "trailrunner-atv");
assert.equal(loaded.isVehicleAssembled("salvaged-bike"), true);

console.log("ok vehicle assembly + fuel travel domain");
