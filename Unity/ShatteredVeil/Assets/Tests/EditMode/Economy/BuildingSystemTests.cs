using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Economy;

namespace ShatteredVeil.Tests.EditMode.Economy
{
    [TestFixture]
    public class BuildingSystemTests
    {
        private BuildingSystem CreateSystem(int playerLevel = 1, int ve = 10000)
        {
            return new BuildingSystem(new Dictionary<string, int>(), playerLevel, ve);
        }

        // --- BuildingData Tests ---

        [Test]
        public void BuildingData_Has8Buildings()
        {
            Assert.AreEqual(8, BuildingData.All.Length);
        }

        [Test]
        public void BuildingData_GetById_ReturnsCorrectBuilding()
        {
            var def = BuildingData.GetById("attunement_rite");
            Assert.IsNotNull(def);
            Assert.AreEqual("Attunement Rite", def.Name);
            Assert.AreEqual(5, def.MaxLevel);
        }

        [Test]
        public void BuildingData_GetById_ReturnsNullForUnknown()
        {
            Assert.IsNull(BuildingData.GetById("nonexistent"));
        }

        [Test]
        public void BuildingData_SustainedBonds_MatchesGroundTruth()
        {
            var def = BuildingData.GetById("sustained_bonds");
            Assert.AreEqual(1, def.MaxLevel);
            Assert.AreEqual(17, def.PrereqLevel);
            Assert.AreEqual(500, def.UpgradeCosts[1]);
        }

        [Test]
        public void BuildingData_EssenceReservoir_MatchesGroundTruth()
        {
            var def = BuildingData.GetById("essence_reservoir");
            Assert.AreEqual(5, def.MaxLevel);
            Assert.AreEqual(0, def.PrereqLevel);
            Assert.AreEqual(new int[] { 0, 50, 120, 300, 600, 1000 }, def.UpgradeCosts);
        }

        [Test]
        public void BuildingData_PrismFocus_HasPrereqLevel12()
        {
            var def = BuildingData.GetById("prism_focus");
            Assert.AreEqual(12, def.PrereqLevel);
        }

        [Test]
        public void BuildingData_VeilWellspring_HasPrereqLevel15()
        {
            var def = BuildingData.GetById("veil_wellspring");
            Assert.AreEqual(15, def.PrereqLevel);
        }

        [Test]
        public void BuildingData_KindredCircle_HasPrereqLevel10()
        {
            var def = BuildingData.GetById("kindred_circle");
            Assert.AreEqual(10, def.PrereqLevel);
        }

        // --- BuildingSystem: GetLevel ---

        [Test]
        public void GetLevel_DefaultsToZero()
        {
            var sys = CreateSystem();
            Assert.AreEqual(0, sys.GetLevel("attunement_rite"));
        }

        [Test]
        public void GetLevel_ReturnsStoredLevel()
        {
            var levels = new Dictionary<string, int> { { "attunement_rite", 3 } };
            var sys = new BuildingSystem(levels, 1, 1000);
            Assert.AreEqual(3, sys.GetLevel("attunement_rite"));
        }

        // --- BuildingSystem: CanUpgrade ---

        [Test]
        public void CanUpgrade_TrueWhenAffordableAndNotMax()
        {
            var sys = CreateSystem(ve: 100);
            Assert.IsTrue(sys.CanUpgrade("attunement_rite")); // Cost: 80
        }

        [Test]
        public void CanUpgrade_FalseWhenCantAfford()
        {
            var sys = CreateSystem(ve: 10);
            Assert.IsFalse(sys.CanUpgrade("attunement_rite")); // Cost: 80
        }

        [Test]
        public void CanUpgrade_FalseWhenMaxLevel()
        {
            var levels = new Dictionary<string, int> { { "sustained_bonds", 1 } };
            var sys = new BuildingSystem(levels, 17, 10000);
            Assert.IsFalse(sys.CanUpgrade("sustained_bonds")); // Max is 1
        }

        [Test]
        public void CanUpgrade_FalseWhenPrereqNotMet()
        {
            var sys = CreateSystem(playerLevel: 5, ve: 10000);
            Assert.IsFalse(sys.CanUpgrade("prism_focus")); // Prereq: L12
        }

        [Test]
        public void CanUpgrade_TrueWhenPrereqMet()
        {
            var sys = CreateSystem(playerLevel: 12, ve: 10000);
            Assert.IsTrue(sys.CanUpgrade("prism_focus"));
        }

        // --- BuildingSystem: TryUpgrade ---

        [Test]
        public void TryUpgrade_Success_IncrementsLevel()
        {
            var sys = CreateSystem(ve: 200);
            Assert.IsTrue(sys.TryUpgrade("attunement_rite"));
            Assert.AreEqual(1, sys.GetLevel("attunement_rite"));
        }

        [Test]
        public void TryUpgrade_Success_DeductsVE()
        {
            var sys = CreateSystem(ve: 200);
            sys.TryUpgrade("attunement_rite"); // Cost: 80
            Assert.AreEqual(120, sys.GetVeilEssence());
        }

        [Test]
        public void TryUpgrade_Failure_ReturnsFalse()
        {
            var sys = CreateSystem(ve: 10);
            Assert.IsFalse(sys.TryUpgrade("attunement_rite"));
            Assert.AreEqual(0, sys.GetLevel("attunement_rite"));
            Assert.AreEqual(10, sys.GetVeilEssence());
        }

        [Test]
        public void TryUpgrade_FiresEvent()
        {
            var sys = CreateSystem(ve: 200);
            string firedId = null;
            int firedLevel = -1;
            sys.OnBuildingUpgraded += (id, lvl) => { firedId = id; firedLevel = lvl; };

            sys.TryUpgrade("attunement_rite");

            Assert.AreEqual("attunement_rite", firedId);
            Assert.AreEqual(1, firedLevel);
        }

        [Test]
        public void TryUpgrade_MultipleUpgrades_CostsCorrectly()
        {
            var sys = CreateSystem(ve: 10000);
            sys.TryUpgrade("essence_reservoir"); // 50
            Assert.AreEqual(1, sys.GetLevel("essence_reservoir"));
            Assert.AreEqual(9950, sys.GetVeilEssence());

            sys.TryUpgrade("essence_reservoir"); // 120
            Assert.AreEqual(2, sys.GetLevel("essence_reservoir"));
            Assert.AreEqual(9830, sys.GetVeilEssence());

            sys.TryUpgrade("essence_reservoir"); // 300
            Assert.AreEqual(3, sys.GetLevel("essence_reservoir"));
            Assert.AreEqual(9530, sys.GetVeilEssence());
        }

        // --- Bonus Getters ---

        [Test]
        public void GetVeilEssenceMultiplier_Level0_Returns1()
        {
            var sys = CreateSystem();
            Assert.AreEqual(1.0f, sys.GetVeilEssenceMultiplier(), 0.001f);
        }

        [Test]
        public void GetVeilEssenceMultiplier_Level3_Returns1Point15()
        {
            var levels = new Dictionary<string, int> { { "essence_reservoir", 3 } };
            var sys = new BuildingSystem(levels, 1, 0);
            Assert.AreEqual(1.15f, sys.GetVeilEssenceMultiplier(), 0.001f);
        }

        [Test]
        public void GetVeilEssenceMultiplier_Level5_Returns1Point25()
        {
            var levels = new Dictionary<string, int> { { "essence_reservoir", 5 } };
            var sys = new BuildingSystem(levels, 1, 0);
            Assert.AreEqual(1.25f, sys.GetVeilEssenceMultiplier(), 0.001f);
        }

        [Test]
        public void GetMultiRollDiscount_Level0_Returns0()
        {
            var sys = CreateSystem();
            Assert.AreEqual(0, sys.GetMultiRollDiscount());
        }

        [Test]
        public void GetMultiRollDiscount_Level1_Returns50()
        {
            var levels = new Dictionary<string, int> { { "attunement_rite", 1 } };
            var sys = new BuildingSystem(levels, 1, 0);
            Assert.AreEqual(50, sys.GetMultiRollDiscount());
        }

        [Test]
        public void GetMultiRollDiscount_Level3_Returns100()
        {
            var levels = new Dictionary<string, int> { { "attunement_rite", 3 } };
            var sys = new BuildingSystem(levels, 1, 0);
            Assert.AreEqual(100, sys.GetMultiRollDiscount());
        }

        [Test]
        public void GetItemBenchSize_Level0_Returns10()
        {
            var sys = CreateSystem();
            Assert.AreEqual(10, sys.GetItemBenchSize());
        }

        [Test]
        public void GetItemBenchSize_Level5_Returns20()
        {
            var levels = new Dictionary<string, int> { { "essence_reservoir", 5 } };
            var sys = new BuildingSystem(levels, 1, 0);
            Assert.AreEqual(20, sys.GetItemBenchSize());
        }

        [Test]
        public void CanEvolve_Level0_ReturnsFalse()
        {
            var sys = CreateSystem();
            Assert.IsFalse(sys.CanEvolve());
        }

        [Test]
        public void CanEvolve_Level1_ReturnsTrue()
        {
            var levels = new Dictionary<string, int> { { "deep_resonance", 1 } };
            var sys = new BuildingSystem(levels, 1, 0);
            Assert.IsTrue(sys.CanEvolve());
        }

        [Test]
        public void GetEvolutionCostMultiplier_Level0_Returns1()
        {
            var sys = CreateSystem();
            Assert.AreEqual(1.0f, sys.GetEvolutionCostMultiplier(), 0.001f);
        }

        [Test]
        public void GetEvolutionCostMultiplier_Level2_Returns075()
        {
            var levels = new Dictionary<string, int> { { "deep_resonance", 2 } };
            var sys = new BuildingSystem(levels, 1, 0);
            Assert.AreEqual(0.75f, sys.GetEvolutionCostMultiplier(), 0.001f);
        }

        [Test]
        public void GetEvolutionCostMultiplier_Level3_Returns050()
        {
            var levels = new Dictionary<string, int> { { "deep_resonance", 3 } };
            var sys = new BuildingSystem(levels, 1, 0);
            Assert.AreEqual(0.5f, sys.GetEvolutionCostMultiplier(), 0.001f);
        }

        [Test]
        public void GetSustainedBondsTeamBonus_LowLevel_Returns0()
        {
            var levels = new Dictionary<string, int> { { "sustained_bonds", 1 } };
            var sys = new BuildingSystem(levels, 10, 0);
            Assert.AreEqual(0, sys.GetSustainedBondsTeamBonus()); // Player < 17
        }

        [Test]
        public void GetSustainedBondsTeamBonus_HighLevel_Returns1()
        {
            var levels = new Dictionary<string, int> { { "sustained_bonds", 1 } };
            var sys = new BuildingSystem(levels, 17, 0);
            Assert.AreEqual(1, sys.GetSustainedBondsTeamBonus());
        }

        [Test]
        public void GetSustainedBondsTeamBonus_NotBuilt_Returns0()
        {
            var sys = CreateSystem(playerLevel: 17);
            Assert.AreEqual(0, sys.GetSustainedBondsTeamBonus());
        }

        // --- Mana Bonuses ---

        [Test]
        public void GetManaBonuses_Level0_AllDefault()
        {
            var sys = CreateSystem();
            var bonuses = sys.GetManaBonuses();
            Assert.AreEqual(0, bonuses.StartingMana);
            Assert.AreEqual(1.0f, bonuses.ManaGenMultiplier, 0.001f);
            Assert.AreEqual(1.0f, bonuses.AbilityDamageMultiplier, 0.001f);
            Assert.AreEqual(0f, bonuses.FirstCastDiscount, 0.001f);
            Assert.AreEqual(0f, bonuses.FullManaAtkBonus, 0.001f);
        }

        [Test]
        public void GetManaBonuses_Level5_AllActive()
        {
            var levels = new Dictionary<string, int> { { "veil_wellspring", 5 } };
            var sys = new BuildingSystem(levels, 15, 0);
            var bonuses = sys.GetManaBonuses();
            Assert.AreEqual(5, bonuses.StartingMana);
            Assert.AreEqual(1.10f, bonuses.ManaGenMultiplier, 0.001f);
            Assert.AreEqual(1.05f, bonuses.AbilityDamageMultiplier, 0.001f);
            Assert.AreEqual(0.10f, bonuses.FirstCastDiscount, 0.001f);
            Assert.AreEqual(0.10f, bonuses.FullManaAtkBonus, 0.001f);
        }

        // --- Bond Bonuses ---

        [Test]
        public void GetBondBonuses_Level0_AllDefault()
        {
            var sys = CreateSystem();
            var bonuses = sys.GetBondBonuses();
            Assert.IsFalse(bonuses.CanViewBonds);
            Assert.AreEqual(1.0f, bonuses.BondBonusMultiplier, 0.001f);
            Assert.IsFalse(bonuses.BondQuestsUnlocked);
            Assert.IsFalse(bonuses.TrioBondsUnlocked);
        }

        [Test]
        public void GetBondBonuses_Level2_Has125Mult()
        {
            var levels = new Dictionary<string, int> { { "kindred_circle", 2 } };
            var sys = new BuildingSystem(levels, 10, 0);
            var bonuses = sys.GetBondBonuses();
            Assert.IsTrue(bonuses.CanViewBonds);
            Assert.AreEqual(1.25f, bonuses.BondBonusMultiplier, 0.001f);
        }

        [Test]
        public void GetBondBonuses_Level4_Has150Mult()
        {
            var levels = new Dictionary<string, int> { { "kindred_circle", 4 } };
            var sys = new BuildingSystem(levels, 10, 0);
            var bonuses = sys.GetBondBonuses();
            Assert.AreEqual(1.50f, bonuses.BondBonusMultiplier, 0.001f);
        }

        [Test]
        public void GetBondBonuses_Level5_TrioBondsUnlocked()
        {
            var levels = new Dictionary<string, int> { { "kindred_circle", 5 } };
            var sys = new BuildingSystem(levels, 10, 0);
            var bonuses = sys.GetBondBonuses();
            Assert.IsTrue(bonuses.TrioBondsUnlocked);
        }

        // --- Gem Capabilities ---

        [Test]
        public void GetGemCapabilities_Level0_AllFalse()
        {
            var sys = CreateSystem();
            var caps = sys.GetGemCapabilities();
            Assert.IsFalse(caps.CanSocket);
            Assert.IsFalse(caps.CanCombine);
            Assert.IsFalse(caps.CanRemove);
            Assert.IsFalse(caps.CanTransmute);
            Assert.IsFalse(caps.CanAutoSocket);
            Assert.IsFalse(caps.CanPrismaticForge);
        }

        [Test]
        public void GetGemCapabilities_Level5_AllTrue()
        {
            var levels = new Dictionary<string, int> { { "prism_focus", 5 } };
            var sys = new BuildingSystem(levels, 12, 0);
            var caps = sys.GetGemCapabilities();
            Assert.IsTrue(caps.CanSocket);
            Assert.IsTrue(caps.CanCombine);
            Assert.IsTrue(caps.CanRemove);
            Assert.IsTrue(caps.CanTransmute);
            Assert.IsTrue(caps.CanAutoSocket);
            Assert.IsTrue(caps.CanPrismaticForge);
        }

        // --- HasDetailPanel ---

        [Test]
        public void HasDetailPanel_AttunementRite_AlwaysFalse()
        {
            var sys = CreateSystem();
            Assert.IsFalse(sys.HasDetailPanel("attunement_rite"));
        }

        [Test]
        public void HasDetailPanel_DeepResonance_FalseAtLevel0()
        {
            var sys = CreateSystem();
            Assert.IsFalse(sys.HasDetailPanel("deep_resonance"));
        }

        [Test]
        public void HasDetailPanel_DeepResonance_TrueAtLevel1()
        {
            var levels = new Dictionary<string, int> { { "deep_resonance", 1 } };
            var sys = new BuildingSystem(levels, 1, 0);
            Assert.IsTrue(sys.HasDetailPanel("deep_resonance"));
        }

        [Test]
        public void HasDetailPanel_VeilWellspring_AlwaysTrue()
        {
            var sys = CreateSystem();
            Assert.IsTrue(sys.HasDetailPanel("veil_wellspring"));
        }

        // --- GetAllLevels ---

        [Test]
        public void GetAllLevels_ReturnsCopy()
        {
            var levels = new Dictionary<string, int> { { "attunement_rite", 2 } };
            var sys = new BuildingSystem(levels, 1, 0);
            var copy = sys.GetAllLevels();
            copy["attunement_rite"] = 99;
            Assert.AreEqual(2, sys.GetLevel("attunement_rite"));
        }

        // --- Effect text ---

        [Test]
        public void GetEffect_ReturnsCorrectText()
        {
            var sys = CreateSystem(ve: 1000);
            sys.TryUpgrade("attunement_rite");
            Assert.AreEqual("Multi-rite: 10x for 450 VE (10% discount)", sys.GetEffect("attunement_rite"));
        }

        // --- Prereq locking ---

        [Test]
        public void IsPrereqLocked_ReturnsTrueForLowLevel()
        {
            var sys = CreateSystem(playerLevel: 5);
            Assert.IsTrue(sys.IsPrereqLocked("veil_wellspring")); // Prereq: L15
        }

        [Test]
        public void IsPrereqLocked_ReturnsFalseForHighLevel()
        {
            var sys = CreateSystem(playerLevel: 15);
            Assert.IsFalse(sys.IsPrereqLocked("veil_wellspring"));
        }

        [Test]
        public void IsPrereqLocked_NoPrereq_ReturnsFalse()
        {
            var sys = CreateSystem(playerLevel: 1);
            Assert.IsFalse(sys.IsPrereqLocked("attunement_rite"));
        }
    }
}
