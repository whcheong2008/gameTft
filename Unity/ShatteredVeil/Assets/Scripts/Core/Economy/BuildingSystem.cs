using System;
using System.Collections.Generic;

namespace ShatteredVeil.Core.Economy
{
    /// <summary>
    /// Pure C# building upgrade logic and bonus getters.
    /// Mirrors js/hub.js: getBuildingLevel, canUpgradeBuilding, upgradeBuilding, bonus getters.
    /// No Unity dependencies — fully unit-testable.
    /// </summary>
    public class BuildingSystem
    {
        private readonly Dictionary<string, int> buildingLevels;
        private int playerLevel;
        private int veilEssence;

        public event Action<string, int> OnBuildingUpgraded;

        public BuildingSystem(Dictionary<string, int> initialLevels, int playerLevel, int veilEssence)
        {
            this.buildingLevels = initialLevels ?? new Dictionary<string, int>();
            this.playerLevel = playerLevel;
            this.veilEssence = veilEssence;
        }

        public void SetPlayerLevel(int level) => playerLevel = level;
        public int GetPlayerLevel() => playerLevel;
        public void SetVeilEssence(int ve) => veilEssence = ve;
        public int GetVeilEssence() => veilEssence;

        public int GetLevel(string buildingId)
        {
            return buildingLevels.TryGetValue(buildingId, out int level) ? level : 0;
        }

        public int GetUpgradeCost(string buildingId)
        {
            var def = BuildingData.GetById(buildingId);
            if (def == null) return int.MaxValue;
            return def.GetUpgradeCost(GetLevel(buildingId));
        }

        public string GetEffect(string buildingId)
        {
            var def = BuildingData.GetById(buildingId);
            if (def == null) return "";
            return def.GetEffect(GetLevel(buildingId));
        }

        public bool IsPrereqLocked(string buildingId)
        {
            var def = BuildingData.GetById(buildingId);
            if (def == null) return true;
            return !def.IsPrereqMet(playerLevel);
        }

        public bool IsMaxLevel(string buildingId)
        {
            var def = BuildingData.GetById(buildingId);
            if (def == null) return true;
            return GetLevel(buildingId) >= def.MaxLevel;
        }

        public bool CanUpgrade(string buildingId)
        {
            var def = BuildingData.GetById(buildingId);
            if (def == null) return false;

            int level = GetLevel(buildingId);
            if (level >= def.MaxLevel) return false;
            if (!def.IsPrereqMet(playerLevel)) return false;

            int cost = def.GetUpgradeCost(level);
            return veilEssence >= cost;
        }

        /// <summary>
        /// Attempts to upgrade a building. Returns true on success, false on failure.
        /// Deducts VE on success.
        /// </summary>
        public bool TryUpgrade(string buildingId)
        {
            if (!CanUpgrade(buildingId)) return false;

            var def = BuildingData.GetById(buildingId);
            int level = GetLevel(buildingId);
            int cost = def.GetUpgradeCost(level);

            veilEssence -= cost;
            buildingLevels[buildingId] = level + 1;

            OnBuildingUpgraded?.Invoke(buildingId, level + 1);
            return true;
        }

        /// <summary>
        /// Returns a snapshot of all building levels for serialization.
        /// </summary>
        public Dictionary<string, int> GetAllLevels()
        {
            return new Dictionary<string, int>(buildingLevels);
        }

        // --- Bonus Getters (mirrors js/hub.js) ---

        /// <summary>VE multiplier from Essence Reservoir: 1.0 + level * 0.05</summary>
        public float GetVeilEssenceMultiplier()
        {
            return 1.0f + GetLevel("essence_reservoir") * 0.05f;
        }

        /// <summary>Multi-roll discount from Attunement Rite.</summary>
        public int GetMultiRollDiscount()
        {
            int level = GetLevel("attunement_rite");
            if (level >= 3) return 100;  // 400 VE instead of 500
            if (level >= 2) return 80;   // 420 VE
            if (level >= 1) return 50;   // 450 VE
            return 0;
        }

        /// <summary>Item bench size from Essence Reservoir: 10 base + 2 per level.</summary>
        public int GetItemBenchSize()
        {
            return 10 + GetLevel("essence_reservoir") * 2;
        }

        /// <summary>Whether evolution is unlocked (Deep Resonance >= 1).</summary>
        public bool CanEvolve()
        {
            return GetLevel("deep_resonance") >= 1;
        }

        /// <summary>Evolution cost discount multiplier from Deep Resonance.</summary>
        public float GetEvolutionCostMultiplier()
        {
            int level = GetLevel("deep_resonance");
            if (level >= 3) return 0.5f;
            if (level >= 2) return 0.75f;
            return 1.0f;
        }

        /// <summary>Sustained Bonds team size bonus (+1 at L17 if building level >= 1).</summary>
        public int GetSustainedBondsTeamBonus()
        {
            if (playerLevel < 17) return 0;
            return GetLevel("sustained_bonds") >= 1 ? 1 : 0;
        }

        /// <summary>Mana Shrine (Veil Wellspring) bonuses.</summary>
        public ManaBonuses GetManaBonuses()
        {
            int level = GetLevel("veil_wellspring");
            return new ManaBonuses
            {
                StartingMana = level >= 1 ? 5 : 0,
                ManaGenMultiplier = level >= 2 ? 1.10f : 1.0f,
                AbilityDamageMultiplier = level >= 3 ? 1.05f : 1.0f,
                FirstCastDiscount = level >= 4 ? 0.10f : 0f,
                FullManaAtkBonus = level >= 5 ? 0.10f : 0f
            };
        }

        /// <summary>Bond Hall (Kindred Circle) bonuses.</summary>
        public BondBonuses GetBondBonuses()
        {
            int level = GetLevel("kindred_circle");
            return new BondBonuses
            {
                CanViewBonds = level >= 1,
                BondBonusMultiplier = level >= 4 ? 1.50f : (level >= 2 ? 1.25f : 1.0f),
                BondQuestsUnlocked = level >= 3,
                TrioBondsUnlocked = level >= 5
            };
        }

        /// <summary>Gem Workshop (Prism Focus) capabilities.</summary>
        public GemCapabilities GetGemCapabilities()
        {
            int level = GetLevel("prism_focus");
            return new GemCapabilities
            {
                CanSocket = level >= 1,
                CanCombine = level >= 2,
                CanRemove = level >= 2,
                CanTransmute = level >= 3,
                CanAutoSocket = level >= 4,
                CanPrismaticForge = level >= 5
            };
        }

        /// <summary>Whether building has a detail panel (not just upgrade-on-click).</summary>
        public bool HasDetailPanel(string buildingId)
        {
            int level = GetLevel(buildingId);
            switch (buildingId)
            {
                case "deep_resonance": return level >= 1;
                case "echo_shaping": return level >= 1;
                case "prism_focus": return true;
                case "veil_wellspring": return true;
                case "kindred_circle": return true;
                default: return false;
            }
        }
    }

    public struct ManaBonuses
    {
        public int StartingMana;
        public float ManaGenMultiplier;
        public float AbilityDamageMultiplier;
        public float FirstCastDiscount;
        public float FullManaAtkBonus;
    }

    public struct BondBonuses
    {
        public bool CanViewBonds;
        public float BondBonusMultiplier;
        public bool BondQuestsUnlocked;
        public bool TrioBondsUnlocked;
    }

    public struct GemCapabilities
    {
        public bool CanSocket;
        public bool CanCombine;
        public bool CanRemove;
        public bool CanTransmute;
        public bool CanAutoSocket;
        public bool CanPrismaticForge;
    }
}
