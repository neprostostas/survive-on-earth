/** Attack keys: F always; E / Space also attack (same as hand / primary). */
const ATTACK_CODES = new Set(["KeyF", "KeyE", "Space"]);

/** First intentional attack keydown only — OS auto-repeat never counts as a new press edge. */
export function isIntentionalAttackKey(code: string, repeat: boolean, enabled: boolean): boolean {
  return enabled && isAttackKeyCode(code) && !repeat;
}

/** Physical attack bind codes (KeyboardEvent.code). Hold keeps combat via isAttackHeld. */
export function isAttackKeyCode(code: string): boolean {
  return ATTACK_CODES.has(code);
}

/** E / Space double as hand (primary) + attack. F is attack-only. */
export function isPrimaryActionKeyCode(code: string): boolean {
  return code === "KeyE" || code === "Space";
}
