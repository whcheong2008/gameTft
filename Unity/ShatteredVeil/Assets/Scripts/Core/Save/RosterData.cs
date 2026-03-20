namespace ShatteredVeil.Core.Save
{
    [System.Serializable]
    public class RosterData
    {
        public RosterEntry[] Units;
    }

    [System.Serializable]
    public class RosterEntry
    {
        public string TemplateKey;
        public int Count;
        public int Stars;
        public int CopiesForNext;
    }
}
