# Item System Redesign — RPG Equipment Slots

> **Status**: Design proposal (no code changes)
> **Replaces**: Component-based crafting (items.js, ITEMS-DESIGN.md)
> **Depends on**: Hero System (HERO-SYSTEM-IDEA.md) — only hero-equipped units can use items

---

## 1. Design Philosophy

The current component-combination system (A+B=C) suits disposable auto-chess rounds. For a 30-40 hour single-player RPG, we want **persistent equipment** that players invest in, upgrade, and care about. The redesign replaces the flat item bench and component recipes with a per-unit equipment screen where each slot has a dedicated purpose.

### Key Principles
1. **Slot identity**: Each slot serves a clear role (offense, defense, utility). Players think "I need a better helm for my tank", not "I need two Chain Vests".
2. **Vertical progression**: Equipment upgrades through tiers (Common → Legendary), not replacement. Your early-game Iron Sword becomes a Steel Sword, then a Mithril Sword.
3. **Hero-gated**: Only units with an equipped hero can wear equipment (~6-10 units max). This keeps the total item count manageable and makes each piece feel impactful.
4. **Carry forward**: Enhancement (+0 to +10), gem sockets, and the Forge building all survive the redesign. These systems work well and add depth.

---

## 2. Equipment Slots (8 total)

Each hero-equipped unit has 8 equipment slots:

| Slot | Role | Primary Stats | Notes |
|------|------|---------------|-------|
| **Weapon** | Offense | ATK, Crit, ATK Speed | Determines attack style fantasy |
| **Helm** | Defense | HP, DR | Head protection |
| **Chest Armor** | Defense | HP, DR | Largest defensive stat budget |
| **Gauntlets** | Offense | ATK, Crit, ATK Speed | Offensive gloves |
| **Boots** | Utility | ATK Speed, Tenacity, Start Mana | Speed and utility |
| **Shield / Off-hand** | Defense / Utility | HP, DR, Shield, Heal Power | Tanks get shields; supports get tomes |
| **Accessory 1** | Flexible | Any stat | Ring or amulet |
| **Accessory 2** | Flexible | Any stat | Ring or amulet |

### Slot Rules
- Each slot holds exactly 1 piece of equipment
- Equipment is slot-locked (a weapon can only go in the weapon slot)
- Equipment can be freely unequipped and transferred between hero-equipped units (no gold fee for basic equip/unequip — the old unequip fee is removed)
- Accessories are universal — any accessory fits either slot
- A unit can leave slots empty with no penalty

### Why 8 Slots?
With only ~6-10 hero-equipped units in the entire game, 8 slots per unit creates a satisfying gearing target without overwhelming inventory. Total gear needed for a fully-equipped roster: 48-80 pieces. This gives the endgame a long item chase without needing thousands of items.

---

## 3. Equipment Tiers

| Tier | Name | Color | Region Availability | Stat Budget (relative) |
|------|------|-------|---------------------|----------------------|
| T1 | Common | White | Regions 1-2 | 1.0x |
| T2 | Uncommon | Green | Regions 2-3 | 1.4x |
| T3 | Rare | Blue | Regions 4-5 | 1.9x |
| T4 | Epic | Purple | Regions 6-7 | 2.5x |
| T5 | Legendary | Orange | Region 8 / Endgame | 3.2x |
| T6 | Mythic | Red | Post-story / Boss drops | 4.0x + unique passive |

### Tier Progression
- Equipment within a tier cannot roll different rarities (no "Epic Common Sword"). The tier IS the rarity.
- Higher-tier equipment has strictly better base stats than lower tiers of the same item line.
- Mythic tier is reserved for 6 unique items (carried over from current system) — one per slot archetype.

---

## 4. Equipment Catalog

### 4.1 Weapons (6 per tier = 30 total)

Each weapon has a gameplay identity. The same weapon name persists across tiers with increasing stats.

| Weapon | Identity | Base Stats (Common) | Passive (Rare+) |
|--------|----------|-------------------|-----------------|
| **Iron Sword** → Mithril Sword → ... | Balanced melee | +12 ATK | — |
| **Hunting Bow** → Composite Bow → ... | Ranged attacker | +8 ATK, -0.08s AtkSpd | — |
| **Arcane Staff** → Runic Staff → ... | Ability power | +10 ATK, +10 Start Mana | Rare+: Abilities deal +10% damage |
| **War Axe** → Executioner's Axe → ... | Crit/burst | +10 ATK, +8% Crit | Rare+: +15% crit damage |
| **Twin Daggers** → Shadow Fangs → ... | Attack speed | +6 ATK, -0.12s AtkSpd | Rare+: Every 4th attack deals +30% damage |
| **Warhammer** → Titan's Maul → ... | Tank offense | +8 ATK, +100 HP | Rare+: Attacks reduce target DR by 5% for 3s |

**Stat scaling by tier** (using Iron Sword as example):

| Tier | ATK |
|------|-----|
| Common | +12 |
| Uncommon | +17 |
| Rare | +23 |
| Epic | +30 |
| Legendary | +38 |

All weapons scale similarly — multiply Common base by the tier stat budget multiplier.

### 4.2 Helms (5 per tier = 25 total)

| Helm | Identity | Base Stats (Common) | Passive (Epic+) |
|------|----------|-------------------|-----------------|
| **Leather Cap** → ... | Light defense | +80 HP, +3% DR | — |
| **Iron Helm** → ... | Heavy defense | +120 HP, +5% DR | Epic+: Take 10% less damage from abilities |
| **Mage's Circlet** → ... | Mana utility | +60 HP, +8 Start Mana | Epic+: +10% ability damage |
| **Warden's Visor** → ... | CC resistance | +100 HP, +8% Tenacity | Epic+: First CC received each combat: reduce duration by 50% |
| **Crown of Thorns** → ... | Retaliation | +100 HP | Epic+: When hit, reflect 5% damage taken |

### 4.3 Chest Armor (5 per tier = 25 total)

| Chest | Identity | Base Stats (Common) | Passive (Epic+) |
|-------|----------|-------------------|-----------------|
| **Leather Vest** → ... | Light armor | +120 HP, +4% DR | — |
| **Chain Mail** → ... | Heavy armor | +180 HP, +7% DR | Epic+: +3% DR per nearby ally (max 12%) |
| **Mage's Robe** → ... | Ability support | +100 HP, +10 Start Mana | Epic+: After casting ability, gain 100 shield for 3s |
| **Battle Harness** → ... | Aggressive | +80 HP, +5 ATK | Epic+: +8% ATK when above 70% HP |
| **Healer's Vestment** → ... | Healing boost | +100 HP, +15% Heal Power | Epic+: Heals on allies below 30% HP are 25% stronger |

### 4.4 Gauntlets (5 per tier = 25 total)

| Gauntlets | Identity | Base Stats (Common) | Passive (Epic+) |
|-----------|----------|-------------------|-----------------|
| **Leather Gloves** → ... | Balanced offense | +6 ATK, +5% Crit | — |
| **Spiked Gauntlets** → ... | On-hit damage | +8 ATK | Epic+: Attacks deal +2% target max HP |
| **Mana Gauntlets** → ... | Mana generation | +4 ATK, +3 Mana/Hit | Epic+: +5 bonus mana per attack |
| **Bloodstained Claws** → ... | Lifesteal | +7 ATK | Epic+: Heal 8% of damage dealt |
| **Swift Bracers** → ... | Speed offense | +4 ATK, -0.05s AtkSpd | Epic+: +10% ATK Speed after first kill |

### 4.5 Boots (5 per tier = 25 total)

| Boots | Identity | Base Stats (Common) | Passive (Epic+) |
|-------|----------|-------------------|-----------------|
| **Leather Boots** → ... | Basic speed | -0.06s AtkSpd | — |
| **Windwalker Boots** → ... | Dodge/speed | -0.04s AtkSpd, +5% Dodge | Epic+: 15% chance to dodge attacks |
| **Ironclad Treads** → ... | Tank speed | +80 HP, -0.03s AtkSpd | Epic+: Cannot be slowed below base ATK Speed |
| **Arcane Slippers** → ... | Mana speed | +8 Start Mana, -0.04s AtkSpd | Epic+: After casting ability, +20% ATK Speed for 3s |
| **Stalker's Steps** → ... | Assassin utility | -0.05s AtkSpd, +5% Crit | Epic+: First attack in combat deals +40% damage |

### 4.6 Shield / Off-hand (5 per tier = 25 total)

| Off-hand | Identity | Base Stats (Common) | Passive (Epic+) |
|----------|----------|-------------------|-----------------|
| **Wooden Shield** → ... | Basic tank | +100 HP, +4% DR | — |
| **Tower Shield** → ... | Heavy defense | +60 HP, +8% DR | Epic+: Taunt nearest enemy for 2s at combat start |
| **Spell Tome** → ... | Support caster | +8 ATK, +8 Start Mana | Epic+: Abilities heal lowest-HP ally for 5% of damage dealt |
| **Ward Stone** → ... | Starting shield | +120 Shield on Start | Epic+: If shield survives 5s, refresh to full |
| **Healing Orb** → ... | Healer focus | +100 HP, +15% Heal Power | Epic+: +5% team-wide Heal Power aura |

### 4.7 Accessories (8 per tier = 40 total)

Accessories are the most diverse slot — any stat combination is valid.

| Accessory | Identity | Base Stats (Common) | Passive (Epic+) |
|-----------|----------|-------------------|-----------------|
| **Ruby Ring** → ... | HP stacking | +120 HP | Epic+: +5% max HP |
| **Sapphire Pendant** → ... | ATK stacking | +8 ATK | Epic+: +5% total ATK |
| **Emerald Brooch** → ... | DR stacking | +6% DR | Epic+: +3% DR when below 50% HP |
| **Topaz Band** → ... | Speed | -0.05s AtkSpd | Epic+: +5% ATK Speed |
| **Diamond Pin** → ... | Crit | +8% Crit | Epic+: +10% crit damage |
| **Amethyst Charm** → ... | Mana | +10 Start Mana | Epic+: +3 mana per attack |
| **Onyx Sigil** → ... | Tenacity | +10% Tenacity | Epic+: CC duration reduced by additional 10% |
| **Prismatic Locket** → ... | Hybrid | +50 HP, +4 ATK, +3% Crit | Epic+: +3% all stats |

### Total Equipment Count

| Slot | Items per Tier | x5 Tiers | Total |
|------|---------------|----------|-------|
| Weapon | 6 | 30 | 30 |
| Helm | 5 | 25 | 25 |
| Chest | 5 | 25 | 25 |
| Gauntlets | 5 | 25 | 25 |
| Boots | 5 | 25 | 25 |
| Shield/Off-hand | 5 | 25 | 25 |
| Accessory | 8 | 40 | 40 |
| **Subtotal** | **39** | — | **195** |
| Mythic (unique) | — | — | **6** |
| **Grand Total** | — | — | **201** |

This is a large catalog but players only interact with their current tier — you never see all 201 at once. In practice, a mid-game player is choosing between ~39 items (one tier's worth) for their ~6-10 hero units.

---

## 5. Equipment Sets (4 sets)

Sets are themed collections across different slots. Equipping multiple pieces from the same set on ONE unit grants bonuses.

### 5.1 Inferno Set (Fire-themed)

| Piece | Slot | Bonus Stats (on top of base) |
|-------|------|------------------------------|
| Inferno Blade | Weapon | +5 ATK, fire trail visual |
| Inferno Helm | Helm | +30 HP, fire crown visual |
| Inferno Plate | Chest | +50 HP, +2% DR |

**Set Bonuses (per unit wearing the set):**
- 2-piece: +15% ATK to this unit. All fire allies gain +8% ATK.
- 3-piece: +25% ATK to this unit. All fire allies gain +15% ATK. Attacks apply burn (10 DPS, 3s).

### 5.2 Tidal Set (Water-themed)

| Piece | Slot | Bonus Stats |
|-------|------|-------------|
| Tidal Trident | Weapon | +5 ATK, +5 Start Mana |
| Tidal Guard | Shield/Off-hand | +40 HP, +3% DR |
| Tidal Greaves | Boots | -0.03s AtkSpd |

**Set Bonuses:**
- 2-piece: +10% max HP to this unit. All water allies gain +8% HP.
- 3-piece: +20% max HP to this unit. All water allies gain +15% HP and 1% HP regen/s.

### 5.3 Gaia Set (Earth-themed)

| Piece | Slot | Bonus Stats |
|-------|------|-------------|
| Gaia Gauntlets | Gauntlets | +4 ATK, +60 HP |
| Gaia Bulwark | Shield/Off-hand | +80 HP, +5% DR |
| Gaia Chestplate | Chest | +80 HP, +4% DR |

**Set Bonuses:**
- 2-piece: +10% DR to this unit. All earth allies gain +8% DR.
- 3-piece: +18% DR to this unit. All earth allies gain +15% DR and +150 shield at combat start.

### 5.4 Tempest Set (Wind-themed)

| Piece | Slot | Bonus Stats |
|-------|------|-------------|
| Tempest Edge | Weapon | +4 ATK, -0.05s AtkSpd |
| Tempest Boots | Boots | -0.05s AtkSpd, +5% Dodge |
| Tempest Ring | Accessory | +5% Crit, -0.03s AtkSpd |

**Set Bonuses:**
- 2-piece: +15% ATK Speed to this unit. All wind allies gain +10% ATK Speed.
- 3-piece: +25% ATK Speed to this unit. All wind allies gain +20% ATK Speed and 10% dodge.

### Set Acquisition
- Set items are **NOT** separate equipment. Instead, existing equipment can be **infused** with an elemental essence at the Forge to become a set piece.
- Infusion requires: 1x equipment piece (Epic tier or higher) + 1x Elemental Essence + 50g.
- Infused equipment gains the set tag and bonus stats listed above, on top of its base stats.
- An infused item can be cleansed back to normal for 25g (essence is NOT returned).
- Only specific slots accept infusion for each set (as listed above).

---

## 6. Mythic Equipment (6 items — carried from current system)

Mythic items are unique legendary equipment pieces. Each occupies a specific slot and has a powerful unique passive. Only 1 mythic can be equipped per unit.

| Mythic | Slot | Stats | Unique Passive | Craft Source |
|--------|------|-------|----------------|-------------|
| **Infinity Gauntlet** | Gauntlets | +50 ATK | Abilities deal 50% bonus damage. Every 3rd cast hits ALL enemies. | Legendary Gauntlets + Dragon Scale + 250g |
| **Aegis of Immortality** | Shield | +600 HP, +15% DR | Revive at 60% HP, invulnerable 3s + taunt. Once per combat. | Legendary Shield + Dragon Scale + 250g |
| **Eclipse** | Weapon | +35 ATK | 20% lifesteal. Excess heals → shield (max 30% HP). While shielded, +15% dmg. | Legendary Weapon + Void Crystal + 250g |
| **Staff of Ages** | Weapon | +45 ATK, +20 Start Mana | Ability damage permanently +3% per cast (no cap). | Legendary Weapon + Void Crystal + 250g |
| **Worldbreaker** | Weapon | +30 ATK, -0.15s AtkSpd | On kill: +15% ATK/AS for 8s (5x max). At 5 stacks, splash. | Legendary Weapon + World Shard + 250g |
| **Crown of Ages** | Helm | +40 Start Mana | After casting, next ability costs 0 mana (12s CD). While on CD, +15% DR. | Legendary Helm + World Shard + 250g |

### Mythic Crafting
- Requires Forge Level 5
- Consumes a Legendary-tier equipment piece from the matching slot + 1 Mythic Material + 250g
- Mythic materials unchanged: Dragon Scale (boss drops), Void Crystal (mission 14 3-star / endless), World Shard (Transcendent unit ascension)
- Mythic items cannot be sold or disassembled
- Mythic items CAN be enhanced (+0 to +10) at 1.5x normal gold cost

---

## 7. Upgrade Path — Tier Progression

Lower-tier equipment upgrades to the next tier using materials. The item persists — enhancement level and socketed gems carry over.

### Upgrade Requirements

| From → To | Materials Needed | Gold Cost |
|-----------|-----------------|-----------|
| Common → Uncommon | 3x Common Scraps + 1x Ore Shard | 50g |
| Uncommon → Rare | 3x Uncommon Scraps + 2x Ore Shards | 150g |
| Rare → Epic | 2x Rare Scraps + 1x Refined Ore + 1x Elemental Dust | 400g |
| Epic → Legendary | 2x Epic Scraps + 2x Refined Ore + 1x Prismatic Shard | 1,000g |

### Upgrade Materials

| Material | Source |
|----------|--------|
| **Common Scraps** | Salvage (disassemble) any Common equipment |
| **Uncommon Scraps** | Salvage any Uncommon equipment |
| **Rare Scraps** | Salvage any Rare equipment |
| **Epic Scraps** | Salvage any Epic equipment |
| **Ore Shard** | Mission drops (Regions 1-4), 1-2 per mission |
| **Refined Ore** | 3x Ore Shards combined at Forge, OR Region 5+ drops |
| **Elemental Dust** | Essence conversion at Forge (1 Essence → 2 Elemental Dust) |
| **Prismatic Shard** | Boss drops only (15% chance), or combine 5x Refined Ore |

### Upgrade Rules
- Enhancement level is preserved (a +7 Rare Iron Sword becomes a +7 Epic Iron Sword)
- Socketed gems are preserved
- Set infusion is preserved (if applicable to the new tier)
- The item's identity (Iron Sword, Hunting Bow, etc.) stays the same — only the tier changes
- Upgrade is done at the Forge (Level 2+ for T1→T2, Level 3+ for T2→T3, Level 4+ for T3→T4, Level 5 for T4→T5)

### Salvage System
- Any unequipped equipment can be salvaged at the Forge for scraps of its tier
- Salvaging returns: 1x Scrap of the item's tier + 50% of enhancement gold invested (rounded down)
- Socketed gems are returned to inventory (not destroyed)
- Salvage replaces the old "disassemble" operation

---

## 8. Enhancement System (Kept from current system)

Enhancement works identically to the current system. Applied to any equipment T2 or higher.

| Level | Stat Bonus | Gold Cost | Success Rate | On Failure |
|-------|-----------|-----------|-------------|------------|
| +1 | +5% | 20g | 100% | — |
| +2 | +10% | 30g | 100% | — |
| +3 | +15% | 50g | 100% | — |
| +4 | +22% | 80g | 90% | Stay |
| +5 | +30% | 120g | 80% | Stay |
| +6 | +40% | 180g | 70% | Drop to +5 |
| +7 | +52% | 250g | 55% | Drop to +5 |
| +8 | +66% | 350g | 40% | Drop to +6 |
| +9 | +82% | 500g | 25% | Drop to +7 |
| +10 | +100% | 750g | 15% | Drop to +8 |

- Enhancement applies to BASE stats only
- Pity system: 3 consecutive failures at same level = guaranteed success (2 with Grand Artificer collection bonus)
- Mythic enhancement costs 1.5x gold
- Can enhance while equipped

---

## 9. Gem Socket System (Kept from current system)

Gem sockets work the same way, but socket count is now per-tier:

| Equipment Tier | Sockets |
|---------------|---------|
| Common | 0 |
| Uncommon | 0 |
| Rare | 1 |
| Epic | 1 |
| Legendary | 2 |
| Mythic | 2 |

- Same 9 gem types (Ruby, Sapphire, Emerald, Topaz, Diamond, Amethyst, Opal, Onyx, Prismatic)
- Same 4 gem rarities (Standard, Uncommon, Rare, Epic)
- Same gem combining (3 same type+rarity → 1 next rarity at Forge for 15g)
- Gems can be removed for 10g each
- Gems survive tier upgrades

---

## 10. Drop System — Equipment by Region

### Mission Drops

| Region | Tier Available | Drops per Mission | Boss Drops |
|--------|---------------|-------------------|------------|
| 1 - The Frontier | Common only | 1 equip (3-star: +1) | 1 guaranteed Uncommon |
| 2 - Barracks Trials | Common, Uncommon (30%) | 1 equip (3-star: +1) | 1 guaranteed Uncommon |
| 3 - Synergy Trials | Uncommon primary, Common | 1 equip (3-star: +1) + 1 Ore Shard | 1 guaranteed Rare |
| 4 - Shattered Lands | Uncommon, Rare (20%) | 1 equip (3-star: +1) + 1 Ore Shard | 1 guaranteed Rare |
| 5 - Dual Convergence | Rare primary, Uncommon | 1 equip + 1 gem (3-star: +1 each) | 1 guaranteed Epic + Refined Ore |
| 6 - Elemental Crucible | Rare, Epic (15%) | 1 equip + 1 gem + 1 Ore Shard | 1 guaranteed Epic + Essence |
| 7 - Proving Grounds | Epic primary, Rare | 1 equip + 1 gem | 1 guaranteed Legendary + Mythic Material |
| 8 - The Abyss Gate | Epic, Legendary (10%) | 1 equip + 1 gem + 1 Refined Ore | 1 guaranteed Legendary + Prismatic Shard + Mythic Material |

### Slot Targeting
- Mission drops are random across all slots by default
- **Slot Focus** (new Forge Level 3 operation, 30g): Set a "preferred slot" filter. Next 5 mission drops have 60% chance to be from the preferred slot (normally ~12.5% per slot).
- Boss drops always match the boss's combat style (melee bosses drop weapons/gauntlets, magic bosses drop helms/accessories, etc.)

### Essence Drops (for Set Infusion)
- Elemental Essences drop from Region 4+ missions (10-20% chance, matching region's element theme)
- Boss fights guarantee 1 Essence drop
- Arcane Essence only from bosses (unchanged)

---

## 11. Forge Operations (Updated)

| Operation | Forge Level | Cost | Description |
|-----------|------------|------|-------------|
| **Salvage** | 1+ | Free | Break equipment into scraps of its tier + return gems |
| **Enhance** | 1+ | 20-750g | Increase equipment stats (+0 to +10) |
| **Slot Focus** | 3+ | 30g | Set preferred slot for next 5 drops |
| **Gem Combine** | 3+ | 15g | 3 same gems → 1 higher rarity |
| **Tier Upgrade** | 2-5 (varies) | 50-1000g + mats | Upgrade equipment to next tier |
| **Set Infuse** | 4+ | 50g + Essence | Add set tag to Epic+ equipment |
| **Set Cleanse** | 4+ | 25g | Remove set tag (essence lost) |
| **Mythic Forge** | 5 | 250g + mat | Legendary equip + Mythic Material → Mythic |
| **Reforge** | 3+ | 40g | Reroll an equipment drop into a different item of the same slot and tier |

### Removed Operations
- **Reroll Rarity** — No longer needed; tiers replace rarity
- **Transmute** — No longer needed; no component system
- **Disassemble** — Replaced by Salvage
- **Ability Craft** — No longer needed; no ability item tier

---

## 12. Hero Interaction

### Gating
- Equipment slots are LOCKED on units without a hero equipped
- When a hero is equipped to a unit, all 8 equipment slots unlock
- When a hero is unequipped, all equipment on that unit is automatically returned to inventory
- This means items are a mid-to-late game system (heroes acquired in Regions 2-3)

### Hero Affinity (replaces Item Affinity)
Instead of items having affinity to unit types, **heroes** have affinity to equipment types. Each hero has 1-2 preferred equipment slots that gain +15% bonus stats.

| Hero (example) | Preferred Slots | Thematic Reason |
|----------------|----------------|-----------------|
| Warrior Hero | Weapon, Gauntlets | Martial combat focus |
| Guardian Hero | Chest, Shield | Defensive specialist |
| Mage Hero | Weapon (staves), Helm (circlets) | Arcane power focus |
| Assassin Hero | Weapon (daggers), Boots | Speed and lethality |
| Healer Hero | Shield (orbs/tomes), Accessory | Support/utility focus |
| Ranger Hero | Weapon (bows), Boots | Ranged mobility |

This replaces the per-item affinity table with a simpler per-hero system. It also means the same equipment piece is naturally better on some heroes than others, creating interesting choices about hero-unit-item matchups.

### Equipment Budget per Hero
With ~6-10 heroes, each needing 8 slots across 5 tiers, the total gearing progression is:
- Early game: 1-2 heroes with Common/Uncommon gear in 3-4 slots
- Mid game: 4-6 heroes with Rare gear, partially filling all slots
- Late game: 6-10 heroes with Epic/Legendary gear, set bonuses active
- Endgame: Full Legendary across all heroes, pushing +10 enhancement and Mythic crafting

---

## 13. Migration from Current System

### What's Removed
| Current System | Replacement |
|---------------|-------------|
| 12 base components | Equipment drops directly |
| 21 combined recipes (A+B=C) | Direct equipment drops + Forge crafting |
| 16 set items (element essences) | Set infusion on existing equipment |
| 12 ability items (2 combined → 1 ability) | Folded into equipment passives (Epic+ tiers) |
| Item bench (flat list) | Per-unit equipment screen + inventory |
| 3 item slots per unit | 8 equipment slots per hero-equipped unit |
| Auto-combine on equip | Removed (no components) |
| Component rarity system | Equipment tier system |
| Item affinity (per-item) | Hero affinity (per-hero) |

### What's Kept
| System | Status |
|--------|--------|
| Enhancement (+0 to +10) | Kept as-is |
| Gem sockets (9 types x 4 rarities) | Kept, socket count now tier-based |
| Gem combining | Kept as-is |
| Forge building (5 levels) | Kept, operations updated |
| Mythic items (6) | Kept, now slot-specific equipment |
| Mythic materials (Dragon Scale, Void Crystal, World Shard) | Kept as-is |
| Essence system | Kept for set infusion |
| Recipe book / collection | Repurposed as Equipment Codex |

### What's New
| Feature | Description |
|---------|-------------|
| 8 equipment slots | Weapon, Helm, Chest, Gauntlets, Boots, Shield/Off-hand, Accessory x2 |
| 5-tier progression | Common → Uncommon → Rare → Epic → Legendary |
| Tier upgrade path | Upgrade equipment through tiers with materials |
| Salvage system | Break equipment into upgrade materials |
| Upgrade materials | Scraps, Ore Shards, Refined Ore, Elemental Dust, Prismatic Shards |
| Slot Focus | Target specific slots for mission drops |
| Reforge | Reroll equipment identity within same slot/tier |
| Hero affinity | Heroes boost stats in preferred equipment slots |
| Equipment passives | Epic+ equipment gains passive effects |

### Save Data Migration

**Old save structure** (items.js):
```
saveData.items = {
    bench: [ { id, type, key, rarity, equipped, comp1Rarity, comp2Rarity, enhanceLevel, gems } ],
    mythicMaterials: { dragon_scale: N, ... },
    essences: { fire: N, ... },
    recipeBook: { ... }
}
```

**New save structure**:
```
saveData.equipment = {
    inventory: [
        {
            id: "abc123",
            slot: "weapon",          // slot type
            itemKey: "iron_sword",   // item identity
            tier: 3,                 // 1-5 (or 6 for mythic)
            enhanceLevel: 7,
            gems: ["ruby_rare", null],  // socket contents
            setId: null,             // "inferno" if infused
            equipped: { unitKey: "unit_01", heroKey: "hero_warrior" } // or null
        }
    ],
    materials: {
        commonScraps: 0,
        uncommonScraps: 0,
        rareScraps: 0,
        epicScraps: 0,
        oreShards: 0,
        refinedOre: 0,
        elementalDust: 0,
        prismaticShards: 0
    },
    mythicMaterials: { dragon_scale: 0, void_crystal: 0, world_shard: 0 },
    essences: { fire: 0, water: 0, earth: 0, wind: 0, arcane: 0 },
    codex: { discovered: { weapon: ["iron_sword", ...], ... } },
    slotFocus: { slot: null, remaining: 0 }
}
```

**Migration strategy**:
1. New save version bump required
2. All existing equipped items are converted to equivalent-tier equipment:
   - Components → Common equipment of appropriate slot (stat-matched)
   - Combined items → Uncommon equipment
   - Set items → Rare equipment with set infusion
   - Ability items → Epic equipment (passive preserved)
   - Mythic items → Mythic equipment (unchanged)
3. Enhancement levels preserved on conversion
4. Gems preserved on conversion
5. Existing gold, essences, mythic materials carried over
6. Recipe book entries converted to Codex discoveries
7. Old item bench items that can't map cleanly → converted to equivalent-value scraps + gold refund

---

## 14. Impact on Existing Game Systems

### Combat
- **Stat calculation**: Changes from `base × (1 + rarityBonus) × (1 + enhancementBonus)` to `base × tierMultiplier × (1 + enhancementBonus)`. Simpler.
- **Special effects**: Current special effects (on-hit, on-kill, auras, procs) move into equipment passives at Epic+ tier. Same combat hooks, different source data.
- **Set bonuses**: Same team-wide element buffs, just triggered by infused equipment instead of dedicated set items.
- **Mythic abilities**: Unchanged in combat. Same effects, different data path.

### UI
- **Item bench → Inventory**: Replace flat bench with categorized inventory (filterable by slot, tier, set)
- **Per-unit equip screen**: New screen showing 8 slots with drag-and-drop equipping
- **Forge screen**: Updated operations list, new "Tier Upgrade" and "Salvage" panels
- **Equipment tooltips**: Show base stats, tier, enhancement, gems, set status, passive (if Epic+)
- **Codex screen**: Replaces Recipe Book. Shows all discovered equipment per slot per tier.

### Save Data
- Major save structure change (see Section 13)
- Save version bump and migration function required
- Backwards compatibility: migration function reads old format and writes new format

### Balance
- Total stat budget is similar — 8 slots with moderate per-slot stats ≈ 3 slots with high per-slot stats from the old system
- Enhancement and gem power are unchanged
- Hero gating means fewer total units have items, but each unit is MORE powerful with items (8 slots vs 3)
- Set bonuses are slightly weaker per-unit but the team-wide element buffs are preserved

---

## 15. Equipment Codex & Collection Bonuses

Replaces the Recipe Book. Tracks equipment discovery.

### Discovery
- Equipment is discovered when first obtained (drop or craft)
- Codex shows silhouettes for undiscovered items
- Each slot has its own discovery page

### Collection Milestones

| Milestone | Requirement | Reward |
|-----------|-------------|--------|
| Novice Armorer | Discover 15 different items | +5% equipment drop rate |
| Journeyman Armorer | Discover 40 different items | +10% gem drop rate |
| Master Armorer | Discover 80 different items | Forge operations cost 10% less |
| Tier Master | Own 1 Legendary in every slot | Upgrade materials cost -20% |
| Mythic Collector | Craft any 1 Mythic equipment | Unlock "Auto-enhance" option |
| Grand Collector | Craft all 6 Mythics | Enhancement pity: 2 failures instead of 3 |

---

## Appendix A: Full Item Name Table (Tier Progression)

Each item line has 5 names (one per tier). Examples for Weapons:

| Item Line | Common | Uncommon | Rare | Epic | Legendary |
|-----------|--------|----------|------|------|-----------|
| Sword line | Iron Sword | Steel Sword | Mithril Sword | Adamant Sword | Celestial Blade |
| Bow line | Hunting Bow | Composite Bow | Windcarver Bow | Dragonbone Bow | Astral Longbow |
| Staff line | Arcane Staff | Runic Staff | Leyline Staff | Voidtouched Staff | Staff of Eternity |
| Axe line | War Axe | Battle Axe | Executioner's Axe | Doomcleaver | World Splitter |
| Dagger line | Twin Daggers | Shadow Blades | Venom Fangs | Eclipse Daggers | Oblivion's Edge |
| Hammer line | Warhammer | Maul of Ruin | Seismic Hammer | Titan's Maul | Godforge Hammer |

*(Full name tables for all slots would be generated during implementation — ~39 item lines x 5 tiers = 195 names total.)*

## Appendix B: Gold Sink Analysis

| Sink | Gold/Operation | Frequency | Endgame Monthly |
|------|---------------|-----------|-----------------|
| Enhancement (+4 to +10) | 80–750g | Daily | 5,000–15,000g |
| Tier Upgrades | 50–1,000g + mats | Weekly | 1,000–3,000g |
| Gem combining | 15g | Weekly | 500–1,000g |
| Gem socketing/removal | 10g | Weekly | 200–500g |
| Set Infusion | 50g | Bi-weekly | 200–400g |
| Reforge | 40g | Weekly | 200–400g |
| Slot Focus | 30g | Weekly | 120–200g |
| Mythic crafting | 250g | Monthly | 250g |

Enhancement remains the dominant gold sink, same as current system.
