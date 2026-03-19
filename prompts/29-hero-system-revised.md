# Prompt 29 — Hero System Revised (Complete Rewrite)

**Status**: Ready for implementation
**Scope**: Complete rewrite of heroes.js with new philosophy-based system
**Depends on**: HERO-REWORK.md, current save.js, current main-v2.js, current ui-v2.js
**Blocks**: Prompt 30 (item system rework)

---

## Overview

The hero system is being completely redesigned from 8 role-based heroes to **6 philosophy-based heroes** matched to the story cast. Heroes are **playstyle modifiers** that layer onto any unit regardless of archetype. A unit with a hero can equip items; units without heroes cannot. Heroes have independent XP, level 1-20, and skill trees with 2 branches × 5 tiers × 2 choices per tier.

**Core mechanical constraint**: Capstone (5pt) + other branch T4 (4pt) = 21 > 20 budget → **impossible combination**. This forces real build sacrifices.

**Key availability event**: Lyric dies permanently in R4 (R4 mid stage). No fragment system. Lyric's death is irreversible and mechanically devastating.

---

## Part 1: heroes.js — Complete Data & Functions

### 1.1 HERO_DATA Object

Replace the entire heroes.js file with a fresh implementation. Start with HERO_DATA:

```javascript
var HERO_DATA = {
    kael: {
        name: 'Kael',
        quote: 'No one falls while I stand.',
        philosophy: 'Protection',
        description: 'Rewards keeping your team alive. Bonuses trigger on ally survival, protecting others, team at full strength. Penalizes ally deaths.',
        availability: {
            acquiredRegion: 1,  // Start
            lostRegion: null,   // Never lost
            lostStage: null
        },
        branches: {
            A: {
                name: 'Guardian\'s Oath',
                description: 'Personal protection of others'
            },
            B: {
                name: 'Commander\'s Presence',
                description: 'Team-wide aura based on ally survival'
            }
        }
    },
    lyric: {
        name: 'Lyric',
        quote: 'Maximum output, whatever the cost.',
        philosophy: 'Efficiency',
        description: 'Rewards aggressive efficiency — kills, speed, damage output. Strongest bonuses come at a cost: self-damage, HP sacrifice, risk.',
        availability: {
            acquiredRegion: 1,  // Start
            lostRegion: 4,      // Dies R4
            lostStage: 'mid'    // R4 mid stage specifically
        },
        branches: {
            A: {
                name: 'Overcharge',
                description: 'Power at a cost'
            },
            B: {
                name: 'Calculated Efficiency',
                description: 'Rewards for fast kills'
            }
        }
    },
    ren: {
        name: 'Ren',
        quote: 'I\'m here. That\'s enough.',
        philosophy: 'Steadfast',
        description: 'Rewards endurance — staying alive, taking hits, not moving, being reliable. Bonuses scale with time alive and damage absorbed.',
        availability: {
            acquiredRegion: 2,  // R2 boss clear
            lostRegion: null,
            lostStage: null
        },
        branches: {
            A: {
                name: 'Iron Endurance',
                description: 'Personal tankiness that scales with time'
            },
            B: {
                name: 'Silent Anchor',
                description: 'Nearby allies benefit from Ren\'s presence'
            }
        }
    },
    sera: {
        name: 'Sera',
        quote: 'Hit the right target at the right time.',
        philosophy: 'Precision',
        description: 'Rewards smart targeting — damage against priority targets, burst windows, finishing blows. Bonuses trigger on hitting low-HP, ability crits, targeting "right" enemy.',
        availability: {
            acquiredRegion: 3,  // R3 early
            lostRegion: 4,      // Leaves R4
            lostStage: 'early',
            returnsRegion: 5,   // Returns R5 late
            returnsStage: 'late'
        },
        branches: {
            A: {
                name: 'Execution',
                description: 'Burst damage on priority targets'
            },
            B: {
                name: 'Tactical Awareness',
                description: 'Team benefits from Sera\'s precision'
            }
        }
    },
    maren: {
        name: 'Maren',
        quote: 'Everyone comes home.',
        philosophy: 'Sustain',
        description: 'Rewards sustain — healing, shielding, keeping team healthy. Amplifies healing/shielding, adds emergency saves, converts survival into power.',
        availability: {
            acquiredRegion: 3,  // R3 early
            lostRegion: 4,      // Leaves R4
            lostStage: 'early',
            returnsRegion: 5,   // Returns R5 early
            returnsStage: 'early'
        },
        branches: {
            A: {
                name: 'Restoration',
                description: 'Raw healing amplification'
            },
            B: {
                name: 'Protective Warmth',
                description: 'Overheal and shield mechanics'
            }
        }
    },
    voss: {
        name: 'Voss',
        quote: 'Results. Now.',
        philosophy: 'Momentum',
        description: 'Rewards momentum — bonuses that ramp over time, snowball on kills, punish passivity. Early combat is ordinary; as fight drags on, becomes terrifying.',
        availability: {
            acquiredRegion: 7,  // R7 early
            lostRegion: null,
            lostStage: null
        },
        branches: {
            A: {
                name: 'Ramping Power',
                description: 'Bonuses that grow over time'
            },
            B: {
                name: 'Kill Cascade',
                description: 'Snowball on kills'
            }
        }
    }
};
```

### 1.2 HERO_SKILL_TREES Object

Define the complete skill tree for all 6 heroes. Use this structure for each node:

```javascript
var HERO_SKILL_TREES = {
    kael: {
        A: {
            1: [
                {
                    id: 'kael_A_1_1',
                    name: 'Shield Ally',
                    tier: 1,
                    branch: 'A',
                    cost: 1,
                    levelReq: 1,
                    effect: 'When an adjacent ally drops below 30% HP, grant them a shield equal to 8% of your max HP (once per ally per combat)',
                    apply: function(unit, hero) {
                        // This hero skill is conditional, resolved during combat
                        // Stored for reference; combat system uses combat hooks
                    }
                },
                {
                    id: 'kael_A_1_2',
                    name: 'Frontline Defender',
                    tier: 1,
                    branch: 'A',
                    cost: 1,
                    levelReq: 1,
                    effect: 'You gain +8% DR when at least 1 ally is behind you (further from enemy spawn)',
                    apply: function(unit, hero) {
                        if (!unit.heroSkillBonuses) unit.heroSkillBonuses = {};
                        unit.heroSkillBonuses.frontlineDefenderDR = 0.08;
                    }
                }
            ],
            2: [
                {
                    id: 'kael_A_2_1',
                    name: 'Retribution',
                    tier: 2,
                    branch: 'A',
                    cost: 1,
                    levelReq: 5,
                    effect: 'When an adjacent ally takes damage, your next attack deals +15% bonus damage',
                    apply: function(unit, hero) {}
                },
                {
                    id: 'kael_A_2_2',
                    name: 'Hold the Line',
                    tier: 2,
                    branch: 'A',
                    cost: 1,
                    levelReq: 5,
                    effect: 'You gain +12% HP. Adjacent allies gain +6% HP',
                    apply: function(unit, hero) {
                        unit.maxHp = Math.floor(unit.maxHp * 1.12);
                        unit.hp = unit.maxHp;
                    }
                }
            ],
            // ... continue T3, T4, T5 nodes
        },
        B: {
            // ... Branch B same structure
        }
    },
    // ... continue for lyric, ren, sera, maren, voss
};
```

**IMPORTANT**: The skill tree data is **very extensive** (120 nodes total across 6 heroes). You MUST reference HERO-REWORK.md sections for each hero and transcribe the exact skill names, effects, tier costs, and level requirements. Use the table structure from HERO-REWORK.md as the source of truth.

**Pattern for node IDs**: `{heroKey}_{branch}_{tier}_{choice}` (e.g., `kael_A_1_1`, `lyric_B_5_2`)

### 1.3 Hero Functions

Implement these core functions:

```javascript
// Get a hero's current skill tree state (invested nodes, points spent, etc.)
function getHeroState(sd, heroKey) {
    if (!sd.heroes || !sd.heroes.data || !sd.heroes.data[heroKey]) {
        return null;
    }
    return sd.heroes.data[heroKey];
}

// Get hero availability for a given region
function getHeroAvailability(region) {
    var avail = { available: [], unavailable: [], returning: [] };
    for (var hKey in HERO_DATA) {
        var hero = HERO_DATA[hKey];
        var avl = hero.availability;

        // Check if hero is available in this region
        if (avl.acquiredRegion <= region) {
            // Check if lost
            if (avl.lostRegion && avl.lostRegion <= region) {
                // Check if returned
                if (avl.returnsRegion && avl.returnsRegion <= region) {
                    avail.available.push(hKey);
                    avail.returning.push(hKey);
                } else {
                    avail.unavailable.push(hKey);
                }
            } else {
                avail.available.push(hKey);
            }
        } else {
            avail.unavailable.push(hKey);
        }
    }
    return avail;
}

// Get which hero (if any) is assigned to a unit
function getHeroForUnit(sd, unitKey) {
    if (!sd || !sd.heroes || !sd.heroes.data) return null;

    for (var hKey in sd.heroes.data) {
        var heroData = sd.heroes.data[hKey];
        if (heroData.assignedUnit === unitKey) {
            return { key: hKey, data: heroData };
        }
    }
    return null;
}

// Assign a hero to a unit
function assignHero(sd, heroKey, unitKey) {
    if (!sd.heroes || !sd.heroes.data || !sd.heroes.data[heroKey]) return false;

    // Unassign from previous unit if assigned
    var prevUnit = sd.heroes.data[heroKey].assignedUnit;
    if (prevUnit) {
        // Auto-unequip items from previous unit
        var prevItems = getEquippedItems(sd, prevUnit);
        for (var pi = 0; pi < prevItems.length; pi++) {
            unequipItem(sd, prevItems[pi], prevUnit);
        }
    }

    // Unassign any hero from this unit
    for (var hKey in sd.heroes.data) {
        if (sd.heroes.data[hKey].assignedUnit === unitKey) {
            sd.heroes.data[hKey].assignedUnit = null;
        }
    }

    // Assign
    sd.heroes.data[heroKey].assignedUnit = unitKey;
    saveGame(sd);
    return true;
}

// Unassign a hero from its unit
function unassignHero(sd, heroKey) {
    if (!sd.heroes || !sd.heroes.data || !sd.heroes.data[heroKey]) return false;

    var unitKey = sd.heroes.data[heroKey].assignedUnit;
    if (!unitKey) return false;

    // Auto-unequip items
    var items = getEquippedItems(sd, unitKey);
    for (var i = 0; i < items.length; i++) {
        unequipItem(sd, items[i], unitKey);
    }

    sd.heroes.data[heroKey].assignedUnit = null;
    saveGame(sd);
    return true;
}

// Get the cost in skill points for a tier
function getHeroSkillCost(tier) {
    var costs = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 5 };
    return costs[tier] || 0;
}

// Get current level of a hero
function getHeroLevel(sd, heroKey) {
    var state = getHeroState(sd, heroKey);
    return state ? state.level : 1;
}

// Calculate bonuses from a hero's invested nodes
function calculateHeroBonuses(sd, heroKey) {
    var state = getHeroState(sd, heroKey);
    if (!state) return {};

    var bonuses = {};
    var investedNodes = state.investedNodes || [];

    // Apply simple stat bonuses from invested nodes
    // Complex conditional bonuses (on-kill, below-HP, etc.) are applied during combat
    for (var i = 0; i < investedNodes.length; i++) {
        var nodeId = investedNodes[i];
        // Find node in tree and apply bonuses
        // This is a simplified version; actual combat applies full effects
    }

    return bonuses;
}

// Check if a hero can unlock a skill node
function canUnlockNode(sd, heroKey, nodeId) {
    var state = getHeroState(sd, heroKey);
    if (!state) return false;

    var node = findNodeById(nodeId);
    if (!node) return false;

    // Check level requirement
    if (state.level < node.levelReq) return false;

    // Check point budget
    var pointsSpent = (state.investedNodes || []).reduce(function(sum, nId) {
        var n = findNodeById(nId);
        return sum + (n ? n.cost : 0);
    }, 0);
    var pointsAvailable = 20 - pointsSpent;
    if (pointsAvailable < node.cost) return false;

    // Check tier progression: must have at least 1 node from previous tier in same branch
    if (node.tier > 1) {
        var prevTierNodeIds = [];
        for (var hKey in HERO_SKILL_TREES[heroKey][node.branch][node.tier - 1]) {
            prevTierNodeIds.push(HERO_SKILL_TREES[heroKey][node.branch][node.tier - 1][hKey].id);
        }
        var hasPrevTier = false;
        for (var pt = 0; pt < prevTierNodeIds.length; pt++) {
            if (state.investedNodes.indexOf(prevTierNodeIds[pt]) >= 0) {
                hasPrevTier = true;
                break;
            }
        }
        if (!hasPrevTier) return false;
    }

    return true;
}

// Invest a skill point in a node
function investPoint(sd, heroKey, nodeId) {
    var state = getHeroState(sd, heroKey);
    if (!state || !canUnlockNode(sd, heroKey, nodeId)) return false;

    var node = findNodeById(nodeId);
    if (!node) return false;

    // Add to invested nodes
    if (!state.investedNodes) state.investedNodes = [];
    if (state.investedNodes.indexOf(nodeId) < 0) {
        state.investedNodes.push(nodeId);
    }

    saveGame(sd);
    return true;
}

// Respec a hero (reset all skill investments)
function respecHero(sd, heroKey) {
    var state = getHeroState(sd, heroKey);
    if (!state) return false;

    // Escalating cost: 500 + 500 per respec count
    var cost = 500 + (state.respecCount || 0) * 500;
    if (sd.player.gold < cost) return false;

    sd.player.gold -= cost;
    state.investedNodes = [];
    state.respecCount = (state.respecCount || 0) + 1;

    saveGame(sd);
    return true;
}

// Award XP to a hero
function heroGainXP(sd, heroKey, amount) {
    var state = getHeroState(sd, heroKey);
    if (!state || state.isDead) return false;

    // Scale XP at ~1.5x unit XP rate (handled by caller)
    state.xp = (state.xp || 0) + amount;

    // Check for level-up
    while (state.level < 20 && state.xp >= getHeroXPForLevel(state.level + 1)) {
        state.xp -= getHeroXPForLevel(state.level + 1);
        state.level += 1;
    }

    return true;
}

// XP table: 20 levels with ~1.5x unit XP scaling
var HERO_XP_TABLE = [
    0,    // L1
    100,  // L2
    175,  // L3
    289,  // L4
    478,  // L5
    790,  // L6
    1303, // L7
    2154, // L8
    3556, // L9
    5868, // L10
    9679, // L11
    15971, // L12
    26353, // L13
    43482, // L14
    71745, // L15
    118379, // L16
    195226, // L17
    322123, // L18
    531203, // L19
    876135  // L20
];

function getHeroXPForLevel(level) {
    return HERO_XP_TABLE[Math.max(0, Math.min(19, level - 1))] || 0;
}

function findNodeById(nodeId) {
    // Search all hero trees for the node
    for (var hKey in HERO_SKILL_TREES) {
        for (var branch in HERO_SKILL_TREES[hKey]) {
            for (var tier in HERO_SKILL_TREES[hKey][branch]) {
                var tierNodes = HERO_SKILL_TREES[hKey][branch][tier];
                for (var ni = 0; ni < tierNodes.length; ni++) {
                    if (tierNodes[ni].id === nodeId) return tierNodes[ni];
                }
            }
        }
    }
    return null;
}
```

### 1.4 Lyric's Death Handling

When Lyric dies (R4 mid stage), trigger this function from main-v2.js:

```javascript
function triggerLyricDeath(sd) {
    if (!sd.heroes || !sd.heroes.data || !sd.heroes.data.lyric) return;

    var lyricState = sd.heroes.data.lyric;

    // Mark as dead
    lyricState.isDead = true;

    // Unassign from unit and remove items
    if (lyricState.assignedUnit) {
        var unitKey = lyricState.assignedUnit;
        var items = getEquippedItems(sd, unitKey);
        for (var i = 0; i < items.length; i++) {
            unequipItem(sd, items[i], unitKey);
        }
        lyricState.assignedUnit = null;
    }

    // Preserve invested nodes for ending reference (don't clear)

    saveGame(sd);
}
```

---

## Part 2: Save Integration (save.js updates)

### 2.1 Update createDefaultSaveData()

Replace the heroes object in createDefaultSaveData():

```javascript
heroes: {
    kael: {
        level: 1, xp: 0,
        assignedUnit: null,
        investedNodes: [],
        respecCount: 0,
        isDead: false
    },
    lyric: {
        level: 1, xp: 0,
        assignedUnit: null,
        investedNodes: [],
        respecCount: 0,
        isDead: false
    },
    ren: {
        level: 1, xp: 0,
        assignedUnit: null,
        investedNodes: [],
        respecCount: 0,
        isDead: false
    },
    sera: {
        level: 1, xp: 0,
        assignedUnit: null,
        investedNodes: [],
        respecCount: 0,
        isDead: false
    },
    maren: {
        level: 1, xp: 0,
        assignedUnit: null,
        investedNodes: [],
        respecCount: 0,
        isDead: false
    },
    voss: {
        level: 1, xp: 0,
        assignedUnit: null,
        investedNodes: [],
        respecCount: 0,
        isDead: false
    }
}
```

### 2.2 Update SAVE_VERSION and Migration

Bump SAVE_VERSION to 10 (was 9). Add migration logic in migrateSave():

```javascript
if (data.version < 10) {
    // Hero system redesign: replace old hero system with new one
    data.heroes = {
        kael: { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false },
        lyric: { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false },
        ren: { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false },
        sera: { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false },
        maren: { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false },
        voss: { level: 1, xp: 0, assignedUnit: null, investedNodes: [], respecCount: 0, isDead: false }
    };
    data.version = 10;
}
```

---

## Part 3: Combat Integration (main-v2.js updates)

### 3.1 Before Combat Starts (initCombat)

Inside initCombat(), after synergy bonuses, calculate hero bonuses for hero-equipped units:

```javascript
// Apply hero skill effects to player units
if (typeof getHeroForUnit === 'function') {
    var sd = getSaveData();
    for (var hi = 0; hi < combatState.playerUnits.length; hi++) {
        var hu = combatState.playerUnits[hi];
        var unitKey = hu.key || hu.templateKey;
        if (!unitKey) continue;

        var heroInfo = getHeroForUnit(sd, unitKey);
        if (!heroInfo || heroInfo.data.isDead) continue;

        hu._heroKey = heroInfo.key;
        hu._heroData = heroInfo.data;

        // Apply static stat bonuses from invested nodes
        // (Conditional bonuses are applied via combat hooks during combat)
        applyHeroStatBonuses(hu, heroInfo.key, heroInfo.data);
    }
}
```

### 3.2 Hero XP Award Post-Combat

At the end of a combat (in mission rewards/results), award hero XP to heroes whose units participated:

```javascript
function awardHeroXP(sd, missionDifficulty, waveCount) {
    var baseHeroXP = missionDifficulty * 10 * waveCount;  // Scaled by mission difficulty

    for (var hKey in sd.heroes.data) {
        var heroState = sd.heroes.data[hKey];
        if (!heroState.assignedUnit) continue;
        if (heroState.isDead) continue;

        // Check if unit was in combat (participated in last mission)
        // For now, award to all assigned units
        heroGainXP(sd, hKey, Math.floor(baseHeroXP * 1.5));  // 1.5x unit XP rate
    }
}
```

### 3.3 Conditional Combat Bonuses

Many hero abilities are conditional (on-kill, below-HP, time-based, adjacency). These need hooks in the combat engine.

**On-Kill triggers** (Lyric, Sera, Voss have kill-based bonuses):
- When a unit kills another, check its hero for on-kill effects
- Example: Lyric's "Endgame Engine" restores HP/mana on kill

**Below-HP triggers** (Kael, Ren have survival-based bonuses):
- When a hero-equipped unit drops below a threshold (30%, 40%, 50%), trigger effects
- Example: Kael's "Last Defender" triggers when last hero unit survives

**Time-based ramping** (Voss has time-scaling bonuses):
- Every N seconds of combat, apply ramping stat bonuses
- Example: Voss's "War Cry" grants +3.5% ATK every 8s

**Adjacency checks** (Many heroes have nearby bonuses):
- When calculating bonuses, check adjacent cells for heroes/allies
- Example: Kael's "Shield Ally" checks adjacent allies

---

## Part 4: Item Gating (UI integration)

### 4.1 In Team Builder

When displaying units in the team builder, show a hero indicator on hero-equipped units:
- Show hero portrait/name badge on unit card
- For unhero'd units, show a "No Hero" badge (grayed out equipment icon)

### 4.2 Item Equip Restriction

In ui-v2.js, when showing the item bench and equip UI:
- Only allow equipping items on hero-equipped units
- For unhero'd units, show items as locked/grayed with "Requires Hero" tooltip
- If a hero is unassigned from a unit, auto-unequip that unit's items to bench

---

## Part 5: UI Screens (ui-v2.js updates)

### 5.1 Hero Management Screen

Add a new screen (already scaffolded in game-v2.html as `#screen-heroes`):

```javascript
function renderHeroScreen() {
    var sd = getSaveData();
    var content = document.getElementById('hero-screen-content');
    if (!content) return;

    content.innerHTML = '';

    // Hero list with status
    var heroList = document.createElement('div');
    heroList.style.cssText = 'display:flex; flex-direction:column; gap:8px;';

    for (var hKey in sd.heroes.data) {
        var heroState = sd.heroes.data[hKey];
        var heroData = HERO_DATA[hKey];

        var heroCard = document.createElement('div');
        heroCard.style.cssText = 'background:#16213e; border:1px solid #2a3a5e; border-radius:8px; padding:12px; cursor:pointer;';
        heroCard.onclick = (function(hk) {
            return function() { showHeroSkillTree(hk); };
        })(hKey);

        var title = document.createElement('div');
        title.style.cssText = 'font-weight:bold; font-size:14px; margin-bottom:4px;';
        title.textContent = heroData.name + ' (Lv ' + heroState.level + ')';

        var quote = document.createElement('div');
        quote.style.cssText = 'font-size:12px; color:#aaa; font-style:italic; margin-bottom:4px;';
        quote.textContent = '"' + heroData.quote + '"';

        var status = document.createElement('div');
        status.style.cssText = 'font-size:11px; color:#888;';
        if (heroState.isDead) {
            status.textContent = '💀 Lost in R4 mid';
            status.style.color = '#ff6666';
        } else if (heroState.assignedUnit) {
            status.textContent = '✓ Assigned to unit';
            status.style.color = '#6bcb77';
        } else {
            status.textContent = '✗ Not assigned';
        }

        heroCard.appendChild(title);
        heroCard.appendChild(quote);
        heroCard.appendChild(status);
        heroList.appendChild(heroCard);
    }

    content.appendChild(heroList);
}
```

### 5.2 Skill Tree UI

When hero is clicked, show skill tree:

```javascript
function showHeroSkillTree(heroKey) {
    var sd = getSaveData();
    var heroState = sd.heroes.data[heroKey];
    var heroData = HERO_DATA[heroKey];
    var tree = HERO_SKILL_TREES[heroKey];

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000;';

    var panel = document.createElement('div');
    panel.style.cssText = 'background:#1a1a2e; border:1px solid #444; border-radius:10px; padding:20px; max-width:700px; width:90%; max-height:80vh; overflow-y:auto;';

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'text-align:center; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid #333;';
    header.innerHTML = '<div style="font-size:20px; font-weight:bold;">' + heroData.name + '</div>' +
        '<div style="color:#aaa; font-size:13px;">Lv ' + heroState.level + ' / 20</div>' +
        '<div style="color:#e2b714; font-size:12px; margin-top:4px;">Points Available: ' + (20 - getHeroPointsSpent(heroState)) + ' / 20</div>';
    panel.appendChild(header);

    // Two branches side by side
    var branchesContainer = document.createElement('div');
    branchesContainer.style.cssText = 'display:flex; gap:12px; margin-bottom:16px;';

    for (var branch in tree) {
        var branchData = heroData.branches[branch];
        var branchPanel = document.createElement('div');
        branchPanel.style.cssText = 'flex:1; background:#16213e; border:1px solid #2a3a5e; border-radius:6px; padding:10px;';

        var branchTitle = document.createElement('div');
        branchTitle.style.cssText = 'font-weight:bold; font-size:12px; color:#e2b714; margin-bottom:8px; text-align:center;';
        branchTitle.textContent = branch + ': ' + branchData.name;
        branchPanel.appendChild(branchTitle);

        // Tiers 1-5
        for (var tier = 1; tier <= 5; tier++) {
            var tierDiv = document.createElement('div');
            tierDiv.style.cssText = 'margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid #2a3a5e;';

            var tierLabel = document.createElement('div');
            tierLabel.style.cssText = 'font-size:10px; color:#888; margin-bottom:4px; font-weight:bold;';
            tierLabel.textContent = 'T' + tier + ' (Cost: ' + getHeroSkillCost(tier) + ', Req: L' + getHeroTierLevelReq(tier) + ')';
            tierDiv.appendChild(tierLabel);

            var choicesDiv = document.createElement('div');
            choicesDiv.style.cssText = 'display:flex; flex-direction:column; gap:4px;';

            var tierNodes = tree[branch][tier];
            for (var ci = 0; ci < tierNodes.length; ci++) {
                var node = tierNodes[ci];
                var nodeDiv = document.createElement('div');
                nodeDiv.style.cssText = 'padding:6px; border-radius:4px; font-size:10px; border:1px solid #444; background:#0d0d1a;';

                var isInvested = heroState.investedNodes && heroState.investedNodes.indexOf(node.id) >= 0;
                var canInvest = canUnlockNode(sd, heroKey, node.id);
                var levelLocked = heroState.level < node.levelReq;

                if (isInvested) {
                    nodeDiv.style.background = '#1a3a1a';
                    nodeDiv.style.borderColor = '#6bcb77';
                    nodeDiv.style.color = '#6bcb77';
                    nodeDiv.style.fontWeight = 'bold';
                    nodeDiv.textContent = '✓ ' + node.name;
                } else if (levelLocked) {
                    nodeDiv.style.color = '#666';
                    nodeDiv.textContent = '? ' + node.name;
                    nodeDiv.title = 'Requires Lv ' + node.levelReq;
                } else if (canInvest) {
                    nodeDiv.style.cursor = 'pointer';
                    nodeDiv.style.borderColor = '#4488ff';
                    nodeDiv.onclick = (function(hk, nId) {
                        return function() {
                            if (investPoint(sd, hk, nId)) {
                                showHeroSkillTree(hk);
                            }
                        };
                    })(heroKey, node.id);
                    nodeDiv.textContent = '→ ' + node.name;
                } else {
                    nodeDiv.style.color = '#666';
                    nodeDiv.textContent = '✗ ' + node.name + ' (insufficient points)';
                }

                choicesDiv.appendChild(nodeDiv);
            }

            tierDiv.appendChild(choicesDiv);
            branchPanel.appendChild(tierDiv);
        }

        branchesContainer.appendChild(branchPanel);
    }
    panel.appendChild(branchesContainer);

    // Buttons: Respec, Close
    var buttonDiv = document.createElement('div');
    buttonDiv.style.cssText = 'display:flex; gap:8px; justify-content:center; margin-top:12px;';

    var respecBtn = document.createElement('button');
    respecBtn.className = 'btn-secondary';
    respecBtn.style.cssText = 'padding:8px 16px; font-size:12px;';
    respecBtn.textContent = 'Respec (' + (500 + (heroState.respecCount || 0) * 500) + 'g)';
    respecBtn.onclick = function() {
        if (respecHero(sd, heroKey)) {
            showToast('Hero reset!');
            showHeroSkillTree(heroKey);
        } else {
            showToast('Not enough gold for respec');
        }
    };
    buttonDiv.appendChild(respecBtn);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'btn-primary';
    closeBtn.style.cssText = 'padding:8px 16px; font-size:12px;';
    closeBtn.textContent = 'Done';
    closeBtn.onclick = function() { overlay.remove(); renderHeroScreen(); };
    buttonDiv.appendChild(closeBtn);

    panel.appendChild(buttonDiv);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
}

function getHeroPointsSpent(heroState) {
    if (!heroState.investedNodes) return 0;
    var spent = 0;
    for (var i = 0; i < heroState.investedNodes.length; i++) {
        var node = findNodeById(heroState.investedNodes[i]);
        if (node) spent += node.cost;
    }
    return spent;
}

function getHeroTierLevelReq(tier) {
    var reqs = { 1: 1, 2: 5, 3: 9, 4: 13, 5: 17 };
    return reqs[tier];
}
```

### 5.3 Team Builder Integration

In renderTeamBuilder(), add hero indicator badges:

```javascript
// On unit card in team builder, show hero if assigned
// Example in team roster item rendering:
var heroInfo = getHeroForUnit(sd, unitKey);
if (heroInfo) {
    var heroBadge = document.createElement('div');
    heroBadge.style.cssText = 'font-size:10px; color:#e2b714; font-weight:bold; margin-top:2px;';
    heroBadge.textContent = '👑 ' + HERO_DATA[heroInfo.key].name;
    rosterItem.appendChild(heroBadge);
} else {
    var noHeroBadge = document.createElement('div');
    noHeroBadge.style.cssText = 'font-size:10px; color:#666; margin-top:2px;';
    noHeroBadge.textContent = 'No Hero';
    rosterItem.appendChild(noHeroBadge);
}
```

---

## Part 6: Hero Availability by Region

**Timeline by region** (implement region progression checks in main-v2.js):

| Region | R1 | R2 | R3 | R4 early | R4 mid | R5 early | R5 late | R6 | R7 | R8 |
|--------|----|----|----|---------|---------|---------|---------|----|----|----|
| Kael   | ✓  | ✓  | ✓  | ✓       | ✓       | ✓       | ✓       | ✓  | ✓  | ✓  |
| Lyric  | ✓  | ✓  | ✓  | ✓       | 💀 Dies | —       | —       | —  | —  | —  |
| Ren    | —  | ✓  | ✓  | ✓       | ✓       | ✓       | ✓       | ✓  | ✓  | ✓  |
| Sera   | —  | —  | ✓  | ✓       | ✗       | ✗       | ✓       | ✓  | ✓  | ✓  |
| Maren  | —  | —  | ✓  | ✓       | ✗       | ✓       | ✓       | ✓  | ✓  | ✓  |
| Voss   | —  | —  | —  | —       | —       | —       | —       | —  | ✓  | ✓  |

When a region/stage is reached:
- R4 mid: Call triggerLyricDeath(saveData). Sera + Maren become unavailable.
- R5 early: Maren returns.
- R5 late: Sera returns.

---

## Part 7: Verification Checklist

After implementation, verify:

- [ ] HERO_DATA defined for all 6 heroes with correct philosophies
- [ ] HERO_SKILL_TREES fully transcribed from HERO-REWORK.md with all 120 nodes
- [ ] All hero functions (assign, unassign, gainXP, investPoint, respec) work
- [ ] Save migration v9→v10 creates clean hero states
- [ ] Hero screen renders all 6 heroes with correct status
- [ ] Skill tree UI shows both branches side-by-side with 5 tiers each
- [ ] T4=4pt, T5=5pt costs enforced (capstone + other T4 = 21 > impossible)
- [ ] Lyric death triggers in R4 mid, unassigns unit, removes items
- [ ] Hero availability gating works: Ren R2+, Sera/Maren R3+, Voss R7+
- [ ] Sera/Maren unavailable R4 mid, Maren returns R5 early, Sera R5 late
- [ ] Combat: hero stat bonuses applied to hero-equipped units pre-combat
- [ ] Hero XP awarded post-combat at ~1.5x unit XP rate
- [ ] Items: only hero-equipped units can equip, non-hero units show locked
- [ ] Team builder shows hero badges on hero-equipped units
- [ ] Respec cost escalates (500 + 500 per respec count)
- [ ] Lyric's invested nodes preserved after death (isDead flag, no clear)

---

## Technical Notes

- **Pattern**: All `var`, global scope, NO ES modules
- **Load order**: heroes.js loaded between units-ascension.js and save.js in game-v2.html
- **Skill tree data**: Self-contained in HERO_SKILL_TREES; see HERO-REWORK.md for exact specs
- **Combat integration**: Hero bonuses applied in initCombat(). Conditional bonuses (on-kill, below-HP, etc.) need combat hooks (implement as needed)
- **Save format**: Hero data stored in `saveData.heroes = { [heroKey]: { level, xp, assignedUnit, investedNodes, respecCount, isDead } }`
- **Hero availability**: Query via getHeroAvailability(region) before showing in UI

---

## Summary

This rewrite replaces the old 8-hero system with a 6-hero philosophy-based system matched to the story cast. Lyric's permanent death in R4 is a major mechanical event. Skill trees have real build tension (capstone vs T4 impossible combination). Item gating creates meaningful hero assignment choices. The system is self-contained, save-compatible, and UI-integrated.

All 120 skill tree nodes must be transcribed from HERO-REWORK.md verbatim during implementation.
