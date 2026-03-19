using System;
using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// 4x2 grid per side. BFS pathfinding, range checks, collision detection.
    /// Player grid: rows 0-1, cols 0-3
    /// Enemy grid:  rows 2-3, cols 0-3
    /// Total: 4 rows x 4 cols
    /// </summary>
    public class GridSystem
    {
        public const int COLS = 4;
        public const int ROWS_PER_SIDE = 2;
        public const int TOTAL_ROWS = 4; // 2 player + 2 enemy

        private readonly CombatUnit[,] _grid;

        public GridSystem()
        {
            _grid = new CombatUnit[TOTAL_ROWS, COLS];
        }

        public bool IsInBounds(GridPosition pos)
        {
            return pos.Row >= 0 && pos.Row < TOTAL_ROWS &&
                   pos.Col >= 0 && pos.Col < COLS;
        }

        public bool IsOccupied(GridPosition pos)
        {
            return IsInBounds(pos) && _grid[pos.Row, pos.Col] != null;
        }

        public CombatUnit GetUnitAt(GridPosition pos)
        {
            if (!IsInBounds(pos)) return null;
            return _grid[pos.Row, pos.Col];
        }

        public bool PlaceUnit(CombatUnit unit, GridPosition pos)
        {
            if (!IsInBounds(pos)) return false;
            if (_grid[pos.Row, pos.Col] != null) return false;

            _grid[pos.Row, pos.Col] = unit;
            unit.Position = pos;
            return true;
        }

        public void RemoveUnit(CombatUnit unit)
        {
            var pos = unit.Position;
            if (IsInBounds(pos) && _grid[pos.Row, pos.Col] == unit)
            {
                _grid[pos.Row, pos.Col] = null;
            }
        }

        public bool MoveUnit(CombatUnit unit, GridPosition to)
        {
            if (!IsInBounds(to) || _grid[to.Row, to.Col] != null) return false;

            var from = unit.Position;
            if (IsInBounds(from) && _grid[from.Row, from.Col] == unit)
            {
                _grid[from.Row, from.Col] = null;
            }

            _grid[to.Row, to.Col] = unit;
            unit.Position = to;
            return true;
        }

        public List<GridPosition> GetValidMoves(CombatUnit unit)
        {
            var moves = new List<GridPosition>();
            var pos = unit.Position;

            // 4-directional neighbors
            var offsets = new int[,] { { -1, 0 }, { 1, 0 }, { 0, -1 }, { 0, 1 } };
            for (int i = 0; i < 4; i++)
            {
                var next = new GridPosition(pos.Row + offsets[i, 0], pos.Col + offsets[i, 1]);
                if (IsInBounds(next) && _grid[next.Row, next.Col] == null)
                {
                    moves.Add(next);
                }
            }

            return moves;
        }

        /// <summary>
        /// BFS pathfinding. No diagonals. Occupied cells are impassable.
        /// Returns path excluding start, including destination.
        /// Returns empty list if no path found.
        /// </summary>
        public List<GridPosition> FindPath(GridPosition from, GridPosition to)
        {
            if (from == to) return new List<GridPosition>();
            if (!IsInBounds(from) || !IsInBounds(to)) return new List<GridPosition>();

            var visited = new bool[TOTAL_ROWS, COLS];
            var parent = new GridPosition?[TOTAL_ROWS, COLS];
            var queue = new Queue<GridPosition>();

            visited[from.Row, from.Col] = true;
            queue.Enqueue(from);

            var offsets = new int[,] { { -1, 0 }, { 1, 0 }, { 0, -1 }, { 0, 1 } };

            while (queue.Count > 0)
            {
                var current = queue.Dequeue();

                if (current == to)
                {
                    // Reconstruct path
                    var path = new List<GridPosition>();
                    var node = to;
                    while (node != from)
                    {
                        path.Add(node);
                        node = parent[node.Row, node.Col].Value;
                    }
                    path.Reverse();
                    return path;
                }

                for (int i = 0; i < 4; i++)
                {
                    var next = new GridPosition(current.Row + offsets[i, 0],
                        current.Col + offsets[i, 1]);

                    if (!IsInBounds(next)) continue;
                    if (visited[next.Row, next.Col]) continue;

                    // Destination can be occupied (we just need to know the path)
                    // but intermediate cells must be free
                    if (next != to && _grid[next.Row, next.Col] != null) continue;

                    visited[next.Row, next.Col] = true;
                    parent[next.Row, next.Col] = current;
                    queue.Enqueue(next);
                }
            }

            return new List<GridPosition>(); // No path found
        }

        public List<CombatUnit> GetUnitsInRange(GridPosition center, int range)
        {
            var result = new List<CombatUnit>();
            for (int r = 0; r < TOTAL_ROWS; r++)
            {
                for (int c = 0; c < COLS; c++)
                {
                    var unit = _grid[r, c];
                    if (unit == null || !unit.IsAlive) continue;

                    var pos = new GridPosition(r, c);
                    if (center.ManhattanDistance(pos) <= range)
                    {
                        result.Add(unit);
                    }
                }
            }
            return result;
        }

        public bool IsInRange(GridPosition from, GridPosition to, int range)
        {
            return from.ManhattanDistance(to) <= range;
        }

        public bool IsAdjacent(GridPosition a, GridPosition b)
        {
            return a.ManhattanDistance(b) == 1;
        }

        /// <summary>
        /// Move one step along the path toward the target.
        /// Returns true if a move was made.
        /// </summary>
        public bool MoveToward(CombatUnit unit, GridPosition target)
        {
            var path = FindPath(unit.Position, target);
            if (path.Count == 0) return false;

            var nextStep = path[0];
            // Don't move onto occupied cells
            if (_grid[nextStep.Row, nextStep.Col] != null) return false;

            return MoveUnit(unit, nextStep);
        }

        public void Clear()
        {
            Array.Clear(_grid, 0, _grid.Length);
        }
    }
}
