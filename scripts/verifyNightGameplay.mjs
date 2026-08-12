/**
 * Night combat pressure domain.
 */
import assert from "node:assert/strict";
import { WorldClock } from "../src/world/WorldClock.ts";
import {
  NIGHT_ACQUIRE_MUL,
  nightAcquireMul,
  nightExtraStalkerCount,
  scaledAcquireRange,
  scaledHearRadius,
  withNightSpawnPressure,
} from "../src/enemies/NightGameplay.ts";
import { idleEnemyNoticesPlayer } from "../src/enemies/enemyDetection.ts";

const clock = new WorldClock(480);
clock.load(0.5);
assert.equal(clock.isNight, false);
clock.load(0.1);
assert.equal(clock.isNight, true);
clock.load(0.9);
assert.equal(clock.isNight, true);

assert.equal(nightAcquireMul(false), 1);
assert.equal(nightAcquireMul(true), NIGHT_ACQUIRE_MUL);
assert.equal(scaledAcquireRange(4, true), 4 * NIGHT_ACQUIRE_MUL);
assert.ok(scaledHearRadius(2, true) > 2);

assert.equal(nightExtraStalkerCount(false, "pine-woods"), 0);
assert.equal(nightExtraStalkerCount(true, "home"), 0);
assert.equal(nightExtraStalkerCount(true, "pine-woods"), 2);
assert.equal(nightExtraStalkerCount(true, "bunker-echo"), 1);

const day = withNightSpawnPressure(
  [Object.freeze({ archetypeId: "shambler", count: 2 })],
  false,
  "pine-woods",
);
assert.equal(day.length, 1);

const night = withNightSpawnPressure(
  [Object.freeze({ archetypeId: "shambler", count: 2 })],
  true,
  "pine-woods",
);
assert.ok(night.some((s) => s.archetypeId === "stalker-night" && s.count === 2));

const boosted = withNightSpawnPressure(
  [Object.freeze({ archetypeId: "stalker-night", count: 1 })],
  true,
  "pine-woods",
);
assert.equal(boosted.find((s) => s.archetypeId === "stalker-night")?.count, 3);

// Night acquire stretches vision enough to notice at former edge+.
const base = 4;
const daySample = {
  distance: base * 1.2,
  angleFromFacing: 0,
  sneaking: false,
  sprinting: false,
  acquireRange: base,
};
assert.equal(idleEnemyNoticesPlayer(daySample), false);
const nightSample = {
  ...daySample,
  acquireRange: scaledAcquireRange(base, true),
};
assert.equal(idleEnemyNoticesPlayer(nightSample), true);

console.log("ok night gameplay domain");
