import type { ExperiencePool, SkillId, SkillTree } from "../progression/ExperiencePool";
import { SKILL_DEFS } from "../progression/ExperiencePool";
import { I18N } from "../i18n/I18n";

type SkillTitleKey =
  | "skill.max-hp"
  | "skill.move-speed"
  | "skill.harvest-speed"
  | "skill.melee-damage"
  | "skill.energy-regen";

type SkillDescKey =
  | "skill.desc.max-hp"
  | "skill.desc.move-speed"
  | "skill.desc.harvest-speed"
  | "skill.desc.melee-damage"
  | "skill.desc.energy-regen";

const TITLE_KEYS: Record<SkillId, SkillTitleKey> = {
  "max-hp": "skill.max-hp",
  "move-speed": "skill.move-speed",
  "harvest-speed": "skill.harvest-speed",
  "melee-damage": "skill.melee-damage",
  "energy-regen": "skill.energy-regen",
};

const DESC_KEYS: Record<SkillId, SkillDescKey> = {
  "max-hp": "skill.desc.max-hp",
  "move-speed": "skill.desc.move-speed",
  "harvest-speed": "skill.desc.harvest-speed",
  "melee-damage": "skill.desc.melee-damage",
  "energy-regen": "skill.desc.energy-regen",
};

/**
 * Spend skill points across the five production trees (K).
 */
export class SkillsPanel {
  private readonly overlay: HTMLElement;
  private openState = false;

  constructor(
    root: HTMLElement,
    private readonly skills: SkillTree,
    private readonly experience: ExperiencePool,
    private readonly onPurchase: (id: SkillId) => void,
    private readonly onVisibility?: (open: boolean) => void,
  ) {
    this.overlay = document.createElement("section");
    this.overlay.className = "station-overlay skills-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    this.overlay.innerHTML = `
      <div class="station-panel skills-panel" role="dialog" aria-modal="true" aria-labelledby="skills-title">
        <header class="station-header">
          <div>
            <small class="station-kicker" data-role="kicker">SKILLS</small>
            <h2 id="skills-title">Skills</h2>
          </div>
          <button type="button" class="station-close" data-role="close" aria-label="Close">×</button>
        </header>
        <div class="skills-body" data-role="list"></div>
        <p class="station-hint" data-role="points"></p>
      </div>`;
    root.append(this.overlay);
    this.overlay.querySelector("[data-role=close]")?.addEventListener("click", () => this.close());
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });
    I18N.onChange(() => {
      if (this.openState) this.refresh();
    });
  }

  get isOpen(): boolean { return this.openState; }

  toggle(): void {
    if (this.openState) this.close();
    else this.open();
  }

  open(): void {
    this.openState = true;
    this.overlay.classList.add("open");
    this.overlay.setAttribute("aria-hidden", "false");
    this.refresh();
    this.onVisibility?.(true);
  }

  close(): void {
    if (!this.openState) return;
    this.openState = false;
    this.overlay.classList.remove("open");
    this.overlay.setAttribute("aria-hidden", "true");
    this.onVisibility?.(false);
  }

  refresh(): void {
    if (!this.openState) return;
    const kicker = this.overlay.querySelector("[data-role=kicker]");
    if (kicker) kicker.textContent = I18N.t("skills.kicker");
    const title = this.overlay.querySelector("#skills-title");
    if (title) title.textContent = I18N.t("skills.title");
    const points = this.overlay.querySelector("[data-role=points]");
    if (points) {
      points.textContent = I18N.t("skills.points", { n: this.experience.availableSkillPoints });
    }
    const list = this.overlay.querySelector("[data-role=list]");
    if (!list) return;
    list.replaceChildren();
    for (const def of SKILL_DEFS) {
      list.append(this.row(def.id, def.maxRank));
    }
  }

  private row(id: SkillId, maxRank: number): HTMLElement {
    const rank = this.skills.getRank(id);
    const row = document.createElement("article");
    row.className = "contract-row skills-row";
    const full = rank >= maxRank;
    const canBuy = !full && this.experience.availableSkillPoints > 0;
    row.innerHTML = `
      <div class="contract-row-copy">
        <b>${escapeHtml(I18N.t(TITLE_KEYS[id]))}</b>
        <small>${escapeHtml(I18N.t(DESC_KEYS[id]))}</small>
        <span class="contract-meta">${rank}/${maxRank}</span>
      </div>
      <button type="button" class="menu-btn primary" data-skill="${id}" ${canBuy ? "" : "disabled"}>
        ${full ? I18N.t("skills.maxed") : I18N.t("skills.buy")}
      </button>`;
    row.querySelector("button")?.addEventListener("click", () => this.onPurchase(id));
    return row;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
