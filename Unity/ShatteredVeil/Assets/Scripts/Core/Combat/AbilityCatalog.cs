using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Static catalog of all 132 abilities (66 base + 66 evolved).
    /// Parsed from js/units-abilities.js ABILITY_DATA.
    /// Grouped by element: Fire, Water, Earth, Wind, Lightning, Force.
    /// </summary>
    public static class AbilityCatalog
    {
        private static Dictionary<string, AbilityData> _catalog;

        public static int Count => GetCatalog().Count;

        public static AbilityData Get(string id)
        {
            var catalog = GetCatalog();
            return catalog.TryGetValue(id, out var ability) ? ability : null;
        }

        public static Dictionary<string, AbilityData> GetAll()
        {
            return new Dictionary<string, AbilityData>(GetCatalog());
        }

        public static bool Contains(string id)
        {
            return GetCatalog().ContainsKey(id);
        }

        private static Dictionary<string, AbilityData> GetCatalog()
        {
            if (_catalog != null) return _catalog;
            _catalog = new Dictionary<string, AbilityData>(132);
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
            return _catalog;
        }

        private static void Add(AbilityData a) => _catalog[a.Id] = a;

        // =====================================================================
        // FIRE BASE (11)
        // =====================================================================
        private static void RegisterFireBase()
        {
            Add(new AbilityData
            {
                Id = "flame_warrior", Name = "Blade Inferno",
                Description = "High damage to target, guaranteed crit if below 40% HP. Deal +50% bonus damage to enemies below 40% HP. Refund 30 mana on kill.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.5f,
                Flags = AbilityFlag.ConditionBonus | AbilityFlag.ManaRefund | AbilityFlag.Burn,
                SpecialParams = new Dictionary<string, float> { {"lowHpThreshold", 0.4f}, {"lowHpBonusDmg", 0.5f}, {"manaRefundOnKill", 30f}, {"burnDps", 15f}, {"burnDuration", 3f} }
            });
            Add(new AbilityData
            {
                Id = "ember_scout", Name = "Conflagration",
                Description = "Stack marks on hit (max 5). Strike to consume all marks for +30% bonus damage per mark consumed.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.0f,
                Flags = AbilityFlag.MarkConsume | AbilityFlag.Dash | AbilityFlag.Burn | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"markBonusPct", 0.3f}, {"maxMarks", 5f}, {"manaRefundOnKill", 30f}, {"burnDps", 10f}, {"burnDuration", 3f} }
            });
            Add(new AbilityData
            {
                Id = "cinder_archer", Name = "Fire Arrow",
                Description = "AoE dealing 120% ATK. Apply burn, +40% damage to targets already afflicted. Spread burn to nearby enemies.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.2f, AreaRadius = 1,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Burn | AbilityFlag.ConditionBonus,
                SpecialParams = new Dictionary<string, float> { {"burnBonusDmg", 0.4f}, {"burnDps", 15f}, {"burnDuration", 3f} }
            });
            Add(new AbilityData
            {
                Id = "fire_acolyte", Name = "Sacred Flame",
                Description = "Heal lowest-HP ally for 150% ATK, damage 3 nearest enemies for 80% ATK each. Heals deal 50% of heal amount as damage to nearest enemy.",
                Targeting = TargetingRule.LowestHPAlly, DamageMultiplier = 0.8f, HealMultiplier = 1.5f,
                Flags = AbilityFlag.Heal,
                SpecialParams = new Dictionary<string, float> { {"enemyTargets", 3f}, {"healDamagePct", 0.5f} }
            });
            Add(new AbilityData
            {
                Id = "magma_knight", Name = "Magma Eruption",
                Description = "Taunt nearby enemies for 2s. Double reflection for 4s, then explode for 100% ATK. Reflect 20% of melee damage taken.",
                Targeting = TargetingRule.Self, DamageMultiplier = 1.0f, AreaRadius = 1,
                Flags = AbilityFlag.Taunt | AbilityFlag.AreaDamage,
                SpecialParams = new Dictionary<string, float> { {"tauntDuration", 2f}, {"reflectPct", 0.2f}, {"reflectDuration", 4f} }
            });
            Add(new AbilityData
            {
                Id = "blaze_lancer", Name = "Lance Barrage",
                Description = "AoE dealing 120% ATK. Apply burn, +40% damage to targets already afflicted. Spread burn to nearby enemies.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.2f, AreaRadius = 1,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Burn | AbilityFlag.ConditionBonus,
                SpecialParams = new Dictionary<string, float> { {"burnBonusDmg", 0.4f}, {"burnDps", 15f}, {"burnDuration", 3f} }
            });
            Add(new AbilityData
            {
                Id = "pyromancer", Name = "Infernal Detonation",
                Description = "Strike target, consume all marks for +30% bonus damage per mark consumed. Apply stacking marks on auto-attacks (max 5).",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.MarkConsume,
                SpecialParams = new Dictionary<string, float> { {"markBonusPct", 0.3f}, {"maxMarks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "inferno_fox", Name = "Spirit Rush",
                Description = "Dash to target, deal 180% ATK. On kill, reset cooldown and recast. Gain stacking buffs on consecutive kills.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.Dash | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"resetOnKill", 1f}, {"stackAtkSpd", 0.12f}, {"stackAtk", 0.08f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "fire_dragon", Name = "Breath Weapon",
                Description = "AoE dealing 120% ATK. Apply burn, +40% damage to targets already afflicted. Spread burn to nearby enemies.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.2f, AreaRadius = 2,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Burn | AbilityFlag.ConditionBonus,
                SpecialParams = new Dictionary<string, float> { {"burnBonusDmg", 0.4f}, {"burnDps", 15f}, {"burnDuration", 3f} }
            });
            Add(new AbilityData
            {
                Id = "ashen_watcher", Name = "Purifying Blaze",
                Description = "Heal lowest-HP ally for 150% ATK, damage 3 nearest enemies for 80% ATK each. Heals deal 50% of heal amount as damage to nearest enemy.",
                Targeting = TargetingRule.LowestHPAlly, DamageMultiplier = 0.8f, HealMultiplier = 1.5f,
                Flags = AbilityFlag.Heal,
                SpecialParams = new Dictionary<string, float> { {"enemyTargets", 3f}, {"healDamagePct", 0.5f} }
            });
            Add(new AbilityData
            {
                Id = "phoenix", Name = "Rebirth Flame",
                Description = "PASSIVE: Every 7s, toggle between Offensive (+40% ATK/speed) and Defensive (+20% DR, reflect).",
                Type = AbilityType.PassiveCast, Targeting = TargetingRule.Self,
                Flags = AbilityFlag.SelfBuff | AbilityFlag.Revive,
                SpecialParams = new Dictionary<string, float> { {"toggleInterval", 7f}, {"offensiveAtkBuff", 0.4f}, {"defensiveDR", 0.2f} }
            });
        }

        // =====================================================================
        // FIRE EVOLVED (11)
        // =====================================================================
        private static void RegisterFireEvolved()
        {
            Add(new AbilityData
            {
                Id = "fire_berserker", Name = "Enhanced Blade Inferno",
                Description = "High damage to target with enhanced scaling, guaranteed crit if below 40% HP. Stronger bonus damage to low-HP enemies. Refund 30 mana on kill.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.ConditionBonus | AbilityFlag.ManaRefund | AbilityFlag.Burn,
                SpecialParams = new Dictionary<string, float> { {"lowHpThreshold", 0.4f}, {"lowHpBonusDmg", 0.6f}, {"manaRefundOnKill", 30f}, {"burnDps", 20f}, {"burnDuration", 3f} }
            });
            Add(new AbilityData
            {
                Id = "flame_rogue", Name = "Phantom Blaze",
                Description = "Stack marks on hit with increased potency. Strike to consume all marks for +30% bonus damage per mark with enhanced multiplier.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.2f,
                Flags = AbilityFlag.MarkConsume | AbilityFlag.Dash | AbilityFlag.Burn | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"markBonusPct", 0.35f}, {"maxMarks", 5f}, {"manaRefundOnKill", 30f} }
            });
            Add(new AbilityData
            {
                Id = "cinder_marksman", Name = "Fire Barrage",
                Description = "Enhanced AoE dealing 120% ATK. Apply burn with higher damage, +40% to already afflicted. Spread burn further with higher potency.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.4f, AreaRadius = 2,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Burn | AbilityFlag.ConditionBonus,
                SpecialParams = new Dictionary<string, float> { {"burnBonusDmg", 0.4f}, {"burnDps", 25f}, {"burnDuration", 4f} }
            });
            Add(new AbilityData
            {
                Id = "ember_saint", Name = "Holy Inferno",
                Description = "Enhanced heal for lowest-HP ally, damage more enemies with stronger scaling. Heals apply burn as well as dealing damage.",
                Targeting = TargetingRule.LowestHPAlly, DamageMultiplier = 1.0f, HealMultiplier = 1.8f,
                Flags = AbilityFlag.Heal | AbilityFlag.Burn,
                SpecialParams = new Dictionary<string, float> { {"enemyTargets", 4f}, {"healDamagePct", 0.5f}, {"burnDps", 15f}, {"burnDuration", 3f} }
            });
            Add(new AbilityData
            {
                Id = "volcano_titan", Name = "Magma Eruption Enhanced",
                Description = "Taunt with extended range, doubled reflection strength, stronger explosion. Reflect damage increased with DR scaling.",
                Targeting = TargetingRule.Self, DamageMultiplier = 1.3f, AreaRadius = 2,
                Flags = AbilityFlag.Taunt | AbilityFlag.AreaDamage,
                SpecialParams = new Dictionary<string, float> { {"tauntDuration", 3f}, {"reflectPct", 0.3f}, {"reflectDuration", 5f} }
            });
            Add(new AbilityData
            {
                Id = "inferno_lancer", Name = "Lance Barrage Enhanced",
                Description = "Enhanced AoE with higher damage scaling. Apply burn with stronger damage, improved spread to nearby enemies.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.5f, AreaRadius = 2,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Burn | AbilityFlag.ConditionBonus,
                SpecialParams = new Dictionary<string, float> { {"burnBonusDmg", 0.4f}, {"burnDps", 25f}, {"burnDuration", 4f} }
            });
            Add(new AbilityData
            {
                Id = "arcane_inferno", Name = "Infernal Detonation Enhanced",
                Description = "Strike with enhanced scaling, consume marks for high bonus damage per mark. Mark stacking with improved vulnerability.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.0f,
                Flags = AbilityFlag.MarkConsume | AbilityFlag.Vulnerability,
                SpecialParams = new Dictionary<string, float> { {"markBonusPct", 0.35f}, {"maxMarks", 5f}, {"vulnPct", 0.15f} }
            });
            Add(new AbilityData
            {
                Id = "ninetail_blaze", Name = "Spirit Rush Enhanced",
                Description = "Dash to target with higher damage, reset on kills. Gain stacking buffs faster on consecutive kills with enhanced stats.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.0f,
                Flags = AbilityFlag.Dash | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"resetOnKill", 1f}, {"stackAtkSpd", 0.15f}, {"stackAtk", 0.10f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "elder_wyrm", Name = "Breath Weapon Enhanced",
                Description = "Large AoE with stronger damage. Apply burn with high damage, +40% to already afflicted, improved spread radius.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.5f, AreaRadius = 2,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Burn | AbilityFlag.ConditionBonus,
                SpecialParams = new Dictionary<string, float> { {"burnBonusDmg", 0.4f}, {"burnDps", 30f}, {"burnDuration", 4f} }
            });
            Add(new AbilityData
            {
                Id = "phoenix_priest", Name = "Purifying Blaze Enhanced",
                Description = "Enhanced heal with better scaling, damage more enemies with higher damage. Heals and damage apply burn effects.",
                Targeting = TargetingRule.LowestHPAlly, DamageMultiplier = 1.0f, HealMultiplier = 2.0f,
                Flags = AbilityFlag.Heal | AbilityFlag.Burn,
                SpecialParams = new Dictionary<string, float> { {"enemyTargets", 4f}, {"healDamagePct", 0.5f}, {"burnDps", 15f}, {"burnDuration", 3f} }
            });
            Add(new AbilityData
            {
                Id = "eternal_phoenix", Name = "Rebirth Enhanced",
                Description = "PASSIVE: Every 7s, toggle between Offensive (+60% ATK/speed) and Defensive (+25% DR, reflection).",
                Type = AbilityType.PassiveCast, Targeting = TargetingRule.Self,
                Flags = AbilityFlag.SelfBuff | AbilityFlag.Revive,
                SpecialParams = new Dictionary<string, float> { {"toggleInterval", 7f}, {"offensiveAtkBuff", 0.6f}, {"defensiveDR", 0.25f} }
            });
        }

        // =====================================================================
        // WATER BASE (11)
        // =====================================================================
        private static void RegisterWaterBase()
        {
            Add(new AbilityData
            {
                Id = "tide_hunter", Name = "Tidal Pull",
                Description = "AoE pull enemies toward center, deal 100% ATK, apply slow. Auto-attacks apply slow (stacking duration, max 5 stacks).",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.0f, AreaRadius = 2,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Slow | AbilityFlag.Knockback,
                SpecialParams = new Dictionary<string, float> { {"slowDuration", 2f}, {"slowPct", 0.2f} }
            });
            Add(new AbilityData
            {
                Id = "frost_archer", Name = "Frost Cascade",
                Description = "AoE applying primary freeze + splash secondary freeze to nearby targets. After applying CC, next attack applies different CC type to same target.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.0f, AreaRadius = 1,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Freeze | AbilityFlag.Stun,
                SpecialParams = new Dictionary<string, float> { {"freezeDuration", 1.5f}, {"splashFreezeRadius", 1f} }
            });
            Add(new AbilityData
            {
                Id = "reef_stalker", Name = "Depth Strike",
                Description = "Deal 150% ATK damage + heal self for 50% of damage. Steal 18% of target ATK for 4s. 25% of damage dealt heals self.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.5f,
                Flags = AbilityFlag.Lifesteal,
                SpecialParams = new Dictionary<string, float> { {"selfHealPct", 0.5f}, {"atkStealPct", 0.18f}, {"stealDuration", 4f}, {"ongoingLifesteal", 0.25f} }
            });
            Add(new AbilityData
            {
                Id = "coral_priest", Name = "Tidal Blessing",
                Description = "Heal lowest ally for 150% ATK, damage 3 nearest enemies for 80% ATK each. Heals deal 50% of heal amount as damage to nearest enemy.",
                Targeting = TargetingRule.LowestHPAlly, DamageMultiplier = 0.8f, HealMultiplier = 1.5f,
                Flags = AbilityFlag.Heal,
                SpecialParams = new Dictionary<string, float> { {"enemyTargets", 3f}, {"healDamagePct", 0.5f} }
            });
            Add(new AbilityData
            {
                Id = "hydro_mage", Name = "Maelstrom",
                Description = "AoE pull enemies toward center, deal 100% ATK, apply slow. Auto-attacks apply slow (stacking duration, max 5 stacks).",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.0f, AreaRadius = 2,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Slow | AbilityFlag.Knockback,
                SpecialParams = new Dictionary<string, float> { {"slowDuration", 2f}, {"slowPct", 0.2f} }
            });
            Add(new AbilityData
            {
                Id = "shell_knight", Name = "Shelled Stance",
                Description = "Grant self large Shield (40% max HP) + nearby allies smaller Shield (20% max HP). Every 6s, grant self and 1 nearby ally Shield (25% max HP).",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.Shield,
                SpecialParams = new Dictionary<string, float> { {"selfShieldPct", 0.4f}, {"allyShieldPct", 0.2f}, {"periodicShieldPct", 0.25f}, {"periodicInterval", 6f} }
            });
            Add(new AbilityData
            {
                Id = "tidal_shaman", Name = "Tidal Surge",
                Description = "Heal lowest ally for 150% ATK, damage 3 nearest enemies for 80% ATK each. Heals deal 50% of heal amount as damage to nearest enemy.",
                Targeting = TargetingRule.LowestHPAlly, DamageMultiplier = 0.8f, HealMultiplier = 1.5f,
                Flags = AbilityFlag.Heal,
                SpecialParams = new Dictionary<string, float> { {"enemyTargets", 3f}, {"healDamagePct", 0.5f} }
            });
            Add(new AbilityData
            {
                Id = "riptide_blade", Name = "Maelstrom Spin",
                Description = "Deal 150% ATK damage + heal self for 50% of damage. Steal 18% of target ATK for 4s. 25% of damage dealt heals self.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.5f,
                Flags = AbilityFlag.Lifesteal,
                SpecialParams = new Dictionary<string, float> { {"selfHealPct", 0.5f}, {"atkStealPct", 0.18f}, {"stealDuration", 4f}, {"ongoingLifesteal", 0.25f} }
            });
            Add(new AbilityData
            {
                Id = "kraken", Name = "Abyssal Maelstrom",
                Description = "Large AoE pull enemies toward center, deal 100% ATK, apply slow. Auto-attacks apply slow (stacking duration, max 5 stacks).",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.0f, AreaRadius = 3,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Slow | AbilityFlag.Knockback,
                SpecialParams = new Dictionary<string, float> { {"slowDuration", 3f}, {"slowPct", 0.25f} }
            });
            Add(new AbilityData
            {
                Id = "abyssal_guardian", Name = "Abyssal Ward",
                Description = "Grant self large Shield (40% max HP) + nearby allies smaller Shield (20% max HP). Every 6s, grant self and 1 nearby ally Shield (25% max HP).",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.Shield,
                SpecialParams = new Dictionary<string, float> { {"selfShieldPct", 0.4f}, {"allyShieldPct", 0.2f}, {"periodicShieldPct", 0.25f}, {"periodicInterval", 6f} }
            });
            Add(new AbilityData
            {
                Id = "leviathan", Name = "Tidal Guardian",
                Description = "PASSIVE: Below 50% HP, submerge for 2s (take 70% reduced damage). Gain +30% DR. At 50%+ HP, gain +15% DR. Below 30% HP, gain CC immunity.",
                Type = AbilityType.PassiveCast, Targeting = TargetingRule.Self,
                Flags = AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"submergeDuration", 2f}, {"submergeDR", 0.7f}, {"lowHpDR", 0.3f}, {"highHpDR", 0.15f}, {"ccImmuneThreshold", 0.3f} }
            });
        }

        // =====================================================================
        // WATER EVOLVED (11)
        // =====================================================================
        private static void RegisterWaterEvolved()
        {
            Add(new AbilityData
            {
                Id = "tsunami_blade", Name = "Tidal Pull Enhanced",
                Description = "Enhanced AoE pull with stronger damage and slow application. Slow stacking with increased potency and duration.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.3f, AreaRadius = 2,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Slow | AbilityFlag.Knockback,
                SpecialParams = new Dictionary<string, float> { {"slowDuration", 3f}, {"slowPct", 0.3f} }
            });
            Add(new AbilityData
            {
                Id = "ice_sniper", Name = "Frost Cascade Enhanced",
                Description = "Enhanced AoE with stronger freeze and secondary CC splash. Improved CC chaining with higher potency.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.2f, AreaRadius = 2,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Freeze | AbilityFlag.Stun,
                SpecialParams = new Dictionary<string, float> { {"freezeDuration", 2f}, {"splashFreezeRadius", 2f} }
            });
            Add(new AbilityData
            {
                Id = "tidal_phantom", Name = "Depth Strike Enhanced",
                Description = "Enhanced damage with stronger healing and stat steal. Improved lifesteal mechanics with higher potency.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.Lifesteal,
                SpecialParams = new Dictionary<string, float> { {"selfHealPct", 0.6f}, {"atkStealPct", 0.22f}, {"stealDuration", 5f}, {"ongoingLifesteal", 0.3f} }
            });
            Add(new AbilityData
            {
                Id = "ocean_sage", Name = "Tidal Blessing Enhanced",
                Description = "Enhanced heal and damage with stronger scaling. Improved enemy damage application with burn effects.",
                Targeting = TargetingRule.LowestHPAlly, DamageMultiplier = 1.0f, HealMultiplier = 1.8f,
                Flags = AbilityFlag.Heal | AbilityFlag.Burn,
                SpecialParams = new Dictionary<string, float> { {"enemyTargets", 4f}, {"healDamagePct", 0.5f} }
            });
            Add(new AbilityData
            {
                Id = "abyssal_mage", Name = "Maelstrom Enhanced",
                Description = "Enhanced AoE pull with stronger damage. Improved slow application with higher potency and stacking.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.3f, AreaRadius = 2,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Slow | AbilityFlag.Knockback,
                SpecialParams = new Dictionary<string, float> { {"slowDuration", 3f}, {"slowPct", 0.3f} }
            });
            Add(new AbilityData
            {
                Id = "armored_sentinel", Name = "Shelled Stance Enhanced",
                Description = "Enhanced shield amounts with better scaling. More frequent and stronger ally protection.",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.Shield,
                SpecialParams = new Dictionary<string, float> { {"selfShieldPct", 0.5f}, {"allyShieldPct", 0.3f}, {"periodicShieldPct", 0.3f}, {"periodicInterval", 5f} }
            });
            Add(new AbilityData
            {
                Id = "stormtide_oracle", Name = "Tidal Surge Enhanced",
                Description = "Enhanced heal and damage with stronger scaling. Improved multi-target damage with higher potency.",
                Targeting = TargetingRule.LowestHPAlly, DamageMultiplier = 1.0f, HealMultiplier = 1.8f,
                Flags = AbilityFlag.Heal,
                SpecialParams = new Dictionary<string, float> { {"enemyTargets", 4f}, {"healDamagePct", 0.6f} }
            });
            Add(new AbilityData
            {
                Id = "tsunami_warlord", Name = "Maelstrom Spin Enhanced",
                Description = "Enhanced damage with stronger healing and stat steal. Improved AoE healing and damage.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.Lifesteal,
                SpecialParams = new Dictionary<string, float> { {"selfHealPct", 0.6f}, {"atkStealPct", 0.22f}, {"stealDuration", 5f}, {"ongoingLifesteal", 0.3f} }
            });
            Add(new AbilityData
            {
                Id = "abyssal_terror", Name = "Abyssal Maelstrom Enhanced",
                Description = "Enhanced large AoE pull with stronger damage. Improved slow application with higher potency.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.3f, AreaRadius = 3,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Slow | AbilityFlag.Knockback,
                SpecialParams = new Dictionary<string, float> { {"slowDuration", 3f}, {"slowPct", 0.35f} }
            });
            Add(new AbilityData
            {
                Id = "hadal_colossus", Name = "Abyssal Ward Enhanced",
                Description = "Enhanced shield amounts with better scaling. More frequent and stronger ally protection.",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.Shield,
                SpecialParams = new Dictionary<string, float> { {"selfShieldPct", 0.5f}, {"allyShieldPct", 0.3f}, {"periodicShieldPct", 0.3f}, {"periodicInterval", 5f} }
            });
            Add(new AbilityData
            {
                Id = "primordial_leviathan", Name = "Tidal Guardian Enhanced",
                Description = "PASSIVE: Below 50% HP, submerge for 2s (take 70% reduced damage). Gain +40% DR. Enhanced threshold effects.",
                Type = AbilityType.PassiveCast, Targeting = TargetingRule.Self,
                Flags = AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"submergeDuration", 2f}, {"submergeDR", 0.7f}, {"lowHpDR", 0.4f}, {"highHpDR", 0.2f}, {"ccImmuneThreshold", 0.3f} }
            });
        }

        // =====================================================================
        // EARTH BASE (11)
        // =====================================================================
        private static void RegisterEarthBase()
        {
            Add(new AbilityData
            {
                Id = "stone_guard", Name = "Stone Barrier",
                Description = "Grant self large Shield (40% max HP) + nearby allies smaller Shield (20% max HP). Every 6s, grant self and 1 nearby ally Shield (25% max HP).",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.Shield,
                SpecialParams = new Dictionary<string, float> { {"selfShieldPct", 0.4f}, {"allyShieldPct", 0.2f}, {"periodicShieldPct", 0.25f}, {"periodicInterval", 6f} }
            });
            Add(new AbilityData
            {
                Id = "bramble_knight", Name = "Thorn Bash",
                Description = "Taunt nearby enemies for 2s. Double reflection for 4s, then explode for 100% ATK. Reflect 20% of melee damage taken.",
                Targeting = TargetingRule.Self, DamageMultiplier = 1.0f, AreaRadius = 1,
                Flags = AbilityFlag.Taunt | AbilityFlag.AreaDamage,
                SpecialParams = new Dictionary<string, float> { {"tauntDuration", 2f}, {"reflectPct", 0.2f}, {"reflectDuration", 4f} }
            });
            Add(new AbilityData
            {
                Id = "seedling_archer", Name = "Root Shot",
                Description = "Apply Root + Stun + apply 20% vulnerability to 2 nearest enemies for 4s. 35% chance to apply Root + Stun for 1s on attack.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.0f,
                Flags = AbilityFlag.Root | AbilityFlag.Stun | AbilityFlag.Vulnerability,
                SpecialParams = new Dictionary<string, float> { {"targets", 2f}, {"ccDuration", 4f}, {"vulnPct", 0.2f}, {"onAttackChance", 0.35f} }
            });
            Add(new AbilityData
            {
                Id = "earth_shaman", Name = "Earth's Blessing",
                Description = "Grant self large Shield (40% max HP) + nearby allies smaller Shield (20% max HP). Every 6s, grant self and 1 nearby ally Shield (25% max HP).",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.Shield,
                SpecialParams = new Dictionary<string, float> { {"selfShieldPct", 0.4f}, {"allyShieldPct", 0.2f}, {"periodicShieldPct", 0.25f}, {"periodicInterval", 6f} }
            });
            Add(new AbilityData
            {
                Id = "crystal_mage", Name = "Stalagmite Burst",
                Description = "Apply Root + Stun + apply 20% vulnerability to 2 nearest enemies for 4s. 35% chance to apply Root + Stun for 1s on attack.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.2f,
                Flags = AbilityFlag.Root | AbilityFlag.Stun | AbilityFlag.Vulnerability,
                SpecialParams = new Dictionary<string, float> { {"targets", 2f}, {"ccDuration", 4f}, {"vulnPct", 0.2f}, {"onAttackChance", 0.35f} }
            });
            Add(new AbilityData
            {
                Id = "mud_stalker", Name = "Subterranean Strike",
                Description = "Apply Root + Stun + apply 20% vulnerability to 2 nearest enemies for 4s. 35% chance to apply Root + Stun for 1s on attack.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.2f,
                Flags = AbilityFlag.Root | AbilityFlag.Stun | AbilityFlag.Vulnerability,
                SpecialParams = new Dictionary<string, float> { {"targets", 2f}, {"ccDuration", 4f}, {"vulnPct", 0.2f}, {"onAttackChance", 0.35f} }
            });
            Add(new AbilityData
            {
                Id = "golem", Name = "Defensive Stance",
                Description = "Grant self massive Shield (60% max HP) + 20% DR buff for 5s. At 50%+ HP, gain +15% DR. Below 30% HP, gain CC immunity.",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.Shield | AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"selfShieldPct", 0.6f}, {"drBuff", 0.2f}, {"drBuffDuration", 5f}, {"highHpDR", 0.15f}, {"ccImmuneThreshold", 0.3f} }
            });
            Add(new AbilityData
            {
                Id = "terra_sage", Name = "Earthen Barrage",
                Description = "Create hazard zone (2-cell radius, 5s) dealing 60% ATK/s, apply slow. Create 2-cell buff zone after ability cast (+15% ATK to allies).",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 0.6f, AreaRadius = 2,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Slow | AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"zoneDuration", 5f}, {"buffZoneAtkPct", 0.15f}, {"slowPct", 0.2f} }
            });
            Add(new AbilityData
            {
                Id = "ancient_treant", Name = "Nature's Wrath",
                Description = "Taunt nearby enemies for 2s. Double reflection for 4s, then explode for 100% ATK. Reflect 20% of melee damage taken.",
                Targeting = TargetingRule.Self, DamageMultiplier = 1.0f, AreaRadius = 1,
                Flags = AbilityFlag.Taunt | AbilityFlag.AreaDamage,
                SpecialParams = new Dictionary<string, float> { {"tauntDuration", 2f}, {"reflectPct", 0.2f}, {"reflectDuration", 4f} }
            });
            Add(new AbilityData
            {
                Id = "grove_warden", Name = "Entangling Barrage",
                Description = "Apply Root + Stun + apply 20% vulnerability to 2 nearest enemies for 4s. 35% chance to apply Root + Stun for 1s on attack.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.0f,
                Flags = AbilityFlag.Root | AbilityFlag.Stun | AbilityFlag.Vulnerability,
                SpecialParams = new Dictionary<string, float> { {"targets", 2f}, {"ccDuration", 4f}, {"vulnPct", 0.2f}, {"onAttackChance", 0.35f} }
            });
            Add(new AbilityData
            {
                Id = "world_tree", Name = "Bloom of Life",
                Description = "PASSIVE: Every 10s, summon 2 minions (30% HP/ATK) at nearby location. Heal all allies 20% max HP.",
                Type = AbilityType.PassiveCast, Targeting = TargetingRule.AllAllies,
                Flags = AbilityFlag.Summon | AbilityFlag.Heal,
                SpecialParams = new Dictionary<string, float> { {"summonInterval", 10f}, {"minionCount", 2f}, {"minionHpPct", 0.3f}, {"minionAtkPct", 0.3f}, {"healAllPct", 0.2f} }
            });
        }

        // =====================================================================
        // EARTH EVOLVED (11)
        // =====================================================================
        private static void RegisterEarthEvolved()
        {
            Add(new AbilityData
            {
                Id = "mountain_lord", Name = "Stone Barrier Enhanced",
                Description = "Enhanced shield amounts with better scaling. More frequent and stronger ally protection.",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.Shield,
                SpecialParams = new Dictionary<string, float> { {"selfShieldPct", 0.5f}, {"allyShieldPct", 0.3f}, {"periodicShieldPct", 0.3f}, {"periodicInterval", 5f} }
            });
            Add(new AbilityData
            {
                Id = "ironwood_sentinel", Name = "Thorn Bash Enhanced",
                Description = "Taunt with extended range, doubled reflection strength, stronger explosion. Enhanced damage scaling.",
                Targeting = TargetingRule.Self, DamageMultiplier = 1.3f, AreaRadius = 2,
                Flags = AbilityFlag.Taunt | AbilityFlag.AreaDamage,
                SpecialParams = new Dictionary<string, float> { {"tauntDuration", 3f}, {"reflectPct", 0.3f}, {"reflectDuration", 5f} }
            });
            Add(new AbilityData
            {
                Id = "thornwood_ranger", Name = "Root Shot Enhanced",
                Description = "Enhanced lockdown with stronger vulnerability. Improved stacking and duration.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.2f,
                Flags = AbilityFlag.Root | AbilityFlag.Stun | AbilityFlag.Vulnerability,
                SpecialParams = new Dictionary<string, float> { {"targets", 3f}, {"ccDuration", 5f}, {"vulnPct", 0.25f}, {"onAttackChance", 0.40f} }
            });
            Add(new AbilityData
            {
                Id = "gaia_priest", Name = "Earth's Blessing Enhanced",
                Description = "Enhanced shield amounts with better scaling. More frequent and stronger ally protection.",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.Shield,
                SpecialParams = new Dictionary<string, float> { {"selfShieldPct", 0.5f}, {"allyShieldPct", 0.3f}, {"periodicShieldPct", 0.3f}, {"periodicInterval", 5f} }
            });
            Add(new AbilityData
            {
                Id = "geomancer", Name = "Stalagmite Burst Enhanced",
                Description = "Enhanced lockdown with stronger vulnerability. Improved range and potency.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.5f,
                Flags = AbilityFlag.Root | AbilityFlag.Stun | AbilityFlag.Vulnerability,
                SpecialParams = new Dictionary<string, float> { {"targets", 3f}, {"ccDuration", 5f}, {"vulnPct", 0.25f}, {"onAttackChance", 0.40f} }
            });
            Add(new AbilityData
            {
                Id = "quake_reaper", Name = "Subterranean Strike Enhanced",
                Description = "Enhanced lockdown with stronger vulnerability. Improved burst potential.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.5f,
                Flags = AbilityFlag.Root | AbilityFlag.Stun | AbilityFlag.Vulnerability,
                SpecialParams = new Dictionary<string, float> { {"targets", 3f}, {"ccDuration", 5f}, {"vulnPct", 0.25f}, {"onAttackChance", 0.40f} }
            });
            Add(new AbilityData
            {
                Id = "iron_colossus", Name = "Defensive Stance Enhanced",
                Description = "Enhanced shield and DR with better scaling. Improved threshold effects for CC immunity.",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.Shield | AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"selfShieldPct", 0.7f}, {"drBuff", 0.25f}, {"drBuffDuration", 6f}, {"highHpDR", 0.2f}, {"ccImmuneThreshold", 0.35f} }
            });
            Add(new AbilityData
            {
                Id = "earthweaver", Name = "Earthen Barrage Enhanced",
                Description = "Create enhanced hazard zone with stronger damage. Improved buff zone effects.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 0.8f, AreaRadius = 2,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Slow | AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"zoneDuration", 6f}, {"buffZoneAtkPct", 0.2f}, {"slowPct", 0.25f} }
            });
            Add(new AbilityData
            {
                Id = "world_sentinel", Name = "Nature's Wrath Enhanced",
                Description = "Taunt with extended range, doubled reflection strength, stronger explosion.",
                Targeting = TargetingRule.Self, DamageMultiplier = 1.3f, AreaRadius = 2,
                Flags = AbilityFlag.Taunt | AbilityFlag.AreaDamage,
                SpecialParams = new Dictionary<string, float> { {"tauntDuration", 3f}, {"reflectPct", 0.3f}, {"reflectDuration", 5f} }
            });
            Add(new AbilityData
            {
                Id = "worldroot_sentinel", Name = "Entangling Barrage Enhanced",
                Description = "Enhanced lockdown with stronger vulnerability. Improved multi-target potency.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.2f,
                Flags = AbilityFlag.Root | AbilityFlag.Stun | AbilityFlag.Vulnerability,
                SpecialParams = new Dictionary<string, float> { {"targets", 3f}, {"ccDuration", 5f}, {"vulnPct", 0.25f}, {"onAttackChance", 0.40f} }
            });
            Add(new AbilityData
            {
                Id = "yggdrasil", Name = "Bloom of Life Enhanced",
                Description = "PASSIVE: Every 10s, summon 2 minions (30% HP/ATK) at nearby location. Heal all allies with higher potency.",
                Type = AbilityType.PassiveCast, Targeting = TargetingRule.AllAllies,
                Flags = AbilityFlag.Summon | AbilityFlag.Heal,
                SpecialParams = new Dictionary<string, float> { {"summonInterval", 10f}, {"minionCount", 2f}, {"minionHpPct", 0.3f}, {"minionAtkPct", 0.3f}, {"healAllPct", 0.3f} }
            });
        }

        // =====================================================================
        // WIND BASE (11)
        // =====================================================================
        private static void RegisterWindBase()
        {
            Add(new AbilityData
            {
                Id = "zephyr_scout", Name = "Swift Slash",
                Description = "Dash to target, deal 180% ATK. On kill, reset cooldown and recast. Gain stacking +12% ATK speed and +8% ATK on kill (max 5 stacks, 6s).",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.Dash | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"resetOnKill", 1f}, {"stackAtkSpd", 0.12f}, {"stackAtk", 0.08f}, {"maxStacks", 5f}, {"stackDuration", 6f} }
            });
            Add(new AbilityData
            {
                Id = "wind_archer", Name = "Pierce Shot",
                Description = "Rapid flurry: strike target 5 times, each 80% ATK. Doubled chance to chain hits. Auto-attacks have 30% chance to strike twice.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 0.8f,
                Flags = AbilityFlag.Chain,
                SpecialParams = new Dictionary<string, float> { {"hitCount", 5f}, {"onAttackDoubleChance", 0.3f} }
            });
            Add(new AbilityData
            {
                Id = "gale_dancer", Name = "Rejuvenating Breeze",
                Description = "Deal 150% ATK damage + heal self for 50% of damage. Steal 18% of target ATK for 4s. 25% of damage dealt heals self.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.5f,
                Flags = AbilityFlag.Lifesteal,
                SpecialParams = new Dictionary<string, float> { {"selfHealPct", 0.5f}, {"atkStealPct", 0.18f}, {"stealDuration", 4f}, {"ongoingLifesteal", 0.25f} }
            });
            Add(new AbilityData
            {
                Id = "wind_squire", Name = "Gust Guard",
                Description = "Boost dodge to 50% for 4s. Counters during this time deal 120% ATK. Base 25% dodge chance, counter-attack for 60% ATK + gain 20 mana on dodge.",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.DodgeBuff | AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"dodgeBoost", 0.5f}, {"dodgeDuration", 4f}, {"counterDmgMult", 1.2f}, {"baseDodge", 0.25f}, {"manaOnDodge", 20f} }
            });
            Add(new AbilityData
            {
                Id = "sky_knight", Name = "Aegis Guard",
                Description = "Boost dodge to 50% for 4s. Counters during this time deal 120% ATK. Base 25% dodge chance with improved counter damage.",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.DodgeBuff | AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"dodgeBoost", 0.5f}, {"dodgeDuration", 4f}, {"counterDmgMult", 1.2f}, {"baseDodge", 0.25f} }
            });
            Add(new AbilityData
            {
                Id = "gust_sentinel", Name = "Cyclone Guard",
                Description = "Teleport to target, deal 180% ATK, teleport to random safe location. After ability cast, teleport and gain 25% dodge for 3s.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.Teleport | AbilityFlag.DodgeBuff,
                SpecialParams = new Dictionary<string, float> { {"postDodgeBuff", 0.25f}, {"dodgeDuration", 3f} }
            });
            Add(new AbilityData
            {
                Id = "monsoon_caller", Name = "Tornado",
                Description = "Dash to target, deal 180% ATK. On kill, reset cooldown and recast. Gain stacking buffs on consecutive kills.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.Dash | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"resetOnKill", 1f}, {"stackAtkSpd", 0.12f}, {"stackAtk", 0.08f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "wind_duelist", Name = "Cyclone Slash",
                Description = "Rapid flurry: strike target 5 times, each 80% ATK. Doubled chance to chain hits with improved damage.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 0.8f,
                Flags = AbilityFlag.Chain,
                SpecialParams = new Dictionary<string, float> { {"hitCount", 5f}, {"onAttackDoubleChance", 0.35f} }
            });
            Add(new AbilityData
            {
                Id = "storm_sovereign", Name = "Thunder Cleave",
                Description = "Dash to target, deal 180% ATK. On kill, reset cooldown and recast. Gain stacking buffs on consecutive kills.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.Dash | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"resetOnKill", 1f}, {"stackAtkSpd", 0.12f}, {"stackAtk", 0.08f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "tempest_weaver", Name = "Tempest Strike",
                Description = "Teleport to target, deal 180% ATK, teleport to random safe location. After ability cast, teleport and gain 25% dodge for 3s.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.Teleport | AbilityFlag.DodgeBuff,
                SpecialParams = new Dictionary<string, float> { {"postDodgeBuff", 0.25f}, {"dodgeDuration", 3f} }
            });
            Add(new AbilityData
            {
                Id = "void_wyrm", Name = "Dimensional Rift",
                Description = "PASSIVE: Attacks drain 15 mana from targets. On any ally ability, fire bolt at random enemy.",
                Type = AbilityType.PassiveCast, Targeting = TargetingRule.Random,
                Flags = AbilityFlag.Chain,
                SpecialParams = new Dictionary<string, float> { {"manaDrain", 15f}, {"boltDamagePct", 1.0f} }
            });
        }

        // =====================================================================
        // WIND EVOLVED (11)
        // =====================================================================
        private static void RegisterWindEvolved()
        {
            Add(new AbilityData
            {
                Id = "storm_assassin", Name = "Swift Slash Enhanced",
                Description = "Dash with enhanced damage and faster reset on kills. Gain stacking buffs faster.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.0f,
                Flags = AbilityFlag.Dash | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"resetOnKill", 1f}, {"stackAtkSpd", 0.15f}, {"stackAtk", 0.10f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "gale_sniper", Name = "Pierce Shot Enhanced",
                Description = "Enhanced flurry with more hits and improved damage scaling. Stronger chaining mechanics.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 0.9f,
                Flags = AbilityFlag.Chain,
                SpecialParams = new Dictionary<string, float> { {"hitCount", 6f}, {"onAttackDoubleChance", 0.35f} }
            });
            Add(new AbilityData
            {
                Id = "stormweaver", Name = "Rejuvenating Breeze Enhanced",
                Description = "Enhanced damage with stronger healing and stat steal. Improved lifesteal mechanics.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.Lifesteal,
                SpecialParams = new Dictionary<string, float> { {"selfHealPct", 0.6f}, {"atkStealPct", 0.22f}, {"stealDuration", 5f}, {"ongoingLifesteal", 0.3f} }
            });
            Add(new AbilityData
            {
                Id = "zephyr_warrior", Name = "Gust Guard Enhanced",
                Description = "Enhanced dodge boost with stronger counter damage. Improved counter mechanics.",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.DodgeBuff | AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"dodgeBoost", 0.6f}, {"dodgeDuration", 5f}, {"counterDmgMult", 1.5f}, {"baseDodge", 0.3f}, {"manaOnDodge", 25f} }
            });
            Add(new AbilityData
            {
                Id = "aegis_paladin", Name = "Aegis Guard Enhanced",
                Description = "Enhanced dodge boost with stronger counter damage and shields. Improved protection.",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.DodgeBuff | AbilityFlag.SelfBuff | AbilityFlag.Shield,
                SpecialParams = new Dictionary<string, float> { {"dodgeBoost", 0.6f}, {"dodgeDuration", 5f}, {"counterDmgMult", 1.5f}, {"baseDodge", 0.3f} }
            });
            Add(new AbilityData
            {
                Id = "tempest_guardian", Name = "Cyclone Guard Enhanced",
                Description = "Enhanced teleport with better positioning and stronger dodge buff. Improved escape mechanics.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.0f,
                Flags = AbilityFlag.Teleport | AbilityFlag.DodgeBuff,
                SpecialParams = new Dictionary<string, float> { {"postDodgeBuff", 0.3f}, {"dodgeDuration", 4f} }
            });
            Add(new AbilityData
            {
                Id = "tempest_lord", Name = "Tornado Enhanced",
                Description = "Enhanced dash with stronger damage and faster reset on kills. Gain stacking buffs faster.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.0f,
                Flags = AbilityFlag.Dash | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"resetOnKill", 1f}, {"stackAtkSpd", 0.15f}, {"stackAtk", 0.10f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "hurricane_blade", Name = "Cyclone Slash Enhanced",
                Description = "Enhanced flurry with more hits and improved damage. Stronger chaining mechanics.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 0.9f,
                Flags = AbilityFlag.Chain,
                SpecialParams = new Dictionary<string, float> { {"hitCount", 6f}, {"onAttackDoubleChance", 0.4f} }
            });
            Add(new AbilityData
            {
                Id = "tempest_emperor", Name = "Thunder Cleave Enhanced",
                Description = "Enhanced dash with stronger damage and faster reset. Gain stacking buffs faster.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.0f,
                Flags = AbilityFlag.Dash | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"resetOnKill", 1f}, {"stackAtkSpd", 0.15f}, {"stackAtk", 0.10f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "stormweft_oracle", Name = "Tempest Strike Enhanced",
                Description = "Enhanced teleport with better positioning and stronger damage. Improved escape.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.0f,
                Flags = AbilityFlag.Teleport | AbilityFlag.DodgeBuff,
                SpecialParams = new Dictionary<string, float> { {"postDodgeBuff", 0.3f}, {"dodgeDuration", 4f} }
            });
            Add(new AbilityData
            {
                Id = "dimensional_dragon", Name = "Dimensional Rift Enhanced",
                Description = "PASSIVE: Attacks drain 15 mana with improved potency. On any ally ability, fire stronger bolts at random enemies.",
                Type = AbilityType.PassiveCast, Targeting = TargetingRule.Random,
                Flags = AbilityFlag.Chain,
                SpecialParams = new Dictionary<string, float> { {"manaDrain", 20f}, {"boltDamagePct", 1.5f} }
            });
        }

        // =====================================================================
        // LIGHTNING BASE (11)
        // =====================================================================
        private static void RegisterLightningBase()
        {
            Add(new AbilityData
            {
                Id = "spark_fencer", Name = "Crackle Slash",
                Description = "Strike target, consume all marks for +30% bonus damage per mark consumed. Auto-attacks apply stacking marks (max 5).",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.MarkConsume,
                SpecialParams = new Dictionary<string, float> { {"markBonusPct", 0.3f}, {"maxMarks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "volt_runner", Name = "Volt Dash",
                Description = "Dash to target, deal 180% ATK. On kill, reset cooldown and recast. Gain stacking buffs on consecutive kills.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.Dash | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"resetOnKill", 1f}, {"stackAtkSpd", 0.12f}, {"stackAtk", 0.08f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "thunder_archer", Name = "Lightning Arrow",
                Description = "Massive damage (220% ATK) + splash to 2-cell radius. Apply stun. First cast deals 50% bonus damage. Subsequent casts cost +10 mana.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.2f, AreaRadius = 2,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Stun | AbilityFlag.ConditionBonus,
                SpecialParams = new Dictionary<string, float> { {"stunDuration", 1f}, {"firstCastBonus", 0.5f}, {"subsequentManaCost", 10f} }
            });
            Add(new AbilityData
            {
                Id = "pulse_mender", Name = "Shock Pulse",
                Description = "AoE applying primary stun + splash secondary stun to nearby targets. After applying CC, next attack applies different CC type to same target.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.0f, AreaRadius = 1,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Stun,
                SpecialParams = new Dictionary<string, float> { {"stunDuration", 1.5f}, {"splashStunRadius", 1f} }
            });
            Add(new AbilityData
            {
                Id = "tesla_knight", Name = "Tesla Barrier",
                Description = "Apply Root + Stun + apply 20% vulnerability to 2 nearest enemies for 4s. 35% chance to apply Root + Stun for 1s on attack.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.0f,
                Flags = AbilityFlag.Root | AbilityFlag.Stun | AbilityFlag.Vulnerability,
                SpecialParams = new Dictionary<string, float> { {"targets", 2f}, {"ccDuration", 4f}, {"vulnPct", 0.2f}, {"onAttackChance", 0.35f} }
            });
            Add(new AbilityData
            {
                Id = "shock_mage", Name = "Chain Lightning",
                Description = "Massive damage (220% ATK) + splash to 2-cell radius. Apply stun. First cast deals 50% bonus damage.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.2f, AreaRadius = 2,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Stun | AbilityFlag.ConditionBonus | AbilityFlag.Chain,
                SpecialParams = new Dictionary<string, float> { {"stunDuration", 1f}, {"firstCastBonus", 0.5f} }
            });
            Add(new AbilityData
            {
                Id = "ball_lightning", Name = "Sphere Detonation",
                Description = "Strike target, consume all marks for +30% bonus damage per mark consumed. Auto-attacks apply stacking marks (max 5).",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.MarkConsume,
                SpecialParams = new Dictionary<string, float> { {"markBonusPct", 0.3f}, {"maxMarks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "thunder_warden", Name = "Lightning Prison",
                Description = "Apply Root + Stun + apply 20% vulnerability to 2 nearest enemies for 4s. 35% chance to apply Root + Stun on attack.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.0f,
                Flags = AbilityFlag.Root | AbilityFlag.Stun | AbilityFlag.Vulnerability,
                SpecialParams = new Dictionary<string, float> { {"targets", 2f}, {"ccDuration", 4f}, {"vulnPct", 0.2f}, {"onAttackChance", 0.35f} }
            });
            Add(new AbilityData
            {
                Id = "thunderbird", Name = "Lightning Descent",
                Description = "Dash to target, deal 180% ATK. On kill, reset cooldown and recast. Gain stacking buffs on consecutive kills.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.Dash | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"resetOnKill", 1f}, {"stackAtkSpd", 0.12f}, {"stackAtk", 0.08f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "voltfang_stalker", Name = "Voltfang Rush",
                Description = "Dash to target, deal 180% ATK. On kill, reset cooldown and recast. Gain stacking buffs on consecutive kills.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.Dash | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"resetOnKill", 1f}, {"stackAtkSpd", 0.12f}, {"stackAtk", 0.08f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "storm_dragon", Name = "Cataclysmic Storm",
                Description = "PASSIVE: Aura grants all allies +35% crit chance. Every 6s, strike target for 300% ATK, chains to 3 enemies.",
                Type = AbilityType.PassiveCast, Targeting = TargetingRule.AllAllies,
                Flags = AbilityFlag.Chain | AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"auraCritBonus", 0.35f}, {"strikeInterval", 6f}, {"strikeDamagePct", 3.0f}, {"chainTargets", 3f} }
            });
        }

        // =====================================================================
        // LIGHTNING EVOLVED (11)
        // =====================================================================
        private static void RegisterLightningEvolved()
        {
            Add(new AbilityData
            {
                Id = "arc_duelist", Name = "Crackle Slash Enhanced",
                Description = "Enhanced mark consumption with stronger damage scaling. Improved stacking mechanics.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.0f,
                Flags = AbilityFlag.MarkConsume,
                SpecialParams = new Dictionary<string, float> { {"markBonusPct", 0.35f}, {"maxMarks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "lightning_phantom", Name = "Volt Dash Enhanced",
                Description = "Enhanced dash with stronger damage and faster reset on kills. Gain stacking buffs faster.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.0f,
                Flags = AbilityFlag.Dash | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"resetOnKill", 1f}, {"stackAtkSpd", 0.15f}, {"stackAtk", 0.10f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "storm_archer", Name = "Lightning Arrow Enhanced",
                Description = "Enhanced massive damage with better scaling. Stronger first-cast bonus and splash damage.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.5f, AreaRadius = 2,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Stun | AbilityFlag.ConditionBonus,
                SpecialParams = new Dictionary<string, float> { {"stunDuration", 1.5f}, {"firstCastBonus", 0.6f}, {"subsequentManaCost", 10f} }
            });
            Add(new AbilityData
            {
                Id = "storm_medic", Name = "Shock Pulse Enhanced",
                Description = "Enhanced primary stun and splash secondary stun. Improved CC chaining mechanics.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.2f, AreaRadius = 2,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Stun,
                SpecialParams = new Dictionary<string, float> { {"stunDuration", 2f}, {"splashStunRadius", 2f} }
            });
            Add(new AbilityData
            {
                Id = "storm_bastion", Name = "Tesla Barrier Enhanced",
                Description = "Enhanced lockdown with stronger vulnerability. Improved multi-target potency.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.2f,
                Flags = AbilityFlag.Root | AbilityFlag.Stun | AbilityFlag.Vulnerability,
                SpecialParams = new Dictionary<string, float> { {"targets", 3f}, {"ccDuration", 5f}, {"vulnPct", 0.25f}, {"onAttackChance", 0.40f} }
            });
            Add(new AbilityData
            {
                Id = "tempest_mage", Name = "Chain Lightning Enhanced",
                Description = "Enhanced massive damage with better splash scaling. Stronger first-cast bonus.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.5f, AreaRadius = 2,
                Flags = AbilityFlag.AreaDamage | AbilityFlag.Stun | AbilityFlag.ConditionBonus | AbilityFlag.Chain,
                SpecialParams = new Dictionary<string, float> { {"stunDuration", 1.5f}, {"firstCastBonus", 0.6f} }
            });
            Add(new AbilityData
            {
                Id = "plasma_core", Name = "Sphere Detonation Enhanced",
                Description = "Enhanced mark consumption with stronger damage scaling. Improved AoE detonation.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.0f, AreaRadius = 1,
                Flags = AbilityFlag.MarkConsume | AbilityFlag.AreaDamage,
                SpecialParams = new Dictionary<string, float> { {"markBonusPct", 0.35f}, {"maxMarks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "storm_fortress", Name = "Lightning Prison Enhanced",
                Description = "Enhanced lockdown with stronger vulnerability. Improved range and potency.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.2f,
                Flags = AbilityFlag.Root | AbilityFlag.Stun | AbilityFlag.Vulnerability,
                SpecialParams = new Dictionary<string, float> { {"targets", 3f}, {"ccDuration", 5f}, {"vulnPct", 0.25f}, {"onAttackChance", 0.40f} }
            });
            Add(new AbilityData
            {
                Id = "roc_of_storms", Name = "Lightning Descent Enhanced",
                Description = "Enhanced dash with stronger damage and faster reset. Gain stacking buffs faster.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.0f,
                Flags = AbilityFlag.Dash | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"resetOnKill", 1f}, {"stackAtkSpd", 0.15f}, {"stackAtk", 0.10f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "plasma_ravager", Name = "Voltfang Rush Enhanced",
                Description = "Enhanced dash with stronger damage and faster reset. Gain stacking buffs faster.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.0f,
                Flags = AbilityFlag.Dash | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"resetOnKill", 1f}, {"stackAtkSpd", 0.15f}, {"stackAtk", 0.10f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "thunder_god", Name = "Cataclysmic Storm Enhanced",
                Description = "PASSIVE: Aura grants all allies +50% crit chance. Every 6s, strike for 300% ATK with better scaling, chains to 3 enemies.",
                Type = AbilityType.PassiveCast, Targeting = TargetingRule.AllAllies,
                Flags = AbilityFlag.Chain | AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"auraCritBonus", 0.5f}, {"strikeInterval", 6f}, {"strikeDamagePct", 3.5f}, {"chainTargets", 3f} }
            });
        }

        // =====================================================================
        // FORCE BASE (11)
        // =====================================================================
        private static void RegisterForceBase()
        {
            Add(new AbilityData
            {
                Id = "iron_soldier", Name = "Power Strike",
                Description = "Grant self +50% ATK speed + 30% damage buff for 5s. Reset stacks. Consecutive hits on same target gain stacking +20% damage (max 5 stacks).",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"atkSpdBuff", 0.5f}, {"dmgBuff", 0.3f}, {"buffDuration", 5f}, {"stackDmgPct", 0.2f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "shadow_blade", Name = "Killing Blow",
                Description = "High damage to target, guaranteed crit if below 40% HP. Deal +50% bonus damage to enemies below 40% HP. Refund 30 mana on kill.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.5f,
                Flags = AbilityFlag.ConditionBonus | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"lowHpThreshold", 0.4f}, {"lowHpBonusDmg", 0.5f}, {"manaRefundOnKill", 30f} }
            });
            Add(new AbilityData
            {
                Id = "steel_archer", Name = "Piercing Shot",
                Description = "Grant self +50% ATK speed + 30% damage buff for 5s. Reset stacks. Consecutive hits on same target gain stacking +20% damage (max 5 stacks).",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"atkSpdBuff", 0.5f}, {"dmgBuff", 0.3f}, {"buffDuration", 5f}, {"stackDmgPct", 0.2f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "war_cleric", Name = "Holy Guard",
                Description = "Leap to lowest HP ally, grant Shield (30% max HP), taunt nearby enemies (2s). Redirect 40% of ally damage taken to self.",
                Targeting = TargetingRule.LowestHPAlly,
                Flags = AbilityFlag.Shield | AbilityFlag.Taunt | AbilityFlag.Redirect | AbilityFlag.Dash,
                SpecialParams = new Dictionary<string, float> { {"shieldPct", 0.3f}, {"tauntDuration", 2f}, {"redirectPct", 0.4f} }
            });
            Add(new AbilityData
            {
                Id = "battle_mage", Name = "Force Bolt",
                Description = "Teleport to target, deal 180% ATK, teleport to random safe location. After ability cast, teleport and gain 25% dodge for 3s.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.Teleport | AbilityFlag.DodgeBuff,
                SpecialParams = new Dictionary<string, float> { {"postDodgeBuff", 0.25f}, {"dodgeDuration", 3f} }
            });
            Add(new AbilityData
            {
                Id = "shield_bearer", Name = "Impenetrable Wall",
                Description = "Leap to lowest HP ally, grant Shield (30% max HP), taunt nearby enemies (2s). Redirect 40% of ally damage taken to self.",
                Targeting = TargetingRule.LowestHPAlly,
                Flags = AbilityFlag.Shield | AbilityFlag.Taunt | AbilityFlag.Redirect | AbilityFlag.Dash,
                SpecialParams = new Dictionary<string, float> { {"shieldPct", 0.3f}, {"tauntDuration", 2f}, {"redirectPct", 0.4f} }
            });
            Add(new AbilityData
            {
                Id = "gladiator", Name = "Brutal Barrage",
                Description = "Grant self +50% ATK speed + 30% damage buff for 5s. Reset stacks. Consecutive hits on same target gain stacking +20% damage (max 5 stacks).",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"atkSpdBuff", 0.5f}, {"dmgBuff", 0.3f}, {"buffDuration", 5f}, {"stackDmgPct", 0.2f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "fortress", Name = "Defensive Stance",
                Description = "Grant self massive Shield (60% max HP) + 20% DR buff for 5s. At 50%+ HP, gain +15% DR. Below 30% HP, gain CC immunity.",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.Shield | AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"selfShieldPct", 0.6f}, {"drBuff", 0.2f}, {"drBuffDuration", 5f}, {"highHpDR", 0.15f}, {"ccImmuneThreshold", 0.3f} }
            });
            Add(new AbilityData
            {
                Id = "siege_engineer", Name = "Artillery Strike",
                Description = "Teleport to target, deal 180% ATK, teleport to random safe location. After ability cast, teleport and gain 25% dodge for 3s.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.Teleport | AbilityFlag.DodgeBuff,
                SpecialParams = new Dictionary<string, float> { {"postDodgeBuff", 0.25f}, {"dodgeDuration", 3f} }
            });
            Add(new AbilityData
            {
                Id = "iron_duelist", Name = "Champion's Strike",
                Description = "High damage to target, guaranteed crit if below 40% HP. Deal +50% bonus damage to enemies below 40% HP. Refund 30 mana on kill.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.5f,
                Flags = AbilityFlag.ConditionBonus | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"lowHpThreshold", 0.4f}, {"lowHpBonusDmg", 0.5f}, {"manaRefundOnKill", 30f} }
            });
            Add(new AbilityData
            {
                Id = "titan_lord", Name = "Earthshaker",
                Description = "PASSIVE: Every 7s, toggle between Offensive (+40% ATK/speed) and Defensive (+20% DR, reflect).",
                Type = AbilityType.PassiveCast, Targeting = TargetingRule.Self,
                Flags = AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"toggleInterval", 7f}, {"offensiveAtkBuff", 0.4f}, {"defensiveDR", 0.2f} }
            });
        }

        // =====================================================================
        // FORCE EVOLVED (11)
        // =====================================================================
        private static void RegisterForceEvolved()
        {
            Add(new AbilityData
            {
                Id = "legionnaire", Name = "Power Strike Enhanced",
                Description = "Enhanced ATK speed and damage buff with better scaling. Faster ramping on consecutive hits.",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"atkSpdBuff", 0.6f}, {"dmgBuff", 0.4f}, {"buffDuration", 6f}, {"stackDmgPct", 0.25f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "night_stalker", Name = "Killing Blow Enhanced",
                Description = "High damage to target with enhanced scaling, guaranteed crit if below 40% HP. Stronger bonus damage to low-HP enemies.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.ConditionBonus | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"lowHpThreshold", 0.4f}, {"lowHpBonusDmg", 0.6f}, {"manaRefundOnKill", 30f} }
            });
            Add(new AbilityData
            {
                Id = "ballista_archer", Name = "Piercing Shot Enhanced",
                Description = "Enhanced ATK speed and damage buff with better scaling. Faster ramping on consecutive hits.",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"atkSpdBuff", 0.6f}, {"dmgBuff", 0.4f}, {"buffDuration", 6f}, {"stackDmgPct", 0.25f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "battle_priest", Name = "Holy Guard Enhanced",
                Description = "Leap to lowest HP ally with better shield amount, improved taunt range. Redirect damage with higher potency.",
                Targeting = TargetingRule.LowestHPAlly,
                Flags = AbilityFlag.Shield | AbilityFlag.Taunt | AbilityFlag.Redirect | AbilityFlag.Dash,
                SpecialParams = new Dictionary<string, float> { {"shieldPct", 0.4f}, {"tauntDuration", 3f}, {"redirectPct", 0.5f} }
            });
            Add(new AbilityData
            {
                Id = "force_archmage", Name = "Force Bolt Enhanced",
                Description = "Enhanced teleport with better positioning and stronger damage. Improved escape mechanics.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.0f,
                Flags = AbilityFlag.Teleport | AbilityFlag.DodgeBuff,
                SpecialParams = new Dictionary<string, float> { {"postDodgeBuff", 0.3f}, {"dodgeDuration", 4f} }
            });
            Add(new AbilityData
            {
                Id = "bastion", Name = "Impenetrable Wall Enhanced",
                Description = "Leap to lowest HP ally with better shield amount, improved taunt range. Redirect damage with higher potency.",
                Targeting = TargetingRule.LowestHPAlly,
                Flags = AbilityFlag.Shield | AbilityFlag.Taunt | AbilityFlag.Redirect | AbilityFlag.Dash,
                SpecialParams = new Dictionary<string, float> { {"shieldPct", 0.4f}, {"tauntDuration", 3f}, {"redirectPct", 0.5f} }
            });
            Add(new AbilityData
            {
                Id = "champion", Name = "Brutal Barrage Enhanced",
                Description = "Enhanced ATK speed and damage buff with better scaling. Faster ramping on consecutive hits.",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"atkSpdBuff", 0.6f}, {"dmgBuff", 0.4f}, {"buffDuration", 6f}, {"stackDmgPct", 0.25f}, {"maxStacks", 5f} }
            });
            Add(new AbilityData
            {
                Id = "citadel", Name = "Defensive Stance Enhanced",
                Description = "Enhanced shield and DR with better scaling. Improved threshold effects.",
                Targeting = TargetingRule.Self,
                Flags = AbilityFlag.Shield | AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"selfShieldPct", 0.7f}, {"drBuff", 0.25f}, {"drBuffDuration", 6f}, {"highHpDR", 0.2f}, {"ccImmuneThreshold", 0.35f} }
            });
            Add(new AbilityData
            {
                Id = "war_architect", Name = "Artillery Strike Enhanced",
                Description = "Enhanced teleport with better positioning and stronger damage. Improved escape mechanics.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 2.0f,
                Flags = AbilityFlag.Teleport | AbilityFlag.DodgeBuff,
                SpecialParams = new Dictionary<string, float> { {"postDodgeBuff", 0.3f}, {"dodgeDuration", 4f} }
            });
            Add(new AbilityData
            {
                Id = "warforged_champion", Name = "Champion's Strike Enhanced",
                Description = "High damage to target with enhanced scaling, guaranteed crit if below 40% HP. Stronger finisher.",
                Targeting = TargetingRule.Nearest, DamageMultiplier = 1.8f,
                Flags = AbilityFlag.ConditionBonus | AbilityFlag.ManaRefund,
                SpecialParams = new Dictionary<string, float> { {"lowHpThreshold", 0.4f}, {"lowHpBonusDmg", 0.6f}, {"manaRefundOnKill", 30f} }
            });
            Add(new AbilityData
            {
                Id = "cosmic_titan", Name = "Earthshaker Enhanced",
                Description = "PASSIVE: Every 7s, toggle between Offensive (+60% ATK/speed) and Defensive (+25% DR, reflection).",
                Type = AbilityType.PassiveCast, Targeting = TargetingRule.Self,
                Flags = AbilityFlag.SelfBuff,
                SpecialParams = new Dictionary<string, float> { {"toggleInterval", 7f}, {"offensiveAtkBuff", 0.6f}, {"defensiveDR", 0.25f} }
            });
        }
    }
}
