using UnityEngine;

namespace ShatteredVeil.Data
{
    /// <summary>
    /// ScriptableObject holding all static data for a single unit (base or evolved).
    /// v2-aligned: no abilityId/passiveId fields. Abilities dispatch via
    /// UnitAbilityCatalog.Get(unitId), not through a template key.
    /// </summary>
    [CreateAssetMenu(fileName = "NewUnit", menuName = "ShatteredVeil/Unit Template")]
    public class UnitTemplate : ScriptableObject
    {
        [Header("Identity")]
        [Tooltip("Unique key matching JS source, e.g. 'flame_warrior'")]
        public string unitId;

        [Tooltip("Display name, e.g. 'Flame Warrior'")]
        public string displayName;

        [Header("Classification")]
        [Tooltip("fire, water, earth, wind, lightning, force")]
        public string element;

        [Tooltip("warrior, tank, archer, mage, assassin, healer")]
        public string unitType;

        [Tooltip("Primary archetype: guardian, warden, vanguard, duelist, predator, ranger, sorcerer, mystic, sage")]
        public string archetype;

        [Tooltip("Secondary archetype (unlocked at Awakened ascension)")]
        public string secondaryArchetype;

        [Tooltip("Playstyle classification tag, e.g. 'execute_striker'. For UI/balance only, does NOT dispatch abilities.")]
        public string abilityTemplate;

        [Header("Stats")]
        [Tooltip("Cost tier 1-5")]
        public int tier;

        public int baseHP;
        public int baseATK;
        public float attackSpeed;
        public float attackRange;
        public float moveSpeed;
        public int maxMana;

        [Header("Evolution")]
        [Tooltip("Unit ID of the evolved form (base units only)")]
        public string evolvedFormId;

        [Tooltip("True if this is an evolved form")]
        public bool isEvolved;

        [Tooltip("Unit ID of the base form (evolved units only)")]
        public string baseFormId;
    }
}
