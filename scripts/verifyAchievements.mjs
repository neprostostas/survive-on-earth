/**
 * Achievement list / progress (domain).
 */
import assert from "node:assert/strict";
import { AchievementSystem, ACHIEVEMENT_DEFS } from "../src/progression/Achievements.ts";
import { achievementProgress, achievementRows } from "../src/progression/AchievementView.ts";

const sys = new AchievementSystem();
assert.equal(achievementProgress(sys).unlocked, 0);
assert.equal(achievementProgress(sys).total, ACHIEVEMENT_DEFS.length);
assert.equal(achievementRows(sys, "unlocked").length, 0);
assert.equal(achievementRows(sys, "locked").length, ACHIEVEMENT_DEFS.length);

assert.equal(sys.tryUnlock("first-kill"), true);
assert.equal(sys.tryUnlock("first-kill"), false);
assert.equal(achievementProgress(sys).unlocked, 1);
assert.equal(achievementRows(sys, "unlocked").length, 1);
assert.equal(achievementRows(sys, "unlocked")[0]?.id, "first-kill");
assert.ok(achievementRows(sys, "all")[0]?.unlocked, "unlocked sorted first");

console.log("ok achievement view domain");
