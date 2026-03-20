using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Static catalog of all 132 unit passives (66 base + 66 evolved).
    /// Each unit has a passive that modifies combat behavior.
    /// Passives are keyed by unit template ID.
    /// </summary>
    public static class PassiveCatalog
    {
        private static readonly Dictionary<string, PassiveData> _passives
            = new Dictionary<string, PassiveData>();

        public static int Count => _passives.Count;

        static PassiveCatalog()
        {
            RegisterFireBase();
            RegisterFireEvolved();
            RegisterWaterBase();
            RegisterWaterEvolved();
            RegisterEarthBase();
            RegisterEarthEvolved();
            RegisterWindBase();
            RegisterWindEvolved();
            RegisterLightningBase();
            RegisterLightningEvolved();
            RegisterForceBase();
            RegisterForceEvolved();
        }

        public static PassiveData Get(string unitId)
        {
            PassiveData data;
            return _passives.TryGetValue(unitId, out data) ? data : null;
        }

        public static Dictionary<string, PassiveData> GetAll()
        {
            return new Dictionary<string, PassiveData>(_passives);
        }

        public static bool Contains(string unitId)
        {
            return _passives.ContainsKey(unitId);
        }

        private static void Add(PassiveData data)
        {
            _passives[data.Id] = data;
        }

        // =====================================================================
        // FIRE BASE (11 units)
        // =====================================================================
        private static void RegisterFireBase()
        {
            Add(new PassiveData
            {
                Id = "flame_warrior", Name = "Heated Blows",
                Description = "Every 3rd attack deals 25% bonus damage",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "interval", 3 }, { "bonusDamagePct", 0.25f } }
            });
            Add(new PassiveData
            {
                Id = "ember_scout", Name = "Mark Stacking",
                Description = "Auto-attacks apply stacking marks (max 5), +30% damage per mark on ability",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "maxStacks", 5 }, { "bonusPerStack", 0.30f } }
            });
            Add(new PassiveData
            {
                Id = "cinder_archer", Name = "Burn Spread",
                Description = "Attacks spread burn to enemies within 1 cell of target",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "spreadRange", 1 }, { "burnDps", 10 }, { "burnDuration", 3 } }
            });
            Add(new PassiveData
            {
                Id = "fire_acolyte", Name = "Sacred Flame",
                Description = "Heals deal 50% of heal amount as damage to nearest enemy",
                Trigger = PassiveTrigger.OnHeal,
                Params = new Dictionary<string, float>
                    { { "damagePct", 0.50f } }
            });
            Add(new PassiveData
            {
                Id = "magma_knight", Name = "Molten Armor",
                Description = "Reflect 20% of melee damage taken back to attacker",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "reflectPct", 0.20f } }
            });
            Add(new PassiveData
            {
                Id = "blaze_lancer", Name = "Flame Trail",
                Description = "Attacks apply burn to target (10 DPS, 3s)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "burnDps", 10 }, { "burnDuration", 3 } }
            });
            Add(new PassiveData
            {
                Id = "pyromancer", Name = "Detonation Marks",
                Description = "Auto-attacks apply stacking marks (max 5), ability consumes for +30% per mark",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "maxStacks", 5 }, { "bonusPerStack", 0.30f } }
            });
            Add(new PassiveData
            {
                Id = "inferno_fox", Name = "Kill Reset",
                Description = "On kill, gain +12% ATK speed and +8% ATK (max 5 stacks, 6s)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "atkSpdBonus", 0.12f }, { "atkBonus", 0.08f }, { "maxStacks", 5 }, { "duration", 6 } }
            });
            Add(new PassiveData
            {
                Id = "fire_dragon", Name = "Dragon Breath",
                Description = "Attacks apply burn, +40% damage to already burning targets",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "burnDps", 15 }, { "burnDuration", 3 }, { "burnBonusDmg", 0.40f } }
            });
            Add(new PassiveData
            {
                Id = "ashen_watcher", Name = "Purifying Fire",
                Description = "Heals deal 50% of heal amount as damage to nearest enemy",
                Trigger = PassiveTrigger.OnHeal,
                Params = new Dictionary<string, float>
                    { { "damagePct", 0.50f } }
            });
            Add(new PassiveData
            {
                Id = "phoenix", Name = "Rebirth Flame",
                Description = "Every 7s, toggle between Offensive (+40% ATK/speed) and Defensive (+20% DR, reflect)",
                Trigger = PassiveTrigger.Periodic,
                Params = new Dictionary<string, float>
                    { { "interval", 7 }, { "offAtkBoost", 0.40f }, { "offSpdBoost", 0.40f }, { "defDrBoost", 0.20f }, { "defReflect", 0.15f } }
            });
        }

        // =====================================================================
        // FIRE EVOLVED (11 units)
        // =====================================================================
        private static void RegisterFireEvolved()
        {
            Add(new PassiveData
            {
                Id = "fire_berserker", Name = "Heated Blows+",
                Description = "Every 3rd attack deals 35% bonus damage",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "interval", 3 }, { "bonusDamagePct", 0.35f } }
            });
            Add(new PassiveData
            {
                Id = "flame_rogue", Name = "Phantom Marks",
                Description = "Auto-attacks apply stacking marks (max 5), +35% damage per mark",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "maxStacks", 5 }, { "bonusPerStack", 0.35f } }
            });
            Add(new PassiveData
            {
                Id = "cinder_marksman", Name = "Burn Spread+",
                Description = "Attacks spread burn to enemies within 1.5 cells of target",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "spreadRange", 1.5f }, { "burnDps", 15 }, { "burnDuration", 3 } }
            });
            Add(new PassiveData
            {
                Id = "ember_saint", Name = "Holy Inferno",
                Description = "Heals deal 60% of heal amount as damage and apply burn",
                Trigger = PassiveTrigger.OnHeal,
                Params = new Dictionary<string, float>
                    { { "damagePct", 0.60f }, { "applyBurn", 1 }, { "burnDps", 10 }, { "burnDuration", 3 } }
            });
            Add(new PassiveData
            {
                Id = "volcano_titan", Name = "Volcanic Death",
                Description = "On death: 200 damage to all enemies within distance 2",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "deathAoeDamage", 200 }, { "deathAoeRange", 2 } }
            });
            Add(new PassiveData
            {
                Id = "inferno_lancer", Name = "Flame Trail+",
                Description = "Attacks apply burn to target (15 DPS, 3s)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "burnDps", 15 }, { "burnDuration", 3 } }
            });
            Add(new PassiveData
            {
                Id = "arcane_inferno", Name = "Detonation Marks+",
                Description = "Auto-attacks apply stacking marks (max 5), +35% per mark with vulnerability",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "maxStacks", 5 }, { "bonusPerStack", 0.35f }, { "vulnPct", 0.10f } }
            });
            Add(new PassiveData
            {
                Id = "ninetail_blaze", Name = "Kill Reset+",
                Description = "On kill, gain +15% ATK speed and +10% ATK (max 5 stacks, 6s)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "atkSpdBonus", 0.15f }, { "atkBonus", 0.10f }, { "maxStacks", 5 }, { "duration", 6 } }
            });
            Add(new PassiveData
            {
                Id = "elder_wyrm", Name = "Dragon Breath+",
                Description = "Attacks apply burn, +50% damage to already burning targets",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "burnDps", 20 }, { "burnDuration", 3 }, { "burnBonusDmg", 0.50f } }
            });
            Add(new PassiveData
            {
                Id = "phoenix_priest", Name = "Purifying Fire+",
                Description = "Heals deal 60% as damage and apply burn",
                Trigger = PassiveTrigger.OnHeal,
                Params = new Dictionary<string, float>
                    { { "damagePct", 0.60f }, { "applyBurn", 1 }, { "burnDps", 10 }, { "burnDuration", 3 } }
            });
            Add(new PassiveData
            {
                Id = "eternal_phoenix", Name = "Rebirth Enhanced",
                Description = "Every 7s, toggle between Offensive (+60% ATK/speed) and Defensive (+25% DR, reflect)",
                Trigger = PassiveTrigger.Periodic,
                Params = new Dictionary<string, float>
                    { { "interval", 7 }, { "offAtkBoost", 0.60f }, { "offSpdBoost", 0.60f }, { "defDrBoost", 0.25f }, { "defReflect", 0.20f } }
            });
        }

        // =====================================================================
        // WATER BASE (11 units)
        // =====================================================================
        private static void RegisterWaterBase()
        {
            Add(new PassiveData
            {
                Id = "tide_hunter", Name = "Slow Stacking",
                Description = "Auto-attacks apply slow (stacking duration, max 5 stacks)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "slowPct", 0.15f }, { "slowDuration", 2 }, { "maxStacks", 5 } }
            });
            Add(new PassiveData
            {
                Id = "frost_archer", Name = "CC Chaining",
                Description = "After applying CC, next attack applies different CC type",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "ccChainChance", 1.0f }, { "ccDuration", 1.0f } }
            });
            Add(new PassiveData
            {
                Id = "reef_stalker", Name = "Lifesteal",
                Description = "25% of damage dealt heals self",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "lifestealPct", 0.25f } }
            });
            Add(new PassiveData
            {
                Id = "coral_priest", Name = "Healing Surge",
                Description = "Heals deal 50% of heal amount as damage to nearest enemy",
                Trigger = PassiveTrigger.OnHeal,
                Params = new Dictionary<string, float>
                    { { "damagePct", 0.50f } }
            });
            Add(new PassiveData
            {
                Id = "hydro_mage", Name = "Maelstrom Pull",
                Description = "Auto-attacks apply slow (stacking duration, max 5 stacks)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "slowPct", 0.15f }, { "slowDuration", 2 }, { "maxStacks", 5 } }
            });
            Add(new PassiveData
            {
                Id = "shell_knight", Name = "Shield Aura",
                Description = "Every 6s, grant self and 1 nearby ally shield (25% max HP)",
                Trigger = PassiveTrigger.Periodic,
                Params = new Dictionary<string, float>
                    { { "interval", 6 }, { "shieldPct", 0.25f }, { "allyCount", 1 } }
            });
            Add(new PassiveData
            {
                Id = "tidal_shaman", Name = "Tidal Healing",
                Description = "Heals deal 50% of heal amount as damage to nearest enemy",
                Trigger = PassiveTrigger.OnHeal,
                Params = new Dictionary<string, float>
                    { { "damagePct", 0.50f } }
            });
            Add(new PassiveData
            {
                Id = "riptide_blade", Name = "ATK Steal",
                Description = "Steal 18% of target ATK for 4s on hit",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "stealPct", 0.18f }, { "stealDuration", 4 } }
            });
            Add(new PassiveData
            {
                Id = "kraken", Name = "Abyssal Pull",
                Description = "Auto-attacks apply slow (stacking, max 5)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "slowPct", 0.20f }, { "slowDuration", 2 }, { "maxStacks", 5 } }
            });
            Add(new PassiveData
            {
                Id = "abyssal_guardian", Name = "Abyssal Ward",
                Description = "Every 6s, grant self and 1 nearby ally shield (25% max HP)",
                Trigger = PassiveTrigger.Periodic,
                Params = new Dictionary<string, float>
                    { { "interval", 6 }, { "shieldPct", 0.25f }, { "allyCount", 1 } }
            });
            Add(new PassiveData
            {
                Id = "leviathan", Name = "Tidal Guardian",
                Description = "Below 50% HP: +30% DR, submerge. Below 30%: CC immunity",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "drBoostThreshold", 0.50f }, { "drBoost", 0.30f }, { "ccImmuneThreshold", 0.30f }, { "submergeDr", 0.70f }, { "submergeDuration", 2 } }
            });
        }

        // =====================================================================
        // WATER EVOLVED (11 units)
        // =====================================================================
        private static void RegisterWaterEvolved()
        {
            Add(new PassiveData
            {
                Id = "tsunami_blade", Name = "Slow Stacking+",
                Description = "Auto-attacks reduce target moveSpd by 5% (stacking)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "slowPct", 0.20f }, { "slowDuration", 2.5f }, { "maxStacks", 5 } }
            });
            Add(new PassiveData
            {
                Id = "ice_sniper", Name = "Freeze Proc",
                Description = "Every 3rd attack adds +0.5s to target attack cooldown",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "interval", 3 }, { "cooldownAdd", 0.5f } }
            });
            Add(new PassiveData
            {
                Id = "tidal_phantom", Name = "Lifesteal+",
                Description = "30% of damage dealt heals self",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "lifestealPct", 0.30f } }
            });
            Add(new PassiveData
            {
                Id = "ocean_sage", Name = "Heal + Shield",
                Description = "Heals also grant 50 shield",
                Trigger = PassiveTrigger.OnHeal,
                Params = new Dictionary<string, float>
                    { { "bonusShield", 50 } }
            });
            Add(new PassiveData
            {
                Id = "abyssal_mage", Name = "Tank Buster",
                Description = "+25% damage vs Tank-type units",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "tankBonusDmg", 0.25f } }
            });
            Add(new PassiveData
            {
                Id = "armored_sentinel", Name = "Shield Aura+",
                Description = "Every 5s, grant self and 2 nearby allies shield (30% max HP)",
                Trigger = PassiveTrigger.Periodic,
                Params = new Dictionary<string, float>
                    { { "interval", 5 }, { "shieldPct", 0.30f }, { "allyCount", 2 } }
            });
            Add(new PassiveData
            {
                Id = "stormtide_oracle", Name = "Tidal Healing+",
                Description = "Heals deal 60% of heal amount as damage",
                Trigger = PassiveTrigger.OnHeal,
                Params = new Dictionary<string, float>
                    { { "damagePct", 0.60f } }
            });
            Add(new PassiveData
            {
                Id = "tsunami_warlord", Name = "ATK Steal+",
                Description = "Steal 25% of target ATK for 5s on hit",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "stealPct", 0.25f }, { "stealDuration", 5 } }
            });
            Add(new PassiveData
            {
                Id = "abyssal_terror", Name = "Abyssal Pull+",
                Description = "Auto-attacks apply heavy slow (stacking, max 5)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "slowPct", 0.25f }, { "slowDuration", 2.5f }, { "maxStacks", 5 } }
            });
            Add(new PassiveData
            {
                Id = "hadal_colossus", Name = "Abyssal Ward+",
                Description = "Every 5s, grant self and 2 nearby allies shield (30% max HP)",
                Trigger = PassiveTrigger.Periodic,
                Params = new Dictionary<string, float>
                    { { "interval", 5 }, { "shieldPct", 0.30f }, { "allyCount", 2 } }
            });
            Add(new PassiveData
            {
                Id = "primordial_leviathan", Name = "Tidal Guardian+",
                Description = "Below 50% HP: +40% DR, submerge. Below 30%: CC immunity",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "drBoostThreshold", 0.50f }, { "drBoost", 0.40f }, { "ccImmuneThreshold", 0.30f }, { "submergeDr", 0.70f }, { "submergeDuration", 2 } }
            });
        }

        // =====================================================================
        // EARTH BASE (11 units)
        // =====================================================================
        private static void RegisterEarthBase()
        {
            Add(new PassiveData
            {
                Id = "stone_guard", Name = "Stone Shield",
                Description = "Every 6s, grant self and 1 nearby ally shield (25% max HP)",
                Trigger = PassiveTrigger.Periodic,
                Params = new Dictionary<string, float>
                    { { "interval", 6 }, { "shieldPct", 0.25f }, { "allyCount", 1 } }
            });
            Add(new PassiveData
            {
                Id = "bramble_knight", Name = "Thorn Reflect",
                Description = "Reflect 20% of melee damage taken back to attacker",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "reflectPct", 0.20f } }
            });
            Add(new PassiveData
            {
                Id = "seedling_archer", Name = "Root Shot",
                Description = "35% chance to apply Root+Stun for 1s on attack",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "procChance", 0.35f }, { "rootDuration", 1.0f }, { "stunDuration", 1.0f } }
            });
            Add(new PassiveData
            {
                Id = "earth_shaman", Name = "Earth Shield",
                Description = "Every 6s, grant self and 1 nearby ally shield (25% max HP)",
                Trigger = PassiveTrigger.Periodic,
                Params = new Dictionary<string, float>
                    { { "interval", 6 }, { "shieldPct", 0.25f }, { "allyCount", 1 } }
            });
            Add(new PassiveData
            {
                Id = "crystal_mage", Name = "Crystal Lock",
                Description = "35% chance to apply Root+Stun for 1s on attack",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "procChance", 0.35f }, { "rootDuration", 1.0f }, { "stunDuration", 1.0f } }
            });
            Add(new PassiveData
            {
                Id = "mud_stalker", Name = "Muddy Strike",
                Description = "35% chance to apply Root+Stun for 1s on attack",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "procChance", 0.35f }, { "rootDuration", 1.0f }, { "stunDuration", 1.0f } }
            });
            Add(new PassiveData
            {
                Id = "golem", Name = "Unyielding",
                Description = "At 50%+ HP: +15% DR. Below 30% HP: CC immunity",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "drBoostThreshold", 0.50f }, { "drBoost", 0.15f }, { "ccImmuneThreshold", 0.30f } }
            });
            Add(new PassiveData
            {
                Id = "terra_sage", Name = "Earthen Zone",
                Description = "After ability cast, create 2-cell buff zone (+15% ATK to allies, 5s)",
                Trigger = PassiveTrigger.Aura,
                Params = new Dictionary<string, float>
                    { { "auraRange", 2 }, { "atkBuffPct", 0.15f } }
            });
            Add(new PassiveData
            {
                Id = "ancient_treant", Name = "Ancient Thorns",
                Description = "Reflect 20% of melee damage taken back to attacker",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "reflectPct", 0.20f } }
            });
            Add(new PassiveData
            {
                Id = "grove_warden", Name = "Entangling Roots",
                Description = "35% chance to apply Root+Stun for 1s on attack",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "procChance", 0.35f }, { "rootDuration", 1.0f }, { "stunDuration", 1.0f } }
            });
            Add(new PassiveData
            {
                Id = "world_tree", Name = "Bloom of Life",
                Description = "Every 10s, summon 2 minions and heal all allies 20% max HP. Once per combat below 20% HP trigger.",
                Trigger = PassiveTrigger.Periodic,
                Params = new Dictionary<string, float>
                    { { "interval", 10 }, { "healPct", 0.20f }, { "minionCount", 2 }, { "minionHpPct", 0.30f }, { "minionAtkPct", 0.30f } }
            });
        }

        // =====================================================================
        // EARTH EVOLVED (11 units)
        // =====================================================================
        private static void RegisterEarthEvolved()
        {
            Add(new PassiveData
            {
                Id = "mountain_lord", Name = "Stone Shield+",
                Description = "Every 5s, grant self and 2 nearby allies shield (30% max HP)",
                Trigger = PassiveTrigger.Periodic,
                Params = new Dictionary<string, float>
                    { { "interval", 5 }, { "shieldPct", 0.30f }, { "allyCount", 2 } }
            });
            Add(new PassiveData
            {
                Id = "ironwood_sentinel", Name = "Thorn Reflect+",
                Description = "Reflect 30% of melee damage taken back to attacker",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "reflectPct", 0.30f } }
            });
            Add(new PassiveData
            {
                Id = "thornwood_ranger", Name = "Root Shot+",
                Description = "40% chance to apply Root+Stun for 1.5s on attack",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "procChance", 0.40f }, { "rootDuration", 1.5f }, { "stunDuration", 1.5f } }
            });
            Add(new PassiveData
            {
                Id = "gaia_priest", Name = "AoE Heal",
                Description = "Heals 2 lowest-HP allies per attack",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "healTargets", 2 }, { "healPct", 0.15f } }
            });
            Add(new PassiveData
            {
                Id = "geomancer", Name = "Crystal Lock+",
                Description = "40% chance to apply Root+Stun for 1.5s on attack",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "procChance", 0.40f }, { "rootDuration", 1.5f }, { "stunDuration", 1.5f } }
            });
            Add(new PassiveData
            {
                Id = "quake_reaper", Name = "Muddy Strike+",
                Description = "40% chance to apply Root+Stun for 1.5s on attack",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "procChance", 0.40f }, { "rootDuration", 1.5f }, { "stunDuration", 1.5f } }
            });
            Add(new PassiveData
            {
                Id = "iron_colossus", Name = "Unyielding+",
                Description = "At 50%+ HP: +20% DR. Below 30% HP: CC immunity",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "drBoostThreshold", 0.50f }, { "drBoost", 0.20f }, { "ccImmuneThreshold", 0.30f } }
            });
            Add(new PassiveData
            {
                Id = "earthweaver", Name = "Earthen Zone+",
                Description = "Enhanced hazard zone with stronger damage and buff zone (+20% ATK)",
                Trigger = PassiveTrigger.Aura,
                Params = new Dictionary<string, float>
                    { { "auraRange", 2 }, { "atkBuffPct", 0.20f } }
            });
            Add(new PassiveData
            {
                Id = "world_sentinel", Name = "Ancient Thorns+",
                Description = "Reflect 30% of melee damage taken back to attacker",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "reflectPct", 0.30f } }
            });
            Add(new PassiveData
            {
                Id = "worldroot_sentinel", Name = "Entangling Roots+",
                Description = "45% chance to apply Root+Stun for 1.5s on attack",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "procChance", 0.45f }, { "rootDuration", 1.5f }, { "stunDuration", 1.5f } }
            });
            Add(new PassiveData
            {
                Id = "yggdrasil", Name = "Bloom of Life+",
                Description = "Every 10s, summon 2 minions and heal all allies 25% max HP",
                Trigger = PassiveTrigger.Periodic,
                Params = new Dictionary<string, float>
                    { { "interval", 10 }, { "healPct", 0.25f }, { "minionCount", 2 }, { "minionHpPct", 0.30f }, { "minionAtkPct", 0.30f } }
            });
        }

        // =====================================================================
        // WIND BASE (11 units)
        // =====================================================================
        private static void RegisterWindBase()
        {
            Add(new PassiveData
            {
                Id = "zephyr_scout", Name = "Kill Rush",
                Description = "On kill: gain +12% ATK speed and +8% ATK (max 5 stacks, 6s)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "atkSpdBonus", 0.12f }, { "atkBonus", 0.08f }, { "maxStacks", 5 }, { "duration", 6 } }
            });
            Add(new PassiveData
            {
                Id = "wind_archer", Name = "Double Strike",
                Description = "30% chance to strike twice on auto-attack",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "doubleStrikeChance", 0.30f } }
            });
            Add(new PassiveData
            {
                Id = "gale_dancer", Name = "Wind Lifesteal",
                Description = "25% of damage dealt heals self",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "lifestealPct", 0.25f } }
            });
            Add(new PassiveData
            {
                Id = "wind_squire", Name = "Dodge Counter",
                Description = "25% dodge chance, counter-attack for 60% ATK + gain 20 mana on dodge",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "dodgeChance", 0.25f }, { "counterDmgPct", 0.60f }, { "manaOnDodge", 20 } }
            });
            Add(new PassiveData
            {
                Id = "sky_knight", Name = "Aegis Counter",
                Description = "25% dodge chance, counter-attack for 80% ATK + gain 20 mana on dodge",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "dodgeChance", 0.25f }, { "counterDmgPct", 0.80f }, { "manaOnDodge", 20 } }
            });
            Add(new PassiveData
            {
                Id = "gust_sentinel", Name = "Phase Shift",
                Description = "After ability cast, teleport and gain 25% dodge for 3s",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "postAbilityDodge", 0.25f }, { "dodgeDuration", 3 } }
            });
            Add(new PassiveData
            {
                Id = "monsoon_caller", Name = "Kill Rush",
                Description = "On kill: gain stacking buffs on consecutive kills",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "atkSpdBonus", 0.12f }, { "atkBonus", 0.08f }, { "maxStacks", 5 }, { "duration", 6 } }
            });
            Add(new PassiveData
            {
                Id = "wind_duelist", Name = "Rapid Strikes",
                Description = "30% chance to strike twice, doubled chain hit chance",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "doubleStrikeChance", 0.30f }, { "chainHitBonus", 2.0f } }
            });
            Add(new PassiveData
            {
                Id = "storm_sovereign", Name = "Tempest Rush",
                Description = "On kill: gain stacking buffs on consecutive kills",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "atkSpdBonus", 0.12f }, { "atkBonus", 0.08f }, { "maxStacks", 5 }, { "duration", 6 } }
            });
            Add(new PassiveData
            {
                Id = "tempest_weaver", Name = "Phase Shift",
                Description = "After ability cast, teleport and gain 25% dodge for 3s",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "postAbilityDodge", 0.25f }, { "dodgeDuration", 3 } }
            });
            Add(new PassiveData
            {
                Id = "void_wyrm", Name = "Dimensional Rift",
                Description = "Attacks drain 15 mana from targets. On any ally ability, fire bolt at random enemy.",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "manaDrain", 15 }, { "boltDamagePct", 1.0f } }
            });
        }

        // =====================================================================
        // WIND EVOLVED (11 units)
        // =====================================================================
        private static void RegisterWindEvolved()
        {
            Add(new PassiveData
            {
                Id = "storm_assassin", Name = "Kill Chain",
                Description = "On kill: deal 50 damage to nearest alive enemy",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "killChainDamage", 50 }, { "atkSpdBonus", 0.15f }, { "atkBonus", 0.10f }, { "maxStacks", 5 }, { "duration", 6 } }
            });
            Add(new PassiveData
            {
                Id = "gale_sniper", Name = "Armor Pierce",
                Description = "Target DR multiplied by 0.8 (ignores 20%)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "drPierce", 0.20f }, { "doubleStrikeChance", 0.35f } }
            });
            Add(new PassiveData
            {
                Id = "stormweaver", Name = "Wind Lifesteal+",
                Description = "30% of damage dealt heals self",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "lifestealPct", 0.30f } }
            });
            Add(new PassiveData
            {
                Id = "zephyr_warrior", Name = "Dodge Counter+",
                Description = "30% dodge chance, counter-attack for 80% ATK + 25 mana on dodge",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "dodgeChance", 0.30f }, { "counterDmgPct", 0.80f }, { "manaOnDodge", 25 } }
            });
            Add(new PassiveData
            {
                Id = "aegis_paladin", Name = "Shield Aura",
                Description = "Combat start: +100 shield to ALL allies",
                Trigger = PassiveTrigger.CombatStart,
                Params = new Dictionary<string, float>
                    { { "allyShield", 100 } }
            });
            Add(new PassiveData
            {
                Id = "tempest_guardian", Name = "Phase Shift+",
                Description = "After ability cast, teleport and gain 30% dodge for 4s",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "postAbilityDodge", 0.30f }, { "dodgeDuration", 4 } }
            });
            Add(new PassiveData
            {
                Id = "tempest_lord", Name = "Kill Rush+",
                Description = "On kill: gain +15% ATK speed and +10% ATK (max 5 stacks, 6s)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "atkSpdBonus", 0.15f }, { "atkBonus", 0.10f }, { "maxStacks", 5 }, { "duration", 6 } }
            });
            Add(new PassiveData
            {
                Id = "hurricane_blade", Name = "Rapid Strikes+",
                Description = "35% chance to strike twice, doubled chain hit chance",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "doubleStrikeChance", 0.35f }, { "chainHitBonus", 2.0f } }
            });
            Add(new PassiveData
            {
                Id = "tempest_emperor", Name = "Tempest Rush+",
                Description = "On kill: gain +15% ATK speed and +10% ATK (max 5 stacks, 6s)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "atkSpdBonus", 0.15f }, { "atkBonus", 0.10f }, { "maxStacks", 5 }, { "duration", 6 } }
            });
            Add(new PassiveData
            {
                Id = "stormweft_oracle", Name = "Phase Shift+",
                Description = "After ability cast, teleport and gain 30% dodge for 4s",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "postAbilityDodge", 0.30f }, { "dodgeDuration", 4 } }
            });
            Add(new PassiveData
            {
                Id = "dimensional_dragon", Name = "Dimensional Rift+",
                Description = "Attacks drain 15 mana from targets with improved potency. On any ally ability, fire stronger bolts.",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "manaDrain", 15 }, { "boltDamagePct", 1.5f } }
            });
        }

        // =====================================================================
        // LIGHTNING BASE (11 units)
        // =====================================================================
        private static void RegisterLightningBase()
        {
            Add(new PassiveData
            {
                Id = "spark_fencer", Name = "Crackle Marks",
                Description = "Auto-attacks apply stacking marks (max 5), +30% per mark consumed",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "maxStacks", 5 }, { "bonusPerStack", 0.30f } }
            });
            Add(new PassiveData
            {
                Id = "volt_runner", Name = "Volt Rush",
                Description = "On kill: gain stacking buffs (ATK speed + ATK)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "atkSpdBonus", 0.12f }, { "atkBonus", 0.08f }, { "maxStacks", 5 }, { "duration", 6 } }
            });
            Add(new PassiveData
            {
                Id = "thunder_archer", Name = "First Strike",
                Description = "First cast deals 50% bonus damage. Subsequent casts cost +10 mana.",
                Trigger = PassiveTrigger.CombatStart,
                Params = new Dictionary<string, float>
                    { { "firstCastBonus", 0.50f }, { "manaCostIncrease", 10 } }
            });
            Add(new PassiveData
            {
                Id = "pulse_mender", Name = "Shock Chain",
                Description = "After applying CC, next attack applies different CC type",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "ccChainChance", 1.0f }, { "ccDuration", 1.0f } }
            });
            Add(new PassiveData
            {
                Id = "tesla_knight", Name = "Tesla Lock",
                Description = "35% chance to apply Root+Stun for 1s on attack",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "procChance", 0.35f }, { "rootDuration", 1.0f }, { "stunDuration", 1.0f } }
            });
            Add(new PassiveData
            {
                Id = "shock_mage", Name = "Chain Lightning",
                Description = "First cast deals 50% bonus damage",
                Trigger = PassiveTrigger.CombatStart,
                Params = new Dictionary<string, float>
                    { { "firstCastBonus", 0.50f } }
            });
            Add(new PassiveData
            {
                Id = "ball_lightning", Name = "Sphere Marks",
                Description = "Auto-attacks apply stacking marks (max 5), +30% per mark consumed",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "maxStacks", 5 }, { "bonusPerStack", 0.30f } }
            });
            Add(new PassiveData
            {
                Id = "thunder_warden", Name = "Lightning Prison",
                Description = "35% chance to apply Root+Stun for 1s on attack",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "procChance", 0.35f }, { "rootDuration", 1.0f }, { "stunDuration", 1.0f } }
            });
            Add(new PassiveData
            {
                Id = "thunderbird", Name = "Lightning Descent",
                Description = "On kill: gain stacking buffs (ATK speed + ATK)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "atkSpdBonus", 0.12f }, { "atkBonus", 0.08f }, { "maxStacks", 5 }, { "duration", 6 } }
            });
            Add(new PassiveData
            {
                Id = "voltfang_stalker", Name = "Voltfang Rush",
                Description = "On kill: gain stacking buffs (ATK speed + ATK)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "atkSpdBonus", 0.12f }, { "atkBonus", 0.08f }, { "maxStacks", 5 }, { "duration", 6 } }
            });
            Add(new PassiveData
            {
                Id = "storm_dragon", Name = "Cataclysmic Storm",
                Description = "Aura: all allies +35% crit chance. Every 6s, strike target for 300% ATK, chains to 3 enemies.",
                Trigger = PassiveTrigger.Aura,
                Params = new Dictionary<string, float>
                    { { "critAuraBonus", 0.35f }, { "strikeInterval", 6 }, { "strikeDmgPct", 3.0f }, { "chainCount", 3 } }
            });
        }

        // =====================================================================
        // LIGHTNING EVOLVED (11 units)
        // =====================================================================
        private static void RegisterLightningEvolved()
        {
            Add(new PassiveData
            {
                Id = "arc_duelist", Name = "Crackle Marks+",
                Description = "Auto-attacks apply stacking marks (max 5), +35% per mark consumed",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "maxStacks", 5 }, { "bonusPerStack", 0.35f } }
            });
            Add(new PassiveData
            {
                Id = "lightning_phantom", Name = "Volt Rush+",
                Description = "On kill: gain enhanced stacking buffs",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "atkSpdBonus", 0.15f }, { "atkBonus", 0.10f }, { "maxStacks", 5 }, { "duration", 6 } }
            });
            Add(new PassiveData
            {
                Id = "storm_archer", Name = "First Strike+",
                Description = "First cast deals 60% bonus damage. Enhanced splash.",
                Trigger = PassiveTrigger.CombatStart,
                Params = new Dictionary<string, float>
                    { { "firstCastBonus", 0.60f }, { "manaCostIncrease", 10 } }
            });
            Add(new PassiveData
            {
                Id = "storm_medic", Name = "Shock Chain+",
                Description = "Enhanced primary stun and splash secondary stun",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "ccChainChance", 1.0f }, { "ccDuration", 1.5f } }
            });
            Add(new PassiveData
            {
                Id = "storm_bastion", Name = "Tesla Lock+",
                Description = "40% chance to apply Root+Stun for 1.5s on attack",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "procChance", 0.40f }, { "rootDuration", 1.5f }, { "stunDuration", 1.5f } }
            });
            Add(new PassiveData
            {
                Id = "tempest_mage", Name = "Chain Lightning+",
                Description = "First cast deals 60% bonus damage, enhanced splash",
                Trigger = PassiveTrigger.CombatStart,
                Params = new Dictionary<string, float>
                    { { "firstCastBonus", 0.60f } }
            });
            Add(new PassiveData
            {
                Id = "plasma_core", Name = "Sphere Marks+",
                Description = "Auto-attacks apply stacking marks (max 5), +35% per mark with AoE detonation",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "maxStacks", 5 }, { "bonusPerStack", 0.35f }, { "detonationRadius", 1 } }
            });
            Add(new PassiveData
            {
                Id = "storm_fortress", Name = "Lightning Prison+",
                Description = "45% chance to apply Root+Stun for 1.5s on attack",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "procChance", 0.45f }, { "rootDuration", 1.5f }, { "stunDuration", 1.5f } }
            });
            Add(new PassiveData
            {
                Id = "roc_of_storms", Name = "Lightning Descent+",
                Description = "On kill: gain enhanced stacking buffs",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "atkSpdBonus", 0.15f }, { "atkBonus", 0.10f }, { "maxStacks", 5 }, { "duration", 6 } }
            });
            Add(new PassiveData
            {
                Id = "plasma_ravager", Name = "Voltfang Rush+",
                Description = "On kill: gain enhanced stacking buffs",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "atkSpdBonus", 0.15f }, { "atkBonus", 0.10f }, { "maxStacks", 5 }, { "duration", 6 } }
            });
            Add(new PassiveData
            {
                Id = "thunder_god", Name = "Cataclysmic Storm+",
                Description = "Aura: all allies +50% crit chance. Every 6s, strike for 300% ATK, chains to 3 enemies.",
                Trigger = PassiveTrigger.Aura,
                Params = new Dictionary<string, float>
                    { { "critAuraBonus", 0.50f }, { "strikeInterval", 6 }, { "strikeDmgPct", 3.0f }, { "chainCount", 3 } }
            });
        }

        // =====================================================================
        // FORCE BASE (11 units)
        // =====================================================================
        private static void RegisterForceBase()
        {
            Add(new PassiveData
            {
                Id = "iron_soldier", Name = "Ramping Strikes",
                Description = "Consecutive hits on same target gain stacking +20% damage (max 5 stacks)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "stackDmgBonus", 0.20f }, { "maxStacks", 5 } }
            });
            Add(new PassiveData
            {
                Id = "shadow_blade", Name = "Executioner",
                Description = "+50% bonus damage to enemies below 40% HP. Refund 30 mana on kill.",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "executeThreshold", 0.40f }, { "executeBonusDmg", 0.50f }, { "manaRefund", 30 } }
            });
            Add(new PassiveData
            {
                Id = "steel_archer", Name = "Ramping Shots",
                Description = "Consecutive hits on same target gain stacking +20% damage (max 5 stacks)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "stackDmgBonus", 0.20f }, { "maxStacks", 5 } }
            });
            Add(new PassiveData
            {
                Id = "war_cleric", Name = "Damage Redirect",
                Description = "Redirect 40% of protected ally damage to self",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "redirectPct", 0.40f } }
            });
            Add(new PassiveData
            {
                Id = "battle_mage", Name = "Phase Strike",
                Description = "After ability cast, teleport and gain 25% dodge for 3s",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "postAbilityDodge", 0.25f }, { "dodgeDuration", 3 } }
            });
            Add(new PassiveData
            {
                Id = "shield_bearer", Name = "Damage Redirect",
                Description = "Redirect 40% of protected ally damage to self",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "redirectPct", 0.40f } }
            });
            Add(new PassiveData
            {
                Id = "gladiator", Name = "Ramping Strikes",
                Description = "Consecutive hits on same target gain stacking +20% damage (max 5 stacks)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "stackDmgBonus", 0.20f }, { "maxStacks", 5 } }
            });
            Add(new PassiveData
            {
                Id = "fortress", Name = "Unyielding Stance",
                Description = "At 50%+ HP: +15% DR. Below 30% HP: CC immunity",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "drBoostThreshold", 0.50f }, { "drBoost", 0.15f }, { "ccImmuneThreshold", 0.30f } }
            });
            Add(new PassiveData
            {
                Id = "siege_engineer", Name = "Phase Strike",
                Description = "After ability cast, teleport and gain 25% dodge for 3s",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "postAbilityDodge", 0.25f }, { "dodgeDuration", 3 } }
            });
            Add(new PassiveData
            {
                Id = "iron_duelist", Name = "Executioner",
                Description = "+50% bonus damage to enemies below 40% HP. Refund 30 mana on kill.",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "executeThreshold", 0.40f }, { "executeBonusDmg", 0.50f }, { "manaRefund", 30 } }
            });
            Add(new PassiveData
            {
                Id = "titan_lord", Name = "Earthshaker",
                Description = "Every 7s, toggle between Offensive (+40% ATK/speed) and Defensive (+20% DR, reflect)",
                Trigger = PassiveTrigger.Periodic,
                Params = new Dictionary<string, float>
                    { { "interval", 7 }, { "offAtkBoost", 0.40f }, { "offSpdBoost", 0.40f }, { "defDrBoost", 0.20f }, { "defReflect", 0.15f } }
            });
        }

        // =====================================================================
        // FORCE EVOLVED (11 units)
        // =====================================================================
        private static void RegisterForceEvolved()
        {
            Add(new PassiveData
            {
                Id = "legionnaire", Name = "Ramping Strikes+",
                Description = "Consecutive hits on same target gain stacking +25% damage (max 5 stacks)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "stackDmgBonus", 0.25f }, { "maxStacks", 5 } }
            });
            Add(new PassiveData
            {
                Id = "night_stalker", Name = "Executioner+",
                Description = "+60% bonus damage to enemies below 40% HP. Refund 30 mana on kill.",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "executeThreshold", 0.40f }, { "executeBonusDmg", 0.60f }, { "manaRefund", 30 } }
            });
            Add(new PassiveData
            {
                Id = "ballista_archer", Name = "Ramping Shots+",
                Description = "Consecutive hits on same target gain stacking +25% damage (max 5 stacks)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "stackDmgBonus", 0.25f }, { "maxStacks", 5 } }
            });
            Add(new PassiveData
            {
                Id = "battle_priest", Name = "Damage Redirect+",
                Description = "Redirect 50% of protected ally damage to self",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "redirectPct", 0.50f } }
            });
            Add(new PassiveData
            {
                Id = "force_archmage", Name = "Phase Strike+",
                Description = "After ability cast, teleport and gain 30% dodge for 4s",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "postAbilityDodge", 0.30f }, { "dodgeDuration", 4 } }
            });
            Add(new PassiveData
            {
                Id = "bastion", Name = "Damage Redirect+",
                Description = "Redirect 50% of protected ally damage to self",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "redirectPct", 0.50f } }
            });
            Add(new PassiveData
            {
                Id = "champion", Name = "Ramping Strikes+",
                Description = "Consecutive hits on same target gain stacking +25% damage (max 5 stacks)",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "stackDmgBonus", 0.25f }, { "maxStacks", 5 } }
            });
            Add(new PassiveData
            {
                Id = "citadel", Name = "Unyielding Stance+",
                Description = "At 50%+ HP: +20% DR. Below 30% HP: CC immunity",
                Trigger = PassiveTrigger.OnHit,
                Params = new Dictionary<string, float>
                    { { "drBoostThreshold", 0.50f }, { "drBoost", 0.20f }, { "ccImmuneThreshold", 0.30f } }
            });
            Add(new PassiveData
            {
                Id = "war_architect", Name = "Phase Strike+",
                Description = "After ability cast, teleport and gain 30% dodge for 4s",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "postAbilityDodge", 0.30f }, { "dodgeDuration", 4 } }
            });
            Add(new PassiveData
            {
                Id = "warforged_champion", Name = "Executioner+",
                Description = "+60% bonus damage to enemies below 40% HP. Refund 30 mana on kill.",
                Trigger = PassiveTrigger.OnAttack,
                Params = new Dictionary<string, float>
                    { { "executeThreshold", 0.40f }, { "executeBonusDmg", 0.60f }, { "manaRefund", 30 } }
            });
            Add(new PassiveData
            {
                Id = "cosmic_titan", Name = "Earthshaker+",
                Description = "Every 7s, toggle between Offensive (+60% ATK/speed) and Defensive (+25% DR, reflect)",
                Trigger = PassiveTrigger.Periodic,
                Params = new Dictionary<string, float>
                    { { "interval", 7 }, { "offAtkBoost", 0.60f }, { "offSpdBoost", 0.60f }, { "defDrBoost", 0.25f }, { "defReflect", 0.20f } }
            });
        }
    }
}
