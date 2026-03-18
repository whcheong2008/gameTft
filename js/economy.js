// =============================================================================
// economy.js — Gold income, interest, XP, leveling
// =============================================================================

var XP_TABLE = [0, 2, 4, 8, 12, 20, 32, 48, 68];

function updateStreaks(gs, result) {
    if (result === 'win') {
        gs.winStreak++;
        gs.lossStreak = 0;
    } else if (result === 'loss') {
        gs.lossStreak++;
        gs.winStreak = 0;
    } else { // draw
        gs.winStreak = 0;
        gs.lossStreak = 0;
    }
}

function getStreakBonus(gs) {
    var streak = Math.max(gs.winStreak, gs.lossStreak);
    if (streak >= 5) return 4;
    if (streak >= 4) return 3;
    if (streak >= 3) return 2;
    if (streak >= 2) return 1;
    return 0;
}

function calculateIncome(gs) {
    var base = 5;
    var interest = Math.min(5, Math.floor(gs.gold / 10));
    var streak = getStreakBonus(gs);
    return { base: base, interest: interest, streak: streak, total: base + interest + streak };
}

function addXP(gs, amount) {
    if (gs.level >= 9) return;
    gs.xp += amount;
    while (gs.level < 9 && gs.xp >= gs.xpToLevel) {
        gs.xp -= gs.xpToLevel;
        gs.level += 1;
        gs.unitCap = gs.level;
        if (gs.level < 9) {
            gs.xpToLevel = XP_TABLE[gs.level];
        } else {
            gs.xpToLevel = 0;
            gs.xp = 0;
        }
    }
}

function buyXP(gs) {
    if (gs.gold < 4) return false;
    if (gs.level >= 9) return false;
    gs.gold -= 4;
    addXP(gs, 4);
    return true;
}
