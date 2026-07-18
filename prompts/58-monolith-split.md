# Prompt 58 — Phase 0.2/0.3: Monolith Split + V1 Prune

**Branch**: `feature/phase0-split` (create from `main`)
**Read first**: `CLAUDE.md` (conventions), `MASTERPLAN.md` § Phase 0.

## Goal

Split the two monolith files into system-sized files (target: no file over ~80KB) with ZERO logic
changes, and delete dead V1 code. The game must behave identically afterward.

## Task 1 — Split `js/main-v2.js` (306KB)

Read the file top-to-bottom first and map its section structure (it has section comments). Split into
files along system boundaries. Suggested targets (adapt to the actual section boundaries you find —
aim for coherent systems, not equal sizes):

- `js/combat-core.js` — grid, movement/BFS, targeting, tick loop, damage pipeline
- `js/combat-abilities.js` — ability execution, mana, casting
- `js/combat-passives.js` — passive triggers/processing
- `js/combat-status.js` — status effect framework
- `js/combat-boss.js` — boss framework, phases, telegraphs, minions
- `js/combat-render-dom.js` — DOM rendering of combat (unit layer, damage numbers, animations)
- `js/main-v2.js` — KEEP as the final entry file: only bootstrap/init/screen-wiring that must run last

## Task 2 — Split `js/ui-v2.js` (233KB)

Same approach. Suggested targets:

- `js/ui-hub.js` — hub/camp screen, buildings, upgrade panels
- `js/ui-gacha.js` — summon screen
- `js/ui-roster.js` — collection, unit detail
- `js/ui-builder.js` — team builder
- `js/ui-missions.js` — region map, stage select
- `js/ui-combat.js` — combat screen UI (scoreboard, synergy bars, wave transitions, results)
- `js/ui-items.js` — item bench, forge, gems
- `js/ui-heroes.js` — hero screens
- `js/ui-shared.js` — shared helpers (tooltips, toasts, formatting) — load this FIRST of the ui files

## Task 3 — Update `game-v2.html` script load order

Data → systems → ui → entry. Preserve the existing relative order of untouched files. All new files
added; `?v=` cache-busters not needed on new files. Functions may call across files at runtime (fine),
but any top-level statement that RUNS at parse time must still see its dependencies defined —
verify by loading the page.

## Task 4 — Delete dead V1 files

`game.html` references `js/units.js` which no longer exists — V1 is already broken. Delete:
`game.html`, `js/combat.js`, `js/enemies.js`, `js/economy.js`, `js/shop.js`, `js/board.js`,
`js/synergies.js`, `js/ui.js`, `js/main.js`. Git history preserves them.
Do NOT delete `js/ability-templates.js` (orphaned, but under separate audit).
Add `graphics/` to `.gitignore`.

## Hard Rules

- Pure code motion: cut/paste only. No renames, no refactors, no "while I'm here" fixes, no comment
  cleanup. `git diff` should show only file moves + the html/script changes.
- If you find something broken or ugly, note it in your report — do not fix it.

## Verification (all required)

1. Open `game-v2.html` in a browser — zero console errors.
2. Reset save (button on hub), roll gacha x10, confirm units appear in collection.
3. Add 2+ units in team builder, deploy to the first story stage, click Start Combat,
   confirm combat runs to a result (win or lose both fine) with no console errors.
4. Open `simulator.html` and `benchmark.html` — both still load without console errors.
5. Report: final file list with sizes, load order, verification results, anything surprising.

Commit as "Prompt 58: split main-v2/ui-v2 monoliths, prune V1". Push the branch
(PAT in `keys/github.txt` per CONTINUITY.md § Git Auth). Do not merge.
