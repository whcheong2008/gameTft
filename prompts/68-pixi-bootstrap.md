# Prompt 68 — Phase 3.2: PixiJS Renderer Bootstrap

**Branch**: `feature/phase3-pixi` (create from `main`)
**Read first**: `CLAUDE.md`, `MASTERPLAN.md` § Phase 3, `js/render-interface.js`, `js/render-dom.js`
(the contract + the behavior to reach parity with), `js/combat-events.js`.

## Goal

A WebGL combat renderer (`?renderer=pixi`) with placeholder art, at functional parity with the DOM
renderer. DOM stays the default until Phase 3.4 completes. Square grid (hex comes in 3.3).

## Task 1 — Vendor PixiJS

- Obtain **pixi.js v8** via npm (`npm pack pixi.js@8` in a temp dir, extract
  `dist/pixi.min.js`) — do NOT curl arbitrary URLs. Place at `js/vendor/pixi.min.js` and record
  the exact version in a comment at the top of `js/render-pixi.js` and in your report.
- Load via script tag before `render-interface.js`. The vendored file is committed (repo has no
  build step). Confirm it exposes global `PIXI`.

## Task 2 — Pixi renderer (`js/render-pixi.js`)

Implements the interface: `{init(container, combatState, context), frame(dtMs), destroy()}`,
registered as `RENDERERS.pixi`. Guard registration behind `typeof PIXI !== 'undefined'` so the
headless harness never needs it.

Scope for THIS prompt (placeholder aesthetics, real information):
- PIXI.Application filling the combat board container (destroy cleanly on `destroy()` — no WebGL
  context leaks across waves/missions; reuse one Application if simpler, but prove no leak by
  running 10 waves).
- Board: square grid tiles (subtle fill + line), 8 rows × 7 cols, sized responsively to container.
- Units: placeholder token per unit — rounded-rect base tinted by element color (canonical palette
  in GRAPHICS-SESSION-HANDOFF.md § Element Color Palette), emoji as a Text sprite, tier pips,
  2×2 sizing for bosses.
- **Smooth movement**: units interpolate between grid cells (lerp position toward logical cell at a
  rate matching type move speed × combat speed; snap when close). This alone must make combat look
  dramatically better than the DOM version.
- HP/mana bars per unit (chunking on damage), death fade-out, cast flash on `abilityCast`,
  cell flash rects on `abilityFlash`, floating damage/heal text on `floatingText` (colored, rises
  and fades; crits bigger).
- Status icons: up to 3 mini emoji Text sprites above the unit + overflow count (parity with DOM).
- Encounter banner + HUD, boss phase/enrage indicators: reuse the existing DOM overlay chrome — do
  NOT rebuild in Pixi. Verify they position correctly over the canvas.
- Combat speed: respect COMBAT_SPEED in animation rates (movement lerp + float text).
- z-order: lower rows draw above higher rows (painter's order), floating text topmost.

## Task 3 — Wiring

- `?renderer=pixi` activates it (registry already resolves the param). `?renderer=dom` unchanged.
- The renderer must handle mid-run wave transitions (state re-init) and mission exit (destroy)
  without residue. Reposition screen between waves stays DOM (chrome).

## Task 4 — Tests

- `tests/test-renderer-boundary.js` additions: registry contains 'pixi' when a fake `PIXI` global
  stub is present; render-pixi.js source contains no references into combat internals beyond the
  documented interface + events (source scan: it must not call functions defined in combat-*.js).
- Full suite green; goldens byte-identical (renderers can't affect logic — the persistent-listener
  RNG lesson from Prompt 67 applies: the pixi renderer must NOT call Math.random() in ways that
  consume the seeded logic stream — use a separate local PRNG for cosmetic jitter).

## Verification

Browser (dev server port 8124): run a full mission and a boss stage under `?renderer=pixi` — units
move smoothly, bars chunk, floats rise, no console errors, 60fps-ish (report `app.ticker.FPS`
observations), then switch back to `?renderer=dom` and confirm unchanged. Run 10+ waves checking
for WebGL context/memory growth (report numbers).

Report: pixi version vendored, parity checklist (each DOM feature → pixi status), FPS + leak
observations, screenshots not required (orchestrator will verify visually).

Commit as "Prompt 68: PixiJS renderer bootstrap — placeholder parity". Push. Do not merge.
