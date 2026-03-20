# Healer System Fix — Critical for Unity Port

> This documents a combat engine bug found and fixed in the HTML prototype during the template ability rework. The Unity port MUST implement these rules correctly from the start.

---

## 1. Core Rule: Healers Do NOT Auto-Attack Enemies

Healers are fundamentally different from every other unit type. Their auto-attack targets the **lowest-HP ally**, not the nearest enemy. Their ATK stat is converted into healing, not damage.

```
EVERY other unit type:  auto-attack → nearest enemy → dealDamage(ATK)
Healer:                 auto-attack → lowest-HP% ally → dealHealing(ATK)
```

**Target selection logic** (from `findTarget` in main-v2.js):
- Scan all allies on healer's side
- Find the ally with the lowest HP% that is NOT at full HP
- If all allies are full HP, fallback to targeting closest enemy (rare edge case)

**Auto-heal execution** (from `performAttack` in main-v2.js):
- When a healer's target is on their own side, the attack becomes a heal
- Heal amount = healer's ATK stat (modified by healBonus if any)
- This generates mana (+10 per heal, same as an auto-attack)
- This does NOT deal damage to any enemy (unless an item like Archangel's Staff adds secondary damage)

**Unity implementation**: The healer auto-attack path must be a completely separate branch in the attack resolution code. Do not route it through the damage pipeline at all.

---

## 2. Bug Fixed: Healer Passive Trigger Was Missing

### The Problem

The HTML prototype's `performAttack` function had the healer heal-branch returning early, BEFORE the passive hook (`processOnAttackPassive`) was reached:

```
performAttack(attacker, target):
    if healer && target is ally:
        dealHealing(...)
        return  ← EARLY RETURN

    processOnAttackPassive(...)  ← NEVER REACHED FOR HEALERS
    dealDamage(...)
```

This meant healer template passives (like `heal_and_harm`'s "when healing, also damage nearest enemy") never fired from auto-heals. They only fired when the healer cast an active ability.

### The Fix

Added three things to the healer heal-branch, BEFORE the return:

1. **Mana generation**: +10 mana per auto-heal (healers were also not generating mana from their auto-heals, only from taking damage)
2. **Template passive trigger**: `processTemplatePassive(attacker, 'onHeal', { target, amount })` — fires the `onHeal` trigger so templates like `heal_and_harm` work
3. **Mana Shrine interaction**: If healer has a Mana Shrine modifier, apply it to the mana gain

**Fixed code** (main-v2.js, inside `performAttack`):
```javascript
if (attacker.type === 'healer' && target.side === attacker.side) {
    var healAmt = attacker.attack || 10;
    if (attacker.healBonus) healAmt = Math.floor(healAmt * (1 + attacker.healBonus));
    dealHealing(attacker, target, healAmt);

    // Mana from auto-heal (same as auto-attack: +10 per heal)
    if (attacker.maxMana > 0) {
        attacker.currentMana = Math.min(attacker.maxMana, attacker.currentMana + 10);
    }

    // Template passive: onHeal trigger
    if (attacker.abilityTemplate && typeof processTemplatePassive === 'function') {
        processTemplatePassive(attacker, 'onHeal', { target: target, amount: healAmt });
    }

    // ... item effects (Archangel's Staff etc.) ...
    return;
}
```

**Unity implementation**: The healer auto-heal MUST:
- Generate mana (+10 per heal)
- Fire the `onHeal` passive trigger
- Apply any item-based secondary effects

---

## 3. Template Assignment Mismatches (Design Issues)

The balance simulator found several units whose assigned ability template doesn't match their role. These need to be fixed in both the prototype and Unity:

| Unit | Role | Current Template | Problem | Recommended Fix |
|------|------|-----------------|---------|-----------------|
| **Gale Dancer** | Healer (Wind) | `drain_fighter` | Self-sustain only, zero team healing. Drain Fighter is a selfish DPS template — wrong for a healer. | Change to `heal_and_harm` — heals allies while dealing wind damage to enemies. |
| **Pulse Mender** | Healer (Lightning) | `cc_chainer` | Pure CC (stun chains), no healing in ability kit. CC Chainer is a control template — a healer needs to heal. | Change to `cc_chainer` BUT add healing component: "Stun nearby enemies + heal nearby allies for X% ATK." Or change to `heal_and_harm`. |
| **Gust Sentinel** | Tank (Wind) | `blink_striker` | Teleport + damage ability. No shields, no CC, no DR. Blink Striker is an offensive assassin template — wrong for a tank. | Change to `bodyguard` or `shield_stacker` — a tank needs defensive utility. |
| **Fortress** | Tank (Force) | `unkillable_wall` | Self-shield + DR only, zero team protection. Survives forever but contributes nothing to allies. | Keep `unkillable_wall` but modify the template to add ally shield component (e.g., "Shield self 30% + allies 15%"). |
| **Golem** | Tank (Earth) | `unkillable_wall` | Same as Fortress — pure self-preservation with no team value. | Same fix: add ally protection to the `unkillable_wall` template. |
| **Leviathan** | T5 Tank (Water) | `unkillable_wall_premium` | Legendary tank with passive DR/submerge only. Zero CC, zero shields, zero team aura for a T5 unit. | Add CC aura or ally DR buff alongside the survivability passive. T5 legendaries should have team-wide impact. |
| **Phoenix** | T5 Mage (Fire) | `transformer` | 7s stance toggle cycle is too slow. Offensive phase doesn't produce enough damage to justify defensive downtime. | Reduce toggle to 5s, or add AoE burst damage on each stance switch. |

---

## 4. Passive Trigger Types

The template system uses these passive trigger hooks. Unity must implement all of them:

| Trigger | When It Fires | Data Passed |
|---------|--------------|-------------|
| `onHit` | Unit lands an auto-attack on a target | `{ target, damage }` |
| `onHeal` | Healer auto-heals an ally | `{ target, amount }` |
| `onTakeDamage` | Unit takes damage from any source | `{ attacker, damage }` |
| `onKill` | Unit kills an enemy | `{ killed }` |
| `onTick` | Every combat tick (0.1s) | `{ dt }` |
| `onAbilityCast` | Unit finishes casting their ability | `{ }` |

**Critical**: `onHit` should NOT fire for healers during auto-heals. Use `onHeal` instead. These are mutually exclusive — a healer auto-attack is always a heal, never a hit.

---

## 5. Healer Mana Economy

Healers generate mana from two sources:
1. **Auto-healing allies**: +10 mana per heal (same rate as other units' auto-attacks)
2. **Taking damage**: `manaFromDmg = max(1, floor((totalDmg / maxHp) * 50))`

Healers do NOT generate mana from dealing damage (because they don't deal damage with auto-attacks). Their only damage comes from:
- Ability secondary effects (e.g., Heal-and-Harm template damages enemies as part of the ability)
- Template passives that trigger on healing (e.g., "when healing, burn nearest enemy")
- Items (Archangel's Staff)

This means healers charge abilities slightly slower than DPS units in low-damage scenarios, which is intentional — healer abilities are high-impact and shouldn't spam.
