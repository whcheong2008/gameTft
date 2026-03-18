# Item System — Deep Design Document

> Comprehensive item design for a publishable auto-battler. Expands the current 8-component, 8-recipe system into a deep crafting economy with enhancement, gems, mana items, status items, and a meaningful endgame item chase.

## Design Goals

1. **Every item decision matters**: Choosing which items to craft, who to equip them on, and how to enhance them should feel like a meaningful strategic choice.
2. **Multiple progression paths**: Players can invest in rarity grinding, enhancement levels, gem socketing, or set completion — each rewards a different playstyle.
3. **Integrated with combat redesign**: The mana system and status effects from COMBAT-DESIGN.md need items that interact with them.
4. **Clear crafting tree**: Players should always know what they can build and what they need. No hidden recipes.
5. **Economy sink**: Items are the primary endgame gold sink once buildings are maxed and units are ascended.

---

## 1. Item Tier Hierarchy

### Overview
Items exist in a clear power hierarchy. Higher tiers are harder to obtain but significantly more powerful.

```
Tier 1: Components          — Raw drops from missions
Tier 2: Combined Items      — 2 components merged on a unit
Tier 3: Set Items           — Combined + Essence at Forge
Tier 3: Ability Items       — 2 Combined at Forge
Tier 4: Mythic Items        — Ability + rare materials (endgame)
```

### Item Slots
- **3 item slots per unit** (unchanged)
- Any mix of tiers is allowed in slots
- Combined items lock into the slot (cannot unequip). Components can be freely moved.
- Set, Ability, and Mythic items can be unequipped but cost 25g to do so (they're valuable enough to justify the fee)

---

## 2. Components — Expanded (12 total)

### Existing Components (8)
| Component | Emoji | Stat | Value |
|---|---|---|---|
| BF Sword | 🗡️ | +ATK | +15 |
| Chain Vest | 🛡️ | +HP | +200 |
| Giant's Belt | 💪 | +HP | +300 |
| Recurve Bow | 🏹 | -AtkSpd | -0.1s |
| Needlessly Large Rod | 🪄 | +ATK | +20 |
| Negatron Cloak | 🧥 | +DR | +10% |
| Sparring Gloves | 🥊 | +Crit | +10% |
| Tear of the Goddess | 💧 | +Heal Power | +20% |

### New Components (4) — Unlocked via Mana System
| Component | Emoji | Stat | Value | Why It's Needed |
|---|---|---|---|---|
| **Aether Shard** | 🔮 | +Starting Mana | +15 | Enables faster first ability cast |
| **Quicksilver Gem** | 💎 | +Tenacity | +15% | CC resistance — counters stun-heavy comps |
| **Warding Stone** | 🪨 | +Shield on Start | +150 | Immediate survivability for squishy carries |
| **Soul Prism** | 🌈 | +Mana per Hit | +5 | Accelerates ability cycling for auto-attackers |

### Drop Rules
- Original 8 components drop from all missions (unchanged)
- New 4 components drop only from missions level 10+ (mid-to-late game)
- Drop pool: equal weight within the eligible pool
- Rarity system unchanged (Standard/Uncommon/Rare/Epic with same bonuses)

---

## 3. Combined Recipes — Expanded (21 total)

### Existing Recipes (8 — unchanged)
| Recipe | Components | Key Stats | Special |
|---|---|---|---|
| Infinity Edge | BF + BF | +30 ATK, +25% Crit | — |
| Blade of the Ruined King | BF + Bow | +15 ATK | 3% target max HP on-hit |
| Titan's Resolve | Vest + Cloak | +200 HP, +15% DR | — |
| Warmog's Armor | Belt + Belt | +600 HP | 2% max HP regen/s |
| Rapid Firecannon | Bow + Bow | -0.2s AtkSpd, +1 Range | — |
| Archangel's Staff | Rod + Tear | +20 ATK, +30% Heal Power | Heals deal 20% as damage |
| Hand of Justice | Gloves + BF | +15 ATK, +10% Crit | Heal 10% max HP on kill |
| Dragon's Claw | Cloak + Cloak | +25% DR, +20% Elem Resist | — |

### New Recipes (13)

**Offensive**

| Recipe | Components | Stats | Special |
|---|---|---|---|
| **Deathblade** | Rod + BF | +35 ATK | On kill: +8% ATK for 6s (stacks 3x) |
| **Guinsoo's Rageblade** | Bow + Rod | +15 ATK, -0.1s AtkSpd | Each attack grants +3% AS for the rest of combat (stacks, max 30%) |
| **Statikk Shiv** | Bow + Gloves | -0.1s AtkSpd, +10% Crit | Every 3rd attack chains lightning to 2 enemies for 50 magic damage |
| **Last Whisper** | Gloves + Cloak | +10% Crit, +10% DR | Crits reduce target's DR by 50% for 3s |

**Defensive**

| Recipe | Components | Stats | Special |
|---|---|---|---|
| **Sunfire Cape** | Belt + Vest | +500 HP | Deal 15 DPS to all enemies within 1 cell |
| **Bramble Vest** | Vest + Vest | +400 HP | When hit by auto-attack: reflect 80 damage + apply Grievous (40% heal reduction, 3s) |
| **Gargoyle Stoneplate** | Vest + Belt | +500 HP | +5% DR per enemy targeting this unit (max 25%) |
| **Redemption** | Belt + Tear | +300 HP, +20% Heal Power | When holder first drops below 25% HP: heal all allies within 2 cells for 15% of their max HP (once) |

**Mana/Utility**

| Recipe | Components | Stats | Special |
|---|---|---|---|
| **Spear of Shojin** | BF + Aether | +15 ATK, +15 Start Mana | Auto-attacks restore +5 bonus mana (on top of base 10) |
| **Blue Buff** | Aether + Aether | +30 Start Mana | After casting ability, gain 20 mana instantly (makes fast casters) |
| **Quicksilver Sash** | QS Gem + Cloak | +15% Tenacity, +10% DR | On first CC received: immediately cleanse it and grant 1.5s CC immunity (10s cooldown) |
| **Hextech Gunblade** | Rod + Soul Prism | +20 ATK, +5 Mana/Hit | Heal for 25% of ability damage dealt |
| **Aegis Plate** | Ward Stone + Vest | +150 Shield on Start, +200 HP | Shield absorbs damage before HP. If shield survives first 5s of combat, refresh it to full. |

### Recipe Coverage
With 12 components and 21 recipes, the most useful stat combinations are covered. The full recipe matrix:

| | BF | Vest | Belt | Bow | Rod | Cloak | Gloves | Tear | Aether | QS Gem | Ward Stone | Soul Prism |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **BF** | Infinity Edge | — | — | BotRK | Deathblade | — | Hand of Justice | — | Spear of Shojin | — | — | — |
| **Vest** | — | Bramble Vest | Sunfire Cape | — | — | Titan's Resolve | — | — | — | — | — | — |
| **Belt** | — | Gargoyle | Warmog's | — | — | — | — | Redemption | — | — | — | — |
| **Bow** | — | — | — | RFC | Rageblade | — | Statikk Shiv | — | — | — | — | — |
| **Rod** | — | — | — | — | — | — | — | Archangel's | — | — | — | Hextech |
| **Cloak** | — | — | — | — | — | Dragon's Claw | Last Whisper | — | — | QSS | — | — |
| **Ward Stone** | — | Aegis Plate | — | — | — | — | — | — | — | — | — | — |
| **Gloves** | — | — | — | — | — | — | — | — | — | — | — | — |
| **Tear** | — | — | — | — | — | — | — | — | — | — | — | — |
| **Aether** | — | — | — | — | — | — | — | — | Blue Buff | — | — | — |

Remaining empty cells are intentionally left as non-recipes. Not every combination needs to produce something — having "dead" pairs creates crafting decisions (do I save this component for a specific recipe, or use it now?).

> **New component coverage**: Aether Shard appears in 2 recipes (Spear of Shojin, Blue Buff). Soul Prism appears in 1 recipe (Hextech Gunblade). QS Gem appears in 1 recipe (QSS). Warding Stone appears in 1 recipe (Aegis Plate). All new components also function as standalone stat sticks or set/ability crafting fodder.

---

## 4. Set Items — Expanded (16 total)

### Existing Sets (4 sets × 3 items = 12 — unchanged)
Inferno (Fire), Tidal (Water), Gaia (Earth), Tempest (Wind) — same items, same bonuses.

### New Set: Arcane (Mixed Element)
A 5th set that works with ANY element, but at reduced bonus strength. Requires a new essence type.

**Arcane Essence** — drops from bosses only (see COMBAT-DESIGN.md boss fights). Rare and valuable.

| Item | Base Combined | Essence | Stats |
|---|---|---|---|
| **Arcane Edge** | Infinity Edge | Arcane | +35 ATK, +25% Crit |
| **Arcane Bulwark** | Titan's Resolve | Arcane | +250 HP, +18% DR |
| **Arcane Catalyst** | Archangel's Staff | Arcane | +25 ATK, +35% Heal Power |
| **Arcane Accelerator** | Rapid Firecannon | Arcane | -0.25s AtkSpd, +1 Range |

**Arcane Set Bonuses** (apply to ALL allies regardless of element):
- 2-piece: All allies gain +8% ATK and +8% max HP
- 3-piece: All allies gain +8% ATK, +8% max HP, and +10 starting mana
- 4-piece: All allies gain +15% ATK, +15% max HP, +20 starting mana, and 5% lifesteal

Arcane is weaker per-unit than element-specific sets but works universally — the payoff for running mixed-element comps.

### Updated Set Summary
| Set | Element | Items | 2pc Bonus | 3pc Bonus |
|---|---|---|---|---|
| Inferno | Fire | 3 | +20% ATK to fire | +burn DPS |
| Tidal | Water | 3 | +15% HP to water | +HP regen |
| Gaia | Earth | 3 | +15% DR to earth | +150 shield |
| Tempest | Wind | 3 | +20% AS to wind | +10% dodge |
| Arcane | Any | 4 | +8% ATK/HP to all | +10 start mana |

---

## 5. Ability Items — Expanded (12 total)

### Existing Ability Items (7 — unchanged)
4 standard (Zhonya's, Guardian Angel, Rabadon's, Bloodthirster) + 3 evolved-gated (Primal Fury, Elemental Core, Titan's Heart).

### New Ability Items (5)

**Standard (any unit):**

| Item | Craft From | Stats | Ability |
|---|---|---|---|
| **Morellonomicon** | Sunfire Cape + Archangel's | +15 ATK, +300 HP | Abilities apply Grievous Wounds (40% heal reduction) to all targets hit for 5s |
| **Ionic Spark** | Statikk Shiv + Blue Buff | -0.15s AtkSpd, +20 Start Mana | When any nearby enemy casts an ability, deal 100 magic damage to them and reduce their mana by 15 |
| **Frozen Heart** | Bramble Vest + Titan's Resolve | +500 HP, +20% DR | Aura: enemies within 2 cells have -20% attack speed |

**Evolved-Gated (evolved units only):**

| Item | Craft From | Stats | Ability |
|---|---|---|---|
| **Void Staff** | Deathblade + Hextech Gunblade | +40 ATK, +5 Mana/Hit | Abilities ignore 40% of target's damage reduction. Ability damage heals for 15%. |
| **Transcendence** | Blue Buff + Spear of Shojin | +30 Start Mana | After casting ability, reduce max mana cost by 10% for the rest of combat (stacks, min 50% of base). Makes evolved carries cast faster and faster. |

### Ability Item Summary
| Category | Count | Examples |
|---|---|---|
| Standard | 7 | Zhonya's, GA, Rabadon's, Bloodthirster, Morello, Ionic, Frozen Heart |
| Evolved-Gated | 5 | Primal Fury, Elem Core, Titan's Heart, Void Staff, Transcendence |
| **Total** | **12** | |

---

## 6. Mythic Items (NEW — Tier 4)

### Overview
Mythic items are the endgame item chase. They require an Ability item + a rare material to forge, and each one fundamentally changes how a unit plays. Only 1 Mythic item can be equipped per unit (takes 1 of the 3 item slots, but the restriction is the uniqueness limit).

### Mythic Materials
- **Dragon Scale**: Drops from boss fights (10% chance on first clear, 5% on repeat)
- **Void Crystal**: Drops from 3-starring mission 14 (15% chance) or endless mode (future)
- **World Shard**: Drops from Ascension Tier 3 units (when a unit reaches Transcendent, you receive 1 World Shard of matching element)

### Mythic Forge Operation
- **Forge Level 5+** (same as ability crafting)
- **Cost**: 250g + 1 Ability Item + 1 Mythic Material
- Each Mythic has a specific ability item + specific material requirement

### Mythic Items (6)

| Item | Craft From | Material | Stats | Mythic Ability |
|---|---|---|---|---|
| **Infinity Gauntlet** | Rabadon's Deathcap | Dragon Scale | +50 ATK | Abilities deal 50% bonus damage. Every 3rd ability cast hits ALL enemies instead of the normal targets. |
| **Aegis of Immortality** | Guardian Angel | Dragon Scale | +600 HP, +15% DR | Revive with 60% HP on death. On revival, become invulnerable for 3s and taunt all enemies. Once per combat. |
| **Eclipse** | Bloodthirster | Void Crystal | +35 ATK | Lifesteal 20%. At full HP, excess healing converts to a Shield (max 30% of max HP). While shielded, deal 15% bonus damage. |
| **Staff of Ages** | Void Staff | Void Crystal | +45 ATK, +20 Start Mana | Ability damage permanently increases by 3% each time it's cast (no cap). The ultimate scaling carry item. |
| **Worldbreaker** | Primal Fury | World Shard | +30 ATK, -0.15s AtkSpd | On kill: gain +15% ATK and +15% AS for 8s (stacks 5x). At 5 stacks, auto-attacks deal splash damage to adjacent enemies. |
| **Crown of Ages** | Transcendence | World Shard | +40 Start Mana | After casting ability, the next ability costs 0 mana (internal 12s cooldown). While ability is on cooldown, gain +15% DR. |

### Mythic Restrictions
- Max 1 Mythic per unit
- Mythic items can be unequipped (50g fee) and transferred
- Mythic items cannot be sold (too rare to accidentally vendor)
- Mythic items cannot be disassembled

---

## 7. Enhancement System (NEW)

### Overview
Enhancement is the primary gold sink for endgame items. Any combined, set, ability, or mythic item can be enhanced from +0 to +10, increasing its stat values progressively.

### Enhancement Levels
| Level | Stat Bonus | Gold Cost | Success Rate | On Failure |
|---|---|---|---|---|
| +1 | +5% stats | 20g | 100% | — |
| +2 | +10% stats | 30g | 100% | — |
| +3 | +15% stats | 50g | 100% | — |
| +4 | +22% stats | 80g | 90% | Stay at current level |
| +5 | +30% stats | 120g | 80% | Stay at current level |
| +6 | +40% stats | 180g | 70% | Drop to +5 |
| +7 | +52% stats | 250g | 55% | Drop to +5 |
| +8 | +66% stats | 350g | 40% | Drop to +6 |
| +9 | +82% stats | 500g | 25% | Drop to +7 |
| +10 | +100% stats | 750g | 15% | Drop to +8 |

### Enhancement Rules
- Enhancement multiplier applies to the item's BASE stats only (not rarity bonuses — those are separate)
- Total item stats = `base × (1 + rarityBonus) × (1 + enhancementBonus)`
- Special effects (on-hit, on-kill, etc.) are NOT affected by enhancement — only stat values
- Enhancement level shown as "+N" after item name (e.g., "Infinity Edge +7")
- Enhancement is done at the Forge (any level — this is a basic operation)
- Items can be enhanced while equipped (no need to unequip)

### Failsafe: Pity System
After 3 consecutive failures **at the same target level**, the next attempt is guaranteed to succeed. The pity counter resets to 0 after each success (including pity-triggered successes). If enhancement failure drops the item to a lower level (e.g., +9 fails → drops to +7), the pity counter for the failed level resets. This prevents catastrophic bad luck streaks while still making high-level enhancement a meaningful gold sink. Note: the "Grand Artificer" collection bonus reduces the pity threshold from 3 to 2 failures.

### Enhancement Visual
| Level | Border Effect |
|---|---|
| +0 to +3 | No special effect |
| +4 to +6 | Subtle glow matching element color |
| +7 to +9 | Bright glow with particle trail |
| +10 | Rainbow shimmer (same as Transcendent unit border) |

---

## 8. Gem Socket System (NEW)

### Overview
Gems are small, modular stat bonuses that slot into items. They add a layer of customization on top of the base item stats — two players with the same Infinity Edge can optimize it differently based on their gems.

### Socket Rules
- Combined items: 1 socket
- Set items: 1 socket
- Ability items: 2 sockets
- Mythic items: 2 sockets
- Components: 0 sockets
- Each socket holds 1 gem. Gems can be removed and replaced (10g per swap).

### Gem Types (9)
| Gem | Emoji | Stat Bonus | Drop Source |
|---|---|---|---|
| **Ruby** | ❤️ | +100 HP | Mission drops (level 5+) |
| **Sapphire** | 💙 | +8 ATK | Mission drops (level 5+) |
| **Emerald** | 💚 | +5% DR | Mission drops (level 8+) |
| **Topaz** | 💛 | -0.05s AtkSpd | Mission drops (level 8+) |
| **Diamond** | 💎 | +8% Crit | Mission drops (level 10+) |
| **Amethyst** | 💜 | +10 Start Mana | Mission drops (level 10+) |
| **Opal** | 🤍 | +10% Heal Power | Mission drops (level 12+) |
| **Onyx** | 🖤 | +10% Tenacity | Mission drops (level 12+) |
| **Prismatic** | 🌈 | +50 HP, +5 ATK, +3% Crit | Boss drops only (5% chance) |

### Gem Rarity
Gems follow the same 4-tier rarity system as components:
- **Standard**: Base value
- **Uncommon**: +25% value
- **Rare**: +50% value
- **Epic**: +100% value

An Epic Ruby gives +200 HP. An Epic Diamond gives +16% Crit.

### Gem Drop Rules
- 1 gem drops per mission (in addition to item component drops)
- Gem type is weighted by mission level (higher levels unlock rarer types)
- Gem rarity follows the same scaling as item rarity (mission level + star rating)
- 3-star rating: bonus gem drop (50% chance for a second gem)

### Gem Crafting at Forge
- **Combine 3 gems of same type and rarity → 1 gem of same type, next rarity tier**
- Cost: 15g per combine
- This gives players a way to upgrade gem rarity through volume

---

## 9. Item Affinity System (NEW)

### Overview
Certain items have natural synergy with specific unit types or elements. When an item with affinity is equipped on a matching unit, it gains a bonus effect.

### Affinity Rules
- Affinity bonuses are shown in the item tooltip: "Affinity: [Type/Element] — [Bonus]"
- Only affects the unit wearing the item (not team-wide)
- Affinity is a bonus on top of the normal item effect — items still function normally on non-matching units

### Affinity Examples
| Item | Affinity | Bonus When Matched |
|---|---|---|
| Infinity Edge | Assassin | +10% bonus crit damage (1.5x → 1.65x) |
| Warmog's Armor | Tank | Regen increased from 2% to 3% max HP/s |
| Rapid Firecannon | Archer | +1 additional range (total +2) |
| Archangel's Staff | Healer | Heal-to-damage conversion increased from 20% to 35% |
| Dragon's Claw | Guardian archetype | +5% additional DR |
| Sunfire Cape | Tank or Warrior | AoE DPS increased from 15 to 25 |
| Blue Buff | Mage | Post-cast mana refund increased from 20 to 35 |
| Spear of Shojin | Warrior | Bonus mana per hit increased from +5 to +8 |
| Bloodthirster | Assassin | Lifesteal increased from 15% to 22% |
| Bramble Vest | Earth element | Reflect damage increased from 80 to 120, also applies Root for 0.5s |

### Design Intent
Affinities guide new players toward good itemization choices (putting Warmog's on your tank is the "right" call and the game rewards it). But they don't force it — putting Warmog's on a squishy carry to keep them alive is still valid, just without the bonus.

---

## 10. Economy & Crafting Flow

### The Item Progression Loop
```
Mission rewards → Components + Gems
     ↓
Forge: Transmute/Reroll → Get the right components
     ↓
Equip 2 matching components on unit → Auto-combine into Combined item
     ↓
Forge: Enhance combined item (+1 to +10)
     ↓
Forge: Socket gems into item
     ↓
Forge: Upgrade combined → Set item (needs Essence) or Ability item (needs 2 combined)
     ↓
Forge: Enhance set/ability item
     ↓
Forge: Upgrade ability → Mythic item (needs rare material)
     ↓
Forge: Enhance mythic item to +10
```

### Gold Sink Analysis
Where does gold go in the endgame?

| Sink | Gold/Operation | Frequency | Monthly Estimate |
|---|---|---|---|
| Enhancement attempts | 20–750g | Daily | 5,000–15,000g |
| Gem combining | 15g | Several per week | 500–1,000g |
| Gem socketing | 10g per swap | Weekly | 200–500g |
| Forge transmute | 25g | Weekly | 200–400g |
| Forge reroll rarity | 10–80g | Weekly | 300–800g |
| Set/Ability crafting | 50–100g | Bi-weekly | 200–400g |
| Mythic crafting | 250g | Monthly | 250g |
| Item unequip fee | 25–50g | As needed | 100–300g |

Enhancement is the dominant gold sink by design — it has both the highest cost per operation AND the highest failure rate at top levels, making +10 items a genuine long-term achievement.

### Item Drop Budget Per Mission
| Mission Level | Component Drops | Gem Drops | Essence Chance | Mythic Mat Chance |
|---|---|---|---|---|
| 1–4 | 1 (3-star: +1) | 0 | 0% | 0% |
| 5–7 | 1 (3-star: +1) | 1 (3-star: 50% +1) | 0% | 0% |
| 8–10 | 1 (3-star: +1) | 1 (3-star: 50% +1) | 10% elem essence | 0% |
| 11–13 | 1 (3-star: +1) | 1 (3-star: 50% +1) | 20% elem essence | 0% |
| 14 | 1 (3-star: +1) | 1 (3-star: 50% +1) | 30% elem essence | 5% Void Crystal (3-star only) |
| Boss | 1 guaranteed rare+ | 1 (50% Prismatic) | 1 guaranteed Arcane | 10% Dragon Scale |

---

## 11. Forge — Updated Operations

### Forge Level Progression
| Level | Cost | Unlocks |
|---|---|---|
| 1 | 200g | Reroll Rarity, Enhancement (+1 to +3) |
| 2 | 500g | Disassemble, Enhancement (+4 to +6) |
| 3 | 1,000g | Transmute, Gem Combining |
| 4 | 2,000g | Set Crafting, Enhancement (+7 to +8) |
| 5 | 4,000g | Ability Crafting, Mythic Crafting, Enhancement (+9 to +10) |

### Updated Operation List
| Operation | Level | Cost | Description |
|---|---|---|---|
| **Reroll Rarity** | 1+ | 10–80g | Change a component's rarity tier |
| **Enhance** | 1+ | 20–750g | Increase item stats by enhancement level |
| **Disassemble** | 2+ | 15g | Break combined item into 2 components |
| **Transmute** | 3+ | 25g | Convert component type (keeps rarity) |
| **Gem Combine** | 3+ | 15g | 3 same gems → 1 higher rarity |
| **Set Craft** | 4+ | 50g + essence | Combined item + Essence → Set item |
| **Ability Craft** | 5+ | 100g | 2 Combined items → Ability item |
| **Mythic Craft** | 5+ | 250g + material | Ability item + Mythic Material → Mythic item |

---

## 12. Item-Combat Integration

### Mana Items in Combat
The new mana-related items interact with COMBAT-DESIGN.md's mana system. All mana bonuses from items are **additive** with base mana generation (base auto-attack = +10 mana per COMBAT-DESIGN Section 3). Multiple mana items stack additively with each other. Start Mana bonuses stack additively (Blue Buff + Spear of Shojin = +45 Start Mana).

| Item | Combat Interaction |
|---|---|
| Aether Shard (+15 Start Mana) | Unit begins combat with 15 mana instead of 0 |
| Soul Prism (+5 Mana/Hit) | Each auto-attack generates 15 mana instead of 10 |
| Blue Buff (+30 Start Mana, +20 post-cast) | Start at 30 mana; after ability fires, immediately gain 20 mana toward next cast |
| Spear of Shojin (+15 Start, +5/hit) | Start at 15 mana; each auto-attack generates 15 mana |
| Transcendence (max mana reduction) | Each ability cast reduces maxMana by 10% permanently (min 50% of original) |
| Ionic Spark (anti-mana aura) | When enemy within 2 cells casts ability: deal 100 damage + burn 15 of their mana |

### Status Effect Items in Combat
Items that apply or interact with COMBAT-DESIGN.md's status effect system:

| Item | Status Interaction |
|---|---|
| Morellonomicon | Ability hits apply Grievous (40% heal reduction, 5s) |
| Frozen Heart | Aura: enemies within 2 cells get -20% AS (Slow debuff, permanent while in range) |
| Bramble Vest | Reflect on hit + apply Grievous (40% heal reduction, 3s) |
| Last Whisper | Crits apply DR shred (target loses 50% of their DR for 3s) |
| Quicksilver Sash | First CC received is instantly cleansed; 10s cooldown |
| Hextech Gunblade | Ability damage heals holder for 25% (hybrid lifesteal/spellvamp) |

### Item Priority in Damage Pipeline
Items modify damage at specific steps in the COMBAT-DESIGN.md damage pipeline:

```
Step 2 (Element Mult): Elemental Core's +25% elem advantage
Step 3 (Crit): Infinity Edge's +25% crit chance, Last Whisper's DR shred on crit
Step 4 (Damage Modifiers): Rabadon's +35% ATK, Deathblade kill stacks
Step 5 (Damage Reduction): Last Whisper's DR shred, Void Staff's 40% DR bypass
Step 6 (Flat Additions): BotRK %maxHP, Sunfire DPS, Statikk Shiv chain
Step 7 (Dodge): Tempest set's dodge bonus
Step 8 (Shield): Warding Stone's starting shield, Eclipse's overheal shield
Step 10 (On-Hit): Lifesteal, Mana generation, Reflect damage
```

---

## 13. Item Discovery & Collection

### Recipe Book
A permanent in-game UI that shows all recipes the player has discovered. Undiscovered recipes show as "???" with silhouette icons.

**Discovery methods:**
- Crafting an item for the first time unlocks it in the recipe book
- The War Room building (level 3) reveals 1 random undiscovered recipe
- First-clearing a story mission reveals all recipes that use items dropped from that mission level

### Collection Bonuses
Completing sets of recipes in the recipe book grants permanent passive bonuses:

| Milestone | Requirement | Bonus |
|---|---|---|
| Apprentice Smith | Craft 5 different combined items | +5% item drop rarity (permanent) |
| Journeyman Smith | Craft 10 different combined items | +10% gem drop rate (permanent) |
| Master Smith | Craft all 21 combined items | Forge operations cost 10% less gold (permanent) |
| Artificer | Craft 3 different ability items | +1 item bench slot (permanent) |
| Grand Artificer | Craft all 12 ability items | Enhancement pity system triggers after 2 failures instead of 3 |
| Mythic Forger | Craft any 1 Mythic item | Unlock "Auto-enhance" option (auto-retry enhancement until success or gold runs out) |

---

## 14. Balance Considerations

### Item Power Budget
Items should never overshadow unit choice. A well-itemized cost-1 unit should be competitive but not beat a poorly-itemized cost-4 unit. Target item contribution to total unit power:

| Item Tier | % of Total Unit Power (endgame) |
|---|---|
| Components (3 equipped) | 10–15% |
| Combined items (3 equipped) | 20–30% |
| Best-in-slot (Set/Ability +10 with Epic gems) | 35–45% |
| Mythic + 2 optimized items | 40–50% |

### Anti-Stacking Rules
- Only 1 copy of each named item per unit (can't equip 2 Infinity Edges)
- Only 1 Mythic per unit
- Grievous Wounds doesn't stack from multiple sources (strongest applies)
- DR shred from Last Whisper doesn't stack with itself

### Item Rarity Caps by Mission Level
To prevent players from hoarding Epic items too early:
- Missions 1–5: Epic drop weight is 0% (forced to Standard/Uncommon/Rare)
- Missions 6–9: Epic weight at 1%
- Missions 10+: Full 3% Epic weight (as currently implemented)

---

## 15. Migration from Current System

### What Stays
- All 8 original components, stats, and rarity system
- All 8 original combined recipes
- All 12 set items and 4 set bonuses
- All 7 ability items
- Forge operations (reroll, disassemble, transmute, set craft, ability craft)
- Item bench, equip/unequip, auto-combine, item selling
- Essence system (4 elements)

### What's Added
- 4 new components (Aether Shard, Quicksilver Gem, Warding Stone, Soul Prism)
- 13 new combined recipes (Deathblade, Rageblade, Statikk Shiv, Last Whisper, Sunfire Cape, Bramble Vest, Gargoyle Stoneplate, Redemption, Spear of Shojin, Blue Buff, QSS, Hextech Gunblade, Aegis Plate)
- Arcane set (4 items) + Arcane Essence
- 5 new ability items (Morellonomicon, Ionic Spark, Frozen Heart, Void Staff, Transcendence)
- 6 Mythic items (new tier)
- Enhancement system (+0 to +10)
- Gem socket system (9 gem types × 4 rarities)
- Item affinity system
- Recipe book + collection bonuses
- 3 Mythic materials (Dragon Scale, Void Crystal, World Shard)

### Save Migration
- New save version required
- Existing items preserved as-is (enhancement = +0, no gems socketed)
- New component types added to drop pool
- Forge operations expanded
- Recipe book auto-populated with items the player has already crafted

---

## Appendix: Full Recipe Quick Reference

### Combined Items (21)
| # | Item | Components | Key Effect |
|---|---|---|---|
| 1 | Infinity Edge | BF + BF | +Crit |
| 2 | BotRK | BF + Bow | %MaxHP on-hit |
| 3 | Titan's Resolve | Vest + Cloak | HP + DR |
| 4 | Warmog's Armor | Belt + Belt | HP Regen |
| 5 | Rapid Firecannon | Bow + Bow | AS + Range |
| 6 | Archangel's Staff | Rod + Tear | ATK + Heal, heal→dmg |
| 7 | Hand of Justice | Gloves + BF | Crit + heal on kill |
| 8 | Dragon's Claw | Cloak + Cloak | DR + Elem Resist |
| 9 | Deathblade | Rod + BF | ATK + kill stacking |
| 10 | Guinsoo's Rageblade | Bow + Rod | Permanent AS stacking |
| 11 | Statikk Shiv | Bow + Gloves | Chain lightning every 3rd |
| 12 | Last Whisper | Gloves + Cloak | Crit → DR shred |
| 13 | Sunfire Cape | Belt + Vest | AoE DPS aura |
| 14 | Bramble Vest | Vest + Vest | Reflect + Grievous |
| 15 | Gargoyle Stoneplate | Vest + Belt | DR per attacker |
| 16 | Redemption | Belt + Tear | Emergency AoE heal |
| 17 | Spear of Shojin | BF + Aether | Start mana + mana/hit |
| 18 | Blue Buff | Aether + Aether | Start mana + post-cast refund |
| 19 | Quicksilver Sash | QS Gem + Cloak | Tenacity + CC cleanse |
| 20 | Hextech Gunblade | Rod + Soul Prism | Ability heal |
| 21 | Aegis Plate | Ward Stone + Vest | Starting shield + refresh |

### Ability Items (12)
| # | Item | Evolved Only? | Key Effect |
|---|---|---|---|
| 1 | Zhonya's Hourglass | No | Stasis at 25% HP |
| 2 | Guardian Angel | No | Revive on death |
| 3 | Rabadon's Deathcap | No | +35% total ATK |
| 4 | Bloodthirster | No | 15% lifesteal |
| 5 | Morellonomicon | No | Grievous on ability hits |
| 6 | Ionic Spark | No | Anti-caster aura |
| 7 | Frozen Heart | No | -20% AS enemy aura |
| 8 | Primal Fury | Yes | AS on kill (stacks 3x) |
| 9 | Elemental Core | Yes | +25% elem advantage |
| 10 | Titan's Heart | Yes | +20% DR below 50% HP |
| 11 | Void Staff | Yes | 40% DR bypass + ability heal |
| 12 | Transcendence | Yes | Mana cost reduction per cast |

### Mythic Items (6)
| # | Item | Source | Key Fantasy |
|---|---|---|---|
| 1 | Infinity Gauntlet | Rabadon's + Dragon Scale | AoE ability nuke every 3 casts |
| 2 | Aegis of Immortality | GA + Dragon Scale | Unkillable tank with taunt revival |
| 3 | Eclipse | Bloodthirster + Void Crystal | Lifesteal carry that shields and amplifies |
| 4 | Staff of Ages | Void Staff + Void Crystal | Infinitely scaling ability damage |
| 5 | Worldbreaker | Primal Fury + World Shard | Kill-snowballing melee carry |
| 6 | Crown of Ages | Transcendence + World Shard | Ability spam machine |

---

## Appendix B: Edge Cases & Undefined Behavior Resolution

### Gem Edge Cases

**Gem Combine at Epic (Max Rarity)**
3 Epic gems of the same type cannot be combined further. Attempting to combine at Forge shows "Max rarity reached." Players must use Epic gems directly — no "super-Epic" tier exists. This is intentional to cap gem power.

**Gems on Disassembled Items**
When a combined item with socketed gems is disassembled at the Forge, gems are returned to the player's gem inventory (not destroyed). The 2 resulting components have 0 sockets and no gems. This makes disassemble safe — players don't lose gems by experimenting with item builds.

**Gem Swap vs. Gem Removal**
Gems can be removed from a socket for 10g (gem returns to inventory, socket becomes empty). Swapping is just: remove old gem (10g) + insert new gem (free). There is no separate "swap" operation — it's two actions.

### Enhancement Edge Cases

**Enhancement Floor**
Items cannot drop below +0. If an enhancement failure says "drop to +N" and the item is already at that level or lower, it simply stays at current level.

**Enhancing Equipped Items**
Enhancement can be performed on equipped items. The unit's combat stats update immediately. No need to unequip first.

**Enhancement on Mythic Items**
Mythic items CAN be enhanced (+0 to +10) using the same table as other items. Mythic enhancement costs are 1.5x the normal gold cost (30g to 1,125g) to reflect their power. Mythic enhancement uses the same success rates and pity system.

### Socket Edge Cases

**Mythic Item Sockets**
Mythic items have 2 sockets and can hold gems, same as ability items. Gems in mythic items work identically to gems in other items.

**Transmute Scope**
Transmute only works on **components** (Tier 1). Combined, set, ability, and mythic items cannot be transmuted. To change a combined item, disassemble it first, then transmute the components.

### QSS Cleanse Interaction
When Quicksilver Sash cleanses a CC effect, it also triggers the 1.5s CC immunity window defined in COMBAT-DESIGN Section 5. This means the cleansed unit is immune to all CC for 1.5s after cleanse, preventing chain-CC from immediately reapplying. After the 10s QSS cooldown, the next CC received will apply normally (QSS doesn't trigger again until cooldown expires).

### Affinity System — Extended Examples
Beyond the examples in Section 9, here are affinities for new items:

| Item | Affinity | Bonus When Matched |
|---|---|---|
| Deathblade | Assassin | Kill stack bonus increased from +8% to +12% |
| Guinsoo's Rageblade | Archer | AS per-stack increased from +3% to +5% |
| Statikk Shiv | Mage | Chain lightning hits 3 enemies instead of 2 |
| Last Whisper | Predator archetype | DR shred duration increased from 3s to 5s |
| Gargoyle Stoneplate | Guardian archetype | DR per attacker increased from +5% to +7% |
| Redemption | Healer | AoE heal range increased from 2 to 3 cells |
| Aegis Plate | Tank or Guardian | Starting shield increased from 150 to 250 |
| Spear of Shojin | Striker archetype | Bonus mana per hit increased from +5 to +8 |
| Frozen Heart | Vanguard archetype | AS reduction aura increased from -20% to -30% |
| Morellonomicon | Mystic archetype | Grievous duration increased from 5s to 7s |

### Cross-Document References

**Mythic Material Sources** (coordination with other design docs):
- **Dragon Scale**: Boss fights are defined in COMBAT-DESIGN Section 10. Drop rates (10%/5%) apply to the loot roll after each boss wave. Boss waves appear at the end of story missions 7, 10, 13, 14 and as standalone challenge modes.
- **Void Crystal**: Mission 14 is defined in missions.js. The 15% 3-star drop is a bonus roll in addition to normal mission rewards. Future "endless mode" will be defined in a separate content design doc.
- **World Shard**: Ascension is defined in UNITS-DESIGN Section 5. When a unit reaches Transcendent (Tier 3), the player receives 1 World Shard matching that unit's element. This is the only source — making World Shards the rarest mythic material, gated behind 200+ unit copies.
- **Arcane Essence**: Drops from boss fights only (guaranteed 1 per boss kill). Not available from regular missions.
