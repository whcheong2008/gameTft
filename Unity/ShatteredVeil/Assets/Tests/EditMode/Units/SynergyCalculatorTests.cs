using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Units;

namespace ShatteredVeil.Tests.EditMode.Units
{
    [TestFixture]
    public class SynergyCalculatorTests
    {
        private class MockUnit : IUnitData
        {
            public string UnitId { get; set; }
            public string Name { get; set; }
            public string Element { get; set; }
            public string Archetype { get; set; }
            public int Tier { get; set; }
            public int BaseHP { get; set; }
            public int BaseATK { get; set; }
            public int BaseDEF { get; set; }
            public float BaseAtkSpeed { get; set; }
            public int BaseSPD { get; set; }
            public int BaseMana { get; set; }
            public float BaseCritRate { get; set; }
            public float BaseCritDmg { get; set; }
            public bool IsEvolved { get; set; }
        }

        private class MockSynergy : ISynergyDefinition
        {
            public string SynergyId { get; set; }
            public SynergyType Type { get; set; }
            public int[] Thresholds { get; set; }
            public string[] TierDescriptions { get; set; }
        }

        [SetUp]
        public void Setup()
        {
            SynergyCalculator.ClearAll();

            // Fire element synergy: thresholds [2, 4, 7, 10]
            SynergyCalculator.RegisterSynergy(new MockSynergy
            {
                SynergyId = "fire",
                Type = SynergyType.Element,
                Thresholds = new[] { 2, 4, 7, 10 },
                TierDescriptions = new[]
                {
                    "Attacks apply Burn (10 DPS, 3s)",
                    "Burn 20 DPS. On kill, enemy explodes for 15% max HP to adjacent",
                    "Burn 35 DPS, 5s. Fire abilities apply Burn. Fire units +20% ATK",
                    "Prismatic: Conflagration"
                }
            });

            // Water element synergy
            SynergyCalculator.RegisterSynergy(new MockSynergy
            {
                SynergyId = "water",
                Type = SynergyType.Element,
                Thresholds = new[] { 2, 4, 7, 10 },
                TierDescriptions = new[]
                {
                    "Enemy attack speed -15%",
                    "Enemy attack speed -25%. Allies heal 1.5% max HP/s",
                    "Enemy attack speed -40%. Heal 3%/s",
                    "Prismatic: Absolute Zero"
                }
            });

            // Vanguard archetype synergy: thresholds [2, 4, 6, 8]
            SynergyCalculator.RegisterSynergy(new MockSynergy
            {
                SynergyId = "vanguard",
                Type = SynergyType.Archetype,
                Thresholds = new[] { 2, 4, 6, 8 },
                TierDescriptions = new[]
                {
                    "Vanguards +200 HP +20 ATK (x2 if front row)",
                    "Vanguards +400 HP +35 ATK (x2 front). +15% dmg first 5s",
                    "Vanguards +650 HP +55 ATK (x2 front). Charge +25% dmg. 12% lifesteal",
                    "Vanguards +950 HP +80 ATK (x2 front). Charge +40%"
                }
            });

            // Duelist archetype synergy
            SynergyCalculator.RegisterSynergy(new MockSynergy
            {
                SynergyId = "duelist",
                Type = SynergyType.Archetype,
                Thresholds = new[] { 2, 4, 6, 8 },
                TierDescriptions = new[]
                {
                    "Duelists 15% double-strike",
                    "Duelists 30% double-strike, 10% lifesteal",
                    "Duelists 40% double-strike, 15% lifesteal, can't miss",
                    "Duelists 55% double-strike"
                }
            });

            // Guardian archetype synergy
            SynergyCalculator.RegisterSynergy(new MockSynergy
            {
                SynergyId = "guardian",
                Type = SynergyType.Archetype,
                Thresholds = new[] { 2, 4, 6, 8 },
                TierDescriptions = new[]
                {
                    "Guardians +250 HP +5% DR",
                    "Guardians +550 HP +10% DR",
                    "Guardians +900 HP +15% DR",
                    "Guardians +1300 HP +20% DR"
                }
            });

            // Predator archetype synergy
            SynergyCalculator.RegisterSynergy(new MockSynergy
            {
                SynergyId = "predator",
                Type = SynergyType.Archetype,
                Thresholds = new[] { 2, 4, 6, 8 },
                TierDescriptions = new[]
                {
                    "Predators +25% ATK spd",
                    "Predators +40% ATK spd",
                    "Predators +55% ATK spd",
                    "Predators +70% ATK spd"
                }
            });
        }

        [TearDown]
        public void TearDown()
        {
            SynergyCalculator.ClearAll();
        }

        // --- Empty team ---

        [Test]
        public void EmptyTeam_ReturnsNoSynergies()
        {
            var result = SynergyCalculator.CalculateSynergies(new List<IUnitData>());
            Assert.AreEqual(0, result.Count);
        }

        [Test]
        public void NullTeam_ReturnsNoSynergies()
        {
            var result = SynergyCalculator.CalculateSynergies(null);
            Assert.AreEqual(0, result.Count);
        }

        // --- 2 Flame units → Fire synergy tier 1 ---

        [Test]
        public void TwoFlameUnits_FireSynergyTier1Active()
        {
            var team = new List<IUnitData>
            {
                new MockUnit { UnitId = "flame_warrior", Element = "Fire", Archetype = "Duelist", Tier = 1 },
                new MockUnit { UnitId = "ember_scout", Element = "Fire", Archetype = "Predator", Tier = 1 }
            };

            var result = SynergyCalculator.CalculateSynergies(team);
            var fireSynergy = result.Find(s => s.SynergyId == "fire");

            Assert.IsNotNull(fireSynergy);
            Assert.AreEqual(0, fireSynergy.ActiveTierIndex); // Tier 1 = index 0
            Assert.AreEqual(2, fireSynergy.CurrentCount);
            Assert.AreEqual("Attacks apply Burn (10 DPS, 3s)", fireSynergy.Description);
        }

        // --- 4 Flame units → Fire synergy tier 2 ---

        [Test]
        public void FourFlameUnits_FireSynergyTier2Active()
        {
            var team = new List<IUnitData>
            {
                new MockUnit { UnitId = "u1", Element = "Fire", Archetype = "Duelist", Tier = 1 },
                new MockUnit { UnitId = "u2", Element = "Fire", Archetype = "Predator", Tier = 1 },
                new MockUnit { UnitId = "u3", Element = "Fire", Archetype = "Ranger", Tier = 1 },
                new MockUnit { UnitId = "u4", Element = "Fire", Archetype = "Guardian", Tier = 2 }
            };

            var result = SynergyCalculator.CalculateSynergies(team);
            var fireSynergy = result.Find(s => s.SynergyId == "fire");

            Assert.IsNotNull(fireSynergy);
            Assert.AreEqual(1, fireSynergy.ActiveTierIndex); // Tier 2 = index 1
            Assert.AreEqual(4, fireSynergy.CurrentCount);
        }

        // --- 2 Vanguard + 3 Duelist → both synergies active ---

        [Test]
        public void TwoVanguardThreeDuelist_BothSynergiesActive()
        {
            var team = new List<IUnitData>
            {
                new MockUnit { UnitId = "u1", Element = "Fire", Archetype = "Vanguard", Tier = 1 },
                new MockUnit { UnitId = "u2", Element = "Water", Archetype = "Vanguard", Tier = 1 },
                new MockUnit { UnitId = "u3", Element = "Earth", Archetype = "Duelist", Tier = 1 },
                new MockUnit { UnitId = "u4", Element = "Wind", Archetype = "Duelist", Tier = 1 },
                new MockUnit { UnitId = "u5", Element = "Lightning", Archetype = "Duelist", Tier = 1 }
            };

            var result = SynergyCalculator.CalculateSynergies(team);
            var vanguardSynergy = result.Find(s => s.SynergyId == "vanguard");
            var duelistSynergy = result.Find(s => s.SynergyId == "duelist");

            Assert.IsNotNull(vanguardSynergy, "Vanguard synergy should be active");
            Assert.AreEqual(0, vanguardSynergy.ActiveTierIndex); // 2 vanguards = tier 1 (index 0)
            Assert.AreEqual(2, vanguardSynergy.CurrentCount);

            Assert.IsNotNull(duelistSynergy, "Duelist synergy should be active");
            Assert.AreEqual(0, duelistSynergy.ActiveTierIndex); // 3 duelists ≥ 2 threshold = tier 1 (index 0)
            Assert.AreEqual(3, duelistSynergy.CurrentCount);
        }

        // --- 1 Fire unit → no Fire synergy (below threshold) ---

        [Test]
        public void OneFlameUnit_NoFireSynergy()
        {
            var team = new List<IUnitData>
            {
                new MockUnit { UnitId = "flame_warrior", Element = "Fire", Archetype = "Duelist", Tier = 1 }
            };

            var result = SynergyCalculator.CalculateSynergies(team);
            var fireSynergy = result.Find(s => s.SynergyId == "fire");
            Assert.IsNull(fireSynergy);
        }

        // --- Evolved T5 counts as 2 for element ---

        [Test]
        public void EvolvedT5_CountsAs2ForElement()
        {
            var team = new List<IUnitData>
            {
                new MockUnit { UnitId = "phoenix_reborn", Element = "Fire", Archetype = "Guardian", Tier = 5, IsEvolved = true }
            };

            var result = SynergyCalculator.CalculateSynergies(team);
            var fireSynergy = result.Find(s => s.SynergyId == "fire");

            Assert.IsNotNull(fireSynergy, "Evolved T5 should count as 2 Fire units");
            Assert.AreEqual(2, fireSynergy.CurrentCount);
            Assert.AreEqual(0, fireSynergy.ActiveTierIndex);
        }

        // --- Synergy tier matching: exactly at threshold ---

        [Test]
        public void ExactlyAtHigherThreshold_ActivatesCorrectTier()
        {
            // 7 fire units → should activate tier 3 (index 2)
            var team = new List<IUnitData>();
            for (int i = 0; i < 7; i++)
            {
                team.Add(new MockUnit { UnitId = "u" + i, Element = "Fire", Archetype = "Duelist", Tier = 1 });
            }

            var result = SynergyCalculator.CalculateSynergies(team);
            var fireSynergy = result.Find(s => s.SynergyId == "fire");

            Assert.IsNotNull(fireSynergy);
            Assert.AreEqual(2, fireSynergy.ActiveTierIndex); // 7 = threshold[2]
            Assert.AreEqual(7, fireSynergy.CurrentCount);
        }
    }
}
