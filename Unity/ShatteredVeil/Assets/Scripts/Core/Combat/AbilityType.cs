namespace ShatteredVeil.Core.Combat
{
    public enum AbilityType
    {
        Active,         // Standard mana-based casting
        PassiveCast,    // T5 legendary periodic/conditional
        Summon,         // Creates minions
        Transform       // Self-modification (Phoenix revive, etc.)
    }
}
