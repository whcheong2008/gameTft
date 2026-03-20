using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Static catalog of all 8 region bosses.
    /// Boss data derived from MISSIONS-DESIGN.md and GROUND-TRUTH.md section 9.
    /// </summary>
    public static class BossCatalog
    {
        private static readonly Dictionary<string, BossData> _bosses
            = new Dictionary<string, BossData>();

        public static int Count => _bosses.Count;

        static BossCatalog()
        {
            RegisterAllBosses();
        }

        public static BossData Get(string bossId)
        {
            BossData data;
            return _bosses.TryGetValue(bossId, out data) ? data : null;
        }

        public static Dictionary<string, BossData> GetAll()
        {
            return new Dictionary<string, BossData>(_bosses);
        }

        public static bool Contains(string bossId)
        {
            return _bosses.ContainsKey(bossId);
        }

        private static void Add(BossData data)
        {
            _bosses[data.Id] = data;
        }

        private static void RegisterAllBosses()
        {
            // ── R1: Veil Warden ────────────────────────────────────────────
            Add(new BossData
            {
                Id = "veil_warden",
                Name = "The Veil Warden",
                GridWidth = 2, GridHeight = 2,
                BaseHP = 5000, BaseATK = 80, BaseDEF = 15, BaseSPD = 8,
                EnrageTimer = 180f,
                EnrageAtkMultiplier = 2.0f, EnrageSpdMultiplier = 2.0f,
                PhaseThresholds = new float[] { 0.50f },
                Phases = new[]
                {
                    new BossPhase
                    {
                        PhaseNumber = 0, HpThreshold = 1.0f,
                        AbilityIds = new[] { "vw_ground_slam" },
                        AttackSpeedMultiplier = 1.0f, DamageMultiplier = 1.0f
                    },
                    new BossPhase
                    {
                        PhaseNumber = 1, HpThreshold = 0.50f,
                        AbilityIds = new[] { "vw_ground_slam", "vw_roar" },
                        AttackSpeedMultiplier = 1.0f, DamageMultiplier = 1.2f,
                        SpecialMechanic = "self_buff"
                    }
                },
                Abilities = new[]
                {
                    new BossAbility
                    {
                        Id = "vw_ground_slam", Name = "Ground Slam",
                        DamageMultiplier = 1.5f, Cooldown = 10f, TelegraphTime = 2f,
                        AoeRadius = 2, TargetType = "highest_hp",
                        Description = "2-cell AoE centered on highest-HP player unit"
                    },
                    new BossAbility
                    {
                        Id = "vw_roar", Name = "Roar",
                        DamageMultiplier = 0f, Cooldown = 999f, TelegraphTime = 0f,
                        AoeRadius = 0, TargetType = "self",
                        Description = "Self-buff: +20% ATK for remainder"
                    }
                }
            });

            // ── R2: The Archon ─────────────────────────────────────────────
            Add(new BossData
            {
                Id = "archon",
                Name = "The Archon",
                GridWidth = 2, GridHeight = 2,
                BaseHP = 8000, BaseATK = 100, BaseDEF = 20, BaseSPD = 10,
                EnrageTimer = 180f,
                EnrageAtkMultiplier = 2.0f, EnrageSpdMultiplier = 2.0f,
                PhaseThresholds = new float[0], // Continuous stance rotation
                Phases = new[]
                {
                    new BossPhase
                    {
                        PhaseNumber = 0, HpThreshold = 1.0f,
                        AbilityIds = new[] { "ar_stance_shift", "ar_guardian", "ar_predator", "ar_sorcerer" },
                        AttackSpeedMultiplier = 1.0f, DamageMultiplier = 1.0f,
                        SpecialMechanic = "stance_rotation"
                    }
                },
                Abilities = new[]
                {
                    new BossAbility
                    {
                        Id = "ar_stance_shift", Name = "Stance Shift",
                        Cooldown = 15f, TelegraphTime = 1f, TargetType = "self",
                        Description = "Shift stance every 15-20s"
                    },
                    new BossAbility
                    {
                        Id = "ar_guardian", Name = "Stone Wall",
                        DamageMultiplier = 0f, Cooldown = 15f, TelegraphTime = 0f,
                        TargetType = "self",
                        Description = "Guardian stance: +40% DR, +15% max HP shield"
                    },
                    new BossAbility
                    {
                        Id = "ar_predator", Name = "Shadow Leap",
                        DamageMultiplier = 1.5f, Cooldown = 8f, TelegraphTime = 1f,
                        TargetType = "lowest_hp",
                        Description = "Predator stance: dash to lowest-HP unit, +50% ATK"
                    },
                    new BossAbility
                    {
                        Id = "ar_sorcerer", Name = "Arcane Barrage",
                        DamageMultiplier = 1.2f, Cooldown = 8f, TelegraphTime = 2f,
                        AoeRadius = 1, TargetType = "cluster",
                        Description = "Sorcerer stance: AoE magic damage 3x3 centered on player cluster"
                    }
                }
            });

            // ── R3: Twin Heralds ───────────────────────────────────────────
            Add(new BossData
            {
                Id = "twin_heralds",
                Name = "The Twin Heralds",
                GridWidth = 1, GridHeight = 2, // Each herald is 1x2; two of them
                BaseHP = 4000, BaseATK = 90, BaseDEF = 12, BaseSPD = 12,
                EnrageTimer = 180f,
                EnrageAtkMultiplier = 2.0f, EnrageSpdMultiplier = 2.0f,
                PhaseThresholds = new float[0], // Enrage on partner death
                Phases = new[]
                {
                    new BossPhase
                    {
                        PhaseNumber = 0, HpThreshold = 1.0f,
                        AbilityIds = new[] { "th_charge", "th_cleave", "th_chain_lightning", "th_barrier" },
                        AttackSpeedMultiplier = 1.0f, DamageMultiplier = 1.0f,
                        SpecialMechanic = "proximity_buff"
                    },
                    new BossPhase
                    {
                        PhaseNumber = 1, HpThreshold = 0.0f,
                        AbilityIds = new[] { "th_charge", "th_cleave", "th_chain_lightning", "th_barrier" },
                        AttackSpeedMultiplier = 2.0f, DamageMultiplier = 2.0f,
                        SpecialMechanic = "vengeance_enrage"
                    }
                },
                Abilities = new[]
                {
                    new BossAbility
                    {
                        Id = "th_charge", Name = "Charge",
                        DamageMultiplier = 1.2f, Cooldown = 12f, TelegraphTime = 1f,
                        TargetType = "nearest",
                        Description = "Dash to player unit + 1.5s stun"
                    },
                    new BossAbility
                    {
                        Id = "th_cleave", Name = "Cleave",
                        DamageMultiplier = 1.0f, Cooldown = 8f, TelegraphTime = 1.5f,
                        AoeRadius = 2, TargetType = "cone",
                        Description = "Frontal cone damage hitting all units in 2-cell arc"
                    },
                    new BossAbility
                    {
                        Id = "th_chain_lightning", Name = "Chain Lightning",
                        DamageMultiplier = 1.0f, Cooldown = 10f, TelegraphTime = 0f,
                        TargetType = "nearest",
                        Description = "Bounces between player units within 2 cells, 3 bounces, -20% per bounce"
                    },
                    new BossAbility
                    {
                        Id = "th_barrier", Name = "Barrier",
                        DamageMultiplier = 0f, Cooldown = 15f, TelegraphTime = 0f,
                        TargetType = "ally",
                        Description = "Shields the other Herald for 10% of its max HP"
                    }
                }
            });

            // ── R4: Shattered Colossus ─────────────────────────────────────
            Add(new BossData
            {
                Id = "shattered_colossus",
                Name = "The Shattered Colossus",
                GridWidth = 2, GridHeight = 2,
                BaseHP = 15000, BaseATK = 120, BaseDEF = 25, BaseSPD = 6,
                EnrageTimer = 180f,
                EnrageAtkMultiplier = 2.5f, EnrageSpdMultiplier = 2.0f,
                PhaseThresholds = new float[] { 0.65f, 0.30f },
                Phases = new[]
                {
                    new BossPhase
                    {
                        PhaseNumber = 0, HpThreshold = 1.0f,
                        AbilityIds = new[] { "sc_slam" },
                        AttackSpeedMultiplier = 1.0f, DamageMultiplier = 1.0f,
                        SpecialMechanic = "vip_target"
                    },
                    new BossPhase
                    {
                        PhaseNumber = 1, HpThreshold = 0.65f,
                        AbilityIds = new[] { "sc_slam", "sc_cataclysm" },
                        AttackSpeedMultiplier = 1.2f, DamageMultiplier = 1.2f,
                        SpecialMechanic = "countdown_reinforcements"
                    },
                    new BossPhase
                    {
                        PhaseNumber = 2, HpThreshold = 0.30f,
                        AbilityIds = new[] { "sc_dual_smash", "sc_rift_pulse" },
                        AttackSpeedMultiplier = 1.5f, DamageMultiplier = 1.5f,
                        SpecialMechanic = "split_formation"
                    }
                },
                Abilities = new[]
                {
                    new BossAbility
                    {
                        Id = "sc_slam", Name = "Slam",
                        DamageMultiplier = 1.5f, Cooldown = 8f, TelegraphTime = 2f,
                        AoeRadius = 2, TargetType = "highest_hp",
                        Description = "Basic 2-cell AoE"
                    },
                    new BossAbility
                    {
                        Id = "sc_cataclysm", Name = "Cataclysm Charge",
                        DamageMultiplier = 3.0f, Cooldown = 30f, TelegraphTime = 5f,
                        AoeRadius = 3, TargetType = "all_players",
                        Description = "30s countdown, 80% current HP AoE if not interrupted"
                    },
                    new BossAbility
                    {
                        Id = "sc_dual_smash", Name = "Dual Smash",
                        DamageMultiplier = 2.0f, Cooldown = 6f, TelegraphTime = 1.5f,
                        AoeRadius = 2, TargetType = "split_both",
                        Description = "Attacks both sides simultaneously"
                    },
                    new BossAbility
                    {
                        Id = "sc_rift_pulse", Name = "Rift Pulse",
                        DamageMultiplier = 0.5f, Cooldown = 5f, TelegraphTime = 0f,
                        AoeRadius = 0, TargetType = "gap_column",
                        Description = "Gap column pulses with damage every 5s"
                    }
                }
            });

            // ── R5: Elemental Chimera ──────────────────────────────────────
            Add(new BossData
            {
                Id = "elemental_chimera",
                Name = "The Elemental Chimera",
                GridWidth = 2, GridHeight = 2,
                BaseHP = 12000, BaseATK = 110, BaseDEF = 18, BaseSPD = 10,
                EnrageTimer = 180f,
                EnrageAtkMultiplier = 2.0f, EnrageSpdMultiplier = 2.0f,
                PhaseThresholds = new float[0], // Continuous element rotation
                Phases = new[]
                {
                    new BossPhase
                    {
                        PhaseNumber = 0, HpThreshold = 1.0f,
                        AbilityIds = new[] { "ec_element_shift", "ec_element_surge" },
                        AttackSpeedMultiplier = 1.0f, DamageMultiplier = 1.0f,
                        SpecialMechanic = "element_shifting"
                    }
                },
                Abilities = new[]
                {
                    new BossAbility
                    {
                        Id = "ec_element_shift", Name = "Elemental Shift",
                        DamageMultiplier = 0f, Cooldown = 20f, TelegraphTime = 3f,
                        TargetType = "self",
                        Description = "Changes element every 20s. Absorbs matching element damage."
                    },
                    new BossAbility
                    {
                        Id = "ec_element_surge", Name = "Element Surge",
                        DamageMultiplier = 1.5f, Cooldown = 8f, TelegraphTime = 1.5f,
                        AoeRadius = 2, TargetType = "melee_range",
                        Description = "AoE damage of current element, 2-cell radius"
                    }
                }
            });

            // ── R6: Prismatic Sentinel ─────────────────────────────────────
            Add(new BossData
            {
                Id = "prismatic_sentinel",
                Name = "The Prismatic Sentinel",
                GridWidth = 2, GridHeight = 2,
                BaseHP = 14000, BaseATK = 105, BaseDEF = 22, BaseSPD = 9,
                EnrageTimer = 180f,
                EnrageAtkMultiplier = 2.0f, EnrageSpdMultiplier = 2.0f,
                PhaseThresholds = new float[0],
                Phases = new[]
                {
                    new BossPhase
                    {
                        PhaseNumber = 0, HpThreshold = 1.0f,
                        AbilityIds = new[] { "ps_prismatic_shield", "ps_elemental_storm", "ps_resonance_burst" },
                        AttackSpeedMultiplier = 1.0f, DamageMultiplier = 1.0f,
                        SpecialMechanic = "rotating_immunity"
                    }
                },
                Abilities = new[]
                {
                    new BossAbility
                    {
                        Id = "ps_prismatic_shield", Name = "Prismatic Shield",
                        DamageMultiplier = 0f, Cooldown = 15f, TelegraphTime = 1f,
                        TargetType = "self",
                        Description = "Immune to one element, vulnerable (+50%) to another"
                    },
                    new BossAbility
                    {
                        Id = "ps_elemental_storm", Name = "Elemental Storm",
                        DamageMultiplier = 1.5f, Cooldown = 10f, TelegraphTime = 2f,
                        AoeRadius = 3, TargetType = "all_players",
                        Description = "AoE damage of immune element"
                    },
                    new BossAbility
                    {
                        Id = "ps_resonance_burst", Name = "Resonance Burst",
                        DamageMultiplier = 1.0f, Cooldown = 20f, TelegraphTime = 1.5f,
                        AoeRadius = 99, TargetType = "matching_element",
                        Description = "Bonus damage to units matching boss immunity element"
                    }
                }
            });

            // ── R7: Arbiter of Trials ──────────────────────────────────────
            Add(new BossData
            {
                Id = "arbiter_of_trials",
                Name = "The Arbiter of Trials",
                GridWidth = 2, GridHeight = 2,
                BaseHP = 18000, BaseATK = 130, BaseDEF = 25, BaseSPD = 10,
                EnrageTimer = 180f,
                EnrageAtkMultiplier = 2.5f, EnrageSpdMultiplier = 2.0f,
                PhaseThresholds = new float[] { 0.65f, 0.30f },
                Phases = new[]
                {
                    new BossPhase
                    {
                        PhaseNumber = 0, HpThreshold = 1.0f,
                        AbilityIds = new[] { "at_judges_gavel" },
                        AttackSpeedMultiplier = 1.0f, DamageMultiplier = 1.0f,
                        SpecialMechanic = "synergy_suppression"
                    },
                    new BossPhase
                    {
                        PhaseNumber = 1, HpThreshold = 0.65f,
                        AbilityIds = new[] { "at_judges_gavel", "at_rift_judgment" },
                        AttackSpeedMultiplier = 1.2f, DamageMultiplier = 1.2f,
                        SpecialMechanic = "split_vip"
                    },
                    new BossPhase
                    {
                        PhaseNumber = 2, HpThreshold = 0.30f,
                        AbilityIds = new[] { "at_final_verdict" },
                        AttackSpeedMultiplier = 1.5f, DamageMultiplier = 1.5f,
                        SpecialMechanic = "countdown"
                    }
                },
                Abilities = new[]
                {
                    new BossAbility
                    {
                        Id = "at_judges_gavel", Name = "Judge's Gavel",
                        DamageMultiplier = 2.5f, Cooldown = 8f, TelegraphTime = 1.5f,
                        TargetType = "highest_atk",
                        Description = "Single-target massive damage on highest-ATK player unit"
                    },
                    new BossAbility
                    {
                        Id = "at_rift_judgment", Name = "Rift Judgment",
                        DamageMultiplier = 0f, Cooldown = 999f, TelegraphTime = 0f,
                        TargetType = "self",
                        Description = "Grid splits into two halves, summon Adjudicator"
                    },
                    new BossAbility
                    {
                        Id = "at_final_verdict", Name = "Final Verdict",
                        DamageMultiplier = 5.0f, Cooldown = 25f, TelegraphTime = 5f,
                        AoeRadius = 99, TargetType = "all_players",
                        Description = "25s countdown to full wipe"
                    }
                }
            });

            // ── R8: Void Sovereign ─────────────────────────────────────────
            Add(new BossData
            {
                Id = "void_sovereign",
                Name = "The Void Sovereign",
                GridWidth = 2, GridHeight = 2,
                BaseHP = 25000, BaseATK = 150, BaseDEF = 30, BaseSPD = 12,
                EnrageTimer = 150f,
                EnrageAtkMultiplier = 3.0f, EnrageSpdMultiplier = 2.0f,
                PhaseThresholds = new float[] { 0.70f, 0.30f },
                Phases = new[]
                {
                    new BossPhase
                    {
                        PhaseNumber = 0, HpThreshold = 1.0f,
                        AbilityIds = new[] { "vs_void_tendrils", "vs_void_barrier" },
                        AttackSpeedMultiplier = 1.0f, DamageMultiplier = 1.0f,
                        SpecialMechanic = "elemental_mimicry"
                    },
                    new BossPhase
                    {
                        PhaseNumber = 1, HpThreshold = 0.70f,
                        AbilityIds = new[] { "vs_void_beam", "vs_dimensional_rift" },
                        AttackSpeedMultiplier = 1.3f, DamageMultiplier = 1.3f,
                        SpecialMechanic = "summon_copies"
                    },
                    new BossPhase
                    {
                        PhaseNumber = 2, HpThreshold = 0.30f,
                        AbilityIds = new[] { "vs_annihilation", "vs_void_collapse" },
                        AttackSpeedMultiplier = 1.5f, DamageMultiplier = 2.0f,
                        SpecialMechanic = "dps_race"
                    }
                },
                Abilities = new[]
                {
                    new BossAbility
                    {
                        Id = "vs_void_tendrils", Name = "Void Tendrils",
                        DamageMultiplier = 0.5f, Cooldown = 8f, TelegraphTime = 1f,
                        TargetType = "random_3",
                        Description = "3 random player units rooted for 1.5s, take 50% ATK damage"
                    },
                    new BossAbility
                    {
                        Id = "vs_void_barrier", Name = "Void Barrier",
                        DamageMultiplier = 0f, Cooldown = 20f, TelegraphTime = 0f,
                        TargetType = "self",
                        Description = "Shield equal to 15% max HP, regenerates every 20s"
                    },
                    new BossAbility
                    {
                        Id = "vs_void_beam", Name = "Void Beam",
                        DamageMultiplier = 1.0f, Cooldown = 10f, TelegraphTime = 2f,
                        AoeRadius = 99, TargetType = "densest_row",
                        Description = "Line attack across entire row with most player units"
                    },
                    new BossAbility
                    {
                        Id = "vs_dimensional_rift", Name = "Dimensional Rift",
                        DamageMultiplier = 0f, Cooldown = 20f, TelegraphTime = 0f,
                        TargetType = "swap_random",
                        Description = "Swaps 2 random player units with 2 Void Champions"
                    },
                    new BossAbility
                    {
                        Id = "vs_annihilation", Name = "Annihilation",
                        DamageMultiplier = 0.7f, Cooldown = 12f, TelegraphTime = 1f,
                        AoeRadius = 99, TargetType = "all_players",
                        Description = "ALL player units take 70% ATK damage. Unavoidable."
                    },
                    new BossAbility
                    {
                        Id = "vs_void_collapse", Name = "Void Collapse",
                        DamageMultiplier = 0f, Cooldown = 20f, TelegraphTime = 0f,
                        TargetType = "grid_shrink",
                        Description = "Removes 2 random grid cells from the battlefield"
                    }
                }
            });
        }
    }
}
