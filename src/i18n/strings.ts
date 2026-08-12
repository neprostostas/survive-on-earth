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
  | "hud.farmPlant"
  | "hud.farmWater"
  | "hud.farmFertilize"
  | "hud.farmHarvest"
  | "hud.farmGrow"
  | "hud.baseUtility"
  | "hud.basePower"
  | "hud.baseWater"
  | "hud.utilityFuel"
  | "hud.utilityOn"
  | "hud.utilityOff"
  | "hud.doorOpen"
  | "hud.doorClose"
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
  | "craft.needBench"
  | "craft.needBlueprint"
  | "craft.blueprint"
  | "craft.crafted"
  | "craft.close"
  | "craft.search"
  | "craft.select"
  | "craft.selectHint"
  | "craft.required"
  | "craft.creates"
  | "craft.working"
  | "craft.readyOnly"
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
  | "vehicle.kicker"
  | "vehicle.title"
  | "vehicle.bike"
  | "vehicle.atv"
  | "vehicle.refuel"
  | "vehicle.setActive"
  | "vehicle.progress"
  | "vehicle.fuel"
  | "vehicle.condition"
  | "vehicle.activeNow"
  | "vehicle.ready"
  | "vehicle.incomplete"
  | "vehicle.hintReady"
  | "vehicle.hintParts"
  | "vehicle.needFuelCan"
  | "vehicle.partInstalled"
  | "vehicle.partInstall"
  | "vehicle.partNeed"
  | "vehicle.part.frame"
  | "vehicle.part.wheels"
  | "vehicle.part.engine"
  | "vehicle.part.fuelTank"
  | "vehicle.part.mechanics"
  | "vehicle.part.electronics"
  | "vehicle.part.suspension"
  | "contract.kicker"
  | "contract.title"
  | "contract.board"
  | "contract.active"
  | "contract.hint"
  | "contract.emptyBoard"
  | "contract.emptyActive"
  | "contract.accept"
  | "contract.claim"
  | "contract.claimed"
  | "contract.ready"
  | "contract.inProgress"
  | "contract.working"
  | "npc.kicker"
  | "npc.tabTalk"
  | "npc.tabTrade"
  | "npc.noTalk"
  | "npc.noTrade"
  | "npc.trade"
  | "npc.tokens"
  | "map.enter"
  | "map.close"
  | "map.locked"
  | "map.event"
  | "map.raid"
  | "map.intelEmpty"
  | "map.hint"
  | "map.localTitle"
  | "map.localHint"
  | "map.threat"
  | "map.region"
  | "build.title"
  | "build.place"
  | "build.remove"
  | "build.repair"
  | "build.close"
  | "build.hint"
  | "build.hintRemove"
  | "build.hintRepair"
  | "build.furniture"
  | "build.structures"
  | "char.title"
  | "char.name"
  | "char.gender"
  | "char.save"
  | "char.cancel"
  | "notify.died"
  | "notify.respawned"
  | "notify.deathBagHere"
  | "notify.lootDeathBag"
  | "notify.lootDeathBagPartial"
  | "notify.stationStarted"
  | "notify.stationDone"
  | "notify.stationMailbox"
  | "notify.stationNeedBuild"
  | "notify.stationNeedMetalwork"
  | "notify.stationNeedChemistry"
  | "notify.stationNeedWater"
  | "notify.stationNeedComposter"
  | "notify.stationNeedRecycler"
  | "notify.farmPlanted"
  | "notify.farmWatered"
  | "notify.farmFertilized"
  | "notify.farmHarvest"
  | "notify.farmNeedSeed"
  | "notify.farmNeedWater"
  | "notify.farmGrowing"
  | "notify.genNeedFuel"
  | "notify.genFueled"
  | "notify.genOn"
  | "notify.genOff"
  | "notify.lampOn"
  | "notify.lampOff"
  | "notify.lampNoPower"
  | "notify.radioOn"
  | "notify.radioOff"
  | "notify.radioNoPower"
  | "notify.radioScan"
  | "notify.radioScanClear"
  | "notify.radioEvent"
  | "notify.radioEventAt"
  | "notify.radioRaid"
  | "notify.doorOpened"
  | "notify.doorClosed"
  | "notify.lockOpened"
  | "notify.lockPowered"
  | "notify.lockNeedKey"
  | "notify.lockNeedPower"
  | "notify.lockBlocked"
  | "notify.foodSpoiled"
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
  | "notify.structureRepaired"
  | "notify.nothingToRepair"
  | "notify.alreadyRepaired"
  | "notify.repairNeedMats"
  | "notify.structureDamaged"
  | "notify.structureDestroyed"
  | "notify.nothingToRemove"
  | "notify.noVehicle"
  | "notify.noFuel"
  | "notify.vehicleAssembled"
  | "notify.contractAccepted"
  | "notify.contractClaimed"
  | "notify.contractNotReady"
  | "notify.npcQuest"
  | "notify.npcTradeOk"
  | "notify.npcTradeFail"
  | "notify.campHub"
  | "notify.courierGranted"
  | "notify.courierDelivered"
  | "notify.courierAlready"
  | "notify.courierNoPackage"
  | "notify.defenseStart"
  | "notify.defenseCleared"
  | "notify.cantEnter"
  | "notify.noAmmo"
  | "notify.noSkillPoints"
  | "notify.questComplete"
  | "notify.achievement"
  | "notify.blueprintLearned"
  | "notify.blueprintKnown"
  | "notify.progression"
  | "notify.dungeonReset"
  | "notify.dungeonResetHere"
  | "notify.journal"
  | "notify.raidNearby"
  | "notify.raidObjective"
  | "notify.raidCleared"
  | "notify.worldEvent"
  | "notify.worldEventAt"
  | "notify.claimedEvent"
  | "notify.nightfall"
  | "notify.warmedUp"
  | "notify.caravanOpen"
  | "notify.caravanGone"
  | "notify.contractReady"
  | "notify.cannotLoot"
  | "notify.skillVitality"
  | "notify.bossStirs"
  | "notify.bossDown"
  | "notify.crafted"
  | "notify.bleeding"
  | "notify.slowed"
  | "notify.woundTreated"
  | "notify.regenerating"
  | "notify.infection"
  | "notify.infectionCleared"
  | "status.bleeding"
  | "status.slow"
  | "status.regeneration"
  | "status.infection"
  | "notify.zoneTimeHalf"
  | "notify.zoneTimeMinute"
  | "notify.zoneTimeUp"
  | "notify.threatDetected"
  | "notify.needWorkbench"
  | "hud.zoneTimer"
  | "hud.quest"
  | "hud.questDone"
  | "hud.day"
  | "hud.night"
  | "hud.cold"
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
  | "skill.energy-regen"
  | "skill.desc.max-hp"
  | "skill.desc.move-speed"
  | "skill.desc.harvest-speed"
  | "skill.desc.melee-damage"
  | "skill.desc.energy-regen"
  | "skills.kicker"
  | "skills.title"
  | "skills.points"
  | "skills.buy"
  | "skills.maxed"
  | "notify.skillBought"
  | "journal.kicker"
  | "journal.title"
  | "journal.hint"
  | "journal.tabNotes"
  | "journal.tabFactions"
  | "journal.tabDiscoveries"
  | "journal.emptyNotes"
  | "journal.countLocations"
  | "journal.countItems"
  | "journal.countEnemies"
  | "journal.countNotes"
  | "journal.tier.unknown"
  | "journal.tier.accepted"
  | "journal.tier.trusted"
  | "journal.tier.ally"
  | "journal.tier.hostile"
  | "achievements.kicker"
  | "achievements.title"
  | "achievements.progress"
  | "achievements.filterAll"
  | "achievements.filterUnlocked"
  | "achievements.filterLocked"
  | "achievements.empty"
  | "quests.kicker"
  | "quests.title"
  | "quests.progress"
  | "quests.filterActive"
  | "quests.filterDone"
  | "quests.filterAll"
  | "quests.empty"
  | "quests.track"
  | "quests.tracking"
  | "quests.metaProgress"
  | "quests.metaDone";

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
  "hud.farmPlant": "Plant",
  "hud.farmWater": "Water",
  "hud.farmFertilize": "Fertilize",
  "hud.farmHarvest": "Harvest",
  "hud.farmGrow": "Growing",
  "hud.baseUtility": "Base power and water",
  "hud.basePower": "PWR",
  "hud.baseWater": "H2O",
  "hud.utilityFuel": "Fuel",
  "hud.utilityOn": "Turn on",
  "hud.utilityOff": "Turn off",
  "hud.doorOpen": "Open",
  "hud.doorClose": "Close",
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
  "craft.subtitle": "Workbench",
  "craft.craft": "CRAFT",
  "craft.empty": "No matching recipes",
  "craft.needMaterials": "Missing materials",
  "craft.needBench": "Needs {bench}",
  "craft.needBlueprint": "Needs {name}",
  "craft.blueprint": "Blueprint",
  "craft.crafted": "Crafted {name}",
  "craft.close": "Close",
  "craft.search": "Search…",
  "craft.select": "Select a blueprint",
  "craft.selectHint": "Tap an item to see materials and craft it.",
  "craft.required": "Required",
  "craft.creates": "Creates ×{n}",
  "craft.working": "Crafting…",
  "craft.readyOnly": "Ready only",
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
  "vehicle.kicker": "ASSEMBLY",
  "vehicle.title": "Vehicle Bay",
  "vehicle.bike": "Bike",
  "vehicle.atv": "ATV",
  "vehicle.refuel": "Refuel",
  "vehicle.setActive": "Set active",
  "vehicle.progress": "Parts {pct}%",
  "vehicle.fuel": "Fuel {value}",
  "vehicle.condition": "Condition {pct}%",
  "vehicle.activeNow": "Active vehicle",
  "vehicle.ready": "Ready — set active to use",
  "vehicle.incomplete": "Install remaining parts",
  "vehicle.hintReady": "Refuel with Fuel Can. Map → VEHICLE uses fuel.",
  "vehicle.hintParts": "Install parts from inventory at the assembly bench.",
  "vehicle.needFuelCan": "Need a Fuel Can",
  "vehicle.partInstalled": "OK",
  "vehicle.partInstall": "Install",
  "vehicle.partNeed": "Need {name}",
  "vehicle.part.frame": "Frame",
  "vehicle.part.wheels": "Wheels",
  "vehicle.part.engine": "Engine",
  "vehicle.part.fuelTank": "Fuel tank",
  "vehicle.part.mechanics": "Mechanics",
  "vehicle.part.electronics": "Electronics",
  "vehicle.part.suspension": "Suspension",
  "contract.kicker": "FACTIONS",
  "contract.title": "Field Board",
  "contract.board": "Available",
  "contract.active": "In progress",
  "contract.hint": "Accept a job. Complete objectives in the world, then claim rewards here.",
  "contract.emptyBoard": "No postings today — wait for the next world day.",
  "contract.emptyActive": "No active contracts.",
  "contract.accept": "Accept",
  "contract.claim": "Claim",
  "contract.claimed": "Claimed",
  "contract.ready": "Ready to claim",
  "contract.inProgress": "Working",
  "contract.working": "Working…",
  "npc.kicker": "CAMP",
  "npc.tabTalk": "Talk",
  "npc.tabTrade": "Trade",
  "npc.noTalk": "Nothing more to say right now.",
  "npc.noTrade": "No offers today.",
  "npc.trade": "Trade",
  "npc.tokens": "Trade tokens: {n}",
  "map.enter": "ENTER LOCATION",
  "map.close": "Close",
  "map.locked": "Locked",
  "map.event": "Event",
  "map.raid": "Raid",
  "map.intelEmpty": "No signals",
  "map.hint": "Select a location, then travel.",
  "map.localTitle": "Local Map",
  "map.localHint": "You are here. M or click minimap again to close.",
  "map.threat": "Threat {n}",
  "map.region": "Region",
  "build.title": "Build",
  "build.place": "PLACE",
  "build.remove": "REMOVE",
  "build.repair": "REPAIR",
  "build.close": "Close",
  "build.hint": "Face a grid cell · Place, repair, or remove",
  "build.hintRemove": "Aim at a piece and press place to demolish (furniture → wall → floor).",
  "build.hintRepair": "Aim at a damaged piece. Pay partial materials to fully restore HP.",
  "build.furniture": "Furniture",
  "build.structures": "Structures",
  "char.title": "Character",
  "char.name": "Name",
  "char.gender": "Gender",
  "char.save": "Save",
  "char.cancel": "Cancel",
  "notify.died": "You died — gear left in a bag at this location",
  "notify.respawned": "Respawned at Home",
  "notify.deathBagHere": "Your gear bag is still at {location}",
  "notify.lootDeathBag": "Recovered gear from bag",
  "notify.lootDeathBagPartial": "Bag partially emptied — inventory full",
  "notify.stationStarted": "Station process started",
  "notify.stationDone": "Station finished: {name}",
  "notify.stationMailbox": "Station full — {name} sent to mailbox",
  "notify.stationNeedBuild": "Build a furnace first",
  "notify.stationNeedMetalwork": "Build a metalwork bench first",
  "notify.stationNeedChemistry": "Build a chemistry station first",
  "notify.stationNeedWater": "Build a water collector first",
  "notify.stationNeedComposter": "Build a composter first",
  "notify.stationNeedRecycler": "Build a recycler first",
  "notify.farmPlanted": "Planted {name}",
  "notify.farmWatered": "Plot watered",
  "notify.farmFertilized": "Plot fertilized",
  "notify.farmHarvest": "Crop harvested",
  "notify.farmNeedSeed": "Need seeds to plant",
  "notify.farmNeedWater": "Need water (bottle / clean / rain) or base tanks",
  "notify.farmGrowing": "Growing ({pct}%)",
  "notify.genNeedFuel": "Need charcoal to fuel the generator",
  "notify.genFueled": "Generator fueled",
  "notify.genOn": "Generator on",
  "notify.genOff": "Generator off",
  "notify.lampOn": "Lamp on",
  "notify.lampOff": "Lamp off",
  "notify.lampNoPower": "Lamp on, but no power on the grid",
  "notify.radioOn": "Radio tuned in",
  "notify.radioOff": "Radio silent",
  "notify.radioNoPower": "Radio on, but no power on the grid",
  "notify.radioScan": "Scanning airwaves…",
  "notify.radioScanClear": "No traffic on the band",
  "notify.radioEvent": "Signal: {title} (threat {danger})",
  "notify.radioEventAt": "Signal: {title} @ {where} (threat {danger})",
  "notify.radioRaid": "Compound ping: {title} (T{threat})",
  "notify.doorOpened": "Door opened",
  "notify.doorClosed": "Door closed",
  "notify.lockOpened": "Unlocked",
  "notify.lockPowered": "Breaker engaged — cage powered",
  "notify.lockNeedKey": "Need {name}",
  "notify.lockNeedPower": "No power — find the breaker",
  "notify.lockBlocked": "Still locked",
  "notify.foodSpoiled": "Some food spoiled",
  "notify.zoneTimeHalf": "Zone time half spent",
  "notify.zoneTimeMinute": "1 minute left in this zone",
  "notify.zoneTimeUp": "Time's up — forced exit",
  "notify.threatDetected": "You're being hunted",
  "notify.needWorkbench": "Use a workbench to craft",
  "hud.zoneTimer": "ZONE",
  "hud.quest": "QUEST",
  "hud.questDone": "DONE",
  "hud.day": "DAY",
  "hud.night": "NIGHT",
  "hud.cold": "COLD",
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
  "notify.structureRepaired": "Structure repaired",
  "notify.nothingToRepair": "No damaged structure here",
  "notify.alreadyRepaired": "Already at full integrity",
  "notify.repairNeedMats": "Need materials to repair",
  "notify.structureDamaged": "Base structure damaged",
  "notify.structureDestroyed": "A structure collapsed",
  "notify.nothingToRemove": "Nothing to remove",
  "notify.noVehicle": "No vehicle assembled",
  "notify.noFuel": "Not enough fuel",
  "notify.vehicleAssembled": "Vehicle assembled — travel mode unlocked",
  "notify.contractAccepted": "Contract accepted",
  "notify.contractClaimed": "Reward claimed: {title} (+{xp} XP)",
  "notify.contractNotReady": "Contract not ready to claim",
  "notify.npcQuest": "Quest tracked: {title}",
  "notify.npcTradeOk": "Traded for {name}",
  "notify.npcTradeFail": "Cannot trade ({reason})",
  "notify.campHub": "Survivor Camp — talk to Jon or Mira (E)",
  "notify.courierGranted": "Sealed package received",
  "notify.courierDelivered": "Package delivered to Mira",
  "notify.courierAlready": "Already carrying a sealed package",
  "notify.courierNoPackage": "No sealed package to deliver",
  "notify.defenseStart": "Defense alert: {title}",
  "notify.defenseCleared": "Probe defeated — {title}",
  "notify.cantEnter": "Can't enter",
  "notify.noAmmo": "No ammo",
  "notify.noSkillPoints": "No skill points",
  "notify.questComplete": "Quest complete (+{xp} XP)",
  "notify.achievement": "Achievement: {title}",
  "notify.blueprintLearned": "Learned: {name}",
  "notify.blueprintKnown": "Already known: {name}",
  "notify.progression": "Progression: {title}",
  "notify.dungeonReset": "Dungeon reset: {names}",
  "notify.dungeonResetHere": "This dungeon just cycled — hostiles and sealed caches refreshed",
  "notify.journal": "Journal: {title}",
  "notify.raidNearby": "Raid site nearby: {title}",
  "notify.raidObjective": "Clear the compound: {title}",
  "notify.raidCleared": "Compound cleared: {title}",
  "notify.worldEvent": "World event: {title}",
  "notify.worldEventAt": "World event here: {title} ({where})",
  "notify.claimedEvent": "Claimed event: {title}",
  "notify.caravanOpen": "Caravan open: {title} — trade before they leave.",
  "notify.caravanGone": "The caravan has moved on.",
  "notify.nightfall": "Night falls — infected hear farther.",
  "notify.warmedUp": "Warmth returns.",
  "notify.contractReady": "Contract ready: {title}",
  "notify.cannotLoot": "Cannot loot",
  "notify.skillVitality": "Skill: Vitality +1",
  "notify.bossStirs": "{name} stirs…",
  "notify.bossDown": "Boss down: {name}",
  "notify.crafted": "Crafted {name}",
  "notify.bleeding": "You're bleeding!",
  "notify.slowed": "Movement slowed",
  "notify.woundTreated": "Bleeding stopped",
  "notify.regenerating": "Regenerating…",
  "notify.infection": "Bite infection!",
  "notify.infectionCleared": "Infection cleared",
  "status.bleeding": "Bleeding",
  "status.slow": "Slow",
  "status.regeneration": "Regen",
  "status.infection": "Infected",
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
  "skill.desc.max-hp": "+10 max HP per rank",
  "skill.desc.move-speed": "+3% move speed per rank",
  "skill.desc.harvest-speed": "+6% harvest swing speed per rank",
  "skill.desc.melee-damage": "+4% melee damage per rank",
  "skill.desc.energy-regen": "+10% energy regen per rank",
  "skills.kicker": "PROGRESSION",
  "skills.title": "Skills",
  "skills.points": "Skill points: {n}",
  "skills.buy": "Buy",
  "skills.maxed": "Maxed",
  "notify.skillBought": "Skill: {name} +1",
  "journal.kicker": "CODEX",
  "journal.title": "Field Journal",
  "journal.hint": "Notes from the road, faction standing, and discoveries.",
  "journal.tabNotes": "Notes",
  "journal.tabFactions": "Factions",
  "journal.tabDiscoveries": "Discoveries",
  "journal.emptyNotes": "No lore notes yet — travel and listen.",
  "journal.countLocations": "Locations logged",
  "journal.countItems": "Items logged",
  "journal.countEnemies": "Enemies logged",
  "journal.countNotes": "Notes logged",
  "journal.tier.unknown": "Unknown",
  "journal.tier.accepted": "Accepted",
  "journal.tier.trusted": "Trusted",
  "journal.tier.ally": "Ally",
  "journal.tier.hostile": "Hostile",
  "achievements.kicker": "TROPHIES",
  "achievements.title": "Achievements",
  "achievements.progress": "{n} / {total} unlocked",
  "achievements.filterAll": "All",
  "achievements.filterUnlocked": "Unlocked",
  "achievements.filterLocked": "Locked",
  "achievements.empty": "Nothing in this filter.",
  "quests.kicker": "OBJECTIVES",
  "quests.title": "Quests",
  "quests.progress": "{n} / {total} complete",
  "quests.filterActive": "Active",
  "quests.filterDone": "Done",
  "quests.filterAll": "All",
  "quests.empty": "Nothing in this filter.",
  "quests.track": "Track",
  "quests.tracking": "Tracking",
  "quests.metaProgress": "{n}/{total} · {chain}",
  "quests.metaDone": "Complete · {chain}",
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
  "hud.farmPlant": "Посадити",
  "hud.farmWater": "Полити",
  "hud.farmFertilize": "Удобрити",
  "hud.farmHarvest": "Зібрати",
  "hud.farmGrow": "Росте",
  "hud.baseUtility": "Енергія та вода бази",
  "hud.basePower": "PWR",
  "hud.baseWater": "H2O",
  "hud.utilityFuel": "Заправити",
  "hud.utilityOn": "Увімкнути",
  "hud.utilityOff": "Вимкнути",
  "hud.doorOpen": "Відчинити",
  "hud.doorClose": "Зачинити",
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
  "craft.subtitle": "Верстак",
  "craft.craft": "КРАФТ",
  "craft.empty": "Немає рецептів",
  "craft.needMaterials": "Бракує матеріалів",
  "craft.needBench": "Потрібен: {bench}",
  "craft.needBlueprint": "Потрібен: {name}",
  "craft.blueprint": "Креслення",
  "craft.crafted": "Скрафтено: {name}",
  "craft.close": "Закрити",
  "craft.search": "Пошук…",
  "craft.select": "Оберіть креслення",
  "craft.selectHint": "Торкніться предмета, щоб побачити матеріали та змайструвати його.",
  "craft.required": "Потрібно",
  "craft.creates": "Створює ×{n}",
  "craft.working": "Крафт…",
  "craft.readyOnly": "Лише готові",
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
  "vehicle.kicker": "ЗБІРКА",
  "vehicle.title": "Гараж",
  "vehicle.bike": "Велосипед",
  "vehicle.atv": "Квадроцикл",
  "vehicle.refuel": "Заправити",
  "vehicle.setActive": "Зробити активним",
  "vehicle.progress": "Деталі {pct}%",
  "vehicle.fuel": "Паливо {value}",
  "vehicle.condition": "Стан {pct}%",
  "vehicle.activeNow": "Активний транспорт",
  "vehicle.ready": "Готовий — оберіть активним",
  "vehicle.incomplete": "Встановіть решту деталей",
  "vehicle.hintReady": "Заправка Fuel Can. Карта → ТРАНСПОРТ витрачає паливо.",
  "vehicle.hintParts": "Ставте деталі з інвентаря на монтажному столі.",
  "vehicle.needFuelCan": "Потрібна каністра палива",
  "vehicle.partInstalled": "OK",
  "vehicle.partInstall": "Поставити",
  "vehicle.partNeed": "Треба {name}",
  "vehicle.part.frame": "Рама",
  "vehicle.part.wheels": "Колеса",
  "vehicle.part.engine": "Двигун",
  "vehicle.part.fuelTank": "Бак",
  "vehicle.part.mechanics": "Механіка",
  "vehicle.part.electronics": "Електроніка",
  "vehicle.part.suspension": "Підвіска",
  "contract.kicker": "ФРАКЦІЇ",
  "contract.title": "Польова дошка",
  "contract.board": "Доступні",
  "contract.active": "В роботі",
  "contract.hint": "Візьми завдання. Виконай у світі, потім забери нагороду тут.",
  "contract.emptyBoard": "Сьогодні порожньо — чекай новий світовий день.",
  "contract.emptyActive": "Немає активних контрактів.",
  "contract.accept": "Взяти",
  "contract.claim": "Забрати",
  "contract.claimed": "Отримано",
  "contract.ready": "Готово до видачі",
  "contract.inProgress": "В роботі",
  "contract.working": "Виконується…",
  "npc.kicker": "ТАБІР",
  "npc.tabTalk": "Розмова",
  "npc.tabTrade": "Обмін",
  "npc.noTalk": "Зараз немає що сказати.",
  "npc.noTrade": "Сьогодні немає пропозицій.",
  "npc.trade": "Обміняти",
  "npc.tokens": "Токени обміну: {n}",
  "map.enter": "УВІЙТИ",
  "map.close": "Закрити",
  "map.locked": "Зачинено",
  "map.event": "Подія",
  "map.raid": "Рейд",
  "map.intelEmpty": "Немає сигналів",
  "map.hint": "Оберіть локацію, потім подорожуйте.",
  "map.localTitle": "Місцева карта",
  "map.localHint": "Ви тут. M або мінікарта — закрити.",
  "map.threat": "Загроза {n}",
  "map.region": "Регіон",
  "build.title": "Будівництво",
  "build.place": "ПОСТАВИТИ",
  "build.remove": "ПРИБРАТИ",
  "build.repair": "РЕМОНТ",
  "build.close": "Закрити",
  "build.hint": "Дивіться на клітинку · Поставте, відремонтуйте або приберіть",
  "build.hintRemove": "Наведіть на деталь і натисніть дію, щоб знести (меблі → стіна → підлога).",
  "build.hintRepair": "Наведіть на пошкоджене. Часткові матеріали — повне відновлення HP.",
  "build.furniture": "Меблі",
  "build.structures": "Конструкції",
  "char.title": "Персонаж",
  "char.name": "Ім’я",
  "char.gender": "Стать",
  "char.save": "Зберегти",
  "char.cancel": "Скасувати",
  "notify.died": "Ви загинули — спорядження в сумці на цій локації",
  "notify.respawned": "Відродження вдома",
  "notify.deathBagHere": "Сумка зі спорядженням досі в {location}",
  "notify.lootDeathBag": "Спорядження з сумки зібрано",
  "notify.lootDeathBagPartial": "Сумка частково спорожнена — інвентар повний",
  "notify.stationStarted": "Процес на станції запущено",
  "notify.stationDone": "Станція готова: {name}",
  "notify.stationMailbox": "Інвентар повний — {name} у скриньку",
  "notify.stationNeedBuild": "Спочатку збудуйте піч",
  "notify.stationNeedMetalwork": "Спочатку збудуйте верстат для металу",
  "notify.stationNeedChemistry": "Спочатку збудуйте хімічну станцію",
  "notify.stationNeedWater": "Спочатку збудуйте водозбірник",
  "notify.stationNeedComposter": "Спочатку збудуйте компостер",
  "notify.stationNeedRecycler": "Спочатку збудуйте переробник",
  "notify.farmPlanted": "Посаджено: {name}",
  "notify.farmWatered": "Грядку полито",
  "notify.farmFertilized": "Грядку удобрено",
  "notify.farmHarvest": "Урожай зібрано",
  "notify.farmNeedSeed": "Потрібне насіння",
  "notify.farmNeedWater": "Потрібна вода (пляшка / чиста / дощова) або бак бази",
  "notify.farmGrowing": "Росте ({pct}%)",
  "notify.genNeedFuel": "Потрібне деревне вугілля для генератора",
  "notify.genFueled": "Генератор заправлено",
  "notify.genOn": "Генератор увімкнено",
  "notify.genOff": "Генератор вимкнено",
  "notify.lampOn": "Ліхтар увімкнено",
  "notify.lampOff": "Ліхтар вимкнено",
  "notify.lampNoPower": "Ліхтар увімкнено, але на мережі немає живлення",
  "notify.radioOn": "Радіо настроєно",
  "notify.radioOff": "Радіо мовчить",
  "notify.radioNoPower": "Радіо увімкнено, але на мережі немає живлення",
  "notify.radioScan": "Сканую ефір…",
  "notify.radioScanClear": "На хвилі тиша",
  "notify.radioEvent": "Сигнал: {title} (загроза {danger})",
  "notify.radioEventAt": "Сигнал: {title} @ {where} (загроза {danger})",
  "notify.radioRaid": "Відлуння комплексу: {title} (T{threat})",
  "notify.doorOpened": "Двері відчинено",
  "notify.doorClosed": "Двері зачинено",
  "notify.lockOpened": "Відімкнено",
  "notify.lockPowered": "Автомат увімкнено — клітка під напругою",
  "notify.lockNeedKey": "Треба: {name}",
  "notify.lockNeedPower": "Немає живлення — знайди автомат",
  "notify.lockBlocked": "Ще замкнено",
  "notify.foodSpoiled": "Частина їжі зіпсувалась",
  "notify.zoneTimeHalf": "Половина часу зони минула",
  "notify.zoneTimeMinute": "1 хвилина залишилась у цій зоні",
  "notify.zoneTimeUp": "Час вийшов — вихід із зони",
  "notify.threatDetected": "Вас помітили",
  "notify.needWorkbench": "Крафт лише біля верстака",
  "hud.zoneTimer": "ЗОНА",
  "hud.quest": "КВЕСТ",
  "hud.questDone": "ГОТОВО",
  "hud.day": "ДЕНЬ",
  "hud.night": "НІЧ",
  "hud.cold": "ХОЛОД",
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
  "notify.structureRepaired": "Конструкцію відремонтовано",
  "notify.nothingToRepair": "Тут немає пошкоджень",
  "notify.alreadyRepaired": "Уже в повному порядку",
  "notify.repairNeedMats": "Бракує матеріалів для ремонту",
  "notify.structureDamaged": "Конструкцію бази пошкоджено",
  "notify.structureDestroyed": "Конструкція зруйнувалась",
  "notify.nothingToRemove": "Нічого прибирати",
  "notify.noVehicle": "Немає зібраного транспорту",
  "notify.noFuel": "Мало пального",
  "notify.vehicleAssembled": "Транспорт зібрано — режим подорожі відкрито",
  "notify.contractAccepted": "Контракт прийнято",
  "notify.contractClaimed": "Нагороду отримано: {title} (+{xp} XP)",
  "notify.contractNotReady": "Контракт ще не готовий",
  "notify.npcQuest": "Квест у трекері: {title}",
  "notify.npcTradeOk": "Обмін: {name}",
  "notify.npcTradeFail": "Не вийшло обміняти ({reason})",
  "notify.campHub": "Табір вцілілих — поговори з Jon або Mira (E)",
  "notify.courierGranted": "Отримано запечатану посилку",
  "notify.courierDelivered": "Посилку доставлено Miri",
  "notify.courierAlready": "Посилка вже в інвентарі",
  "notify.courierNoPackage": "Немає посилки для доставки",
  "notify.defenseStart": "Тривога оборони: {title}",
  "notify.defenseCleared": "Наліт відбито — {title}",
  "notify.cantEnter": "Не можна увійти",
  "notify.noAmmo": "Немає набоїв",
  "notify.noSkillPoints": "Немає очків навичок",
  "notify.questComplete": "Квест виконано (+{xp} XP)",
  "notify.achievement": "Досягнення: {title}",
  "notify.blueprintLearned": "Вивчено: {name}",
  "notify.blueprintKnown": "Уже відомо: {name}",
  "notify.progression": "Прогрес: {title}",
  "notify.dungeonReset": "Скидання данжу: {names}",
  "notify.dungeonResetHere": "Данж оновився — вороги й замкнені схованки знову на місці",
  "notify.journal": "Журнал: {title}",
  "notify.raidNearby": "Рейд поблизу: {title}",
  "notify.raidObjective": "Зачистити комплекс: {title}",
  "notify.raidCleared": "Комплекс зачищено: {title}",
  "notify.worldEvent": "Світова подія: {title}",
  "notify.worldEventAt": "Подія тут: {title} ({where})",
  "notify.claimedEvent": "Подію завершено: {title}",
  "notify.caravanOpen": "Караван відкрито: {title} — торгуй, поки не пішли.",
  "notify.caravanGone": "Караван уже рушив далі.",
  "notify.nightfall": "Настає ніч — заражені чують далі.",
  "notify.warmedUp": "Тобі знову тепло.",
  "notify.contractReady": "Контракт: {title}",
  "notify.cannotLoot": "Не можна залутати",
  "notify.skillVitality": "Навичка: Живучість +1",
  "notify.bossStirs": "{name} пробуджується…",
  "notify.bossDown": "Боса вбито: {name}",
  "notify.crafted": "Скрафтено: {name}",
  "notify.bleeding": "Ви кровоточите!",
  "notify.slowed": "Рух сповільнено",
  "notify.woundTreated": "Кровотечу зупинено",
  "notify.regenerating": "Регенерація…",
  "notify.infection": "Інфекція від укусу!",
  "notify.infectionCleared": "Інфекцію знято",
  "status.bleeding": "Кровотеча",
  "status.slow": "Повільність",
  "status.regeneration": "Реген",
  "status.infection": "Інфекція",
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
  "skill.desc.max-hp": "+10 макс. HP за рівень",
  "skill.desc.move-speed": "+3% швидкості за рівень",
  "skill.desc.harvest-speed": "+6% швидкості збору за рівень",
  "skill.desc.melee-damage": "+4% melee-урону за рівень",
  "skill.desc.energy-regen": "+10% регену енергії за рівень",
  "skills.kicker": "ПРОГРЕС",
  "skills.title": "Навички",
  "skills.points": "Очки навичок: {n}",
  "skills.buy": "Взяти",
  "skills.maxed": "Макс",
  "notify.skillBought": "Навичка: {name} +1",
  "journal.kicker": "КОДЕКС",
  "journal.title": "Польовий журнал",
  "journal.hint": "Нотатки з дороги, репутація фракцій і відкриття.",
  "journal.tabNotes": "Нотатки",
  "journal.tabFactions": "Фракції",
  "journal.tabDiscoveries": "Відкриття",
  "journal.emptyNotes": "Поки порожньо — подорожуй і слухай.",
  "journal.countLocations": "Локації",
  "journal.countItems": "Предмети",
  "journal.countEnemies": "Вороги",
  "journal.countNotes": "Нотатки",
  "journal.tier.unknown": "Невідомо",
  "journal.tier.accepted": "Прийнятий",
  "journal.tier.trusted": "Довіра",
  "journal.tier.ally": "Союзник",
  "journal.tier.hostile": "Ворог",
  "achievements.kicker": "ТРОФЕЇ",
  "achievements.title": "Досягнення",
  "achievements.progress": "{n} / {total} відкрито",
  "achievements.filterAll": "Усі",
  "achievements.filterUnlocked": "Відкриті",
  "achievements.filterLocked": "Закриті",
  "achievements.empty": "У цьому фільтрі порожньо.",
  "quests.kicker": "ЦІЛІ",
  "quests.title": "Квести",
  "quests.progress": "{n} / {total} виконано",
  "quests.filterActive": "Активні",
  "quests.filterDone": "Готові",
  "quests.filterAll": "Усі",
  "quests.empty": "У цьому фільтрі порожньо.",
  "quests.track": "Відстежувати",
  "quests.tracking": "В треку",
  "quests.metaProgress": "{n}/{total} · {chain}",
  "quests.metaDone": "Виконано · {chain}",
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
