using System;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Static pub/sub event bus for Core-to-UI communication.
    /// Fire from Core systems, subscribe from UI controllers.
    /// </summary>
    public static class GameEventBus
    {
        // Economy
        public static event Action<int> OnGoldChanged;
        public static event Action<int, int> OnXPChanged; // currentXP, xpToNext
        public static event Action<int> OnLevelUp;

        // Units
        public static event Action<string> OnUnitRolled;
        public static event Action<string, int> OnUnitStarredUp; // unitId, newStars

        // Team Builder
        public static event Action OnTeamChanged;
        public static event Action<string, int, int> OnUnitPlaced;   // unitId, col, row
        public static event Action<string> OnUnitRemoved;             // unitId
        public static event Action<string, string> OnHeroAssigned;    // unitId, heroId
        public static event Action<string> OnHeroUnassigned;          // unitId

        // System
        public static event Action<string> OnToastRequested;

        public static void FireGoldChanged(int ve) => OnGoldChanged?.Invoke(ve);
        public static void FireXPChanged(int current, int toNext) => OnXPChanged?.Invoke(current, toNext);
        public static void FireLevelUp(int level) => OnLevelUp?.Invoke(level);
        public static void FireUnitRolled(string unitId) => OnUnitRolled?.Invoke(unitId);
        public static void FireUnitStarredUp(string unitId, int stars) => OnUnitStarredUp?.Invoke(unitId, stars);
        public static void FireToast(string message) => OnToastRequested?.Invoke(message);
        public static void FireTeamChanged() => OnTeamChanged?.Invoke();
        public static void FireUnitPlaced(string unitId, int col, int row) => OnUnitPlaced?.Invoke(unitId, col, row);
        public static void FireUnitRemoved(string unitId) => OnUnitRemoved?.Invoke(unitId);
        public static void FireHeroAssigned(string unitId, string heroId) => OnHeroAssigned?.Invoke(unitId, heroId);
        public static void FireHeroUnassigned(string unitId) => OnHeroUnassigned?.Invoke(unitId);

        public static void ClearAll()
        {
            OnGoldChanged = null;
            OnXPChanged = null;
            OnLevelUp = null;
            OnUnitRolled = null;
            OnUnitStarredUp = null;
            OnTeamChanged = null;
            OnUnitPlaced = null;
            OnUnitRemoved = null;
            OnHeroAssigned = null;
            OnHeroUnassigned = null;
            OnToastRequested = null;
        }
    }
}
