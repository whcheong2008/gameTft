using System.Collections.Generic;

namespace ShatteredVeil.Core.Save
{
    [System.Serializable]
    public class MissionProgressData
    {
        public int CurrentRegion;
        public int HighestCompletedStage;
        public Dictionary<string, int> StarRatings;
    }
}
