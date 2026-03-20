namespace ShatteredVeil.Core.Heroes
{
    public class LevelUpResult
    {
        public int LevelsGained;
        public int NewLevel;
        public int SkillPointsAwarded;
        public int RemainingXP;
    }

    public static class HeroXPSystem
    {
        public const int LevelCap = 20;

        private static readonly int[] XPTable = new int[]
        {
            0,       // L1
            100,     // L2
            175,     // L3
            289,     // L4
            478,     // L5
            790,     // L6
            1303,    // L7
            2154,    // L8
            3556,    // L9
            5868,    // L10
            9679,    // L11
            15971,   // L12
            26353,   // L13
            43482,   // L14
            71745,   // L15
            118379,  // L16
            195226,  // L17
            322123,  // L18
            531203,  // L19
            876135   // L20
        };

        public static int GetXPForLevel(int level)
        {
            if (level < 1) return 0;
            if (level > LevelCap) return XPTable[LevelCap - 1];
            return XPTable[level - 1];
        }

        public static int GetXPToNextLevel(int currentLevel)
        {
            if (currentLevel >= LevelCap) return int.MaxValue;
            return GetXPForLevel(currentLevel + 1);
        }

        public static LevelUpResult AddXP(HeroState hero, int xp)
        {
            var result = new LevelUpResult();
            if (hero.IsDead || hero.Level >= LevelCap || xp <= 0)
            {
                result.NewLevel = hero.Level;
                result.RemainingXP = hero.XP;
                return result;
            }

            hero.XP += xp;

            while (hero.Level < LevelCap && hero.XP >= GetXPToNextLevel(hero.Level))
            {
                hero.XP -= GetXPToNextLevel(hero.Level);
                hero.Level++;
                hero.SkillPoints++;
                result.LevelsGained++;
                result.SkillPointsAwarded++;
            }

            if (hero.Level >= LevelCap)
                hero.XP = 0;

            result.NewLevel = hero.Level;
            result.RemainingXP = hero.XP;
            return result;
        }
    }
}
