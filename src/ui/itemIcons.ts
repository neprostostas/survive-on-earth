import type { ItemId } from "../items/ItemId";

export const ITEM_ICONS: Readonly<Record<ItemId, string>> = Object.freeze({
  "pine-log": `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 9.5 21.5 5l4 4.3-2 14.2L9 27l-4-4.1z"/><path d="m7 9.5 4.2 4.2L9 27M11.2 13.7l14.3-4.4M17.3 7.2l3.8 4.2-1.5 12.9"/><path d="M12.5 17.5c2.4-1 4.5-.7 6.3.8"/></svg>`,
  limestone: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m5 21 4.2-11.2L19 5l8.1 7.4-.9 10.2L17 27 8.4 25z"/><path d="m9.2 9.8 7 5.1L19 5M16.2 14.9 8.4 25M16.2 14.9l10.9-2.5M16.2 14.9l.8 12.1"/></svg>`,
  "dad-hat": `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 17.5v-4.2C8 8.7 11.2 6 15.5 6S23 8.7 23 13.3v4.2"/><path d="M7.2 17.1c5.2-1.7 12.4-1.4 18.4.9 1.2.5 1.7 1.5 1.1 2.4-.5.8-1.5 1.1-2.5.7-5.4-2-11.5-2.3-16.4-.7-1.3.4-2.4-.1-2.6-1.1-.2-.9.5-1.8 2-2.2Z"/><path d="M15.5 6v4.2M9 10.2c3.8 1.1 9.2 1.1 13 0"/></svg>`,
  shirt: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m10.5 6 3.1-1.3c.9 1.5 3.9 1.5 4.8 0L21.5 6 28 11.1l-3.5 5-3-2.1v13H10.4V14l-3 2.1-3.4-5z"/><path d="M13.6 4.7c.2 2.7 4.6 2.7 4.8 0M10.4 14v-3.7M21.5 14v-3.7"/></svg>`,
  "cargo-pants": `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 5h14l1 21-6.1.8L16 15.2l-1.9 11.6L8 26z"/><path d="M9 9h14M16 5v10.2M9 15.3h5.4v5.3H8.6M23 15.3h-5.4v5.3h5.8M10.2 17.2h2.6M21.8 17.2h-2.6"/></svg>`,
  sneakers: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 19.5c3.2-.5 5.4-2.8 6.3-7.3l5.3 1.1c.2 3.3 2.9 5.1 8.6 5.8 1.4.2 2.3 1.1 2.3 2.4v2.2H5z"/><path d="M5 23.7v2h22.5v-2M10.2 16.1l5.8 1.2M8.7 18.3l7.3 1.3M18.3 17.2l2.2-2.1M21.3 18.3l2.1-1.5"/></svg>`,
  hatchet: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m8.2 28 11-19.2 3.2 1.9-11 19.1z"/><path d="M15.8 5.2 19 2.8l9 5.1-1.6 4.1-6.8-.9-5.4-3.2z"/><path d="m6.8 24.8 5.9 3.4"/></svg>`,
  pickaxe: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m9.2 29 9.2-21.4 3.1 1.3-9.2 21.4z"/><path d="M3.5 10.7C9.6 4.8 18.7 3.6 28.6 8l-1.3 3.2C18.6 7.6 11.1 8.5 5.4 13z"/><path d="m18.4 7.6 7 7.1"/></svg>`,
});
