/**
 * Skill tree purchase + vitality HP bonus (domain).
 */
import assert from "node:assert/strict";
import { ExperiencePool, SkillTree, SKILL_DEFS } from "../src/progression/ExperiencePool.ts";
import { playerMaxHealthFromSkills, tryBuySkill } from "../src/progression/SkillRules.ts";
import { HealthPool } from "../src/combat/HealthPool.ts";
import { PLAYER_HEALTH_CONFIG } from "../src/enemies/enemyConfig.ts";

assert.equal(SKILL_DEFS.length, 5);

const xp = new ExperiencePool();
xp.load({ level: 3, xp: 0, skillPoints: 3 });
const skills = new SkillTree();

assert.equal(playerMaxHealthFromSkills(skills), PLAYER_HEALTH_CONFIG.maxHealth);
const buy = tryBuySkill(skills, xp, "max-hp");
assert.equal(buy.ok, true);
assert.equal(skills.getRank("max-hp"), 1);
assert.equal(playerMaxHealthFromSkills(skills), PLAYER_HEALTH_CONFIG.maxHealth + 10);
assert.equal(xp.availableSkillPoints, 2);

const hp = new HealthPool(PLAYER_HEALTH_CONFIG.maxHealth);
hp.setCurrent(80);
hp.setMaxHealth(playerMaxHealthFromSkills(skills));
assert.equal(hp.maxHealth, 110);
assert.equal(hp.currentHealth, 90, "vitality heals by delta");

assert.equal(tryBuySkill(skills, xp, "harvest-speed").ok, true);
assert.ok(skills.harvestSpeedMultiplier() > 1);
assert.equal(tryBuySkill(skills, xp, "melee-damage").ok, true);
assert.ok(skills.meleeDamageMultiplier() > 1);

xp.load({ level: 1, xp: 0, skillPoints: 0 });
assert.equal(tryBuySkill(skills, xp, "energy-regen").ok, false);
assert.equal(tryBuySkill(skills, xp, "energy-regen").reason, "no-points");

console.log("ok skills purchase + vitality HP domain");
