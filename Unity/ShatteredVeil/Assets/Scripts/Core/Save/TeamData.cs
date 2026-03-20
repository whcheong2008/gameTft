namespace ShatteredVeil.Core.Save
{
    [System.Serializable]
    public class TeamData
    {
        public string TeamName;
        public TeamSlot[] Slots;
    }

    [System.Serializable]
    public class TeamSlot
    {
        public string UnitKey;
        public int Row;
        public int Col;
    }
}
