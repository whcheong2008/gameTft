using System;

namespace ShatteredVeil.Core.Units
{
    public static class UnitStatCalculator
    {
        /// <summary>
        /// Star multiplier: pow(1.8, stars - 1).
        /// Only HP and ATK scale with stars.
        /// </summary>
        public static float GetStarMultiplier(int starLevel)
        {
            if (starLevel < 1) starLevel = 1;
            return (float)Math.Pow(1.8, starLevel - 1);
        }

        /// <summary>
        /// Level bonus: 1 + (level - 1) * 0.02  (+2% per level above 1).
        /// </summary>
        public static float GetLevelBonus(int level)
        {
            if (level < 1) level = 1;
            return 1f + (level - 1) * 0.02f;
        }

        /// <summary>
        /// Ascension stat bonus (cumulative):
        /// null=0, Awakened=0.10, Exalted=0.30, Transcendent=0.65
        /// </summary>
        public static float GetAscensionBonus(AscensionTier tier)
        {
            switch (tier)
            {
                case AscensionTier.Awakened: return 0.10f;
                case AscensionTier.Exalted: return 0.30f;
                case AscensionTier.Transcendent: return 0.65f;
                default: return 0f;
            }
        }

        public static int CalculateHP(IUnitData data, int starLevel)
        {
            return (int)Math.Floor(data.BaseHP * GetStarMultiplier(starLevel));
        }

        public static int CalculateATK(IUnitData data, int starLevel)
        {
            return (int)Math.Floor(data.BaseATK * GetStarMultiplier(starLevel));
        }

        public static int CalculateHP(IUnitData data, int starLevel, int level, AscensionTier ascension)
        {
            float starMult = GetStarMultiplier(starLevel);
            float levelBonus = GetLevelBonus(level);
            float ascensionBonus = GetAscensionBonus(ascension);
            return (int)Math.Floor(data.BaseHP * starMult * levelBonus * (1f + ascensionBonus));
        }

        public static int CalculateATK(IUnitData data, int starLevel, int level, AscensionTier ascension)
        {
            float starMult = GetStarMultiplier(starLevel);
            float levelBonus = GetLevelBonus(level);
            float ascensionBonus = GetAscensionBonus(ascension);
            return (int)Math.Floor(data.BaseATK * starMult * levelBonus * (1f + ascensionBonus));
        }

        /// <summary>
        /// XP required to reach next level from current level.
        /// Formula: floor(100 * pow(1.12, level - 1))
        /// </summary>
        public static int GetXPToNextLevel(int currentLevel)
        {
            if (currentLevel >= 30) return int.MaxValue;
            return (int)Math.Floor(100 * Math.Pow(1.12, currentLevel - 1));
        }
    }
}
