using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    public class TelegraphData
    {
        public string AbilityId;
        public float WarningDuration;
        public List<GridPosition> AffectedCells;
        public TelegraphType Type;

        public TelegraphData()
        {
            AffectedCells = new List<GridPosition>();
        }
    }
}
