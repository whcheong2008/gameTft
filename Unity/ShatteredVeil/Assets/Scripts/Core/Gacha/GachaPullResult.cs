namespace ShatteredVeil.Core.Gacha
{
    public struct GachaPullResult
    {
        public string UnitId;
        public int Tier;
        public bool IsPity;
        public int NewPityCount;
        public bool IsEvolvedCopy;
    }

    public struct RateDisplay
    {
        public float T1Rate;
        public float T2Rate;
        public float T3Rate;
        public float T4Rate;
        public float T5Rate;
    }
}
