// =============================================================================
// teams.js — Roster management, team building, and board deployment
// =============================================================================

// ---- Roster View ----
// Returns all collected units as an array of { key, template, stars, copiesForNext, canStarUp }

function getRoster(saveData) {
    var roster = [];
    var keys = Object.keys(saveData.collection);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var entry = saveData.collection[key];

        var tmpl = UNIT_TEMPLATES[key] || EVOLVED_TEMPLATES[key];
        if (!tmpl) continue;

        var isEvolved = !!EVOLVED_TEMPLATES[key];

        roster.push({
            key: key,
            template: tmpl,
            stars: entry.stars,
            copiesForNext: entry.copiesForNext,
            copiesNeeded: getStarUpCost(),
            canStarUp: canStarUp(saveData, key),
            isEvolved: isEvolved
        });
    }

    // Sort: evolved first, then by cost (desc), then stars (desc), then name
    roster.sort(function(a, b) {
        if (a.isEvolved !== b.isEvolved) return a.isEvolved ? -1 : 1;
        var costA = a.template.cost || a.template.baseCost || 0;
        var costB = b.template.cost || b.template.baseCost || 0;
        if (costB !== costA) return costB - costA;
        if (b.stars !== a.stars) return b.stars - a.stars;
        return a.template.name.localeCompare(b.template.name);
    });

    return roster;
}

// ---- Team Building ----

// Add a unit to the active team at a specific grid position
function addToTeam(saveData, templateKey, row, col) {
    var team = getActiveTeam(saveData);
    var maxSize = getMaxTeamSize(saveData);

    // Check if unit is in collection
    if (!saveData.collection[templateKey]) {
        return { success: false, reason: 'Unit not in collection' };
    }

    // Check if this unit is already on the team
    for (var i = 0; i < team.slots.length; i++) {
        if (team.slots[i].key === templateKey) {
            return { success: false, reason: 'Unit already on team' };
        }
    }

    // One-family-one-slot: check for evolution family conflicts
    var unitTemplate = UNIT_TEMPLATES[templateKey] || EVOLVED_TEMPLATES[templateKey];
    var familyConflictIdx = -1;
    var familyConflictName = '';
    if (unitTemplate) {
        for (var fi = 0; fi < team.slots.length; fi++) {
            var otherKey = team.slots[fi].key;
            var otherTmpl = UNIT_TEMPLATES[otherKey] || EVOLVED_TEMPLATES[otherKey];
            if (!otherTmpl) continue;

            // Is templateKey an evolved form of otherKey?
            if (otherTmpl.evolvedForm === templateKey) {
                familyConflictIdx = fi;
                familyConflictName = otherTmpl.name;
                break;
            }
            // Is otherKey an evolved form of templateKey?
            if (unitTemplate.evolvedForm === otherKey) {
                familyConflictIdx = fi;
                familyConflictName = otherTmpl.name;
                break;
            }
            // Check via EVOLVED_TEMPLATES baseKey
            var evolvedTmpl = EVOLVED_TEMPLATES[otherKey];
            if (evolvedTmpl && evolvedTmpl.baseKey === templateKey) {
                familyConflictIdx = fi;
                familyConflictName = otherTmpl.name;
                break;
            }
            var newEvolvedTmpl = EVOLVED_TEMPLATES[templateKey];
            if (newEvolvedTmpl && newEvolvedTmpl.baseKey === otherKey) {
                familyConflictIdx = fi;
                familyConflictName = otherTmpl.name;
                break;
            }
        }
    }

    // Remove conflicting family member if found
    if (familyConflictIdx >= 0) {
        team.slots.splice(familyConflictIdx, 1);
        if (typeof showNotification === 'function') {
            showNotification('Removed ' + familyConflictName + ' — same family');
        }
    }

    // Check if team is full (after potential removal)
    if (team.slots.length >= maxSize) {
        return { success: false, reason: 'Team is full (' + maxSize + ' slots)' };
    }

    // Check if position is occupied
    for (var j = 0; j < team.slots.length; j++) {
        if (team.slots[j].row === row && team.slots[j].col === col) {
            return { success: false, reason: 'Position occupied' };
        }
    }

    team.slots.push({ key: templateKey, row: row, col: col });
    autoSave(saveData);
    return { success: true };
}

// Remove a unit from the active team
function removeFromTeam(saveData, templateKey) {
    var team = getActiveTeam(saveData);
    for (var i = 0; i < team.slots.length; i++) {
        if (team.slots[i].key === templateKey) {
            team.slots.splice(i, 1);
            autoSave(saveData);
            return true;
        }
    }
    return false;
}

// Move a unit to a new position on the team grid
function moveOnTeam(saveData, templateKey, newRow, newCol) {
    var team = getActiveTeam(saveData);

    // Check if target position is occupied by another unit
    for (var i = 0; i < team.slots.length; i++) {
        if (team.slots[i].row === newRow && team.slots[i].col === newCol) {
            if (team.slots[i].key !== templateKey) {
                // Swap positions
                var sourceSlot = null;
                for (var j = 0; j < team.slots.length; j++) {
                    if (team.slots[j].key === templateKey) {
                        sourceSlot = team.slots[j];
                        break;
                    }
                }
                if (sourceSlot) {
                    var tmpRow = sourceSlot.row;
                    var tmpCol = sourceSlot.col;
                    sourceSlot.row = newRow;
                    sourceSlot.col = newCol;
                    team.slots[i].row = tmpRow;
                    team.slots[i].col = tmpCol;
                    autoSave(saveData);
                    return true;
                }
            }
            return false;
        }
    }

    // Move to empty position
    for (var k = 0; k < team.slots.length; k++) {
        if (team.slots[k].key === templateKey) {
            team.slots[k].row = newRow;
            team.slots[k].col = newCol;
            autoSave(saveData);
            return true;
        }
    }
    return false;
}

// ---- Deploy Team to Combat Board ----
// Creates unit instances from the team config for use in combat

function deployTeam(saveData) {
    var team = getActiveTeam(saveData);
    var board = [];

    // Initialize empty 4x7 board
    for (var r = 0; r < 4; r++) {
        board[r] = [];
        for (var c = 0; c < 7; c++) {
            board[r][c] = null;
        }
    }

    // Place each team member
    for (var i = 0; i < team.slots.length; i++) {
        var slot = team.slots[i];
        var entry = saveData.collection[slot.key];
        if (!entry) continue;

        var unit = createUnit(slot.key, entry.stars);
        if (unit) {
            board[slot.row][slot.col] = unit;
        }
    }

    return board;
}

// Create a combat-ready unit instance from template + star level
function createUnit(templateKey, stars) {
    var tmpl = UNIT_TEMPLATES[templateKey] || EVOLVED_TEMPLATES[templateKey];
    if (!tmpl) return null;

    var isEvolved = !!EVOLVED_TEMPLATES[templateKey];
    var mult = getStarMultiplier(stars);

    return {
        key: templateKey,
        name: tmpl.name,
        type: tmpl.type,
        archetype: tmpl.archetype,
        element: tmpl.element,
        cost: tmpl.cost || tmpl.baseCost || 1,
        stars: stars,
        hp: Math.floor(tmpl.hp * mult),
        maxHp: Math.floor(tmpl.hp * mult),
        attack: Math.floor(tmpl.attack * mult),
        attackSpd: tmpl.attackSpd,
        range: tmpl.range,
        moveSpd: tmpl.moveSpd,
        evolved: isEvolved,
        ability: isEvolved ? tmpl.ability : null,
        // Combat state
        x: 0, y: 0,
        attackCooldown: 0,
        target: null,
        shield: 0
    };
}

// ---- Team Synergy Preview ----
// Calculate what synergies would be active for the current team

function previewTeamSynergies(saveData) {
    var team = getActiveTeam(saveData);
    var archetypeCounts = {};
    var elementCounts = {};

    for (var i = 0; i < team.slots.length; i++) {
        var tmpl = UNIT_TEMPLATES[team.slots[i].key] || EVOLVED_TEMPLATES[team.slots[i].key];
        if (!tmpl) continue;

        // Count archetypes
        if (!archetypeCounts[tmpl.archetype]) archetypeCounts[tmpl.archetype] = 0;
        archetypeCounts[tmpl.archetype]++;

        // Count elements
        if (!elementCounts[tmpl.element]) elementCounts[tmpl.element] = 0;
        elementCounts[tmpl.element]++;
    }

    // Determine active synergies (same logic as synergies.js)
    var activeSynergies = {};
    var archetypeKeys = Object.keys(archetypeCounts);
    for (var j = 0; j < archetypeKeys.length; j++) {
        var archKey = archetypeKeys[j];
        var archData = ARCHETYPES[archKey];
        if (!archData) continue;

        var count = archetypeCounts[archKey];
        var tierReached = 0;
        for (var t = 0; t < archData.thresholds.length; t++) {
            if (count >= archData.thresholds[t]) tierReached = t + 1;
        }
        if (tierReached > 0) {
            activeSynergies[archKey] = { count: count, tier: tierReached };
        }
    }

    // Determine active element synergies
    var activeElementSynergies = {};
    var elemKeys = Object.keys(elementCounts);
    for (var e = 0; e < elemKeys.length; e++) {
        var elemKey = elemKeys[e];
        var elemSyn = ELEMENT_SYNERGIES[elemKey];
        if (!elemSyn) continue;

        var eCount = elementCounts[elemKey];
        var eTier = 0;
        for (var et = 0; et < elemSyn.thresholds.length; et++) {
            if (eCount >= elemSyn.thresholds[et]) eTier = et + 1;
        }
        if (eTier > 0) {
            activeElementSynergies[elemKey] = { count: eCount, tier: eTier };
        }
    }

    return {
        archetypeCounts: archetypeCounts,
        elementCounts: elementCounts,
        activeSynergies: activeSynergies,
        activeElementSynergies: activeElementSynergies,
        teamSize: team.slots.length,
        maxSize: getMaxTeamSize(saveData)
    };
}
