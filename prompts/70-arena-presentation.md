# Prompt 70 — Phase 3.4: Arena Presentation

**Branch**: `feature/phase3-arena` (create from `main`)
**Read first**: `CLAUDE.md`, `MASTERPLAN.md` § Phase 3, `js/render-pixi.js`, `js/grid.js`
(`cellToPixel`), `js/ui-combat.js` (chrome), `game-v2.html` (combat screen CSS),
`GRAPHICS-SESSION-HANDOFF.md` (element palette; region themes in MISSIONS-DESIGN.md region list).

## Goal

The combat screen stops looking like a dev tool and starts looking like a TFT arena. Pixi becomes
the default renderer. This is presentation only — zero logic changes; goldens byte-identical.

## Task 1 — Canvas-first combat layout (game-v2.html CSS + ui-combat.js chrome)

The board container is currently a fixed ~120px-wide column — the single biggest visual failure.
Redesign `#screen-combat`:
- The arena canvas is the hero: fills the available center, min ~60% viewport width on desktop,
  maintains the board's aspect, letterboxed by the backdrop (Task 3), responsive down to ~800px.
- Chrome docks around it: scoreboard/synergy sidebars become collapsible slim panels (or overlay
  drawers) flanking the arena; combat log becomes a compact overlay strip (last 3 entries,
  fading) with a click-to-expand full log; wave banner + speed control float over the top corners.
- Reposition/wave-transition/results overlays center over the arena.
- The DOM renderer (`?renderer=dom`) must still work in the new layout (it positions by % — verify).

## Task 2 — Angled TFT-style camera (render-pixi.js)

- Perspective illusion, 2D-cheap: vertical squash of the board plane (y × ~0.72, `// TUNABLE`) +
  subtle depth scale (far rows ~0.92, near rows ~1.06, linear by row, `// TUNABLE`) so the board
  reads as a ground plane seen from a raised camera. Implement inside a `boardToScreen(row, col)`
  wrapper around `cellToPixel` used by tiles, tokens, bars, floats, flashes — one projection,
  everything consistent.
- Unit tokens stay upright (billboard), scaled by their row's depth factor.
- Hex tiles get a fake 3D lip: darker bottom-edge polygon under each tile (elevation illusion).
- Floating text and cell flashes must project through the same transform (no drift).

## Task 3 — Arena backdrop per region

- Procedural placeholder art (no image assets yet — Phase 5 replaces): layered gradient scene
  behind the board — horizon glow in the region's dominant element color, large soft vignette,
  faint oversized hex pattern, 2-3 parallax blob "landmasses" in darker tones. One function
  `buildArenaBackdrop(regionNum)` keyed by region (grind/endless/challenges: neutral void theme;
  region themes per MISSIONS-DESIGN.md region elements).
- A platform "frame" under the board: slightly larger hex-outline platform silhouette beneath the
  tile group, so the board sits ON something rather than floating.

## Task 4 — Life on the board (render-pixi.js)

- Idle animation: gentle bob/breath (scale y ±2%, offset by a per-unit phase from a LOCAL cosmetic
  PRNG — never the seeded logic stream).
- Wave start: units drop/fade in with a small stagger; "FIGHT" banner keeps working over it.
- Hover inspection: Pixi pointer hit on a token → DOM tooltip (reuse/adapt the team-builder unit
  tooltip content: name, stars, hp/mana, atk, items, statuses). Works with the projection.
- Selection ring on hover (element-colored).

## Task 5 — Default flip

- `getActiveRenderer()` default becomes `pixi` (with `?renderer=dom` as explicit fallback).
  Keep the DOM renderer functional — deletion happens in 3.5.
- If WebGL init fails (old machine), auto-fall back to DOM with a console warn.

## Tests

- Suite green twice, goldens byte-identical (pure presentation — the Prompt 67/68 PRNG rule applies).
- test-renderer-boundary additions: default resolution is pixi (stub PIXI present), dom via param,
  auto-fallback when PIXI absent.

## Verification

Browser (port 8124): desktop viewport — arena fills the screen, angled board with depth scaling,
region backdrop visibly different between an R1 stage and an R6 stage and endless (neutral),
hover tooltip works mid-fight, idle bob visible, wave drop-in plays, boss fight + encounter HUD +
results all correctly positioned in the new layout, `?renderer=dom` still functional. Report FPS.

Report: layout structure (before/after DOM tree sketch), projection constants chosen, backdrop
recipe per region, FPS, screenshots not required (orchestrator verifies visually).

Commit as "Prompt 70: arena presentation — canvas-first layout, angled camera, backdrops". Push.
Do not merge.
