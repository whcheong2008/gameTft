// =============================================================================
// board.js — Board/bench grid management, unit placement
// =============================================================================

function initBoard(gs) {
    gs.board = [];
    for (var r = 0; r < 4; r++) {
        gs.board[r] = [];
        for (var c = 0; c < 7; c++) {
            gs.board[r][c] = null;
        }
    }
    gs.bench = [];
    for (var i = 0; i < 9; i++) {
        gs.bench[i] = null;
    }
}

function placeUnit(gs, unit, row, col) {
    if (row < 0 || row >= 4 || col < 0 || col >= 7) return false;
    if (gs.board[row][col] !== null) return false;
    if (countBoardUnits(gs) >= gs.unitCap) return false;
    gs.board[row][col] = unit;
    return true;
}

function removeFromBoard(gs, row, col) {
    var unit = gs.board[row][col];
    gs.board[row][col] = null;
    return unit;
}

function addToBench(gs, unit) {
    for (var i = 0; i < 9; i++) {
        if (gs.bench[i] === null) {
            gs.bench[i] = unit;
            return i;
        }
    }
    return false;
}

function removeFromBench(gs, index) {
    var unit = gs.bench[index];
    gs.bench[index] = null;
    return unit;
}

function getPlayerBoardUnits(gs) {
    var units = [];
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            if (gs.board[r][c]) units.push(gs.board[r][c]);
        }
    }
    return units;
}

function getPlayerBenchUnits(gs) {
    var units = [];
    for (var i = 0; i < 9; i++) {
        if (gs.bench[i]) units.push(gs.bench[i]);
    }
    return units;
}

function getAllPlayerUnits(gs) {
    return getPlayerBoardUnits(gs).concat(getPlayerBenchUnits(gs));
}

function countBoardUnits(gs) {
    var count = 0;
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 7; c++) {
            if (gs.board[r][c]) count++;
        }
    }
    return count;
}

function swapUnits(gs, from, to) {
    var unitA = null;
    var unitB = null;

    // Get unit A
    if (from.type === 'board') {
        unitA = gs.board[from.row][from.col];
    } else {
        unitA = gs.bench[from.index];
    }

    // Get unit B
    if (to.type === 'board') {
        unitB = gs.board[to.row][to.col];
    } else {
        unitB = gs.bench[to.index];
    }

    // Check unit cap if moving from bench to board and board target is empty
    if (from.type === 'bench' && to.type === 'board' && !unitB) {
        if (countBoardUnits(gs) >= gs.unitCap) return false;
    }
    if (to.type === 'bench' && from.type === 'board' && !unitA) {
        return false; // nothing to swap
    }

    // Handle bench-to-board where board is full and target has no unit
    if (from.type === 'bench' && to.type === 'board' && !unitB) {
        if (countBoardUnits(gs) >= gs.unitCap && !unitB) return false;
    }

    // Place unit B where A was
    if (from.type === 'board') {
        gs.board[from.row][from.col] = unitB;
    } else {
        gs.bench[from.index] = unitB;
    }

    // Place unit A where B was
    if (to.type === 'board') {
        gs.board[to.row][to.col] = unitA;
    } else {
        gs.bench[to.index] = unitA;
    }

    return true;
}
