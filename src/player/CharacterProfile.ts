/** Player presentation identity (name / gender) — persisted client-side. */

export type CharacterGender = "male" | "female";

export interface CharacterIdentity {
  readonly name: string;
  readonly gender: CharacterGender;
}

const STORAGE_KEY = "survive-on-earth.character.v1";
const DEFAULT_NAME = "Survivor";
const DEFAULT_GENDER: CharacterGender = "male";
const MAX_NAME = 20;

function sanitizeName(raw: string): string {
  const cleaned = raw.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, MAX_NAME);
  return cleaned.length > 0 ? cleaned : DEFAULT_NAME;
}

function sanitizeGender(raw: unknown): CharacterGender {
  if (raw === "female") return "female";
  // Legacy "other" and unknown values map to male.
  return DEFAULT_GENDER;
}

export class CharacterProfile {
  private identity: CharacterIdentity;
  private readonly listeners = new Set<() => void>();

  constructor() {
    this.identity = this.load();
  }

  get name(): string { return this.identity.name; }
  get gender(): CharacterGender { return this.identity.gender; }
  get snapshot(): CharacterIdentity { return this.identity; }

  setName(name: string): void {
    const next = sanitizeName(name);
    if (next === this.identity.name) return;
    this.identity = Object.freeze({ ...this.identity, name: next });
    this.persist();
    this.emit();
  }

  setGender(gender: CharacterGender): void {
    const next = sanitizeGender(gender);
    if (next === this.identity.gender) return;
    this.identity = Object.freeze({ ...this.identity, gender: next });
    this.persist();
    this.emit();
  }

  patch(partial: Partial<CharacterIdentity>): void {
    this.identity = Object.freeze({
      name: partial.name !== undefined ? sanitizeName(partial.name) : this.identity.name,
      gender: partial.gender !== undefined ? sanitizeGender(partial.gender) : this.identity.gender,
    });
    this.persist();
    this.emit();
  }

  /** Subtle presentation scale for procedural mesh (does not affect combat stats). */
  presentationHeight(baseHeight = 1.8): number {
    return this.identity.gender === "female" ? baseHeight * 0.96 : baseHeight;
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  private load(): CharacterIdentity {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.freeze({ name: DEFAULT_NAME, gender: DEFAULT_GENDER });
      const parsed = JSON.parse(raw) as Partial<CharacterIdentity>;
      return Object.freeze({
        name: sanitizeName(typeof parsed.name === "string" ? parsed.name : DEFAULT_NAME),
        gender: sanitizeGender(parsed.gender),
      });
    } catch {
      return Object.freeze({ name: DEFAULT_NAME, gender: DEFAULT_GENDER });
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.identity));
    } catch { /* ignore quota */ }
  }
}

export const CHARACTER_PROFILE = new CharacterProfile();
