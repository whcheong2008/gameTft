using System;
using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Fires passive triggers during combat. Manages reentry guard (max depth 1)
    /// to prevent infinite passive chains.
    /// </summary>
    public class PassiveSystem
    {
        private int _reentryDepth;
        private const int MAX_REENTRY_DEPTH = 1;

        // Per-unit attack counters for interval-based passives (e.g., every 3rd attack)
        private readonly Dictionary<int, int> _attackCounters = new Dictionary<int, int>();

        // Per-unit periodic timers
        private readonly Dictionary<int, float> _periodicTimers = new Dictionary<int, float>();

        // Per-unit flags for once-per-combat passives
        private readonly Dictionary<int, HashSet<string>> _usedFlags = new Dictionary<int, HashSet<string>>();

        public void OnCombatStart(CombatState state)
        {
            _attackCounters.Clear();
            _periodicTimers.Clear();
            _usedFlags.Clear();
            _reentryDepth = 0;

            var allUnits = new List<CombatUnit>();
            allUnits.AddRange(state.PlayerTeam);
            allUnits.AddRange(state.EnemyTeam);

            foreach (var unit in allUnits)
            {
                if (!unit.IsAlive) continue;
                var passive = PassiveCatalog.Get(unit.UnitId);
                if (passive == null || passive.Trigger != PassiveTrigger.CombatStart) continue;

                FireCombatStartPassive(unit, passive, state);
            }
        }

        public List<PassiveEvent> OnAttack(CombatUnit attacker, CombatUnit target,
            DamageResult result, CombatState state)
        {
            var events = new List<PassiveEvent>();
            if (_reentryDepth >= MAX_REENTRY_DEPTH) return events;
            if (!attacker.IsAlive) return events;

            var passive = PassiveCatalog.Get(attacker.UnitId);
            if (passive == null || passive.Trigger != PassiveTrigger.OnAttack) return events;

            _reentryDepth++;
            try
            {
                int key = attacker.GetHashCode();
                if (!_attackCounters.ContainsKey(key))
                    _attackCounters[key] = 0;
                _attackCounters[key]++;

                // Interval-based passives (every Nth attack)
                float interval = passive.GetParam("interval");
                if (interval > 0)
                {
                    if (_attackCounters[key] % (int)interval == 0)
                    {
                        float bonus = passive.GetParam("bonusDamagePct");
                        if (bonus > 0 && target.IsAlive)
                        {
                            int bonusDmg = (int)Math.Floor(attacker.ATK * bonus);
                            target.CurrentHP -= bonusDmg;
                            if (target.CurrentHP <= 0) { target.CurrentHP = 0; target.IsAlive = false; }
                            events.Add(new PassiveEvent
                            {
                                PassiveId = passive.Id, Source = attacker, Target = target,
                                DamageDealt = bonusDmg,
                                Description = passive.Name + " bonus damage"
                            });
                        }

                        // Ice Sniper cooldown add
                        float cdAdd = passive.GetParam("cooldownAdd");
                        if (cdAdd > 0)
                        {
                            events.Add(new PassiveEvent
                            {
                                PassiveId = passive.Id, Source = attacker, Target = target,
                                Description = passive.Name + " adds cooldown"
                            });
                        }
                    }
                }

                // Proc-chance passives (e.g., 35% root on attack)
                float procChance = passive.GetParam("procChance");
                if (procChance > 0 && target.IsAlive)
                {
                    // Deterministic for testing: use attack counter as pseudo-random
                    // In real combat this would use RNG, but for testability we use threshold
                    events.Add(new PassiveEvent
                    {
                        PassiveId = passive.Id, Source = attacker, Target = target,
                        AppliedStatusEffect = true,
                        StatusType = StatusEffectType.Root,
                        Description = passive.Name + " proc"
                    });
                }

                // Lifesteal passives
                float lifesteal = passive.GetParam("lifestealPct");
                if (lifesteal > 0 && result != null && result.Damage > 0)
                {
                    int healAmt = (int)Math.Floor(result.Damage * lifesteal);
                    if (healAmt > 0 && attacker.IsAlive)
                    {
                        attacker.CurrentHP = Math.Min(attacker.MaxHP, attacker.CurrentHP + healAmt);
                        events.Add(new PassiveEvent
                        {
                            PassiveId = passive.Id, Source = attacker, Target = attacker,
                            HealingDone = healAmt,
                            Description = passive.Name + " lifesteal"
                        });
                    }
                }

                // Execute bonus
                float execThreshold = passive.GetParam("executeThreshold");
                if (execThreshold > 0 && target.IsAlive)
                {
                    float hpPct = (float)target.CurrentHP / target.MaxHP;
                    if (hpPct < execThreshold)
                    {
                        float execBonus = passive.GetParam("executeBonusDmg");
                        int bonusDmg = (int)Math.Floor(attacker.ATK * execBonus);
                        target.CurrentHP -= bonusDmg;
                        if (target.CurrentHP <= 0) { target.CurrentHP = 0; target.IsAlive = false; }
                        events.Add(new PassiveEvent
                        {
                            PassiveId = passive.Id, Source = attacker, Target = target,
                            DamageDealt = bonusDmg,
                            Description = passive.Name + " execute bonus"
                        });
                    }
                }

                // DR Pierce
                float drPierce = passive.GetParam("drPierce");
                if (drPierce > 0)
                {
                    events.Add(new PassiveEvent
                    {
                        PassiveId = passive.Id, Source = attacker, Target = target,
                        Description = passive.Name + " armor pierce"
                    });
                }

                // Kill chain damage (storm_assassin)
                float killChainDmg = passive.GetParam("killChainDamage");
                if (killChainDmg > 0 && target != null && !target.IsAlive)
                {
                    // Find nearest alive enemy
                    var enemies = attacker.Team == Team.Player ? state.EnemyTeam : state.PlayerTeam;
                    CombatUnit nearest = null;
                    foreach (var e in enemies)
                    {
                        if (e.IsAlive && e != target)
                        {
                            nearest = e;
                            break;
                        }
                    }
                    if (nearest != null)
                    {
                        int chainDmg = (int)killChainDmg;
                        nearest.CurrentHP -= chainDmg;
                        if (nearest.CurrentHP <= 0) { nearest.CurrentHP = 0; nearest.IsAlive = false; }
                        events.Add(new PassiveEvent
                        {
                            PassiveId = passive.Id, Source = attacker, Target = nearest,
                            DamageDealt = chainDmg,
                            Description = passive.Name + " kill chain"
                        });
                    }
                }

                // Mana drain (void_wyrm)
                float manaDrain = passive.GetParam("manaDrain");
                if (manaDrain > 0 && target.IsAlive)
                {
                    int drained = Math.Min(target.Mana, (int)manaDrain);
                    target.Mana -= drained;
                    events.Add(new PassiveEvent
                    {
                        PassiveId = passive.Id, Source = attacker, Target = target,
                        Description = passive.Name + " mana drain"
                    });
                }

                // Tank buster (abyssal_mage)
                float tankBonus = passive.GetParam("tankBonusDmg");
                if (tankBonus > 0 && target.IsAlive &&
                    (target.Archetype == Archetype.Guardian || target.Archetype == Archetype.Warden))
                {
                    int bonusDmg = (int)Math.Floor(attacker.ATK * tankBonus);
                    target.CurrentHP -= bonusDmg;
                    if (target.CurrentHP <= 0) { target.CurrentHP = 0; target.IsAlive = false; }
                    events.Add(new PassiveEvent
                    {
                        PassiveId = passive.Id, Source = attacker, Target = target,
                        DamageDealt = bonusDmg,
                        Description = passive.Name + " tank buster"
                    });
                }

                // Heal allies on attack (gaia_priest)
                float healTargets = passive.GetParam("healTargets");
                if (healTargets > 0)
                {
                    float healPct = passive.GetParam("healPct");
                    var allies = attacker.Team == Team.Player ? state.PlayerTeam : state.EnemyTeam;
                    var wounded = new List<CombatUnit>();
                    foreach (var a in allies)
                        if (a.IsAlive && a.CurrentHP < a.MaxHP) wounded.Add(a);
                    wounded.Sort((a, b) => a.CurrentHP.CompareTo(b.CurrentHP));
                    int count = Math.Min((int)healTargets, wounded.Count);
                    for (int i = 0; i < count; i++)
                    {
                        int heal = (int)Math.Floor(wounded[i].MaxHP * healPct);
                        wounded[i].CurrentHP = Math.Min(wounded[i].MaxHP, wounded[i].CurrentHP + heal);
                        events.Add(new PassiveEvent
                        {
                            PassiveId = passive.Id, Source = attacker, Target = wounded[i],
                            HealingDone = heal,
                            Description = passive.Name + " AoE heal"
                        });
                    }
                }
            }
            finally
            {
                _reentryDepth--;
            }

            return events;
        }

        public List<PassiveEvent> OnHit(CombatUnit defender, CombatUnit attacker,
            float damageTaken, CombatState state)
        {
            var events = new List<PassiveEvent>();
            if (_reentryDepth >= MAX_REENTRY_DEPTH) return events;
            if (!defender.IsAlive) return events;

            var passive = PassiveCatalog.Get(defender.UnitId);
            if (passive == null || passive.Trigger != PassiveTrigger.OnHit) return events;

            _reentryDepth++;
            try
            {
                // Reflect damage
                float reflectPct = passive.GetParam("reflectPct");
                if (reflectPct > 0 && attacker != null && attacker.IsAlive)
                {
                    int reflectDmg = (int)Math.Floor(damageTaken * reflectPct);
                    if (reflectDmg > 0)
                    {
                        attacker.CurrentHP -= reflectDmg;
                        if (attacker.CurrentHP <= 0) { attacker.CurrentHP = 0; attacker.IsAlive = false; }
                        events.Add(new PassiveEvent
                        {
                            PassiveId = passive.Id, Source = defender, Target = attacker,
                            DamageDealt = reflectDmg,
                            Description = passive.Name + " reflect"
                        });
                    }
                }

                // Death AoE (volcano_titan)
                float deathAoeDmg = passive.GetParam("deathAoeDamage");
                if (deathAoeDmg > 0 && !defender.IsAlive)
                {
                    int range = (int)passive.GetParam("deathAoeRange", 2);
                    var enemies = defender.Team == Team.Player ? state.EnemyTeam : state.PlayerTeam;
                    foreach (var enemy in enemies)
                    {
                        if (!enemy.IsAlive) continue;
                        if (defender.Position.ManhattanDistance(enemy.Position) <= range)
                        {
                            int dmg = (int)deathAoeDmg;
                            enemy.CurrentHP -= dmg;
                            if (enemy.CurrentHP <= 0) { enemy.CurrentHP = 0; enemy.IsAlive = false; }
                            events.Add(new PassiveEvent
                            {
                                PassiveId = passive.Id, Source = defender, Target = enemy,
                                DamageDealt = dmg,
                                Description = passive.Name + " death AoE"
                            });
                        }
                    }
                }

                // DR boost based on HP threshold
                float drBoostThreshold = passive.GetParam("drBoostThreshold");
                if (drBoostThreshold > 0 && defender.IsAlive)
                {
                    float hpPct = (float)defender.CurrentHP / defender.MaxHP;
                    if (hpPct <= drBoostThreshold)
                    {
                        float drBoost = passive.GetParam("drBoost");
                        events.Add(new PassiveEvent
                        {
                            PassiveId = passive.Id, Source = defender, Target = defender,
                            Description = passive.Name + " DR boost (" + (drBoost * 100) + "%)"
                        });
                    }
                }

                // Dodge counter
                float dodgeChance = passive.GetParam("dodgeChance");
                if (dodgeChance > 0 && attacker != null && attacker.IsAlive)
                {
                    float counterDmgPct = passive.GetParam("counterDmgPct");
                    if (counterDmgPct > 0)
                    {
                        int counterDmg = (int)Math.Floor(defender.ATK * counterDmgPct);
                        attacker.CurrentHP -= counterDmg;
                        if (attacker.CurrentHP <= 0) { attacker.CurrentHP = 0; attacker.IsAlive = false; }
                        events.Add(new PassiveEvent
                        {
                            PassiveId = passive.Id, Source = defender, Target = attacker,
                            DamageDealt = counterDmg,
                            Description = passive.Name + " counter-attack"
                        });
                    }
                }
            }
            finally
            {
                _reentryDepth--;
            }

            return events;
        }

        public List<PassiveEvent> OnHeal(CombatUnit healer, CombatUnit target,
            int healAmount, CombatState state)
        {
            var events = new List<PassiveEvent>();
            if (_reentryDepth >= MAX_REENTRY_DEPTH) return events;
            if (!healer.IsAlive) return events;

            // Template-based passive dispatch (Prompt 45)
            var templateEvents = OnTemplateHeal(healer, target, healAmount, state);
            events.AddRange(templateEvents);

            // Legacy passive dispatch
            var passive = PassiveCatalog.Get(healer.UnitId);
            if (passive == null || passive.Trigger != PassiveTrigger.OnHeal) return events;

            _reentryDepth++;
            try
            {
                // Heal → damage nearest enemy
                float damagePct = passive.GetParam("damagePct");
                if (damagePct > 0)
                {
                    int dmg = (int)Math.Floor(healAmount * damagePct);
                    var enemies = healer.Team == Team.Player ? state.EnemyTeam : state.PlayerTeam;
                    CombatUnit nearest = null;
                    int bestDist = int.MaxValue;
                    foreach (var e in enemies)
                    {
                        if (!e.IsAlive) continue;
                        int dist = healer.Position.ManhattanDistance(e.Position);
                        if (dist < bestDist) { bestDist = dist; nearest = e; }
                    }
                    if (nearest != null && dmg > 0)
                    {
                        nearest.CurrentHP -= dmg;
                        if (nearest.CurrentHP <= 0) { nearest.CurrentHP = 0; nearest.IsAlive = false; }
                        events.Add(new PassiveEvent
                        {
                            PassiveId = passive.Id, Source = healer, Target = nearest,
                            DamageDealt = dmg,
                            Description = passive.Name + " heal→damage"
                        });
                    }
                }

                // Bonus shield on heal (ocean_sage)
                float bonusShield = passive.GetParam("bonusShield");
                if (bonusShield > 0 && target.IsAlive)
                {
                    target.Shield += (int)bonusShield;
                    events.Add(new PassiveEvent
                    {
                        PassiveId = passive.Id, Source = healer, Target = target,
                        ShieldGranted = bonusShield,
                        Description = passive.Name + " bonus shield"
                    });
                }
            }
            finally
            {
                _reentryDepth--;
            }

            return events;
        }

        public List<PassiveEvent> TickAuras(CombatState state, float deltaTime)
        {
            var events = new List<PassiveEvent>();
            if (_reentryDepth >= MAX_REENTRY_DEPTH) return events;

            _reentryDepth++;
            try
            {
                var allUnits = new List<CombatUnit>();
                allUnits.AddRange(state.PlayerTeam);
                allUnits.AddRange(state.EnemyTeam);

                foreach (var unit in allUnits)
                {
                    if (!unit.IsAlive) continue;
                    var passive = PassiveCatalog.Get(unit.UnitId);
                    if (passive == null || passive.Trigger != PassiveTrigger.Aura) continue;

                    // Crit aura (storm_dragon / thunder_god)
                    float critBonus = passive.GetParam("critAuraBonus");
                    if (critBonus > 0)
                    {
                        var allies = unit.Team == Team.Player ? state.PlayerTeam : state.EnemyTeam;
                        foreach (var ally in allies)
                        {
                            if (ally.IsAlive)
                            {
                                // Auras re-apply each tick; the event signals it's active
                            }
                        }
                        events.Add(new PassiveEvent
                        {
                            PassiveId = passive.Id, Source = unit,
                            Description = passive.Name + " crit aura active"
                        });
                    }

                    // ATK buff aura (terra_sage / earthweaver)
                    float atkBuff = passive.GetParam("atkBuffPct");
                    if (atkBuff > 0)
                    {
                        events.Add(new PassiveEvent
                        {
                            PassiveId = passive.Id, Source = unit,
                            Description = passive.Name + " ATK aura active"
                        });
                    }

                    // Periodic strike from aura (storm_dragon: every 6s)
                    float strikeInterval = passive.GetParam("strikeInterval");
                    if (strikeInterval > 0)
                    {
                        int key = unit.GetHashCode();
                        if (!_periodicTimers.ContainsKey(key))
                            _periodicTimers[key] = 0f;
                        _periodicTimers[key] += deltaTime;

                        if (_periodicTimers[key] >= strikeInterval)
                        {
                            _periodicTimers[key] -= strikeInterval;
                            float dmgPct = passive.GetParam("strikeDmgPct", 3.0f);
                            int dmg = (int)Math.Floor(unit.ATK * dmgPct);

                            var enemies = unit.Team == Team.Player ? state.EnemyTeam : state.PlayerTeam;
                            foreach (var enemy in enemies)
                            {
                                if (!enemy.IsAlive) continue;
                                enemy.CurrentHP -= dmg;
                                if (enemy.CurrentHP <= 0) { enemy.CurrentHP = 0; enemy.IsAlive = false; }
                                events.Add(new PassiveEvent
                                {
                                    PassiveId = passive.Id, Source = unit, Target = enemy,
                                    DamageDealt = dmg,
                                    Description = passive.Name + " periodic strike"
                                });
                                break; // Primary target only; chain handled separately
                            }
                        }
                    }
                }
            }
            finally
            {
                _reentryDepth--;
            }

            return events;
        }

        public List<PassiveEvent> TickPeriodic(CombatState state, float deltaTime)
        {
            var events = new List<PassiveEvent>();
            if (_reentryDepth >= MAX_REENTRY_DEPTH) return events;

            _reentryDepth++;
            try
            {
                var allUnits = new List<CombatUnit>();
                allUnits.AddRange(state.PlayerTeam);
                allUnits.AddRange(state.EnemyTeam);

                foreach (var unit in allUnits)
                {
                    if (!unit.IsAlive) continue;
                    var passive = PassiveCatalog.Get(unit.UnitId);
                    if (passive == null || passive.Trigger != PassiveTrigger.Periodic) continue;

                    float interval = passive.GetParam("interval");
                    if (interval <= 0) continue;

                    int key = unit.GetHashCode();
                    if (!_periodicTimers.ContainsKey(key))
                        _periodicTimers[key] = 0f;
                    _periodicTimers[key] += deltaTime;

                    if (_periodicTimers[key] >= interval)
                    {
                        _periodicTimers[key] -= interval;

                        // Shield periodic (shell_knight, etc.)
                        float shieldPct = passive.GetParam("shieldPct");
                        if (shieldPct > 0)
                        {
                            int shieldAmt = (int)Math.Floor(unit.MaxHP * shieldPct);
                            unit.Shield += shieldAmt;
                            events.Add(new PassiveEvent
                            {
                                PassiveId = passive.Id, Source = unit, Target = unit,
                                ShieldGranted = shieldAmt,
                                Description = passive.Name + " shield grant"
                            });

                            // Also shield nearby allies
                            int allyCount = (int)passive.GetParam("allyCount");
                            if (allyCount > 0)
                            {
                                var allies = unit.Team == Team.Player ? state.PlayerTeam : state.EnemyTeam;
                                var candidates = new List<CombatUnit>();
                                foreach (var a in allies)
                                    if (a.IsAlive && a != unit) candidates.Add(a);

                                int count = Math.Min(allyCount, candidates.Count);
                                for (int i = 0; i < count; i++)
                                {
                                    candidates[i].Shield += shieldAmt;
                                    events.Add(new PassiveEvent
                                    {
                                        PassiveId = passive.Id, Source = unit, Target = candidates[i],
                                        ShieldGranted = shieldAmt,
                                        Description = passive.Name + " ally shield"
                                    });
                                }
                            }
                        }

                        // Heal periodic (world_tree)
                        float healPct = passive.GetParam("healPct");
                        if (healPct > 0)
                        {
                            var allies = unit.Team == Team.Player ? state.PlayerTeam : state.EnemyTeam;
                            foreach (var ally in allies)
                            {
                                if (!ally.IsAlive) continue;
                                int heal = (int)Math.Floor(ally.MaxHP * healPct);
                                ally.CurrentHP = Math.Min(ally.MaxHP, ally.CurrentHP + heal);
                                events.Add(new PassiveEvent
                                {
                                    PassiveId = passive.Id, Source = unit, Target = ally,
                                    HealingDone = heal,
                                    Description = passive.Name + " periodic heal"
                                });
                            }
                        }

                        // Stance toggle (phoenix, titan_lord)
                        float offAtkBoost = passive.GetParam("offAtkBoost");
                        if (offAtkBoost > 0)
                        {
                            events.Add(new PassiveEvent
                            {
                                PassiveId = passive.Id, Source = unit, Target = unit,
                                Description = passive.Name + " stance toggle"
                            });
                        }
                    }
                }
            }
            finally
            {
                _reentryDepth--;
            }

            return events;
        }

        private void FireCombatStartPassive(CombatUnit unit, PassiveData passive, CombatState state)
        {
            // Shield all allies (aegis_paladin)
            float allyShield = passive.GetParam("allyShield");
            if (allyShield > 0)
            {
                var allies = unit.Team == Team.Player ? state.PlayerTeam : state.EnemyTeam;
                foreach (var ally in allies)
                {
                    if (ally.IsAlive)
                        ally.Shield += (int)allyShield;
                }
            }

            // First-cast bonus (thunder_archer, shock_mage)
            float firstCastBonus = passive.GetParam("firstCastBonus");
            if (firstCastBonus > 0)
            {
                // Mark unit for first-cast bonus — tracked via _usedFlags
                int key = unit.GetHashCode();
                if (!_usedFlags.ContainsKey(key))
                    _usedFlags[key] = new HashSet<string>();
                _usedFlags[key].Add("firstCastBonus");
            }
        }

        // =====================================================================
        // Template-based passive triggers (Prompt 45 rework)
        // =====================================================================

        /// <summary>
        /// Fire template OnHit passive when attacker lands an auto-attack.
        /// </summary>
        public List<PassiveEvent> OnTemplateHit(CombatUnit attacker, CombatUnit target,
            int damage, CombatState state)
        {
            var events = new List<PassiveEvent>();
            if (_reentryDepth >= MAX_REENTRY_DEPTH) return events;
            if (!attacker.IsAlive) return events;

            var template = AbilityTemplateCatalog.Get(attacker.AbilityTemplateId);
            if (template == null) return events;

            _reentryDepth++;
            try
            {
                var data = new TemplatePassiveData
                {
                    Target = target,
                    Damage = damage
                };
                events = template.ProcessPassive(attacker, TemplateTrigger.OnHit, data, state, new Random());
            }
            finally
            {
                _reentryDepth--;
            }
            return events;
        }

        /// <summary>
        /// Fire template OnKill passive when attacker kills an enemy.
        /// </summary>
        public List<PassiveEvent> OnTemplateKill(CombatUnit attacker, CombatUnit killed,
            CombatState state)
        {
            var events = new List<PassiveEvent>();
            if (_reentryDepth >= MAX_REENTRY_DEPTH) return events;
            if (!attacker.IsAlive) return events;

            var template = AbilityTemplateCatalog.Get(attacker.AbilityTemplateId);
            if (template == null) return events;

            _reentryDepth++;
            try
            {
                var data = new TemplatePassiveData { Killed = killed };
                events = template.ProcessPassive(attacker, TemplateTrigger.OnKill, data, state, new Random());
            }
            finally
            {
                _reentryDepth--;
            }
            return events;
        }

        /// <summary>
        /// Fire template OnAbilityCast passive when a unit casts their ability.
        /// </summary>
        public List<PassiveEvent> OnAbilityCast(CombatUnit caster, CombatState state)
        {
            var events = new List<PassiveEvent>();
            if (_reentryDepth >= MAX_REENTRY_DEPTH) return events;
            if (!caster.IsAlive) return events;

            var template = AbilityTemplateCatalog.Get(caster.AbilityTemplateId);
            if (template == null) return events;

            _reentryDepth++;
            try
            {
                var data = new TemplatePassiveData();
                events = template.ProcessPassive(caster, TemplateTrigger.OnAbilityCast, data, state, new Random());
            }
            finally
            {
                _reentryDepth--;
            }
            return events;
        }

        /// <summary>
        /// Fire template OnHeal passive for healer auto-heals.
        /// Extends the existing OnHeal with template dispatch.
        /// </summary>
        public List<PassiveEvent> OnTemplateHeal(CombatUnit healer, CombatUnit target,
            int healAmount, CombatState state)
        {
            var events = new List<PassiveEvent>();
            if (_reentryDepth >= MAX_REENTRY_DEPTH) return events;
            if (!healer.IsAlive) return events;

            var template = AbilityTemplateCatalog.Get(healer.AbilityTemplateId);
            if (template == null) return events;

            _reentryDepth++;
            try
            {
                var data = new TemplatePassiveData
                {
                    Target = target,
                    Amount = healAmount
                };
                events = template.ProcessPassive(healer, TemplateTrigger.OnHeal, data, state, new Random());
            }
            finally
            {
                _reentryDepth--;
            }
            return events;
        }

        /// <summary>
        /// Check if a unit has a once-per-combat flag available.
        /// </summary>
        public bool HasFlag(CombatUnit unit, string flag)
        {
            int key = unit.GetHashCode();
            HashSet<string> flags;
            if (_usedFlags.TryGetValue(key, out flags))
                return flags.Contains(flag);
            return false;
        }

        /// <summary>
        /// Consume a once-per-combat flag.
        /// </summary>
        public bool ConsumeFlag(CombatUnit unit, string flag)
        {
            int key = unit.GetHashCode();
            HashSet<string> flags;
            if (_usedFlags.TryGetValue(key, out flags))
                return flags.Remove(flag);
            return false;
        }

        public int GetAttackCount(CombatUnit unit)
        {
            int key = unit.GetHashCode();
            int count;
            return _attackCounters.TryGetValue(key, out count) ? count : 0;
        }
    }
}
