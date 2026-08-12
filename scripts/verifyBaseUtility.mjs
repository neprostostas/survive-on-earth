/**
 * Base power/water coupling for placeable pieces.
 */
import assert from "node:assert/strict";
import {
  builtPowerInteractableId,
  FARM_BASE_IRRIGATION,
  formatBaseUtilityHud,
  isBuiltPowerInteractionId,
  isInteractableBuildPiece,
  isStandalonePowerPiece,
  isWaterInfrastructurePiece,
  pieceInstanceFromBuiltPower,
  POWER_PIECE_SPECS,
  powerDeviceIdForPiece,
} from "../src/building/BuiltPieceWiring.ts";
import { PowerGrid } from "../src/base/PowerGrid.ts";
import {
  COLLECTOR_PASSIVE_DIRTY_PER_SEC,
  COLLECTOR_PUMP_DIRTY_PER_SEC,
  WaterSystem,
} from "../src/base/WaterSystem.ts";
import { BuildingRegistry } from "../src/building/BuildingRegistry.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemStack } from "../src/items/ItemSystem.ts";

assert.equal(isStandalonePowerPiece("camp-generator"), true);
assert.equal(isStandalonePowerPiece("lantern-post"), true);
assert.equal(isStandalonePowerPiece("furnace"), false, "furnace is station, not standalone power ix");
assert.equal(isInteractableBuildPiece("camp-generator"), true);
assert.equal(isWaterInfrastructurePiece("water-collector"), true);
assert.equal(isWaterInfrastructurePiece("camp-generator"), false);

const powerId = builtPowerInteractableId("build-7", "camp-generator");
assert.equal(powerId, "built-power-build-7:camp-generator");
assert.equal(isBuiltPowerInteractionId(powerId), true);
assert.equal(pieceInstanceFromBuiltPower(powerId), "build-7");
assert.equal(powerDeviceIdForPiece("build-7"), "build-power-build-7");
assert.ok(POWER_PIECE_SPECS["camp-generator"]);

{
  const grid = new PowerGrid();
  const water = new WaterSystem();
  const building = new BuildingRegistry();

  building.select("floor-l1");
  assert.ok(building.place(0, 0));
  building.select("camp-generator");
  const gen = building.place(0, 0);
  assert.ok(gen);

  building.select("floor-l1");
  assert.ok(building.place(1, 0));
  building.select("lantern-post");
  const lamp = building.place(1, 0);
  assert.ok(lamp);

  building.select("floor-l1");
  assert.ok(building.place(2, 0));
  building.select("water-collector");
  assert.ok(building.place(2, 0));

  building.select("floor-l1");
  assert.ok(building.place(3, 0));
  building.select("furnace");
  assert.ok(building.place(3, 0));

  const keep = new Set();
  let hasWater = false;
  for (const piece of building.all) {
    if (isWaterInfrastructurePiece(piece.pieceId)) hasWater = true;
    const spec = POWER_PIECE_SPECS[piece.pieceId];
    if (!spec) continue;
    const id = powerDeviceIdForPiece(piece.id);
    keep.add(id);
    grid.syncBuildDevice({
      id,
      kind: spec.kind,
      label: spec.label,
      production: spec.production,
      consumption: spec.consumption,
      priority: spec.priority,
      enabled: !spec.needsFuel,
      fueled: spec.needsFuel ? false : undefined,
    });
  }
  grid.pruneBuildDevicesExcept(keep);
  water.setCollector(hasWater);
  water.setPump(hasWater);
  water.setPurifier(hasWater);

  assert.equal(hasWater, true);
  assert.equal(water.hasCollector, true);
  assert.equal(water.pumpOn, true);
  assert.equal(water.purifierOn, true);

  const genDeviceId = powerDeviceIdForPiece(gen.id);
  const genDev = grid.getDevice(genDeviceId);
  assert.ok(genDev);
  assert.equal(genDev.fueled, false);
  assert.equal(grid.production, 0, "unfueled generator produces 0");

  const inv = new PlayerInventory();
  assert.equal(inv.tryInsert(createItemStack("charcoal", 1)).accepted, true);
  const slot = inv.findFirstSlotByItemId("charcoal");
  assert.notEqual(slot, null);
  const stack = inv.getSlot(/** @type {number} */ (slot)).stack;
  assert.ok(stack);
  inv.exchangeWholeStack(/** @type {number} */ (slot), stack, null);

  const fueled = grid.tryInteractDevice(genDeviceId, true);
  assert.equal(fueled.ok, true);
  assert.equal(fueled.message, "fueled");
  assert.ok(grid.production >= 10);

  const lampId = powerDeviceIdForPiece(lamp.id);
  const lampToggle = grid.tryInteractDevice(lampId, false);
  assert.equal(lampToggle.ok, true);
  assert.ok(lampToggle.message === "on" || lampToggle.message === "off");

  assert.equal(FARM_BASE_IRRIGATION, 8);
  const before = water.cleanWater;
  assert.equal(water.irrigate(FARM_BASE_IRRIGATION), true);
  assert.equal(water.cleanWater, before - FARM_BASE_IRRIGATION);

  // prune removes demolish leftovers
  const orphanId = powerDeviceIdForPiece("gone");
  grid.syncBuildDevice({
    id: orphanId,
    kind: "generator",
    label: "orphan",
    production: 1,
    consumption: 0,
    priority: 1,
    enabled: true,
    fueled: true,
  });
  grid.pruneBuildDevicesExcept(keep);
  assert.equal(grid.getDevice(orphanId), null);

  const hud = formatBaseUtilityHud({
    production: 10,
    consumption: 2,
    storage: 40,
    batteryCapacity: 100,
    cleanWater: 20,
    cleanCapacity: 120,
    dirtyWater: 0,
    pumpOn: true,
    purifierOn: true,
  });
  assert.equal(hud.powerNetLabel, "+8");
  assert.equal(hud.batteryLabel, "40/100");
  assert.equal(hud.cleanLabel, "20/120");
  assert.equal(hud.deficit, false);
  assert.equal(hud.waterLow, false);
  const dry = formatBaseUtilityHud({
    production: 0,
    consumption: 3,
    storage: 0,
    batteryCapacity: 100,
    cleanWater: 2,
    cleanCapacity: 120,
    dirtyWater: 0,
    pumpOn: false,
    purifierOn: false,
  });
  assert.equal(dry.deficit, true);
  assert.equal(dry.waterLow, true);
  assert.ok(dry.powerNetLabel.startsWith("-"));

  // Passive rain: collector fills dirty without power; pump+purify need power
  {
    const tank = new WaterSystem();
    tank.load({ dirty: 0, clean: 0, pump: false, purifier: false });
    tank.setCollector(true);
    tank.tick(10, false);
    const passiveOnly = tank.dirtyWater;
    assert.ok(
      Math.abs(passiveOnly - COLLECTOR_PASSIVE_DIRTY_PER_SEC * 10) < 0.001,
      `unpowered collector passive ≈ ${COLLECTOR_PASSIVE_DIRTY_PER_SEC * 10}, got ${passiveOnly}`,
    );
    assert.equal(tank.cleanWater, 0, "no purifier without power");

    tank.tick(10, false);
    // still no clean
    assert.equal(tank.cleanWater, 0);

    // No collector → no fill
    const dryTank = new WaterSystem();
    dryTank.load({ dirty: 0, clean: 0, pump: true, purifier: true });
    dryTank.setCollector(false);
    dryTank.setPump(true);
    dryTank.setPurifier(true);
    dryTank.tick(20, true);
    assert.equal(dryTank.dirtyWater, 0, "no collector means no tank fill even if powered");

    // Powered: passive + pump boost dirty, then purifier makes clean
    const powered = new WaterSystem();
    powered.load({ dirty: 0, clean: 0, pump: true, purifier: true });
    powered.setCollector(true);
    powered.setPump(true);
    powered.setPurifier(true);
    // Feed enough dirty for purify loop + accumulate
    powered.tick(30, true);
    assert.ok(powered.dirtyWater > 0 || powered.cleanWater > 0, "powered collector should produce water");
    assert.ok(
      powered.cleanWater > 0,
      "powered purifier should convert dirty → clean over time",
    );
    // Pump rate higher path: short unpowered vs powered dirty intake before purify catches up
    const a = new WaterSystem();
    a.load({ dirty: 0, clean: 120, pump: true, purifier: false }); // clean full so no purify drain of dirty
    a.setCollector(true);
    a.setPump(true);
    a.tick(10, false);
    const unpoweredDirty = a.dirtyWater;
    const b = new WaterSystem();
    b.load({ dirty: 0, clean: 120, pump: true, purifier: false });
    b.setCollector(true);
    b.setPump(true);
    b.tick(10, true);
    const poweredDirty = b.dirtyWater;
    assert.ok(
      poweredDirty > unpoweredDirty + COLLECTOR_PUMP_DIRTY_PER_SEC * 5,
      `pump should accelerate dirty intake (passive ${unpoweredDirty} vs powered ${poweredDirty})`,
    );

    const hudDirty = formatBaseUtilityHud({
      production: 0,
      consumption: 0,
      storage: 50,
      batteryCapacity: 100,
      cleanWater: 18,
      cleanCapacity: 120,
      dirtyWater: 7.2,
      dirtyCapacity: 80,
      pumpOn: true,
      purifierOn: true,
      hasCollector: true,
    });
    assert.equal(hudDirty.cleanLabel, "18/120");
    assert.ok(hudDirty.dirtyHint.includes("7"));
    assert.ok(hudDirty.waterLabel.includes("dirty"));
    assert.equal(hudDirty.catchingRain, true);
    console.log("ok passive rain + dual water path");
  }

  // Lamp lights only when isPowered: enabled + grid supply
  {
    const g = new PowerGrid();
    g.syncBuildDevice({
      id: "build-power-g1",
      kind: "generator",
      label: "Gen",
      production: 10,
      consumption: 0,
      priority: 1,
      enabled: false,
      fueled: false,
    });
    g.syncBuildDevice({
      id: "build-power-l1",
      kind: "lamp",
      label: "Lamp",
      production: 0,
      consumption: 1,
      priority: 3,
      enabled: true,
    });
    assert.equal(g.isPowered("build-power-l1"), false, "enabled lamp without power is dark");
    g.tryInteractDevice("build-power-g1", true);
    assert.equal(g.isPowered("build-power-g1"), true);
    assert.equal(g.isPowered("build-power-l1"), true, "fueled gen powers lamp");
    g.tryInteractDevice("build-power-l1", false);
    assert.equal(g.isPowered("build-power-l1"), false, "toggled-off lamp is dark");
    console.log("ok lantern isPowered truth table");
  }

  console.log("ok base utility power + water wiring");
}
