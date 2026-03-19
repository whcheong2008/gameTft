using System.Collections.Generic;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Core.Units
{
    public enum SynergyType
    {
        Element,
        Archetype
    }

    public enum StatType
    {
        HP,
        ATK,
        DEF,
        SPD,
        CritChance,
        CritDamage,
        AttackSpeed,
        DamageReduction,
        Dodge,
        HealBonus,
        AbilityDamage,
        MoveSpeed
    }

    public enum ModifierType
    {
        Flat,
        Percent
    }

    public class ActiveSynergy
    {
        public string SynergyId;
        public SynergyType Type;
        public int CurrentCount;
        public int ActiveTierIndex; // -1 if no tier met
        public int RequiredForTier;
        public string Description;
    }

    public interface ISynergyDefinition
    {
        string SynergyId { get; }
        SynergyType Type { get; }
        int[] Thresholds { get; }
        string[] TierDescriptions { get; }
    }

    public static class SynergyCalculator
    {
        private static readonly Dictionary<string, ISynergyDefinition> _synergies
            = new Dictionary<string, ISynergyDefinition>();

        public static void RegisterSynergy(ISynergyDefinition synergy)
        {
            _synergies[synergy.SynergyId] = synergy;
        }

        public static void ClearAll()
        {
            _synergies.Clear();
        }

        public static List<ActiveSynergy> CalculateSynergies(List<IUnitData> team)
        {
            if (team == null || team.Count == 0)
                return new List<ActiveSynergy>();

            var elementCounts = new Dictionary<string, int>();
            var archetypeCounts = new Dictionary<string, int>();

            foreach (var unit in team)
            {
                // Element counting — evolved T5 count as 2
                string elemKey = unit.Element.ToString().ToLowerInvariant();
                int elemCount = (unit.IsEvolved && unit.Tier == 5) ? 2 : 1;
                if (!elementCounts.ContainsKey(elemKey))
                    elementCounts[elemKey] = 0;
                elementCounts[elemKey] += elemCount;

                // Primary archetype always counts
                string archKey = unit.Archetype.ToString().ToLowerInvariant();
                if (!archetypeCounts.ContainsKey(archKey))
                    archetypeCounts[archKey] = 0;
                archetypeCounts[archKey] += 1;

                // Secondary archetype only counted by combat system based on ascension
                // (not here — this is template-level synergy preview)
            }

            var result = new List<ActiveSynergy>();

            // Check element synergies
            foreach (var kvp in elementCounts)
            {
                if (_synergies.TryGetValue(kvp.Key, out var def))
                {
                    var active = ResolveTier(def, kvp.Value);
                    if (active != null)
                        result.Add(active);
                }
            }

            // Check archetype synergies
            foreach (var kvp in archetypeCounts)
            {
                if (_synergies.TryGetValue(kvp.Key, out var def))
                {
                    var active = ResolveTier(def, kvp.Value);
                    if (active != null)
                        result.Add(active);
                }
            }

            return result;
        }

        private static ActiveSynergy ResolveTier(ISynergyDefinition def, int count)
        {
            int bestTier = -1;
            for (int i = def.Thresholds.Length - 1; i >= 0; i--)
            {
                if (count >= def.Thresholds[i])
                {
                    bestTier = i;
                    break;
                }
            }

            if (bestTier < 0) return null;

            return new ActiveSynergy
            {
                SynergyId = def.SynergyId,
                Type = def.Type,
                CurrentCount = count,
                ActiveTierIndex = bestTier,
                RequiredForTier = def.Thresholds[bestTier],
                Description = bestTier < def.TierDescriptions.Length
                    ? def.TierDescriptions[bestTier] : ""
            };
        }
    }
}
