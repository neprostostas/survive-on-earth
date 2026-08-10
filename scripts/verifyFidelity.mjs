import assert from "node:assert/strict";
import { HUD_LAYOUT, validateHudLayout } from "../src/config/hudLayoutConfig.ts";

assert.deepEqual(validateHudLayout(), [], "HUD anchors and sizes must stay inside supported normalized ranges");
assert.ok(HUD_LAYOUT.joystick.sizeH > HUD_LAYOUT.auto.sizeH, "joystick must remain dominant over AUTO");
assert.ok(HUD_LAYOUT.attack.sizeH > HUD_LAYOUT.interact.sizeH, "attack shell must retain the LDOE weapon hierarchy");
assert.ok(HUD_LAYOUT.interact.sizeH > HUD_LAYOUT.sneak.sizeH, "hand must be larger than sneak");
assert.ok(HUD_LAYOUT.attack.sizeH > HUD_LAYOUT.build.sizeH, "weapon must be larger than secondary/build");
assert.ok(HUD_LAYOUT.minimap.centerX > 0.75 && HUD_LAYOUT.minimap.centerY < 0.3, "minimap must remain in the top-right region");
assert.ok(HUD_LAYOUT.levelStrip.left > 0.15 && HUD_LAYOUT.levelStrip.right < 0.9, "XP rail must be partial-width (not full bleed)");
assert.ok(HUD_LAYOUT.utilityI.centerX > HUD_LAYOUT.utilityB.centerX, "backpack sits right of blueprints on utility rail");
assert.ok(HUD_LAYOUT.attack.centerY < HUD_LAYOUT.interact.centerY, "weapon sits above hand in BR cluster");

console.log("Fidelity configuration verification passed");
