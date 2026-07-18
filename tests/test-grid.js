// =============================================================================
// tests/test-grid.js — hex grid math (js/grid.js, Prompt 69: Phase 3.3).
//
// Covers the spec's required cases: neighbor counts (interior 6, corners 2-3),
// distance symmetry + triangle inequality spot checks, BFS path length vs
// hexDistance on an open board, ring/range cell counts, bossCells parity
// cases, and cellToPixel offset spot checks. All pure math — no combat, no
// save data, no RNG (deterministic by construction; seed irrelevant).
// =============================================================================

'use strict';

const assert = require('./assert');
const { createHarness } = require('./harness');

// One shared harness: grid.js is pure math with no game-state dependencies,
// so a single loaded context serves every case.
const h = createHarness({ seed: 1 });
h.loadScripts();
const ctx = h.context;

function cellKey(c) { return c.row + ',' + c.col; }

module.exports = [
    {
        name: 'hexNeighbors: interior cells have exactly 6 neighbors, all on-board and all at hex distance 1',
        fn: function() {
            const interior = [[3, 3], [4, 3], [2, 2], [5, 4], [1, 3], [6, 2]];
            for (const [r, c] of interior) {
                const n = ctx.hexNeighbors(r, c);
                assert.equal(n.length, 6, `(${r},${c}) should have 6 neighbors, got ${n.length}`);
                const seen = new Set();
                for (const nb of n) {
                    assert.ok(nb.row >= 0 && nb.row < 8 && nb.col >= 0 && nb.col < 7, 'neighbor in bounds');
                    assert.equal(ctx.hexDistance(r, c, nb.row, nb.col), 1, 'every neighbor at hex distance 1');
                    assert.ok(!seen.has(cellKey(nb)), 'no duplicate neighbors');
                    seen.add(cellKey(nb));
                }
            }
        }
    },
    {
        name: 'hexNeighbors: corners have 2-3 neighbors, edges 3-5 (odd-r 8x7 board)',
        fn: function() {
            // Corners of the 8x7 board. Row 0 and row 7 are odd/even ends:
            // row 0 (even), row 7 (odd — shifted right).
            const corners = [[0, 0], [0, 6], [7, 0], [7, 6]];
            for (const [r, c] of corners) {
                const n = ctx.hexNeighbors(r, c).length;
                assert.ok(n >= 2 && n <= 3, `corner (${r},${c}) should have 2-3 neighbors, got ${n}`);
            }
            // Non-corner edge cells.
            const edges = [[0, 3], [7, 3], [3, 0], [3, 6], [4, 0], [4, 6]];
            for (const [r, c] of edges) {
                const n = ctx.hexNeighbors(r, c).length;
                assert.ok(n >= 3 && n <= 5, `edge (${r},${c}) should have 3-5 neighbors, got ${n}`);
            }
            // Every cell's neighbor relation must be symmetric.
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 7; c++) {
                    for (const nb of ctx.hexNeighbors(r, c)) {
                        const back = ctx.hexNeighbors(nb.row, nb.col).some(x => x.row === r && x.col === c);
                        assert.ok(back, `neighbor relation must be symmetric: (${r},${c}) <-> (${nb.row},${nb.col})`);
                    }
                }
            }
        }
    },
    {
        name: 'hexDistance: identity, symmetry, and triangle inequality over spot-checked triples',
        fn: function() {
            const cells = [[0, 0], [0, 6], [7, 0], [7, 6], [3, 3], [4, 2], [1, 5], [6, 1], [2, 0], [5, 6]];
            for (const [r, c] of cells) {
                assert.equal(ctx.hexDistance(r, c, r, c), 0, 'distance to self is 0');
            }
            for (const [r1, c1] of cells) {
                for (const [r2, c2] of cells) {
                    const d12 = ctx.hexDistance(r1, c1, r2, c2);
                    assert.equal(d12, ctx.hexDistance(r2, c2, r1, c1), 'distance is symmetric');
                    if (!(r1 === r2 && c1 === c2)) assert.ok(d12 >= 1, 'distinct cells are at distance >= 1');
                    for (const [r3, c3] of cells) {
                        const d13 = ctx.hexDistance(r1, c1, r3, c3);
                        const d32 = ctx.hexDistance(r3, c3, r2, c2);
                        assert.ok(d12 <= d13 + d32, `triangle inequality: d(${r1},${c1}->${r2},${c2})=${d12} > ${d13}+${d32}`);
                    }
                }
            }
            // Known values: E/W neighbors are same-row col+-1 regardless of parity.
            assert.equal(ctx.hexDistance(3, 2, 3, 3), 1, 'same-row adjacent cols are distance 1');
            // Full board corner-to-corner spans: row span 7 dominates.
            assert.equal(ctx.hexDistance(0, 0, 7, 0), 7, 'straight down 7 rows is distance 7 (hex rows zigzag for free)');
        }
    },
    {
        name: 'findPathBFS: path length equals hexDistance on an open board; blocked cells force detours; unreachable returns null',
        fn: function() {
            // Open board: walking successive next-steps from A to B must take
            // exactly hexDistance(A,B) steps.
            const pairs = [[[0, 0], [7, 6]], [[3, 3], [3, 6]], [[7, 0], [0, 3]], [[4, 2], [2, 2]]];
            for (const [[r1, c1], [r2, c2]] of pairs) {
                let cur = { row: r1, col: c1 };
                let steps = 0;
                while (!(cur.row === r2 && cur.col === c2) && steps < 50) {
                    const next = ctx.findPathBFS(cur.row, cur.col, r2, c2, function() { return false; });
                    assert.ok(next, 'open-board path should always progress');
                    assert.equal(ctx.hexDistance(cur.row, cur.col, next.row, next.col), 1, 'BFS steps are single hex steps');
                    cur = next;
                    steps++;
                }
                assert.equal(steps, ctx.hexDistance(r1, c1, r2, c2),
                    `open-board BFS path length should equal hexDistance for (${r1},${c1})->(${r2},${c2})`);
            }

            // Already at destination -> null.
            assert.equal(ctx.findPathBFS(3, 3, 3, 3, function() { return false; }), null, 'same-cell path is null');

            // Destination reachable as final step even if blockedFn marks it
            // (the "can path to an occupied target" combat contract).
            const onlyDest = ctx.findPathBFS(3, 3, 3, 4, function(r, c) { return r === 3 && c === 4; });
            assert.ok(onlyDest && onlyDest.row === 3 && onlyDest.col === 4, 'occupied destination is still reachable as the final step');

            // Fully walled-off destination -> null (block everything except start and dest,
            // with dest not adjacent to start, so no legal intermediate step exists).
            const walled = ctx.findPathBFS(0, 0, 7, 6, function(r, c) { return !(r === 0 && c === 0) && !(r === 7 && c === 6); });
            assert.equal(walled, null, 'unreachable destination returns null');

            // A single blocked cell forces a detour but not failure.
            const detour = ctx.findPathBFS(3, 2, 3, 4, function(r, c) { return r === 3 && c === 3; });
            assert.ok(detour, 'detour around one blocked cell should exist');
            assert.ok(!(detour.row === 3 && detour.col === 3), 'first step never enters the blocked cell');
        }
    },
    {
        name: 'ring/cellsInRange: unclipped interior counts (ring n has 6n cells, range n has 3n(n+1)+1) and board clipping',
        fn: function() {
            // (3,3) has full range-1 room: ring 1 = 6, range 1 = 7.
            assert.equal(ctx.ring(3, 3, 0).length, 1, 'ring 0 is the center cell');
            assert.equal(ctx.ring(3, 3, 1).length, 6, 'unclipped ring 1 has 6 cells');
            assert.equal(ctx.cellsInRange(3, 3, 0).length, 1, 'range 0 is the center cell');
            assert.equal(ctx.cellsInRange(3, 3, 1).length, 7, 'unclipped range 1 has 7 cells (center + 6)');
            // (3,3) on the 8x7 board also fits a full range-2 disc: 3*2*3+1 = 19.
            assert.equal(ctx.cellsInRange(3, 3, 2).length, 19, 'unclipped range 2 has 19 cells');
            assert.equal(ctx.ring(3, 3, 2).length, 12, 'unclipped ring 2 has 12 cells');

            // cellsInRange = union of rings 0..n (same cell sets).
            const byRings = new Set();
            for (let n = 0; n <= 2; n++) for (const c of ctx.ring(3, 3, n)) byRings.add(cellKey(c));
            const byRange = new Set(ctx.cellsInRange(3, 3, 2).map(cellKey));
            assert.equal(byRange.size, byRings.size, 'cellsInRange matches union of rings (count)');
            for (const k of byRange) assert.ok(byRings.has(k), 'cellsInRange matches union of rings (membership)');

            // Corner clipping: (0,0) range 1 keeps only the on-board cells (center + its neighbors).
            assert.equal(ctx.cellsInRange(0, 0, 1).length, 1 + ctx.hexNeighbors(0, 0).length, 'clipped corner range 1 = center + on-board neighbors');

            // Every range-n cell is actually within hex distance n.
            for (const c of ctx.cellsInRange(4, 3, 3)) {
                assert.ok(ctx.hexDistance(4, 3, c.row, c.col) <= 3, 'cellsInRange never exceeds the radius');
            }
            for (const c of ctx.ring(4, 3, 3)) {
                assert.equal(ctx.hexDistance(4, 3, c.row, c.col), 3, 'ring cells are at exactly the ring distance');
            }
        }
    },
    {
        name: 'hexLine: inclusive endpoints, length = hexDistance + 1, consecutive cells adjacent',
        fn: function() {
            const pairs = [[[0, 0], [0, 6]], [[0, 3], [7, 3]], [[2, 1], [5, 5]], [[7, 6], [0, 0]]];
            for (const [[r1, c1], [r2, c2]] of pairs) {
                const line = ctx.hexLine(r1, c1, r2, c2);
                assert.equal(line.length, ctx.hexDistance(r1, c1, r2, c2) + 1, 'line length = distance + 1');
                assert.deepEqual(line[0], { row: r1, col: c1 }, 'line starts at the start cell');
                assert.deepEqual(line[line.length - 1], { row: r2, col: c2 }, 'line ends at the end cell');
                for (let i = 1; i < line.length; i++) {
                    assert.equal(ctx.hexDistance(line[i - 1].row, line[i - 1].col, line[i].row, line[i].col), 1,
                        'consecutive line cells are hex-adjacent');
                }
            }
            assert.equal(ctx.hexLine(3, 3, 3, 3).length, 1, 'degenerate line is just the cell itself');
        }
    },
    {
        name: 'bossCells: 4 contiguous cells spanning exactly 2 rows, correct for both anchor-row parities',
        fn: function() {
            // Even anchor row (the game's real boss anchor is (2,3)).
            const even = ctx.bossCells(2, 3);
            assert.equal(even.length, 4, 'even-row boss occupies 4 cells');
            // Odd anchor row.
            const odd = ctx.bossCells(1, 3);
            assert.equal(odd.length, 4, 'odd-row boss occupies 4 cells');

            for (const cells of [even, odd]) {
                const rows = new Set(cells.map(c => c.row));
                assert.equal(rows.size, 2, 'boss cells span exactly 2 rows');
                const keys = new Set(cells.map(cellKey));
                assert.equal(keys.size, 4, 'boss cells are 4 distinct cells');
                // Contiguity: every cell adjacent to at least one other boss cell.
                for (const c of cells) {
                    const touching = cells.some(o => o !== c && ctx.hexDistance(c.row, c.col, o.row, o.col) === 1);
                    assert.ok(touching, `boss cell (${c.row},${c.col}) must touch another boss cell`);
                }
                // Anchor + its E neighbor are always in the set (same row, col+1).
            }
            assert.ok(even.some(c => c.row === 2 && c.col === 3) && even.some(c => c.row === 2 && c.col === 4),
                'even-row bossCells contains anchor and its E neighbor');
            assert.ok(odd.some(c => c.row === 1 && c.col === 3) && odd.some(c => c.row === 1 && c.col === 4),
                'odd-row bossCells contains anchor and its E neighbor');

            // Parity difference: the "below" (SE) pair shifts with the anchor row's parity.
            // Even anchor (2,3): below pair at the SAME cols as the anchor pair --
            // exactly the old square 2x2 footprint (deliberate; see grid.js bossCells()).
            const evenBelow = even.filter(c => c.row === 3).map(c => c.col).sort();
            const oddBelow = odd.filter(c => c.row === 2).map(c => c.col).sort();
            assert.deepEqual(evenBelow, [3, 4], 'even-row anchor (2,3): below pair lands at cols 3,4 (matches old square footprint)');
            assert.deepEqual(oddBelow, [4, 5], 'odd-row anchor (1,3): below pair lands at cols 4,5 (SE shift on odd rows)');
        }
    },
    {
        name: 'cellToPixel: odd rows shifted +cellW/2, rows packed at 0.75*cellH, even rows unshifted',
        fn: function() {
            const W = 60, H = 40;
            assert.deepEqual(ctx.cellToPixel(0, 0, W, H), { x: 0, y: 0 }, 'origin cell at (0,0)');
            assert.deepEqual(ctx.cellToPixel(0, 3, W, H), { x: 3 * W, y: 0 }, 'even row: no x offset');
            assert.deepEqual(ctx.cellToPixel(1, 0, W, H), { x: W / 2, y: 0.75 * H }, 'odd row: +half-cell x, packed y');
            assert.deepEqual(ctx.cellToPixel(1, 3, W, H), { x: 3 * W + W / 2, y: 0.75 * H }, 'odd row mid-board');
            assert.deepEqual(ctx.cellToPixel(2, 3, W, H), { x: 3 * W, y: 1.5 * H }, 'row 2 back to unshifted, y keeps packing');
            assert.deepEqual(ctx.cellToPixel(7, 6, W, H), { x: 6 * W + W / 2, y: 7 * 0.75 * H }, 'far corner (odd row 7)');
        }
    },
    {
        name: 'combat integration: findEmptyCellNear honors row bounds; getCellsInRadius/adjacentCells route through grid.js',
        fn: function() {
            // Empty 8x7 grid.
            const grid = [];
            for (let r = 0; r < 8; r++) { grid[r] = []; for (let c = 0; c < 7; c++) grid[r][c] = null; }

            // Unbounded: the seed cell itself is empty -> returned as-is.
            assert.deepEqual(ctx.findEmptyCellNear(3, 3, grid), { row: 3, col: 3 }, 'empty seed cell returns itself');

            // Occupied seed: nearest neighbor returned, at distance 1.
            grid[3][3] = { hp: 1 };
            const near = ctx.findEmptyCellNear(3, 3, grid);
            assert.equal(ctx.hexDistance(3, 3, near.row, near.col), 1, 'nearest empty is a hex neighbor');

            // Row-bounded (the combat-encounters.js findEmptyCellInRows contract):
            // ask for a cell near (3,3) but bounded to the player half (4-7).
            const bounded = ctx.findEmptyCellNear(3, 3, grid, 4, 7);
            assert.ok(bounded.row >= 4 && bounded.row <= 7, 'bounded search stays within [rowMin,rowMax]');
            const viaWrapper = ctx.findEmptyCellInRows(3, 3, grid, 4, 7);
            assert.deepEqual(viaWrapper, bounded, 'findEmptyCellInRows wrapper matches grid.js directly');

            // combat-core.js getCellsInRadius() is now hex cellsInRange().
            assert.deepEqual(ctx.getCellsInRadius(3, 3, 1), ctx.cellsInRange(3, 3, 1), 'getCellsInRadius delegates to cellsInRange');
            // adjacentCells alias.
            assert.deepEqual(ctx.adjacentCells(3, 3), ctx.hexNeighbors(3, 3), 'adjacentCells is hexNeighbors');
        }
    }
];
