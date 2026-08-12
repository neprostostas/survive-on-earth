/**
 * Farming domain: plant / water / fertilize / harvest + interact decisions.
 */
import assert from "node:assert/strict";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemStack } from "../src/items/ItemSystem.ts";
import { FarmingSystem } from "../src/farming/FarmingSystem.ts";
import {
  decideFarmInteract,
  farmPlotInteractableId,
  isFarmPlotInteractionId,
  plotIdFromInteractable,
  pickPlantSeed,
} from "../src/farming/FarmAccess.ts";

assert.equal(farmPlotInteractableId("home-plot-1"), "farm-plot-home-plot-1");
assert.equal(plotIdFromInteractable("farm-plot-home-plot-1"), "home-plot-1");
assert.equal(isFarmPlotInteractionId("farm-plot-home-plot-1"), true);
assert.equal(isFarmPlotInteractionId("campfire-01"), false);

{
  const farm = new FarmingSystem();
  const inv = new PlayerInventory();
  inv.tryInsert(createItemStack("berry-seeds", 2));
  inv.tryInsert(createItemStack("clean-water", 2));
  inv.tryInsert(createItemStack("fertilizer", 1));

  const empty = farm.ensurePlot("p1");
  let d = decideFarmInteract(empty, inv);
  assert.equal(d.kind, "plant");
  assert.equal(d.seedId, "berry-seeds");

  assert.equal(farm.plant("p1", "berry-seeds", inv), true);
  d = decideFarmInteract(farm.getPlot("p1"), inv);
  assert.equal(d.kind, "water");

  assert.equal(farm.water("p1", inv), true);
  d = decideFarmInteract(farm.getPlot("p1"), inv);
  assert.equal(d.kind, "fertilize");

  assert.equal(farm.fertilize("p1", inv), true);
  d = decideFarmInteract(farm.getPlot("p1"), inv);
  assert.equal(d.kind, "status");

  // Fertilized + watered finishes faster than base 90s (90 / 1.45 ≈ 62s)
  farm.tick(65);
  d = decideFarmInteract(farm.getPlot("p1"), inv);
  assert.equal(d.kind, "harvest");
  assert.equal(farm.harvest("p1", inv), true);
  assert.equal(inv.totalQuantity("berries"), 6, "4 base + 2 fert bonus");
  console.log("ok farm fertilize + clean water + interact");
}

{
  const farm = new FarmingSystem();
  const inv = new PlayerInventory();
  inv.tryInsert(createItemStack("herb-seeds", 1));
  inv.tryInsert(createItemStack("rain-water", 1));
  assert.equal(farm.plant("h1", "herb-seeds", inv), true);
  assert.equal(farm.water("h1", inv), true);
  farm.tick(120);
  assert.equal(farm.harvest("h1", inv), true);
  assert.equal(inv.totalQuantity("medicinal-herb"), 3);
  console.log("ok herb crop + rain water");
}

// save/load fertilized flag
{
  const farm = new FarmingSystem();
  const inv = new PlayerInventory();
  inv.tryInsert(createItemStack("root-seeds", 1));
  inv.tryInsert(createItemStack("water-bottle", 1));
  inv.tryInsert(createItemStack("fertilizer", 1));
  farm.plant("r1", "root-seeds", inv);
  farm.water("r1", inv);
  farm.fertilize("r1", inv);
  farm.tick(10);
  const snap = farm.serialize();
  const restored = new FarmingSystem();
  restored.load(snap);
  const plot = restored.all[0];
  assert.equal(plot.fertilized, true);
  assert.ok(plot.growth > 0);
  console.log("ok farm save/load");
}

// seed pick priority + need-seed
{
  const inv = new PlayerInventory();
  inv.tryInsert(createItemStack("root-seeds", 1));
  inv.tryInsert(createItemStack("berry-seeds", 1));
  assert.equal(pickPlantSeed(inv), "berry-seeds");
  // Quick-slot preference beats catalog priority
  inv.tryInsert(createItemStack("herb-seeds", 1));
  assert.equal(pickPlantSeed(inv, ["root-seeds", null]), "root-seeds");
  const noSeed = new PlayerInventory();
  assert.equal(pickPlantSeed(noSeed), null);
  const farm = new FarmingSystem();
  const plot = farm.ensurePlot("x");
  const d = decideFarmInteract(plot, noSeed);
  assert.equal(d.blocked, "need-seed");
  console.log("ok farm access helpers");
}

// base tank irrigation (no bottles)
{
  const farm = new FarmingSystem();
  const inv = new PlayerInventory();
  inv.tryInsert(createItemStack("berry-seeds", 1));
  farm.plant("tank", "berry-seeds", inv);
  const dry = decideFarmInteract(farm.getPlot("tank"), inv, { baseCanIrrigate: true });
  assert.equal(dry.kind, "water");
  assert.equal(farm.water("tank", inv, { fromBaseTank: true }), true);
  assert.equal(farm.getPlot("tank")?.hydrated, true);
  console.log("ok farm base irrigation");
}

console.log("all farming checks passed");
