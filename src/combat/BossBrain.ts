/**
 * Boss state machine foundation (The Warden etc.).
 * Pure domain — presentation/AI movement owned by combat layer.
 */
export type BossAiState =
  | "idle"
  | "acquire"
  | "chase"
  | "primary"
  | "secondary"
  | "cooldown"
  | "stagger"
  | "enraged"
  | "dead";

export interface BossProfile {
  readonly id: string;
  readonly displayName: string;
  readonly maxHealth: number;
  readonly primaryDamage: number;
  readonly secondaryDamage: number;
  readonly moveSpeed: number;
  readonly primaryCooldown: number;
  readonly secondaryCooldown: number;
  readonly rageThreshold: number;
}

export const WARDEN_PROFILE: BossProfile = Object.freeze({
  id: "the-warden",
  displayName: "The Warden",
  maxHealth: 420,
  primaryDamage: 18,
  secondaryDamage: 28,
  moveSpeed: 1.35,
  primaryCooldown: 1.6,
  secondaryCooldown: 6,
  rageThreshold: 0.35,
});

export const METRO_ABOMINATION_PROFILE: BossProfile = Object.freeze({
  id: "metro-abomination",
  displayName: "Metro Abomination",
  maxHealth: 480,
  primaryDamage: 16,
  secondaryDamage: 30,
  moveSpeed: 1.25,
  primaryCooldown: 1.5,
  secondaryCooldown: 5.5,
  rageThreshold: 0.4,
});

export const HOSPITAL_CONTAMINANT_PROFILE: BossProfile = Object.freeze({
  id: "hospital-contaminant",
  displayName: "Marrow Contaminant",
  maxHealth: 440,
  primaryDamage: 14,
  secondaryDamage: 26,
  moveSpeed: 1.4,
  primaryCooldown: 1.4,
  secondaryCooldown: 5.2,
  rageThreshold: 0.38,
});

export const PRISON_COMMANDER_PROFILE: BossProfile = Object.freeze({
  id: "prison-commander",
  displayName: "Ash Yard Commander",
  maxHealth: 360,
  primaryDamage: 15,
  secondaryDamage: 24,
  moveSpeed: 1.55,
  primaryCooldown: 1.3,
  secondaryCooldown: 6.5,
  rageThreshold: 0.42,
});

export const MINE_GUARDIAN_PROFILE: BossProfile = Object.freeze({
  id: "mine-guardian",
  displayName: "Mine Guardian",
  maxHealth: 500,
  primaryDamage: 20,
  secondaryDamage: 32,
  moveSpeed: 1.15,
  primaryCooldown: 1.7,
  secondaryCooldown: 7,
  rageThreshold: 0.33,
});

export const SWAMP_BEHEMOTH_PROFILE: BossProfile = Object.freeze({
  id: "swamp-behemoth",
  displayName: "Mire Behemoth",
  maxHealth: 520,
  primaryDamage: 17,
  secondaryDamage: 29,
  moveSpeed: 1.1,
  primaryCooldown: 1.8,
  secondaryCooldown: 6.2,
  rageThreshold: 0.36,
});

export const FROZEN_PREDATOR_PROFILE: BossProfile = Object.freeze({
  id: "frozen-predator",
  displayName: "Rime Predator",
  maxHealth: 460,
  primaryDamage: 18,
  secondaryDamage: 27,
  moveSpeed: 1.6,
  primaryCooldown: 1.35,
  secondaryCooldown: 5.8,
  rageThreshold: 0.4,
});

export const INDUSTRIAL_TITAN_PROFILE: BossProfile = Object.freeze({
  id: "industrial-titan",
  displayName: "Industrial Titan",
  maxHealth: 560,
  primaryDamage: 21,
  secondaryDamage: 34,
  moveSpeed: 1.05,
  primaryCooldown: 1.9,
  secondaryCooldown: 7.5,
  rageThreshold: 0.3,
});

export const BLACKSITE_SUBJECT_PROFILE: BossProfile = Object.freeze({
  id: "blacksite-subject",
  displayName: "Blacksite Subject",
  maxHealth: 600,
  primaryDamage: 22,
  secondaryDamage: 36,
  moveSpeed: 1.45,
  primaryCooldown: 1.4,
  secondaryCooldown: 5.5,
  rageThreshold: 0.28,
});

export const BOSS_PROFILES: readonly BossProfile[] = Object.freeze([
  WARDEN_PROFILE,
  METRO_ABOMINATION_PROFILE,
  HOSPITAL_CONTAMINANT_PROFILE,
  PRISON_COMMANDER_PROFILE,
  MINE_GUARDIAN_PROFILE,
  SWAMP_BEHEMOTH_PROFILE,
  FROZEN_PREDATOR_PROFILE,
  INDUSTRIAL_TITAN_PROFILE,
  BLACKSITE_SUBJECT_PROFILE,
]);

export function getBossProfile(id: string): BossProfile | null {
  return BOSS_PROFILES.find((p) => p.id === id) ?? null;
}

export class BossBrain {
  private state: BossAiState = "idle";
  private cooldown = 0;
  private health: number;
  private enraged = false;

  constructor(readonly profile: BossProfile) {
    this.health = profile.maxHealth;
  }

  get currentState(): BossAiState { return this.state; }
  get currentHealth(): number { return this.health; }
  get healthRatio(): number { return this.health / this.profile.maxHealth; }
  get isDead(): boolean { return this.state === "dead"; }

  acquire(): void {
    if (this.state === "dead") return;
    this.state = "acquire";
  }

  tick(delta: number, distanceToPlayer: number): BossAiState {
    if (this.state === "dead") return this.state;
    this.cooldown = Math.max(0, this.cooldown - delta);
    if (this.health <= 0) {
      this.state = "dead";
      return this.state;
    }
    if (!this.enraged && this.healthRatio <= this.profile.rageThreshold) {
      this.enraged = true;
      this.state = "enraged";
    }
    if (this.state === "cooldown" || this.state === "stagger") {
      if (this.cooldown <= 0) this.state = "chase";
      return this.state;
    }
    if (distanceToPlayer > 8) {
      this.state = "chase";
      return this.state;
    }
    if (this.cooldown <= 0) {
      if (distanceToPlayer < 1.4) {
        this.state = "primary";
        this.cooldown = this.profile.primaryCooldown * (this.enraged ? 0.75 : 1);
      } else if (distanceToPlayer < 4.5) {
        this.state = "secondary";
        this.cooldown = this.profile.secondaryCooldown * (this.enraged ? 0.7 : 1);
      } else {
        this.state = "chase";
      }
    }
    return this.state;
  }

  applyDamage(amount: number): void {
    if (this.state === "dead") return;
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) this.state = "dead";
    else this.state = "stagger";
    this.cooldown = 0.35;
  }

  reset(): void {
    this.health = this.profile.maxHealth;
    this.state = "idle";
    this.cooldown = 0;
    this.enraged = false;
  }
}
