/**
 * Offline lifetime/session statistics for profile UI and endgame meta.
 */
export interface GameStatisticsSnapshot {
  readonly playtimeSec: number;
  readonly sessionPlaytimeSec: number;
  readonly deaths: number;
  readonly enemiesKilled: number;
  readonly bossesKilled: number;
  readonly resourcesHarvested: number;
  readonly itemsCrafted: number;
  readonly distanceTraveled: number;
  readonly locationsDiscovered: number;
  readonly raidsCleared: number;
}

export class GameStatistics {
  private playtimeSec = 0;
  private sessionPlaytimeSec = 0;
  private deaths = 0;
  private enemiesKilled = 0;
  private bossesKilled = 0;
  private resourcesHarvested = 0;
  private itemsCrafted = 0;
  private distanceTraveled = 0;
  private locationsDiscovered = 0;
  private raidsCleared = 0;

  tickPlaytime(dt: number): void {
    if (dt <= 0) return;
    this.playtimeSec += dt;
    this.sessionPlaytimeSec += dt;
  }

  recordDeath(): void { this.deaths += 1; }
  recordEnemyKill(isBoss = false): void {
    this.enemiesKilled += 1;
    if (isBoss) this.bossesKilled += 1;
  }
  recordHarvest(): void { this.resourcesHarvested += 1; }
  recordCraft(): void { this.itemsCrafted += 1; }
  recordTravel(distance = 1): void { this.distanceTraveled += Math.max(0, distance); }
  recordLocationDiscovered(): void { this.locationsDiscovered += 1; }
  recordRaidClear(): void { this.raidsCleared += 1; }

  beginSession(): void {
    this.sessionPlaytimeSec = 0;
  }

  snapshot(): GameStatisticsSnapshot {
    return Object.freeze({
      playtimeSec: this.playtimeSec,
      sessionPlaytimeSec: this.sessionPlaytimeSec,
      deaths: this.deaths,
      enemiesKilled: this.enemiesKilled,
      bossesKilled: this.bossesKilled,
      resourcesHarvested: this.resourcesHarvested,
      itemsCrafted: this.itemsCrafted,
      distanceTraveled: this.distanceTraveled,
      locationsDiscovered: this.locationsDiscovered,
      raidsCleared: this.raidsCleared,
    });
  }

  serialize(): GameStatisticsSnapshot {
    return this.snapshot();
  }

  load(data: Partial<GameStatisticsSnapshot> | undefined): void {
    if (!data) return;
    this.playtimeSec = data.playtimeSec ?? this.playtimeSec;
    this.deaths = data.deaths ?? 0;
    this.enemiesKilled = data.enemiesKilled ?? 0;
    this.bossesKilled = data.bossesKilled ?? 0;
    this.resourcesHarvested = data.resourcesHarvested ?? 0;
    this.itemsCrafted = data.itemsCrafted ?? 0;
    this.distanceTraveled = data.distanceTraveled ?? 0;
    this.locationsDiscovered = data.locationsDiscovered ?? 0;
    this.raidsCleared = data.raidsCleared ?? 0;
    this.sessionPlaytimeSec = 0;
  }
}
