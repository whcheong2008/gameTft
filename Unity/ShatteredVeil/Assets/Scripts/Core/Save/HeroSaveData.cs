namespace ShatteredVeil.Core.Save
{
    [System.Serializable]
    public class HeroSaveData
    {
        public string HeroId;
        public int Level;
        public int XP;
        public string AssignedUnitId;
        public int[] InvestedNodeIndices;
        public bool IsDead;
        public bool IsAbsent;
        public int RespecCount;
    }
}
