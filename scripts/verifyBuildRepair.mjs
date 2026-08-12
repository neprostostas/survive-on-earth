/**
 * Build repair cost + damage/repair domain.
 */
import assert from "node:assert/strict";
import {
  BuildingRegistry,
  isDamaged,
  missingHpRatio,
  repairCostFor,
} from "../src/building/BuildingRegistry.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemStack } from "../src/items/ItemSystem.ts";

const inv = new PlayerInventory();
/** @param {string} id @param {number} qty */
function give(id, qty) {
  let left = qty;
  while (left > 0) {
    const take = Math.min(left, 20);
    assert.equal(inv.tryInsert(createItemStack(/** @type {any} */ (id), take)).accepted, true);
    left -= take;
  }
}
give("wood-plank", 40);
give("nails", 30);

const building = new BuildingRegistry();
building.select("floor-l1");
assert.ok(building.placeWithCost(inv, 0, 0).piece);
building.select("wall-l1");
const wall = building.placeWithCost(inv, 0, 0).piece;
assert.ok(wall);
assert.equal(isDamaged(wall), false);
assert.equal(missingHpRatio(wall), 0);

// Damage halfway
const dmg = building.damagePiece(wall.id, wall.maxHp * 0.5);
assert.equal(dmg.destroyed, false);
assert.ok(dmg.piece);
assert.equal(isDamaged(dmg.piece), true);
assert.ok(missingHpRatio(dmg.piece) > 0.4);

const def = building.getSelectedDef();
// re-get def for wall
building.select("wall-l1");
const wallDef = building.getSelectedDef();
assert.ok(wallDef);
const cost = repairCostFor(dmg.piece, wallDef);
assert.ok(cost.length >= 1);
assert.ok(cost.every((c) => c.quantity >= 1));

// Full health → no cost
assert.equal(repairCostFor(wall, wallDef).length, 0);

// try repair
give("wood-plank", 20);
give("nails", 20);
const beforePlanks = inv.totalQuantity("wood-plank");
const fixed = building.tryRepairAt(inv, 0, 0);
assert.equal(fixed.ok, true);
assert.ok(fixed.piece);
assert.equal(fixed.piece.hp, fixed.piece.maxHp);
assert.ok(inv.totalQuantity("wood-plank") < beforePlanks);

// repair again → full
const again = building.tryRepairAt(inv, 0, 0);
assert.equal(again.ok, false);
assert.equal(again.reason, "full");

// destroy
building.damagePiece(wall.id, 9999);
assert.equal(building.all.some((p) => p.id === wall.id), false);

// modes mutual exclusion
building.setRepairMode(true);
assert.equal(building.isRepairMode, true);
assert.equal(building.isDemolishMode, false);
building.setDemolishMode(true);
assert.equal(building.isRepairMode, false);
assert.equal(building.isDemolishMode, true);

console.log("ok build repair + damage domain");
