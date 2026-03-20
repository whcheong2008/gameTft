namespace ShatteredVeil.Core.Units
{
    using ShatteredVeil.Core.Combat;

    public interface IUnitData
    {
        string UnitId { get; }
        string DisplayName { get; }
        Element Element { get; }
        Archetype Archetype { get; }
        Archetype? SecondaryArchetype { get; }
        int Tier { get; }
        int BaseHP { get; }
        int BaseATK { get; }
        int BaseDEF { get; }
        int BaseSPD { get; }
        float BaseAttackSpeed { get; }
        float BaseCritChance { get; }
        float BaseCritDamage { get; }
        int MaxMana { get; }
        int AttackRange { get; }
        float MoveSpeed { get; }
        string AbilityId { get; }
        string PassiveId { get; }
        string EvolvedFromId { get; }
        string EvolvesIntoId { get; }
        bool IsEvolved { get; }
    }
}
