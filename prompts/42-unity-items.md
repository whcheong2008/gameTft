# Prompt 42: Item System Port

> **Purpose**: Port the Diablo-style equipment system — two-axis loot (tier × rarity), 8 equipment slots, affixes, enhancement, gem sockets, and Echo Shaping rerolls.
>
> **Branch**: `feature/unity-items`
> **Depends on**: Prompt 36 (CombatUnit — stat modifiers), Prompt 40 (IUnitData)
> **Can run in parallel with**: Prompt 43 (heroes)
> **Session type**: Claude Code with Unity MCP

---

## Read First

- `GROUND-TRUTH.md` section 12 (Item System) — the authoritative spec
- `ITEMS-REDESIGN.md` — full design doc
- `js/items.js` — reference implementation (generation, affixes, enhancement, gems, Echo Shaping)

---

## Pure C# Logic — `Scripts/Core/Items/`

NO `using UnityEngine`. Namespace `ShatteredVeil.Core.Items`.

### Data Models

**`ItemSlot.cs`** (enum):
```
Weapon, Helm, ChestArmor, Gauntlets, Boots, OffHand, Accessory1, Accessory2
```

**`ItemTier.cs`** (enum): T1=1, T2=2, T3=3, T4=4, T5=5

**`ItemRarity.cs`** (enum): Common, Uncommon, Rare, Epic, Legendary

**`Affix.cs`**: Stat type, value, roll range (min/max)

**`GemType.cs`** (enum): Ruby, Sapphire, Emerald, Topaz, Diamond, Amethyst, Opal, Onyx, Prismatic

**`Gem.cs`**: GemType, rarity (Standard/Uncommon/Rare/Epic), stat bonus (scaled by rarity)

**`Equipment.cs`** — A single piece of equipment:
```
- string Id (GUID)
- ItemSlot Slot
- ItemTier Tier
- ItemRarity Rarity
- int EnhanceLevel (0-10)
- int BaseStatValue (calculated from tier × rarity formula)
- List<Affix> Affixes (0-3 depending on rarity)
- Gem[] Sockets (0-2 depending on rarity: Common/Uncommon=0, Rare/Epic=1, Legendary=2)
- bool IsLocked (for Echo Shaping lock)
```

### Core Systems

**`ItemGenerator.cs`** — Create items from drops:
```
- GenerateItem(ItemSlot slot, ItemTier tier, System.Random rng) → Equipment
  1. Roll rarity: Common 50%, Uncommon 30%, Rare 13%, Epic 5.5%, Legendary 1.5%
  2. Calculate base stat: baseStat × tierMult × rarityMult
     Tier mults: T1=1.0, T2=1.5, T3=2.17, T4=3.0, T5=4.0
     Rarity mults: Common=1.0, Uncommon=1.2, Rare=1.5, Epic=1.8, Legendary=2.2
  3. Roll bonus affixes (0 for Common, 1 Uncommon, 2 Rare/Epic, 3 Legendary)
  4. Set socket count (0/0/1/1/2)
  5. Return Equipment
```

**`ItemAffixPool.cs`** — Affix definitions and roll ranges per slot and tier

**`EnhancementSystem.cs`** — Upgrade items +1 through +10:
```
- GetEnhanceCost(int currentLevel) → int VE
- GetSuccessRate(int currentLevel) → float (1.0 at +1-3, 0.9 at +4, down to 0.15 at +10)
- GetFailureDropLevel(int currentLevel) → int (stay at +1-5, drop to +5 at +6-7, etc.)
- Enhance(Equipment item, System.Random rng, ref int consecutiveFailures) → EnhanceResult
  - Pity: 3 consecutive failures at same level → guaranteed success
  - Stat bonus per level from GROUND-TRUTH table (+5% to +100%)
```

**`GemSystem.cs`** — Socket and combine gems:
```
- SocketGem(Equipment item, Gem gem, int socketIndex) → bool
- RemoveGem(Equipment item, int socketIndex) → Gem
- CombineGems(Gem a, Gem b, Gem c) → Gem (3 same type+rarity → 1 next rarity, cost 15 VE)
- GetGemStatBonus(Gem gem) → StatModifier
- Gem stat values from GROUND-TRUTH: Ruby +100HP, Sapphire +8ATK, etc.
- Rarity scaling: Standard 1.0×, Uncommon 1.25×, Rare 1.5×, Epic 2.0×
```

**`EchoShapingSystem.cs`** — Reroll affixes:
```
- RerollAffixes(Equipment item, bool[] lockedAffixes, System.Random rng, ref int currentVE) → bool
  - Locked affixes are preserved, others rerolled
  - Cost increases per reroll
  - Only works on Rare+ items
```

**`EquipmentStatCalculator.cs`** — Calculate total stats from equipped items:
```
- CalculateEquipmentBonuses(Equipment[] equipped) → StatModifier[]
  - Sum all base stats, affix stats, enhancement bonuses, and gem bonuses
  - Returns flat stat modifiers to apply to CombatUnit at combat start
```

---

## Tests — `Tests/EditMode/Items/`

**`ItemGeneratorTests.cs`**:
- Generated item has correct tier and slot
- Rarity distribution over 10,000 rolls within ±2% of configured weights
- Base stat matches tier × rarity formula
- Affix count matches rarity (0/1/2/2/3)
- Socket count matches rarity (0/0/1/1/2)

**`EnhancementSystemTests.cs`**:
- +1 through +3 always succeed
- +10 has 15% success rate (test with seeded RNG)
- Failure at +6 drops to +5
- Pity: 3 consecutive fails → next succeeds
- Stat bonus at each level matches GROUND-TRUTH table

**`GemSystemTests.cs`**:
- Socket gem into empty socket → success
- Socket gem into full socket → fails
- Combine 3 same gems → next rarity
- Gem stat bonuses match GROUND-TRUTH values
- Rarity scaling multipliers correct

**`EquipmentStatCalculatorTests.cs`**:
- Single weapon equipped → correct ATK bonus
- Full 8-slot loadout → all bonuses summed correctly
- Enhancement bonus applied on top of base

---

## Validation Checklist

- [ ] No `using UnityEngine` in Core/Items/
- [ ] Item generation formula matches GROUND-TRUTH exactly
- [ ] Enhancement success rates and failure behavior match table
- [ ] Gem stats and combining match GROUND-TRUTH
- [ ] All tests pass

## Commit

```
git add Unity/ShatteredVeil/Assets/Scripts/Core/Items/ Unity/ShatteredVeil/Assets/Tests/EditMode/Items/
git commit -m "Prompt 42: Item system — two-axis loot, enhancement +0-10, gem sockets, Echo Shaping, equipment stat calc"
```
