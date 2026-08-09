import { COMBAT_CONFIG } from "./combatConfig.ts";
import { combatDistanceSquared, type CombatPoint, type CombatTarget } from "./CombatTarget.ts";

export interface CombatTargetState {
  readonly targetId: string | null;
  readonly distance: number;
  readonly candidateCount: number;
}

export class CombatTargetSystem {
  private readonly targets = new Map<string, CombatTarget>();
  private selected: CombatTarget | null = null;
  private latestState: CombatTargetState = Object.freeze({ targetId: null, distance: Number.POSITIVE_INFINITY, candidateCount: 0 });

  get current(): CombatTarget | null { return this.selected; }
  get state(): CombatTargetState { return this.latestState; }
  get registeredCount(): number { return this.targets.size; }

  register(target: CombatTarget): void {
    if (this.targets.has(target.combatId)) throw new Error(`Duplicate combat target: ${target.combatId}`);
    this.targets.set(target.combatId, target);
  }

  unregister(target: CombatTarget): boolean {
    if (this.targets.get(target.combatId) !== target) return false;
    this.targets.delete(target.combatId);
    if (this.selected === target) {
      this.selected = null;
      this.latestState = Object.freeze({ targetId: null, distance: Number.POSITIVE_INFINITY, candidateCount: 0 });
    }
    return true;
  }

  isRegistered(target: CombatTarget): boolean {
    return this.targets.get(target.combatId) === target;
  }

  update(playerPosition: CombatPoint): CombatTarget | null {
    const maxDistanceSq = COMBAT_CONFIG.targetAcquisitionRange ** 2;
    const candidates = [...this.targets.values()]
      .filter((target) => target.isCombatAlive() && combatDistanceSquared(playerPosition, target.getCombatPosition()) <= maxDistanceSq)
      .sort((left, right) => {
        const distanceDifference = combatDistanceSquared(playerPosition, left.getCombatPosition()) - combatDistanceSquared(playerPosition, right.getCombatPosition());
        return Math.abs(distanceDifference) > 0.000001 ? distanceDifference : left.combatId.localeCompare(right.combatId);
      });
    const nearest = candidates[0] ?? null;
    const current = this.selected;
    const currentValid = current !== null && candidates.includes(current);
    if (!currentValid) this.selected = nearest;
    else if (nearest && current && nearest !== current) {
      const currentDistance = Math.sqrt(combatDistanceSquared(playerPosition, current.getCombatPosition()));
      const nearestDistance = Math.sqrt(combatDistanceSquared(playerPosition, nearest.getCombatPosition()));
      if (nearestDistance + COMBAT_CONFIG.targetSwitchBias < currentDistance) this.selected = nearest;
    }
    const distance = this.selected ? Math.sqrt(combatDistanceSquared(playerPosition, this.selected.getCombatPosition())) : Number.POSITIVE_INFINITY;
    this.latestState = Object.freeze({ targetId: this.selected?.combatId ?? null, distance, candidateCount: candidates.length });
    return this.selected;
  }
}
