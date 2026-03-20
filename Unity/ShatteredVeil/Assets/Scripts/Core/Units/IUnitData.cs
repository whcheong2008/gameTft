namespace ShatteredVeil.Core.Units
{
    /// <summary>
    /// Interface for unit template data — no Unity dependency.
    /// Matches the shape of UnitTemplate ScriptableObject.
    /// </summary>
    public interface IUnitData
    {
        string UnitId { get; }
        string Name { get; }
        int Tier { get; }        // Cost tier 1-5
        string Element { get; }  // Fire, Water, Earth, Wind, Lightning, Force
        string Archetype { get; }
        int BaseHP { get; }
        int BaseATK { get; }
        int BaseDEF { get; }
        float BaseAtkSpeed { get; }
        int BaseSPD { get; }
        int BaseMana { get; }
        float BaseCritRate { get; }
        float BaseCritDmg { get; }
        bool IsEvolved { get; }
    }

    /// <summary>
    /// Simple implementation of IUnitData for pure C# testing.
    /// </summary>
    public class UnitData : IUnitData
    {
        public string UnitId { get; set; }
        public string Name { get; set; }
        public int Tier { get; set; }
        public string Element { get; set; }
        public string Archetype { get; set; }
        public int BaseHP { get; set; }
        public int BaseATK { get; set; }
        public int BaseDEF { get; set; }
        public float BaseAtkSpeed { get; set; }
        public int BaseSPD { get; set; }
        public int BaseMana { get; set; }
        public float BaseCritRate { get; set; }
        public float BaseCritDmg { get; set; }
        public bool IsEvolved { get; set; }
    }
}
