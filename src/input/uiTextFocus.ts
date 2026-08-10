/**
 * True when keyboard events should go to a text field, not gameplay/UI hotkeys.
 * Uses event target (focused control), including nested labels/contenteditable.
 */
export function isUiTextFocusTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const el = target.closest("input, textarea, select, [contenteditable=''], [contenteditable=true]");
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return !el.disabled;
  if (el instanceof HTMLInputElement) {
    if (el.disabled || el.readOnly) return false;
    const type = (el.type || "text").toLowerCase();
    // Non-text inputs still need some keys; only block letter/num hotkeys for typing-like fields.
    return !["button", "checkbox", "radio", "submit", "reset", "file", "range", "color", "image", "hidden"].includes(type);
  }
  return false;
}
