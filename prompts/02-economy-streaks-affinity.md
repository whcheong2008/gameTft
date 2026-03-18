# Prompt: Win/Loss Streak, Income Display, and Shop Pool Affinity

You are adding three related economy features to a modular auto-battler game. The game is split across multiple JS files loaded via plain `<script>` tags (global scope, no imports/exports).

## FIRST: Read these files to understand the codebase
- `MECHANICS.md` — Full game rules reference
- `js/economy.js` — Current income calculation
- `js/shop.js` — Shop rolling and pool weights
- `js/main.js` — Game state and round flow
- `js/ui.js` — All rendering
- `js/synergies.js` — Active synergy tracking (needed for affinity)
- `game.html` — HTML and CSS

Read ALL of these before writing any code.

---

## Feature 1: Win/Loss Streak

### Design
Track consecutive wins and losses. Award bonus gold.

| Streak Length | Bonus Gold |
|--------------|-----------|
| 2            | +1        |
| 3            | +2        |
| 4            | +3        |
| 5+           | +4 (cap)  |

### Rules
- **Win** increments winStreak, resets lossStreak to 0
- **Loss** increments lossStreak, resets winStreak to 0
- **Draw** (both sides wiped simultaneously) resets BOTH streaks to 0
- Streak bonus added to gold income during planning phase
- IMPORTANT: In this game, rounds only advance on win. Losing = retry same round. But the streak still tracks — losing the same round twice = 2-loss streak.

### State — Add to gameState in main.js:
```js
winStreak: 0,
lossStreak: 0
```

### Implementation
Find where combat results are processed (the callback after combat ends). Add streak tracking there:
```js
function updateStreaks(result) {
    if (result === 'win') {
        gameState.winStreak++;
        gameState.lossStreak = 0;
    } else if (result === 'loss') {
        gameState.lossStreak++;
        gameState.winStreak = 0;
    } else { // draw
        gameState.winStreak = 0;
        gameState.lossStreak = 0;
    }
}

function getStreakBonus() {
    const streak = Math.max(gameState.winStreak, gameState.lossStreak);
    if (streak >= 5) return 4;
    if (streak >= 4) return 3;
    if (streak >= 3) return 2;
    if (streak >= 2) return 1;
    return 0;
}
```

Modify `calculateIncome` in economy.js to include streak:
```js
function calculateIncome(gameState) {
    const base = 5;
    const interest = Math.min(5, Math.floor(gameState.gold / 10));
    const streak = getStreakBonus();
    return { base, interest, streak, total: base + interest + streak };
}
```

---

## Feature 2: Income Breakdown Display

When gold is awarded at the start of planning phase, show a breakdown.

### Format
Display near the gold counter or in the combat log:
```
+5 base, +3 interest, +2 streak = 10 gold
```

If win streak active: show "🔥 Win ×3"
If loss streak active: show "💀 Loss ×2"

### UI
Add to the game info panel area. Could be a small text line that appears for ~3 seconds after income is awarded, or a persistent line that updates each round. Choose whichever fits the existing UI better.

Also show current streak status persistently in the game info area:
- "🔥 Win Streak: 3 (+2g)" if on a win streak of 3+
- "💀 Loss Streak: 2 (+1g)" if on a loss streak of 2+
- Nothing if streak < 2

---

## Feature 3: Shop Pool Affinity System

### Design
Active synergies (archetypes on the board) slightly increase the chance of seeing matching units in the shop.

### Mechanic
When rolling each shop card:
1. Pick cost tier using existing level-gated SHOP_WEIGHTS table (this does NOT change)
2. From all units of that cost tier, apply affinity weight bonuses:
   - Base weight for every unit: **1.0**
   - If unit shares an archetype with an active synergy (≥2 of that archetype on board): **+0.15**
   - If unit shares an element with 2+ board units of that element: **+0.10**
   - These stack: a unit matching both an active archetype AND a common element gets **+0.25** total weight
3. Weighted random select from the affinity-adjusted pool

### Example
Player has 3 Guardians and 2 Fire units on board. Rolling a cost-1 slot:
- Stone Guard (guardian, earth): weight 1.0 + 0.15 (guardian active) = 1.15
- Flame Warrior (striker, fire): weight 1.0 + 0.10 (fire common) = 1.10
- Frost Archer (striker, water): weight 1.0 (no match) = 1.00
- Weighted random pick from these

### Implementation
Modify the shop roll function in `js/shop.js`. Currently it probably picks a random unit from valid cost tiers. Add weighted selection:

```js
function rollShopCard(gameState) {
    // 1. Pick cost tier (existing logic — unchanged)
    const level = Math.min(gameState.level, 8);
    const weights = SHOP_WEIGHTS[level];
    const costTier = weightedRandomPick([1, 2, 3, 4, 5], weights);

    // 2. Get all units of this cost
    const candidates = SHOP_POOL_KEYS.filter(key => UNIT_TEMPLATES[key].cost === costTier);
    if (candidates.length === 0) return rollShopCard(gameState); // retry if no units at this cost

    // 3. Apply affinity weights
    const affinityWeights = candidates.map(key => {
        let weight = 1.0;
        const template = UNIT_TEMPLATES[key];

        // Archetype affinity: +0.15 if archetype has active synergy (≥2 on board)
        if (template.archetype && gameState.activeSynergies[template.archetype] >= 2) {
            weight += 0.15;
        }

        // Element affinity: +0.10 if 2+ board units share this element
        if (template.element && gameState.activeElements[template.element] >= 2) {
            weight += 0.10;
        }

        return weight;
    });

    // 4. Weighted random select
    return candidates[weightedRandomIndex(affinityWeights)];
}
```

### UI (Subtle)
Optional but nice: On shop cards for units that got an affinity boost, add a small "🔗" indicator. Tooltip on the indicator says "Synergy affinity — more likely to appear."

---

## Files to Modify

- **js/economy.js**: Update calculateIncome to include streak bonus. Add getStreakBonus function.
- **js/shop.js**: Add affinity weighting to shop roll function.
- **js/main.js**: Add winStreak/lossStreak to gameState. Call updateStreaks after combat. Wire income breakdown.
- **js/ui.js**: Add income breakdown display. Add streak indicator in game info. Add optional affinity indicator on shop cards.
- **game.html**: Add CSS for streak display and income breakdown if needed.

## What NOT to Change
- Unit stats, synergies, evolution — all existing balance untouched
- Combat mechanics — no changes
- XP/leveling thresholds — no changes
- The SHOP_WEIGHTS table itself — don't change the level-gated cost tier probabilities
- Enemy generation — no changes

## Testing Mentally
1. Win rounds 1, 2, 3 → win streak shows "🔥 Win Streak: 3 (+2g)"
2. Income breakdown shows: "+5 base, +2 interest, +2 streak = 9 gold" (assuming 20g saved)
3. Lose round 4 → win streak resets, loss streak = 1 (no bonus yet)
4. Lose round 4 again → loss streak = 2 → "💀 Loss Streak: 2 (+1g)"
5. Draw → both streaks reset to 0
6. At level 5 with 3 Guardians on board, refresh shop → Guardian units appear slightly more than baseline
7. Affinity indicator shows on boosted shop cards
