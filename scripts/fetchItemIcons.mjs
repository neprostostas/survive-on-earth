/**
 * Download Game Icons (CC BY 3.0) silhouettes and plate them into a unified style.
 * Writes public/icons/{itemId}.svg + regenerates src/ui/itemIcons.ts
 *
 * Usage: node scripts/fetchItemIcons.mjs
 * Source: https://game-icons.net / https://github.com/game-icons/icons
 */
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public/icons");
fs.mkdirSync(OUT, { recursive: true });

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "survive-on-earth-icon-fetch" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          get(res.headers.location).then(resolve, reject);
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          if (res.statusCode !== 200) reject(new Error(`${res.statusCode} ${url}`));
          else resolve(buf.toString("utf8"));
        });
      })
      .on("error", reject);
  });
}

function palette(id) {
  const rules = [
    [/log|plank|wood|stick|branch|board|chip|club|torch|bark|sawdust/, { fill: "#c4893a", bg: "#2a1c0c", accent: "#e8b86a" }],
    [/stone|rock|limestone|gravel|concrete|brick|cement|mineral/, { fill: "#9aa0a8", bg: "#1e2226", accent: "#d0d4d8" }],
    [/iron|steel|scrap|metal|nail|bolt|screw|rebar|pipe|crowbar|hatchet|pickaxe|maul|sledge|axe|knife|gear|spring|chain|piston|bearing|engine|motor|hammer|cleaver|blade|spear|machete/, { fill: "#8a96a4", bg: "#161c22", accent: "#c8d2dc" }],
    [/copper/, { fill: "#d07a3a", bg: "#2a1608", accent: "#f0b070" }],
    [/aluminum|lightweight/, { fill: "#c4ccd4", bg: "#1a2028", accent: "#e8eef4" }],
    [/cloth|fiber|rope|fabric|tape|bandage|wrap/, { fill: "#d8c8a0", bg: "#2a2418", accent: "#f0e6c8" }],
    [/leather|hide|fur|boot|sneaker|jacket|shirt|pants|hat|cap|backpack|pack|vest|armor|hood|suit|helmet|tunic|greave|sabaton/, { fill: "#8b5a3c", bg: "#1c100c", accent: "#c89068" }],
    [/winter|padded|insulated|snow|freeze|cold/, { fill: "#6a8ab0", bg: "#101820", accent: "#b0c8e0" }],
    [/gas|hazmat|filter|toxic|chemical|acid|reagent/, { fill: "#c8c840", bg: "#222100", accent: "#e8e870" }],
    [/berry|fruit|herb|mushroom|carrot|potato|seed|plant|resin|compost|fertilizer|grass|corn|bean|soil|crop/, { fill: "#5a9a48", bg: "#0e1a0e", accent: "#98d878" }],
    [/meat|fish|stew|food|canned|roasted|cooked|raw|meal|soup|rations/, { fill: "#c85048", bg: "#1c0c0c", accent: "#e88880" }],
    [/water|bottle|canteen|drink|purif|rain|thirst/, { fill: "#4890c8", bg: "#0c1828", accent: "#88c0e8" }],
    [/battery|cell|power|solar|circuit|electronic|wire|wiring|cable|bulb|fuse|optical|servo|relay|sensor|module|processor|controller/, { fill: "#48a878", bg: "#0c1c14", accent: "#88e8b0" }],
    [/ammo|shell|pistol|rifle|gun|scatter|carbine|smg|optic|mag|grip|bow|arrow|shotgun/, { fill: "#6a7060", bg: "#141810", accent: "#b0b8a0" }],
    [/fuel|gunpowder|alcohol|solvent|charcoal|oil|lubricant|additive/, { fill: "#d8a028", bg: "#241808", accent: "#f0d060" }],
    [/glass|pane|optical-glass/, { fill: "#88c0d8", bg: "#102028", accent: "#d0f0ff" }],
    [/key|card|badge|token|security|blueprint|map-fragment|letter|package|sample|supplies|coin|watch|antique|quest/, { fill: "#d0a040", bg: "#241808", accent: "#f0d080" }],
    [/plastic|polymer|rubber|adhesive|hose|sealant/, { fill: "#5080a8", bg: "#0e1820", accent: "#90b8d8" }],
    [/helix|composite|reactor|advanced|precision|hardened|military|epic/, { fill: "#68c0a0", bg: "#0c2018", accent: "#a8f0d0" }],
    [/med|heal|aid|salve|antidote|treat|sterile/, { fill: "#e07070", bg: "#241010", accent: "#f0a0a0" }],
  ];
  for (const [re, p] of rules) if (re.test(id)) return p;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
  const hue = h % 360;
  return { fill: `hsl(${hue} 48% 52%)`, bg: `hsl(${hue} 30% 12%)`, accent: `hsl(${hue} 55% 70%)` };
}

const EXPLICIT = {
  "pine-log": "delapouite/wood-pile",
  limestone: "lorc/stone-pile",
  stone: "lorc/stone-block",
  gravel: "lorc/stone-pile",
  "wood-plank": "delapouite/wood-beam",
  stick: "delapouite/wood-stick",
  branch: "delapouite/wood-stick",
  "hardwood-log": "lorc/dead-wood",
  hatchet: "lorc/wood-axe",
  "stone-hatchet": "lorc/wood-axe",
  "steel-hatchet": "lorc/wood-axe",
  "reinforced-hatchet": "lorc/wood-axe",
  "advanced-hatchet": "lorc/wood-axe",
  pickaxe: "lorc/war-pick",
  "stone-pickaxe": "lorc/war-pick",
  "steel-pickaxe": "lorc/war-pick",
  "reinforced-pickaxe": "lorc/war-pick",
  "advanced-pickaxe": "lorc/war-pick",
  spear: "delapouite/spear-feather",
  "improved-spear": "delapouite/spear-feather",
  "long-spear": "delapouite/spear-hook",
  "tactical-spear": "delapouite/spear-hook",
  "wooden-club": "delapouite/wood-club",
  crowbar: "delapouite/crowbar",
  "stone-knife": "lorc/bone-knife",
  "survival-knife": "delapouite/plain-dagger",
  machete: "delapouite/bowie-knife",
  "hardened-machete": "delapouite/bowie-knife",
  cleaver: "lorc/cleaver",
  "metal-hammer": "delapouite/flat-hammer",
  "industrial-hammer": "lorc/thor-hammer",
  sledgehammer: "lorc/gavel",
  "heavy-axe": "lorc/battle-axe",
  "composite-axe": "lorc/battle-axe",
  "tactical-axe": "lorc/battle-axe",
  "basic-backpack": "delapouite/backpack",
  "reinforced-backpack": "delapouite/backpack",
  "expedition-backpack": "delapouite/hiking",
  "field-carrier-pack": "delapouite/military-backpack",
  "plant-fiber": "lorc/vine-leaf",
  rope: "lorc/rope-coil",
  cloth: "delapouite/rolled-cloth",
  "thick-cloth": "delapouite/rolled-cloth",
  berries: "lorc/berries-bowl",
  mushroom: "lorc/mushroom-gills",
  "raw-meat": "lorc/meat",
  "roasted-meat": "lorc/steak",
  "cooked-meat": "lorc/steak",
  bandage: "lorc/bandage-roll",
  "sterile-bandage": "lorc/bandage-roll",
  "first-aid-kit": "delapouite/medical-pack",
  "water-bottle": "delapouite/water-flask",
  "clean-water": "lorc/water-drop",
  "purified-water": "lorc/splashy-stream",
  "dirty-water": "lorc/water-splash",
  charcoal: "lorc/coal-wagon",
  "iron-ore": "lorc/ore",
  "copper-ore": "lorc/ore",
  "iron-bar": "delapouite/metal-bar",
  "steel-bar": "delapouite/metal-bar",
  "copper-bar": "delapouite/metal-bar",
  nails: "delapouite/nails",
  screws: "delapouite/screw",
  gear: "lorc/gears",
  spring: "lorc/spring",
  chain: "lorc/chain",
  battery: "lorc/battery-pack",
  "circuit-board": "delapouite/circuitry",
  torch: "lorc/torch",
  "basic-pistol": "delapouite/pistol-gun",
  "pistol-ammo": "lorc/bullets",
  "rifle-ammo": "lorc/ammo-box",
  "hunting-bow": "lorc/high-shot",
  arrow: "lorc/arrow-cluster",
  "assault-rifle": "delapouite/ak47",
  "pump-scattergun": "delapouite/sawed-off-shotgun",
  shirt: "lorc/shirt",
  jacket: "lorc/leather-vest",
  boots: "lorc/walking-boot",
  sneakers: "lorc/sneakers",
  "gas-mask": "lorc/gas-mask",
  fuel: "lorc/jerrycan",
  "fuel-can": "lorc/jerrycan",
  corn: "lorc/corn",
  potato: "lorc/potato",
  carrot: "lorc/carrot",
  beans: "lorc/beans",
  "meat-stew": "lorc/hot-meal",
  "canned-food": "delapouite/food-can",
  key: "lorc/key",
  letter: "lorc/envelope",
  scrap: "lorc/metal-scales",
  "scrap-metal": "lorc/metal-scales",
  "solar-panel": "delapouite/solar-power",
};

const KEYWORD_SLUGS = [
  [/backpack|pack|carrier/, ["backpack", "military-backpack", "hiking"]],
  [/hatchet|axe/, ["wood-axe", "battle-axe", "fire-axe"]],
  [/pickaxe|pick/, ["war-pick", "mining", "stone-pile"]],
  [/spear/, ["spear-feather", "spear-hook", "trident"]],
  [/knife|blade|machete|cleaver/, ["plain-dagger", "bowie-knife", "cleaver", "bone-knife"]],
  [/hammer|maul|sledge/, ["flat-hammer", "gavel", "thor-hammer"]],
  [/pistol|gun|revolver/, ["pistol-gun", "revolver"]],
  [/rifle|carbine|assault/, ["ak47", "winchester-rifle", "mp5"]],
  [/shotgun|scatter/, ["sawed-off-shotgun"]],
  [/bow|arrow/, ["high-shot", "arrow-cluster", "bow-arrow"]],
  [/ammo|bullet|shell/, ["bullets", "ammo-box"]],
  [/bandage|med|heal|aid|salve/, ["bandage-roll", "medical-pack", "first-aid"]],
  [/water|bottle|drink|flask/, ["water-flask", "water-drop", "water-bottle"]],
  [/food|meal|stew|soup|ration|canned/, ["hot-meal", "meal", "food-can", "soup-ladle"]],
  [/meat|steak/, ["meat", "steak"]],
  [/berry|fruit/, ["berries-bowl", "strawberry"]],
  [/mushroom/, ["mushroom-gills", "mushrooms"]],
  [/seed|plant|herb|fiber/, ["seeds", "vine-leaf", "herbs-bundle"]],
  [/log|plank|wood|stick|branch|board/, ["wood-pile", "wood-beam", "wood-stick", "dead-wood"]],
  [/stone|rock|limestone|gravel|ore|mineral/, ["stone-pile", "stone-block", "ore"]],
  [/iron|steel|bar|plate|metal|scrap/, ["metal-bar", "metal-scales", "anvil"]],
  [/wire|cable|circuit|electronic|chip|processor|module/, ["circuitry", "processor", "cable-stayed-bridge"]],
  [/battery|power|cell|solar/, ["battery-pack", "power-button", "solar-power"]],
  [/fuel|jerrycan/, ["jerrycan", "gasoline"]],
  [/rope|fiber|cord/, ["rope-coil"]],
  [/cloth|fabric|leather|hide/, ["rolled-cloth", "leather-armor", "leather-vest"]],
  [/boot|shoe|sneaker/, ["walking-boot", "sneakers"]],
  [/hat|cap|hood|helmet/, ["baseball-cap", "visored-helmet", "viking-helmet"]],
  [/armor|vest|jacket|shirt|pants|tunic/, ["leather-vest", "shirt", "abdominal-armor", "trousers"]],
  [/glass/, ["window", "glass-ball", "glass-shards"]],
  [/torch|fire|camp/, ["torch", "campfire"]],
  [/gear|cog|spring|chain|piston|motor/, ["gears", "cog", "spring", "chain"]],
  [/nail|screw|bolt/, ["nails", "screw"]],
  [/map|blueprint|letter|package/, ["treasure-map", "blueprint", "envelope"]],
  [/coin|token|watch/, ["two-coins", "medal", "pocket-watch"]],
  [/key|card/, ["key", "id-card"]],
  [/radio/, ["radio-tower", "walkie-talkie"]],
  [/fishing/, ["fishing-pole", "fish"]],
  [/toxic|hazmat|gas|chemical|acid/, ["hazmat-suit", "gas-mask", "poison-bottle"]],
  [/rubber|plastic|polymer|tape|adhesive/, ["rubber", "tape", "cardboard-box"]],
  [/potato|carrot|corn|bean|crop|seed/, ["potato", "carrot", "corn", "beans", "seeds"]],
  [/broken|scrap|junk|bent|rusted/, ["broken-axe", "metal-scales", "broken-bottle"]],
  [/fuel|oil|charcoal|coal/, ["jerrycan", "coal-wagon"]],
];

function processSvg(raw, itemId) {
  const pal = palette(itemId);
  const pathRe = /<path[^>]*d="([^"]+)"[^>]*\/?>/g;
  let m;
  const allPaths = [];
  while ((m = pathRe.exec(raw)) !== null) allPaths.push(m[1]);
  let paths = [];
  for (const d of allPaths) {
    const n = d.replace(/,/g, " ");
    if (/^M0 0h512v512H0z$/i.test(n) || (n.includes("M0") && n.length < 40 && /H0z$/i.test(n))) continue;
    paths.push(d);
  }
  if (paths.length === 0 && allPaths.length) paths = allPaths.slice(1);
  if (paths.length === 0) paths = ["M128 128h256v256H128z"];
  const body = paths.map((d) => `<path fill="#f4f0e6" d="${d}"/>`).join("");
  const gid = `g-${itemId.replace(/[^a-z0-9]+/gi, "")}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-hidden="true">
  <defs>
    <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${pal.bg}"/>
      <stop offset="100%" stop-color="#0a0c0a"/>
    </linearGradient>
  </defs>
  <rect x="16" y="16" width="480" height="480" rx="72" fill="url(#${gid})" stroke="${pal.fill}" stroke-width="18"/>
  <circle cx="400" cy="112" r="28" fill="${pal.accent}" opacity="0.55"/>
  <g transform="translate(56,56) scale(0.78)">${body}</g>
</svg>
`;
}

const itemSys = fs.readFileSync(path.join(ROOT, "src/items/ItemSystem.ts"), "utf8");
const unique = [...new Set([...itemSys.matchAll(/id: "([^"]+)"/g)].map((m) => m[1]))];

const treeJson = JSON.parse(await get("https://api.github.com/repos/game-icons/icons/git/trees/master?recursive=1"));
const all = treeJson.tree.filter((t) => t.path.endsWith(".svg") && t.path.includes("/")).map((t) => t.path.replace(/\.svg$/, ""));
const bySlug = new Map();
for (const p of all) {
  const slug = p.split("/").pop();
  if (!bySlug.has(slug)) bySlug.set(slug, p);
}

function resolvePath(itemId) {
  if (EXPLICIT[itemId]) {
    if (all.includes(EXPLICIT[itemId])) return EXPLICIT[itemId];
    const slug = EXPLICIT[itemId].split("/").pop();
    if (bySlug.has(slug)) return bySlug.get(slug);
  }
  if (bySlug.has(itemId)) return bySlug.get(itemId);
  for (const [re, slugs] of KEYWORD_SLUGS) {
    if (!re.test(itemId)) continue;
    for (const s of slugs) if (bySlug.has(s)) return bySlug.get(s);
  }
  for (const t of itemId.split("-")) {
    if (t.length >= 3 && bySlug.has(t)) return bySlug.get(t);
  }
  for (const t of [...itemId.split("-")].sort((a, b) => b.length - a.length)) {
    if (t.length < 4) continue;
    for (const [slug, p] of bySlug) {
      if (slug.includes(t) || t.includes(slug)) return p;
    }
  }
  return bySlug.get("cardboard-box") || bySlug.get("cube") || all[0];
}

const map = {};
const needed = new Map();
for (const id of unique) {
  const p = resolvePath(id);
  map[id] = p;
  if (!needed.has(p)) needed.set(p, []);
  needed.get(p).push(id);
}

const cache = new Map();
const authors = new Set();
async function fetchIcon(p) {
  if (cache.has(p)) return cache.get(p);
  const svg = await get(`https://raw.githubusercontent.com/game-icons/icons/master/${p}.svg`);
  cache.set(p, svg);
  authors.add(p.split("/")[0]);
  return svg;
}

const entries = [...needed.keys()];
const CONC = 12;
for (let i = 0; i < entries.length; i += CONC) {
  await Promise.all(entries.slice(i, i + CONC).map(fetchIcon));
  process.stdout.write(`\rfetch ${Math.min(i + CONC, entries.length)}/${entries.length}`);
}
console.log("");

const fallback = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="72" fill="#1a2018"/><rect x="160" y="160" width="192" height="192" rx="24" fill="#88a070"/></svg>`;
for (const id of unique) {
  const raw = cache.get(map[id]);
  fs.writeFileSync(path.join(OUT, `${id}.svg`), raw ? processSvg(raw, id) : fallback);
}

fs.writeFileSync(
  path.join(OUT, "ATTRIBUTION.txt"),
  `Item icons based on Game Icons (https://game-icons.net), CC BY 3.0.
Authors: ${[...authors].sort().join(", ")}.
Recolored into a unified Survive on Earth tile style.
Original: https://github.com/game-icons/icons
`,
);
fs.writeFileSync(path.join(OUT, "sources.json"), JSON.stringify(map, null, 2));

const lines = unique.map((id) => `  "${id}": iconUrl("${id}"),`).join("\n");
fs.writeFileSync(
  path.join(ROOT, "src/ui/itemIcons.ts"),
  `import type { ItemId } from "../items/ItemId";

/**
 * Production item icons — unified plated style.
 * Source silhouettes: Game Icons (CC BY 3.0) https://game-icons.net
 * See public/icons/ATTRIBUTION.txt
 * Regenerate: node scripts/fetchItemIcons.mjs
 */

function iconUrl(id: string): string {
  return \`<img class="soi-item-icon-img" src="/icons/\${id}.svg" alt="" width="32" height="32" draggable="false" />\`;
}

export const ITEM_ICONS: Readonly<Record<ItemId, string>> = Object.freeze({
${lines}
});
`,
);

console.log("icons:", unique.length, "sources:", needed.size, "authors:", [...authors].join(", "));
