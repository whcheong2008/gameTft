// =============================================================================
// ui.js — All rendering: board, bench, shop, synergies, tooltips, combat log,
//         streak display, income breakdown, affinity indicators
// =============================================================================

var selectedFrom = null;
var tooltipEl = null;
var incomeBreakdownTimer = null;

function initUI() {
    renderGrid('enemy-grid', 4, 7, 'enemy');
    renderGrid('player-grid', 4, 7, 'player');
    renderBench();
    setupShopListeners();

    tooltipEl = document.createElement('div');
    tooltipEl.className = 'tooltip';
    tooltipEl.style.display = 'none';
    document.body.appendChild(tooltipEl);

    document.addEventListener('mousemove', function(e) {
        if (tooltipEl.style.display !== 'none') {
            tooltipEl.style.left = (e.clientX + 12) + 'px';
            tooltipEl.style.top = (e.clientY + 12) + 'px';
        }
    });
}

function renderGrid(containerId, rows, cols, side) {
    var container = document.getElementById(containerId);
    container.innerHTML = '';
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            var cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.dataset.side = side;
            if (side === 'player') {
                cell.addEventListener('click', onPlayerCellClick);
            }
            container.appendChild(cell);
        }
    }
}

function renderBench() {
    var container = document.getElementById('bench-slots');
    container.innerHTML = '';
    for (var i = 0; i < 9; i++) {
        var slot = document.createElement('div');
        slot.className = 'bench-slot';
        slot.dataset.index = i;
        slot.addEventListener('click', onBenchClick);
        container.appendChild(slot);
    }
}

function setupShopListeners() {
    document.getElementById('refresh-btn').addEventListener('click', function() {
        if (gameState.phase !== 'planning') return;
        if (refreshShop(gameState)) {
            renderAll();
        }
    });

    document.getElementById('buy-xp-btn').addEventListener('click', function() {
        if (gameState.phase !== 'planning') return;
        if (buyXP(gameState)) {
            renderAll();
        }
    });

    document.getElementById('start-combat-btn').addEventListener('click', function() {
        if (gameState.phase !== 'planning') return;
        startCombat();
    });
}

function onPlayerCellClick(e) {
    if (gameState.phase !== 'planning') return;
    var cell = e.currentTarget;
    var row = parseInt(cell.dataset.row);
    var col = parseInt(cell.dataset.col);
    var unit = gameState.board[row][col];

    if (selectedFrom) {
        // Try to swap/place
        var to = { type: 'board', row: row, col: col };
        if (swapUnits(gameState, selectedFrom, to)) {
            updateActiveSynergies(gameState);
            checkAllEvolutions(gameState);
        }
        selectedFrom = null;
        renderAll();
    } else if (unit) {
        selectedFrom = { type: 'board', row: row, col: col };
        renderAll();
    }
}

function onBenchClick(e) {
    if (gameState.phase !== 'planning') return;
    var slot = e.currentTarget;
    var index = parseInt(slot.dataset.index);
    var unit = gameState.bench[index];

    if (selectedFrom) {
        var to = { type: 'bench', index: index };
        if (swapUnits(gameState, selectedFrom, to)) {
            updateActiveSynergies(gameState);
            checkAllEvolutions(gameState);
        }
        selectedFrom = null;
        renderAll();
    } else if (unit) {
        selectedFrom = { type: 'bench', index: index };
        renderAll();
    }
}

function onShopCardClick(index) {
    if (gameState.phase !== 'planning') return;
    if (buyUnit(gameState, index)) {
        updateActiveSynergies(gameState);
        renderAll();
    }
}

// ---- Rendering ----

function renderAll() {
    renderTopBar();
    renderSynergyBar();
    renderPlayerBoard();
    renderEnemyBoard();
    renderBenchUnits();
    renderShop();
    renderStreakInfo();
}

function renderTopBar() {
    document.getElementById('round-number').textContent = gameState.round;
    document.getElementById('phase-info').textContent =
        gameState.phase === 'planning' ? 'Planning Phase' : 'Combat Phase';
    document.getElementById('player-hp').textContent = '❤️ ' + gameState.hp;
    document.getElementById('player-gold').textContent = '🪙 ' + gameState.gold;
    document.getElementById('player-level').textContent = '⭐ Lv ' + gameState.level +
        (gameState.level < 9 ? ' (' + gameState.xp + '/' + gameState.xpToLevel + ' XP)' : ' (MAX)');

    // Button states
    document.getElementById('refresh-btn').disabled = gameState.gold < 2 || gameState.phase !== 'planning';
    document.getElementById('buy-xp-btn').disabled = gameState.gold < 4 || gameState.level >= 9 || gameState.phase !== 'planning';
    document.getElementById('start-combat-btn').disabled = gameState.phase !== 'planning';
}

function renderSynergyBar() {
    var bar = document.getElementById('synergy-bar');
    bar.innerHTML = '';

    // Archetype synergies
    var keys = Object.keys(ARCHETYPES);
    for (var k = 0; k < keys.length; k++) {
        var archKey = keys[k];
        var arch = ARCHETYPES[archKey];
        var count = gameState.activeSynergies[archKey] || 0;
        if (count === 0) continue;

        var tier = 'inactive';
        for (var i = arch.thresholds.length - 1; i >= 0; i--) {
            if (count >= arch.thresholds[i]) {
                tier = i === 0 ? 'bronze' : (i === 1 ? 'silver' : 'gold');
                break;
            }
        }

        var badge = document.createElement('div');
        badge.className = 'synergy-badge ' + tier;
        badge.innerHTML = '<span class="syn-icon">' + arch.emoji + '</span> ' +
            '<span>' + arch.name + '</span> ' +
            '<span class="syn-count">' + count + '</span>';
        bar.appendChild(badge);
    }

    // Element counts
    var elems = Object.keys(ELEMENTS);
    for (var e = 0; e < elems.length; e++) {
        var elemKey = elems[e];
        var count = gameState.activeElements[elemKey] || 0;
        if (count === 0) continue;

        var badge = document.createElement('div');
        badge.className = 'synergy-badge bronze';
        badge.innerHTML = '<span class="syn-icon">' + ELEMENTS[elemKey].emoji + '</span> ' +
            '<span>' + ELEMENTS[elemKey].name + '</span> ' +
            '<span class="syn-count">' + count + '</span>';
        bar.appendChild(badge);
    }
}

function renderPlayerBoard() {
    var cells = document.querySelectorAll('#player-grid .cell');
    for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        var row = parseInt(cell.dataset.row);
        var col = parseInt(cell.dataset.col);
        var unit = gameState.board[row][col];

        cell.innerHTML = '';
        cell.classList.remove('selected', 'valid-target');

        if (selectedFrom && selectedFrom.type === 'board' &&
            selectedFrom.row === row && selectedFrom.col === col) {
            cell.classList.add('selected');
        }

        if (unit) {
            cell.appendChild(createUnitElement(unit, false));
        }
    }
}

function renderEnemyBoard() {
    var cells = document.querySelectorAll('#enemy-grid .cell');
    for (var i = 0; i < cells.length; i++) {
        cells[i].innerHTML = '';
    }

    if (!gameState.enemies) return;
    for (var i = 0; i < gameState.enemies.length; i++) {
        var e = gameState.enemies[i];
        if (e.boardRow === undefined) continue;
        var idx = e.boardRow * 7 + e.boardCol;
        if (cells[idx]) {
            cells[idx].appendChild(createUnitElement(e, true));
        }
    }
}

function renderBenchUnits() {
    var slots = document.querySelectorAll('#bench-slots .bench-slot');
    for (var i = 0; i < slots.length; i++) {
        slots[i].innerHTML = '';
        slots[i].classList.remove('selected');

        if (selectedFrom && selectedFrom.type === 'bench' && selectedFrom.index === i) {
            slots[i].classList.add('selected');
        }

        if (gameState.bench[i]) {
            slots[i].appendChild(createUnitElement(gameState.bench[i], false));
        }
    }
}

function createUnitElement(unit, isEnemy) {
    var div = document.createElement('div');
    div.className = 'unit cost-' + unit.cost;
    if (unit.element) div.classList.add('elem-' + unit.element);
    if (isEnemy) div.classList.add('enemy');
    if (unit.evolved) div.classList.add('evolved');

    div.innerHTML = '<span class="unit-emoji">' + unit.emoji + '</span>';
    if (unit.stars > 1) {
        div.innerHTML += '<span class="unit-star">' + '★'.repeat(unit.stars) + '</span>';
    }

    // HP bar
    var hpPct = unit.hp / unit.maxHp * 100;
    var hpClass = hpPct > 60 ? '' : (hpPct > 30 ? ' mid' : ' low');
    div.innerHTML += '<div class="hp-bar-bg"><div class="hp-bar' + hpClass + '" style="width:' + hpPct + '%"></div></div>';

    // Tooltip on hover
    div.addEventListener('mouseenter', function(e) {
        showTooltip(unit, e);
    });
    div.addEventListener('mouseleave', hideTooltip);

    // Right-click to sell (player units only)
    if (!isEnemy) {
        div.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            if (gameState.phase !== 'planning') return;
            sellUnit(gameState, unit);
            updateActiveSynergies(gameState);
            renderAll();
        });
    }

    return div;
}

function showTooltip(unit, e) {
    var archName = unit.archetype ? ARCHETYPES[unit.archetype].name : '—';
    var elemName = unit.element ? ELEMENTS[unit.element].name : '—';

    var html = '<div class="tt-name">' + unit.name + '</div>';
    html += '<div class="tt-tags">' + unit.type + ' · ' + archName + ' · ' + elemName + '</div>';
    html += '<div class="tt-stats">';
    html += '❤️ ' + unit.hp + '/' + unit.maxHp + ' · ⚔️ ' + unit.attack + '<br>';
    html += '⏱️ ' + unit.attackSpd.toFixed(2) + 's · 📏 ' + unit.range + ' · 🏃 ' + unit.moveSpd.toFixed(1);
    html += '<br>⭐ ' + unit.stars + '-star · 💰 Cost ' + unit.cost;
    if (unit.cost > 0) {
        html += ' · Sell: ' + getSellValue(unit) + 'g';
    }
    html += '</div>';

    if (unit.evolved && unit.ability) {
        html += '<div class="tt-evolve">✨ ' + unit.ability + '</div>';
    } else if (!unit.evolved && unit.evolvedForm) {
        var evo = EVOLUTIONS[unit.key];
        if (evo) {
            var evTmpl = EVOLVED_TEMPLATES[evo.into];
            html += '<div class="tt-evolve">→ ' + evTmpl.name;
            var crit = evo.criteria;
            var reqs = [];
            if (crit.stars) reqs.push(crit.stars + '★');
            if (crit.synergy) reqs.push(crit.count + '+ ' + ARCHETYPES[crit.synergy].name);
            html += ' (' + reqs.join(' & ') + ')</div>';
        }
    }

    tooltipEl.innerHTML = html;
    tooltipEl.style.display = 'block';
    tooltipEl.style.left = (e.clientX + 12) + 'px';
    tooltipEl.style.top = (e.clientY + 12) + 'px';
}

function hideTooltip() {
    tooltipEl.style.display = 'none';
}

function renderShop() {
    var container = document.getElementById('shop-units');
    container.innerHTML = '';

    if (!gameState.shop) return;

    for (var i = 0; i < gameState.shop.length; i++) {
        var card = gameState.shop[i];
        var tmpl = UNIT_TEMPLATES[card.key];
        if (!tmpl) continue;

        var div = document.createElement('div');
        div.className = 'shop-card cost-' + tmpl.cost;
        if (card.sold) div.classList.add('sold');

        var archName = tmpl.archetype ? ARCHETYPES[tmpl.archetype].name : '';
        var elemEmoji = tmpl.element ? ELEMENTS[tmpl.element].emoji : '';

        var affinityTag = '';
        if (card.affinity && !card.sold) {
            affinityTag = '<span class="affinity-indicator" title="Synergy affinity — more likely to appear">🔗</span>';
        }

        div.innerHTML =
            '<div class="card-emoji">' + tmpl.emoji + '</div>' +
            '<div class="card-name">' + tmpl.name + affinityTag + '</div>' +
            '<div class="card-cost">' + tmpl.cost + ' 🪙</div>' +
            '<div class="card-tags">' +
                '<span class="elem-tag-' + (tmpl.element || '') + '">' + elemEmoji + '</span> ' +
                archName + ' · ' + tmpl.type +
            '</div>';

        (function(idx) {
            div.addEventListener('click', function() { onShopCardClick(idx); });
        })(i);

        container.appendChild(div);
    }
}

// ---- Streak & Income Display ----

function renderStreakInfo() {
    var streakEl = document.getElementById('streak-info');
    if (!streakEl) return;

    if (gameState.winStreak >= 2) {
        var bonus = getStreakBonus(gameState);
        streakEl.textContent = '🔥 Win Streak: ' + gameState.winStreak + ' (+' + bonus + 'g)';
        streakEl.style.display = 'inline-block';
        streakEl.className = 'streak-display streak-win';
    } else if (gameState.lossStreak >= 2) {
        var bonus = getStreakBonus(gameState);
        streakEl.textContent = '💀 Loss Streak: ' + gameState.lossStreak + ' (+' + bonus + 'g)';
        streakEl.style.display = 'inline-block';
        streakEl.className = 'streak-display streak-loss';
    } else {
        streakEl.textContent = '';
        streakEl.style.display = 'none';
    }
}

function showIncomeBreakdown(income) {
    var el = document.getElementById('income-breakdown');
    if (!el) return;

    var parts = [];
    parts.push('+' + income.base + ' base');
    if (income.interest > 0) parts.push('+' + income.interest + ' interest');
    if (income.streak > 0) parts.push('+' + income.streak + ' streak');
    var text = parts.join(', ') + ' = ' + income.total + ' gold';

    // Add streak flavor
    if (gameState.winStreak >= 2) {
        text += '  🔥 Win ×' + gameState.winStreak;
    } else if (gameState.lossStreak >= 2) {
        text += '  💀 Loss ×' + gameState.lossStreak;
    }

    el.textContent = text;
    el.style.display = 'block';
    el.classList.add('income-flash');

    // Clear previous timer
    if (incomeBreakdownTimer) clearTimeout(incomeBreakdownTimer);
    incomeBreakdownTimer = setTimeout(function() {
        el.classList.remove('income-flash');
    }, 3000);

    addLogEntry(text, 'gold');
}

// ---- Combat Rendering ----

function renderCombatFrame() {
    if (!combatState) return;

    var playerCells = document.querySelectorAll('#player-grid .cell');
    var enemyCells = document.querySelectorAll('#enemy-grid .cell');

    // Clear
    for (var i = 0; i < playerCells.length; i++) playerCells[i].innerHTML = '';
    for (var i = 0; i < enemyCells.length; i++) enemyCells[i].innerHTML = '';

    for (var i = 0; i < combatState.units.length; i++) {
        var u = combatState.units[i];
        if (!u.alive) continue;

        var renderRow, renderCol, cells;
        if (u.side === 'player') {
            renderRow = Math.round(u.cy - 4);
            renderCol = Math.round(u.cx);
            cells = playerCells;
        } else {
            renderRow = Math.round(3 - u.cy);
            renderCol = Math.round(u.cx);
            cells = enemyCells;
        }

        renderRow = Math.max(0, Math.min(3, renderRow));
        renderCol = Math.max(0, Math.min(6, renderCol));

        var cellIdx = renderRow * 7 + renderCol;
        if (cells[cellIdx]) {
            var div = document.createElement('div');
            div.className = 'unit cost-' + u.cost;
            if (u.element) div.classList.add('elem-' + u.element);
            if (u.side === 'enemy') div.classList.add('enemy');
            if (u.evolved) div.classList.add('evolved');

            div.innerHTML = '<span class="unit-emoji">' + u.emoji + '</span>';
            if (u.stars > 1) {
                div.innerHTML += '<span class="unit-star">' + '★'.repeat(u.stars) + '</span>';
            }

            var hpPct = u.hp / u.maxHp * 100;
            var hpClass = hpPct > 60 ? '' : (hpPct > 30 ? ' mid' : ' low');
            var shieldPct = u.shield > 0 ? Math.min(100 - hpPct, (u.shield / u.maxHp) * 100) : 0;
            div.innerHTML += '<div class="hp-bar-bg"><div class="hp-bar' + hpClass + '" style="width:' + hpPct + '%"></div></div>';

            cells[cellIdx].appendChild(div);
        }
    }
}

// ---- Combat Log ----

function addLogEntry(text, type) {
    var container = document.getElementById('log-messages');
    var entry = document.createElement('div');
    entry.className = 'log-entry ' + (type || 'info');
    entry.textContent = text;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;

    // Keep log manageable
    while (container.children.length > 50) {
        container.removeChild(container.firstChild);
    }
}

function clearLog() {
    document.getElementById('log-messages').innerHTML = '';
}
