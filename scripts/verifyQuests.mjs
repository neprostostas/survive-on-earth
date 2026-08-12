/**
 * Quest list / tracker (domain).
 */
import assert from "node:assert/strict";
import { QuestSystem, QUEST_DEFS } from "../src/quests/QuestSystem.ts";
import {
  nextActiveQuestId,
  questProgress,
  questRows,
  trackedQuestRow,
} from "../src/quests/QuestView.ts";

const sys = new QuestSystem();
assert.equal(questProgress(sys).done, 0);
assert.equal(questProgress(sys).total, QUEST_DEFS.length);
assert.equal(questRows(sys, "active").length, QUEST_DEFS.length);
assert.equal(questRows(sys, "done").length, 0);
assert.equal(trackedQuestRow(sys)?.id, "collect-pine-logs");

sys.advance("collect-pine-logs", 6);
assert.equal(questProgress(sys).done, 1);
assert.equal(questRows(sys, "done").length, 1);
assert.equal(questRows(sys, "active").length, QUEST_DEFS.length - 1);
assert.ok(questRows(sys, "done")[0]?.completed);

const next = nextActiveQuestId(sys);
assert.notEqual(next, "collect-pine-logs");
sys.setTracked(next);
assert.equal(trackedQuestRow(sys)?.id, next);
assert.equal(trackedQuestRow(sys)?.tracked, true);
assert.ok(questRows(sys, "active")[0]?.tracked, "tracked sorts first");

console.log("ok quest view domain");
