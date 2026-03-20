using System.Collections.Generic;

namespace ShatteredVeil.Core.Units
{
    public static class EvolutionSystem
    {
        /// <summary>
        /// Evolution pairs: base unitId -> evolved unitId.
        /// Populated by the data layer at startup.
        /// </summary>
        private static readonly Dictionary<string, string> _evolutionMap = new Dictionary<string, string>();
        private static readonly Dictionary<string, string> _reverseMap = new Dictionary<string, string>();

        public static void RegisterEvolution(string baseId, string evolvedId)
        {
            _evolutionMap[baseId] = evolvedId;
            _reverseMap[evolvedId] = baseId;
        }

        public static void ClearAll()
        {
            _evolutionMap.Clear();
            _reverseMap.Clear();
        }

        public static bool CanEvolve(string unitId)
        {
            return _evolutionMap.ContainsKey(unitId);
        }

        public static string GetEvolvedForm(string unitId)
        {
            return _evolutionMap.TryGetValue(unitId, out var evolved) ? evolved : null;
        }

        public static string GetBaseForm(string evolvedId)
        {
            return _reverseMap.TryGetValue(evolvedId, out var baseId) ? baseId : null;
        }

        public static bool IsEvolvedUnit(string unitId)
        {
            return _reverseMap.ContainsKey(unitId);
        }

        /// <summary>
        /// Copies needed per star-up, based on unit cost tier.
        /// T1=3, T2=4, T3=5, T4=8, T5=10
        /// </summary>
        public static int GetStarUpCost(int tier)
        {
            switch (tier)
            {
                case 1: return 3;
                case 2: return 4;
                case 3: return 5;
                case 4: return 8;
                case 5: return 10;
                default: return 3;
            }
        }

        public static bool CanStarUp(int tier, int currentStar, int copiesOwned)
        {
            int cost = GetStarUpCost(tier);
            return copiesOwned >= cost;
        }

        /// <summary>
        /// Evolution requires 3-star unit (star level 3).
        /// </summary>
        public static bool MeetsEvolutionStarRequirement(int currentStar)
        {
            return currentStar >= 3;
        }
    }
}
