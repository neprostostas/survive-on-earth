# MILESTONE F1 — LDOE Fidelity Audit & Alignment Pass

Audit date: 2026-08-09  
Primary target: mobile landscape gameplay composition  
Reference HUD generation: current Kefir help-center interface, updated approximately April 2026  
Reference viewport: 1230 × 580 (2.12:1)  
Status legend: `PLANNED`, `APPLIED`, `KEEP`, `UNVERIFIED`

This document records screen-space estimates, not private engine values. Any LDOE value below is measured from a lawful public screenshot and is labelled as an estimate. Promotional store artwork is used for palette, silhouette, and UI shape language only; its staged camera is not treated as gameplay framing.

## Reference Set

1. [Kefir Help Center — Game interface](https://kefirgames.helpshift.com/hc/en/5-last-day-on-earth/faq/355-game-interface/), current page last updated 117 days before this audit. This is the primary HUD source and explicitly confirms the minimap, build control, quick slot, attack, contextual interaction, sneak, inventory, blueprints, store/mail, season, chat, joystick, AUTO, and events.
2. [Google Play — Last Day on Earth: Survival](https://play.google.com/store/apps/details?id=zombie.survival.craft.z&hl=en-US), updated 2026-08-01. Its eight current screenshots are used for current palette, material readability, character silhouette, circular action-button language, and environment density. Their cinematic framing and marketing captions are excluded from camera/HUD anchor measurements.
3. [Kefir Help Center — Survivor's Path guidance](https://kefirgames.helpshift.com/hc/en/5-last-day-on-earth/faq/742-i-don-t-understand-where-to-go-where-to-get-resources-for-the-survivor-s-path-mission/), current support text confirming the persistent top-right radar/minimap as a navigation surface.
4. Fresh 2026 third-party gameplay video is retained only as a secondary conflict check. Exact camera values remain estimates until a user-supplied local screenshot is aligned in F3.

Old screenshots that show earlier chat, currencies, or action clusters are not used as the primary HUD truth. Where the official help screenshot and Google Play promotional composition differ, the help screenshot wins for gameplay HUD.

## Initial Audit Table

| Area | Current | LDOE reference | Difference | Severity | Action | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Projection | Orthographic | Gameplay image is visually near-orthographic; exact projection unavailable | No evidence strong enough to change architecture | CRITICAL | Keep orthographic; compare in F3 | KEEP |
| Camera yaw | 45° | Estimated diagonal/isometric alignment near current | No verified mismatch | HIGH | Expose overlay comparison; do not invent value | UNVERIFIED |
| Camera pitch | 56° | High oblique top-down view; exact value unavailable | Requires aligned screenshot | HIGH | Keep until F3 manual alignment | UNVERIFIED |
| Ortho height | 17.5 | Official gameplay figure occupies roughly 20–21% viewport height including depth projection | Old projected character was substantially smaller (roughly 7–9%) | CRITICAL | Set 7.6 baseline; validate in F3 | APPLIED |
| Player screen position | Camera targeted player + Y only | Reference player is approximately centered horizontally and ~3% above viewport center | Old framing was dead-center | HIGH | Add X/Z target offset of 0.2 | APPLIED |
| Pixel stability | Render camera snapped to screen pixel grid | Clean static mobile presentation | Current stability fix is required | CRITICAL | Preserve for every ortho value | KEEP |
| Shadow projection | Stable first-frame bounds | Stable shadows | Matches presentation need | CRITICAL | Never re-enable per-frame auto extents | KEEP |
| Player silhouette | Chunky procedural capsules, large head/backpack | More realistic stylization, narrower limbs and torso | Old silhouette was more toy-like | HIGH | Narrow torso/limbs/shoulders/head/backpack without collision change | APPLIED |
| Locomotion | Speed 4.5, stride blend tied to speed | Reference has grounded run, limited bounce | Old bounce and stride were exaggerated | MEDIUM | Reduce stride, bounce, and lateral roll; keep movement mechanics | APPLIED |
| Tree/player ratio | Tree height ~2.7× player, canopy width ~1.6× | Current official images show tall trunks and irregular layered canopy | Ratio plausible; spherical clusters were too uniform | HIGH | Use asymmetric stretched overlapping clusters | APPLIED |
| Rock/player ratio | Main visible width ~0.6–0.8× player | Reference rocks are flattened, irregular clusters | Current rocks remain smoother than reference | MEDIUM | Keep soft direction; manual authored irregularity remains | UNVERIFIED |
| Bush/player ratio | ~0.7× player | Low, irregular vegetation groups | Old clusters were too spherical | MEDIUM | Flatten and vary each cluster | APPLIED |
| Wall/player ratio | 2.4 / 1.8 = 1.33 | Official scenes show walls around 1.2–1.4× survivor | Plausible | MEDIUM | Keep pending overlay | KEEP |
| Grid/player ratio | 2.5 / 1.8 = 1.39 | Estimated LDOE build cell around 1.3–1.5× survivor | Plausible | HIGH | Validate projected tile in F3 | UNVERIFIED |
| World composition | Fixed ring-like perimeter positions around a demo house | Designed clearings with clustered resources and negative space | Old layout was uniform and showcase-like | HIGH | Recompose deterministic clusters around a playable clearing | APPLIED |
| Ground palette | Bright green procedural base | Muted olive survival green with low-frequency variation | Old palette was too clean/saturated | HIGH | Mute grass/ground without restoring brown blobs | APPLIED |
| Clutter | 368 max thin instances at old High baseline | Fine grass is present but subordinate to resources | Frequency becomes excessive after closer framing | MEDIUM | Reduce baseline density 0.90 → 0.72 and speckles 2300 → 1500 | APPLIED |
| Lighting | Soft warm sun, bright ambient, stable PCF | Warm directional sun, readable muted shadows | Broad direction matches; current ambient may be flat | MEDIUM | Compare shadow direction/contrast in overlay | UNVERIFIED |
| Post-processing | Clean exposure, no ACES/vignette/bloom | Clean mobile presentation | Good match | MEDIUM | Keep restrained | KEEP |
| Interaction ring | Muted olive torus around target | Official current promo uses bright cyan/green contextual rings; gameplay exact behavior unclear | Old ring was less legible | MEDIUM | Use restrained mint-green thinner ring; keep selector | APPLIED |
| Player status | Avatar + name + HP, fixed px | Compact top-left name/health block; no evidence for our avatar | Avatar and proportions mismatched | HIGH | Responsive compact name/level/health hierarchy | APPLIED |
| Minimap | Missing | Persistent circular minimap explicitly documented | Major missing visual weight/navigation shell | CRITICAL | Add local presentation-only minimap with existing interactables | APPLIED |
| Settings/friends cluster | Missing | Persistent around minimap | Missing top-right hierarchy | MEDIUM | Add disabled original visual shells | APPLIED |
| Joystick | 142px fixed, center depended on viewport px | At 1230×580: center ≈ (14.6%, 68.1%), diameter ≈ 23.4% viewport height | Old center ≈ (8.5%, 81.9%); too low/left | CRITICAL | Normalized anchor and `vh` size; preserve keyboard visualization | APPLIED |
| AUTO | Missing | Center ≈ (9.4%, 86.4%), diameter ≈ 11.6% viewport height | Missing | HIGH | Add disabled visual shell | APPLIED |
| Context action | One generic primary bottom-right | Separate attack, context hand, sneak and quick slot | Incomplete hierarchy | CRITICAL | Keep working context action; add inactive build/quick/attack/sneak shells | APPLIED |
| Bottom utilities | Missing | Persistent strip near y ≈ 87.5% viewport | Missing | HIGH | Add original disabled utility shells, no gameplay | APPLIED |
| Safe areas | Partial `env()` use | Mobile landscape requires all-edge safe areas | Old anchors were fixed px | HIGH | Centralized HUD metrics plus safe-area-aware status and full overlay bounds | APPLIED |
| F3 comparison | Missing | Milestone requirement | Missing development capability | CRITICAL | Upload/overlay/blink/split/alignment/guides/freeze | APPLIED |

## Primary Normalized HUD Measurements

Estimates from the official 1230 × 580 annotated gameplay screenshot:

| Element | centerX | centerY | widthRatio | heightRatio |
| --- | ---: | ---: | ---: | ---: |
| Joystick | 0.146 | 0.681 | 0.111 | 0.234 |
| AUTO | 0.094 | 0.864 | 0.055 | 0.116 |
| Minimap | 0.862 | 0.150 | 0.135 | 0.286 |
| Build shell | 0.902 | 0.398 | 0.051 | 0.109 |
| Quick slot | 0.894 | 0.548 | 0.057 | 0.121 |
| Attack | 0.899 | 0.705 | 0.073 | 0.153 |
| Context interact | 0.888 | 0.845 | 0.059 | 0.124 |
| Sneak | 0.903 | 0.913 | 0.055 | 0.116 |
| Bottom utility baseline | — | 0.875 | — | ~0.09 |
| HP bar | centerX ≈ 0.148 | centerY ≈ 0.065 | width ≈ 0.171 | height ≈ 0.016 |

The source screenshot contains numeric callouts, so button bounds have an estimated ±1–2% viewport uncertainty. These are calibration targets, not claims about source code.

## Critical Differences Found

1. Current world framing is much wider than the official gameplay image and makes the player/environment read as a technical overview.
2. The entire persistent top-right and bottom-center HUD hierarchy is absent.
3. Joystick size is acceptable only near one viewport height, but its anchor is too close to the bottom-left and fixed pixels break cross-aspect consistency.
4. Procedural player and vegetation silhouettes are rounder/more toy-like than the current LDOE presentation.
5. TestLocation composition reads as a symmetric calibration gallery instead of a designed resource clearing.
6. No local comparison tool exists, preventing repeatable evidence-based tuning.

## Changes Applied

### Comparison tooling

- Added `F3 — LDOE Fidelity Mode` as a development-only overlay.
- Local PNG/JPEG/WebP selection uses an object URL and is never persisted or bundled.
- Added Current, Reference, Overlay, Blink, and Split modes.
- Added opacity, split position, scale, X/Y offset, aspect lock, fit width/height/viewport, and reset controls.
- Added center, thirds, safe-area, labelled percentage rulers, and a split divider.
- Freeze Visual Motion stops player simulation/idle, foliage, campfire, smoke, interaction interpolation, and camera follow by supplying a zero presentation delta. Closing F3 always releases freeze.

### Camera and scale

- Calibration storage moved to v5. Untouched v4 framing migrates from `17.5` to `7.6`; custom camera values are preserved.
- The player is offset approximately 2–3% above screen center with X/Z target offsets of `0.2`.
- Orthographic projection, yaw `45°`, pitch `56°`, camera-relative input, and render pixel snapping were preserved.
- Stable directional shadow bounds remain frozen after their first calculation.
- Player torso, head, shoulders, limbs, and backpack were narrowed. Movement speed/collision were not changed; only stride and bounce presentation were reduced.

### World and rendering

- Resource placement now forms deterministic local clusters around a clear spawn corridor rather than a perimeter ring.
- Tree and bush foliage uses more irregular stretched overlap while retaining soft silhouettes.
- Ground moved to a muted olive-green balance; brown patches remain removed.
- Ground speckle frequency changed from 2300 to 1500 at detail 1.0; clutter baseline changed from `0.90` to `0.72`.
- Target feedback is a thinner restrained mint-green ring. Selection, hysteresis, range, and action logic are unchanged.

### HUD

- Added centralized normalized metrics in `hudLayoutConfig.ts` and a lightweight verification script.
- Rebuilt the player/health block without the unsupported avatar assumption.
- Added a live local circular minimap driven only by existing player/interactable data.
- Added disabled presentation shells for social/settings, AUTO, build, quick slot, attack, sneak, and bottom utilities.
- The existing contextual action remains the only active right-side gameplay button.
- Joystick uses the measured normalized anchor and viewport-height scale; pointer control and keyboard visualization are preserved.
- HUD icons are original text/CSS symbols, not LDOE artwork.

## Remaining Differences

- The project still uses procedural primitives rather than authored character, vegetation, rock, and building assets.
- The minimap intentionally omits world-map logic, fog of war, enemies, quests, and pathfinding. Disabled shells have no gameplay behavior.
- Rock silhouette needs an authored irregular soft-edged mesh pass; a blind return to sharp polyhedra would regress the accepted direction.
- Exact camera yaw/pitch and tree occlusion handling require a current user-selected gameplay screenshot in F3.
- The available automation environment has no connected browser surface, so final subjective visual approval across physical devices remains manual. Strict compile, local server/HMR, configuration verification, and interaction verification pass.

## Unverified Items

- Exact camera yaw, pitch, and whether LDOE uses a mathematically orthographic camera or very weak perspective.
- Exact animation cadence and run-speed mapping.
- Context-target ring behavior in ordinary current gameplay (store imagery confirms shape language, not timing).
- Tablet-specific HUD adaptation rules.
- Occlusion fade behavior for the current tree generation.

These items remain unchanged until a matching current gameplay screenshot or video frame is loaded through F3.

## Final Calibration

### Camera

- Projection: orthographic (kept; weak perspective remains unverified).
- Yaw: `45°` (kept pending overlay).
- Pitch: `56°` (kept pending overlay).
- Ortho height: `7.6`.
- Target offset: X `0.2`, Y `0.9`, Z `0.2`.
- At 2.12:1, approximate visible world width/height: `16.1 × 7.6` units.
- Procedural player projected-height target: approximately 19–20% viewport including silhouette depth.
- Pixel snapping: enabled and recomputed from ortho height/render height.

### Player / world

- Player visual height: `1.8`; collision radius remains `0.38`.
- Movement speed remains `4.5`; gameplay acceleration/deceleration/rotation unchanged.
- Tree height/player ratio: approximately `2.7`; canopy width/player ratio approximately `1.5–1.6`.
- Wall height/player ratio: `1.33`.
- Grid cell/player ratio: `1.39`.
- Rock width/player ratio: approximately `0.6–0.8`; exact silhouette remains unverified.
- Interaction range remains `1.55`; selector values are unchanged.

### Lighting / visual

- Directional rotation `132°`, calibrated intensity `1.05`, ambient `0.72`, shadow softness `2`.
- Stable first-frame shadow projection retained.
- Ground detail `1.0`, variation intensity `0.78`, clutter density `0.72`, foliage sway `0.12`, contact shadow `0.32`, post-process `0.16`.

### HUD normalized layout

The final centralized values match the measurement table above. Major anchors are expressed as viewport ratios; element sizes use viewport height to preserve circular mobile-control proportions. Status safe-area fallback uses `env(safe-area-inset-*)`. The configuration verification rejects anchors outside 0–1 and invalid sizes.

### Verification

- `npm run test:fidelity` — pass.
- `npm run test:interaction` — pass.
- `npm run build` — pass under strict TypeScript.
- Vite large Babylon.js chunk warning remains non-blocking.
