using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class GridSystemTests
    {
        private GridSystem _grid;

        [SetUp]
        public void SetUp()
        {
            _grid = new GridSystem();
        }

        [Test]
        public void PlaceUnit_Success()
        {
            var unit = CombatUnit.Create("u1", "Unit1", Element.Fire, 500, 100, 0, 10, Team.Player);
            bool placed = _grid.PlaceUnit(unit, new GridPosition(0, 0));

            Assert.IsTrue(placed);
            Assert.AreEqual(new GridPosition(0, 0), unit.Position);
        }

        [Test]
        public void PlaceUnit_Collision_Fails()
        {
            var u1 = CombatUnit.Create("u1", "Unit1", Element.Fire, 500, 100, 0, 10, Team.Player);
            var u2 = CombatUnit.Create("u2", "Unit2", Element.Fire, 500, 100, 0, 10, Team.Player);

            _grid.PlaceUnit(u1, new GridPosition(0, 0));
            bool placed = _grid.PlaceUnit(u2, new GridPosition(0, 0));

            Assert.IsFalse(placed);
        }

        [Test]
        public void PlaceUnit_OutOfBounds_Fails()
        {
            var unit = CombatUnit.Create("u1", "Unit1", Element.Fire, 500, 100, 0, 10, Team.Player);
            bool placed = _grid.PlaceUnit(unit, new GridPosition(5, 0)); // out of bounds

            Assert.IsFalse(placed);
        }

        [Test]
        public void BFS_FindsPath()
        {
            var path = _grid.FindPath(new GridPosition(0, 0), new GridPosition(0, 3));

            Assert.AreEqual(3, path.Count); // 3 steps: (0,1), (0,2), (0,3)
            Assert.AreEqual(new GridPosition(0, 1), path[0]);
            Assert.AreEqual(new GridPosition(0, 3), path[2]);
        }

        [Test]
        public void BFS_AvoidsOccupied()
        {
            var blocker = CombatUnit.Create("b1", "Blocker", Element.Fire, 500, 100, 0, 10, Team.Player);
            _grid.PlaceUnit(blocker, new GridPosition(0, 1));

            var path = _grid.FindPath(new GridPosition(0, 0), new GridPosition(0, 2));

            // Must go around: (0,0) → (1,0) → (1,1) → (1,2) → (0,2) or similar
            Assert.Greater(path.Count, 2); // longer than straight line
        }

        [Test]
        public void BFS_SamePosition_EmptyPath()
        {
            var path = _grid.FindPath(new GridPosition(1, 1), new GridPosition(1, 1));
            Assert.AreEqual(0, path.Count);
        }

        [Test]
        public void IsAdjacent_Orthogonal_True()
        {
            Assert.IsTrue(_grid.IsAdjacent(new GridPosition(0, 0), new GridPosition(0, 1)));
            Assert.IsTrue(_grid.IsAdjacent(new GridPosition(0, 0), new GridPosition(1, 0)));
        }

        [Test]
        public void IsAdjacent_Diagonal_False()
        {
            Assert.IsFalse(_grid.IsAdjacent(new GridPosition(0, 0), new GridPosition(1, 1)));
        }

        [Test]
        public void IsAdjacent_SameCell_False()
        {
            Assert.IsFalse(_grid.IsAdjacent(new GridPosition(0, 0), new GridPosition(0, 0)));
        }

        [Test]
        public void IsInRange_Melee()
        {
            Assert.IsTrue(_grid.IsInRange(new GridPosition(0, 0), new GridPosition(0, 1), 1));
            Assert.IsFalse(_grid.IsInRange(new GridPosition(0, 0), new GridPosition(0, 2), 1));
        }

        [Test]
        public void IsInRange_Ranged()
        {
            Assert.IsTrue(_grid.IsInRange(new GridPosition(0, 0), new GridPosition(0, 3), 3));
            Assert.IsTrue(_grid.IsInRange(new GridPosition(0, 0), new GridPosition(2, 1), 3));
            Assert.IsFalse(_grid.IsInRange(new GridPosition(0, 0), new GridPosition(3, 3), 3));
        }

        [Test]
        public void GetValidMoves_RespectsGridBounds()
        {
            var unit = CombatUnit.Create("u1", "Unit1", Element.Fire, 500, 100, 0, 10, Team.Player);
            _grid.PlaceUnit(unit, new GridPosition(0, 0));

            var moves = _grid.GetValidMoves(unit);

            // Corner: only right and down
            Assert.AreEqual(2, moves.Count);
        }

        [Test]
        public void GetValidMoves_ExcludesOccupied()
        {
            var u1 = CombatUnit.Create("u1", "Unit1", Element.Fire, 500, 100, 0, 10, Team.Player);
            var u2 = CombatUnit.Create("u2", "Unit2", Element.Fire, 500, 100, 0, 10, Team.Player);

            _grid.PlaceUnit(u1, new GridPosition(0, 0));
            _grid.PlaceUnit(u2, new GridPosition(0, 1)); // blocks right

            var moves = _grid.GetValidMoves(u1);

            Assert.AreEqual(1, moves.Count); // only down (1,0)
            Assert.AreEqual(new GridPosition(1, 0), moves[0]);
        }

        [Test]
        public void MoveUnit_UpdatesPosition()
        {
            var unit = CombatUnit.Create("u1", "Unit1", Element.Fire, 500, 100, 0, 10, Team.Player);
            _grid.PlaceUnit(unit, new GridPosition(0, 0));

            bool moved = _grid.MoveUnit(unit, new GridPosition(0, 1));

            Assert.IsTrue(moved);
            Assert.AreEqual(new GridPosition(0, 1), unit.Position);
            Assert.IsNull(_grid.GetUnitAt(new GridPosition(0, 0)));
            Assert.AreEqual(unit, _grid.GetUnitAt(new GridPosition(0, 1)));
        }

        [Test]
        public void GetUnitsInRange_FindsCorrectUnits()
        {
            var u1 = CombatUnit.Create("u1", "U1", Element.Fire, 500, 100, 0, 10, Team.Player);
            var u2 = CombatUnit.Create("u2", "U2", Element.Fire, 500, 100, 0, 10, Team.Player);
            var u3 = CombatUnit.Create("u3", "U3", Element.Fire, 500, 100, 0, 10, Team.Enemy);

            _grid.PlaceUnit(u1, new GridPosition(0, 0));
            _grid.PlaceUnit(u2, new GridPosition(0, 1));
            _grid.PlaceUnit(u3, new GridPosition(3, 3));

            var inRange = _grid.GetUnitsInRange(new GridPosition(0, 0), 1);
            Assert.AreEqual(2, inRange.Count); // u1 (self) and u2
        }

        [Test]
        public void RemoveUnit_ClearsCell()
        {
            var unit = CombatUnit.Create("u1", "Unit1", Element.Fire, 500, 100, 0, 10, Team.Player);
            _grid.PlaceUnit(unit, new GridPosition(1, 1));
            _grid.RemoveUnit(unit);

            Assert.IsNull(_grid.GetUnitAt(new GridPosition(1, 1)));
        }
    }
}
