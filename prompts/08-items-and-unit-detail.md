# Prompt 08 — Item Selling, Warehouse Bench Expansion, Unit Detail Panel

## Context

You're working on a browser-based gacha auto-battler game (V2). The codebase uses **modular JS via global scope** — NO ES modules, NO import/export. All files are loaded via `<script>` tags in `game-v2.html`.

**Load order**: `units.js → save.js → gacha.js → teams.js → hub.js → items.js → missions.js → ui-v2.js → main-v2.js`

This prompt adds three features:
1. **Item selling** — sell items from the bench for gold
2. **Warehouse-linked bench size** — Warehouse upgrades also expand item bench slots
3. **Unit detail panel** — a full-info side panel when clicking units in team builder AND roster/collection, showing stats, skills, items, evolution path, and combat behavior

---

## Part 1: Item Selling (items.js + ui-v2.js)

### Sell Value Formula (items.js)

```js
function getItemSellValue(item) {
    if (item.type === 'component') {
        // Component sell value: base 5g, scaled by rarity
        // standard: 5g, uncommon: 10g, rare: 20g, epic: 40g
        var rarityMultipliers = { standard: 1, uncommon: 2, rare: 4, epic: 8 };
        var mult = rarityMultipliers[item.rarity] || 1;
        return 5 * mult;
    } else if (item.type === 'combined') {
        // Combined item: sum of what both components would be worth, +50% bonus
        var rarityMultipliers2 = { standard: 1, uncommon: 2, rare: 4, epic: 8 };
        var v1 = 5 * (rarityMultipliers2[item.comp1Rarity] || 1);
        var v2 = 5 * (rarityMultipliers2[item.comp2Rarity] || 1);
        return Math.floor((v1 + v2) * 1.5);
    }
    return 5;
}

function sellItem(saveData, itemId) {
    // Can't sell equipped items
    var item = null;
    for (var i = 0; i < saveData.items.bench.length; i++) {
        if (saveData.items.bench[i].id === itemId) {
            item = saveData.items.bench[i];
            break;
        }
    }
    if (!item) return false;
    if (item.equipped) return false; // Must unequip first

    var goldValue = getItemSellValue(item);
    removeItemFromBench(saveData, itemId);
    earnGold(saveData, goldValue);
    autoSave(saveData);
    return goldValue;
}
```

### Sell UI in Item Bench (ui-v2.js)

In the item detail panel (`uiSelectBenchItem`), add a sell button for unequipped items:

After the existing detail info, add:
```js
// If item is NOT equipped, show sell button
if (!item.equipped) {
    var sellValue = getItemSellValue(item);
    html += '<button onclick="uiSellItem(\'' + item.id + '\')" ' +
        'style="margin-top:6px; font-size:11px; padding:4px 12px; background:#553322; color:#e2b714; ' +
        'border:1px solid #886633; border-radius:4px; cursor:pointer;">' +
        '💰 Sell for ' + sellValue + 'g</button>';
}
```

Add the sell handler:
```js
function uiSellItem(itemId) {
    var sd = getSaveData();
    var gold = sellItem(sd, itemId);
    if (gold !== false) {
        selectedBenchItem = null;
        document.getElementById('item-detail-panel').style.display = 'none';
        renderItemBench();
        renderTopBar();
    }
}
```

### Also add sell button in team builder item bar

When hovering/clicking an unequipped item in the team builder item bar, show a small sell option. The simplest approach: add a right-click or secondary action.

Better approach: in the team builder item bar tooltip (the `title` attribute), show the sell value. And add a dedicated "Sell Mode" toggle:

Add a small toggle button at the top of the item bar:
```js
var sellModeHtml = '<button id="item-sell-mode-btn" onclick="toggleItemSellMode()" ' +
    'style="font-size:10px; padding:2px 8px; margin-left:8px; background:' +
    (itemSellMode ? '#553322' : '#2a2a3e') + '; color:' +
    (itemSellMode ? '#e2b714' : '#888') + '; border:1px solid #555; border-radius:4px; cursor:pointer;">' +
    (itemSellMode ? '💰 Sell Mode ON' : '💰 Sell') + '</button>';
```

When `itemSellMode` is true, clicking a bench item in the team builder sells it instead of entering equip mode. Show a confirmation: "Sold [item name] for Xg!"

```js
var itemSellMode = false;

function toggleItemSellMode() {
    itemSellMode = !itemSellMode;
    equipModeItemId = null; // exit equip mode
    renderTeamBuilderItemBar();
}
```

In the item click handler within `renderTeamBuilderItemBar`, check sell mode:
```js
if (itemSellMode) {
    var sd = getSaveData();
    var gold = sellItem(sd, itemObj.id);
    if (gold !== false) {
        // Brief visual feedback — could flash gold text
        renderTeamBuilderItemBar();
        renderTopBar();
    }
    return;
}
```

---

## Part 2: Warehouse-Linked Bench Expansion (hub.js + items.js + save.js)

### Update Warehouse Building (hub.js)

Change the Warehouse effects to include bench size bonus:

```js
warehouse: {
    name: 'Warehouse',
    emoji: '📦',
    description: 'Bonus gold from missions + more item storage',
    maxLevel: 5,
    upgradeCosts: [0, 50, 120, 300, 600, 1000],
    effects: [
        'Standard gold, 10 item slots',
        '+5% gold, 12 item slots',
        '+10% gold, 14 item slots',
        '+15% gold, 16 item slots',
        '+20% gold, 18 item slots',
        '+25% gold, 20 item slots'
    ]
}
```

### Add Bench Size Getter (hub.js or items.js)

```js
function getItemBenchSize(saveData) {
    var warehouseLevel = getBuildingLevel(saveData, 'warehouse');
    return 10 + (warehouseLevel * 2); // 10 base + 2 per level, max 20 at level 5
}
```

### Update isBenchFull and addItemToBench (items.js)

Replace the hardcoded `benchSize` check with the dynamic getter:

```js
function isBenchFull(saveData) {
    if (!saveData.items) return true;
    return saveData.items.bench.length >= getItemBenchSize(saveData);
}

function addItemToBench(saveData, item) {
    if (!saveData.items) return false;
    if (saveData.items.bench.length >= getItemBenchSize(saveData)) return false;
    saveData.items.bench.push(item);
    return true;
}
```

### Update Item Bench UI (ui-v2.js)

In `renderItemBench`, use the dynamic bench size:

```js
var benchSize = getItemBenchSize(sd);
info.textContent = 'Items: ' + bench.length + ' / ' + benchSize;

// Fill empty slots using dynamic size
var empty = benchSize - bench.length;
```

Also update the team builder item bar to show capacity:
```js
html = '<div style="font-size:12px; color:#888; margin-bottom:4px;">🎒 Item Bench (' +
    unequipped.length + ' available, ' + bench.length + '/' + getItemBenchSize(sd) + ' total)</div>';
```

### Migration Note

The `saveData.items.benchSize` field is now ignored in favor of `getItemBenchSize()`. No migration needed — the old field can remain but is unused. The dynamic function takes precedence everywhere.

---

## Part 3: Unit Detail Panel (ui-v2.js)

### Overview

Add a detail panel that opens when clicking a unit in the **team builder roster list** or the **collection/roster screen**. The panel shows:

1. **Header**: Unit name, element, archetype, stars, cost
2. **Combat Behavior**: Description of what this unit type does in combat
3. **Base Stats** vs **Star-Scaled Stats**: side by side
4. **Item Bonuses**: list of equipped items and their stat contributions
5. **Synergy Bonuses**: what archetype/element synergies affect this unit (in team builder, based on current team)
6. **Evolution Path**: if this unit can evolve, show criteria, progress, and evolved form stats/ability
7. **Evolved Ability**: description of what the evolved form does

### Combat Behavior Descriptions

Add a lookup object for unit type combat behaviors. These describe what each `type` does mechanically:

```js
var UNIT_TYPE_DESCRIPTIONS = {
    warrior: {
        name: 'Warrior',
        desc: 'Melee fighter. Moves toward the nearest enemy and attacks at close range. Solid all-around stats with decent HP and attack.'
    },
    tank: {
        name: 'Tank',
        desc: 'Frontline defender. Moves toward enemies slowly but absorbs enormous damage. Low attack speed but very high HP. Place in front row to shield your team.'
    },
    archer: {
        name: 'Archer',
        desc: 'Ranged attacker. Fires from a distance (range 3-5). Lower HP but fast attack speed and strong sustained damage. Keep in back rows behind tanks.'
    },
    mage: {
        name: 'Mage',
        desc: 'Ranged magical damage dealer. Attacks from range with moderate speed. Deals element-typed damage, making element matchups extra important. Fragile but powerful.'
    },
    assassin: {
        name: 'Assassin',
        desc: 'Fastest unit type. Dashes to the enemy backline to eliminate squishy targets like archers and healers. Very high move speed, fast attacks, but low HP.'
    },
    healer: {
        name: 'Healer',
        desc: 'Targets the lowest-HP ally instead of enemies. Heals rather than deals damage. Slow attack speed but essential for sustaining your team through multi-wave fights.'
    }
};
```

Put this in `units.js` so it's available globally.

### Detail Panel HTML Structure

Add a fixed overlay/panel to `game-v2.html`:

```html
<!-- Unit Detail Panel (shared between roster and team builder) -->
<div id="unit-detail-overlay" style="display:none;">
    <div id="unit-detail-panel">
        <button id="unit-detail-close" onclick="closeUnitDetail()">✕</button>
        <div id="unit-detail-content"></div>
    </div>
</div>
```

### CSS for Detail Panel

Add to `game-v2.html`:

```css
#unit-detail-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7);
    z-index: 900;
    justify-content: center;
    align-items: center;
}
#unit-detail-overlay[style*="display: flex"],
#unit-detail-overlay[style*="display:flex"] {
    display: flex !important;
}
#unit-detail-panel {
    background: #1a1a2e;
    border: 1px solid #444;
    border-radius: 10px;
    padding: 20px;
    max-width: 420px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
}
#unit-detail-close {
    position: absolute;
    top: 8px;
    right: 12px;
    background: none;
    border: none;
    color: #888;
    font-size: 18px;
    cursor: pointer;
}
#unit-detail-close:hover { color: #fff; }

.ud-header {
    text-align: center;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid #333;
}
.ud-name { font-size: 20px; font-weight: bold; }
.ud-stars { font-size: 16px; margin: 4px 0; }
.ud-meta { font-size: 12px; color: #aaa; }

.ud-section {
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid #222;
}
.ud-section:last-child { border-bottom: none; }
.ud-section-title {
    font-size: 13px;
    font-weight: bold;
    color: #e2b714;
    margin-bottom: 6px;
}
.ud-stat-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    padding: 2px 0;
}
.ud-stat-label { color: #aaa; }
.ud-stat-value { color: #fff; }
.ud-stat-bonus { color: #6bcb77; font-size: 11px; }

.ud-type-desc {
    font-size: 12px;
    color: #bbb;
    line-height: 1.4;
    font-style: italic;
}

.ud-item-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    padding: 3px 0;
}

.ud-evo-box {
    background: #16213e;
    border-radius: 6px;
    padding: 8px;
}
.ud-evo-met { color: #6bcb77; }
.ud-evo-unmet { color: #e2b714; }
.ud-evo-ability {
    font-size: 12px;
    color: #8bbcff;
    margin-top: 4px;
}
```

### Detail Panel Rendering Function (ui-v2.js)

```js
function showUnitDetail(unitKey, context) {
    // context: 'roster' or 'team-builder'
    var sd = getSaveData();
    var entry = sd.collection[unitKey];
    if (!entry) return;

    var tmpl = UNIT_TEMPLATES[unitKey];
    if (!tmpl) return;

    var stars = entry.stars;
    var statMult = getStarMultiplier(stars);
    var scaledHP = Math.floor(tmpl.hp * statMult);
    var scaledATK = Math.floor(tmpl.attack * statMult);

    var elemData = ELEMENTS[tmpl.element];
    var archData = ARCHETYPES[tmpl.archetype];
    var typeData = UNIT_TYPE_DESCRIPTIONS[tmpl.type];

    var starsStr = '';
    for (var s = 0; s < stars; s++) starsStr += '⭐';

    var html = '';

    // ---- Header ----
    html += '<div class="ud-header">';
    html += '<div class="ud-name">' + elemData.emoji + ' ' + tmpl.name + ' ' + archData.emoji + '</div>';
    html += '<div class="ud-stars">' + starsStr + ' (Cost ' + tmpl.cost + ')</div>';
    html += '<div class="ud-meta">' + elemData.name + ' ' + archData.name + ' ' + (typeData ? typeData.name : tmpl.type) + '</div>';
    html += '</div>';

    // ---- Combat Behavior ----
    if (typeData) {
        html += '<div class="ud-section">';
        html += '<div class="ud-section-title">⚔️ Combat Behavior — ' + typeData.name + '</div>';
        html += '<div class="ud-type-desc">' + typeData.desc + '</div>';
        html += '</div>';
    }

    // ---- Stats ----
    html += '<div class="ud-section">';
    html += '<div class="ud-section-title">📊 Stats</div>';

    html += '<div class="ud-stat-row"><span class="ud-stat-label">HP</span><span class="ud-stat-value">' +
        scaledHP + ' <span style="color:#666; font-size:10px;">(base ' + tmpl.hp + ' × ' + statMult.toFixed(2) + ')</span></span></div>';
    html += '<div class="ud-stat-row"><span class="ud-stat-label">Attack</span><span class="ud-stat-value">' +
        scaledATK + ' <span style="color:#666; font-size:10px;">(base ' + tmpl.attack + ')</span></span></div>';
    html += '<div class="ud-stat-row"><span class="ud-stat-label">Attack Speed</span><span class="ud-stat-value">' +
        tmpl.attackSpd + 's</span></div>';
    html += '<div class="ud-stat-row"><span class="ud-stat-label">Range</span><span class="ud-stat-value">' +
        tmpl.range + '</span></div>';
    html += '<div class="ud-stat-row"><span class="ud-stat-label">Move Speed</span><span class="ud-stat-value">' +
        tmpl.moveSpd + '</span></div>';

    // ---- Element Matchup ----
    html += '<div style="margin-top:6px; font-size:11px; color:#aaa;">';
    html += 'Strong vs ' + ELEMENTS[elemData.strong].emoji + ' ' + ELEMENTS[elemData.strong].name + ' (1.3×) · ';
    html += 'Weak vs ' + ELEMENTS[elemData.weak].emoji + ' ' + ELEMENTS[elemData.weak].name + ' (0.7×)';
    html += '</div>';
    html += '</div>';

    // ---- Equipped Items ----
    var equippedItems = getEquippedItems(sd, unitKey);
    if (equippedItems.length > 0) {
        html += '<div class="ud-section">';
        html += '<div class="ud-section-title">🎒 Equipped Items</div>';
        for (var i = 0; i < equippedItems.length; i++) {
            var item = equippedItems[i];
            var rarityColor = getItemRarityColor(item);
            html += '<div class="ud-item-row">';
            html += '<span style="font-size:16px;">' + getItemEmoji(item) + '</span>';
            html += '<span style="color:' + rarityColor + ';">' + getItemName(item) + '</span>';
            html += '<span style="color:#aaa; font-size:11px;">(' + getItemStatDescription(item) + ')</span>';
            html += '</div>';
        }
        html += '</div>';
    }

    // ---- Synergies (team builder context) ----
    if (context === 'team-builder') {
        var preview = previewTeamSynergies(sd);
        var relevantSynergies = [];

        // Archetype synergy for this unit
        var archCount = preview.archetypeCounts[tmpl.archetype] || 0;
        if (archCount > 0) {
            var activeSyn = preview.activeSynergies[tmpl.archetype];
            var tierReached = activeSyn ? activeSyn.tier : 0;
            var synStatus = tierReached > 0 ? '✓ Active (Tier ' + tierReached + ')' : archCount + '/' + archData.thresholds[0] + ' needed';
            relevantSynergies.push({
                emoji: archData.emoji,
                name: archData.name,
                count: archCount,
                status: synStatus,
                active: tierReached > 0
            });
        }

        // Element synergy for this unit
        var elemCount = preview.elementCounts[tmpl.element] || 0;
        if (elemCount > 0) {
            var elemSyn = ELEMENT_SYNERGIES[tmpl.element];
            var activeElem = preview.activeElementSynergies[tmpl.element];
            var eTierReached = activeElem ? activeElem.tier : 0;
            var eSynStatus = eTierReached > 0 ? '✓ Active (Tier ' + eTierReached + ')' : elemCount + '/' + elemSyn.thresholds[0] + ' needed';
            relevantSynergies.push({
                emoji: elemSyn.emoji,
                name: elemSyn.name,
                count: elemCount,
                status: eSynStatus,
                active: eTierReached > 0
            });
        }

        if (relevantSynergies.length > 0) {
            html += '<div class="ud-section">';
            html += '<div class="ud-section-title">🔗 Team Synergies</div>';
            for (var si = 0; si < relevantSynergies.length; si++) {
                var syn = relevantSynergies[si];
                html += '<div style="font-size:12px; color:' + (syn.active ? '#6bcb77' : '#888') + '; padding:2px 0;">';
                html += syn.emoji + ' ' + syn.name + ' (' + syn.count + ') — ' + syn.status;
                html += '</div>';
            }
            html += '</div>';
        }
    }

    // ---- Copy Progress (roster context) ----
    if (context === 'roster') {
        html += '<div class="ud-section">';
        html += '<div class="ud-section-title">📈 Progress</div>';
        var copiesNeeded = 10; // 10-copy star-up
        html += '<div class="ud-stat-row"><span class="ud-stat-label">Current Stars</span><span class="ud-stat-value">' + starsStr + '</span></div>';
        html += '<div class="ud-stat-row"><span class="ud-stat-label">Copies</span><span class="ud-stat-value">' + entry.copiesForNext + ' / ' + copiesNeeded + ' for next star</span></div>';
        if (entry.copiesForNext >= copiesNeeded) {
            html += '<div style="font-size:12px; color:#6bcb77; margin-top:4px;">Ready to star up!</div>';
        }
        html += '</div>';
    }

    // ---- Evolution Path ----
    var evo = EVOLUTIONS[unitKey];
    if (evo) {
        var evolvedTmpl = EVOLVED_TEMPLATES[evo.into];
        if (evolvedTmpl) {
            html += '<div class="ud-section">';
            html += '<div class="ud-section-title">✨ Evolution Path</div>';
            html += '<div class="ud-evo-box">';
            html += '<div style="font-size:14px; font-weight:bold;">' + tmpl.name + ' → ' + evolvedTmpl.name + '</div>';

            // Criteria
            var criteriaHtml = '';
            var crit = evo.criteria;
            if (crit.stars) {
                var starsMet = stars >= crit.stars;
                criteriaHtml += '<div class="' + (starsMet ? 'ud-evo-met' : 'ud-evo-unmet') + '" style="font-size:12px;">';
                criteriaHtml += (starsMet ? '✓' : '○') + ' Requires ' + crit.stars + '⭐ (have ' + stars + ')';
                criteriaHtml += '</div>';
            }
            if (crit.synergy) {
                var archName = ARCHETYPES[crit.synergy] ? ARCHETYPES[crit.synergy].name : crit.synergy;
                var teamArchCount = 0;
                if (context === 'team-builder') {
                    var teamPreview = previewTeamSynergies(sd);
                    teamArchCount = teamPreview.archetypeCounts[crit.synergy] || 0;
                }
                var synMet = teamArchCount >= crit.count;
                criteriaHtml += '<div class="' + (synMet ? 'ud-evo-met' : 'ud-evo-unmet') + '" style="font-size:12px;">';
                criteriaHtml += (synMet ? '✓' : '○') + ' Requires ' + crit.count + '× ' + archName;
                if (context === 'team-builder') {
                    criteriaHtml += ' (have ' + teamArchCount + ')';
                } else {
                    criteriaHtml += ' (team synergy — check team builder)';
                }
                criteriaHtml += '</div>';
            }
            html += criteriaHtml;

            // Evolved stats
            html += '<div style="margin-top:6px; font-size:11px; color:#aaa;">Evolved Stats (at current ' + stars + '⭐):</div>';
            var evoMult = getStarMultiplier(stars);
            html += '<div style="font-size:11px; color:#ccc;">HP: ' + Math.floor(evolvedTmpl.hp * evoMult) +
                ' · ATK: ' + Math.floor(evolvedTmpl.attack * evoMult) +
                ' · SPD: ' + evolvedTmpl.attackSpd + 's · Range: ' + evolvedTmpl.range + '</div>';

            // Evolved ability
            if (evolvedTmpl.ability) {
                html += '<div class="ud-evo-ability">⚡ ' + evolvedTmpl.ability + '</div>';
            }

            html += '</div>'; // evo-box
            html += '</div>'; // section
        }
    }

    // Render
    var overlay = document.getElementById('unit-detail-overlay');
    document.getElementById('unit-detail-content').innerHTML = html;
    overlay.style.display = 'flex';
}

function closeUnitDetail() {
    document.getElementById('unit-detail-overlay').style.display = 'none';
}
```

### Wire Up: Team Builder Roster Click → Detail Panel

Currently clicking a unit in the team builder roster list either selects it for placement (if not on team) or removes it (if on team). Change the behavior:

- **Single click** on a non-team unit: opens the detail panel
- **Double click** on a non-team unit: selects it for board placement (existing behavior)
- **Single click** on an on-team unit: opens the detail panel
- **Double click** on an on-team unit: removes from team (existing behavior)

Alternative (simpler): Add a small **ℹ️ info button** on each unit row in the roster panel. Clicking the info button opens the detail panel. The existing click behavior stays the same.

**Go with the info button approach** — it's less disruptive to existing workflows:

In `renderTeamBuilderScreen`, when building each roster item `div`, add an info button:

```js
var infoBtn = document.createElement('span');
infoBtn.className = 'unit-info-btn';
infoBtn.textContent = 'ℹ️';
infoBtn.style.cssText = 'cursor:pointer; float:right; font-size:14px; padding:2px 4px; opacity:0.7;';
infoBtn.setAttribute('data-info-key', r.key);
div.appendChild(infoBtn);
```

After appending all items, bind the info buttons:
```js
var infoBtns = panel.querySelectorAll('.unit-info-btn');
for (var ib = 0; ib < infoBtns.length; ib++) {
    infoBtns[ib].addEventListener('click', function(e) {
        e.stopPropagation(); // Don't trigger the parent click
        var key = this.getAttribute('data-info-key');
        showUnitDetail(key, 'team-builder');
    });
}
```

### Wire Up: Roster/Collection Screen Click → Detail Panel

In `renderRosterScreen`, make each roster card clickable to open the detail panel:

```js
div.onclick = (function(key) {
    return function() { showUnitDetail(key, 'roster'); };
})(r.key);
div.style.cursor = 'pointer';
```

The star-up and sell buttons already use `e.stopPropagation()` so they won't trigger the card click.

### Close on Overlay Click

```js
document.getElementById('unit-detail-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeUnitDetail();
});
```

Add this initialization in `main-v2.js` on page load, or just add `onclick="if(event.target===this)closeUnitDetail()"` on the overlay div in HTML.

---

## Part 4: Add the HTML Elements (game-v2.html)

Add the unit detail overlay div somewhere in the body (before the closing `</body>` tag):

```html
<div id="unit-detail-overlay" onclick="if(event.target===this)closeUnitDetail()">
    <div id="unit-detail-panel">
        <button id="unit-detail-close" onclick="closeUnitDetail()">✕</button>
        <div id="unit-detail-content"></div>
    </div>
</div>
```

Add all the CSS from Part 3 to the `<style>` section of `game-v2.html`.

---

## Code Quality Notes

- All functions go in global scope (no ES modules)
- Use `var` not `let`/`const`
- `UNIT_TYPE_DESCRIPTIONS` goes in `units.js` (data belongs with data)
- `showUnitDetail` goes in `ui-v2.js` (rendering belongs with rendering)
- `getItemSellValue` and `sellItem` go in `items.js`
- `getItemBenchSize` goes in `hub.js` (building bonus getter, near `getGoldMultiplier` etc.)
- The `saveData.items.benchSize` field becomes unused but doesn't need removal — just stop reading it
- Detail panel scrolls if content exceeds viewport height
- `itemSellMode` is a global var in `ui-v2.js`

---

## Testing Checklist

- [ ] Item bench: sell an unequipped component → get correct gold (5/10/20/40 by rarity)
- [ ] Item bench: sell a combined item → get correct gold (sum × 1.5)
- [ ] Can't sell an equipped item (sell button hidden)
- [ ] Team builder: sell mode toggle works, clicking items in sell mode sells them
- [ ] Warehouse level 0: bench shows 10 slots
- [ ] Warehouse level 3: bench shows 16 slots
- [ ] Warehouse level 5: bench shows 20 slots
- [ ] Upgrading warehouse immediately updates bench display
- [ ] Items beyond old cap (10) can be collected if warehouse is upgraded
- [ ] Roster screen: clicking a unit card opens detail panel
- [ ] Detail panel shows: name, element, archetype, type, stars, all stats
- [ ] Detail panel shows combat behavior description for unit type
- [ ] Detail panel shows equipped items with stat descriptions
- [ ] Detail panel shows evolution path with criteria progress
- [ ] Detail panel shows evolved form stats and ability text
- [ ] Team builder: info button on each unit opens detail panel
- [ ] Team builder detail panel shows active synergy info for current team
- [ ] Roster detail panel shows copy progress toward next star
- [ ] Close detail panel via X button, overlay click, or pressing Escape
- [ ] Old saves load correctly (no migration needed)
