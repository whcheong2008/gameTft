using System.Collections.Generic;

namespace ShatteredVeil.Core.Heroes
{
    public static class HeroAssignmentSystem
    {
        public static bool AssignHero(HeroState hero, string unitId, List<HeroState> allHeroes)
        {
            if (hero == null || string.IsNullOrEmpty(unitId)) return false;
            if (hero.IsDead) return false;
            if (hero.IsAbsent) return false;

            // Unassign any hero already on this unit
            if (allHeroes != null)
            {
                foreach (var other in allHeroes)
                {
                    if (other != hero && other.AssignedUnitId == unitId)
                    {
                        other.AssignedUnitId = null;
                    }
                }
            }

            hero.AssignedUnitId = unitId;
            return true;
        }

        public static void UnassignHero(HeroState hero)
        {
            if (hero == null) return;
            hero.AssignedUnitId = null;
        }

        public static HeroState GetHeroForUnit(string unitId, List<HeroState> allHeroes)
        {
            if (string.IsNullOrEmpty(unitId) || allHeroes == null) return null;
            foreach (var hero in allHeroes)
            {
                if (hero.AssignedUnitId == unitId && !hero.IsDead && !hero.IsAbsent)
                    return hero;
            }
            return null;
        }

        public static bool IsUnitHeroEquipped(string unitId, List<HeroState> allHeroes)
        {
            return GetHeroForUnit(unitId, allHeroes) != null;
        }

        public static Dictionary<string, float> GetHeroBonuses(HeroState hero, HeroDefinition def)
        {
            if (hero == null || def == null) return new Dictionary<string, float>();
            if (hero.IsDead || hero.IsAbsent) return new Dictionary<string, float>();
            if (string.IsNullOrEmpty(hero.AssignedUnitId)) return new Dictionary<string, float>();

            return HeroSkillTreeSystem.GetTotalBonuses(hero, def);
        }
    }
}
