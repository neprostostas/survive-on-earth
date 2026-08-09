import assert from "node:assert/strict";
import { HUD_LAYOUT, validateHudLayout } from "../src/config/hudLayoutConfig.ts";

assert.deepEqual(validateHudLayout(), [], "HUD anchors and sizes must stay inside supported normalized ranges");
assert.ok(HUD_LAYOUT.joystick.sizeH > HUD_LAYOUT.auto.sizeH, "joystick must remain dominant over AUTO");
assert.ok(HUD_LAYOUT.attack.sizeH > HUD_LAYOUT.interact.sizeH, "attack shell must retain the reference hierarchy");
assert.ok(HUD_LAYOUT.minimap.centerX > 0.75 && HUD_LAYOUT.minimap.centerY < 0.3, "minimap must remain in the top-right region");

console.log("Fidelity configuration verification passed");
