using System.Collections.Generic;

namespace ShatteredVeil.Core.Heroes
{
    public static class HeroAvailabilitySystem
    {
        public static List<HeroId> GetAvailableHeroes(int currentRegion, int currentStage)
        {
            var available = new List<HeroId>();
            var all = HeroCatalog.GetAll();

            foreach (var kvp in all)
            {
                var def = kvp.Value;

                // Not yet acquired
                if (currentRegion < def.AcquiredRegion) continue;
                if (currentRegion == def.AcquiredRegion && currentStage < def.AcquiredStage) continue;

                // Check if dead (Lyric)
                if (def.CanDie && currentRegion > def.DeathRegion) continue;
                if (def.CanDie && currentRegion == def.DeathRegion && currentStage >= def.DeathStage) continue;

                // Check leave/return (Sera, Maren)
                if (def.LeaveRegion.HasValue)
                {
                    bool hasLeft = currentRegion > def.LeaveRegion.Value ||
                                   (currentRegion == def.LeaveRegion.Value && currentStage >= def.LeaveStage.Value);
                    bool hasReturned = def.ReturnRegion.HasValue &&
                                      (currentRegion > def.ReturnRegion.Value ||
                                       (currentRegion == def.ReturnRegion.Value && currentStage >= def.ReturnStage.Value));

                    if (hasLeft && !hasReturned) continue;
                }

                available.Add(def.Id);
            }

            return available;
        }

        public static void OnLyricDeath(HeroState lyric)
        {
            if (lyric == null || lyric.Id != HeroId.Lyric) return;
            lyric.IsDead = true;
            lyric.AssignedUnitId = null;
        }

        public static void OnHeroLeave(HeroState hero)
        {
            if (hero == null) return;
            hero.IsAbsent = true;
            hero.AssignedUnitId = null;
        }

        public static void OnHeroReturn(HeroState hero)
        {
            if (hero == null) return;
            hero.IsAbsent = false;
        }
    }
}
