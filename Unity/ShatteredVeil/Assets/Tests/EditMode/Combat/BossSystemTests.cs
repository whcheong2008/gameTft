using System;
using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class BossSystemTests
    {
        private GridSystem _grid;
        private BossSystem _system;

        [SetUp]
        public void Setup()
        {
            _grid = new GridSystem();
            _system = new BossSystem();
        }

        private CombatUnit MakeBossUnit(string bossId, int hp, int atk)
        {
            var unit = CombatUnit.Create(bossId, bossId, Element.Force, hp, atk, 20, 8, Team.Enemy);
            var pos = new GridPosition(2, 1);
            _grid.PlaceUnit(unit, pos);
            return unit;
        }

        // ── Boss catalog: 8 bosses present ───────────────────────────────
        [Test]
        public void BossCatalog_Contains8Bosses()
        {
            Assert.AreEqual(8, BossCatalog.Count, "Should have 8 region bosses");
        }

        [Test]
        public void BossCatalog_AllBossesExist()
        {
            Assert.IsTrue(BossCatalog.Contains("veil_warden"));
            Assert.IsTrue(BossCatalog.Contains("archon"));
            Assert.IsTrue(BossCatalog.Contains("twin_heralds"));
            Assert.IsTrue(BossCatalog.Contains("shattered_colossus"));
            Assert.IsTrue(BossCatalog.Contains("elemental_chimera"));
            Assert.IsTrue(BossCatalog.Contains("prismatic_sentinel"));
            Assert.IsTrue(BossCatalog.Contains("arbiter_of_trials"));
            Assert.IsTrue(BossCatalog.Contains("void_sovereign"));
        }

        // ── Boss occupies 2x2 grid ──────────────────────────────────────
        [Test]
        public void BossOccupies2x2Grid()
        {
            var boss = MakeBossUnit("veil_warden", 5000, 80);
            var data = BossCatalog.Get("veil_warden");

            _system.InitBoss(boss, data, _grid);

            var cells = _system.GetOccupiedCells(boss, data);
            Assert.AreEqual(4, cells.Count, "2x2 boss should occupy 4 cells");

            // Check all 4 cells
            Assert.IsTrue(cells.Contains(new GridPosition(2, 1)));
            Assert.IsTrue(cells.Contains(new GridPosition(2, 2)));
            Assert.IsTrue(cells.Contains(new GridPosition(3, 1)));
            Assert.IsTrue(cells.Contains(new GridPosition(3, 2)));
        }

        // ── Phase transition at HP threshold ─────────────────────────────
        [Test]
        public void PhaseTransition_TriggersAtCorrectHpThreshold()
        {
            var boss = MakeBossUnit("veil_warden", 5000, 80);
            boss.MaxHP = 5000;
            var data = BossCatalog.Get("veil_warden");

            _system.InitBoss(boss, data, _grid);

            // At full HP — no transition
            Assert.IsFalse(_system.CheckPhaseTransition(boss, data));

            // Drop to 60% HP (below 50% threshold? No, threshold is 0.50)
            boss.CurrentHP = 3000; // 60%
            Assert.IsFalse(_system.CheckPhaseTransition(boss, data));

            // Drop to 49% HP (below 50% threshold)
            boss.CurrentHP = 2450; // 49%
            Assert.IsTrue(_system.CheckPhaseTransition(boss, data));
        }

        // ── Phase transition changes phase number ────────────────────────
        [Test]
        public void TransitionPhase_ChangesPhaseAndAbilities()
        {
            var boss = MakeBossUnit("veil_warden", 5000, 80);
            boss.MaxHP = 5000;
            var data = BossCatalog.Get("veil_warden");

            _system.InitBoss(boss, data, _grid);
            Assert.AreEqual(0, _system.GetCurrentPhase(boss));

            boss.CurrentHP = 2400; // Below 50%
            Assert.IsTrue(_system.CheckPhaseTransition(boss, data));

            var evt = _system.TransitionPhase(boss, data);
            Assert.IsNotNull(evt);
            Assert.AreEqual(0, evt.OldPhase);
            Assert.AreEqual(1, evt.NewPhase);
            Assert.AreEqual(1, _system.GetCurrentPhase(boss));
            Assert.IsTrue(_system.IsTransitioning(boss));
        }

        // ── Enrage after timer ───────────────────────────────────────────
        [Test]
        public void Enrage_TriggersAfterTimerExpires()
        {
            var boss = MakeBossUnit("veil_warden", 5000, 80);
            var data = BossCatalog.Get("veil_warden");

            _system.InitBoss(boss, data, _grid);

            int atkBefore = boss.ATK;

            // Not enraged before timer
            Assert.IsFalse(_system.CheckEnrage(boss, data, 100f));
            Assert.IsFalse(_system.IsEnraged(boss));

            // Enrage at 180s
            Assert.IsTrue(_system.CheckEnrage(boss, data, 180f));
            Assert.IsTrue(_system.IsEnraged(boss));

            // ATK should be doubled
            Assert.AreEqual(atkBefore * 2, boss.ATK, "ATK should double on enrage");
        }

        // ── Enrage doesn't fire twice ────────────────────────────────────
        [Test]
        public void Enrage_DoesNotFireTwice()
        {
            var boss = MakeBossUnit("veil_warden", 5000, 80);
            var data = BossCatalog.Get("veil_warden");

            _system.InitBoss(boss, data, _grid);

            _system.CheckEnrage(boss, data, 180f);
            int atkAfterEnrage = boss.ATK;

            // Second check should return false
            Assert.IsFalse(_system.CheckEnrage(boss, data, 200f));
            Assert.AreEqual(atkAfterEnrage, boss.ATK, "ATK should not change on second enrage check");
        }

        // ── Telegraph marks correct cells ────────────────────────────────
        [Test]
        public void CreateTelegraph_MarksCorrectCells()
        {
            var boss = MakeBossUnit("veil_warden", 5000, 80);
            var data = BossCatalog.Get("veil_warden");
            _system.InitBoss(boss, data, _grid);

            var playerUnit = CombatUnit.Create("player1", "Player1", Element.Fire, 200, 20, 5, 10, Team.Player);
            _grid.PlaceUnit(playerUnit, new GridPosition(0, 1));

            var state = new CombatState
            {
                PlayerTeam = new List<CombatUnit> { playerUnit },
                EnemyTeam = new List<CombatUnit> { boss },
                Phase = BattlePhase.InProgress,
                IsBoss = true
            };

            // Ground Slam targets highest HP
            var ability = data.Abilities[0]; // vw_ground_slam
            var telegraph = _system.CreateTelegraph(boss, ability, state, _grid);

            Assert.IsNotNull(telegraph);
            Assert.AreEqual(ability.TelegraphTime, telegraph.WarningDuration);
            Assert.Greater(telegraph.AffectedCells.Count, 0, "Telegraph should mark affected cells");
        }

        // ── Boss ability selection ───────────────────────────────────────
        [Test]
        public void SelectBossAbility_ReturnsAbilityWhenOffCooldown()
        {
            var boss = MakeBossUnit("veil_warden", 5000, 80);
            var data = BossCatalog.Get("veil_warden");
            _system.InitBoss(boss, data, _grid);

            var rng = new Random(42);
            var state = new CombatState
            {
                PlayerTeam = new List<CombatUnit>(),
                EnemyTeam = new List<CombatUnit> { boss },
                Phase = BattlePhase.InProgress,
                IsBoss = true
            };

            // Abilities start at half cooldown — tick enough to bring them off CD
            _system.Tick(boss, data, 10f);

            var ability = _system.SelectBossAbility(boss, data, state, rng);
            Assert.IsNotNull(ability, "Should select an ability when off cooldown");
            Assert.AreEqual("vw_ground_slam", ability.Id);
        }

        // ── Colossus 3-phase transitions ─────────────────────────────────
        [Test]
        public void Colossus_ThreePhaseTransitions()
        {
            var boss = MakeBossUnit("shattered_colossus", 15000, 120);
            boss.MaxHP = 15000;
            var data = BossCatalog.Get("shattered_colossus");

            _system.InitBoss(boss, data, _grid);
            Assert.AreEqual(0, _system.GetCurrentPhase(boss));

            // Phase 1 → 2 at 65%
            boss.CurrentHP = 9700; // 64.7%
            Assert.IsTrue(_system.CheckPhaseTransition(boss, data));
            _system.TransitionPhase(boss, data);
            Assert.AreEqual(1, _system.GetCurrentPhase(boss));

            // Phase 2 → 3 at 30%
            boss.CurrentHP = 4400; // 29.3%
            Assert.IsTrue(_system.CheckPhaseTransition(boss, data));
            _system.TransitionPhase(boss, data);
            Assert.AreEqual(2, _system.GetCurrentPhase(boss));
        }

        // ── Void Sovereign enrage at 150s ────────────────────────────────
        [Test]
        public void VoidSovereign_EnrageAt150Seconds()
        {
            var boss = MakeBossUnit("void_sovereign", 25000, 150);
            var data = BossCatalog.Get("void_sovereign");

            _system.InitBoss(boss, data, _grid);

            Assert.IsFalse(_system.CheckEnrage(boss, data, 149f));
            Assert.IsTrue(_system.CheckEnrage(boss, data, 150f));
            Assert.IsTrue(_system.IsEnraged(boss));

            // ATK tripled (3.0x multiplier for void sovereign)
            Assert.AreEqual(450, boss.ATK);
        }

        // ── Phase transition blocks ability selection ─────────────────────
        [Test]
        public void PhaseTransition_BlocksAbilitySelection()
        {
            var boss = MakeBossUnit("veil_warden", 5000, 80);
            boss.MaxHP = 5000;
            var data = BossCatalog.Get("veil_warden");

            _system.InitBoss(boss, data, _grid);

            boss.CurrentHP = 2400;
            _system.TransitionPhase(boss, data);
            Assert.IsTrue(_system.IsTransitioning(boss));

            var rng = new Random(42);
            var state = new CombatState
            {
                PlayerTeam = new List<CombatUnit>(),
                EnemyTeam = new List<CombatUnit> { boss },
                Phase = BattlePhase.InProgress,
                IsBoss = true
            };

            var ability = _system.SelectBossAbility(boss, data, state, rng);
            Assert.IsNull(ability, "No ability should be selected during phase transition");

            // After transition duration expires
            _system.Tick(boss, data, BossSystem.PHASE_TRANSITION_DURATION + 0.1f);
            Assert.IsFalse(_system.IsTransitioning(boss));
        }

        // ── All bosses have valid data ───────────────────────────────────
        [Test]
        public void AllBosses_HaveValidData()
        {
            var all = BossCatalog.GetAll();
            foreach (var kvp in all)
            {
                var data = kvp.Value;
                Assert.IsNotNull(data.Id, "Boss has null Id");
                Assert.IsNotNull(data.Name, "Boss " + kvp.Key + " has null Name");
                Assert.Greater(data.GridWidth, 0, "Boss " + kvp.Key + " GridWidth must be > 0");
                Assert.Greater(data.GridHeight, 0, "Boss " + kvp.Key + " GridHeight must be > 0");
                Assert.Greater(data.EnrageTimer, 0, "Boss " + kvp.Key + " EnrageTimer must be > 0");
                Assert.IsNotNull(data.Phases, "Boss " + kvp.Key + " has null Phases");
                Assert.Greater(data.Phases.Length, 0, "Boss " + kvp.Key + " must have at least 1 phase");
                Assert.IsNotNull(data.Abilities, "Boss " + kvp.Key + " has null Abilities");
                Assert.Greater(data.Abilities.Length, 0, "Boss " + kvp.Key + " must have at least 1 ability");
            }
        }
    }
}
