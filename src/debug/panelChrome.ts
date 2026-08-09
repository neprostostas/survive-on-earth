/** Shared drag-by-header + collapse behavior for debug/calibration floating panels. */
export function bindDraggableCollapsiblePanel(
  panel: HTMLElement,
  handle: HTMLElement,
  body: HTMLElement,
  collapseButton: HTMLButtonElement,
): void {
  let collapsed = false;
  let dragPointerId: number | null = null;
  let startClientX = 0;
  let startClientY = 0;
  let originLeft = 0;
  let originTop = 0;

  const setCollapsed = (next: boolean): void => {
    collapsed = next;
    panel.classList.toggle("collapsed", collapsed);
    collapseButton.textContent = collapsed ? "+" : "−";
    collapseButton.setAttribute("aria-expanded", collapsed ? "false" : "true");
    collapseButton.title = collapsed ? "Expand" : "Collapse";
  };

  collapseButton.type = "button";
  collapseButton.classList.add("panel-collapse-btn");
  collapseButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setCollapsed(!collapsed);
  });
  setCollapsed(false);

  handle.classList.add("panel-drag-handle");
  handle.addEventListener("pointerdown", (event) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, input, label, select, a")) return;
    if (event.button !== 0) return;
    event.preventDefault();
    const rect = panel.getBoundingClientRect();
    panel.classList.add("drag-placed");
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    dragPointerId = event.pointerId;
    startClientX = event.clientX;
    startClientY = event.clientY;
    originLeft = rect.left;
    originTop = rect.top;
    handle.setPointerCapture(event.pointerId);
    panel.classList.add("dragging");
  });

  handle.addEventListener("pointermove", (event) => {
    if (dragPointerId !== event.pointerId) return;
    const nextLeft = originLeft + (event.clientX - startClientX);
    const nextTop = originTop + (event.clientY - startClientY);
    const maxLeft = Math.max(0, window.innerWidth - panel.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - 48);
    panel.style.left = `${Math.min(maxLeft, Math.max(0, nextLeft))}px`;
    panel.style.top = `${Math.min(maxTop, Math.max(0, nextTop))}px`;
  });

  const endDrag = (event: PointerEvent): void => {
    if (dragPointerId !== event.pointerId) return;
    dragPointerId = null;
    panel.classList.remove("dragging");
    try { handle.releasePointerCapture(event.pointerId); } catch { /* already released */ }
  };
  handle.addEventListener("pointerup", endDrag);
  handle.addEventListener("pointercancel", endDrag);

  // Keep body reference used only for accessibility hint on collapse target.
  body.setAttribute("data-panel-body", "true");
}
