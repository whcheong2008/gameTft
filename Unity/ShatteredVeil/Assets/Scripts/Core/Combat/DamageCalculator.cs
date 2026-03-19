using System;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Full 13-step damage pipeline from GROUND-TRUTH.md section 1.
    /// All 13 steps fully implemented.
    /// </summary>
    public static class DamageCalculator
    {
        public const float DR_CAP = 0.75f;
        public const float BASE_CRIT_MULTIPLIER = 1.5f;
        public const float FREEZE_VULNERABILITY = 1.2f;
        public const int MANA_PER_AUTO = 10;

        public static DamageResult Calculate(CombatUnit attacker, CombatUnit target,
            DamageContext context, Random rng)
        {
            var result = new DamageResult();

            // Step 1: Stasis check
            if (target.Stasis > 0)
            {
                result.Damage = 0;
                return result;
            }

            // Step 2: Base damage
            float multiplier = context.AbilityMultiplier > 0f
                ? context.AbilityMultiplier
                : 1.0f;
            float dmg = attacker.ATK * multiplier;

            // Step 3: Element multiplier
            float elemMult = ElementSystem.GetMultiplier(attacker.Element, target.Element);
            if (target.ElemResist > 0f && elemMult > 1.0f)
            {
                elemMult = 1.0f + (elemMult - 1.0f) * (1f - target.ElemResist);
            }
            dmg *= elemMult;
            result.ElementMultiplier = elemMult;

            // Step 4: Critical strike
            bool isCrit = context.ForceCrit ||
                          (attacker.CritChance > 0f && rng.NextDouble() < attacker.CritChance);
            if (isCrit)
            {
                dmg *= BASE_CRIT_MULTIPLIER + context.BonusCritDamage;
                result.IsCrit = true;
            }

            // Step 5: Damage reduction
            if (!context.IsTrueDamage)
            {
                float totalDR = target.DamageReduction;
                // Sorcerer spell penetration reduces DR
                if (context.SpellPenetration > 0f)
                    totalDR *= (1f - context.SpellPenetration);
                // DR cap
                if (totalDR > DR_CAP)
                    totalDR = DR_CAP;
                if (totalDR > 0f)
                    dmg = (float)Math.Floor(dmg * (1f - totalDR));
            }

            // Step 6: Minimum damage floor
            int finalDmg = Math.Max(1, (int)Math.Floor(dmg));

            // Step 7: Freeze vulnerability — frozen targets take +20% damage
            if (target.IsFrozen)
                finalDmg = (int)Math.Floor(finalDmg * FREEZE_VULNERABILITY);

            // Step 8: Vulnerability status — take +vulnPct% damage
            if (target.Vulnerability > 0)
                finalDmg = (int)Math.Floor(finalDmg * (1f + target.Vulnerability));

            // Step 9: Ranger mark amplification — marked targets take +markAmp% damage
            if (context.RangerMarkAmp > 0)
                finalDmg = (int)Math.Floor(finalDmg * (1f + context.RangerMarkAmp));

            // Step 10: Dodge check
            float totalDodge = target.DodgeChance;
            if (totalDodge > 0f && rng.NextDouble() < totalDodge)
            {
                result.IsDodged = true;
                result.Damage = 0;
                return result;
            }

            // Step 11: Shield absorption
            int shieldAbsorbed = 0;
            if (target.Shield > 0)
            {
                shieldAbsorbed = Math.Min(target.Shield, finalDmg);
                target.Shield -= shieldAbsorbed;
                finalDmg -= shieldAbsorbed;
            }
            result.ShieldAbsorbed = shieldAbsorbed;

            // Step 12: Apply to HP
            target.CurrentHP -= finalDmg;
            if (target.CurrentHP <= 0)
            {
                target.CurrentHP = 0;
                target.IsAlive = false;
            }

            result.Damage = finalDmg + shieldAbsorbed;

            // Step 13: Post-damage triggers
            int totalDamageDealt = finalDmg + shieldAbsorbed;

            // Reflect: melee attackers take reflect damage back
            if (context.ReflectPct > 0 && totalDamageDealt > 0 && attacker.IsAlive)
            {
                int reflectDmg = (int)Math.Floor(totalDamageDealt * context.ReflectPct);
                if (reflectDmg > 0)
                {
                    attacker.CurrentHP -= reflectDmg;
                    if (attacker.CurrentHP <= 0)
                    {
                        attacker.CurrentHP = 0;
                        attacker.IsAlive = false;
                    }
                    result.ReflectDamage = reflectDmg;
                }
            }

            // Lifesteal: heal attacker for % of damage dealt
            if (context.LifestealPct > 0 && totalDamageDealt > 0 && attacker.IsAlive)
            {
                int healAmount = (int)Math.Floor(totalDamageDealt * context.LifestealPct);
                if (healAmount > 0)
                {
                    attacker.CurrentHP += healAmount;
                    if (attacker.CurrentHP > attacker.MaxHP)
                        attacker.CurrentHP = attacker.MaxHP;
                    result.LifestealHealed = healAmount;
                }
            }

            return result;
        }

        /// <summary>
        /// Simplified calculate for test compatibility — no side effects on units.
        /// Returns raw damage value before shield/HP application.
        /// </summary>
        public static int CalculateRaw(int atk, float abilityMultiplier, float elementMultiplier,
            float damageReduction, bool isCrit, float bonusCritDamage = 0f)
        {
            float dmg = atk * (abilityMultiplier > 0f ? abilityMultiplier : 1.0f);
            dmg *= elementMultiplier;

            if (isCrit)
                dmg *= BASE_CRIT_MULTIPLIER + bonusCritDamage;

            float dr = Math.Min(damageReduction, DR_CAP);
            if (dr > 0f)
                dmg = (float)Math.Floor(dmg * (1f - dr));

            return Math.Max(1, (int)Math.Floor(dmg));
        }
    }
}
