# Prompt 69 — Phase 3.3: Hex Grid Migration

**Branch**: `feature/phase3-hex` (create from `main`)
**Read first**: `CLAUDE.md`, `MASTERPLAN.md` § Phase 3 (hex is a LOCKED decision; the one intended
behavior change in Phase 3), `js/combat-core.js` (grid/movement/targeting), `js/render-pixi.js`,
`js/render-dom.js`, `tests/balance-sim.js`.

## Goal

Combat plays on a pointy-top hex grid (TFT's signature), 8 rows × 7 cols in **odd-r offset layout**
(odd rows shifted +half-cell in x). Rows 0-3 enemy, 4-7 player, exactly as today. This is the ONE
deliberate behavior change of Phase 3 — goldens get re-based, balance gets re-verified.

## Task 1 — Grid math module (`js/grid.js`, NEW — loads before combat files)

Single source of truth for ALL spatial math:
- `hexNeighbors(row, col)` (6 neighbors, odd-r offset rules, board-bounds filtered)
- `hexDistance(r1,c1,r2,c2)` (via axial/cube conversion)
- `cellsInRange(row,col,n)`, `ring(row,col,n)`
- `hexLine(r1,c1,r2,c2)` (for line abilities), `adjacentCells` (= neighbors)
- `findPathBFS(from, to, blockedFn)` (replaces the current square BFS)
- `bossCells(anchorRow, anchorCol)` — the 4 cells a 2×2 boss occupies on offset-hex (define once,
  use everywhere: anchor + E neighbor + the two cells below them per offset parity)
- `cellToPixel(row, col, cellW, cellH)` — shared by renderers (odd-r x-offset, packed y-spacing
  factor 0.75 for pointy-top)

## Task 2 — Migrate combat logic

- Audit `combat-*.js`, `js/endless.js`, `js/challenges.js` for raw row/col arithmetic: Manhattan
  distance, `col±1`/`row±1` adjacency, 4/8-neighborhoods, straight-line assumptions. Route ALL of
  it through grid.js. Report a table of every migrated site (file:line → helper used).
- Attack ranges: range N = hex distance ≤ N. Melee = adjacent (6 neighbors — melee gets slightly
  stronger; that's expected and handled in balance re-verify).
- AoE shapes: radius → `cellsInRange`; row/line abilities → `hexLine` through target (same length
  as before); "adjacent allies/enemies" → 6-neighborhood. Keep each ability's CELL COUNT roughly
  equal to its square version where a judgment call arises (report judgment calls).
- Movement/pathfinding: BFS on hex neighbors; move speeds/cooldowns unchanged.
- Assassin dash, teleports, split-formation gap column, reinforcement spawn cells, telegraph cell
  sets: re-express via grid.js (split formation uses col 3 as the gap — keep column semantics).
- Team builder/deployment mapping (row `7-r`) unchanged — slots remain row/col.

## Task 3 — Renderers

- **Pixi**: draw pointy-top hex tiles via `cellToPixel` + hex polygon; units/bars/floats/flashes
  positioned by the same helper. Boss occupies its 4 `bossCells` visually (one big token spanning).
- **DOM**: minimum viable — apply per-row x-offset (half cell on odd rows) to the existing rect
  cells so positions match logic; no need for hex-shaped CSS. DOM is deleted after 3.4/3.5 anyway.
- Team builder UI (ui-builder.js): same per-row offset so deploy positions match combat visually.

## Task 4 — Re-base and re-verify

1. Suite green with goldens REGENERATED deliberately (all 3 + boss-minion test if outcome-sensitive).
   Document old→new tick/survivor deltas in the report.
2. `node tests/balance-sim.js` full run. Fix regressions ONLY via stage budgets / TUNABLE constants
   (Prompt 65/66 rules; unit/item/ability/boss stats off-limits — EXCEPT: if melee-range changes
   systematically break a band of stages, you may adjust `ENEMY_STAR_BANDS_BY_REGION` /
   budgets; document every change). Targets: 0 non-boss walls, all bosses beatable-and-close,
   freewins past R2 ≤ 3.
3. New `tests/test-grid.js`: neighbor counts (interior 6, corners 2-3), distance symmetry +
   triangle inequality spot-checks, BFS path length vs hexDistance on open board, ring/range cell
   counts, bossCells parity cases, cellToPixel offset spot-checks.

## Verification

`node tests/run.js` green twice. Browser (port 8124): `?renderer=pixi` shows a true hex board with
units fighting on it; `?renderer=dom` positions match (offset rows); team builder placement maps
correctly to combat positions; a boss fight renders on its 4 cells; an endless floor and one
encounter mechanic (reinforcement spawns land on sensible hex cells) still work.

Report: migrated-sites table, judgment calls on AoE shapes, golden deltas, balance-sim before/after
and changes made, grid test coverage.

Commit as "Prompt 69: hex grid migration — logic, renderers, rebase, rebalance". Push. Do not merge.
