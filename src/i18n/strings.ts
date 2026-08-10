import type { LocaleId } from "./locales";

/** Flat translation table — keys are stable English identifiers. */
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
  | "death.title"
  | "death.hint"
  | "death.location"
  | "death.cause"
  | "death.causeDefault"
  | "death.respawn"
  | "death.mainMenu"
  | "lang.title"
  | "lang.continue"
  | "settings.title"
  | "settings.close"
  | "settings.graphics"
  | "settings.audio"
  | "settings.gameplay"
  | "settings.accessibility"
  | "settings.uiScale"
  | "settings.textSize"
  | "settings.highContrast"
  | "settings.reducedMotion"
  | "settings.screenShake"
  | "notify.died"
  | "notify.respawned"
  | "hud.sneak"
  | "hud.attack"
  | "hud.interact"
  | "hud.build"
  | "hud.map"
  | "hud.inventory";

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
  "death.title": "You Died",
  "death.hint": "Your gear dropped in a death bag nearby. Return and recover it if you can.",
  "death.location": "Location",
  "death.cause": "Cause",
  "death.causeDefault": "Fatal injuries",
  "death.respawn": "Respawn at Home",
  "death.mainMenu": "Main Menu",
  "lang.title": "Choose language",
  "lang.continue": "Continue",
  "settings.title": "Settings",
  "settings.close": "Close",
  "settings.graphics": "Graphics",
  "settings.audio": "Audio",
  "settings.gameplay": "Gameplay",
  "settings.accessibility": "Accessibility",
  "settings.uiScale": "UI scale",
  "settings.textSize": "Text size",
  "settings.highContrast": "High contrast",
  "settings.reducedMotion": "Reduced motion",
  "settings.screenShake": "Screen shake",
  "notify.died": "You died — gear dropped nearby",
  "notify.respawned": "Respawned at Home",
  "hud.sneak": "Sneak",
  "hud.attack": "Attack",
  "hud.interact": "Interact",
  "hud.build": "Build",
  "hud.map": "Map",
  "hud.inventory": "Inventory",
};

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
  "pause.title": "Пауза",
  "pause.resume": "Продовжити",
  "pause.inventory": "Інвентар",
  "pause.settings": "Налаштування",
  "pause.controls": "Керування",
  "pause.language": "Мова",
  "pause.mainMenu": "Головне меню",
  "death.title": "Ви загинули",
  "death.hint": "Спорядження залишилось у мішку смерті поблизу. Спробуйте повернутися і забрати його.",
  "death.location": "Локація",
  "death.cause": "Причина",
  "death.causeDefault": "Смертельні поранення",
  "death.respawn": "Відродитись вдома",
  "death.mainMenu": "Головне меню",
  "lang.title": "Оберіть мову",
  "lang.continue": "Далі",
  "settings.title": "Налаштування",
  "settings.close": "Закрити",
  "settings.graphics": "Графіка",
  "settings.audio": "Звук",
  "settings.gameplay": "Геймплей",
  "settings.accessibility": "Доступність",
  "settings.uiScale": "Масштаб UI",
  "settings.textSize": "Розмір тексту",
  "settings.highContrast": "Високий контраст",
  "settings.reducedMotion": "Менше анімацій",
  "settings.screenShake": "Тремтіння екрана",
  "notify.died": "Ви загинули — спорядження поблизу",
  "notify.respawned": "Відродження вдома",
  "hud.sneak": "Пригнутися",
  "hud.attack": "Удар",
  "hud.interact": "Взаємодія",
  "hud.build": "Будівництво",
  "hud.map": "Карта",
  "hud.inventory": "Інвентар",
};

const PL: Dict = {
  "menu.continue": "KONTYNUUJ",
  "menu.newGame": "NOWA GRA",
  "menu.settings": "USTAWIENIA",
  "menu.language": "JĘZYK",
  "pause.title": "PAUZA",
  "pause.resume": "WZNÓW",
  "pause.mainMenu": "MENU GŁÓWNE",
  "death.title": "NIE ŻYJESZ",
  "death.respawn": "ODRODŹ W DOMU",
  "lang.title": "Wybierz język",
  "lang.continue": "DALEJ",
};

const DE: Dict = {
  "menu.continue": "FORTSETZEN",
  "menu.newGame": "NEUES SPIEL",
  "menu.settings": "EINSTELLUNGEN",
  "menu.language": "SPRACHE",
  "pause.title": "PAUSE",
  "pause.resume": "FORTSETZEN",
  "pause.mainMenu": "HAUPTMENÜ",
  "death.title": "DU BIST TOT",
  "death.respawn": "BEI HOME NEU STARTEN",
  "lang.title": "Sprache wählen",
  "lang.continue": "WEITER",
};

const ES: Dict = {
  "menu.continue": "CONTINUAR",
  "menu.newGame": "NUEVA PARTIDA",
  "menu.settings": "AJUSTES",
  "menu.language": "IDIOMA",
  "pause.title": "PAUSA",
  "pause.resume": "REANUDAR",
  "death.title": "HAS MUERTO",
  "death.respawn": "REAPARECER EN CASA",
  "lang.title": "Elegir idioma",
};

const FR: Dict = {
  "menu.continue": "CONTINUER",
  "menu.newGame": "NOUVELLE PARTIE",
  "menu.settings": "PARAMÈTRES",
  "pause.title": "PAUSE",
  "pause.resume": "REPRENDRE",
  "death.title": "VOUS ÊTES MORT",
  "death.respawn": "RÉAPPARAÎTRE AU CAMP",
  "lang.title": "Choisir la langue",
};

const IT: Dict = {
  "menu.continue": "CONTINUA",
  "menu.newGame": "NUOVA PARTITA",
  "pause.title": "PAUSA",
  "death.title": "SEI MORTO",
  "lang.title": "Scegli lingua",
};

const PT: Dict = {
  "menu.continue": "CONTINUAR",
  "menu.newGame": "NOVO JOGO",
  "pause.title": "PAUSA",
  "death.title": "VOCÊ MORREU",
  "lang.title": "Escolher idioma",
};

const TR: Dict = {
  "menu.continue": "DEVAM",
  "menu.newGame": "YENİ OYUN",
  "pause.title": "DURAKLATILDI",
  "death.title": "ÖLDÜN",
  "lang.title": "Dil seç",
};

const CS: Dict = {
  "menu.continue": "POKRAČOVAT",
  "menu.newGame": "NOVÁ HRA",
  "pause.title": "PAUZA",
  "death.title": "JSI MRTVÝ",
  "lang.title": "Zvolte jazyk",
};

const RO: Dict = {
  "menu.continue": "CONTINUĂ",
  "menu.newGame": "JOC NOU",
  "pause.title": "PAUZĂ",
  "death.title": "AI MURIT",
  "lang.title": "Alege limba",
};

const JA: Dict = {
  "menu.continue": "続ける",
  "menu.newGame": "新しいゲーム",
  "menu.settings": "設定",
  "menu.language": "言語",
  "pause.title": "一時停止",
  "pause.resume": "再開",
  "pause.mainMenu": "メインメニュー",
  "death.title": "死亡",
  "death.respawn": "ホームで復活",
  "lang.title": "言語を選択",
  "lang.continue": "続ける",
};

const KO: Dict = {
  "menu.continue": "이어하기",
  "menu.newGame": "새 게임",
  "menu.settings": "설정",
  "pause.title": "일시정지",
  "pause.resume": "계속",
  "death.title": "사망",
  "death.respawn": "홈에서 부활",
  "lang.title": "언어 선택",
};

const TABLES: Record<LocaleId, Dict> = {
  en: EN,
  uk: UK,
  pl: PL,
  de: DE,
  es: ES,
  fr: FR,
  it: IT,
  pt: PT,
  tr: TR,
  cs: CS,
  ro: RO,
  ja: JA,
  ko: KO,
};

export function resolveString(locale: LocaleId, key: StringKey, vars?: Record<string, string | number>): string {
  const raw = TABLES[locale]?.[key] ?? EN[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}
