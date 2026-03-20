using System;
using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Passive trigger types for template passives.
    /// </summary>
    public enum TemplateTrigger
    {
        OnHit,
        OnHeal,
        OnTakeDamage,
        OnKill,
        OnTick,
        OnAbilityCast
    }

    /// <summary>
    /// Data passed to template passive processors.
    /// </summary>
    public class TemplatePassiveData
    {
        public CombatUnit Target;
        public CombatUnit Attacker;
        public int Damage;
        public int Amount; // heal amount
        public float DeltaTime;
        public CombatUnit Killed;
    }

    /// <summary>
    /// Represents one ability template with both active ability and passive logic.
    /// </summary>
    public class AbilityTemplate
    {
        public string Id;
        public string Name;
        public bool IsLegendary; // T5-only template

        /// <summary>
        /// Execute the template's active ability.
        /// Returns an AbilityResult with all damage/heal/shield instances.
        /// </summary>
        public Func<CombatUnit, CombatUnit, List<CombatUnit>, List<CombatUnit>,
            GridSystem, Random, AbilityResult> ExecuteAbility;

        /// <summary>
        /// Process the template's passive effect.
        /// Returns a list of passive events triggered.
        /// </summary>
        public Func<CombatUnit, TemplateTrigger, TemplatePassiveData,
            CombatState, Random, List<PassiveEvent>> ProcessPassive;
    }

    /// <summary>
    /// Static catalog of all 25 ability templates (19 active + 6 legendary).
    /// Replaces AbilityCatalog.cs (132 unique abilities) and PassiveCatalog.cs (132 passives).
    /// Templates are element-skinned and tier-scaled.
    /// Mirrors ABILITY_TEMPLATE_DEFS from ability-templates.js.
    /// </summary>
    public static class AbilityTemplateCatalog
    {
        private static Dictionary<string, AbilityTemplate> _catalog;

        public static int Count => GetCatalog().Count;

        public static AbilityTemplate Get(string templateId)
        {
            if (string.IsNullOrEmpty(templateId)) return null;
            var catalog = GetCatalog();
            return catalog.TryGetValue(templateId, out var template) ? template : null;
        }

        public static Dictionary<string, AbilityTemplate> GetAll()
        {
            return new Dictionary<string, AbilityTemplate>(GetCatalog());
        }

        public static bool Contains(string templateId)
        {
            if (string.IsNullOrEmpty(templateId)) return false;
            return GetCatalog().ContainsKey(templateId);
        }

        private static Dictionary<string, AbilityTemplate> GetCatalog()
        {
            if (_catalog != null) return _catalog;
            _catalog = new Dictionary<string, AbilityTemplate>(25);
            RegisterActiveTemplates();
            RegisterLegendaryTemplates();
            return _catalog;
        }

        // =====================================================================
        // Shared helpers
        // =====================================================================

        private static TierScaling.ScaleFactors Scale(CombatUnit u)
        {
            return TierScaling.Get(u.Tier, false);
        }

        private static TierScaling.ScaleFactors ScaleEvolved(CombatUnit u)
        {
            return TierScaling.Get(u.Tier, true);
        }

        private static List<CombatUnit> AliveOnly(List<CombatUnit> units)
        {
            var result = new List<CombatUnit>();
            foreach (var u in units) if (u.IsAlive) result.Add(u);
            return result;
        }

        private static CombatUnit FindLowestHpAlly(List<CombatUnit> allies, CombatUnit exclude = null)
        {
            CombatUnit best = null;
            float bestPct = float.MaxValue;
            foreach (var a in allies)
            {
                if (!a.IsAlive || a == exclude) continue;
                float pct = (float)a.CurrentHP / a.MaxHP;
                if (pct < bestPct) { bestPct = pct; best = a; }
            }
            return best;
        }

        private static CombatUnit FindNearestEnemy(CombatUnit caster, List<CombatUnit> enemies)
        {
            CombatUnit best = null;
            int bestDist = int.MaxValue;
            foreach (var e in enemies)
            {
                if (!e.IsAlive) continue;
                int dist = caster.Position.ManhattanDistance(e.Position);
                if (dist < bestDist) { bestDist = dist; best = e; }
            }
            return best;
        }

        private static List<CombatUnit> GetEnemiesInRange(CombatUnit caster,
            List<CombatUnit> enemies, int range)
        {
            var result = new List<CombatUnit>();
            foreach (var e in enemies)
            {
                if (!e.IsAlive) continue;
                if (caster.Position.ManhattanDistance(e.Position) <= range)
                    result.Add(e);
            }
            return result;
        }

        private static void ApplyDamage(CombatUnit target, int damage, AbilityResult result,
            bool isCrit = false)
        {
            if (!target.IsAlive || damage <= 0) return;
            target.CurrentHP -= damage;
            bool killed = false;
            if (target.CurrentHP <= 0) { target.CurrentHP = 0; target.IsAlive = false; killed = true; }
            result.DamageInstances.Add(new DamageInstance
            {
                Target = target, Damage = damage, IsCrit = isCrit, Killed = killed
            });
            result.TotalDamage += damage;
        }

        private static void ApplyHeal(CombatUnit target, int amount, AbilityResult result)
        {
            if (!target.IsAlive || amount <= 0) return;
            target.CurrentHP = Math.Min(target.MaxHP, target.CurrentHP + amount);
            result.HealInstances.Add(new HealInstance { Target = target, Amount = amount });
            result.TotalHealing += amount;
        }

        private static void ApplyShield(CombatUnit target, int amount, AbilityResult result)
        {
            if (!target.IsAlive || amount <= 0) return;
            target.Shield += amount;
            result.ShieldGrants.Add(new ShieldGrant { Target = target, Amount = amount });
            result.TotalShielding += amount;
        }

        // =====================================================================
        // 19 ACTIVE TEMPLATES
        // =====================================================================

        private static void RegisterActiveTemplates()
        {
            // 1. dot_spreader
            _catalog["dot_spreader"] = new AbilityTemplate
            {
                Id = "dot_spreader", Name = "Dot Spreader", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "dot_spreader", Caster = caster };
                    var s = Scale(caster);
                    int dmgBase = (int)Math.Floor(caster.ATK * s.AbilityMult);
                    var inArea = GetEnemiesInRange(caster, enemies, 2);
                    foreach (var t in inArea)
                    {
                        int dmg = dmgBase;
                        // +40% to already afflicted (simplified: check if target has DoT via Vulnerability flag)
                        ApplyDamage(t, dmg, r);
                    }
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnHit || data.Target == null) return events;
                    // Auto-attacks apply element DoT (simplified: bonus damage representing DoT)
                    var s = Scale(caster);
                    int dotDmg = (int)Math.Floor(s.DotDps);
                    if (dotDmg > 0 && data.Target.IsAlive)
                    {
                        data.Target.CurrentHP -= dotDmg;
                        if (data.Target.CurrentHP <= 0) { data.Target.CurrentHP = 0; data.Target.IsAlive = false; }
                        events.Add(new PassiveEvent
                        {
                            PassiveId = "dot_spreader", Source = caster, Target = data.Target,
                            DamageDealt = dotDmg, Description = "Dot Spreader DoT tick"
                        });
                    }
                    return events;
                }
            };

            // 2. dot_detonator
            _catalog["dot_detonator"] = new AbilityTemplate
            {
                Id = "dot_detonator", Name = "Dot Detonator", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "dot_detonator", Caster = caster };
                    var s = Scale(caster);
                    int dmgBase = (int)Math.Floor(caster.ATK * s.AbilityMult);
                    // Marks: use Vulnerability stacks as proxy (max 5, +30% per mark)
                    int marks = Math.Min(5, (int)(target.Vulnerability * 10)); // simplified
                    float bonus = 1f + marks * 0.30f;
                    int dmg = (int)Math.Floor(dmgBase * bonus);
                    ApplyDamage(target, dmg, r);
                    // Reset marks
                    target.Vulnerability = 0;
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnHit || data.Target == null) return events;
                    // Apply mark (max 5)
                    if (data.Target.Vulnerability < 0.5f)
                    {
                        data.Target.Vulnerability += 0.1f; // Each mark = 0.1 (5 marks = 0.5)
                        events.Add(new PassiveEvent
                        {
                            PassiveId = "dot_detonator", Source = caster, Target = data.Target,
                            Description = "Dot Detonator mark applied"
                        });
                    }
                    return events;
                }
            };

            // 3. revenge_tank
            _catalog["revenge_tank"] = new AbilityTemplate
            {
                Id = "revenge_tank", Name = "Revenge Tank", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "revenge_tank", Caster = caster };
                    var s = Scale(caster);
                    int dmg = (int)Math.Floor(caster.ATK * s.AbilityMult);
                    // Taunt: set IsTaunting
                    caster.IsTaunting = true;
                    // Explode: damage nearby enemies
                    var inArea = GetEnemiesInRange(caster, enemies, 2);
                    foreach (var e in inArea)
                        ApplyDamage(e, dmg, r);
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnTakeDamage) return events;
                    // Reflect 20% of melee damage
                    if (data.Attacker != null && data.Attacker.IsAlive && data.Damage > 0)
                    {
                        int reflect = (int)Math.Floor(data.Damage * 0.2f);
                        if (reflect > 0)
                        {
                            data.Attacker.CurrentHP -= reflect;
                            if (data.Attacker.CurrentHP <= 0) { data.Attacker.CurrentHP = 0; data.Attacker.IsAlive = false; }
                            events.Add(new PassiveEvent
                            {
                                PassiveId = "revenge_tank", Source = caster, Target = data.Attacker,
                                DamageDealt = reflect, Description = "Revenge Tank reflect"
                            });
                        }
                    }
                    // DR gain as HP drops
                    float hpPct = (float)caster.CurrentHP / caster.MaxHP;
                    float drGain = Math.Max(0f, (1f - hpPct) * 0.3f);
                    caster.DamageReduction = Math.Min(0.75f, caster.DamageReduction + drGain);
                    return events;
                }
            };

            // 4. heal_and_harm
            _catalog["heal_and_harm"] = new AbilityTemplate
            {
                Id = "heal_and_harm", Name = "Heal and Harm", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "heal_and_harm", Caster = caster };
                    var s = Scale(caster);
                    int healAmt = (int)Math.Floor(caster.ATK * s.AbilityMult * 1.5f);
                    int dmgAmt = (int)Math.Floor(caster.ATK * s.AbilityMult * 0.8f);

                    // Heal lowest ally
                    var lowestAlly = FindLowestHpAlly(allies, null);
                    if (lowestAlly != null)
                        ApplyHeal(lowestAlly, healAmt, r);

                    // Damage 3 nearest enemies
                    var aliveEnemies = AliveOnly(enemies);
                    aliveEnemies.Sort((a, b) =>
                        caster.Position.ManhattanDistance(a.Position)
                            .CompareTo(caster.Position.ManhattanDistance(b.Position)));
                    int count = Math.Min(3, aliveEnemies.Count);
                    for (int i = 0; i < count; i++)
                        ApplyDamage(aliveEnemies[i], dmgAmt, r);
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnHeal) return events;
                    // Heals deal 50% of heal as damage to nearest enemy
                    int dmg = (int)Math.Floor(data.Amount * 0.5f);
                    if (dmg <= 0) return events;
                    var enemies = caster.Team == Team.Player ? state.EnemyTeam : state.PlayerTeam;
                    var nearest = FindNearestEnemy(caster, enemies);
                    if (nearest != null)
                    {
                        nearest.CurrentHP -= dmg;
                        if (nearest.CurrentHP <= 0) { nearest.CurrentHP = 0; nearest.IsAlive = false; }
                        events.Add(new PassiveEvent
                        {
                            PassiveId = "heal_and_harm", Source = caster, Target = nearest,
                            DamageDealt = dmg, Description = "Heal and Harm passive damage"
                        });
                    }
                    return events;
                }
            };

            // 5. execute_striker
            _catalog["execute_striker"] = new AbilityTemplate
            {
                Id = "execute_striker", Name = "Execute Striker", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "execute_striker", Caster = caster };
                    var s = Scale(caster);
                    int dmg = (int)Math.Floor(caster.ATK * s.AbilityMult * 2f);
                    bool isLowHp = target.IsAlive &&
                        ((float)target.CurrentHP / target.MaxHP) < 0.4f;
                    bool isCrit = isLowHp; // guaranteed crit below 40%
                    if (isCrit) dmg = (int)Math.Floor(dmg * 1.5f);
                    ApplyDamage(target, dmg, r, isCrit);
                    // Mana refund on kill
                    if (!target.IsAlive)
                    {
                        ManaSystem.RefundMana(caster, 30);
                        r.ManaRefunded = true;
                        r.ManaRefundAmount = 30;
                    }
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnHit || data.Target == null) return events;
                    // +50% bonus damage to enemies below 40% HP
                    float hpPct = (float)data.Target.CurrentHP / data.Target.MaxHP;
                    if (hpPct < 0.4f && data.Target.IsAlive)
                    {
                        int bonus = (int)Math.Floor(data.Damage * 0.5f);
                        if (bonus > 0)
                        {
                            data.Target.CurrentHP -= bonus;
                            if (data.Target.CurrentHP <= 0) { data.Target.CurrentHP = 0; data.Target.IsAlive = false; }
                            events.Add(new PassiveEvent
                            {
                                PassiveId = "execute_striker", Source = caster, Target = data.Target,
                                DamageDealt = bonus, Description = "Execute Striker bonus"
                            });
                        }
                    }
                    return events;
                }
            };

            // 6. crowd_puller
            _catalog["crowd_puller"] = new AbilityTemplate
            {
                Id = "crowd_puller", Name = "Crowd Puller", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "crowd_puller", Caster = caster };
                    var s = Scale(caster);
                    int dmg = (int)Math.Floor(caster.ATK * s.AbilityMult);
                    foreach (var e in AliveOnly(enemies))
                    {
                        ApplyDamage(e, dmg, r);
                        // Apply slow (simplified via status flag)
                    }
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnHit || data.Target == null) return events;
                    // Stacking slow on auto-attack
                    events.Add(new PassiveEvent
                    {
                        PassiveId = "crowd_puller", Source = caster, Target = data.Target,
                        AppliedStatusEffect = true, StatusType = StatusEffectType.Slow,
                        Description = "Crowd Puller slow applied"
                    });
                    return events;
                }
            };

            // 7. shield_stacker
            _catalog["shield_stacker"] = new AbilityTemplate
            {
                Id = "shield_stacker", Name = "Shield Stacker", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "shield_stacker", Caster = caster };
                    var s = Scale(caster);
                    int selfShield = (int)Math.Floor(caster.MaxHP * s.ShieldPct * 1.6f);
                    int allyShield = (int)Math.Floor(caster.MaxHP * s.ShieldPct * 0.8f);
                    ApplyShield(caster, selfShield, r);
                    foreach (var a in AliveOnly(allies))
                    {
                        if (a != caster)
                            ApplyShield(a, allyShield, r);
                    }
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    // Periodic shield every 6s handled via onTick
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnTick) return events;
                    // Simplified: grant shield each tick (real impl would use timer)
                    var s = Scale(caster);
                    int shieldAmt = (int)Math.Floor(caster.MaxHP * s.ShieldPct);
                    caster.Shield += shieldAmt;
                    events.Add(new PassiveEvent
                    {
                        PassiveId = "shield_stacker", Source = caster, Target = caster,
                        ShieldGranted = shieldAmt, Description = "Shield Stacker periodic shield"
                    });
                    return events;
                }
            };

            // 8. cc_chainer
            _catalog["cc_chainer"] = new AbilityTemplate
            {
                Id = "cc_chainer", Name = "CC Chainer", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "cc_chainer", Caster = caster };
                    var s = Scale(caster);
                    int dmg = (int)Math.Floor(caster.ATK * s.AbilityMult);
                    ApplyDamage(target, dmg, r);
                    // Apply CC to target
                    if (target.IsAlive)
                    {
                        target.IsStunned = true;
                        r.SpecialEvents.Add("CC applied: stun");
                    }
                    // Splash CC to nearby
                    var nearby = GetEnemiesInRange(target, enemies, 2);
                    foreach (var e in nearby)
                    {
                        if (e != target && e.IsAlive)
                        {
                            e.IsFrozen = true;
                            r.SpecialEvents.Add("Splash CC: freeze on " + e.Name);
                        }
                    }
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    return new List<PassiveEvent>();
                }
            };

            // 9. drain_fighter
            _catalog["drain_fighter"] = new AbilityTemplate
            {
                Id = "drain_fighter", Name = "Drain Fighter", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "drain_fighter", Caster = caster };
                    var s = Scale(caster);
                    int dmg = (int)Math.Floor(caster.ATK * s.AbilityMult * 1.5f);
                    ApplyDamage(target, dmg, r);
                    int heal = (int)Math.Floor(dmg * 0.5f);
                    ApplyHeal(caster, heal, r);
                    // Steal 18% ATK (simplified)
                    int stolen = (int)Math.Floor(target.ATK * 0.18f);
                    caster.BonusATK += stolen;
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnHit) return events;
                    // 25% lifesteal, doubles below 40% HP
                    float hpPct = (float)caster.CurrentHP / caster.MaxHP;
                    float healMult = hpPct < 0.4f ? 0.5f : 0.25f;
                    int heal = (int)Math.Floor(data.Damage * healMult);
                    if (heal > 0 && caster.IsAlive)
                    {
                        caster.CurrentHP = Math.Min(caster.MaxHP, caster.CurrentHP + heal);
                        events.Add(new PassiveEvent
                        {
                            PassiveId = "drain_fighter", Source = caster, Target = caster,
                            HealingDone = heal, Description = "Drain Fighter lifesteal"
                        });
                    }
                    return events;
                }
            };

            // 10. terrain_shaper (zone_controller in spec)
            _catalog["terrain_shaper"] = new AbilityTemplate
            {
                Id = "terrain_shaper", Name = "Terrain Shaper", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "terrain_shaper", Caster = caster };
                    var s = Scale(caster);
                    int dps = (int)Math.Floor(caster.ATK * s.AbilityMult * 0.6f);
                    var inZone = GetEnemiesInRange(target, enemies, 2);
                    foreach (var e in inZone)
                        ApplyDamage(e, dps, r);
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnAbilityCast) return events;
                    // Create buff zone marker (+15% ATK to allies - simplified)
                    events.Add(new PassiveEvent
                    {
                        PassiveId = "terrain_shaper", Source = caster,
                        Description = "Terrain Shaper buff zone created"
                    });
                    return events;
                }
            };

            // 11. lockdown_specialist (cc_lockdown in spec)
            _catalog["lockdown_specialist"] = new AbilityTemplate
            {
                Id = "lockdown_specialist", Name = "Lockdown Specialist", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "lockdown_specialist", Caster = caster };
                    var s = Scale(caster);
                    // Root + Stun + vulnerability to 2 nearest enemies
                    var aliveEnemies = AliveOnly(enemies);
                    aliveEnemies.Sort((a, b) =>
                        caster.Position.ManhattanDistance(a.Position)
                            .CompareTo(caster.Position.ManhattanDistance(b.Position)));
                    int count = Math.Min(2, aliveEnemies.Count);
                    for (int i = 0; i < count; i++)
                    {
                        var e = aliveEnemies[i];
                        e.IsStunned = true;
                        e.Vulnerability += 0.2f;
                        r.SpecialEvents.Add("Lockdown: root+stun on " + e.Name);
                    }
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnHit || data.Target == null) return events;
                    // 35% chance to root+stun 1s
                    if (rng.NextDouble() < 0.35 && data.Target.IsAlive)
                    {
                        data.Target.IsStunned = true;
                        events.Add(new PassiveEvent
                        {
                            PassiveId = "lockdown_specialist", Source = caster, Target = data.Target,
                            AppliedStatusEffect = true, StatusType = StatusEffectType.Stun,
                            Description = "Lockdown Specialist proc"
                        });
                    }
                    return events;
                }
            };

            // 12. unkillable_wall
            _catalog["unkillable_wall"] = new AbilityTemplate
            {
                Id = "unkillable_wall", Name = "Unkillable Wall", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "unkillable_wall", Caster = caster };
                    var s = Scale(caster);
                    int shieldAmt = (int)Math.Floor(caster.MaxHP * s.ShieldPct * 2f);
                    ApplyShield(caster, shieldAmt, r);
                    caster.DamageReduction = Math.Min(0.75f, caster.DamageReduction + 0.20f);
                    r.SpecialEvents.Add("DR +20% for 5s");
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnTick) return events;
                    float hpPct = (float)caster.CurrentHP / caster.MaxHP;
                    if (hpPct >= 0.5f)
                    {
                        // +15% DR when above 50% HP
                        events.Add(new PassiveEvent
                        {
                            PassiveId = "unkillable_wall", Source = caster, Target = caster,
                            Description = "Unkillable Wall DR boost (>50% HP)"
                        });
                    }
                    if (hpPct < 0.3f)
                    {
                        // CC immunity below 30% HP
                        caster.IsStunned = false;
                        caster.IsFrozen = false;
                        events.Add(new PassiveEvent
                        {
                            PassiveId = "unkillable_wall", Source = caster, Target = caster,
                            Description = "Unkillable Wall CC immunity (<30% HP)"
                        });
                    }
                    return events;
                }
            };

            // 13. dodge_tank (dodge_counter in spec)
            _catalog["dodge_tank"] = new AbilityTemplate
            {
                Id = "dodge_tank", Name = "Dodge Tank", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "dodge_tank", Caster = caster };
                    // Boost dodge to 50% for 4s, counter at 120% ATK
                    caster.DodgeChance = 0.5f;
                    var s = Scale(caster);
                    int counterDmg = (int)Math.Floor(caster.ATK * s.AbilityMult * 1.2f);
                    r.SpecialEvents.Add("Dodge buffed to 50%, counter " + counterDmg);
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnTakeDamage) return events;
                    // 25% dodge, counter 60% ATK + 20 mana on dodge
                    if (data.Attacker != null && data.Attacker.IsAlive && rng.NextDouble() < 0.25)
                    {
                        int counterDmg = (int)Math.Floor(caster.ATK * 0.6f);
                        data.Attacker.CurrentHP -= counterDmg;
                        if (data.Attacker.CurrentHP <= 0) { data.Attacker.CurrentHP = 0; data.Attacker.IsAlive = false; }
                        ManaSystem.RefundMana(caster, 20);
                        events.Add(new PassiveEvent
                        {
                            PassiveId = "dodge_tank", Source = caster, Target = data.Attacker,
                            DamageDealt = counterDmg, Description = "Dodge Tank counter-attack"
                        });
                    }
                    return events;
                }
            };

            // 14. chain_killer (kill_chain in spec)
            _catalog["chain_killer"] = new AbilityTemplate
            {
                Id = "chain_killer", Name = "Chain Killer", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "chain_killer", Caster = caster };
                    var s = Scale(caster);
                    int dmg = (int)Math.Floor(caster.ATK * s.AbilityMult * 1.8f);
                    ApplyDamage(target, dmg, r);
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnKill) return events;
                    // +12% ATK speed and +8% ATK on kill (stacking, max 5)
                    int bonus = (int)Math.Floor(caster.ATK * 0.08f);
                    caster.BonusATK += bonus;
                    events.Add(new PassiveEvent
                    {
                        PassiveId = "chain_killer", Source = caster, Target = caster,
                        Description = "Chain Killer kill stack +" + bonus + " ATK"
                    });
                    return events;
                }
            };

            // 15. blink_striker
            _catalog["blink_striker"] = new AbilityTemplate
            {
                Id = "blink_striker", Name = "Blink Striker", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "blink_striker", Caster = caster };
                    var s = Scale(caster);
                    int dmg = (int)Math.Floor(caster.ATK * s.AbilityMult * 1.8f);
                    ApplyDamage(target, dmg, r);
                    // Dodge buff after blink
                    caster.DodgeChance = Math.Max(caster.DodgeChance, 0.25f);
                    r.SpecialEvents.Add("Blink strike + 25% dodge");
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnAbilityCast) return events;
                    // After ability, teleport + 25% dodge 3s
                    caster.DodgeChance = Math.Max(caster.DodgeChance, 0.25f);
                    events.Add(new PassiveEvent
                    {
                        PassiveId = "blink_striker", Source = caster, Target = caster,
                        Description = "Blink Striker dodge buff"
                    });
                    return events;
                }
            };

            // 16. multi_striker (rapid_striker in spec)
            _catalog["multi_striker"] = new AbilityTemplate
            {
                Id = "multi_striker", Name = "Multi Striker", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "multi_striker", Caster = caster };
                    var s = Scale(caster);
                    int dmgPerHit = (int)Math.Floor(caster.ATK * s.AbilityMult * 0.8f);
                    for (int i = 0; i < 5; i++)
                    {
                        if (!target.IsAlive) break;
                        ApplyDamage(target, dmgPerHit, r);
                    }
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnHit || data.Target == null) return events;
                    // 30% chance to strike twice
                    if (rng.NextDouble() < 0.3 && data.Target.IsAlive)
                    {
                        int bonusDmg = data.Damage;
                        data.Target.CurrentHP -= bonusDmg;
                        if (data.Target.CurrentHP <= 0) { data.Target.CurrentHP = 0; data.Target.IsAlive = false; }
                        events.Add(new PassiveEvent
                        {
                            PassiveId = "multi_striker", Source = caster, Target = data.Target,
                            DamageDealt = bonusDmg, Description = "Multi Striker double strike"
                        });
                    }
                    return events;
                }
            };

            // 17. frontload_nuker (burst_mage in spec)
            _catalog["frontload_nuker"] = new AbilityTemplate
            {
                Id = "frontload_nuker", Name = "Frontload Nuker", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "frontload_nuker", Caster = caster };
                    var s = Scale(caster);
                    int dmg = (int)Math.Floor(caster.ATK * s.AbilityMult * 2.2f);
                    // First cast bonus +50% (tracked via Stasis field as cast counter)
                    if (caster.Stasis == 0)
                        dmg = (int)Math.Floor(dmg * 1.5f);
                    caster.Stasis++;
                    ApplyDamage(target, dmg, r);
                    // Stun target
                    if (target.IsAlive) target.IsStunned = true;
                    // Splash to nearby
                    var nearby = GetEnemiesInRange(target, enemies, 2);
                    foreach (var e in nearby)
                    {
                        if (e != target && e.IsAlive)
                            ApplyDamage(e, (int)Math.Floor(dmg * 0.6f), r);
                    }
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    return new List<PassiveEvent>();
                }
            };

            // 18. ramping_attacker (rampage in spec)
            _catalog["ramping_attacker"] = new AbilityTemplate
            {
                Id = "ramping_attacker", Name = "Ramping Attacker", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "ramping_attacker", Caster = caster };
                    // Self buff: +50% ATK speed + 30% damage for 5s
                    int bonus = (int)Math.Floor(caster.ATK * 0.3f);
                    caster.BonusATK += bonus;
                    r.SpecialEvents.Add("Rampage: +50% ATK speed, +" + bonus + " ATK");
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnHit || data.Target == null) return events;
                    // Consecutive hits stack +20% damage (max 5 stacks)
                    // Simplified: flat bonus per hit
                    int bonus = (int)Math.Floor(data.Damage * 0.2f);
                    if (bonus > 0 && data.Target.IsAlive)
                    {
                        data.Target.CurrentHP -= bonus;
                        if (data.Target.CurrentHP <= 0) { data.Target.CurrentHP = 0; data.Target.IsAlive = false; }
                        events.Add(new PassiveEvent
                        {
                            PassiveId = "ramping_attacker", Source = caster, Target = data.Target,
                            DamageDealt = bonus, Description = "Ramping Attacker stack bonus"
                        });
                    }
                    return events;
                }
            };

            // 19. bodyguard
            _catalog["bodyguard"] = new AbilityTemplate
            {
                Id = "bodyguard", Name = "Bodyguard", IsLegendary = false,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "bodyguard", Caster = caster };
                    var s = Scale(caster);
                    // Find lowest HP ally, shield them, taunt
                    var lowestAlly = FindLowestHpAlly(allies, caster);
                    if (lowestAlly != null)
                    {
                        int shieldAmt = (int)Math.Floor(lowestAlly.MaxHP * s.ShieldPct * 1.2f);
                        ApplyShield(lowestAlly, shieldAmt, r);
                    }
                    caster.IsTaunting = true;
                    r.SpecialEvents.Add("Bodyguard: shield ally + taunt");
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnTakeDamage) return events;
                    // Redirect 40% of ally damage to self (simplified: DR-like effect)
                    events.Add(new PassiveEvent
                    {
                        PassiveId = "bodyguard", Source = caster, Target = caster,
                        Description = "Bodyguard damage redirect"
                    });
                    return events;
                }
            };
        }

        // =====================================================================
        // 6 LEGENDARY (T5) TEMPLATES
        // =====================================================================

        private static void RegisterLegendaryTemplates()
        {
            // 20. transformer
            _catalog["transformer"] = new AbilityTemplate
            {
                Id = "transformer", Name = "Transformer", IsLegendary = true,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "transformer", Caster = caster };
                    // Toggle stance: odd Stasis = defensive, even = offensive
                    bool isOffensive = caster.Stasis % 2 == 0;
                    caster.Stasis++;
                    if (isOffensive)
                    {
                        int bonus = (int)Math.Floor(caster.ATK * 0.6f);
                        caster.BonusATK += bonus;
                        r.SpecialEvents.Add("Offensive stance: +" + bonus + " ATK");
                    }
                    else
                    {
                        caster.DamageReduction = Math.Min(0.75f, caster.DamageReduction + 0.25f);
                        r.SpecialEvents.Add("Defensive stance: +25% DR");
                    }
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnTick) return events;
                    // Auto-toggle every 7s (simplified: event signal)
                    events.Add(new PassiveEvent
                    {
                        PassiveId = "transformer", Source = caster, Target = caster,
                        Description = "Transformer stance tick"
                    });
                    return events;
                }
            };

            // 21. unkillable_wall_premium
            _catalog["unkillable_wall_premium"] = new AbilityTemplate
            {
                Id = "unkillable_wall_premium", Name = "Unkillable Wall Premium", IsLegendary = true,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "unkillable_wall_premium", Caster = caster };
                    var s = Scale(caster);
                    int shieldAmt = (int)Math.Floor(caster.MaxHP * s.ShieldPct * 2.2f);
                    ApplyShield(caster, shieldAmt, r);
                    caster.DamageReduction = Math.Min(0.75f, caster.DamageReduction + 0.40f);
                    r.SpecialEvents.Add("Massive shield + 40% DR");
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnTakeDamage) return events;
                    float hpPct = (float)caster.CurrentHP / caster.MaxHP;
                    if (hpPct < 0.5f)
                    {
                        caster.DamageReduction = Math.Min(0.75f, caster.DamageReduction + 0.30f);
                        events.Add(new PassiveEvent
                        {
                            PassiveId = "unkillable_wall_premium", Source = caster, Target = caster,
                            Description = "Submerge: +30% DR (<50% HP)"
                        });
                    }
                    if (hpPct < 0.3f)
                    {
                        caster.IsStunned = false;
                        caster.IsFrozen = false;
                        events.Add(new PassiveEvent
                        {
                            PassiveId = "unkillable_wall_premium", Source = caster, Target = caster,
                            Description = "CC immunity (<30% HP)"
                        });
                    }
                    return events;
                }
            };

            // 22. summoner
            _catalog["summoner"] = new AbilityTemplate
            {
                Id = "summoner", Name = "Summoner", IsLegendary = true,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "summoner", Caster = caster };
                    var s = Scale(caster);
                    int healAmt = (int)Math.Floor(caster.ATK * s.AbilityMult * 2f);
                    // Heal all allies
                    foreach (var a in AliveOnly(allies))
                        ApplyHeal(a, healAmt, r);
                    // Summon 4 minions (placeholder event)
                    r.SpecialEvents.Add("Summoned 4 minions");
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnTick) return events;
                    // Every 10s summon 2 minions + heal 20% (simplified: periodic heal)
                    int healAmt = (int)Math.Floor(caster.MaxHP * 0.02f); // per tick fraction
                    var allies = caster.Team == Team.Player ? state.PlayerTeam : state.EnemyTeam;
                    foreach (var a in allies)
                    {
                        if (a.IsAlive)
                            a.CurrentHP = Math.Min(a.MaxHP, a.CurrentHP + healAmt);
                    }
                    events.Add(new PassiveEvent
                    {
                        PassiveId = "summoner", Source = caster,
                        Description = "Summoner periodic heal"
                    });
                    return events;
                }
            };

            // 23. disruptor (shadow_lord in spec)
            _catalog["disruptor"] = new AbilityTemplate
            {
                Id = "disruptor", Name = "Disruptor", IsLegendary = true,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "disruptor", Caster = caster };
                    var s = Scale(caster);
                    int dmg = (int)Math.Floor(caster.ATK * s.AbilityMult * 1.8f);
                    // Drain mana
                    int drained = Math.Min(target.Mana, 40);
                    target.Mana -= drained;
                    r.SpecialEvents.Add("Drained " + drained + " mana");
                    // Splash damage
                    ApplyDamage(target, dmg, r);
                    var nearby = GetEnemiesInRange(target, enemies, 2);
                    foreach (var e in nearby)
                    {
                        if (e != target && e.IsAlive)
                            ApplyDamage(e, (int)Math.Floor(dmg * 0.5f), r);
                    }
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger == TemplateTrigger.OnHit && data.Target != null)
                    {
                        // Drain 15 mana on hit
                        int drained = Math.Min(data.Target.Mana, 15);
                        data.Target.Mana -= drained;
                        events.Add(new PassiveEvent
                        {
                            PassiveId = "disruptor", Source = caster, Target = data.Target,
                            Description = "Disruptor mana drain: " + drained
                        });
                    }
                    return events;
                }
            };

            // 24. aura_burner (aura_lord in spec)
            _catalog["aura_burner"] = new AbilityTemplate
            {
                Id = "aura_burner", Name = "Aura Burner", IsLegendary = true,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "aura_burner", Caster = caster };
                    var s = Scale(caster);
                    int dmg = (int)Math.Floor(caster.ATK * s.AbilityMult * 2.5f);
                    ApplyDamage(target, dmg, r);
                    // Chain to 2 nearby
                    var nearby = GetEnemiesInRange(target, enemies, 2);
                    int chainCount = 0;
                    foreach (var e in nearby)
                    {
                        if (e != target && e.IsAlive && chainCount < 2)
                        {
                            ApplyDamage(e, (int)Math.Floor(dmg * 0.6f), r);
                            chainCount++;
                        }
                    }
                    // Grant team crit buff
                    foreach (var a in AliveOnly(allies))
                        a.CritChance = Math.Min(1f, a.CritChance + 0.5f);
                    r.SpecialEvents.Add("Team crit +50%");
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    // Passive crit aura: +35% to allies (handled as event)
                    var allies = caster.Team == Team.Player ? state.PlayerTeam : state.EnemyTeam;
                    foreach (var a in allies)
                    {
                        if (a.IsAlive && a != caster)
                            a.CritChance = Math.Min(1f, a.CritChance + 0.35f);
                    }
                    events.Add(new PassiveEvent
                    {
                        PassiveId = "aura_burner", Source = caster,
                        Description = "Aura Burner crit aura active"
                    });
                    return events;
                }
            };

            // 25. zone_creator (berserker_lord in spec)
            _catalog["zone_creator"] = new AbilityTemplate
            {
                Id = "zone_creator", Name = "Zone Creator", IsLegendary = true,
                ExecuteAbility = (caster, target, enemies, allies, grid, rng) =>
                {
                    var r = new AbilityResult { AbilityId = "zone_creator", Caster = caster };
                    // Create 2 zones: slow enemies, buff allies
                    var aliveEnemies = AliveOnly(enemies);
                    foreach (var e in aliveEnemies)
                    {
                        if (caster.Position.ManhattanDistance(e.Position) <= 3)
                            r.SpecialEvents.Add("Zone slow on " + e.Name);
                    }
                    foreach (var a in AliveOnly(allies))
                    {
                        if (caster.Position.ManhattanDistance(a.Position) <= 3)
                        {
                            int bonus = (int)Math.Floor(a.ATK * 0.25f);
                            a.BonusATK += bonus;
                        }
                    }
                    r.SpecialEvents.Add("2 zones created");
                    return r;
                },
                ProcessPassive = (caster, trigger, data, state, rng) =>
                {
                    var events = new List<PassiveEvent>();
                    if (trigger != TemplateTrigger.OnTick) return events;
                    events.Add(new PassiveEvent
                    {
                        PassiveId = "zone_creator", Source = caster,
                        Description = "Zone Creator tick"
                    });
                    return events;
                }
            };
        }
    }
}
