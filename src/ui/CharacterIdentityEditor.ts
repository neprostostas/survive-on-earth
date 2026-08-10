import {
  CHARACTER_PROFILE,
  type CharacterGender,
} from "../player/CharacterProfile";
import { menuBtnLabel, uiIcon } from "./uiIcons";
import { I18N } from "../i18n/I18n";

/**
 * Modal editor for survivor name + gender (shared by Settings & Inventory).
 * Mounts on document.body so #ui-root pointer-events:none cannot swallow input.
 */
export function openCharacterIdentityEditor(_root?: HTMLElement | null): Promise<void> {
  return new Promise((resolve) => {
    const host = document.body;
    const overlay = document.createElement("section");
    overlay.className = "character-edit-overlay open";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "char-edit-title");
    overlay.style.pointerEvents = "auto";
    const current = CHARACTER_PROFILE.snapshot;
    const t = (k: Parameters<typeof I18N.t>[0]) => I18N.t(k);
    overlay.innerHTML = `
      <div class="character-edit-panel" role="document">
        <div class="character-edit-mark" aria-hidden="true">${uiIcon("survivor", "ui-icon-img confirm-mark-img")}</div>
        <h2 id="char-edit-title" class="soi-confirm-title">${t("char.title")}</h2>
        <p class="soi-confirm-body">${t("settings.character")}</p>
        <label class="character-edit-field">
          <span class="settings-row-label">${uiIcon("survivor")}<span>${t("char.name")}</span></span>
          <input type="text" class="character-edit-name" maxlength="20" value="${escapeAttr(current.name)}" autocomplete="off" spellcheck="false" enterkeyhint="done" />
        </label>
        <div class="settings-row-block">
          <span class="settings-row-label">${uiIcon("survivor")}<span>${t("char.gender")}</span></span>
          <div class="soi-choice-group" role="listbox" aria-label="${t("char.gender")}">
            ${genderBtn("male", t("settings.gender.male"), current.gender)}
            ${genderBtn("female", t("settings.gender.female"), current.gender)}
            ${genderBtn("other", t("settings.gender.other"), current.gender)}
          </div>
        </div>
        <div class="soi-confirm-actions">
          <button type="button" class="menu-btn ghost" data-role="cancel">
            <span class="menu-btn-inner">${uiIcon("close", "ui-icon-img menu-btn-icon")}<span class="menu-btn-text">${t("char.cancel")}</span></span>
          </button>
          <button type="button" class="menu-btn primary" data-role="save">
            ${menuBtnLabel("check", t("char.save"))}
          </button>
        </div>
      </div>`;
    host.append(overlay);

    let gender: CharacterGender = current.gender;
    const nameInput = overlay.querySelector<HTMLInputElement>(".character-edit-name");
    const panel = overlay.querySelector<HTMLElement>(".character-edit-panel");

    // Preview appearance immediately while picking (Save commits; Cancel reverts).
    const previewGender = (next: CharacterGender): void => {
      gender = next;
      CHARACTER_PROFILE.setGender(next);
      for (const other of overlay.querySelectorAll<HTMLButtonElement>("[data-gender]")) {
        const on = other.dataset.gender === gender;
        other.classList.toggle("active", on);
        other.setAttribute("aria-selected", String(on));
        other.innerHTML = on
          ? `${uiIcon("check", "ui-icon-img choice-check")}<span>${other.dataset.label ?? ""}</span>`
          : `<span>${other.dataset.label ?? ""}</span>`;
      }
    };

    for (const btn of overlay.querySelectorAll<HTMLButtonElement>("[data-gender]")) {
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.gender as CharacterGender | undefined;
        if (id) previewGender(id);
      });
    }

    // Keep typing out of global game/hotkey handlers.
    nameInput?.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.code === "Enter") {
        e.preventDefault();
        finish(true);
      }
    });
    nameInput?.addEventListener("keyup", (e) => { e.stopPropagation(); });
    nameInput?.addEventListener("keypress", (e) => { e.stopPropagation(); });
    panel?.addEventListener("pointerdown", (e) => { e.stopPropagation(); });

    let settled = false;
    const finish = (save: boolean): void => {
      if (settled) return;
      settled = true;
      if (save && nameInput) {
        CHARACTER_PROFILE.patch({ name: nameInput.value, gender });
      } else {
        // Cancel reverts gender preview to original snapshot.
        CHARACTER_PROFILE.patch({ name: current.name, gender: current.gender });
      }
      overlay.classList.remove("open");
      overlay.remove();
      window.removeEventListener("keydown", onKey, true);
      resolve();
    };

    overlay.querySelector("[data-role=cancel]")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      finish(false);
    });
    overlay.querySelector("[data-role=save]")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      finish(true);
    });
    overlay.addEventListener("pointerdown", (e) => {
      if (e.target === overlay) {
        e.preventDefault();
        finish(false);
      }
    });

    const onKey = (e: KeyboardEvent): void => {
      if (e.code === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        finish(false);
      }
    };
    window.addEventListener("keydown", onKey, true);

    requestAnimationFrame(() => {
      nameInput?.focus({ preventScroll: true });
      nameInput?.select();
    });
  });
}

function genderBtn(id: CharacterGender, label: string, current: CharacterGender): string {
  const on = id === current;
  return `<button type="button" class="soi-choice ${on ? "active" : ""}" data-gender="${id}" data-label="${label}"
    role="option" aria-selected="${on}">
    ${on ? uiIcon("check", "ui-icon-img choice-check") : ""}
    <span>${label}</span>
  </button>`;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
