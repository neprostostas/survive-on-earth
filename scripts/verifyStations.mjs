/**
 * Station timed craft domain checks.
 */
import assert from "node:assert/strict";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemStack } from "../src/items/ItemSystem.ts";
import { StationSystem } from "../src/workstations/StationSystem.ts";
import { getStationProcess } from "../src/workstations/StationRecipes.ts";

// Cook berries with fuel
{
  const inv = new PlayerInventory();
  inv.tryInsert(createItemStack("berries", 10));
  inv.tryInsert(createItemStack("pine-log", 5));
  const stations = new StationSystem();
  const check = stations.canStart("campfire:berries", "campfire", inv);
  assert.equal(check.ok, true, "can start cook");
  const start = stations.tryStart("campfire:berries", "campfire", inv);
  assert.equal(start.accepted, true);
  assert.equal(inv.totalQuantity("berries"), 7);
  assert.equal(inv.totalQuantity("pine-log"), 4);
  assert.equal(stations.queueOf("campfire").queue.length, 1);

  // finish in one big tick
  const done = stations.tick(20);
  assert.equal(done.length, 1);
  assert.equal(done[0].stack.itemId, "cooked-berries");
  assert.equal(stations.queueOf("campfire").queue.length, 0);
  assert.equal(inv.tryInsert(done[0].stack).accepted, true);
  assert.equal(inv.totalQuantity("cooked-berries"), 1);
  console.log("ok campfire cook");
}

// Wood planks
{
  const inv = new PlayerInventory();
  inv.tryInsert(createItemStack("pine-log", 3));
  const stations = new StationSystem();
  assert.equal(stations.tryStart("woodwork:plank", "woodworking", inv).accepted, true);
  const done = stations.tick(10);
  assert.equal(done[0].stack.itemId, "wood-plank");
  assert.equal(done[0].stack.quantity, 2);
  console.log("ok woodwork planks");
}

// Furnace needs charcoal + ore
{
  const inv = new PlayerInventory();
  inv.tryInsert(createItemStack("iron-ore", 4));
  inv.tryInsert(createItemStack("charcoal", 2));
  const stations = new StationSystem();
  assert.equal(stations.tryStart("furnace:iron", "furnace", inv).accepted, true);
  assert.equal(inv.totalQuantity("iron-ore"), 2);
  assert.equal(inv.totalQuantity("charcoal"), 1);
  const mid = stations.tick(5);
  assert.equal(mid.length, 0, "not finished at 5s");
  const done = stations.tick(20);
  assert.equal(done[0].stack.itemId, "iron-bar");
  console.log("ok furnace smelt");
}

// Serialize / load preserves queue progress
{
  const inv = new PlayerInventory();
  inv.tryInsert(createItemStack("pine-log", 5));
  const stations = new StationSystem();
  stations.tryStart("woodwork:plank", "woodworking", inv);
  stations.tick(2);
  const snap = stations.serialize();
  const json = JSON.parse(JSON.stringify(snap));
  const restored = new StationSystem();
  restored.load(json);
  assert.equal(restored.queueOf("woodworking").queue.length, 1);
  assert.ok((restored.queueOf("woodworking").active?.progress ?? 0) >= 1.9);
  const done = restored.tick(10);
  assert.equal(done.length, 1);
  console.log("ok station queue save/load");
}

// Metalwork nails (bar + charcoal)
{
  const inv = new PlayerInventory();
  inv.tryInsert(createItemStack("iron-bar", 2));
  inv.tryInsert(createItemStack("charcoal", 2));
  const stations = new StationSystem();
  assert.equal(stations.tryStart("metalwork:nails", "metalwork", inv).accepted, true);
  assert.equal(inv.totalQuantity("iron-bar"), 1);
  assert.equal(inv.totalQuantity("charcoal"), 1);
  const done = stations.tick(15);
  assert.equal(done.length, 1);
  assert.equal(done[0].stack.itemId, "nails");
  assert.equal(done[0].stack.quantity, 8);
  // serialize metalwork queue mid-process
  stations.tryStart("metalwork:bolts", "metalwork", inv);
  stations.tick(3);
  const snap = stations.serialize();
  assert.equal(snap.metalwork.entries.length, 1);
  const restored = new StationSystem();
  restored.load(snap);
  assert.equal(restored.queueOf("metalwork").queue.length, 1);
  const finish = restored.tick(20);
  assert.equal(finish[0].stack.itemId, "bolts");
  console.log("ok metalwork forge + save");
}

// Chemistry: bandage + sterile + save
{
  const inv = new PlayerInventory();
  inv.tryInsert(createItemStack("cloth", 4));
  inv.tryInsert(createItemStack("medicinal-herb", 3));
  inv.tryInsert(createItemStack("disinfectant", 1));
  const stations = new StationSystem();
  assert.equal(stations.tryStart("chemistry:bandage", "chemistry", inv).accepted, true);
  assert.equal(inv.totalQuantity("cloth"), 2);
  assert.equal(inv.totalQuantity("medicinal-herb"), 2);
  const done = stations.tick(12);
  assert.equal(done[0].stack.itemId, "bandage");
  assert.equal(done[0].stack.quantity, 2);
  assert.equal(inv.tryInsert(done[0].stack).accepted, true);
  assert.equal(stations.tryStart("chemistry:sterile", "chemistry", inv).accepted, true);
  stations.tick(4);
  const snap = stations.serialize();
  assert.equal(snap.chemistry.entries.length, 1);
  const restored = new StationSystem();
  restored.load(snap);
  assert.equal(restored.queueOf("chemistry").queue.length, 1);
  const finish = restored.tick(20);
  assert.equal(finish[0].stack.itemId, "sterile-bandage");
  console.log("ok chemistry brew + save");
}

// Water collector free rain + purify save
{
  const inv = new PlayerInventory();
  const stations = new StationSystem();
  assert.equal(stations.tryStart("water:rain", "water", inv).accepted, true, "free rain start");
  assert.equal(inv.totalQuantity("rain-water"), 0);
  const done = stations.tick(20);
  assert.equal(done[0].stack.itemId, "rain-water");
  assert.equal(inv.tryInsert(done[0].stack).accepted, true);
  inv.tryInsert(createItemStack("charcoal", 1));
  assert.equal(stations.tryStart("water:purify-rain", "water", inv).accepted, true);
  assert.equal(inv.totalQuantity("rain-water"), 0);
  assert.equal(inv.totalQuantity("charcoal"), 0);
  stations.tick(3);
  const snap = stations.serialize();
  assert.equal(snap.water.entries.length, 1);
  const restored = new StationSystem();
  restored.load(snap);
  const finish = restored.tick(20);
  assert.equal(finish[0].stack.itemId, "clean-water");
  console.log("ok water collector + save");
}

// Composter berries → fertilizer chain
{
  const inv = new PlayerInventory();
  inv.tryInsert(createItemStack("berries", 6));
  inv.tryInsert(createItemStack("bone", 1));
  const stations = new StationSystem();
  assert.equal(stations.tryStart("composter:berries", "composter", inv).accepted, true);
  let done = stations.tick(20);
  assert.equal(done[0].stack.itemId, "compost");
  assert.equal(inv.tryInsert(done[0].stack).accepted, true);
  assert.equal(stations.tryStart("composter:berries", "composter", inv).accepted, true);
  done = stations.tick(20);
  assert.equal(inv.tryInsert(done[0].stack).accepted, true);
  assert.equal(inv.totalQuantity("compost"), 2);
  assert.equal(stations.tryStart("composter:fertilizer", "composter", inv).accepted, true);
  assert.equal(inv.totalQuantity("compost"), 0);
  assert.equal(inv.totalQuantity("bone"), 0);
  stations.tick(4);
  const snap = stations.serialize();
  assert.equal(snap.composter.entries.length, 1);
  const restored = new StationSystem();
  restored.load(snap);
  const finish = restored.tick(20);
  assert.equal(finish[0].stack.itemId, "fertilizer");
  console.log("ok composter + save");
}

// Process catalog sanity
assert.ok(getStationProcess("campfire:raw-meat"));
assert.ok(getStationProcess("campfire:meat-stew"));
assert.ok(getStationProcess("campfire:vegetable-soup"));
assert.ok(getStationProcess("campfire:warming-meal"));
assert.ok(getStationProcess("campfire:survival-meal"));
assert.ok(getStationProcess("metalwork:plate"));
assert.ok(getStationProcess("chemistry:herbal-drink"));
assert.ok(getStationProcess("water:rain"));
assert.ok(getStationProcess("composter:fertilizer"));
assert.ok(getStationProcess("recycler:scrap-device"));
assert.equal(getStationProcess("nope"), null);

// Multi-ingredient stew cook
{
  const inv = new PlayerInventory();
  inv.tryInsert(createItemStack("roasted-meat", 1));
  inv.tryInsert(createItemStack("root-vegetable", 1));
  inv.tryInsert(createItemStack("clean-water", 1));
  inv.tryInsert(createItemStack("pine-log", 2));
  const stations = new StationSystem();
  assert.equal(stations.canStart("campfire:meat-stew", "campfire", inv).ok, true);
  assert.equal(stations.tryStart("campfire:meat-stew", "campfire", inv).accepted, true);
  assert.equal(inv.totalQuantity("roasted-meat"), 0);
  assert.equal(inv.totalQuantity("root-vegetable"), 0);
  assert.equal(inv.totalQuantity("clean-water"), 0);
  assert.equal(inv.totalQuantity("pine-log"), 1);
  const done = stations.tick(20);
  assert.equal(done[0].stack.itemId, "meat-stew");
  console.log("ok campfire meat stew");
}

console.log("all station checks passed");
