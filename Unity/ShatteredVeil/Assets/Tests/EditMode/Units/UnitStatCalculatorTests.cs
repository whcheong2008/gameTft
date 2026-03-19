using NUnit.Framework;
using ShatteredVeil.Core.Combat;
using ShatteredVeil.Core.Units;

namespace ShatteredVeil.Tests.EditMode.Units
{
    [TestFixture]
    public class UnitStatCalculatorTests
    {
        private class MockUnit : IUnitData
        {
            public string UnitId { get; set; }
            public string DisplayName { get; set; }
            public Element Element { get; set; }
            public Archetype Archetype { get; set; }
            public Archetype? SecondaryArchetype { get; set; }
            public int Tier { get; set; }
            public int BaseHP { get; set; }
            public int BaseATK { get; set; }
            public int BaseDEF { get; set; }
            public int BaseSPD { get; set; }
            public float BaseAttackSpeed { get; set; }
            public float BaseCritChance { get; set; }
            public float BaseCritDamage { get; set; }
            public int MaxMana { get; set; }
            public int AttackRange { get; set; }
            public float MoveSpeed { get; set; }
            public string AbilityId { get; set; }
            public string PassiveId { get; set; }
            public string EvolvedFromId { get; set; }
            public string EvolvesIntoId { get; set; }
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
                UnitId = "flame_warrior", DisplayName = "Flame Warrior",
                Element = Element.Fire, Archetype = Archetype.Duelist,
                SecondaryArchetype = Archetype.Vanguard,
                Tier = 1, BaseHP = 600, BaseATK = 50, BaseDEF = 0, BaseSPD = 0,
                BaseAttackSpeed = 0.85f, MaxMana = 65, AttackRange = 1, MoveSpeed = 1.9f,
                EvolvesIntoId = "fire_berserker"
            };
            _emberScout = new MockUnit
            {
                UnitId = "ember_scout", DisplayName = "Ember Scout",
                Element = Element.Fire, Archetype = Archetype.Predator,
                Tier = 1, BaseHP = 390, BaseATK = 46, BaseDEF = 0, BaseSPD = 0,
                BaseAttackSpeed = 0.5f, MaxMana = 45, AttackRange = 1, MoveSpeed = 3.9f,
                EvolvesIntoId = "flame_rogue"
            };
            _magmaKnight = new MockUnit
            {
                UnitId = "magma_knight", DisplayName = "Magma Knight",
                Element = Element.Fire, Archetype = Archetype.Guardian,
                Tier = 2, BaseHP = 880, BaseATK = 35, BaseDEF = 0, BaseSPD = 0,
                BaseAttackSpeed = 1.0f, MaxMana = 85, AttackRange = 1, MoveSpeed = 1.5f,
                EvolvesIntoId = "volcano_titan"
            };
            _tideHunter = new MockUnit
            {
                UnitId = "tide_hunter", DisplayName = "Tide Hunter",
                Element = Element.Water, Archetype = Archetype.Vanguard,
                Tier = 1, BaseHP = 580, BaseATK = 48, BaseDEF = 0, BaseSPD = 0,
                BaseAttackSpeed = 0.8f, MaxMana = 60, AttackRange = 1, MoveSpeed = 2.0f
            };
            _stoneGuard = new MockUnit
            {
                UnitId = "stone_guard", DisplayName = "Stone Guard",
                Element = Element.Earth, Archetype = Archetype.Guardian,
                Tier = 1, BaseHP = 750, BaseATK = 30, BaseDEF = 0, BaseSPD = 0,
                BaseAttackSpeed = 1.0f, MaxMana = 80, AttackRange = 1, MoveSpeed = 1.5f
            };
            _zephyrScout = new MockUnit
            {
                UnitId = "zephyr_scout", DisplayName = "Zephyr Scout",
                Element = Element.Wind, Archetype = Archetype.Predator,
                Tier = 1, BaseHP = 400, BaseATK = 42, BaseDEF = 0, BaseSPD = 0,
                BaseAttackSpeed = 0.45f, MaxMana = 45, AttackRange = 1, MoveSpeed = 4.0f
            };
        }

        // --- Star multiplier tests ---

        [Test]
        public void StarMultiplier_Star1_Returns1()
        {
            Assert.AreEqual(1.0f, UnitStatCalculator.GetStarMultiplier(1), 0.001f);
        }

        [Test]
        public void StarMultiplier_Star2_Returns1Point8()
        {
            Assert.AreEqual(1.8f, UnitStatCalculator.GetStarMultiplier(2), 0.001f);
        }

        [Test]
        public void StarMultiplier_Star3_Returns3Point24()
        {
            Assert.AreEqual(3.24f, UnitStatCalculator.GetStarMultiplier(3), 0.01f);
        }

        [Test]
        public void StarMultiplier_Star5_Returns10Point497()
        {
            // pow(1.8, 4) = 10.4976
            Assert.AreEqual(10.4976f, UnitStatCalculator.GetStarMultiplier(5), 0.01f);
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
            // floor(600 * pow(1.8, 4)) = floor(600 * 10.4976) = floor(6298.56) = 6298
            Assert.AreEqual(6298, UnitStatCalculator.CalculateHP(_flameWarrior, 5));
        }

        [Test]
        public void FlameWarrior_Star5_ATK()
        {
            // floor(50 * pow(1.8, 4)) = floor(50 * 10.4976) = floor(524.88) = 524
            Assert.AreEqual(524, UnitStatCalculator.CalculateATK(_flameWarrior, 5));
        }

        // --- Flame Warrior star 3 ---

        [Test]
        public void FlameWarrior_Star3_HP()
        {
            // floor(600 * 3.24) = floor(1944) = 1944
            Assert.AreEqual(1944, UnitStatCalculator.CalculateHP(_flameWarrior, 3));
        }

        [Test]
        public void FlameWarrior_Star3_ATK()
        {
            // floor(50 * 3.24) = floor(162) = 162
            Assert.AreEqual(162, UnitStatCalculator.CalculateATK(_flameWarrior, 3));
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
            // floor(580 * 3.24) = floor(1879.2) = 1879
            Assert.AreEqual(1879, UnitStatCalculator.CalculateHP(_tideHunter, 3));
        }

        [Test]
        public void StoneGuard_Star3_HP()
        {
            // floor(750 * 3.24) = floor(2430) = 2430
            Assert.AreEqual(2430, UnitStatCalculator.CalculateHP(_stoneGuard, 3));
        }

        [Test]
        public void ZephyrScout_Star3_ATK()
        {
            // floor(42 * 3.24) = floor(136.08) = 136
            Assert.AreEqual(136, UnitStatCalculator.CalculateATK(_zephyrScout, 3));
        }

        // --- Level bonus ---

        [Test]
        public void LevelBonus_Level1_Returns1()
        {
            Assert.AreEqual(1.0f, UnitStatCalculator.GetLevelBonus(1), 0.001f);
        }

        [Test]
        public void LevelBonus_Level30_Returns1Point58()
        {
            // 1 + 29 * 0.02 = 1.58
            Assert.AreEqual(1.58f, UnitStatCalculator.GetLevelBonus(30), 0.001f);
        }

        // --- Full stat calc with level + ascension ---

        [Test]
        public void FlameWarrior_Star3_Level15_Awakened()
        {
            // floor(600 * 3.24 * 1.28 * 1.10) = floor(600 * 3.24 * 1.408) = floor(2737.15) = 2737
            int hp = UnitStatCalculator.CalculateHP(_flameWarrior, 3, 15, AscensionTier.Awakened);
            // 600 * 3.24 = 1944, * 1.28 = 2488.32, * 1.10 = 2737.152
            Assert.AreEqual(2737, hp);
        }

        // --- XP to next level ---

        [Test]
        public void XPToNext_Level1_Returns100()
        {
            Assert.AreEqual(100, UnitStatCalculator.GetXPToNextLevel(1));
        }

        [Test]
        public void XPToNext_Level30_ReturnsMaxValue()
        {
            Assert.AreEqual(int.MaxValue, UnitStatCalculator.GetXPToNextLevel(30));
        }
    }
}
