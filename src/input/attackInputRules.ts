export function isIntentionalAttackKey(code: string, repeat: boolean, enabled: boolean): boolean {
  return enabled && code === "KeyF" && !repeat;
}
