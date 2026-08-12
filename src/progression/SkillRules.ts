/**
 * Pure skill purchase helpers.
 */
import type { ExperiencePool, SkillId, SkillTree } from "../progression/ExperiencePool.ts";
import { PLAYER_HEALTH_CONFIG } from "../enemies/enemyConfig.ts";

export function playerMaxHealthFromSkills(skills: SkillTree): number {
  return PLAYER_HEALTH_CONFIG.maxHealth + skills.maxHpBonus();
}

export function tryBuySkill(
  skills: SkillTree,
  xp: ExperiencePool,
  id: SkillId,
): { ok: boolean; reason: "ok" | "no-points" | "max-rank" | "missing" } {
  const before = skills.getRank(id);
  if (!skills.tryPurchase(id, xp)) {
    const defOk = ["max-hp", "move-speed", "harvest-speed", "melee-damage", "energy-regen"].includes(id);
    if (!defOk) return { ok: false, reason: "missing" };
    if (before >= 5) return { ok: false, reason: "max-rank" };
    if (xp.availableSkillPoints < 1) return { ok: false, reason: "no-points" };
    return { ok: false, reason: "no-points" };
  }
  return { ok: true, reason: "ok" };
}
