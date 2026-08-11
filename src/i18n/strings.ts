import type { LocaleId } from "./locales";
import { resolveContent } from "./content/resolveContent";

/**
 * Shell / UI / notify keys. Typed for menus; still string-compatible via resolveAny.
 * Content ids (item.* loc.* ach.* quest.* build.*) live in content catalogs.
 */
export type StringKey =
  | "menu.brand"
  | "menu.sub"
  | "menu.continue"
  | "menu.newGame"
  | "menu.settings"
  | "menu.language"
  | "menu.playtime"
  | "menu.level"
  | "menu.location"
  | "menu.lastPlayed"
  | "menu.noSave"
  | "menu.confirmNew"
  | "menu.confirmTitle"
  | "menu.confirmStart"
  | "menu.confirmCancel"
  | "menu.version"
  | "menu.ready"
  | "pause.title"
  | "pause.resume"
  | "pause.inventory"
  | "pause.settings"
  | "pause.controls"
  | "pause.language"
  | "pause.mainMenu"
  | "pause.controlsBody"
  | "death.title"
  | "death.hint"
  | "death.location"
  | "death.cause"
  | "death.causeDefault"
  | "death.respawn"
  | "death.mainMenu"
  | "lang.title"
  | "lang.continue"
  | "lang.hint"
  | "settings.title"
  | "settings.close"
  | "settings.graphics"
  | "settings.audio"
  | "settings.gameplay"
  | "settings.accessibility"
  | "settings.character"
  | "settings.uiScale"
  | "settings.textSize"
  | "settings.highContrast"
  | "settings.reducedMotion"
  | "settings.screenShake"
  | "settings.masterVolume"
  | "settings.quality"
  | "settings.quality.low"
  | "settings.quality.medium"
  | "settings.quality.high"
  | "settings.quality.ultra"
  | "settings.damageNumbers"
  | "settings.colorAssist"
  | "settings.gender.male"
  | "settings.gender.female"
  | "settings.gender.other"
  | "settings.name"
  | "settings.gender"
  | "settings.text.normal"
  | "settings.text.large"
  | "settings.text.xlarge"
  | "confirm.cancel"
  | "confirm.ok"
  | "confirm.deleteTitle"
  | "confirm.deleteBody"
  | "confirm.delete"
  | "loader.loading"
  | "loader.arriving"
  | "hud.aria"
  | "hud.health"
  | "hud.needs"
  | "hud.hunger"
  | "hud.thirst"
  | "hud.energy"
  | "hud.sneak"
  | "hud.attack"
  | "hud.interact"
  | "hud.build"
  | "hud.map"
  | "hud.inventory"
  | "hud.blueprints"
  | "hud.auto"
  | "hud.fists"
  | "hud.playerDefault"
  | "hud.defeated"
  | "hud.level"
  | "hud.quick1"
  | "hud.quick2"
  | "hud.pause"
  | "hud.localMap"
  | "hud.pickup"
  | "hud.primary"
  | "inv.title"
  | "inv.pockets"
  | "inv.equipment"
  | "inv.weapon"
  | "inv.backpack"
  | "inv.quick"
  | "inv.utility"
  | "inv.use"
  | "inv.split"
  | "inv.delete"
  | "inv.equip"
  | "inv.unequip"
  | "inv.assign"
  | "inv.empty"
  | "inv.full"
  | "inv.notAvailable"
  | "inv.editCharacter"
  | "inv.edit"
  | "inv.editName"
  | "inv.close"
  | "inv.armor"
  | "inv.durability"
  | "inv.qty"
  | "inv.select"
  | "inv.selectHint"
  | "craft.title"
  | "craft.subtitle"
  | "craft.craft"
  | "craft.empty"
  | "craft.needMaterials"
  | "craft.crafted"
  | "craft.close"
  | "craft.search"
  | "craft.select"
  | "craft.selectHint"
  | "craft.required"
  | "craft.creates"
  | "craft.working"
  | "craft.tab.all"
  | "craft.tab.tools"
  | "craft.tab.armor"
  | "craft.tab.consumable"
  | "craft.tab.material"
  | "craft.tab.gear"
  | "craft.tab.weapons"
  | "craft.tab.building"
  | "map.title"
  | "map.walk"
  | "map.run"
  | "map.vehicle"
  | "map.enter"
  | "map.close"
  | "map.locked"
  | "map.hint"
  | "map.localTitle"
  | "map.localHint"
  | "map.threat"
  | "map.region"
  | "build.title"
  | "build.place"
  | "build.remove"
  | "build.close"
  | "build.hint"
  | "build.furniture"
  | "build.structures"
  | "char.title"
  | "char.name"
  | "char.gender"
  | "char.save"
  | "char.cancel"
  | "notify.died"
  | "notify.respawned"
  | "notify.saved"
  | "notify.saveFailed"
  | "notify.startFailed"
  | "notify.inventoryFull"
  | "notify.healthFull"
  | "notify.cooldown"
  | "notify.cantUse"
  | "notify.quickEmpty"
  | "notify.noConsumable"
  | "notify.noUtility"
  | "notify.buildHomeOnly"
  | "notify.nothingToRemove"
  | "notify.noVehicle"
  | "notify.noFuel"
  | "notify.cantEnter"
  | "notify.noAmmo"
  | "notify.noSkillPoints"
  | "notify.questComplete"
  | "notify.achievement"
  | "notify.progression"
  | "notify.dungeonReset"
  | "notify.journal"
  | "notify.raidNearby"
  | "notify.worldEvent"
  | "notify.claimedEvent"
  | "notify.contractReady"
  | "notify.cannotLoot"
  | "notify.skillVitality"
  | "notify.bossStirs"
  | "notify.crafted"
  | "notify.bleeding"
  | "notify.slowed"
  | "notify.woundTreated"
  | "notify.regenerating"
  | "status.bleeding"
  | "status.slow"
  | "status.regeneration"
  | "travel.locked"
  | "travel.parent"
  | "travel.needBunker"
  | "travel.exhausted"
  | "travel.unknown"
  | "build.reason.needs-floor"
  | "build.reason.blocked"
  | "build.reason.no-piece"
  | "build.reason.no-materials"
  | "build.reason.invalid"
  | "build.reason.occupied"
  | "build.reason.out-of-bounds"
  | "build.reason.too-far"
  | "skill.max-hp"
  | "skill.move-speed"
  | "skill.harvest-speed"
  | "skill.melee-damage"
  | "skill.energy-regen";

type Dict = Partial<Record<StringKey, string>>;

const EN: Record<StringKey, string> = {
  "menu.brand": "Survive on Earth",
  "menu.sub": "Single-player survival · original world",
  "menu.continue": "Continue",
  "menu.newGame": "New Game",
  "menu.settings": "Settings",
  "menu.language": "Language",
  "menu.playtime": "Playtime",
  "menu.level": "Level",
  "menu.location": "Location",
  "menu.lastPlayed": "Last played",
  "menu.noSave": "No save found",
  "menu.confirmNew": "Start a new game? Existing progress will be overwritten.",
  "menu.confirmTitle": "Overwrite save?",
  "menu.confirmStart": "Start",
  "menu.confirmCancel": "Cancel",
  "menu.version": "v0.1.0",
  "menu.ready": "Ready",
  "pause.title": "Paused",
  "pause.resume": "Resume",
  "pause.inventory": "Inventory",
  "pause.settings": "Settings",
  "pause.controls": "Controls",
  "pause.language": "Language",
  "pause.mainMenu": "Main Menu",
  "pause.controlsBody": "Move: WASD / stick · Sprint: Shift · Attack: F / E / Space · Interact: E / Space · Inventory: I · Blueprints: B · Map: M · Build: G · Sneak: C · Pause: Esc",
  "death.title": "You Died",
  "death.hint": "Your gear dropped in a death bag nearby. Return and recover it if you can.",
  "death.location": "Location",
  "death.cause": "Cause",
  "death.causeDefault": "Fatal injuries",
  "death.respawn": "Respawn at Home",
  "death.mainMenu": "Main Menu",
  "lang.title": "Choose language",
  "lang.continue": "Continue",
  "lang.hint": "Pick a language to begin your story.",
  "settings.title": "Settings",
  "settings.close": "Close",
  "settings.graphics": "Graphics",
  "settings.audio": "Audio",
  "settings.gameplay": "Gameplay",
  "settings.accessibility": "Accessibility",
  "settings.character": "Character",
  "settings.uiScale": "UI scale",
  "settings.textSize": "Text size",
  "settings.highContrast": "High contrast",
  "settings.reducedMotion": "Reduced motion",
  "settings.screenShake": "Screen shake",
  "settings.masterVolume": "Master volume",
  "settings.quality": "Quality",
  "settings.quality.low": "Low",
  "settings.quality.medium": "Medium",
  "settings.quality.high": "High",
  "settings.quality.ultra": "Ultra",
  "settings.damageNumbers": "Damage numbers",
  "settings.colorAssist": "Color assist",
  "settings.gender.male": "Male",
  "settings.gender.female": "Female",
  "settings.gender.other": "Other",
  "settings.name": "Name",
  "settings.gender": "Gender",
  "settings.text.normal": "Normal",
  "settings.text.large": "Large",
  "settings.text.xlarge": "Extra large",
  "confirm.cancel": "Cancel",
  "confirm.ok": "OK",
  "confirm.deleteTitle": "Delete item?",
  "confirm.deleteBody": "This item will be destroyed.",
  "confirm.delete": "Delete",
  "loader.loading": "Loading…",
  "loader.arriving": "Arriving: {name}",
  "hud.aria": "Gameplay HUD",
  "hud.health": "Player health",
  "hud.needs": "Survival needs",
  "hud.hunger": "Hunger",
  "hud.thirst": "Thirst",
  "hud.energy": "Energy",
  "hud.sneak": "Sneak",
  "hud.attack": "Attack",
  "hud.interact": "Interact",
  "hud.build": "Build",
  "hud.map": "Map",
  "hud.inventory": "Inventory",
  "hud.blueprints": "Blueprints",
  "hud.auto": "AUTO",
  "hud.fists": "Fists",
  "hud.playerDefault": "Survivor",
  "hud.defeated": "PLAYER DEFEATED",
  "hud.level": "Lvl. {level}",
  "hud.quick1": "Quick slot 1",
  "hud.quick2": "Quick slot 2",
  "hud.pause": "Pause menu",
  "hud.localMap": "Open location map",
  "hud.pickup": "Pick up {name}, quantity {qty}",
  "hud.primary": "Primary action",
  "inv.title": "Inventory",
  "inv.pockets": "Pockets",
  "inv.equipment": "Equipment",
  "inv.weapon": "Weapon",
  "inv.backpack": "Backpack",
  "inv.quick": "Quick slot",
  "inv.utility": "Utility",
  "inv.use": "USE",
  "inv.split": "SPLIT",
  "inv.delete": "DELETE",
  "inv.equip": "EQUIP",
  "inv.unequip": "UNEQUIP",
  "inv.assign": "ASSIGN",
  "inv.empty": "Empty",
  "inv.full": "Inventory full",
  "inv.notAvailable": "Not available",
  "inv.editCharacter": "Edit character",
  "inv.edit": "Edit",
  "inv.editName": "Edit name",
  "inv.close": "Close",
  "inv.armor": "Armor +{n}",
  "inv.durability": "Durability {cur}/{max}",
  "inv.qty": "×{n}",
  "inv.select": "Select an item",
  "inv.selectHint": "Tap armor or tools · drag to equip",
  "craft.title": "Blueprints",
  "craft.subtitle": "Field workbench",
  "craft.craft": "CRAFT",
  "craft.empty": "No matching recipes",
  "craft.needMaterials": "Missing materials",
  "craft.crafted": "Crafted {name}",
  "craft.close": "Close",
  "craft.search": "Search…",
  "craft.select": "Select a blueprint",
  "craft.selectHint": "Tap an item to see materials and craft it.",
  "craft.required": "Required",
  "craft.creates": "Creates ×{n}",
  "craft.working": "Crafting…",
  "craft.tab.all": "All",
  "craft.tab.tools": "Tools",
  "craft.tab.armor": "Armor",
  "craft.tab.consumable": "Food",
  "craft.tab.material": "Parts",
  "craft.tab.gear": "Gear",
  "craft.tab.weapons": "Weapons",
  "craft.tab.building": "Build",
  "map.title": "World Map",
  "map.walk": "WALK",
  "map.run": "RUN",
  "map.vehicle": "VEHICLE",
  "map.enter": "ENTER LOCATION",
  "map.close": "Close",
  "map.locked": "Locked",
  "map.hint": "Select a location, then travel.",
  "map.localTitle": "Local Map",
  "map.localHint": "You are here. M or click minimap again to close.",
  "map.threat": "Threat {n}",
  "map.region": "Region",
  "build.title": "Build",
  "build.place": "PLACE",
  "build.remove": "REMOVE",
  "build.close": "Close",
  "build.hint": "Face a grid cell · Place or remove pieces",
  "build.furniture": "Furniture",
  "build.structures": "Structures",
  "char.title": "Character",
  "char.name": "Name",
  "char.gender": "Gender",
  "char.save": "Save",
  "char.cancel": "Cancel",
  "notify.died": "You died — gear dropped nearby",
  "notify.respawned": "Respawned at Home",
  "notify.saved": "Game saved",
  "notify.saveFailed": "Save failed",
  "notify.startFailed": "Failed to start game — see console",
  "notify.inventoryFull": "Inventory full",
  "notify.healthFull": "Health full",
  "notify.cooldown": "Cooldown",
  "notify.cantUse": "Can't use",
  "notify.quickEmpty": "Quick slot empty",
  "notify.noConsumable": "No consumable for quick slot",
  "notify.noUtility": "No utility item",
  "notify.buildHomeOnly": "Build only at Home",
  "notify.nothingToRemove": "Nothing to remove",
  "notify.noVehicle": "No vehicle assembled",
  "notify.noFuel": "Not enough fuel",
  "notify.cantEnter": "Can't enter",
  "notify.noAmmo": "No ammo",
  "notify.noSkillPoints": "No skill points",
  "notify.questComplete": "Quest complete (+{xp} XP)",
  "notify.achievement": "Achievement: {title}",
  "notify.progression": "Progression: {title}",
  "notify.dungeonReset": "Dungeon reset: {names}",
  "notify.journal": "Journal: {title}",
  "notify.raidNearby": "Raid site nearby: {title}",
  "notify.worldEvent": "World event: {title}",
  "notify.claimedEvent": "Claimed event: {title}",
  "notify.contractReady": "Contract ready: {title}",
  "notify.cannotLoot": "Cannot loot",
  "notify.skillVitality": "Skill: Vitality +1",
  "notify.bossStirs": "{name} stirs…",
  "notify.crafted": "Crafted {name}",
  "notify.bleeding": "You're bleeding!",
  "notify.slowed": "Movement slowed",
  "notify.woundTreated": "Bleeding stopped",
  "notify.regenerating": "Regenerating…",
  "status.bleeding": "Bleeding",
  "status.slow": "Slow",
  "status.regeneration": "Regen",
  "travel.locked": "Locked",
  "travel.parent": "Use parent entrance",
  "travel.needBunker": "Need bunker access card",
  "travel.exhausted": "Exhausted — walk home or rest",
  "travel.unknown": "Can't travel",
  "build.reason.needs-floor": "Needs floor",
  "build.reason.blocked": "Blocked",
  "build.reason.no-piece": "No piece selected",
  "build.reason.no-materials": "Missing materials",
  "build.reason.invalid": "Invalid placement",
  "build.reason.occupied": "Occupied",
  "build.reason.out-of-bounds": "Out of bounds",
  "build.reason.too-far": "Too far",
  "skill.max-hp": "Vitality",
  "skill.move-speed": "Swift",
  "skill.harvest-speed": "Forager",
  "skill.melee-damage": "Brawler",
  "skill.energy-regen": "Endurance",
};

/** Complete locales for shell UI. Partial locales fall back to EN. */
const UK: Dict = {
  "menu.brand": "Survive on Earth",
  "menu.sub": "Одиночне виживання · оригінальний світ",
  "menu.continue": "Продовжити",
  "menu.newGame": "Нова гра",
  "menu.settings": "Налаштування",
  "menu.language": "Мова",
  "menu.playtime": "Час гри",
  "menu.level": "Рівень",
  "menu.location": "Локація",
  "menu.lastPlayed": "Останній запуск",
  "menu.noSave": "Збереження відсутнє",
  "menu.confirmNew": "Почати нову гру? Поточний прогрес буде перезаписано.",
  "menu.confirmTitle": "Перезаписати збереження?",
  "menu.confirmStart": "Почати",
  "menu.confirmCancel": "Скасувати",
  "menu.ready": "Готово",
  "pause.title": "Пауза",
  "pause.resume": "Продовжити",
  "pause.inventory": "Інвентар",
  "pause.settings": "Налаштування",
  "pause.controls": "Керування",
  "pause.language": "Мова",
  "pause.mainMenu": "Головне меню",
  "pause.controlsBody": "Рух: WASD / стік · Біг: Shift · Удар: F / E / Space · Взаємодія: E / Space · Інвентар: I · Креслення: B · Карта: M · Будівництво: G · Пригнутися: C · Пауза: Esc",
  "death.title": "Ви загинули",
  "death.hint": "Спорядження залишилось у мішку смерті поблизу. Спробуйте повернутися і забрати його.",
  "death.location": "Локація",
  "death.cause": "Причина",
  "death.causeDefault": "Смертельні поранення",
  "death.respawn": "Відродитись вдома",
  "death.mainMenu": "Головне меню",
  "lang.title": "Оберіть мову",
  "lang.continue": "Далі",
  "lang.hint": "Оберіть мову, щоб почати історію.",
  "settings.title": "Налаштування",
  "settings.close": "Закрити",
  "settings.graphics": "Графіка",
  "settings.audio": "Звук",
  "settings.gameplay": "Геймплей",
  "settings.accessibility": "Доступність",
  "settings.character": "Персонаж",
  "settings.uiScale": "Масштаб UI",
  "settings.textSize": "Розмір тексту",
  "settings.highContrast": "Високий контраст",
  "settings.reducedMotion": "Менше анімацій",
  "settings.screenShake": "Тремтіння екрана",
  "settings.masterVolume": "Загальна гучність",
  "settings.quality": "Якість",
  "settings.quality.low": "Низька",
  "settings.quality.medium": "Середня",
  "settings.quality.high": "Висока",
  "settings.quality.ultra": "Ультра",
  "settings.damageNumbers": "Числа шкоди",
  "settings.colorAssist": "Допомога з кольором",
  "settings.gender.male": "Чоловік",
  "settings.gender.female": "Жінка",
  "settings.gender.other": "Інше",
  "settings.name": "Ім’я",
  "settings.gender": "Стать",
  "settings.text.normal": "Звичайний",
  "settings.text.large": "Великий",
  "settings.text.xlarge": "Дуже великий",
  "confirm.cancel": "Скасувати",
  "confirm.ok": "OK",
  "confirm.deleteTitle": "Видалити предмет?",
  "confirm.deleteBody": "Цей предмет буде знищено.",
  "confirm.delete": "Видалити",
  "loader.loading": "Завантаження…",
  "loader.arriving": "Прибуття: {name}",
  "hud.aria": "Ігровий HUD",
  "hud.health": "Здоров’я",
  "hud.needs": "Потреби",
  "hud.hunger": "Голод",
  "hud.thirst": "Спрага",
  "hud.energy": "Енергія",
  "hud.sneak": "Пригнутися",
  "hud.attack": "Удар",
  "hud.interact": "Взаємодія",
  "hud.build": "Будівництво",
  "hud.map": "Карта",
  "hud.inventory": "Інвентар",
  "hud.blueprints": "Креслення",
  "hud.auto": "АВТО",
  "hud.fists": "Кулаки",
  "hud.playerDefault": "Виживальник",
  "hud.defeated": "ГРАВЦЯ ПЕРЕМОЖЕНО",
  "hud.level": "Рів. {level}",
  "hud.quick1": "Швидкий слот 1",
  "hud.quick2": "Швидкий слот 2",
  "hud.pause": "Меню паузи",
  "hud.localMap": "Карта локації",
  "hud.pickup": "Підібрати {name}, ×{qty}",
  "hud.primary": "Основна дія",
  "inv.title": "Інвентар",
  "inv.pockets": "Кишені",
  "inv.equipment": "Спорядження",
  "inv.weapon": "Зброя",
  "inv.backpack": "Рюкзак",
  "inv.quick": "Швидкий слот",
  "inv.utility": "Утиліта",
  "inv.use": "ВИКОР.",
  "inv.split": "ПОДІЛ",
  "inv.delete": "ВИД.",
  "inv.equip": "ОДЯГТИ",
  "inv.unequip": "ЗНЯТИ",
  "inv.assign": "ПРИЗН.",
  "inv.empty": "Порожньо",
  "inv.full": "Інвентар повний",
  "inv.notAvailable": "Недоступно",
  "inv.editCharacter": "Редагувати персонажа",
  "inv.edit": "Змінити",
  "inv.editName": "Змінити імʼя",
  "inv.close": "Закрити",
  "inv.armor": "Броня +{n}",
  "inv.durability": "Міцність {cur}/{max}",
  "inv.qty": "×{n}",
  "inv.select": "Оберіть предмет",
  "inv.selectHint": "Торкніться броні чи інструментів · перетягніть для екіпірування",
  "craft.title": "Креслення",
  "craft.subtitle": "Польова майстерня",
  "craft.craft": "КРАФТ",
  "craft.empty": "Немає рецептів",
  "craft.needMaterials": "Бракує матеріалів",
  "craft.crafted": "Скрафтено: {name}",
  "craft.close": "Закрити",
  "craft.search": "Пошук…",
  "craft.select": "Оберіть креслення",
  "craft.selectHint": "Торкніться предмета, щоб побачити матеріали та змайструвати його.",
  "craft.required": "Потрібно",
  "craft.creates": "Створює ×{n}",
  "craft.working": "Крафт…",
  "craft.tab.all": "Усе",
  "craft.tab.tools": "Інструменти",
  "craft.tab.armor": "Броня",
  "craft.tab.consumable": "Їжа",
  "craft.tab.material": "Деталі",
  "craft.tab.gear": "Спорядження",
  "craft.tab.weapons": "Зброя",
  "craft.tab.building": "Будівлі",
  "map.title": "Світова карта",
  "map.walk": "ПІШКИ",
  "map.run": "БІГ",
  "map.vehicle": "ТРАНСПОРТ",
  "map.enter": "УВІЙТИ",
  "map.close": "Закрити",
  "map.locked": "Зачинено",
  "map.hint": "Оберіть локацію, потім подорожуйте.",
  "map.localTitle": "Місцева карта",
  "map.localHint": "Ви тут. M або мінікарта — закрити.",
  "map.threat": "Загроза {n}",
  "map.region": "Регіон",
  "build.title": "Будівництво",
  "build.place": "ПОСТАВИТИ",
  "build.remove": "ПРИБРАТИ",
  "build.close": "Закрити",
  "build.hint": "Дивіться на клітинку · Поставте або приберіть",
  "build.furniture": "Меблі",
  "build.structures": "Конструкції",
  "char.title": "Персонаж",
  "char.name": "Ім’я",
  "char.gender": "Стать",
  "char.save": "Зберегти",
  "char.cancel": "Скасувати",
  "notify.died": "Ви загинули — спорядження поблизу",
  "notify.respawned": "Відродження вдома",
  "notify.saved": "Гру збережено",
  "notify.saveFailed": "Помилка збереження",
  "notify.startFailed": "Не вдалося запустити — див. консоль",
  "notify.inventoryFull": "Інвентар повний",
  "notify.healthFull": "Здоров’я повне",
  "notify.cooldown": "Перезарядка",
  "notify.cantUse": "Не можна використати",
  "notify.quickEmpty": "Швидкий слот порожній",
  "notify.noConsumable": "Немає витратного в швидкому слоті",
  "notify.noUtility": "Немає утиліти",
  "notify.buildHomeOnly": "Будувати лише вдома",
  "notify.nothingToRemove": "Нічого прибирати",
  "notify.noVehicle": "Немає зібраного транспорту",
  "notify.noFuel": "Мало пального",
  "notify.cantEnter": "Не можна увійти",
  "notify.noAmmo": "Немає набоїв",
  "notify.noSkillPoints": "Немає очків навичок",
  "notify.questComplete": "Квест виконано (+{xp} XP)",
  "notify.achievement": "Досягнення: {title}",
  "notify.progression": "Прогрес: {title}",
  "notify.dungeonReset": "Скидання данжу: {names}",
  "notify.journal": "Журнал: {title}",
  "notify.raidNearby": "Рейд поблизу: {title}",
  "notify.worldEvent": "Світова подія: {title}",
  "notify.claimedEvent": "Подію завершено: {title}",
  "notify.contractReady": "Контракт: {title}",
  "notify.cannotLoot": "Не можна залутати",
  "notify.skillVitality": "Навичка: Живучість +1",
  "notify.bossStirs": "{name} пробуджується…",
  "notify.crafted": "Скрафтено: {name}",
  "notify.bleeding": "Ви кровоточите!",
  "notify.slowed": "Рух сповільнено",
  "notify.woundTreated": "Кровотечу зупинено",
  "notify.regenerating": "Регенерація…",
  "status.bleeding": "Кровотеча",
  "status.slow": "Повільність",
  "status.regeneration": "Реген",
  "travel.locked": "Зачинено",
  "travel.parent": "Увійдіть з батьківської локації",
  "travel.needBunker": "Потрібна карта доступу до бункера",
  "travel.exhausted": "Виснаження — йдіть додому або відпочиньте",
  "travel.unknown": "Не можна подорожувати",
  "build.reason.needs-floor": "Потрібна підлога",
  "build.reason.blocked": "Заблоковано",
  "build.reason.no-piece": "Нічого не вибрано",
  "build.reason.no-materials": "Недостатньо матеріалів",
  "build.reason.invalid": "Невірне розташування",
  "build.reason.occupied": "Зайнято",
  "build.reason.out-of-bounds": "Поза межами",
  "build.reason.too-far": "Занадто далеко",
  "skill.max-hp": "Живучість",
  "skill.move-speed": "Спритність",
  "skill.harvest-speed": "Збирач",
  "skill.melee-damage": "Бійка",
  "skill.energy-regen": "Витривалість",
};

// Compact full-shell tables for remaining locales (full coverage of EN keys).
import { SHELL_PL, SHELL_DE, SHELL_ES, SHELL_FR, SHELL_IT, SHELL_PT, SHELL_TR, SHELL_CS, SHELL_RO, SHELL_JA, SHELL_KO } from "./shellLocales";

const TABLES: Record<LocaleId, Dict> = {
  en: EN,
  uk: UK,
  pl: SHELL_PL,
  de: SHELL_DE,
  es: SHELL_ES,
  fr: SHELL_FR,
  it: SHELL_IT,
  pt: SHELL_PT,
  tr: SHELL_TR,
  cs: SHELL_CS,
  ro: SHELL_RO,
  ja: SHELL_JA,
  ko: SHELL_KO,
};

function applyVars(raw: string, vars?: Record<string, string | number>): string {
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

export function resolveString(locale: LocaleId, key: StringKey, vars?: Record<string, string | number>): string {
  const raw = TABLES[locale]?.[key] ?? EN[key] ?? key;
  return applyVars(raw, vars);
}

/** Any free-form key: shell first, then content catalog, then EN, then fallback. */
export function resolveAny(
  locale: LocaleId,
  key: string,
  vars?: Record<string, string | number>,
  fallback?: string,
): string {
  const shell = TABLES[locale]?.[key as StringKey] ?? EN[key as StringKey];
  if (shell !== undefined) return applyVars(shell, vars);
  const content = resolveContent(locale, key, undefined);
  if (content !== key) return applyVars(content, vars);
  if (fallback !== undefined) return applyVars(fallback, vars);
  return applyVars(CONTENT_FALLBACK_KEY(locale, key) ?? key, vars);
}

function CONTENT_FALLBACK_KEY(locale: LocaleId, key: string): string | undefined {
  const c = resolveContent(locale, key, "");
  return c || undefined;
}

export function hasShellKey(key: string): key is StringKey {
  return key in EN;
}
