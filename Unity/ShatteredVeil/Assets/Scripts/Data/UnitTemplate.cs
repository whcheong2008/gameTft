using UnityEngine;
using ShatteredVeil.Core.Combat;
using ShatteredVeil.Core.Units;

namespace ShatteredVeil.Data
{
    [CreateAssetMenu(fileName = "NewUnit", menuName = "ShatteredVeil/Unit Template")]
    public class UnitTemplate : ScriptableObject, IUnitData
    {
        [Header("Identity")]
        public string unitId;
        public string displayName;
        public Element element;
        public Archetype archetype;
        public Archetype secondaryArchetype;
        public bool hasSecondaryArchetype;
        public int tier;
        public string evolvedFromId;
        public string evolvesIntoId;
        public bool isEvolved;

        [Header("Base Stats (Star 1)")]
        public int baseHP;
        public int baseATK;
        public int baseDEF;
        public int baseSPD;
        public float baseAttackSpeed;
        public float baseCritChance;
        public float baseCritDamage = 1.5f;
        public int maxMana;

        [Header("Combat")]
        public int attackRange;
        public float moveSpeed;
        public TargetingRule defaultTargeting;

        [Header("References")]
        public string abilityId;
        public string passiveId;

        // IUnitData implementation
        string IUnitData.UnitId => unitId;
        string IUnitData.DisplayName => displayName;
        Element IUnitData.Element => element;
        Archetype IUnitData.Archetype => archetype;
        Archetype? IUnitData.SecondaryArchetype => hasSecondaryArchetype ? secondaryArchetype : (Archetype?)null;
        int IUnitData.Tier => tier;
        int IUnitData.BaseHP => baseHP;
        int IUnitData.BaseATK => baseATK;
        int IUnitData.BaseDEF => baseDEF;
        int IUnitData.BaseSPD => baseSPD;
        float IUnitData.BaseAttackSpeed => baseAttackSpeed;
        float IUnitData.BaseCritChance => baseCritChance;
        float IUnitData.BaseCritDamage => baseCritDamage;
        int IUnitData.MaxMana => maxMana;
        int IUnitData.AttackRange => attackRange;
        float IUnitData.MoveSpeed => moveSpeed;
        string IUnitData.AbilityId => abilityId;
        string IUnitData.PassiveId => passiveId;
        string IUnitData.EvolvedFromId => evolvedFromId;
        string IUnitData.EvolvesIntoId => evolvesIntoId;
        bool IUnitData.IsEvolved => isEvolved;
    }
}
