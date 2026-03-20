using System;
using UnityEngine;

namespace ShatteredVeil.Data
{
    /// <summary>
    /// ScriptableObject holding synergy data for one element or archetype.
    /// Each synergy has threshold tiers with associated bonuses.
    /// </summary>
    [CreateAssetMenu(fileName = "NewSynergy", menuName = "ShatteredVeil/Synergy Definition")]
    public class SynergyDefinition : ScriptableObject
    {
        [Tooltip("element or archetype")]
        public string synergyType;

        [Tooltip("e.g. 'fire', 'guardian'")]
        public string synergyName;

        public SynergyTier[] tiers;
    }

    [Serializable]
    public class SynergyTier
    {
        [Tooltip("Number of units required to activate this tier")]
        public int threshold;

        [Tooltip("Human-readable description of bonuses at this tier")]
        public string description;
    }
}
