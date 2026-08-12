import type { ItemId } from "../items/ItemId.ts";
import type { WorkstationKind } from "./WorkstationQueue.ts";

export interface StationMaterial {
  readonly itemId: ItemId;
  readonly quantity: number;
}

export interface StationProcessDef {
  readonly id: string;
  readonly station: WorkstationKind;
  readonly title: string;
  /** Single primary input (legacy). Prefer `inputs` for multi-ingredient cooks. */
  readonly input?: StationMaterial;
  /** Multi-ingredient gate (soup / stew). Combined with `input` when both set. */
  readonly inputs?: readonly StationMaterial[];
  readonly fuel?: StationMaterial;
  readonly timeSec: number;
  readonly output: StationMaterial;
}

/** All material costs except fuel. */
export function stationProcessInputs(process: StationProcessDef): readonly StationMaterial[] {
  const list: StationMaterial[] = [];
  if (process.inputs) {
    for (const row of process.inputs) {
      if (row.quantity > 0) list.push(row);
    }
  } else if (process.input && process.input.quantity > 0) {
    list.push(process.input);
  }
  return Object.freeze(list);
}

/**
 * Timed station conversions (LDOE loop): cook / chop / smelt.
 * Inventory blueprints stay for tools; these cover process stations.
 */
export const STATION_PROCESSES: readonly StationProcessDef[] = Object.freeze([
  // ── Campfire ──
  Object.freeze({
    id: "campfire:berries",
    station: "campfire" as const,
    title: "Cook Berries",
    input: Object.freeze({ itemId: "berries" as const, quantity: 3 }),
    fuel: Object.freeze({ itemId: "pine-log" as const, quantity: 1 }),
    timeSec: 8,
    output: Object.freeze({ itemId: "cooked-berries" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "campfire:raw-meat",
    station: "campfire" as const,
    title: "Roast Meat",
    input: Object.freeze({ itemId: "raw-meat" as const, quantity: 1 }),
    fuel: Object.freeze({ itemId: "pine-log" as const, quantity: 1 }),
    timeSec: 12,
    output: Object.freeze({ itemId: "roasted-meat" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "campfire:fish",
    station: "campfire" as const,
    title: "Roast Fish",
    input: Object.freeze({ itemId: "river-fish" as const, quantity: 1 }),
    fuel: Object.freeze({ itemId: "pine-log" as const, quantity: 1 }),
    timeSec: 10,
    output: Object.freeze({ itemId: "roasted-meat" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "campfire:charcoal",
    station: "campfire" as const,
    title: "Make Charcoal",
    input: Object.freeze({ itemId: "pine-log" as const, quantity: 2 }),
    timeSec: 14,
    output: Object.freeze({ itemId: "charcoal" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "campfire:vegetable-soup",
    station: "campfire" as const,
    title: "Vegetable Soup",
    inputs: Object.freeze([
      Object.freeze({ itemId: "root-vegetable" as const, quantity: 1 }),
      Object.freeze({ itemId: "mushroom" as const, quantity: 1 }),
      Object.freeze({ itemId: "clean-water" as const, quantity: 1 }),
    ]),
    fuel: Object.freeze({ itemId: "pine-log" as const, quantity: 1 }),
    timeSec: 16,
    output: Object.freeze({ itemId: "vegetable-soup" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "campfire:mushroom-soup",
    station: "campfire" as const,
    title: "Mushroom Soup",
    inputs: Object.freeze([
      Object.freeze({ itemId: "mushroom" as const, quantity: 2 }),
      Object.freeze({ itemId: "clean-water" as const, quantity: 1 }),
    ]),
    fuel: Object.freeze({ itemId: "pine-log" as const, quantity: 1 }),
    timeSec: 14,
    output: Object.freeze({ itemId: "mushroom-soup" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "campfire:meat-stew",
    station: "campfire" as const,
    title: "Meat Stew",
    inputs: Object.freeze([
      Object.freeze({ itemId: "roasted-meat" as const, quantity: 1 }),
      Object.freeze({ itemId: "root-vegetable" as const, quantity: 1 }),
      Object.freeze({ itemId: "clean-water" as const, quantity: 1 }),
    ]),
    fuel: Object.freeze({ itemId: "pine-log" as const, quantity: 1 }),
    timeSec: 18,
    output: Object.freeze({ itemId: "meat-stew" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "campfire:warm-drink",
    station: "campfire" as const,
    title: "Warm Drink",
    inputs: Object.freeze([
      Object.freeze({ itemId: "clean-water" as const, quantity: 1 }),
      Object.freeze({ itemId: "berries" as const, quantity: 1 }),
    ]),
    fuel: Object.freeze({ itemId: "pine-log" as const, quantity: 1 }),
    timeSec: 10,
    output: Object.freeze({ itemId: "warm-drink" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "campfire:warming-meal",
    station: "campfire" as const,
    title: "Warming Meal",
    inputs: Object.freeze([
      Object.freeze({ itemId: "roasted-meat" as const, quantity: 1 }),
      Object.freeze({ itemId: "warm-drink" as const, quantity: 1 }),
    ]),
    fuel: Object.freeze({ itemId: "pine-log" as const, quantity: 1 }),
    timeSec: 16,
    output: Object.freeze({ itemId: "warming-meal" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "campfire:survival-meal",
    station: "campfire" as const,
    title: "Survival Meal",
    inputs: Object.freeze([
      Object.freeze({ itemId: "meat-stew" as const, quantity: 1 }),
      Object.freeze({ itemId: "corn" as const, quantity: 1 }),
      Object.freeze({ itemId: "herbal-drink" as const, quantity: 1 }),
    ]),
    fuel: Object.freeze({ itemId: "pine-log" as const, quantity: 1 }),
    timeSec: 22,
    output: Object.freeze({ itemId: "survival-meal" as const, quantity: 1 }),
  }),

  // ── Woodworking / chopping stump ──
  Object.freeze({
    id: "woodwork:plank",
    station: "woodworking" as const,
    title: "Cut Planks",
    input: Object.freeze({ itemId: "pine-log" as const, quantity: 1 }),
    timeSec: 6,
    output: Object.freeze({ itemId: "wood-plank" as const, quantity: 2 }),
  }),
  Object.freeze({
    id: "woodwork:hardwood-plank",
    station: "woodworking" as const,
    title: "Cut Hardwood",
    input: Object.freeze({ itemId: "hardwood-log" as const, quantity: 1 }),
    timeSec: 9,
    output: Object.freeze({ itemId: "hardwood-plank" as const, quantity: 2 }),
  }),

  // ── Furnace ──
  Object.freeze({
    id: "furnace:iron",
    station: "furnace" as const,
    title: "Smelt Iron",
    input: Object.freeze({ itemId: "iron-ore" as const, quantity: 2 }),
    fuel: Object.freeze({ itemId: "charcoal" as const, quantity: 1 }),
    timeSec: 14,
    output: Object.freeze({ itemId: "iron-bar" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "furnace:copper-scrap",
    station: "furnace" as const,
    title: "Melt Scrap",
    input: Object.freeze({ itemId: "scrap-metal" as const, quantity: 3 }),
    fuel: Object.freeze({ itemId: "charcoal" as const, quantity: 1 }),
    timeSec: 12,
    output: Object.freeze({ itemId: "iron-bar" as const, quantity: 1 }),
  }),

  // ── Metalwork bench ──
  Object.freeze({
    id: "metalwork:nails",
    station: "metalwork" as const,
    title: "Forge Nails",
    input: Object.freeze({ itemId: "iron-bar" as const, quantity: 1 }),
    fuel: Object.freeze({ itemId: "charcoal" as const, quantity: 1 }),
    timeSec: 10,
    output: Object.freeze({ itemId: "nails" as const, quantity: 8 }),
  }),
  Object.freeze({
    id: "metalwork:bolts",
    station: "metalwork" as const,
    title: "Cut Bolts",
    input: Object.freeze({ itemId: "iron-bar" as const, quantity: 1 }),
    fuel: Object.freeze({ itemId: "charcoal" as const, quantity: 1 }),
    timeSec: 12,
    output: Object.freeze({ itemId: "bolts" as const, quantity: 6 }),
  }),
  Object.freeze({
    id: "metalwork:plate",
    station: "metalwork" as const,
    title: "Roll Plate",
    input: Object.freeze({ itemId: "iron-bar" as const, quantity: 2 }),
    fuel: Object.freeze({ itemId: "charcoal" as const, quantity: 1 }),
    timeSec: 16,
    output: Object.freeze({ itemId: "iron-plate" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "metalwork:screws",
    station: "metalwork" as const,
    title: "Thread Screws",
    input: Object.freeze({ itemId: "iron-bar" as const, quantity: 1 }),
    timeSec: 11,
    output: Object.freeze({ itemId: "screws" as const, quantity: 10 }),
  }),

  // ── Chemistry station ──
  Object.freeze({
    id: "chemistry:bandage",
    station: "chemistry" as const,
    title: "Wrap Bandage",
    input: Object.freeze({ itemId: "cloth" as const, quantity: 2 }),
    fuel: Object.freeze({ itemId: "medicinal-herb" as const, quantity: 1 }),
    timeSec: 8,
    output: Object.freeze({ itemId: "bandage" as const, quantity: 2 }),
  }),
  Object.freeze({
    id: "chemistry:sterile",
    station: "chemistry" as const,
    title: "Sterilize Bandage",
    input: Object.freeze({ itemId: "bandage" as const, quantity: 1 }),
    fuel: Object.freeze({ itemId: "disinfectant" as const, quantity: 1 }),
    timeSec: 10,
    output: Object.freeze({ itemId: "sterile-bandage" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "chemistry:herbal-drink",
    station: "chemistry" as const,
    title: "Brew Herbal Drink",
    input: Object.freeze({ itemId: "medicinal-herb" as const, quantity: 2 }),
    fuel: Object.freeze({ itemId: "water-bottle" as const, quantity: 1 }),
    timeSec: 12,
    output: Object.freeze({ itemId: "herbal-drink" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "chemistry:disinfectant",
    station: "chemistry" as const,
    title: "Mix Disinfectant",
    input: Object.freeze({ itemId: "alcohol" as const, quantity: 1 }),
    fuel: Object.freeze({ itemId: "medicinal-herb" as const, quantity: 1 }),
    timeSec: 14,
    output: Object.freeze({ itemId: "disinfectant" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "chemistry:reagent",
    station: "chemistry" as const,
    title: "Distill Acid",
    input: Object.freeze({ itemId: "plastic" as const, quantity: 2 }),
    fuel: Object.freeze({ itemId: "alcohol" as const, quantity: 1 }),
    timeSec: 18,
    output: Object.freeze({ itemId: "acidic-reagent" as const, quantity: 1 }),
  }),

  // ── Water collector ──
  Object.freeze({
    id: "water:rain",
    station: "water" as const,
    title: "Collect Rain",
    timeSec: 18,
    output: Object.freeze({ itemId: "rain-water" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "water:dirty",
    station: "water" as const,
    title: "Catch Runoff",
    input: Object.freeze({ itemId: "plant-fiber" as const, quantity: 1 }),
    timeSec: 10,
    output: Object.freeze({ itemId: "dirty-water" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "water:purify-rain",
    station: "water" as const,
    title: "Purify Rain",
    input: Object.freeze({ itemId: "rain-water" as const, quantity: 1 }),
    fuel: Object.freeze({ itemId: "charcoal" as const, quantity: 1 }),
    timeSec: 12,
    output: Object.freeze({ itemId: "clean-water" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "water:purify-dirty",
    station: "water" as const,
    title: "Boil Dirty Water",
    input: Object.freeze({ itemId: "dirty-water" as const, quantity: 1 }),
    fuel: Object.freeze({ itemId: "charcoal" as const, quantity: 1 }),
    timeSec: 14,
    output: Object.freeze({ itemId: "clean-water" as const, quantity: 1 }),
  }),

  // ── Composter ──
  Object.freeze({
    id: "composter:berries",
    station: "composter" as const,
    title: "Compost Berries",
    input: Object.freeze({ itemId: "berries" as const, quantity: 3 }),
    timeSec: 16,
    output: Object.freeze({ itemId: "compost" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "composter:mushrooms",
    station: "composter" as const,
    title: "Compost Mushrooms",
    input: Object.freeze({ itemId: "mushroom" as const, quantity: 3 }),
    timeSec: 16,
    output: Object.freeze({ itemId: "compost" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "composter:fiber",
    station: "composter" as const,
    title: "Compost Fiber",
    input: Object.freeze({ itemId: "plant-fiber" as const, quantity: 4 }),
    timeSec: 14,
    output: Object.freeze({ itemId: "compost" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "composter:fertilizer",
    station: "composter" as const,
    title: "Mix Fertilizer",
    input: Object.freeze({ itemId: "compost" as const, quantity: 2 }),
    fuel: Object.freeze({ itemId: "bone" as const, quantity: 1 }),
    timeSec: 18,
    output: Object.freeze({ itemId: "fertilizer" as const, quantity: 1 }),
  }),

  // ── Recycler (junk → base materials) ──
  Object.freeze({
    id: "recycler:empty-can",
    station: "recycler" as const,
    title: "Crush Cans",
    input: Object.freeze({ itemId: "empty-can" as const, quantity: 3 }),
    timeSec: 8,
    output: Object.freeze({ itemId: "scrap-metal" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "recycler:broken-tool",
    station: "recycler" as const,
    title: "Break Down Tool",
    input: Object.freeze({ itemId: "broken-tool" as const, quantity: 1 }),
    timeSec: 10,
    output: Object.freeze({ itemId: "scrap-metal" as const, quantity: 2 }),
  }),
  Object.freeze({
    id: "recycler:scrap-device",
    station: "recycler" as const,
    title: "Salvage Device",
    input: Object.freeze({ itemId: "scrap-device" as const, quantity: 1 }),
    timeSec: 12,
    output: Object.freeze({ itemId: "wire" as const, quantity: 2 }),
  }),
  Object.freeze({
    id: "recycler:broken-radio",
    station: "recycler" as const,
    title: "Strip Radio",
    input: Object.freeze({ itemId: "broken-radio" as const, quantity: 1 }),
    timeSec: 14,
    output: Object.freeze({ itemId: "electronic-part" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "recycler:bent-pipe",
    station: "recycler" as const,
    title: "Straighten Pipe",
    input: Object.freeze({ itemId: "bent-pipe" as const, quantity: 2 }),
    timeSec: 11,
    output: Object.freeze({ itemId: "metal-pipe" as const, quantity: 1 }),
  }),
  Object.freeze({
    id: "recycler:broken-glass",
    station: "recycler" as const,
    title: "Melt Glass",
    input: Object.freeze({ itemId: "broken-glass" as const, quantity: 4 }),
    fuel: Object.freeze({ itemId: "charcoal" as const, quantity: 1 }),
    timeSec: 16,
    output: Object.freeze({ itemId: "glass-pane" as const, quantity: 1 }),
  }),
]);

const BY_ID = new Map(STATION_PROCESSES.map((p) => [p.id, p]));

export function getStationProcess(id: string): StationProcessDef | null {
  return BY_ID.get(id) ?? null;
}

export function processesForStation(kind: WorkstationKind): readonly StationProcessDef[] {
  return Object.freeze(STATION_PROCESSES.filter((p) => p.station === kind));
}
