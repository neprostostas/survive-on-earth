/**
 * Save/load + death-bag recovery domain checks (no Babylon / DOM).
 */
import assert from "node:assert/strict";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { PlayerEquipment } from "../src/equipment/PlayerEquipment.ts";
import { PlayerWeaponSlot } from "../src/equipment/PlayerWeaponSlot.ts";
import { PlayerBackpackSlot } from "../src/equipment/PlayerBackpackSlot.ts";
import { PlayerQuickSlot } from "../src/equipment/PlayerQuickSlot.ts";
import { PlayerUtilitySlot } from "../src/equipment/PlayerUtilitySlot.ts";
import { createItemStack } from "../src/items/ItemSystem.ts";
import { backpackExtraSlots } from "../src/equipment/BackpackTypes.ts";
import { DeathBagSystem } from "../src/death/DeathBagSystem.ts";
import {
  SAVE_VERSION,
  serializeStack,
  serializeInventorySlot,
  deserializeStack,
  deserializeStacks,
} from "../src/save/SaveSystem.ts";

function grantStarter(inv, equipment, weapon, backpack) {
  const pack = createItemStack("expedition-backpack", 1);
  assert.equal(backpack.equipIfAccepted(pack, () => true), true);
  inv.setExtraSlotCount(backpackExtraSlots("expedition-backpack"));
  equipment.equipIfAccepted("head", createItemStack("composite-helmet", 1), () => true);
  equipment.equipIfAccepted("torso", createItemStack("composite-chest", 1), () => true);
  equipment.equipIfAccepted("legs", createItemStack("composite-legs", 1), () => true);
  equipment.equipIfAccepted("feet", createItemStack("composite-boots", 1), () => true);
  weapon.equipIfAccepted(createItemStack("spear", 1), () => true);
  const packs = [
    createItemStack("limestone", 20),
    createItemStack("pine-log", 20),
    createItemStack("hatchet", 1),
    createItemStack("pickaxe", 1),
    createItemStack("plant-fiber", 10),
    createItemStack("berries", 5),
    createItemStack("bandage", 2),
    createItemStack("scrap-metal", 4),
    createItemStack("nails", 8),
    createItemStack("stone", 6),
  ];
  for (let i = 0; i < packs.length; i += 1) {
    assert.equal(inv.placeIntoEmptySlot(i, packs[i]), true);
  }
}

function snapshotLoadout(inv, equipment, weapon, backpack) {
  const inventory = inv.getSlots().filter((s) => s.stack).map((s) => serializeInventorySlot(s.index, s.stack));
  const eq = {};
  for (const slot of equipment.getSlots()) {
    eq[slot.id] = slot.stack ? serializeStack(slot.stack) : null;
  }
  return {
    inventory,
    inventoryExtraSlots: inv.extraSlots,
    equipment: eq,
    weapon: weapon.current ? serializeStack(weapon.current) : null,
    backpack: backpack.current ? serializeStack(backpack.current) : null,
  };
}

function restoreLoadout(blob, inv, equipment, weapon, backpack) {
  inv.clearAllStorage();
  for (const slot of equipment.getSlots()) {
    if (slot.stack) equipment.unequipIfAccepted(slot.id, slot.stack, () => true);
  }
  if (weapon.current) weapon.unequipIfAccepted(weapon.current, () => true);
  if (backpack.current) backpack.unequipIfAccepted(backpack.current, () => true);

  let extra = Math.max(0, Math.floor(blob.inventoryExtraSlots ?? 0));
  if (blob.backpack) {
    const pack = deserializeStack(blob.backpack);
    if (pack) {
      backpack.equipIfAccepted(pack, () => true);
      extra = Math.max(extra, backpackExtraSlots(pack.itemId));
    }
  }
  inv.setExtraSlotCount(extra);
  const indexed = [];
  for (const entry of blob.inventory ?? []) {
    const stacks = deserializeStacks(entry);
    if (stacks.length === 0) continue;
    if ("index" in entry && typeof entry.index === "number") {
      indexed.push({ index: entry.index, stack: stacks[0] });
    }
  }
  inv.restoreSlots(indexed, extra);
  if (blob.equipment) {
    for (const id of Object.keys(blob.equipment)) {
      const data = blob.equipment[id];
      if (!data) continue;
      const stack = deserializeStack(data);
      if (stack) equipment.equipIfAccepted(id, stack, () => true);
    }
  }
  if (blob.weapon) {
    const stack = deserializeStack(blob.weapon);
    if (stack) weapon.equipIfAccepted(stack, () => true);
  }
}

// ── Starter kit round-trip ──
{
  const inv = new PlayerInventory();
  const equipment = new PlayerEquipment();
  const weapon = new PlayerWeaponSlot();
  const backpack = new PlayerBackpackSlot();
  grantStarter(inv, equipment, weapon, backpack);
  const snap = snapshotLoadout(inv, equipment, weapon, backpack);
  assert.equal(snap.inventory.length, 10, "10 pocket stacks saved");
  assert.ok(snap.weapon, "spear saved");
  assert.ok(snap.backpack, "backpack saved");
  assert.equal(Object.values(snap.equipment).filter(Boolean).length, 4, "4 armor saved");

  const inv2 = new PlayerInventory();
  const equipment2 = new PlayerEquipment();
  const weapon2 = new PlayerWeaponSlot();
  const backpack2 = new PlayerBackpackSlot();
  restoreLoadout(snap, inv2, equipment2, weapon2, backpack2);

  assert.equal(inv2.occupiedSlotCount, 10, "restore pockets");
  assert.equal(weapon2.current?.itemId, "spear");
  assert.equal(backpack2.current?.itemId, "expedition-backpack");
  assert.equal(equipment2.getSlot("head").stack?.itemId, "composite-helmet");
  assert.equal(inv2.getSlot(0).stack?.itemId, "limestone");
  assert.equal(inv2.getSlot(2).stack?.itemId, "hatchet");
  console.log("ok starter save/load round-trip");
}

// ── Death bag location + recover ──
{
  const inv = new PlayerInventory();
  const equipment = new PlayerEquipment();
  const weapon = new PlayerWeaponSlot();
  const backpack = new PlayerBackpackSlot();
  const q0 = new PlayerQuickSlot();
  const q1 = new PlayerQuickSlot();
  const utility = new PlayerUtilitySlot();
  grantStarter(inv, equipment, weapon, backpack);

  const bags = new DeathBagSystem();
  const bag = bags.captureAndStrip({
    locationId: "pine-woods",
    x: 4,
    z: -2,
    inventory: inv,
    equipment,
    weapon,
    backpack,
    quicks: [q0, q1],
    utility,
  });
  assert.equal(bag.locationId, "pine-woods");
  assert.equal(inv.occupiedSlotCount, 0);
  assert.equal(weapon.current, null);
  assert.equal(backpack.current, null);
  assert.equal(equipment.getSlot("head").stack, null);
  assert.ok(bag.stacks.length >= 15, "full loadout in bag");

  assert.equal(bags.bagsAt("home").length, 0);
  assert.equal(bags.bagsAt("pine-woods").length, 1);

  const serialized = bags.serialize();
  const json = JSON.parse(JSON.stringify(serialized));
  const bags2 = new DeathBagSystem();
  bags2.load(json);
  assert.equal(bags2.bagsAt("pine-woods")[0]?.locationId, "pine-woods");

  const lootInv = new PlayerInventory();
  const result = bags2.lootInto(bag.id, lootInv);
  assert.ok(result.inserted > 0);
  if (result.gone) {
    assert.equal(bags2.bagsAt("pine-woods").length, 0);
  } else {
    assert.equal(bags2.bagsAt("pine-woods").length, 1);
  }
  console.log("ok death bag location + loot", { inserted: result.inserted, gone: result.gone });
}

{
  assert.equal(SAVE_VERSION, 5);
  console.log("ok death bag in save shape");
}

console.log("all save/death checks passed");
