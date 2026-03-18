# Prompt 07 — Phase 2 Completion: More Missions, Enemy Synergies, Unit Selling

## Context

You're working on a browser-based gacha auto-battler game (V2). The codebase uses **modular JS via global scope** — NO ES modules, NO import/export. All files are loaded via `<script>` tags in `game-v2.html`.

**Load order**: `units.js → save.js → gacha.js → teams.js → hub.js → items.js → missions.js → ui-v2.js → main-v2.js`

This prompt completes Phase 2 by implementing three features:
1. Expand story missions from 7 to 14 with hand-crafted enemy compositions
2. Enemy synergies and evolved forms in later missions
3. Sell duplicate units for gold from the roster screen

---

## Part 1: Expanded Story Missions (missions.js)

### New Missions 8–14

Replace the existing `STORY_MISSIONS` array with the expanded version below. Missions 1–7 stay exactly the same. Add missions 8–14:

```js
// Mission 8 — First mission with enemy synergies
{
    id: 'story_8',
    name: 'The Ember Fortress',
    description: 'A stronghold defended by fire-aligned warriors working in concert.',
    requiredLevel: 11,
    waves: [
        { budget: 18, maxCost: 4, count: 5, elementBias: 'fire', synergyBias: 'striker' },
        { budget: 22, maxCost: 4, count: 6, elementBias: 'fire', synergyBias: 'striker' },
        { budget: 25, maxCost: 4, count: 6, elementBias: 'fire', synergyBias: 'guardian' }
    ],
    rewards: { gold: 280, xp: 600 }
},
// Mission 9
{
    id: 'story_9',
    name: 'Tidal Depths',
    description: 'Aquatic mystics channel slowing auras from the ocean floor.',
    requiredLevel: 12,
    waves: [
        { budget: 20, maxCost: 4, count: 5, elementBias: 'water', synergyBias: 'mystic' },
        { budget: 24, maxCost: 4, count: 6, elementBias: 'water', synergyBias: 'sage' },
        { budget: 28, maxCost: 5, count: 6, elementBias: 'water' }
    ],
    rewards: { gold: 320, xp: 700 }
},
// Mission 10
{
    id: 'story_10',
    name: 'The Living Mountain',
    description: 'Earth golems and guardians form an impenetrable wall.',
    requiredLevel: 13,
    waves: [
        { budget: 22, maxCost: 4, count: 5, elementBias: 'earth', synergyBias: 'guardian' },
        { budget: 26, maxCost: 4, count: 6, elementBias: 'earth', synergyBias: 'vanguard' },
        { budget: 30, maxCost: 5, count: 7, elementBias: 'earth', synergyBias: 'guardian' }
    ],
    rewards: { gold: 360, xp: 800 }
},
// Mission 11
{
    id: 'story_11',
    name: 'Storm\'s Eye',
    description: 'Wind assassins and snipers strike from every direction.',
    requiredLevel: 14,
    waves: [
        { budget: 24, maxCost: 4, count: 6, elementBias: 'wind', synergyBias: 'predator' },
        { budget: 28, maxCost: 5, count: 6, elementBias: 'wind', synergyBias: 'striker' },
        { budget: 32, maxCost: 5, count: 7, elementBias: 'wind', synergyBias: 'predator' }
    ],
    rewards: { gold: 400, xp: 900 }
},
// Mission 12 — Mixed elements, enemies start having synergies active
{
    id: 'story_12',
    name: 'The Convergence',
    description: 'Forces from all four elements collide. Enemy squads fight with coordinated synergies.',
    requiredLevel: 16,
    waves: [
        { budget: 28, maxCost: 5, count: 6, synergyBias: 'striker', enemySynergies: true },
        { budget: 32, maxCost: 5, count: 7, synergyBias: 'guardian', enemySynergies: true },
        { budget: 36, maxCost: 5, count: 7, enemySynergies: true },
        { budget: 40, maxCost: 5, count: 7, enemySynergies: true }
    ],
    rewards: { gold: 480, xp: 1100 }
},
// Mission 13 — Enemies can have evolved forms
{
    id: 'story_13',
    name: 'Ascended Warfront',
    description: 'The enemy has discovered evolution. Their champions have transcended mortal limits.',
    requiredLevel: 18,
    waves: [
        { budget: 32, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
        { budget: 36, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
        { budget: 40, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
        { budget: 45, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true }
    ],
    rewards: { gold: 560, xp: 1300 }
},
// Mission 14 — Final boss: all systems active, 5 waves
{
    id: 'story_14',
    name: 'The Eternal Throne',
    description: 'The ultimate challenge. Evolved champions with full synergies guard the throne.',
    requiredLevel: 20,
    waves: [
        { budget: 35, maxCost: 5, count: 6, enemySynergies: true, enemyEvolutions: true },
        { budget: 40, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
        { budget: 45, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
        { budget: 50, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true },
        { budget: 60, maxCost: 5, count: 7, enemySynergies: true, enemyEvolutions: true }
    ],
    rewards: { gold: 700, xp: 1800 }
}
```

### Wave Config Extensions

New optional fields on wave configs:
- `elementBias: 'fire'` — 70% of units are drawn from this element (30% random)
- `synergyBias: 'striker'` — 60% of units are drawn from this archetype (40% random/biased)
- `enemySynergies: true` — enemy team gets archetype synergy bonuses applied (same as player)
- `enemyEvolutions: true` — eligible enemy units evolve at wave start (use same `checkEvolution` logic)

If both `elementBias` and `synergyBias` are set, first filter by element, then prefer archetype within that.

---

## Part 2: Enemy Synergies & Evolutions (missions.js + main-v2.js)

### Modified `generateMissionWave(waveConfig)`

Update the wave generation function to handle the new wave config fields:

```js
function generateMissionWave(waveConfig) {
    var enemies = [];
    var remaining = waveConfig.budget;
    var targetCount = waveConfig.count;
    var maxCost = waveConfig.maxCost;

    // Build pool — apply element and synergy biases
    var pool = [];
    var biasedPool = [];

    for (var i = 0; i < SHOP_POOL_KEYS.length; i++) {
        var key = SHOP_POOL_KEYS[i];
        var tmpl = UNIT_TEMPLATES[key];
        if (!tmpl || tmpl.cost > maxCost) continue;
        pool.push(key);

        // Check if unit matches biases
        var matchesElem = !waveConfig.elementBias || tmpl.element === waveConfig.elementBias;
        var matchesSyn = !waveConfig.synergyBias || tmpl.archetype === waveConfig.synergyBias;

        if (matchesElem && matchesSyn) {
            biasedPool.push(key);
            biasedPool.push(key); // Double weight for matching both
        } else if (matchesElem || matchesSyn) {
            biasedPool.push(key);
        }
    }

    if (pool.length === 0) return enemies;

    // Use biased pool if available, else fall back to full pool
    var usePool = biasedPool.length > 0 ? biasedPool : pool;

    // Fill enemy slots
    for (var e = 0; e < targetCount && remaining > 0; e++) {
        var affordable = [];
        for (var j = 0; j < usePool.length; j++) {
            if (UNIT_TEMPLATES[usePool[j]].cost <= remaining) {
                affordable.push(usePool[j]);
            }
        }
        // Fallback to full pool if biased pool has no affordable options
        if (affordable.length === 0) {
            for (var jj = 0; jj < pool.length; jj++) {
                if (UNIT_TEMPLATES[pool[jj]].cost <= remaining) {
                    affordable.push(pool[jj]);
                }
            }
        }
        if (affordable.length === 0) break;

        var pick = affordable[Math.floor(Math.random() * affordable.length)];
        remaining -= UNIT_TEMPLATES[pick].cost;

        var unit = createUnit(pick, 1);
        if (unit) {
            unit.isEnemy = true;
            // Later missions: boost star level slightly
            if (maxCost >= 4 && Math.random() < 0.3) {
                unit.stars = 2;
                var mult2 = getStarMultiplier(2);
                var tmpl2 = UNIT_TEMPLATES[pick];
                unit.hp = Math.floor(tmpl2.hp * mult2);
                unit.maxHp = Math.floor(tmpl2.hp * mult2);
                unit.attack = Math.floor(tmpl2.attack * mult2);
            }
            enemies.push(unit);
        }
    }

    return enemies;
}
```

### Apply Enemy Synergies in Combat (main-v2.js)

In `startMissionCombat`, after generating the enemy wave, if `waveConfig.enemySynergies` is true:

1. Calculate archetype counts for the enemy team
2. Apply synergy bonuses to enemy units (same `applySynergyBonuses` function)
3. Also apply element synergy bonuses to enemies (new helper)

```js
// After enemies are generated and placed, if enemySynergies is true:
if (waveConfig.enemySynergies) {
    // Calculate enemy archetype counts
    var enemyArchCounts = {};
    var enemyElemCounts = {};
    for (var i = 0; i < enemies.length; i++) {
        var eu = enemies[i];
        if (eu.archetype) enemyArchCounts[eu.archetype] = (enemyArchCounts[eu.archetype] || 0) + 1;
        if (eu.element) enemyElemCounts[eu.element] = (enemyElemCounts[eu.element] || 0) + 1;
    }

    // Apply archetype synergy bonuses to enemy units
    applySynergyBonuses(enemies, enemyArchCounts);

    // Apply element synergy bonuses to enemies
    applyEnemyElementBonuses(enemies, enemyElemCounts);
}
```

### Apply Enemy Evolutions

If `waveConfig.enemyEvolutions` is true, after generating enemies, check evolution criteria for each. Build a fake game-state with enemy archetype counts for the synergy check:

```js
if (waveConfig.enemyEvolutions) {
    var fakeGS = { activeSynergies: enemyArchCounts };
    for (var ev = 0; ev < enemies.length; ev++) {
        if (enemies[ev].stars >= 2 || Math.random() < 0.25) {
            // Give some enemies enough stars to potentially evolve
            if (enemies[ev].stars < 2) enemies[ev].stars = 2;
            // Recalc stats for star boost
            var evTmpl = UNIT_TEMPLATES[enemies[ev].key];
            if (evTmpl) {
                var evMult = getStarMultiplier(enemies[ev].stars);
                enemies[ev].hp = Math.floor(evTmpl.hp * evMult);
                enemies[ev].maxHp = Math.floor(evTmpl.hp * evMult);
                enemies[ev].attack = Math.floor(evTmpl.attack * evMult);
            }
            checkEvolution(enemies[ev], fakeGS);
        }
    }
}
```

### New Helper: `applyEnemyElementBonuses(enemies, elemCounts)`

Add to `main-v2.js`. Works like `applyElementBonuses` but applies to the enemy array instead of player units:

```js
function applyEnemyElementBonuses(enemies, elemCounts) {
    var elemKeys = Object.keys(elemCounts);

    for (var i = 0; i < elemKeys.length; i++) {
        var ek = elemKeys[i];
        var syn = ELEMENT_SYNERGIES[ek];
        if (!syn) continue;
        var count = elemCounts[ek];
        var tierReached = -1;
        for (var t = 0; t < syn.thresholds.length; t++) {
            if (count >= syn.thresholds[t]) tierReached = t;
        }
        if (tierReached < 0) continue;
        var bonus = syn.bonuses[tierReached];

        // Fire: add burn damage to enemies
        if (ek === 'fire' && bonus.burnDamage) {
            for (var f = 0; f < enemies.length; f++) {
                enemies[f].burnDamage = bonus.burnDamage;
                if (bonus.killAoE) enemies[f].killAoE = bonus.killAoE;
            }
        }

        // Earth: shield + DR for enemies
        if (ek === 'earth') {
            for (var e = 0; e < enemies.length; e++) {
                if (bonus.shieldPct) {
                    enemies[e].shield = (enemies[e].shield || 0) + Math.floor(enemies[e].maxHp * bonus.shieldPct);
                }
                if (bonus.damageReduction) {
                    enemies[e].damageReduction = (enemies[e].damageReduction || 0) + bonus.damageReduction;
                }
            }
        }

        // Wind: speed boost + dodge for enemies
        if (ek === 'wind') {
            var spdFactor = 1 + (bonus.allySpdBoost || 0);
            for (var v = 0; v < enemies.length; v++) {
                enemies[v].attackSpd = enemies[v].attackSpd / spdFactor;
                if (bonus.dodgeChance) enemies[v].dodgeChance = bonus.dodgeChance;
            }
        }

        // Water slow is applied to PLAYER units, not enemies — skip for enemy bonuses
        // (Water enemy synergy: slow the player's units)
        // This is already handled by the player-side water logic but in reverse:
        if (ek === 'water') {
            // Enemy water synergy slows player units — this is handled differently
            // Store it on the combat state for application in initCombat
            // For simplicity: skip water for now, or store as a flag
        }
    }
}
```

### Display Enemy Synergies in Combat UI

In the wave info display (combat screen), when enemies have active synergies, show a small indicator:
```
"Wave 2/4 — 🔥×4 ⚔️×3 active"
```

Add this to `startWaveCombat` in `ui-v2.js`:
- After generating enemies, if the wave config has `enemySynergies`, count enemy archetypes/elements
- Show active enemy synergies next to the wave info text in a small muted line

### Show Evolved Enemies in Combat Grid

Evolved enemies already have their `evolved: true` flag and updated emoji from `checkEvolution`. The existing combat renderer in `renderCombatBoard` should already show the updated emoji. But add the golden glow CSS class for evolved enemies too:

In `renderCombatUnitCell` (ui-v2.js), wherever you check `unit.evolved` for the golden glow, make sure it applies to BOTH player and enemy units, not just player units.

---

## Part 3: Sell Duplicate Units (save.js + ui-v2.js)

### Sell Value Formula

```js
// In save.js or a convenient location:
function getSellGoldValue(templateKey, copiesCount) {
    // Sell copies at a rate based on unit cost
    // Each copy is worth: unitCost × 3 gold
    var tmpl = UNIT_TEMPLATES[templateKey];
    if (!tmpl) return 0;
    return copiesCount * tmpl.cost * 3;
}
```

### Sell Function (save.js)

```js
function sellUnitCopies(saveData, templateKey, count) {
    var entry = saveData.collection[templateKey];
    if (!entry) return false;
    if (count > entry.copiesForNext) return false;
    if (count <= 0) return false;

    var goldEarned = getSellGoldValue(templateKey, count);
    entry.copiesForNext -= count;
    earnGold(saveData, goldEarned);
    autoSave(saveData);
    return goldEarned;
}
```

### Sell UI (ui-v2.js)

Add a "Sell" button to each roster card that has `copiesForNext > 0`. When clicked:

1. Show the gold value: "Sell 1 copy for Xg?" with +1 / +5 / All / Cancel buttons
2. The sell count starts at 1 but can be increased
3. Show gold preview: `copiesCount × unitCost × 3 = total gold`
4. On confirm: call `sellUnitCopies`, refresh roster, refresh top bar

Implementation approach for the UI:
- Add a sell button on each roster card (next to the star-up button area)
- Button text: `💰 Sell (X copies)` where X = copiesForNext
- Clicking opens a small inline panel or modal showing:
  - Current copies: X
  - Sell amount: [1] [5] [All]
  - Gold earned: Y
  - [Confirm Sell] [Cancel]
- After selling, re-render the roster screen

```js
// Add to roster card rendering, after the star-up button:
if (r.copiesForNext > 0) {
    html += '<button class="sell-btn" data-key="' + r.key +
        '" data-copies="' + r.copiesForNext + '">💰 Sell (' +
        r.copiesForNext + ' copies)</button>';
}
```

### Sell Panel

When the sell button is clicked, show a small sell panel:

```js
function showSellPanel(unitKey) {
    var sd = getSaveData();
    var entry = sd.collection[unitKey];
    if (!entry || entry.copiesForNext <= 0) return;

    var tmpl = UNIT_TEMPLATES[unitKey];
    var maxCopies = entry.copiesForNext;
    var sellCount = 1;

    // Create or reuse sell overlay
    var overlay = document.getElementById('sell-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sell-overlay';
        document.body.appendChild(overlay);
    }

    function updateSellPanel() {
        var goldValue = getSellGoldValue(unitKey, sellCount);
        overlay.innerHTML =
            '<div class="sell-panel">' +
                '<div class="sell-title">Sell ' + tmpl.name + ' Copies</div>' +
                '<div class="sell-info">Available: ' + maxCopies + ' copies</div>' +
                '<div class="sell-amount">' +
                    '<button class="sell-amt-btn" data-amt="1">1</button>' +
                    '<button class="sell-amt-btn" data-amt="5">5</button>' +
                    '<button class="sell-amt-btn" data-amt="' + maxCopies + '">All (' + maxCopies + ')</button>' +
                '</div>' +
                '<div class="sell-preview">Selling ' + sellCount + ' → 💰 ' + goldValue + 'g</div>' +
                '<div class="sell-actions">' +
                    '<button id="sell-confirm" class="btn-green">Confirm Sell</button>' +
                    '<button id="sell-cancel">Cancel</button>' +
                '</div>' +
            '</div>';

        // Bind amount buttons
        var amtBtns = overlay.querySelectorAll('.sell-amt-btn');
        for (var i = 0; i < amtBtns.length; i++) {
            amtBtns[i].onclick = function() {
                sellCount = Math.min(parseInt(this.getAttribute('data-amt')), maxCopies);
                updateSellPanel();
            };
        }

        document.getElementById('sell-confirm').onclick = function() {
            var earned = sellUnitCopies(sd, unitKey, sellCount);
            if (earned !== false) {
                overlay.style.display = 'none';
                renderRosterScreen();
                renderTopBar();
            }
        };

        document.getElementById('sell-cancel').onclick = function() {
            overlay.style.display = 'none';
        };
    }

    overlay.style.display = 'flex';
    updateSellPanel();
}
```

### CSS for Sell Panel

Add these styles to `game-v2.html`:

```css
#sell-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7);
    justify-content: center;
    align-items: center;
    z-index: 1000;
}
.sell-panel {
    background: #1a1a2e;
    border: 1px solid #444;
    border-radius: 8px;
    padding: 20px;
    min-width: 280px;
    text-align: center;
}
.sell-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
.sell-info { color: #aaa; font-size: 13px; margin-bottom: 12px; }
.sell-amount { margin-bottom: 12px; }
.sell-amt-btn {
    background: #2a2a3e;
    border: 1px solid #555;
    color: #fff;
    padding: 6px 14px;
    margin: 0 4px;
    border-radius: 4px;
    cursor: pointer;
}
.sell-amt-btn:hover { background: #3a3a5e; }
.sell-preview { font-size: 15px; color: #e2b714; margin-bottom: 14px; }
.sell-actions button { margin: 0 6px; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
.btn-green { background: #44aa44; border: none; color: #fff; }
.btn-green:hover { background: #55bb55; }
#sell-cancel { background: #555; border: none; color: #fff; }
#sell-cancel:hover { background: #666; }
```

---

## Part 4: Grind Mission Improvements (missions.js)

Update `generateGrindMission` so that at higher player levels, grind missions also use the new features:

```js
function generateGrindMission(playerLevel) {
    var difficulty = Math.max(1, playerLevel);
    var waveCount = Math.min(5, 1 + Math.floor(difficulty / 4));
    var maxCost = Math.min(5, 1 + Math.floor(difficulty / 3));

    // Element bias for flavor (random per grind mission)
    var elements = ['fire', 'water', 'earth', 'wind'];
    var grindElement = elements[Math.floor(Math.random() * elements.length)];

    var waves = [];
    for (var w = 0; w < waveCount; w++) {
        var budget = Math.floor(3 + difficulty * 1.5 + w * 2);
        var count = Math.min(7, 2 + Math.floor(difficulty / 3) + w);
        var waveObj = { budget: budget, maxCost: maxCost, count: count };

        // At level 10+: 50% chance of element bias per wave
        if (playerLevel >= 10 && Math.random() < 0.5) {
            waveObj.elementBias = grindElement;
        }

        // At level 14+: enemy synergies on later waves
        if (playerLevel >= 14 && w >= waveCount - 2) {
            waveObj.enemySynergies = true;
        }

        // At level 18+: enemy evolutions on last wave
        if (playerLevel >= 18 && w === waveCount - 1) {
            waveObj.enemyEvolutions = true;
        }

        waves.push(waveObj);
    }

    var baseGold = Math.floor(20 + difficulty * 8);
    var baseXP = Math.floor(30 + difficulty * 12);

    // Name reflects element if biased
    var name = playerLevel >= 10
        ? ELEMENTS[grindElement].emoji + ' Training Grounds Lv.' + difficulty
        : 'Training Grounds Lv.' + difficulty;

    return {
        id: 'grind_' + playerLevel + '_' + Date.now(),
        name: name,
        description: 'Repeatable combat encounter for gold and experience.',
        requiredLevel: 1,
        waves: waves,
        rewards: { gold: baseGold, xp: baseXP },
        isGrind: true
    };
}
```

---

## Part 5: Wire It All Together

### In `startWaveCombat` (ui-v2.js)

Store the wave config on the combat enemies so `startMissionCombat` can use it:

```js
function startWaveCombat() {
    var waveConfig = getCurrentWave();
    if (!waveConfig) return;

    var progress = getMissionProgress();
    document.getElementById('wave-info').textContent =
        progress.missionName + ' — Wave ' + progress.currentWave + ' / ' + progress.totalWaves;

    // Generate enemies
    combatEnemies = generateMissionWave(waveConfig);

    // Store wave config for combat init to read
    currentWaveConfig = waveConfig;

    // Clear log
    var logEl = document.getElementById('combat-log');
    logEl.innerHTML = '';
    addLogEntry('⚔️ Wave ' + progress.currentWave + ' begins!', 'info');

    // Start combat
    startMissionCombat(combatBoard, combatEnemies);
}
```

### In `startMissionCombat` (ui-v2.js)

After generating the game state and before `initCombat(gs)`:

```js
// Apply enemy synergies and evolutions if wave config says so
var wc = currentWaveConfig;
if (wc && (wc.enemySynergies || wc.enemyEvolutions)) {
    var enemyArchCounts = {};
    var enemyElemCounts = {};
    for (var si = 0; si < enemies.length; si++) {
        var su = enemies[si];
        if (su.archetype) enemyArchCounts[su.archetype] = (enemyArchCounts[su.archetype] || 0) + 1;
        if (su.element) enemyElemCounts[su.element] = (enemyElemCounts[su.element] || 0) + 1;
    }

    if (wc.enemyEvolutions) {
        var fakeGS = { activeSynergies: enemyArchCounts };
        for (var ev = 0; ev < enemies.length; ev++) {
            // Boost some enemies to star 2 for evolution eligibility
            if (enemies[ev].stars < 2 && Math.random() < 0.4) {
                enemies[ev].stars = 2;
                var evTmpl = UNIT_TEMPLATES[enemies[ev].key];
                if (evTmpl) {
                    var evMult = getStarMultiplier(2);
                    enemies[ev].hp = Math.floor(evTmpl.hp * evMult);
                    enemies[ev].maxHp = Math.floor(evTmpl.hp * evMult);
                    enemies[ev].attack = Math.floor(evTmpl.attack * evMult);
                }
            }
            checkEvolution(enemies[ev], fakeGS);
        }
        // Recalculate counts after evolutions
        enemyArchCounts = {};
        enemyElemCounts = {};
        for (var ri = 0; ri < enemies.length; ri++) {
            if (enemies[ri].archetype) enemyArchCounts[enemies[ri].archetype] = (enemyArchCounts[enemies[ri].archetype] || 0) + 1;
            if (enemies[ri].element) enemyElemCounts[enemies[ri].element] = (enemyElemCounts[enemies[ri].element] || 0) + 1;
        }
    }

    if (wc.enemySynergies) {
        applySynergyBonuses(enemies, enemyArchCounts);
        applyEnemyElementBonuses(enemies, enemyElemCounts);
    }

    // Show enemy synergy info in combat log
    var synText = [];
    var archKeys2 = Object.keys(enemyArchCounts);
    for (var sk = 0; sk < archKeys2.length; sk++) {
        var aKey2 = archKeys2[sk];
        var aData2 = ARCHETYPES[aKey2];
        if (aData2) {
            var cnt2 = enemyArchCounts[aKey2];
            for (var tt = 0; tt < aData2.thresholds.length; tt++) {
                if (cnt2 >= aData2.thresholds[tt]) {
                    synText.push(aData2.emoji + aData2.name + '(' + cnt2 + ')');
                }
            }
        }
    }
    if (synText.length > 0) {
        addLogEntry('⚠️ Enemy synergies active: ' + synText.join(', '), 'warning');
    }
}
```

### War Room Intel for New Missions

The War Room intel display in `renderMissionSelectScreen` already shows wave counts, budgets, and unit pools. For missions 8+, also show the bias info:

- Intel Level 2+: show element bias if present (e.g., "Fire-aligned")
- Intel Level 3: show enemy synergy/evolution flags (e.g., "⚠️ Enemy synergies active")

---

## Code Quality Notes

- All functions go in global scope (no ES modules)
- Use `var` not `let`/`const`
- Keep `currentWaveConfig` as a global variable (same pattern as other combat state)
- Enemy synergy bonuses use the SAME `applySynergyBonuses` function the player uses — no duplication
- `checkEvolution` works on enemy units the same way it works on player units — it just needs a `gs.activeSynergies` object
- The sell overlay uses the same styling patterns as the rest of the game (dark theme, gold accent)

---

## Testing Checklist

- [ ] All 14 story missions are visible (locked/unlocked based on level)
- [ ] Missions 1–7 work exactly as before (no regression)
- [ ] Mission 8: enemies are mostly fire-element (check visually)
- [ ] Mission 10: enemies are mostly earth guardians (tanky fight)
- [ ] Mission 12: enemies have synergy bonuses (visible in combat log)
- [ ] Mission 13: some enemies show as evolved (golden glow + evolved emoji)
- [ ] Mission 14: all systems active, 5 waves, very hard
- [ ] Grind missions at level 14+ have enemy synergies on later waves
- [ ] Grind missions at level 18+ have enemy evolutions on last wave
- [ ] Roster shows sell button when a unit has copies > 0
- [ ] Selling 1 copy gives correct gold (cost × 3)
- [ ] Selling 5 copies: deducts 5 copies, gives 5 × cost × 3 gold
- [ ] Selling "All": clears all copies, gives correct gold
- [ ] Can't sell more copies than available
- [ ] After selling, copies count updates, gold updates
- [ ] War Room intel shows element bias on biased missions
- [ ] War Room intel level 3 shows synergy/evolution warnings
- [ ] Old saves load correctly (no migration needed — mission definitions are just data)
- [ ] Reset game works correctly with all new features
