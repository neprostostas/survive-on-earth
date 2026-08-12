export type ExperienceListener = (level: number, xp: number, xpToNext: number) => void;

export class ExperiencePool {
  private level = 1;
  private xp = 0;
  private skillPoints = 0;
  private readonly listeners = new Set<ExperienceListener>();

  get currentLevel(): number { return this.level; }
  get currentXp(): number { return this.xp; }
  get xpToNextLevel(): number { return this.thresholdFor(this.level); }
  get availableSkillPoints(): number { return this.skillPoints; }

  thresholdFor(level: number): number {
    return 40 + level * 25;
  }

  addXp(amount: number): { leveled: boolean; levelsGained: number } {
    if (!Number.isFinite(amount) || amount <= 0) return { leveled: false, levelsGained: 0 };
    this.xp += amount;
    let levelsGained = 0;
    while (this.xp >= this.thresholdFor(this.level)) {
      this.xp -= this.thresholdFor(this.level);
      this.level += 1;
      this.skillPoints += 1;
      levelsGained += 1;
    }
    this.emit();
    return { leveled: levelsGained > 0, levelsGained };
  }

  spendSkillPoint(): boolean {
    if (this.skillPoints < 1) return false;
    this.skillPoints -= 1;
    this.emit();
    return true;
  }

  snapshot(): { level: number; xp: number; skillPoints: number } {
    return { level: this.level, xp: this.xp, skillPoints: this.skillPoints };
  }

  load(snapshot: { level: number; xp: number; skillPoints: number }): void {
    this.level = Math.max(1, snapshot.level);
    this.xp = Math.max(0, snapshot.xp);
    this.skillPoints = Math.max(0, snapshot.skillPoints);
    this.emit();
  }

  subscribe(listener: ExperienceListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.level, this.xp, this.xpToNextLevel);
  }
}

export type SkillId = "max-hp" | "move-speed" | "harvest-speed" | "melee-damage" | "energy-regen";

export interface SkillDef {
  readonly id: SkillId;
  readonly title: string;
  readonly description: string;
  readonly maxRank: number;
}

export const SKILL_DEFS: readonly SkillDef[] = Object.freeze([
  Object.freeze({ id: "max-hp" as const, title: "Vitality", description: "+10 max HP per rank", maxRank: 5 }),
  Object.freeze({ id: "move-speed" as const, title: "Swift", description: "+3% move speed per rank", maxRank: 5 }),
  Object.freeze({ id: "harvest-speed" as const, title: "Forager", description: "+6% harvest swing speed per rank", maxRank: 5 }),
  Object.freeze({ id: "melee-damage" as const, title: "Brawler", description: "+4% melee damage per rank", maxRank: 5 }),
  Object.freeze({ id: "energy-regen" as const, title: "Endurance", description: "+10% energy regen per rank", maxRank: 5 }),
]);

export class SkillTree {
  private readonly ranks = new Map<SkillId, number>();

  getRank(id: SkillId): number { return this.ranks.get(id) ?? 0; }

  tryPurchase(id: SkillId, xp: ExperiencePool): boolean {
    const def = SKILL_DEFS.find((s) => s.id === id);
    if (!def) return false;
    const rank = this.getRank(id);
    if (rank >= def.maxRank) return false;
    if (!xp.spendSkillPoint()) return false;
    this.ranks.set(id, rank + 1);
    return true;
  }

  meleeDamageMultiplier(): number {
    return 1 + this.getRank("melee-damage") * 0.04;
  }

  moveSpeedMultiplier(): number {
    return 1 + this.getRank("move-speed") * 0.03;
  }

  maxHpBonus(): number {
    return this.getRank("max-hp") * 10;
  }

  energyRegenMultiplier(): number {
    return 1 + this.getRank("energy-regen") * 0.1;
  }

  /** Swing duration divisor — higher = faster swings. */
  harvestSpeedMultiplier(): number {
    return 1 + this.getRank("harvest-speed") * 0.06;
  }

  serialize(): Record<string, number> {
    return Object.fromEntries(this.ranks.entries());
  }

  load(data: Record<string, number>): void {
    this.ranks.clear();
    for (const [id, rank] of Object.entries(data)) {
      if (SKILL_DEFS.some((s) => s.id === id)) this.ranks.set(id as SkillId, rank);
    }
  }
}
