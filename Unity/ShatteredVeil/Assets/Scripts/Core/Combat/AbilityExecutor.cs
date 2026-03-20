using System;
using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Resolves ability execution: targeting, damage, healing, shields, special mechanics.
    /// </summary>
    public static class AbilityExecutor
    {
        public static AbilityResult Execute(CombatUnit caster, AbilityData ability,
            CombatState state, GridSystem grid, Random rng)
        {
            var result = new AbilityResult
            {
                AbilityId = ability.Id,
                Caster = caster
            };

            // PassiveCast abilities don't execute through the normal mana system
            if (ability.Type == AbilityType.PassiveCast)
            {
                result.SpecialEvents.Add("passive_no_mana_cast");
                return result;
            }

            var enemies = caster.Team == Team.Player ? state.EnemyTeam : state.PlayerTeam;
            var allies = caster.Team == Team.Player ? state.PlayerTeam : state.EnemyTeam;

            // --- Self-targeting abilities (shields, buffs) ---
            if (ability.Targeting == TargetingRule.Self)
            {
                ExecuteSelfAbility(caster, ability, allies, grid, result);
                return result;
            }

            // --- Heal-targeting abilities ---
            if (ability.Targeting == TargetingRule.LowestHPAlly)
            {
                ExecuteHealAbility(caster, ability, allies, enemies, grid, rng, result);
                return result;
            }

            // --- AllAllies abilities ---
            if (ability.Targeting == TargetingRule.AllAllies)
            {
                ExecuteAllAlliesAbility(caster, ability, allies, result);
                return result;
            }

            // --- AllEnemies abilities ---
            if (ability.Targeting == TargetingRule.AllEnemies)
            {
                ExecuteAllEnemiesAbility(caster, ability, enemies, rng, result);
                return result;
            }

            // --- Standard damage abilities (Nearest, LowestHP, HighestATK, Random, FurthestEnemy) ---
            var target = SelectTarget(caster, ability, enemies, rng);
            if (target == null) return result;

            // Multi-hit abilities (flurry)
            float hitCount;
            if (ability.SpecialParams.TryGetValue("hitCount", out hitCount) && hitCount > 1)
            {
                ExecuteMultiHit(caster, ability, target, (int)hitCount, rng, result);
            }
            else if (ability.AreaRadius > 0)
            {
                // AoE abilities
                ExecuteAoE(caster, ability, target, enemies, grid, rng, result);
            }
            else
            {
                // Single-target damage
                ExecuteSingleTarget(caster, ability, target, rng, result);
            }

            // Handle mana refund on kill
            if (ability.HasFlag(AbilityFlag.ManaRefund))
            {
                foreach (var dmg in result.DamageInstances)
                {
                    if (dmg.Killed)
                    {
                        float refund;
                        if (ability.SpecialParams.TryGetValue("manaRefundOnKill", out refund))
                        {
                            ManaSystem.RefundMana(caster, (int)refund);
                            result.ManaRefunded = true;
                            result.ManaRefundAmount = (int)refund;
                        }
                        break; // Only first kill refunds
                    }
                }
            }

            return result;
        }

        private static CombatUnit SelectTarget(CombatUnit caster, AbilityData ability,
            List<CombatUnit> enemies, Random rng)
        {
            switch (ability.Targeting)
            {
                case TargetingRule.LowestHP:
                    return TargetingSystem.GetTarget(caster, enemies, TargetingRule.LowestHP, rng);
                case TargetingRule.HighestATK:
                    return TargetingSystem.GetTarget(caster, enemies, TargetingRule.HighestATK, rng);
                case TargetingRule.Random:
                    return TargetingSystem.GetTarget(caster, enemies, TargetingRule.Random, rng);
                case TargetingRule.FurthestEnemy:
                    return FindFurthest(caster, enemies);
                default:
                    return TargetingSystem.GetTarget(caster, enemies, TargetingRule.Nearest, rng);
            }
        }

        private static CombatUnit FindFurthest(CombatUnit caster, List<CombatUnit> enemies)
        {
            CombatUnit best = null;
            int bestDist = -1;
            foreach (var u in enemies)
            {
                if (!u.IsAlive) continue;
                int dist = caster.Position.ManhattanDistance(u.Position);
                if (dist > bestDist)
                {
                    bestDist = dist;
                    best = u;
                }
            }
            return best;
        }

        private static void ExecuteSingleTarget(CombatUnit caster, AbilityData ability,
            CombatUnit target, Random rng, AbilityResult result)
        {
            float mult = ability.DamageMultiplier;

            // Conditional bonus: low HP threshold
            float threshold;
            if (ability.HasFlag(AbilityFlag.ConditionBonus) &&
                ability.SpecialParams.TryGetValue("lowHpThreshold", out threshold))
            {
                if (target.MaxHP > 0 && (float)target.CurrentHP / target.MaxHP < threshold)
                {
                    float bonus;
                    if (ability.SpecialParams.TryGetValue("lowHpBonusDmg", out bonus))
                        mult += bonus;
                }
            }

            var ctx = new DamageContext { AbilityMultiplier = mult };

            // Guaranteed crit if below threshold
            if (ability.HasFlag(AbilityFlag.ConditionBonus) &&
                ability.SpecialParams.ContainsKey("lowHpThreshold"))
            {
                float thresh;
                ability.SpecialParams.TryGetValue("lowHpThreshold", out thresh);
                if (target.MaxHP > 0 && (float)target.CurrentHP / target.MaxHP < thresh)
                    ctx.ForceCrit = true;
            }

            var dmgResult = DamageCalculator.Calculate(caster, target, ctx, rng);
            result.DamageInstances.Add(new DamageInstance
            {
                Target = target,
                Damage = dmgResult.Damage,
                IsCrit = dmgResult.IsCrit,
                Killed = !target.IsAlive
            });
            result.TotalDamage += dmgResult.Damage;

            // Mana gain on hit for target
            if (target.IsAlive && dmgResult.Damage > 0)
                ManaSystem.GainManaOnHit(target, dmgResult.Damage);
        }

        private static void ExecuteAoE(CombatUnit caster, AbilityData ability,
            CombatUnit primaryTarget, List<CombatUnit> enemies, GridSystem grid,
            Random rng, AbilityResult result)
        {
            var targets = grid.GetUnitsInRange(primaryTarget.Position, ability.AreaRadius);
            var ctx = new DamageContext { AbilityMultiplier = ability.DamageMultiplier };

            foreach (var target in targets)
            {
                if (!target.IsAlive) continue;
                if (target.Team == caster.Team) continue; // Don't hit allies

                var dmgResult = DamageCalculator.Calculate(caster, target, ctx, rng);
                result.DamageInstances.Add(new DamageInstance
                {
                    Target = target,
                    Damage = dmgResult.Damage,
                    IsCrit = dmgResult.IsCrit,
                    Killed = !target.IsAlive
                });
                result.TotalDamage += dmgResult.Damage;

                if (target.IsAlive && dmgResult.Damage > 0)
                    ManaSystem.GainManaOnHit(target, dmgResult.Damage);
            }
        }

        private static void ExecuteMultiHit(CombatUnit caster, AbilityData ability,
            CombatUnit target, int hitCount, Random rng, AbilityResult result)
        {
            var ctx = new DamageContext { AbilityMultiplier = ability.DamageMultiplier };

            for (int i = 0; i < hitCount; i++)
            {
                if (!target.IsAlive) break;

                var dmgResult = DamageCalculator.Calculate(caster, target, ctx, rng);
                result.DamageInstances.Add(new DamageInstance
                {
                    Target = target,
                    Damage = dmgResult.Damage,
                    IsCrit = dmgResult.IsCrit,
                    Killed = !target.IsAlive
                });
                result.TotalDamage += dmgResult.Damage;

                if (target.IsAlive && dmgResult.Damage > 0)
                    ManaSystem.GainManaOnHit(target, dmgResult.Damage);
            }
        }

        private static void ExecuteSelfAbility(CombatUnit caster, AbilityData ability,
            List<CombatUnit> allies, GridSystem grid, AbilityResult result)
        {
            // Shield abilities
            if (ability.HasFlag(AbilityFlag.Shield))
            {
                float selfPct;
                if (ability.SpecialParams.TryGetValue("selfShieldPct", out selfPct))
                {
                    int shieldAmt = (int)Math.Floor(caster.MaxHP * selfPct);
                    caster.Shield += shieldAmt;
                    result.ShieldGrants.Add(new ShieldGrant { Target = caster, Amount = shieldAmt });
                    result.TotalShielding += shieldAmt;
                }

                float allyPct;
                if (ability.SpecialParams.TryGetValue("allyShieldPct", out allyPct))
                {
                    var nearbyAllies = grid.GetUnitsInRange(caster.Position, 2);
                    foreach (var ally in nearbyAllies)
                    {
                        if (ally == caster || !ally.IsAlive || ally.Team != caster.Team) continue;
                        int shieldAmt = (int)Math.Floor(ally.MaxHP * allyPct);
                        ally.Shield += shieldAmt;
                        result.ShieldGrants.Add(new ShieldGrant { Target = ally, Amount = shieldAmt });
                        result.TotalShielding += shieldAmt;
                    }
                }
            }

            // Self-buff abilities (SelfBuff without shield are just buff grants — tracked as events)
            if (ability.HasFlag(AbilityFlag.SelfBuff) && !ability.HasFlag(AbilityFlag.Shield))
            {
                result.SpecialEvents.Add("self_buff_applied");
            }

            // Taunt abilities with AoE damage
            if (ability.HasFlag(AbilityFlag.Taunt))
            {
                caster.IsTaunting = true;
                result.SpecialEvents.Add("taunt_applied");
            }

            // Dodge buff
            if (ability.HasFlag(AbilityFlag.DodgeBuff))
            {
                result.SpecialEvents.Add("dodge_buff_applied");
            }
        }

        private static void ExecuteHealAbility(CombatUnit caster, AbilityData ability,
            List<CombatUnit> allies, List<CombatUnit> enemies,
            GridSystem grid, Random rng, AbilityResult result)
        {
            // Find lowest HP ally
            CombatUnit healTarget = null;
            foreach (var ally in allies)
            {
                if (!ally.IsAlive) continue;
                if (healTarget == null || ally.CurrentHP < healTarget.CurrentHP)
                    healTarget = ally;
            }

            if (healTarget != null && ability.HealMultiplier > 0)
            {
                int healAmt = (int)Math.Floor(caster.ATK * ability.HealMultiplier);
                int actualHeal = Math.Min(healAmt, healTarget.MaxHP - healTarget.CurrentHP);
                healTarget.CurrentHP += actualHeal;
                result.HealInstances.Add(new HealInstance { Target = healTarget, Amount = actualHeal });
                result.TotalHealing += actualHeal;
            }

            // Damage portion of heal abilities
            if (ability.DamageMultiplier > 0)
            {
                float numTargets;
                ability.SpecialParams.TryGetValue("enemyTargets", out numTargets);
                int count = numTargets > 0 ? (int)numTargets : 1;

                var ctx = new DamageContext { AbilityMultiplier = ability.DamageMultiplier };
                var aliveEnemies = new List<CombatUnit>();
                foreach (var e in enemies) if (e.IsAlive) aliveEnemies.Add(e);

                // Sort by distance for "nearest"
                aliveEnemies.Sort((a, b) =>
                    caster.Position.ManhattanDistance(a.Position)
                    .CompareTo(caster.Position.ManhattanDistance(b.Position)));

                for (int i = 0; i < Math.Min(count, aliveEnemies.Count); i++)
                {
                    var dmgResult = DamageCalculator.Calculate(caster, aliveEnemies[i], ctx, rng);
                    result.DamageInstances.Add(new DamageInstance
                    {
                        Target = aliveEnemies[i],
                        Damage = dmgResult.Damage,
                        IsCrit = dmgResult.IsCrit,
                        Killed = !aliveEnemies[i].IsAlive
                    });
                    result.TotalDamage += dmgResult.Damage;

                    if (aliveEnemies[i].IsAlive && dmgResult.Damage > 0)
                        ManaSystem.GainManaOnHit(aliveEnemies[i], dmgResult.Damage);
                }
            }

            // Shield portion (e.g., war_cleric)
            if (ability.HasFlag(AbilityFlag.Shield) && healTarget != null)
            {
                float shieldPct;
                if (ability.SpecialParams.TryGetValue("shieldPct", out shieldPct))
                {
                    int shieldAmt = (int)Math.Floor(healTarget.MaxHP * shieldPct);
                    healTarget.Shield += shieldAmt;
                    result.ShieldGrants.Add(new ShieldGrant { Target = healTarget, Amount = shieldAmt });
                    result.TotalShielding += shieldAmt;
                }
            }
        }

        private static void ExecuteAllAlliesAbility(CombatUnit caster, AbilityData ability,
            List<CombatUnit> allies, AbilityResult result)
        {
            if (ability.HasFlag(AbilityFlag.Heal))
            {
                float healPct;
                ability.SpecialParams.TryGetValue("healAllPct", out healPct);
                if (healPct > 0)
                {
                    foreach (var ally in allies)
                    {
                        if (!ally.IsAlive) continue;
                        int healAmt = (int)Math.Floor(ally.MaxHP * healPct);
                        int actualHeal = Math.Min(healAmt, ally.MaxHP - ally.CurrentHP);
                        ally.CurrentHP += actualHeal;
                        result.HealInstances.Add(new HealInstance { Target = ally, Amount = actualHeal });
                        result.TotalHealing += actualHeal;
                    }
                }
            }
        }

        private static void ExecuteAllEnemiesAbility(CombatUnit caster, AbilityData ability,
            List<CombatUnit> enemies, Random rng, AbilityResult result)
        {
            if (ability.DamageMultiplier > 0)
            {
                var ctx = new DamageContext { AbilityMultiplier = ability.DamageMultiplier };
                foreach (var enemy in enemies)
                {
                    if (!enemy.IsAlive) continue;
                    var dmgResult = DamageCalculator.Calculate(caster, enemy, ctx, rng);
                    result.DamageInstances.Add(new DamageInstance
                    {
                        Target = enemy,
                        Damage = dmgResult.Damage,
                        IsCrit = dmgResult.IsCrit,
                        Killed = !enemy.IsAlive
                    });
                    result.TotalDamage += dmgResult.Damage;

                    if (enemy.IsAlive && dmgResult.Damage > 0)
                        ManaSystem.GainManaOnHit(enemy, dmgResult.Damage);
                }
            }
        }
    }
}
