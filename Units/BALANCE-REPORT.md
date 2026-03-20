# Unit Balance Report — Post-Adjustment (v3)
> Generated via unit-simulator.js | Config: 3★, Level 15, No Ascension
> ALL 66 units survive full 30s — measuring pure output potential

## Changes Applied (131 stat adjustments)

**Tier Scaling** — T2-T5 base HP and ATK multiplied (T2: ×1.15, T3: ×1.25, T4: ×1.35, T5: ×1.50)

**Healer Systemic Buff** — All 9 healers: ATK ×1.4, MaxMana −15

**Specific Nerfs**: Shock Mage (ATK −15%, Mana +15), Wind Archer (ATK −18%), Steel Archer (ATK −12%), Gladiator (ATK −12%), Iron Soldier (ATK −15%), Storm Sovereign (ATK −10%), Terra Sage (ATK −12%), Hydro Mage (ATK −10%)

**Specific Buffs**: Leviathan (HP +20%, ATK +30%), Phoenix (ATK +25%), World Tree (ATK +50%), Gust Sentinel (HP +15%, Mana −15), Fortress/Golem (Mana −15), Ancient Treant (ATK +15%), Siege Engineer/Tempest Weaver/Monsoon Caller/Pyromancer/Ball Lightning/Battle Mage (ATK +10%)

## Results: Before → After

| Metric | Before | After | Target | Status |
|--------|--------|-------|--------|--------|
| T1 avg CR | 358 | 349 | baseline | — |
| T2 ratio | 0.99× | 1.09× | 1.5–2.0× | Better, still low |
| T3 ratio | 1.28× | 1.56× | 2.5–3.5× | **Improved** |
| T4 ratio | 1.59× | 2.17× | 4.0–6.0× | **Improved** |
| T5 ratio | 1.32× | 1.97× | 6.0–10.0× | Better, still low |
| Healer avg CR | 195 | 280 | ~400 | **+44%** |
| Overpowered | 15 | 15 | <5 | Same count |
| Underpowered | 17 | 15 | <5 | Slightly better |

## Tier Scaling (Post-Adjustment)

| Tier | Count | Avg CR | Ratio to T1 |
|------|-------|--------|-------------|
| T1 | 21 | 349 | 1.00× |
| T2 | 15 | 380 | 1.09× |
| T3 | 12 | 546 | 1.56× |
| T4 | 12 | 756 | 2.17× |
| T5 | 6 | 689 | 1.97× |

## Role Averages (Post-Adjustment)

| Role | Before CR | After CR | Change |
|------|-----------|----------|--------|
| Mage | 559 | 705 | +26% |
| Assassin | 513 | 593 | +16% |
| Archer | 492 | 483 | −2% |
| Warrior | 414 | 470 | +14% |
| Tank | 323 | 357 | +11% |
| Healer | 195 | 280 | **+44%** |

## Element Averages (Post-Adjustment)

| Element | Before CR | After CR |
|---------|-----------|----------|
| Lightning | 533 | 618 |
| Wind | 441 | 516 |
| Fire | 387 | 487 |
| Force | 430 | 484 |
| Water | 376 | 439 |
| Earth | 375 | 437 |

## Remaining Overpowered (15)

| Unit | Tier | Type | CR | Tier Avg | Dev% |
|------|------|------|----|----------|------|
| Storm Dragon | T5 | mage | 1649 | 689 | +139% |
| Terra Sage | T3 | mage | 1045 | 546 | +91% |
| Shock Mage | T2 | mage | 703 | 380 | +85% |
| Wind Archer | T1 | archer | 627 | 349 | +80% |
| Fire Dragon | T4 | mage | 1354 | 756 | +79% |
| Earth Shaman | T2 | healer | 678 | 380 | +78% |
| Steel Archer | T1 | archer | 603 | 349 | +73% |
| Gladiator | T3 | warrior | 919 | 546 | +68% |
| Thunder Archer | T1 | archer | 553 | 349 | +58% |
| Storm Sovereign | T4 | assassin | 1166 | 756 | +54% |
| Voltfang Stalker | T4 | assassin | 1140 | 756 | +51% |
| Inferno Fox | T3 | assassin | 798 | 546 | +46% |
| Void Wyrm | T5 | mage | 1002 | 689 | +45% |
| Iron Soldier | T1 | warrior | 478 | 349 | +37% |
| Hydro Mage | T2 | mage | 512 | 380 | +35% |

## Remaining Underpowered (15)

| Unit | Tier | Type | CR | Tier Avg | Dev% |
|------|------|------|----|----------|------|
| Gale Dancer | T1 | healer | 106 | 349 | −70% |
| World Tree | T5 | healer | 205 | 689 | −70% |
| Leviathan | T5 | tank | 200 | 689 | −71% |
| Pulse Mender | T1 | healer | 123 | 349 | −65% |
| Gust Sentinel | T2 | tank | 157 | 380 | −59% |
| Tidal Shaman | T3 | healer | 248 | 546 | −55% |
| Coral Priest | T2 | healer | 183 | 380 | −52% |
| Fire Acolyte | T1 | healer | 173 | 349 | −50% |
| Golem | T3 | tank | 300 | 546 | −45% |
| Fortress | T3 | tank | 308 | 546 | −44% |
| Phoenix | T5 | mage | 401 | 689 | −42% |
| Ancient Treant | T4 | warrior | 446 | 756 | −41% |
| Ashen Watcher | T4 | healer | 496 | 756 | −34% |
| Siege Engineer | T4 | mage | 522 | 756 | −31% |
| Ball Lightning | T3 | mage | 375 | 546 | −31% |

## Root Cause: Kit Mismatches (Design Issues)

Several units remain as outliers not because of stats, but because their ability kits don't match their role. These are **design issues** that stat tuning can't fix:

| Unit | Role | Ability Template | Problem |
|------|------|-----------------|---------|
| Gale Dancer | healer | drain_fighter | Self-heal only, no team healing. It's a DPS/sustain unit labeled as healer. |
| Pulse Mender | healer | cc_chainer | Pure CC ability (AoE stun). Zero healing in kit. It's a CC support labeled as healer. |
| Gust Sentinel | tank | blink_striker | Teleport + damage ability. No shields, no CC, no DR. Offensive ability on a tank. |
| Fortress | tank | unkillable_wall | Self-shield + DR only. High EffHP but 0 team protection. Needs ally shield or CC. |
| Golem | tank | unkillable_wall | Same as Fortress — pure self-preservation, no team contribution. |
| Leviathan | T5 tank | unkillable_wall_premium | Passive DR/submerge only. Zero CC, zero shields, zero team value for a T5 legendary. |
| Phoenix | T5 mage | transformer | 7s toggle cycle is too slow. Offensive phase doesn't produce enough damage to justify defensive downtime. |

**Recommendation**: These units need ability redesigns, not stat adjustments. Specifically:

1. **Gale Dancer** → Change to `heal_and_harm` or add AoE heal component
2. **Pulse Mender** → Add healing effect to stun (e.g., "Stun enemies + heal allies in AoE")
3. **Gust Sentinel** → Change to `shield_stacker` or `bodyguard` — a tank needs to actually tank
4. **Fortress/Golem** → Add ally shield (e.g., "Shield self 60% + Shield nearby allies 30%")
5. **Leviathan** → Add CC aura or ally DR buff alongside passive survivability
6. **Phoenix** → Reduce toggle to 5s, or add AoE burst damage on each toggle switch
