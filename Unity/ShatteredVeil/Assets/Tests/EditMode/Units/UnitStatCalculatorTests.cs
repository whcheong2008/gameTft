using NUnit.Framework;
using ShatteredVeil.Core.Units;

namespace ShatteredVeil.Tests.EditMode.Units
{
    [TestFixture]
    public class UnitStatCalculatorTests
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

        private MockUnit _flameWarrior;
        private MockUnit _emberScout;
        private MockUnit _magmaKnight;
        private MockUnit _tideHunter;
        private MockUnit _stoneGuard;
        private MockUnit _zephyrScout;

        [SetUp]
        public void Setup()
        {
            _flameWarrior = new MockUnit
            {
                UnitId = "flame_warrior", Name = "Flame Warrior",
                Element = "Fire", Archetype = "Duelist",
                Tier = 1, BaseHP = 600, BaseATK = 50, BaseDEF = 0, BaseSPD = 0,
                BaseAtkSpeed = 0.85f, BaseMana = 65
            };
            _emberScout = new MockUnit
            {
                UnitId = "ember_scout", Name = "Ember Scout",
                Element = "Fire", Archetype = "Predator",
                Tier = 1, BaseHP = 390, BaseATK = 46, BaseDEF = 0, BaseSPD = 0,
                BaseAtkSpeed = 0.5f, BaseMana = 45
            };
            _magmaKnight = new MockUnit
            {
                UnitId = "magma_knight", Name = "Magma Knight",
                Element = "Fire", Archetype = "Guardian",
                Tier = 2, BaseHP = 880, BaseATK = 35, BaseDEF = 0, BaseSPD = 0,
                BaseAtkSpeed = 1.0f, BaseMana = 85
            };
            _tideHunter = new MockUnit
            {
                UnitId = "tide_hunter", Name = "Tide Hunter",
                Element = "Water", Archetype = "Vanguard",
                Tier = 1, BaseHP = 580, BaseATK = 48, BaseDEF = 0, BaseSPD = 0,
                BaseAtkSpeed = 0.8f, BaseMana = 60
            };
            _stoneGuard = new MockUnit
            {
                UnitId = "stone_guard", Name = "Stone Guard",
                Element = "Earth", Archetype = "Guardian",
                Tier = 1, BaseHP = 750, BaseATK = 30, BaseDEF = 0, BaseSPD = 0,
                BaseAtkSpeed = 1.0f, BaseMana = 80
            };
            _zephyrScout = new MockUnit
            {
                UnitId = "zephyr_scout", Name = "Zephyr Scout",
                Element = "Wind", Archetype = "Predator",
                Tier = 1, BaseHP = 400, BaseATK = 42, BaseDEF = 0, BaseSPD = 0,
                BaseAtkSpeed = 0.45f, BaseMana = 45
            };
        }

        // --- Star multiplier tests ---

        [Test]
        public void StarMultiplier_Star1_Returns1()
        {
            Assert.AreEqual(1.0, UnitStatCalculator.GetStarMultiplier(1), 0.001);
        }

        [Test]
        public void StarMultiplier_Star2_Returns1Point4()
        {
            Assert.AreEqual(1.4, UnitStatCalculator.GetStarMultiplier(2), 0.001);
        }

        [Test]
        public void StarMultiplier_Star3_Returns1Point8()
        {
            Assert.AreEqual(1.8, UnitStatCalculator.GetStarMultiplier(3), 0.001);
        }

        [Test]
        public void StarMultiplier_Star5_Returns2Point8()
        {
            Assert.AreEqual(2.8, UnitStatCalculator.GetStarMultiplier(5), 0.001);
        }

        // --- Flame Warrior star 1 ---

        [Test]
        public void FlameWarrior_Star1_HP600()
        {
            Assert.AreEqual(600, UnitStatCalculator.CalculateHP(_flameWarrior, 1));
        }

        [Test]
        public void FlameWarrior_Star1_ATK50()
        {
            Assert.AreEqual(50, UnitStatCalculator.CalculateATK(_flameWarrior, 1));
        }

        // --- Flame Warrior star 5 ---

        [Test]
        public void FlameWarrior_Star5_HP()
        {
            // floor(600 * 2.8) = floor(1680) = 1680
            Assert.AreEqual(1680, UnitStatCalculator.CalculateHP(_flameWarrior, 5));
        }

        [Test]
        public void FlameWarrior_Star5_ATK()
        {
            // floor(50 * 2.8) = floor(140) = 140
            Assert.AreEqual(140, UnitStatCalculator.CalculateATK(_flameWarrior, 5));
        }

        // --- Flame Warrior star 3 ---

        [Test]
        public void FlameWarrior_Star3_HP()
        {
            // floor(600 * 1.8) = floor(1080) = 1080
            Assert.AreEqual(1080, UnitStatCalculator.CalculateHP(_flameWarrior, 3));
        }

        [Test]
        public void FlameWarrior_Star3_ATK()
        {
            // floor(50 * 1.8) = floor(90) = 90
            Assert.AreEqual(90, UnitStatCalculator.CalculateATK(_flameWarrior, 3));
        }

        // --- Sample units (one per element) at star 1 ---

        [Test]
        public void EmberScout_Star1_HP390()
        {
            Assert.AreEqual(390, UnitStatCalculator.CalculateHP(_emberScout, 1));
        }

        [Test]
        public void MagmaKnight_Star1_HP880()
        {
            Assert.AreEqual(880, UnitStatCalculator.CalculateHP(_magmaKnight, 1));
        }

        [Test]
        public void TideHunter_Star1_HP580()
        {
            Assert.AreEqual(580, UnitStatCalculator.CalculateHP(_tideHunter, 1));
        }

        [Test]
        public void StoneGuard_Star1_HP750()
        {
            Assert.AreEqual(750, UnitStatCalculator.CalculateHP(_stoneGuard, 1));
        }

        [Test]
        public void ZephyrScout_Star1_HP400()
        {
            Assert.AreEqual(400, UnitStatCalculator.CalculateHP(_zephyrScout, 1));
        }

        // --- Sample units at star 3 ---

        [Test]
        public void TideHunter_Star3_HP()
        {
            // floor(580 * 1.8) = floor(1044) = 1044
            Assert.AreEqual(1044, UnitStatCalculator.CalculateHP(_tideHunter, 3));
        }

        [Test]
        public void StoneGuard_Star3_HP()
        {
            // floor(750 * 1.8) = floor(1350) = 1350
            Assert.AreEqual(1350, UnitStatCalculator.CalculateHP(_stoneGuard, 3));
        }

        [Test]
        public void ZephyrScout_Star3_ATK()
        {
            // floor(42 * 1.8) = floor(75.6) = 75
            Assert.AreEqual(75, UnitStatCalculator.CalculateATK(_zephyrScout, 3));
        }

    }
}
