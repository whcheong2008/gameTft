# Prompt 35: Ground Truth Extraction

> **Purpose**: Extract every testable behavior from the HTML prototype and design docs into a single consolidated reference document. This becomes the source of truth that unit tests validate against during the Unity port. If it's not in this document, it doesn't get tested. If it's in this document and the Unity version disagrees, the Unity version has a bug.
>
> **Branch**: `feature/ground-truth`
> **Depends on**: Nothing. Can run in parallel with Prompt 34.
> **Session type**: Claude Code (no Unity MCP needed — this is pure documentation extraction)

---

## Context

Read the following files to extract ground truth:

**Core design docs:**
- `COMBAT-DESIGN.md` — damage pipeline, targeting, movement, status effects, boss framework
- `DESIGN-V2.md` — overall game design
- `MECHANICS.md` — core mechanics reference

**System-specific:**
- `HERO-SYSTEM-DESIGN.md` + `HERO-REWORK.md` — hero definitions, skill trees, bonuses
- `ITEMS-DESIGN.md` + `ITEMS-REDESIGN.md` — item system, tiers, affixes, Echo Shaping
- `PROGRESSION-DESIGN.md` + `PROGRESSION-REWORK.md` — XP, VE economy, star-up costs, level caps
- `MISSIONS-DESIGN.md` — stage definitions, lock requirements, boss encounters
- `CONTENT-DESIGN.md` — unit roster, archetypes, elements

**JS source (for actual implemented behavior):**
- `js/main-v2.js` — combat engine (the authority for how combat actually works)
- `js/units-templates.js` — all 132 unit stat tables
- `js/units-abilities.js` — all ability definitions
- `js/heroes.js` — hero definitions and skill trees
- `js/items.js` — item generation, affixes, Echo Shaping
- `js/gacha.js` — pull mechanics, pity, tier weights
- `js/save.js` — save format, migration
- `js/hub.js` — camp practices, resource flows
- `js/missions.js` — stage data, rewards, locks
- `js/synergies.js` — element/archetype synergy thresholds and bonuses
- `js/combat-benchmark.js` — headless combat runner (reference for test scenarios)

**Testing strategy:**
- `testing/testing-architecture-strategy.md` — what to test and how

---

## Output: Create `GROUND-TRUTH.md`

Create a single file at the repo root: `GROUND-TRUTH.md`

Structure it as a testable spec. Every section should contain concrete values that a unit test can assert against. Use this format:

```markdown
## [System Name]

### [Subsystem]

**Rule**: [Plain English description]
**Formula**: [Exact math if applicable]
**Test cases**:
- Input: [specific values] → Expected output: [specific value]
- Input: [edge case] → Expected output: [edge case result]
```

---

## Sections to Extract

### 1. Damage Pipeline

Extract the complete 7-step pipeline from COMBAT-DESIGN.md Appendix B and verify against `main-v2.js`:

1. Base damage: `ATK * skillMultiplier`
2. Element multiplier: Strong (1.5×), Weak (0.67×), Neutral (1.0×) — extract the full element matchup table
3. Defense reduction: `1 - DEF / (DEF + 100)`
4. Crit: `critChance` roll, `critDamage` multiplier (default 1.5×)
5. Damage variance: ±5% random
6. Status modifiers: vulnerability (+25%), resist shields, etc.
7. Final floor: minimum 1 damage

**Test cases to define:**
- Standard hit (no crit, neutral element)
- Strong element hit
- Weak element hit
- Critical hit
- Zero defense target
- Massive defense target (DEF=1000)
- Minimum damage floor (1)

### 2. Element System

Extract from COMBAT-DESIGN.md and `synergies.js`:

- All 6 elements: Flame, Aqua, Terra, Zephyr, Lux, Shadow
- Full 6×6 matchup table (which beats which)
- Synergy thresholds: 2/3/4/6 units of same element → bonus
- Exact bonus values at each threshold

### 3. Archetype System

Extract from `synergies.js`:

- All archetypes: Vanguard, Striker, Caster, Support, Assassin, Guardian
- Synergy thresholds and exact bonuses
- Archetype-element interaction rules (if any)

### 4. Unit Stats

Extract from `units-templates.js`:

- Base stats for all 132 units at star 1 (HP, ATK, DEF, SPD, CRIT, CRITDMG)
- Growth formula per star level
- Evolution pairs (base → evolved form)
- Star-up copy costs: T1=3, T2=4, T3=5, T4=8, T5=10

Provide at minimum: full stat table for 6 sample units (one per element), plus the formula for computing any unit's stats at any star level.

### 5. Abilities

Extract from `units-abilities.js`:

- Ability format: name, type (active/passive), mana cost, cooldown, damage multiplier, effect
- Sample 12 abilities fully specified (2 per element, covering different ability types)
- Mana system: starting mana, mana gain per attack, mana gain on hit, max mana
- Cast conditions and targeting rules

### 6. Passive System

Extract from `units-abilities.js`:

- 6 trigger types and when they fire
- Reentry guard behavior (prevent infinite loops)
- Sample passives with exact numeric effects

### 7. Status Effects

Extract from COMBAT-DESIGN.md and `main-v2.js`:

- All status effects: stun, freeze, burn, poison, bleed, silence, slow, shield, regen, taunt, etc.
- Duration, tick timing, stacking rules
- DR (diminishing returns) on CC: formula
- Tenacity system: how it reduces CC duration
- Immunity windows after CC

### 8. Grid and Movement

Extract from COMBAT-DESIGN.md and `main-v2.js`:

- Grid dimensions (4×2 per side = 16 cells total)
- Movement rules: who moves, when, how far
- Pathfinding: BFS, no diagonal movement
- Attack ranges by archetype (melee=1, ranged=2-3, etc.)
- Assassin dash mechanic

### 9. Boss Framework

Extract from COMBAT-DESIGN.md and `main-v2.js`:

- Boss size: 2×2 grid
- Phase transitions: HP thresholds
- Enrage timer
- Telegraph system
- All 8 region bosses with their specific mechanics

### 10. Gacha System

Extract from PROGRESSION-REWORK.md and `gacha.js`:

- Tier pull rates at each player level (exact table)
- Pity system: hard pity threshold, soft pity ramp
- Banner rate-up multiplier
- Evolved copy handling (T3+ pulls at high player levels)
- VE cost per pull

**Test cases:**
- 10,000 pulls at level 1 → expected T1/T2/T3 distribution (within tolerance)
- Pity counter increments correctly
- Pity resets after trigger
- Player level 15 → T5 units appear in pool

### 11. Hero System

Extract from HERO-SYSTEM-DESIGN.md, HERO-REWORK.md, and `heroes.js`:

- All 6 heroes: names, elements, team bonus types
- Skill tree structure: nodes, costs, prerequisites
- Hero XP: how earned, curve
- Shard system: acquisition, costs
- Exact bonus values for each skill tree node

### 12. Item System

Extract from ITEMS-REDESIGN.md and `items.js`:

- Item tiers and rarity levels
- Affix pools per tier
- Affix roll ranges (min/max per affix per tier)
- Echo Shaping: reroll mechanics, costs, lock rules
- Gem system: socket types, gem effects
- Set bonuses (if any)

### 13. Economy / Progression

Extract from PROGRESSION-REWORK.md, `save.js`, `hub.js`:

- VE income per stage (by region)
- VE costs: pulls, star-up, skill tree, item crafting, etc.
- XP per stage, XP curve (level → XP required)
- Level caps per region (hard caps)
- Team size progression: L1→3, L4→4, L8→5, L12→6, L16→7, L17→8
- Camp practice levels and costs

### 14. Stage / Mission Data

Extract from `missions.js`:

- All 74 stages: ID, region, name, type, required level, lock conditions
- Enemy composition per stage (at minimum: wave count, enemy tiers, enemy count)
- Boss stage identifiers
- Reward tables per stage (VE, XP, item drops)

### 15. Save System

Extract from `save.js`:

- Save format schema (what fields, what types)
- Migration history (v1→v2→...→current)
- What triggers auto-save
- What data is stored vs computed

---

## Validation

After creating `GROUND-TRUTH.md`:

1. Spot-check 5 damage calculations against `combat-benchmark.js` or manual JS execution
2. Spot-check 3 gacha rate tables against `gacha.js` source
3. Spot-check 3 unit stat entries against `units-templates.js`
4. Flag any discrepancies between design docs and JS implementation (design docs are intent, JS is actual — note both)

---

## Commit

```
git add GROUND-TRUTH.md
git commit -m "Prompt 35: Ground truth extraction — consolidated testable spec from HTML prototype and design docs"
```
