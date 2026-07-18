# Prompt 71 — Phase 3.5: Team Builder on the Arena + DOM Renderer Retirement

**Branch**: `feature/phase3-builder` (create from `main`)
**Read first**: `CLAUDE.md`, `MASTERPLAN.md` § Phase 3, `js/ui-builder.js`, `js/render-pixi.js`
(projection + token drawing — reuse, don't duplicate), `js/grid.js`, `js/teams.js`.

## Goal

Team building happens ON the same angled hex arena the fight happens on — the TFT deploy
experience. Then the DOM renderer retires, completing Phase 3.

## Task 1 — Builder arena (ui-builder.js + render-pixi.js builder mode)

- Replace the team builder's flat DOM grid with the Pixi arena in a "builder mode":
  same projection, tiles, backdrop (region of the currently selected stage if entered from stage
  select, else neutral), player rows 4-7 interactive, enemy rows 0-3 shown dimmed.
- Refactor render-pixi.js so token creation/drawing is reusable outside combat (a unit-token
  factory taking a unit-like object) — builder tokens show name/stars/items chip, no hp/mana bars.
- Interactions (mouse + touch-friendly click model, no HTML5 drag API):
  - click bench unit → eligible hexes highlight → click hex to place
  - click placed token → pick up (highlight), click another hex to move, click bench to unbench,
    click another placed token to swap
  - hover token → existing unit tooltip; equipped-item interactions from
    `patchTeamCellClickForItems` keep working (adapt its entry points)
- Bench: DOM strip below the arena (existing roster-chip visual language), scrollable.
- Synergy preview sidebar: unchanged data, restyled placement consistent with combat drawers.
- Enemy preview per War Room intel level renders as dimmed tokens on enemy rows (existing
  `renderTeamBuilderScreen` intel logic, relocated).
- One-family-one-slot, team-size caps, lock warnings: all existing validation intact (it lives in
  teams.js — do not fork it).

## Task 2 — Wave repositioning on the arena

Between waves, repositioning currently uses a separate DOM grid (`renderWaveRepositionGrid`).
Replace with the same builder-mode arena interaction (player rows only, current wave's survivors),
inside the existing wave-transition overlay flow. Same click model as Task 1.

## Task 3 — DOM renderer retirement

- Delete `js/render-dom.js` and the `?renderer=dom` path. `RENDERERS = {pixi}`.
- If WebGL init fails: show a clear DOM message ("This game requires WebGL") instead of combat —
  no silent fallback to a deleted renderer.
- Purge dead DOM-board CSS from game-v2.html and dead code from ui-combat.js (report what was
  deleted). Keep `#damage-numbers`/overlay chrome that Pixi-mode still uses.
- Update `tests/test-renderer-boundary.js`: dom-renderer cases removed/replaced (registry has only
  pixi; explicit `?renderer=dom` falls back to pixi with a warn; WebGL-absent shows the notice).

## Tests

Suite green twice; goldens byte-identical (builder/reposition are pre-combat, renderer deletion is
visual-only). Add `tests/test-builder-state.js`: placement/move/swap/unbench through the SAME
teams.js mutation functions the UI calls (addToTeam/moveOnTeam/removeFromTeam), team-size cap and
one-family-one-slot enforced, reposition mutations preserved across waves headlessly.

## Verification

Browser (port 8124): full loop — hub → team builder (place/move/swap/unbench units on the hex
arena, tooltip + item equip work, synergy sidebar updates live) → deploy → fight → between-wave
reposition on the arena → results. A stage entered from region select shows that region's backdrop
in the builder. `?renderer=dom` warns and runs pixi. Report FPS in builder mode.

Report: interaction model implemented, render-pixi refactor shape (what became reusable), deleted
inventory (files/functions/CSS), test results.

Commit as "Prompt 71: team builder on arena, reposition on arena, DOM renderer retired". Push.
Do not merge.
