using System;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// 2D integer position on the combat grid.
    /// Grid is 4 columns x 2 rows per side (player + enemy).
    /// </summary>
    public struct GridPosition : IEquatable<GridPosition>
    {
        public int Row;
        public int Col;

        public GridPosition(int row, int col)
        {
            Row = row;
            Col = col;
        }

        public int ManhattanDistance(GridPosition other)
        {
            return Math.Abs(Row - other.Row) + Math.Abs(Col - other.Col);
        }

        public bool Equals(GridPosition other)
        {
            return Row == other.Row && Col == other.Col;
        }

        public override bool Equals(object obj)
        {
            return obj is GridPosition other && Equals(other);
        }

        public override int GetHashCode()
        {
            return Row * 397 ^ Col;
        }

        public static bool operator ==(GridPosition a, GridPosition b)
        {
            return a.Row == b.Row && a.Col == b.Col;
        }

        public static bool operator !=(GridPosition a, GridPosition b)
        {
            return !(a == b);
        }

        public override string ToString()
        {
            return $"({Row},{Col})";
        }
    }
}
