# Prompt 20: Integration & Polish (Phase 2, Chunk 4 — Final)

**Scope**: Complete integration of 120-unit roster (60 base + 60 evolved), full UI overhaul for team building, enemy generation, save migration, and balance pass. This is the final chunk of Phase 2 and delivers a fully playable game.

**Target Files**:
- `gacha.js` — update pool and tier-weighted rolls
- `missions.js` — enemy generation for 60-unit roster
- `ui-v2.js` — complete collection browser, team builder, synergy sidebar, unit detail panel
- `save.js` — save version bump, migration logic, validation
- `teams.js` — optional team helper updates
- `main-v2.js` — optional polish/integration fixes

**Code Conventions**: `var` only, NO `let`/`const`/arrow functions, NO ES modules. Script load order: units.js → save.js → gacha.js → teams.js → hub.js → items.js → missions.js → ui-v2.js → main-v2.js.

**Frozen Files**: Do NOT modify units.js (data from prompt 18), ability/passive execution (from 19a/19b).

---

## PHASE A: Gacha Pool & Tier-Weighted Rolls

### A1. Shop Pool Configuration

**File**: `gacha.js`

**Current State**: SHOP_POOL_KEYS should already be `Object.keys(UNIT_TEMPLATES)` from prompt 18.

**Action**: Verify SHOP_POOL_KEYS is populated correctly and includes all 60 base units (T1-T5). Should NOT include evolved units (those are separate).

```javascript
// At top of gacha.js, after UNIT_TEMPLATES is loaded:
var SHOP_POOL_KEYS = Object.keys(UNIT_TEMPLATES);
// Should log: 60 keys minimum (T1=10, T2=15, T3=15, T4=12, T5=8 for balanced distribution)
```

### A2. Tier-Weighted Roll Logic

**File**: `gacha.js` → `function rollUnit(playerLevel)`

**Requirement**: Rolls must respect tier probabilities based on player level. Create a roll rate lookup table:

```javascript
var ROLL_RATES = {
  1: { t1: 0.70, t2: 0.25, t3: 0.05, t4: 0.00, t5: 0.00 },
  2: { t1: 0.70, t2: 0.25, t3: 0.05, t4: 0.00, t5: 0.00 },
  3: { t1: 0.70, t2: 0.25, t3: 0.05, t4: 0.00, t5: 0.00 },
  4: { t1: 0.50, t2: 0.30, t3: 0.15, t4: 0.05, t5: 0.00 },
  5: { t1: 0.50, t2: 0.30, t3: 0.15, t4: 0.05, t5: 0.00 },
  6: { t1: 0.30, t2: 0.30, t3: 0.25, t4: 0.12, t5: 0.03 },
  7: { t1: 0.30, t2: 0.30, t3: 0.25, t4: 0.12, t5: 0.03 },
  8: { t1: 0.15, t2: 0.25, t3: 0.30, t4: 0.20, t5: 0.10 },
  9: { t1: 0.15, t2: 0.25, t3: 0.30, t4: 0.20, t5: 0.10 },
  10: { t1: 0.10, t2: 0.20, t3: 0.25, t4: 0.25, t5: 0.20 }
};
```

**Roll Function Steps**:
1. Get player level (cap at 10 for lookup)
2. Look up roll rates for that level
3. Generate random number [0, 1)
4. Determine tier based on cumulative probability buckets
5. Filter SHOP_POOL_KEYS by matching tier (check `UNIT_TEMPLATES[key].cost`)
6. Pick random unit from filtered list
7. Increment `saveData.stats.rollsSincePity`
8. Check pity (see A3)
9. Return unit key

**Example**:
```javascript
function rollUnit(playerLevel) {
  var level = Math.min(playerLevel, 10);
  var rates = ROLL_RATES[level];
  var rand = Math.random();
  var tier = 't1';

  if (rand < rates.t1) tier = 't1';
  else if (rand < rates.t1 + rates.t2) tier = 't2';
  else if (rand < rates.t1 + rates.t2 + rates.t3) tier = 't3';
  else if (rand < rates.t1 + rates.t2 + rates.t3 + rates.t4) tier = 't4';
  else tier = 't5';

  var candidates = SHOP_POOL_KEYS.filter(function(key) {
    return UNIT_TEMPLATES[key].cost === tier;
  });

  if (candidates.length === 0) {
    // Fallback: return random T1 (shouldn't happen)
    return SHOP_POOL_KEYS.filter(function(k) { return UNIT_TEMPLATES[k].cost === 't1'; })[0];
  }

  var unitKey = candidates[Math.floor(Math.random() * candidates.length)];

  // Pity check
  var isPity = false;
  if (tier !== 't5') {
    saveData.stats.rollsSincePity++;
    if (saveData.stats.rollsSincePity >= 50) {
      isPity = true;
      saveData.stats.rollsSincePity = 0;
      unitKey = getRandomT5();
    }
  } else {
    saveData.stats.rollsSincePity = 0;
  }

  return unitKey;
}

function getRandomT5() {
  var t5Units = SHOP_POOL_KEYS.filter(function(k) { return UNIT_TEMPLATES[k].cost === 't5'; });
  return t5Units[Math.floor(Math.random() * t5Units.length)];
}
```

### A3. Pity System

**Requirement**: Every 50 rolls without a T5 guarantees a T5.

**Track in saveData**:
```javascript
// In save.js, fresh save template:
saveData.stats.rollsSincePity = 0;
```

**Logic**: Implemented above in `rollUnit()`. When pity triggers:
1. Set tier to T5 (force getRandomT5())
2. Reset counter to 0
3. Log to console: "Pity triggered! Guaranteed T5."

### A4. Shop Display Update

**File**: `ui-v2.js` → `function refreshShop()`

**Requirement**: Display 5 units per shop. Each card shows:
- Unit emoji + name (from `UNIT_TEMPLATES[key].emoji`, `UNIT_TEMPLATES[key].name`)
- Tier stars (★ repeated `cost` times, e.g., T2 = ★★)
- Element icon (colored emoji from `UNIT_TEMPLATES[key].element`)
- Archetype tag (from `UNIT_TEMPLATES[key].archetype`)
- Gold cost (from `UNIT_TEMPLATES[key].cost` mapped to gold: T1=3, T2=6, T3=12, T4=24, T5=50)
- "Buy" button

**HTML Structure** (example for one unit card):
```html
<div class="shop-card">
  <div class="card-header">
    <span class="unit-emoji">[emoji]</span>
    <span class="unit-name">[name]</span>
    <span class="tier-stars">★★★</span>
  </div>
  <div class="card-info">
    <span class="element-icon">[element emoji]</span>
    <span class="archetype-tag">[archetype]</span>
  </div>
  <button class="buy-button" data-unit-key="[key]">
    Buy - [cost] gold
  </button>
</div>
```

**Refresh Logic**:
1. Clear shop container
2. Loop 5 times: call `rollUnit(saveData.playerLevel)`
3. For each rolled unit key:
   - Fetch template from UNIT_TEMPLATES
   - Create card HTML
   - Set click handler to call `buyUnit(unitKey, goldCost)`
4. Update shop refresh button with cost (2 gold) and handler

---

## PHASE B: Mission Enemy Generation

### B1. Story Mission Enemy Scaling

**File**: `missions.js`

**Requirement**: Enemies scale with mission difficulty and follow element/archetype themes.

**Mission Structure** (example in MISSION_DATA):
```javascript
var MISSION_DATA = {
  'story_1': {
    name: 'Ember Vale',
    difficulty: 1,
    element_focus: 'Fire',
    tier_range: ['t1', 't2'],
    enemy_count: 2,
    reward_gold: 100,
    reward_xp: 50
  },
  'story_5': {
    name: 'Inferno Peak',
    difficulty: 5,
    element_focus: 'Fire',
    tier_range: ['t2', 't3'],
    enemy_count: 3,
    reward_gold: 250,
    reward_xp: 150
  },
  // ... up to story_30+
};
```

**Enemy Generation Function**:
```javascript
function generateStoryEnemyTeam(missionKey) {
  var mission = MISSION_DATA[missionKey];
  var elements = Object.keys(ELEMENT_DATA); // ['Fire', 'Water', 'Earth', 'Wind', 'Lightning', 'Force']
  var elementFocus = mission.element_focus;
  var tierRange = mission.tier_range;
  var enemyCount = mission.enemy_count;

  var team = [];
  var focusCount = Math.ceil(enemyCount * 0.6); // 60% from focus element
  var fillerCount = enemyCount - focusCount;

  // Add focus element units
  for (var i = 0; i < focusCount; i++) {
    var unitKey = getRandomUnitByElementAndTier(elementFocus, tierRange);
    var stars = Math.min(3, Math.floor(mission.difficulty / 2)); // Scale stars with difficulty
    team.push({ unitKey: unitKey, stars: stars });
  }

  // Add filler units from any element
  for (var i = 0; i < fillerCount; i++) {
    var randomElement = elements[Math.floor(Math.random() * elements.length)];
    var unitKey = getRandomUnitByElementAndTier(randomElement, tierRange);
    var stars = Math.min(3, Math.floor(mission.difficulty / 2));
    team.push({ unitKey: unitKey, stars: stars });
  }

  return team;
}

function getRandomUnitByElementAndTier(element, tierRange) {
  var candidates = SHOP_POOL_KEYS.filter(function(key) {
    var unit = UNIT_TEMPLATES[key];
    return unit.element === element && tierRange.indexOf(unit.cost) !== -1;
  });

  if (candidates.length === 0) {
    // Fallback to any tier in range
    candidates = SHOP_POOL_KEYS.filter(function(key) {
      return tierRange.indexOf(UNIT_TEMPLATES[key].cost) !== -1;
    });
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}
```

### B2. Grind Mission Enemy Generation

**Requirement**: Random teams with 50% of units from one element, fill rest from any.

```javascript
function generateGrindEnemyTeam(missionLevel) {
  var elements = Object.keys(ELEMENT_DATA);
  var focusElement = elements[Math.floor(Math.random() * elements.length)];
  var tierRange = getTierRangeForGrindLevel(missionLevel);
  var enemyCount = 2 + Math.floor(missionLevel / 5); // Scale from 2 to 4+

  var team = [];
  var focusCount = Math.ceil(enemyCount * 0.5);
  var fillerCount = enemyCount - focusCount;

  for (var i = 0; i < focusCount; i++) {
    var unitKey = getRandomUnitByElementAndTier(focusElement, tierRange);
    var stars = Math.min(3, Math.floor(missionLevel / 3));
    team.push({ unitKey: unitKey, stars: stars });
  }

  for (var i = 0; i < fillerCount; i++) {
    var randomElement = elements[Math.floor(Math.random() * elements.length)];
    var unitKey = getRandomUnitByElementAndTier(randomElement, tierRange);
    var stars = Math.min(3, Math.floor(missionLevel / 3));
    team.push({ unitKey: unitKey, stars: stars });
  }

  return team;
}

function getTierRangeForGrindLevel(level) {
  if (level <= 5) return ['t1', 't2'];
  if (level <= 10) return ['t2', 't3'];
  if (level <= 20) return ['t3', 't4'];
  return ['t4', 't5'];
}
```

### B3. Boss Mission Generation

**Requirement**: One T5 legendary + 2-3 support units.

```javascript
function generateBossEnemyTeam(bossElement) {
  var t5Units = SHOP_POOL_KEYS.filter(function(k) {
    return UNIT_TEMPLATES[k].cost === 't5' && UNIT_TEMPLATES[k].element === bossElement;
  });

  var bossKey = t5Units[Math.floor(Math.random() * t5Units.length)];
  var team = [{ unitKey: bossKey, stars: 3 }];

  // Add 2 support units from same element
  for (var i = 0; i < 2; i++) {
    var unitKey = getRandomUnitByElementAndTier(bossElement, ['t3', 't4']);
    team.push({ unitKey: unitKey, stars: 2 });
  }

  return team;
}
```

### B4. Enemy Synergy Display

**Requirement**: Show active element/archetype synergies for enemy team in mission preview.

```javascript
function getEnemySynergies(enemyTeam) {
  var elementCounts = {};
  var archetypeCounts = {};

  enemyTeam.forEach(function(enemySlot) {
    var unit = UNIT_TEMPLATES[enemySlot.unitKey];
    elementCounts[unit.element] = (elementCounts[unit.element] || 0) + 1;
    archetypeCounts[unit.archetype] = (archetypeCounts[unit.archetype] || 0) + 1;
  });

  var activeSynergies = [];

  // Check element synergies
  Object.keys(elementCounts).forEach(function(element) {
    var count = elementCounts[element];
    if (count >= 2) {
      activeSynergies.push({ type: 'element', name: element, count: count, bonus: ELEMENT_DATA[element].bonusAtCounts[count] });
    }
  });

  // Check archetype synergies
  Object.keys(archetypeCounts).forEach(function(archetype) {
    var count = archetypeCounts[archetype];
    if (count >= 2) {
      activeSynergies.push({ type: 'archetype', name: archetype, count: count, bonus: ARCHETYPE_DATA[archetype].bonusAtCounts[count] });
    }
  });

  return activeSynergies;
}
```

---

## PHASE C: Team Builder UI Overhaul

### C1. Collection Browser

**File**: `ui-v2.js` → New section `function buildCollectionUI()`

**Requirements**:
1. **Element Filter**: 6 tabs (Fire🔥, Water💧, Earth🌿, Wind💨, Lightning⚡, Force💪)
2. **Type Filter**: Warrior, Tank, Archer, Mage, Assassin, Healer (tags from unit templates)
3. **Archetype Filter**: 9 chips (Guardian, Warden, Vanguard, Duelist, Predator, Ranger, Sorcerer, Mystic, Sage)
4. **Tier Filter**: Stars (T1 ★, T2 ★★, T3 ★★★, T4 ★★★★, T5 ★★★★★)
5. **Sort**: By tier (default), by name, by element
6. **Search**: Text filter for unit names

**HTML Structure**:
```html
<div id="collection-container">
  <div class="filter-bar">
    <div class="filter-group">
      <label>Element:</label>
      <button class="element-tab active" data-element="all">All</button>
      <button class="element-tab" data-element="Fire">🔥 Fire</button>
      <button class="element-tab" data-element="Water">💧 Water</button>
      <button class="element-tab" data-element="Earth">🌿 Earth</button>
      <button class="element-tab" data-element="Wind">💨 Wind</button>
      <button class="element-tab" data-element="Lightning">⚡ Lightning</button>
      <button class="element-tab" data-element="Force">💪 Force</button>
    </div>

    <div class="filter-group">
      <label>Type:</label>
      <button class="type-chip" data-type="all">All</button>
      <button class="type-chip" data-type="Warrior">Warrior</button>
      <button class="type-chip" data-type="Tank">Tank</button>
      <button class="type-chip" data-type="Archer">Archer</button>
      <button class="type-chip" data-type="Mage">Mage</button>
      <button class="type-chip" data-type="Assassin">Assassin</button>
      <button class="type-chip" data-type="Healer">Healer</button>
    </div>

    <div class="filter-group">
      <label>Archetype:</label>
      <button class="archetype-chip" data-archetype="all">All</button>
      <button class="archetype-chip" data-archetype="Guardian">Guardian</button>
      <!-- ... 8 more ... -->
    </div>

    <div class="filter-group">
      <label>Tier:</label>
      <button class="tier-chip" data-tier="all">All</button>
      <button class="tier-chip" data-tier="t1">T1 ★</button>
      <button class="tier-chip" data-tier="t2">T2 ★★</button>
      <!-- ... -->
    </div>

    <div class="filter-group">
      <label>Sort:</label>
      <select id="sort-select">
        <option value="tier">By Tier</option>
        <option value="name">By Name</option>
        <option value="element">By Element</option>
      </select>
    </div>

    <div class="filter-group">
      <label>Search:</label>
      <input type="text" id="unit-search" placeholder="Unit name..." />
    </div>
  </div>

  <div id="collection-grid">
    <!-- Unit cards populated here -->
  </div>
</div>
```

**Filter Logic**:
```javascript
var collectionFilters = {
  element: 'all',
  type: 'all',
  archetype: 'all',
  tier: 'all',
  sort: 'tier',
  search: ''
};

function applyCollectionFilters() {
  var filtered = SHOP_POOL_KEYS.filter(function(key) {
    var unit = UNIT_TEMPLATES[key];

    if (collectionFilters.element !== 'all' && unit.element !== collectionFilters.element) return false;
    if (collectionFilters.type !== 'all' && unit.type !== collectionFilters.type) return false;
    if (collectionFilters.archetype !== 'all' && unit.archetype !== collectionFilters.archetype) return false;
    if (collectionFilters.tier !== 'all' && unit.cost !== collectionFilters.tier) return false;
    if (collectionFilters.search && unit.name.toLowerCase().indexOf(collectionFilters.search.toLowerCase()) === -1) return false;

    return true;
  });

  // Sort
  if (collectionFilters.sort === 'tier') {
    var tierOrder = { t1: 1, t2: 2, t3: 3, t4: 4, t5: 5 };
    filtered.sort(function(a, b) {
      return tierOrder[UNIT_TEMPLATES[a].cost] - tierOrder[UNIT_TEMPLATES[b].cost];
    });
  } else if (collectionFilters.sort === 'name') {
    filtered.sort(function(a, b) {
      return UNIT_TEMPLATES[a].name.localeCompare(UNIT_TEMPLATES[b].name);
    });
  } else if (collectionFilters.sort === 'element') {
    filtered.sort(function(a, b) {
      return UNIT_TEMPLATES[a].element.localeCompare(UNIT_TEMPLATES[b].element);
    });
  }

  renderCollectionGrid(filtered);
}
```

### C2. Unit Card Display

**File**: `ui-v2.js` → `function renderCollectionGrid(unitKeys)`

**Card Shows**:
- Emoji + name
- Star level (current) from `saveData.collection[key].stars || 0`
- Element badge (colored icon)
- Archetype tag
- Passive name (italicized)
- "Copies for next star" progress bar
- Evolved badge (✨) if evolved form exists

**HTML Structure (single card)**:
```html
<div class="collection-unit-card" data-unit-key="[key]" draggable="true">
  <div class="card-top">
    <span class="unit-emoji">[emoji]</span>
    <span class="unit-name">[name]</span>
  </div>

  <div class="star-level">
    ★★★ (3 stars)
  </div>

  <div class="card-badges">
    <span class="element-badge">[element emoji]</span>
    <span class="archetype-tag">[archetype]</span>
  </div>

  <div class="passive-name"><i>[Passive Name]</i></div>

  <div class="copies-progress">
    <div class="progress-bar" style="width: [%]%"></div>
    <span class="copies-text">[current] / 10 copies</span>
  </div>

  <div class="evolved-badge">✨</div>
</div>
```

**Logic**:
```javascript
function renderCollectionGrid(unitKeys) {
  var container = document.getElementById('collection-grid');
  container.innerHTML = '';

  unitKeys.forEach(function(key) {
    var template = UNIT_TEMPLATES[key];
    var collectionEntry = saveData.collection[key] || { stars: 0, copies: 0 };
    var nextStarCopies = (collectionEntry.stars + 1) * 10;
    var copiesProgress = Math.min(100, (collectionEntry.copies / nextStarCopies) * 100);

    var card = document.createElement('div');
    card.className = 'collection-unit-card';
    card.setAttribute('data-unit-key', key);
    card.draggable = true;

    var starSpan = '';
    for (var i = 0; i < collectionEntry.stars; i++) {
      starSpan += '★';
    }

    var evolvedBadge = EVOLVED_TEMPLATES[key] ? '<div class="evolved-badge">✨</div>' : '';

    card.innerHTML =
      '<div class="card-top">' +
        '<span class="unit-emoji">' + template.emoji + '</span>' +
        '<span class="unit-name">' + template.name + '</span>' +
      '</div>' +
      '<div class="star-level">' + starSpan + ' (' + collectionEntry.stars + ' stars)</div>' +
      '<div class="card-badges">' +
        '<span class="element-badge">' + getElementEmoji(template.element) + '</span>' +
        '<span class="archetype-tag">' + template.archetype + '</span>' +
      '</div>' +
      '<div class="passive-name"><i>' + (PASSIVE_DATA[template.passive] ? PASSIVE_DATA[template.passive].name : 'Unknown') + '</i></div>' +
      '<div class="copies-progress">' +
        '<div class="progress-bar" style="width: ' + copiesProgress + '%"></div>' +
        '<span class="copies-text">' + collectionEntry.copies + ' / ' + nextStarCopies + '</span>' +
      '</div>' +
      evolvedBadge;

    card.addEventListener('dragstart', function(e) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('unitKey', key);
    });

    card.addEventListener('click', function(e) {
      if (e.target.closest('.collection-unit-card')) {
        showUnitDetailPanel(key);
      }
    });

    container.appendChild(card);
  });
}

function getElementEmoji(element) {
  var map = { 'Fire': '🔥', 'Water': '💧', 'Earth': '🌿', 'Wind': '💨', 'Lightning': '⚡', 'Force': '💪' };
  return map[element] || '❓';
}
```

### C3. Team Board (Drag & Drop)

**File**: `ui-v2.js` → `function buildTeamBoardUI()`

**Requirements**:
- 4×7 grid (4 rows for players, 7 max slots per row at level 10)
- Drag units from collection to grid
- Show active synergies sidebar
- One-family-one-slot enforcement (can't place base + evolved of same unit)
- Team size limit displayed (X / MaxSlots)
- Highlight invalid placements

**HTML Structure**:
```html
<div id="team-board-container">
  <div class="team-size-counter">Team: 0 / 7 (Level 5)</div>

  <div id="team-board" class="team-grid-4x7">
    <!-- 28 slots (4 rows × 7 cols) -->
    <div class="team-slot" data-row="0" data-col="0"></div>
    <!-- ... repeat 27 times ... -->
  </div>
</div>
```

**Drag & Drop Logic**:
```javascript
function initTeamBoard() {
  var slots = document.querySelectorAll('.team-slot');

  slots.forEach(function(slot) {
    slot.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      slot.classList.add('drag-over');
    });

    slot.addEventListener('dragleave', function(e) {
      slot.classList.remove('drag-over');
    });

    slot.addEventListener('drop', function(e) {
      e.preventDefault();
      slot.classList.remove('drag-over');

      var unitKey = e.dataTransfer.getData('unitKey');
      var row = parseInt(slot.getAttribute('data-row'));
      var col = parseInt(slot.getAttribute('data-col'));

      // Validation
      if (!validatePlacement(unitKey, row, col)) {
        console.log('Invalid placement');
        return;
      }

      // Add to team
      placeUnitOnBoard(unitKey, row, col);
      updateTeamSizeCounter();
      updateSynergySidebar();
    });
  });
}

function validatePlacement(unitKey, row, col) {
  // Check team size limit
  var currentSize = saveData.team.filter(function(t) { return t; }).length;
  var maxSize = getMaxTeamSize(saveData.playerLevel);
  if (currentSize >= maxSize) {
    console.log('Team size limit reached');
    return false;
  }

  // Check one-family-one-slot
  var template = UNIT_TEMPLATES[unitKey];
  var familyKey = template.family || unitKey;

  var familyAlreadyPlaced = saveData.team.some(function(slot) {
    if (!slot) return false;
    var slotTemplate = UNIT_TEMPLATES[slot.unitKey];
    var slotFamily = slotTemplate.family || slot.unitKey;

    // Can't have both base and evolved
    if (slotFamily === familyKey) {
      var slotIsEvolved = EVOLVED_TEMPLATES[slot.unitKey] ? true : false;
      var unitIsEvolved = EVOLVED_TEMPLATES[unitKey] ? true : false;

      if (slotIsEvolved !== unitIsEvolved) {
        // Different forms of same unit
        console.log('Cannot place base and evolved of same unit');
        return true;
      }
    }
    return false;
  });

  if (familyAlreadyPlaced) return false;

  return true;
}

function placeUnitOnBoard(unitKey, row, col) {
  var index = row * 7 + col;
  saveData.team[index] = { unitKey: unitKey, position: { row: row, col: col } };

  // Render unit on slot
  var slot = document.querySelector('[data-row="' + row + '"][data-col="' + col + '"]');
  var template = UNIT_TEMPLATES[unitKey];
  slot.innerHTML = '<div class="team-unit">' + template.emoji + ' ' + template.name + '<button class="remove-btn">×</button></div>';

  slot.querySelector('.remove-btn').addEventListener('click', function(e) {
    e.stopPropagation();
    saveData.team[index] = null;
    slot.innerHTML = '';
    updateTeamSizeCounter();
    updateSynergySidebar();
  });
}

function getMaxTeamSize(playerLevel) {
  if (playerLevel < 2) return 2;
  var base = 2 + Math.floor((playerLevel - 1) / 2);
  var maxWithoutBarracks = Math.min(base, 7);
  var hasBarracks = saveData.buildings && saveData.buildings.barracks;
  return hasBarracks ? Math.min(maxWithoutBarracks + 2, 9) : maxWithoutBarracks;
}

function updateTeamSizeCounter() {
  var count = saveData.team.filter(function(t) { return t; }).length;
  var max = getMaxTeamSize(saveData.playerLevel);
  var levelText = 'Level ' + saveData.playerLevel;
  document.querySelector('.team-size-counter').textContent = 'Team: ' + count + ' / ' + max + ' (' + levelText + ')';
}
```

### C4. Synergy Sidebar

**File**: `ui-v2.js` → `function buildSynergySidebarUI()`

**Requirements**:
- Element synergies: show current count / next threshold (e.g., "Fire 3/4")
- Archetype synergies: show current count / next threshold
- Active bonuses listed below each synergy
- Prismatic indicator (if evolved T5 counts double for element)

**HTML Structure**:
```html
<div id="synergy-sidebar">
  <div class="sidebar-title">Active Synergies</div>

  <div class="synergy-group">
    <div class="synergy-title">Elements</div>
    <div class="synergy-item" data-element="Fire">
      <span class="synergy-name">🔥 Fire</span>
      <span class="synergy-count">3 / 4</span>
      <div class="synergy-bonuses">
        <div class="bonus">+15% ATK (2/4)</div>
      </div>
    </div>
    <!-- ... other elements ... -->
  </div>

  <div class="synergy-group">
    <div class="synergy-title">Archetypes</div>
    <div class="synergy-item" data-archetype="Guardian">
      <span class="synergy-name">Guardian</span>
      <span class="synergy-count">2 / 2</span>
      <div class="synergy-bonuses">
        <div class="bonus active">+200 HP (2)</div>
        <div class="bonus">+400 HP (4)</div>
      </div>
    </div>
    <!-- ... other archetypes ... -->
  </div>
</div>
```

**Update Logic**:
```javascript
function updateSynergySidebar() {
  var elementCounts = {};
  var archetypeCounts = {};

  saveData.team.forEach(function(slot) {
    if (!slot) return;
    var unit = UNIT_TEMPLATES[slot.unitKey];
    var isEvolved = EVOLVED_TEMPLATES[slot.unitKey] ? true : false;

    // Count element (evolved T5 counts double)
    var elementCount = 1;
    if (isEvolved && unit.cost === 't5') {
      elementCount = 2; // Prismatic: counts as 2
    }
    elementCounts[unit.element] = (elementCounts[unit.element] || 0) + elementCount;

    // Count archetype
    archetypeCounts[unit.archetype] = (archetypeCounts[unit.archetype] || 0) + 1;
  });

  var sidebar = document.getElementById('synergy-sidebar');
  sidebar.innerHTML = '<div class="sidebar-title">Active Synergies</div>';

  // Elements section
  var elementSection = document.createElement('div');
  elementSection.className = 'synergy-group';
  elementSection.innerHTML = '<div class="synergy-title">Elements</div>';

  Object.keys(ELEMENT_DATA).forEach(function(element) {
    var count = elementCounts[element] || 0;
    var thresholds = ELEMENT_DATA[element].bonusAtCounts;
    var nextThreshold = Math.min(4, 10); // Find next active threshold

    var item = document.createElement('div');
    item.className = 'synergy-item';
    if (count >= 2) item.classList.add('active');

    var name = getElementEmoji(element) + ' ' + element;
    var countText = count + ' / ' + nextThreshold;

    var bonusesHTML = '';
    thresholds.forEach(function(threshold, idx) {
      var triggerCount = [2, 4, 7, 10][idx];
      var isActive = count >= triggerCount;
      bonusesHTML += '<div class="bonus' + (isActive ? ' active' : '') + '">' + threshold + ' (' + triggerCount + ')</div>';
    });

    item.innerHTML =
      '<span class="synergy-name">' + name + '</span>' +
      '<span class="synergy-count">' + countText + '</span>' +
      '<div class="synergy-bonuses">' + bonusesHTML + '</div>';

    elementSection.appendChild(item);
  });

  sidebar.appendChild(elementSection);

  // Archetypes section (similar pattern)
  var archetypeSection = document.createElement('div');
  archetypeSection.className = 'synergy-group';
  archetypeSection.innerHTML = '<div class="synergy-title">Archetypes</div>';

  Object.keys(ARCHETYPE_DATA).forEach(function(archetype) {
    var count = archetypeCounts[archetype] || 0;
    var thresholds = ARCHETYPE_DATA[archetype].bonusAtCounts;

    var item = document.createElement('div');
    item.className = 'synergy-item';
    if (count >= 2) item.classList.add('active');

    var countText = count + ' / ?';
    var bonusesHTML = '';
    thresholds.forEach(function(threshold, idx) {
      var isActive = count >= (idx + 1);
      bonusesHTML += '<div class="bonus' + (isActive ? ' active' : '') + '">' + threshold + '</div>';
    });

    item.innerHTML =
      '<span class="synergy-name">' + archetype + '</span>' +
      '<span class="synergy-count">' + countText + '</span>' +
      '<div class="synergy-bonuses">' + bonusesHTML + '</div>';

    archetypeSection.appendChild(item);
  });

  sidebar.appendChild(archetypeSection);
}
```

### C5. Unit Detail Panel

**File**: `ui-v2.js` → `function showUnitDetailPanel(unitKey)`

**Shows**:
- Full stats (HP, ATK, AtkSpd, Range, MoveSpd)
- Innate Passive name + description
- Ability name + description
- Evolution status (if T1-T3: show evolution path, requirements)
- Star-up progress

**HTML Structure**:
```html
<div id="unit-detail-panel" class="modal">
  <div class="modal-content">
    <button class="close-btn">×</button>

    <div class="detail-header">
      <span class="emoji">[emoji]</span>
      <span class="name">[name]</span>
      <span class="tier">★★★</span>
    </div>

    <div class="detail-badges">
      <span class="element">[element]</span>
      <span class="archetype">[archetype]</span>
    </div>

    <div class="stats-grid">
      <div class="stat">
        <label>HP</label>
        <span class="value">[value]</span>
      </div>
      <!-- ATK, AtkSpd, Range, MoveSpd -->
    </div>

    <div class="passive-section">
      <h3>Passive: [name]</h3>
      <p>[description]</p>
    </div>

    <div class="ability-section">
      <h3>Ability: [name]</h3>
      <p>[description]</p>
    </div>

    <div class="evolution-section" id="evolution-section">
      <!-- If evolved form exists or unit is upgradeable -->
    </div>

    <div class="starup-progress">
      <h3>Star Progress</h3>
      <div class="progress-bar" style="width: [%]%"></div>
      <span>[copies] / 10</span>
    </div>
  </div>
</div>
```

**Logic**:
```javascript
function showUnitDetailPanel(unitKey) {
  var template = UNIT_TEMPLATES[unitKey];
  var collectionEntry = saveData.collection[unitKey] || { stars: 0, copies: 0 };

  var panel = document.getElementById('unit-detail-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'unit-detail-panel';
    panel.className = 'modal';
    document.body.appendChild(panel);
  }

  var passive = PASSIVE_DATA[template.passive] || { name: 'Unknown', description: 'No data' };
  var ability = ABILITY_DATA[template.ability] || { name: 'Unknown', description: 'No data' };

  var starSpan = '';
  for (var i = 0; i < collectionEntry.stars; i++) {
    starSpan += '★';
  }

  var evolutionHTML = '';
  if (EVOLVED_TEMPLATES[unitKey]) {
    var evolved = EVOLVED_TEMPLATES[unitKey];
    evolutionHTML =
      '<div class="evolution-section">' +
        '<h3>Evolved Form Available</h3>' +
        '<p>' + evolved.emoji + ' ' + evolved.name + '</p>' +
        '<p>Requires: ' + (collectionEntry.stars + 1) + '★ and ' + ((collectionEntry.stars + 1) * 10) + ' copies</p>' +
      '</div>';
  } else if (template.cost !== 't5') {
    var nextCost = { t1: 't2', t2: 't3', t3: 't4', t4: 't5' }[template.cost];
    if (nextCost) {
      evolutionHTML =
        '<div class="evolution-section">' +
          '<p>Upgrade at ' + (collectionEntry.stars + 1) + '★ to tier ' + nextCost.toUpperCase() + '</p>' +
        '</div>';
    }
  }

  var nextStarCopies = (collectionEntry.stars + 1) * 10;
  var progress = Math.min(100, (collectionEntry.copies / nextStarCopies) * 100);

  panel.innerHTML =
    '<div class="modal-content">' +
      '<button class="close-btn">×</button>' +
      '<div class="detail-header">' +
        '<span class="emoji">' + template.emoji + '</span>' +
        '<span class="name">' + template.name + '</span>' +
        '<span class="tier">' + starSpan + '</span>' +
      '</div>' +
      '<div class="detail-badges">' +
        '<span class="element">' + getElementEmoji(template.element) + ' ' + template.element + '</span>' +
        '<span class="archetype">' + template.archetype + '</span>' +
      '</div>' +
      '<div class="stats-grid">' +
        '<div class="stat"><label>HP</label><span class="value">' + template.stats.hp + '</span></div>' +
        '<div class="stat"><label>ATK</label><span class="value">' + template.stats.atk + '</span></div>' +
        '<div class="stat"><label>AtkSpd</label><span class="value">' + template.stats.atkSpeed + '</span></div>' +
        '<div class="stat"><label>Range</label><span class="value">' + template.stats.range + '</span></div>' +
        '<div class="stat"><label>MoveSpd</label><span class="value">' + template.stats.moveSpeed + '</span></div>' +
      '</div>' +
      '<div class="passive-section">' +
        '<h3>Passive: ' + passive.name + '</h3>' +
        '<p>' + passive.description + '</p>' +
      '</div>' +
      '<div class="ability-section">' +
        '<h3>Ability: ' + ability.name + '</h3>' +
        '<p>' + ability.description + '</p>' +
      '</div>' +
      evolutionHTML +
      '<div class="starup-progress">' +
        '<h3>Star Progress</h3>' +
        '<div class="progress-bar" style="width: ' + progress + '%"></div>' +
        '<span>' + collectionEntry.copies + ' / ' + nextStarCopies + '</span>' +
      '</div>' +
    '</div>';

  panel.style.display = 'flex';

  panel.querySelector('.close-btn').addEventListener('click', function() {
    panel.style.display = 'none';
  });
}
```

---

## PHASE D: Synergy Sidebar & Combat HUD

### D1. In-Combat Synergy Display

**File**: `ui-v2.js` → `function initCombatSynergySidebars(playerTeam, enemyTeam)`

**Left Sidebar**: Player's active synergies
**Right Sidebar**: Enemy synergies

```javascript
function initCombatSynergySidebars(playerTeam, enemyTeam) {
  var playerSynergies = calculateTeamSynergies(playerTeam);
  var enemySynergies = calculateTeamSynergies(enemyTeam);

  renderSynergySidebar('left', playerSynergies, 'Player');
  renderSynergySidebar('right', enemySynergies, 'Enemy');
}

function calculateTeamSynergies(team) {
  var elementCounts = {};
  var archetypeCounts = {};

  team.forEach(function(unit) {
    if (!unit) return;
    elementCounts[unit.element] = (elementCounts[unit.element] || 0) + 1;
    archetypeCounts[unit.archetype] = (archetypeCounts[unit.archetype] || 0) + 1;
  });

  return { elements: elementCounts, archetypes: archetypeCounts };
}

function renderSynergySidebar(side, synergies, label) {
  var container = document.getElementById('synergy-sidebar-' + side);
  if (!container) {
    container = document.createElement('div');
    container.id = 'synergy-sidebar-' + side;
    container.className = 'synergy-sidebar-' + side;
    document.getElementById('combat-area').appendChild(container);
  }

  container.innerHTML = '<div class="sidebar-label">' + label + '</div>';

  // Elements
  Object.keys(ELEMENT_DATA).forEach(function(element) {
    var count = synergies.elements[element] || 0;
    var data = ELEMENT_DATA[element];

    var item = document.createElement('div');
    item.className = 'synergy-item' + (count >= 2 ? ' active' : '');

    var thresholdMarkers = '';
    [2, 4, 7, 10].forEach(function(t) {
      var lit = count >= t ? 'lit' : '';
      thresholdMarkers += '<span class="threshold-marker ' + lit + '">' + t + '</span>';
    });

    item.innerHTML =
      '<span class="name">' + getElementEmoji(element) + ' ' + element + ': ' + count + '</span>' +
      '<div class="threshold-markers">' + thresholdMarkers + '</div>';

    container.appendChild(item);
  });

  // Archetypes (similar)
  Object.keys(ARCHETYPE_DATA).forEach(function(archetype) {
    var count = synergies.archetypes[archetype] || 0;

    var item = document.createElement('div');
    item.className = 'synergy-item' + (count >= 2 ? ' active' : '');
    item.innerHTML = '<span class="name">' + archetype + ': ' + count + '</span>';

    container.appendChild(item);
  });
}
```

### D2. Unit Tooltip in Combat

**File**: `ui-v2.js` + `main-v2.js` → Combat rendering

```javascript
function initCombatUnitTooltips(combatUnits) {
  combatUnits.forEach(function(unitElement) {
    unitElement.addEventListener('mouseenter', function(e) {
      var unit = e.target.unit; // Attached by combat system
      if (!unit) return;

      var tooltip = document.createElement('div');
      tooltip.className = 'unit-tooltip';

      var buffsHTML = '';
      if (unit.buffs && unit.buffs.length > 0) {
        unit.buffs.forEach(function(buff) {
          buffsHTML += '<div class="buff">' + buff + '</div>';
        });
      }

      tooltip.innerHTML =
        '<div class="tooltip-name">' + unit.template.name + '</div>' +
        '<div class="tooltip-hp">HP: ' + unit.hp + ' / ' + unit.maxHp + '</div>' +
        '<div class="tooltip-passive">Passive: ' + (PASSIVE_DATA[unit.template.passive] ? PASSIVE_DATA[unit.template.passive].name : '?') + '</div>' +
        '<div class="tooltip-buffs">' + (buffsHTML || 'No buffs') + '</div>';

      document.body.appendChild(tooltip);

      var rect = unitElement.getBoundingClientRect();
      tooltip.style.position = 'fixed';
      tooltip.style.left = (rect.right + 10) + 'px';
      tooltip.style.top = (rect.top) + 'px';
      tooltip.dataset.tooltipId = Math.random();

      unitElement.addEventListener('mouseleave', function() {
        tooltip.remove();
      });
    });
  });
}
```

### D3. Combat Log Enhancement

**File**: `main-v2.js` → `function logCombatAction(action, details)`

```javascript
function logCombatAction(actionType, details) {
  var logEntry = document.createElement('div');
  logEntry.className = 'combat-log-entry';

  var message = '';
  var color = '';

  if (actionType === 'passive-trigger') {
    message = details.unit + '\'s ' + details.passive + ' deals ' + details.damage + ' bonus!';
    color = getElementColor(details.element);
  } else if (actionType === 'ability-trigger') {
    message = details.unit + '\'s ' + details.ability + ' activates!';
    color = '#FFD700';
  } else if (actionType === 'attack') {
    message = details.attacker + ' attacks ' + details.defender + ' for ' + details.damage + ' damage';
  }

  logEntry.textContent = message;
  logEntry.style.color = color;

  var logContainer = document.getElementById('combat-log');
  logContainer.appendChild(logEntry);

  // Auto-scroll to bottom
  logContainer.scrollTop = logContainer.scrollHeight;
}

function getElementColor(element) {
  var colorMap = {
    'Fire': '#FF4500',
    'Water': '#1E90FF',
    'Earth': '#228B22',
    'Wind': '#87CEEB',
    'Lightning': '#FFD700',
    'Force': '#9370DB'
  };
  return colorMap[element] || '#FFF';
}
```

---

## PHASE E: Save Migration & Backwards Compatibility

### E1. Save Version Bump

**File**: `save.js`

```javascript
var SAVE_VERSION = 4; // Bump from 3 to 4
```

### E2. Migration Function

**File**: `save.js` → `function migrateSave(oldData)`

```javascript
function migrateSave(oldData) {
  if (oldData.version === undefined) oldData.version = 1;

  if (oldData.version < 2) {
    oldData = migrateV1toV2(oldData);
  }
  if (oldData.version < 3) {
    oldData = migrateV2toV3(oldData);
  }
  if (oldData.version < 4) {
    oldData = migrateV3toV4(oldData);
  }

  return oldData;
}

function migrateV3toV4(oldData) {
  console.log('Migrating save from v3 to v4 (60-unit roster)');

  // Preserve player progress
  oldData.playerLevel = oldData.playerLevel || 1;
  oldData.gold = oldData.gold || 500;
  oldData.xp = oldData.xp || 0;

  // Collection: map old unit keys to new if names changed, otherwise keep
  oldData.collection = oldData.collection || {};

  // Team: validate units still exist in UNIT_TEMPLATES
  oldData.team = oldData.team || [];
  oldData.team = oldData.team.filter(function(slot) {
    if (!slot) return true;
    return UNIT_TEMPLATES[slot.unitKey] !== undefined;
  });

  // Add missing buildings
  oldData.buildings = oldData.buildings || {};
  oldData.buildings.barracks = oldData.buildings.barracks || false;
  oldData.buildings.arcaneLibrary = oldData.buildings.arcaneLibrary || false;

  // Add missing stats
  oldData.stats = oldData.stats || {};
  oldData.stats.missionsClear = oldData.stats.missionsClear || [];
  oldData.stats.rollsSincePity = oldData.stats.rollsSincePity || 0;
  oldData.stats.totalGoldSpent = oldData.stats.totalGoldSpent || 0;

  oldData.version = 4;

  console.log('Migration v3→v4 complete. Gold:', oldData.gold, 'Level:', oldData.playerLevel);
  return oldData;
}
```

### E3. Validation

**File**: `save.js` → `function validateSaveData(data)`

```javascript
function validateSaveData(data) {
  console.log('Validating save data...');

  // Validate collection entries
  Object.keys(data.collection || {}).forEach(function(key) {
    if (UNIT_TEMPLATES[key] === undefined) {
      console.log('Removing invalid collection entry:', key);
      delete data.collection[key];
    }
  });

  // Validate team
  data.team = data.team.filter(function(slot) {
    if (!slot) return true;
    if (UNIT_TEMPLATES[slot.unitKey] === undefined) {
      console.log('Removing invalid team slot:', slot.unitKey);
      return false;
    }
    return true;
  });

  // Ensure required fields exist
  data.playerLevel = Math.max(1, Math.min(10, data.playerLevel || 1));
  data.gold = Math.max(0, data.gold || 500);
  data.xp = Math.max(0, data.xp || 0);
  data.stats = data.stats || {};
  data.buildings = data.buildings || {};

  console.log('Validation complete. Valid entries:', Object.keys(data.collection).length);
  return data;
}
```

### E4. Fresh Start Option

**File**: `ui-v2.js` → Settings modal

```javascript
function addResetButton() {
  var settingsPanel = document.getElementById('settings-panel');

  var resetSection = document.createElement('div');
  resetSection.className = 'settings-section';
  resetSection.innerHTML =
    '<h3>Danger Zone</h3>' +
    '<button id="reset-to-v2-btn" class="danger-btn">Reset to V4 (Delete Save)</button>';

  settingsPanel.appendChild(resetSection);

  document.getElementById('reset-to-v2-btn').addEventListener('click', function() {
    if (confirm('This will delete your current save and start fresh with the new 60-unit roster. Continue?')) {
      localStorage.removeItem('tftAutoSave');
      location.reload();
    }
  });
}
```

---

## PHASE F: Balance Pass & Testing

### F1. Gacha Economy

**Verify in gacha.js:**
```javascript
var UNIT_COSTS = {
  't1': 3,
  't2': 6,
  't3': 12,
  't4': 24,
  't5': 50
};

var SHOP_REFRESH_COST = 2;
var STARTING_GOLD = 500;
```

### F2. Mission Rewards

**In missions.js:**
```javascript
// Story mission rewards increase with difficulty
function getStoryReward(difficulty) {
  var gold = 100 + (difficulty * 25);
  var xp = 50 + (difficulty * 15);
  return { gold: gold, xp: xp };
}

// Milestone: every 5th mission grants T3+ unit
function checkMilestoneReward(missionNumber) {
  if (missionNumber % 5 === 0) {
    var t3t4Units = SHOP_POOL_KEYS.filter(function(k) {
      var cost = UNIT_TEMPLATES[k].cost;
      return cost === 't3' || cost === 't4';
    });
    var reward = t3t4Units[Math.floor(Math.random() * t3t4Units.length)];
    return reward;
  }
  return null;
}
```

### F3. Star-up Costs

**Verify in save.js (from earlier):**
```javascript
// 10 copies per star level
var COPIES_PER_STAR = 10;

// Sell value
function getSellValue(unitKey, starLevel) {
  var unit = UNIT_TEMPLATES[unitKey];
  var baseCost = { 't1': 3, 't2': 6, 't3': 12, 't4': 24, 't5': 50 }[unit.cost];
  return baseCost * 3; // Always 3x unit cost
}
```

### F4. Element Balance Check

**Testing function** (add to main-v2.js or separate test file):

```javascript
function runElementBalanceTest() {
  console.log('=== Element Balance Test ===');

  // Mono-fire vs mono-water: water should win ~60% of times
  var fireWins = 0;
  var tests = 20;

  for (var i = 0; i < tests; i++) {
    var fireTeam = generateMonoElement('Fire');
    var waterTeam = generateMonoElement('Water');

    var result = simulateBattle(fireTeam, waterTeam);
    if (result.winner === 'fire') fireWins++;
  }

  console.log('Fire vs Water: Fire won ' + fireWins + '/' + tests + ' (~' + Math.round(fireWins / tests * 100) + '%)');
  console.log('Expected: ~40% (Water advantage 1.3x damage)');

  // Force vs any: should be ~50%
  var forceWins = 0;
  for (var i = 0; i < tests; i++) {
    var forceTeam = generateMonoElement('Force');
    var randomTeam = generateMonoElement(['Fire', 'Water', 'Earth', 'Wind', 'Lightning'][Math.floor(Math.random() * 5)]);

    var result = simulateBattle(forceTeam, randomTeam);
    if (result.winner === 'force') forceWins++;
  }

  console.log('Force vs Random: Force won ' + forceWins + '/' + tests + ' (~' + Math.round(forceWins / tests * 100) + '%)');
  console.log('Expected: ~50%');
}

function generateMonoElement(element) {
  var units = SHOP_POOL_KEYS.filter(function(k) {
    return UNIT_TEMPLATES[k].element === element;
  });

  var team = [];
  for (var i = 0; i < 5; i++) {
    var key = units[Math.floor(Math.random() * units.length)];
    team.push(createUnit(key, { stars: 1 }));
  }
  return team;
}
```

---

## TESTING CHECKLIST

- [ ] **Gacha Rolls**: Verify all 60 units appear in pools proportionally
- [ ] **Tier Distribution**: Run 100 rolls at level 1, 5, 10 and verify distribution matches table
- [ ] **Pity System**: Roll 50 non-T5 units, verify 51st is T5
- [ ] **Shop Display**: 5 units per refresh, all info shown (emoji, name, tier, element, archetype, cost)
- [ ] **Collection Browser**:
  - [ ] Element filters work (clicking Fire shows only Fire units)
  - [ ] Type filters work
  - [ ] Archetype filters work (all 9)
  - [ ] Tier filters work (T1-T5)
  - [ ] Sort by tier, name, element all work
  - [ ] Search by unit name works
- [ ] **Team Builder**:
  - [ ] Can drag units from collection to board
  - [ ] One-family-one-slot enforced (can't place base + evolved)
  - [ ] Team size respects level (2 at lvl 1, 3 at lvl 2, 4 at lvl 3, 5 at lvl 4, 6 at lvl 5, 7 at lvl 6-10, max 9 with barracks)
  - [ ] Can remove units from board with × button
  - [ ] Team size counter updates
- [ ] **Synergy Sidebar**:
  - [ ] Shows all 6 elements with counts
  - [ ] Shows all 9 archetypes with counts
  - [ ] Thresholds marked (2/4/7/10 for elements)
  - [ ] Active bonuses listed correctly
  - [ ] Evolved T5 counts as 2 for element (prismatic)
- [ ] **Unit Detail Panel**:
  - [ ] Clicking unit card opens detail panel
  - [ ] Shows all stats (HP, ATK, AtkSpd, Range, MoveSpd)
  - [ ] Shows passive name + description
  - [ ] Shows ability name + description
  - [ ] Shows evolution status if applicable
  - [ ] Shows star-up progress bar + copy count
  - [ ] Close button works
- [ ] **Enemy Generation**:
  - [ ] Story missions generate themed teams (e.g., Fire mission = mostly Fire)
  - [ ] Enemy tier scales with difficulty (early T1-T2, late T3-T5)
  - [ ] Enemy team size scales (2-3 early, 6-8 late)
  - [ ] Grind missions have random element focus
  - [ ] Boss missions have 1 T5 + 2 support units
  - [ ] Enemy synergies display correctly
- [ ] **Save Migration**:
  - [ ] V3 save loads and migrates to V4
  - [ ] Gold, XP, level preserved
  - [ ] Collection entries validated (invalid ones removed)
  - [ ] Team slots validated (invalid units removed)
  - [ ] New fields (stats, buildings) added if missing
  - [ ] Fresh start button works
- [ ] **Combat**:
  - [ ] No console errors with new units in battle
  - [ ] Element matchup multipliers work (Fire vs Water: 1.3x/0.7x)
  - [ ] All 6 element synergies apply correct bonuses at 2/4/7/10
  - [ ] All 9 archetype synergies apply correct bonuses
  - [ ] Passive/ability activations logged correctly
  - [ ] Synergy sidebars show in combat (player left, enemy right)
  - [ ] Unit tooltips appear on hover with correct info
  - [ ] 9v9 combat runs without lag
- [ ] **Performance**:
  - [ ] No lag when filtering 120 units
  - [ ] Collection render completes in < 1s
  - [ ] Team board drag-drop smooth
  - [ ] Combat with 18 units + all passives smooth
  - [ ] No memory leaks (check DevTools)

---

## CRITICAL IMPLEMENTATION NOTES

1. **Code Style**: ALL `var`, NO `let`/`const`/arrow functions. Maintain consistency with prompt 18.

2. **File Load Order**: Respect the order: units.js → save.js → gacha.js → teams.js → hub.js → items.js → missions.js → ui-v2.js → main-v2.js. All templates must be available before logic runs.

3. **Frozen Files**: Do NOT modify:
   - `units.js` (UNIT_TEMPLATES, EVOLVED_TEMPLATES, ELEMENT_DATA, ARCHETYPE_DATA data layer)
   - Ability execution logic from 19a/19b
   - Passive trigger system from 19a/19b

4. **Gacha Pool**: SHOP_POOL_KEYS must be 60 base units ONLY. Evolved units are separate and not in the gacha pool.

5. **Team Slot Validation**: One-family-one-slot means:
   - A unit has a `family` field or falls back to its own `unitKey`
   - If a base unit of family X is on board, can't place evolved unit of family X
   - If evolved unit of family X is on board, can't place base unit of family X

6. **Synergy Calculation**:
   - Element synergies: 2/4/7/10 thresholds
   - Archetype synergies: variable thresholds (check ARCHETYPE_DATA for each)
   - Evolved T5 counts as 2 toward its element (prismatic)
   - All other units count as 1

7. **Migration Priority**:
   - Preserve gold, XP, level at all costs
   - Validate every collection entry and team slot against UNIT_TEMPLATES
   - Remove, don't crash on invalid entries
   - Initialize missing stat fields

8. **UI Polish**:
   - Collection browser must handle 120 units without overflow (use grid/pagination if needed)
   - Synergy sidebar should be always visible in team builder
   - Combat sidebars (synergies) should render before combat starts
   - All modals should be closable with × button or Escape key

9. **Balance Tuning**: If element win rates diverge from 40-50-60% during testing, adjust ability damage or synergy bonuses (DO NOT adjust matchup multipliers themselves).

10. **Error Handling**: Log all migrations, validations, and significant events to console for debugging. Never silently fail.

---

## SUCCESS CHECKLIST (Final Delivery)

- [ ] Full playable game loop: hub → shop (gacha) → team builder → mission select → combat → rewards → repeat
- [ ] All 60 base units purchasable from shop
- [ ] All 60 evolved units obtainable by starring up
- [ ] Synergy system fully functional and visually displayed
- [ ] Enemy generation scales appropriately for 30+ story missions + grind missions + bosses
- [ ] Save/load works with v3→v4 migration support
- [ ] Zero console errors during normal gameplay (run full test pass)
- [ ] UI handles 120 units smoothly without lag
- [ ] All tests from checklist pass

---

**End of Prompt 20 — Ready for Implementation**
