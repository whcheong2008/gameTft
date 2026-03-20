namespace ShatteredVeil.Core.Gacha
{
    /// <summary>
    /// Result of a single gacha pull.
    /// </summary>
    public class GachaPullResult
    {
        public bool Success { get; set; }
        public string Reason { get; set; }
        public string UnitId { get; set; }
        public int Tier { get; set; }
        public bool PityTriggered { get; set; }
        public bool IsNew { get; set; }
        public bool IsEvolvedCopy { get; set; }
    }

    /// <summary>
    /// Result of a multi-pull (10x).
    /// </summary>
    public class GachaMultiPullResult
    {
        public bool Success { get; set; }
        public string Reason { get; set; }
        public GachaPullResult[] Results { get; set; }
        public int TotalCost { get; set; }
    }
}
