# Design Evaluation & Testing Recommendations

> For the tester session. This document evaluates the current balance simulator's methodology, identifies what it gets wrong, and specifies what a proper testing tool should do instead.

---

## 1. Why the Current Simulator Can't Be Trusted

The unit-simulator.js in its current form doesn't test the game. It tests a regex parser's interpretation of ability description strings. This creates a chain of unreliability that makes every number in the balance report suspect.

### Problem A: Regex-Parsed Descriptions ≠ Actual Mechanics

The simulator's `parseAbilityMechanics` function reads ABILITY_DATA text strings and extracts numbers with patterns like `/(\d+)%\s*ATK/`. This means:

- If a description says "Deal 200% ATK" it picks up 200%. But if it says "Strike for massive damage scaling with ATK" it picks up nothing and defaults to 0.
- The parser only captures the FIRST ATK% match. An ability that says "Deal 150% ATK, then 100% ATK to nearby" only registers the 150%.
- Multi-hit abilities are detected by `/(\d+)\s*times/` — so "strike 4 times" works, but "unleash a flurry of rapid slashes" doesn't.
- AoE detection relies on keyword matching ("nearby", "area", "cone", "radius"). An ability that hits multiple targets without using those exact words gets scored as single-target.
- We just rewrote every ABILITY_DATA description for the template system, which means every regex match is potentially broken against the new text.

This is the fundamental flaw: the simulator should be calling the actual game engine functions (`executeAbility`, `dealDamage`, `addStatus`, etc.) rather than trying to reverse-engineer what they do from tooltip text.

### Problem B: Solo Unit in a Vacuum ≠ Auto-Battler Combat

Each role simulation runs a single unit against phantom inputs:
- Warriors swing at nothing (damage is just `ATK * attacksPerTick * critMult`, with no actual target to hit, no DR to penetrate, no dodge to miss against).
- Tanks absorb a flat 60 DPS stream with no positioning, no taunt targets, no allies to shield.
- Healers heal phantom allies at 800 HP who don't interact with anything.
- Assassins dash to nothing — kill resets assume a fixed 40% probability rather than simulating actual target selection.

This matters because the game is an auto-battler where value comes from interactions. A Crowd Puller's pull means nothing if there's no AoE mage behind it to capitalize. A Shield Stacker's ally shields have zero value without allies taking actual damage. A Chain Killer's snowball has no meaning if there's no actual target dying.

### Problem C: The CR Formula Conflates Incommensurable Things

The Combat Rating formula tries to compress wildly different value types into one number:
- Tank CC seconds × 30 gets added to effective HP / 50. These are different currencies.
- Healer taunt duration × 100 gets added to total healing. Tanking ≠ healing.
- Mage AoE gets a flat 1.3x multiplier regardless of whether hitting 2 or 6 targets.
- Assassin time-to-kill scoring is `500 - (ttk × 50)`, which means a 1-second difference in kill time = 50 CR, the same weight as 50 extra DPS sustained over the full fight. Those shouldn't be equivalent.

The result: tanks, healers, and support units all appear weak because their real value (enabling carries, controlling fights, preventing deaths) doesn't register in a solo simulation.

### Problem D: Tier Scaling Looks Flat Because the Sim Ignores What Makes Higher Tiers Valuable

T4 and T5 units have:
- Larger AoE radius and more targets hit
- Longer CC durations and wider CC areas
- Team-wide auras and passive buffs (Phoenix +15% ATK to all Fire, Storm Dragon +18% crit to all Lightning)
- Unique mechanics (submerge, revive, summons, stance toggle)
- Higher stat budgets that compound with synergy multipliers

None of these compound in a solo-unit-vs-flat-DPS scenario. A Phoenix revive is worth zero if nothing ever kills the Phoenix (incoming DPS tuned so everyone survives 30s). Storm Dragon's team-wide crit aura is approximated as `allyCount × ATK × extraCrit × 0.5` — a rough estimate that ignores how crit interacts with the actual damage pipeline multiplicatively.

---

## 2. What a Proper Tester Should Measure

The right approach is to use the actual game engine. The prototype already has a fully functional combat system with `startCombat`, `combatTick`, `executeAbility`, `dealDamage`, `processStatusEffects`, and all the synergy/archetype logic. The tester should run real fights through this engine.

### Test Type A: Unit Contribution in Standardized Teams

**Setup:** For each unit being tested, build a standardized team around it (e.g., 5 units total). Measure win rate and combat metrics across many trials against a fixed enemy comp.

**Why this works:** It captures how a unit actually contributes — a Crowd Puller's value shows up as win rate improvement when the team has AoE carries behind it. A healer's value shows up as team survival time. A Chain Killer's snowball shows up in fight duration (fast wins from kill chains).

**Suggested standard teams per role:**
- Testing a Warrior: 1 tank, 1 healer, the warrior, 1 archer, 1 mage
- Testing a Tank: the tank, 1 warrior, 1 healer, 1 archer, 1 mage
- Testing an Assassin: 1 tank, 1 warrior, the assassin, 1 archer, 1 healer
- Testing a Healer: 1 tank, 1 warrior, 1 archer, the healer, 1 mage
- Testing a Mage: 1 tank, 1 warrior, 1 healer, the mage, 1 archer
- Testing an Archer: 1 tank, 1 warrior, 1 healer, 1 mage, the archer

The supporting cast should be vanilla T2 units from a neutral element (Force works — no matchup skew). Swap only the unit under test, keep everything else constant. That way differences in win rate and team DPS are attributable to the swapped unit.

**Standard enemy comp:** Mirror the friendly team structure (1 of each role, same tier as the unit under test, Force element). This gives a balanced fight where all roles are relevant.

### Test Type B: Tier Scaling Validation

**Goal:** Verify that a T3 team meaningfully outperforms a T2 team, a T4 team outperforms T3, etc.

**Setup:** Build full mono-element teams at each tier bracket (all T1, all T2, all T3, etc.) and pit them against the same standardized enemy comp. Measure win rate and average fight duration.

**Expected outcome:** If tier scaling is healthy, an all-T2 team should beat an all-T1 team ~70-80% of the time. All-T3 vs all-T2 should be similar. If tiers are flat (like the current report suggests), we'll see it clearly as ~50% win rates between adjacent tiers.

### Test Type C: Template Effectiveness Comparison

**Goal:** Verify that units sharing the same template but different elements perform comparably.

**Setup:** For each template (e.g., "execute_striker"), gather all units that use it (Flame Warrior, Inferno Fox, Shadow Blade, Iron Duelist). Run each in the same standardized team slot against the same enemy. Compare their contribution metrics.

**Expected outcome:** Units on the same template at the same tier should perform within ~15% of each other. If Fire's Execute Striker massively outperforms Force's Execute Striker at the same cost, the template's element skinning has a balance issue.

### Test Type D: Cross-Element Bridge Synergy Validation

**Goal:** Verify that bridge synergies (shared templates across elements) create measurable team improvement.

**Setup:** Build teams that deliberately include bridge pairs:
- Fire + Lightning (DoT Detonator bridge): include Ember Scout + Spark Fencer
- Water + Earth (Shield Stacker bridge): include Shell Knight + Stone Guard
- Wind + Lightning (Chain Killer bridge): include Zephyr Scout + Volt Runner

Compare win rates against control teams that have the same number of units but no shared templates. The bridge comp should win more often — if it doesn't, the informal synergy isn't working.

### Test Type E: Synergy Threshold Breakpoints

**Goal:** Verify that hitting element synergy thresholds (2/4/7/10) provides meaningful power spikes.

**Setup:** Build a team with 1 Fire unit, then 2, then 4, then 7, then 10 (prismatic). Measure win rate at each breakpoint against a fixed enemy.

**Expected outcome:** Steep jumps at each threshold. The 2→4 jump should be noticeable. The 7-piece should be a major spike. Prismatic (10) should feel game-winning. If the curve is smooth or flat, the synergy bonuses need tuning.

---

## 3. Design Concerns to Investigate

Beyond testing methodology, there are structural design questions the tester should help answer:

### 3a. Stat Budget vs. Ability Power Balance

Currently, unit power comes from two sources: base stats and abilities. The question is whether the ratio is right. If base stats dominate, abilities feel cosmetic. If abilities dominate, auto-attacks feel pointless.

**Test:** Run fights with abilities disabled (auto-attack only) vs. abilities enabled. The delta tells you how much of a unit's power comes from abilities. Target: abilities should contribute 40-60% of a carry's total damage, and 60-80% of a support's total value.

**Concern from the report:** Iron Soldier (T1 Force, Ramping Attacker) had the 3rd highest warrior CR at 546, likely because the Ramping Attacker passive makes auto-attacks scale hard. If his passive alone outscales other warriors' entire ability kits, the template is overtuned for auto-attack-focused units.

### 3b. Mana Economy Across Templates

Different templates have very different mana costs and cast frequencies:
- Chain Killer: 40-50 mana, casts often, value comes from kill resets
- Frontload Nuker: 70-85 mana, first cast is huge, subsequent casts are weaker
- Unkillable Wall: 85-95 mana, casts rarely, each cast is a major defensive event

**Test:** Track average casts per fight for each template. If some templates average 8 casts while others average 2, the mana costs need rebalancing. The GAME FEEL target: every unit should cast 3-6 times per average-length fight. Too few = ability feels irrelevant. Too many = spammy and each cast feels weak.

### 3c. Healer Value Problem

The balance report showed healers dramatically underperforming. This might be a real problem, not just a measurement issue. In an auto-battler, healing competes with damage prevention (shields, CC, killing enemies before they deal damage). If fights are short enough that enemies die before healing matters, healers ARE weak.

**Test:** Track average fight duration. If fights average 8-12 seconds, healing barely matters. If fights average 20-30 seconds, healing is critical. The template system gives healers the Heal-and-Harm template (heals + damage) and Drain Fighter (sustain through damage), which should help — but verify it.

### 3d. Assassin Kill Chain Reliability

Chain Killer is one of the most common templates (5 units). Its value depends entirely on actually getting kills to trigger the chain. If the first target is too tanky to die quickly, the whole template falls apart.

**Test:** Track how often Chain Killer units actually trigger their kill-chain mechanic in real fights. If it triggers less than 30% of fights, the template needs lower kill thresholds or alternative value paths (damage even without kills).

### 3e. Tank Template Differentiation

Three tank templates exist: Shield Stacker, Revenge Tank, and Unkillable Wall. The concern is whether they feel distinct in practice or just "tanky unit that lives long."

**Test:** Compare fight replays/logs for teams with each tank template. Shield Stacker should show high ally shield generation. Revenge Tank should show meaningful reflect damage. Unkillable Wall should show the HP-threshold triggers activating. If all three just soak damage and die, the templates aren't delivering on their fantasy.

### 3f. Element Matchup Asymmetry

The element matchup table is not symmetric:
- Water is weak to BOTH Earth AND Lightning (2 weaknesses)
- Earth is strong against BOTH Water AND Lightning (2 strengths)
- Force has no strengths or weaknesses

This means Earth has a structural advantage and Water has a structural disadvantage. Force is the "safe pick" that never gets countered.

**Test:** Run a round-robin of mono-element teams (Fire vs Water, Fire vs Earth, ... all 15 pairs). Check if any element has a dramatically skewed win rate across all matchups. Earth should not win >65% overall and Water should not lose >65% overall; if they do, the double-weakness/double-strength needs compensation (Water synergy bonuses should be stronger to offset).

---

## 4. Implementation Guidance for the Tester

### Use the Real Combat Engine

The prototype's combat system is in `main-v2.js`. The key functions:
- `startCombat(playerUnits, enemyUnits)` — sets up combatState
- `combatTick(dt)` — advances combat by dt seconds
- `executeAbility(caster)` — now dispatches to template engine via `executeTemplateAbility`
- `dealDamage(source, target, rawDamage, options)` — full damage pipeline
- `processStatusEffects(unit, dt)` — ticks burns, stuns, etc.
- `processTickPassives(allUnits, dt)` — template passive ticks
- `applySynergyBonuses(units, synergies, combatState)` — applies element/archetype buffs

The tester should create combat units using the template data (like `createSimUnit` does), set up a combatState, then run `combatTick` in a loop until one side is dead. Log the metrics from `combatStats` on each unit afterward.

### Output Format

For each test, output:
- Win/loss outcome
- Fight duration (seconds)
- Per-unit: damage dealt, damage taken, healing done, shields given, ability casts, kills
- Per-team: total damage, total healing, element synergy tier active, units alive at end

Aggregate across N trials (suggest 50-100 per test case for statistical significance, since crits and dodge are RNG-dependent).

### Priority Order

1. **Test Type A first** (unit contribution in standard teams) — this replaces the existing balance report with trustworthy numbers
2. **Test Type B** (tier scaling) — validates the most critical concern from the old report
3. **Test Type E** (synergy breakpoints) — validates element synergy design
4. **Test Types C and D** (template comparison, bridge synergies) — validates the new template system specifically
5. **Design investigations** (3a-3f) — deeper dives once the foundation is solid

---

## 5. Success Criteria

The game is balanced when:

- **Tier scaling:** Each tier jump should yield 25-40% win rate advantage in mirror-structure fights. A full T3 team should beat a full T1 team >85% of the time.
- **Role parity:** No role should be "never picked." Healers should show measurable win rate improvement when included vs. a 6th damage dealer.
- **Element parity:** No element should exceed 60% win rate across all matchups in round-robin. Force (the neutral element) should sit near 50%.
- **Template consistency:** Same-template, same-tier units across different elements should perform within 20% of each other.
- **Bridge synergy:** Teams with bridge-paired units should outperform random-paired teams by 5-15%.
- **Fight pacing:** Average fight duration should be 15-25 seconds. Under 10s = healers/tanks irrelevant. Over 35s = stall comps dominate.
