// grid.js -- single source of truth for ALL spatial math (Prompt 69: Phase 3.3 hex migration)
//
// Combat plays on a pointy-top hex grid, 8 rows x 7 cols, in "odd-r offset"
// layout (odd rows shifted +half-cell in x -- rows 0-3 enemy, 4-7 player,
// exactly as the pre-hex square grid). This file is the ONLY place that
// converts between offset (row, col) grid coordinates and cube coordinates,
// and the only place hex neighbor/distance/range/line math is implemented.
// combat-*.js, render-pixi.js and ui-builder.js all route
// their spatial math through the functions below -- see prompts/69-hex-
// migration.md's "audit table of migrated call sites" (in the Prompt 69
// worker report) for the full list of call sites this replaced.
//
// Loads before combat-events.js/combat-core.js in game-v2.html's script
// order (data/math before logic, per CLAUDE.md's load-order rule) and is a
// plain global-scope script like every other file in this codebase: no
// module system, `var` everywhere, functions attached to the global scope.
//
// ---- Coordinate system ----
// "Offset" coordinates are the existing {row, col} grid coordinates used
// throughout the game (row 0-7, col 0-6) -- these never change meaning:
// team-builder slots, save data, combatState.grid indices, and the
// row-4-splits-enemy/player convention are all still plain row/col.
// "Cube" coordinates {x, y, z} (x+y+z===0 always) are an internal
// representation used only inside this file to do the actual hex math --
// nothing outside grid.js should ever see or produce a cube coordinate.
//
// odd-r offset -> cube (row shoves ODD rows +0.5 in x, matching the visual
// spec "odd rows shifted +half-cell in x"):
//   x = col - (row - (row & 1)) / 2
//   z = row
//   y = -x - z
// This is the standard "odd-r" transform (see redblobgames.com/grids/hexagons
// for the reference derivation) -- verified in tests/test-grid.js via round-trip
// and neighbor-count/distance-symmetry spot checks rather than taken on faith.

var GRID_ROWS = 8;
var GRID_COLS = 7;

// The 6 unit cube directions (pointy-top hex neighbors: E, W, and 4
// diagonals -- no pure N/S neighbor, matching a pointy-top hex's flat left/
// right edges). Order is arbitrary but fixed -- ring()/hexRandomDirectionIndex()
// depend on this exact order and index.
var GRID_CUBE_DIRS = [
    { x: 1, y: -1, z: 0 },  // 0: E
    { x: 1, y: 0, z: -1 },  // 1: NE-ish (toward -row)
    { x: 0, y: 1, z: -1 },  // 2: NW-ish
    { x: -1, y: 1, z: 0 },  // 3: W
    { x: -1, y: 0, z: 1 },  // 4: SW-ish (toward +row)
    { x: 0, y: -1, z: 1 }   // 5: SE-ish (toward +row) -- "below" direction used by bossCells()
];

function gridInBounds(row, col) {
    return row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS;
}

function offsetToCube(row, col) {
    var x = col - (row - (row & 1)) / 2;
    var z = row;
    var y = -x - z;
    return { x: x, y: y, z: z };
}

function cubeToOffset(cube) {
    var col = cube.x + (cube.z - (cube.z & 1)) / 2;
    var row = cube.z;
    return { row: row, col: col };
}

function cubeRound(cube) {
    var rx = Math.round(cube.x), ry = Math.round(cube.y), rz = Math.round(cube.z);
    var xDiff = Math.abs(rx - cube.x), yDiff = Math.abs(ry - cube.y), zDiff = Math.abs(rz - cube.z);
    if (xDiff > yDiff && xDiff > zDiff) rx = -ry - rz;
    else if (yDiff > zDiff) ry = -rx - rz;
    else rz = -rx - ry;
    return { x: rx, y: ry, z: rz };
}

function cubeDistance(a, b) {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
}

// ---- Task 1 API ----

function hexDistance(r1, c1, r2, c2) {
    return cubeDistance(offsetToCube(r1, c1), offsetToCube(r2, c2));
}

// 6 neighbors (odd-r offset rules, via cube conversion), filtered to the
// 8x7 board. Interior cells have 6, edges 4, corners 2-3 (verified in
// tests/test-grid.js).
function hexNeighbors(row, col) {
    var cube = offsetToCube(row, col);
    var result = [];
    for (var i = 0; i < 6; i++) {
        var dir = GRID_CUBE_DIRS[i];
        var offset = cubeToOffset({ x: cube.x + dir.x, y: cube.y + dir.y, z: cube.z + dir.z });
        if (gridInBounds(offset.row, offset.col)) result.push(offset);
    }
    return result;
}

// Alias per spec ("adjacentCells (= neighbors)").
function adjacentCells(row, col) {
    return hexNeighbors(row, col);
}

// All cells at hex distance <= n from (row, col), filtered to the board.
// Includes the center cell itself (n=0 -> [{row,col}]).
function cellsInRange(row, col, n) {
    var center = offsetToCube(row, col);
    var results = [];
    for (var dx = -n; dx <= n; dx++) {
        var yMin = Math.max(-n, -dx - n), yMax = Math.min(n, -dx + n);
        for (var dy = yMin; dy <= yMax; dy++) {
            var dz = -dx - dy;
            var offset = cubeToOffset({ x: center.x + dx, y: center.y + dy, z: center.z + dz });
            if (gridInBounds(offset.row, offset.col)) results.push(offset);
        }
    }
    return results;
}

// All cells at hex distance EXACTLY n from (row, col), filtered to the
// board. ring(row,col,0) === [{row,col}].
function ring(row, col, n) {
    if (n <= 0) return [{ row: row, col: col }];
    var center = offsetToCube(row, col);
    var results = [];
    // Start n steps out in direction 4, then walk the hexagonal ring by
    // taking n steps in each of the 6 directions in turn (standard cube-ring
    // walk algorithm).
    var cube = { x: center.x + GRID_CUBE_DIRS[4].x * n, y: center.y + GRID_CUBE_DIRS[4].y * n, z: center.z + GRID_CUBE_DIRS[4].z * n };
    for (var i = 0; i < 6; i++) {
        for (var j = 0; j < n; j++) {
            var offset = cubeToOffset(cube);
            if (gridInBounds(offset.row, offset.col)) results.push(offset);
            var dir = GRID_CUBE_DIRS[i];
            cube = { x: cube.x + dir.x, y: cube.y + dir.y, z: cube.z + dir.z };
        }
    }
    return results;
}

// Inclusive line of hex cells from (r1,c1) to (r2,c2) via cube lerp+round
// (the standard hex-line algorithm). Length = hexDistance+1. Used for row/
// line abilities that hit a fixed segment (contrast with hexRay(), which
// extends a ray past its target to the board edge for pierce-shot abilities).
function hexLine(r1, c1, r2, c2) {
    var a = offsetToCube(r1, c1), b = offsetToCube(r2, c2);
    var n = cubeDistance(a, b);
    var results = [];
    for (var i = 0; i <= n; i++) {
        var t = n === 0 ? 0 : i / n;
        var lerped = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
        results.push(cubeToOffset(cubeRound(lerped)));
    }
    return results;
}

// ---- Directional helpers (NOT in the spec's explicit primitive list, but
// required to migrate every pierce-beam/knockback/pull/cone/random-teleport
// call site off square dr/dc arithmetic -- see the Prompt 69 report's
// "judgment calls" section for why these were added alongside the spec's
// named primitives). All built on the same cube math as everything above,
// so they stay perfectly consistent with hexNeighbors/hexDistance/hexLine. ----

// Index (0-5) of the GRID_CUBE_DIRS entry that points most directly from
// (fromRow,fromCol) toward (toRow,toCol). Same-cell input returns 0
// (arbitrary -- callers that care about the same-cell case should guard it
// themselves, same contract the old square dr=dc=0 fallback had).
function hexDirectionIndex(fromRow, fromCol, toRow, toCol) {
    if (fromRow === toRow && fromCol === toCol) return 0;
    var a = offsetToCube(fromRow, fromCol), b = offsetToCube(toRow, toCol);
    var n = cubeDistance(a, b);
    var t = 1 / n;
    var lerped = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
    var firstStep = cubeRound(lerped);
    var stepVec = { x: firstStep.x - a.x, y: firstStep.y - a.y, z: firstStep.z - a.z };
    for (var i = 0; i < 6; i++) {
        var d = GRID_CUBE_DIRS[i];
        if (d.x === stepVec.x && d.y === stepVec.y && d.z === stepVec.z) return i;
    }
    // Degenerate rounding case (extremely rare) -- fall back to nearest by dot product.
    var best = 0, bestScore = -Infinity;
    for (var j = 0; j < 6; j++) {
        var dj = GRID_CUBE_DIRS[j];
        var score = dj.x * (b.x - a.x) + dj.y * (b.y - a.y) + dj.z * (b.z - a.z);
        if (score > bestScore) { bestScore = score; best = j; }
    }
    return best;
}

// Move `steps` cells from (row,col) in a constant cube direction (dirIndex,
// 0-5). Returns {row,col} or null if the result falls off the board --
// callers that need "walk backward one step and stop" (e.g. push distance N,
// stop at the board edge / an occupied cell) should build that from
// hexStep(row,col,dirIndex,1) repeatedly rather than assuming a partial
// result at OOB.
function hexStep(row, col, dirIndex, steps) {
    var cube = offsetToCube(row, col);
    var dir = GRID_CUBE_DIRS[dirIndex];
    var moved = { x: cube.x + dir.x * steps, y: cube.y + dir.y * steps, z: cube.z + dir.z * steps };
    var offset = cubeToOffset(moved);
    return gridInBounds(offset.row, offset.col) ? offset : null;
}

// Ray of up to maxSteps cells stepping from (fromRow,fromCol) in the
// constant direction toward (towardRow,towardCol), continuing PAST the
// toward-cell to the board edge (pierce-shot semantics: "Pierce through
// enemies in line" abilities hit everything along the beam, not just the
// original target). Stops (does not wrap or skip) at the first
// out-of-bounds step. Does not include the origin cell.
function hexRay(fromRow, fromCol, towardRow, towardCol, maxSteps) {
    var dirIndex = hexDirectionIndex(fromRow, fromCol, towardRow, towardCol);
    var results = [];
    for (var step = 1; step <= maxSteps; step++) {
        var cell = hexStep(fromRow, fromCol, dirIndex, step);
        if (!cell) break;
        results.push(cell);
    }
    return results;
}

// BFS shortest-path next-step, mirroring the old square findPathNextStep()'s
// exact contract: returns the {row,col} of the first step toward (toRow,toCol)
// via hexNeighbors(), or null if already there / no path. blockedFn(row,col)
// -> bool marks a cell impassable to PASS THROUGH, but the destination cell
// itself is always reachable as the final step regardless of blockedFn (same
// "can path up to an occupied target" rule the old BFS had) -- the caller
// (moveUnit()) separately refuses to actually step onto an occupied cell.
function findPathBFS(fromRow, fromCol, toRow, toCol, blockedFn) {
    if (fromRow === toRow && fromCol === toCol) return null;

    var visited = {};
    var parent = {};
    var startKey = fromRow + ',' + fromCol;
    visited[startKey] = true;
    var queue = [{ row: fromRow, col: fromCol }];

    while (queue.length > 0) {
        var cur = queue.shift();
        var neighbors = hexNeighbors(cur.row, cur.col);
        for (var i = 0; i < neighbors.length; i++) {
            var nb = neighbors[i];
            var key = nb.row + ',' + nb.col;
            if (visited[key]) continue;

            if (nb.row === toRow && nb.col === toCol) {
                // Trace back to the first step from the origin.
                var path = nb, prev = cur;
                while (!(prev.row === fromRow && prev.col === fromCol)) {
                    path = prev;
                    prev = parent[prev.row + ',' + prev.col];
                }
                return path;
            }

            if (blockedFn && blockedFn(nb.row, nb.col)) continue;

            visited[key] = true;
            parent[key] = cur;
            queue.push(nb);
        }
    }
    return null;
}

// BFS outward (via hexNeighbors) for the nearest empty cell to (row,col),
// optionally bounded to [rowMin,rowMax] (default: the whole board -- used
// standalone by combat-core.js, and with explicit bounds by combat-
// encounters.js's spawn/split-formation logic, which previously had its own
// bounded 4-dir BFS copy). `grid` is the combatState.grid 2D array;
// isEmptyFn defaults to "falsy cell". Checks (row,col) itself first, exactly
// like the old square version did.
function findEmptyCellNear(row, col, grid, rowMin, rowMax) {
    if (rowMin === undefined) rowMin = 0;
    if (rowMax === undefined) rowMax = GRID_ROWS - 1;

    var visited = {};
    var queue = [{ row: row, col: col }];
    visited[row + ',' + col] = true;

    while (queue.length > 0) {
        var cell = queue.shift();
        if (cell.row >= rowMin && cell.row <= rowMax && cell.col >= 0 && cell.col < GRID_COLS) {
            if (!grid[cell.row][cell.col]) return { row: cell.row, col: cell.col };
        }
        var neighbors = hexNeighbors(cell.row, cell.col);
        for (var i = 0; i < neighbors.length; i++) {
            var nb = neighbors[i];
            if (nb.row < rowMin || nb.row > rowMax) continue;
            var key = nb.row + ',' + nb.col;
            if (!visited[key]) {
                visited[key] = true;
                queue.push(nb);
            }
        }
    }
    return null;
}

// The 4 cells a 2x2 boss occupies on the offset-hex board: the anchor cell,
// its E neighbor (direction 0 -- always same-row col+1 regardless of row
// parity, since E/W offset deltas don't depend on odd/even row), and the
// cell "below" each of those (direction 5, SE -- see GRID_CUBE_DIRS'
// comment). Using a single fixed cube direction (rather than a row/col
// delta that would need an even/odd-row branch) is exactly why "per offset
// parity" in the spec falls out for free from cube math: the OFFSET delta
// of direction 5 differs by row parity, but the cube direction is uniform.
// SE (not SW) is the deliberate choice of "below": for an EVEN anchor row
// it yields the below pair at the same cols as the anchor pair -- i.e. for
// the game's actual boss anchor (2,3) the four cells are exactly the old
// square grid's (2,3),(2,4),(3,3),(3,4) footprint, preserving pre-hex boss
// positioning against the standard enemy/player layouts (SW would have
// shifted the boss's bottom row one column left toward the player's
// left-packed default formation). The 4 cells always form a contiguous
// rhombus (every cell hex-adjacent to another -- verified in
// tests/test-grid.js). Define once, use everywhere a boss's occupied/
// adjacent/AoE-around-self cells are needed (combat-core.js grid
// bookkeeping, combat-boss.js telegraph cell generation, getDistToBoss()).
function bossCells(anchorRow, anchorCol) {
    var e = hexStep(anchorRow, anchorCol, 0, 1) || { row: anchorRow, col: anchorCol + 1 };
    var belowAnchor = hexStep(anchorRow, anchorCol, 5, 1);
    var belowE = hexStep(e.row, e.col, 5, 1);
    var cells = [{ row: anchorRow, col: anchorCol }, e];
    if (belowAnchor) cells.push(belowAnchor);
    if (belowE) cells.push(belowE);
    return cells;
}

// Pixel top-left anchor for a hex cell, shared by every renderer: odd rows
// shift +cellW/2 in x (odd-r offset), rows pack at 0.75x cellH vertically
// (the standard pointy-top hex row-packing factor -- rows overlap because a
// pointy-top hex's horizontal midline is narrower than its full width, so
// consecutive rows nest instead of stacking edge-to-edge). Callers add
// their own centering offset (e.g. + cellW/2, + cellH/2) exactly as they did
// for the old square cell math -- this returns the same "top-left of cell's
// bounding box" convention the pre-hex code used.
function cellToPixel(row, col, cellW, cellH) {
    var x = col * cellW + (row % 2 === 1 ? cellW / 2 : 0);
    var y = row * cellH * 0.75;
    return { x: x, y: y };
}
