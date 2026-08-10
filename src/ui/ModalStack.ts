/**
 * Lightweight modal ownership — only one full-screen game modal.
 */
export type ModalId =
  | "none"
  | "inventory"
  | "crafting"
  | "map"
  | "pause"
  | "death"
  | "main-menu"
  | "container"
  | "skills"
  | "settings"
  | "build";

export class ModalStack {
  private current: ModalId = "none";

  get active(): ModalId { return this.current; }

  /** Returns false if blocked by death/main-menu exclusivity. */
  open(id: ModalId): boolean {
    if (this.current === "death" || this.current === "main-menu") {
      if (id !== this.current && id !== "none") return false;
    }
    this.current = id;
    return true;
  }

  close(id?: ModalId): void {
    if (!id || this.current === id) this.current = "none";
  }

  isOpen(id: ModalId): boolean { return this.current === id; }
}
