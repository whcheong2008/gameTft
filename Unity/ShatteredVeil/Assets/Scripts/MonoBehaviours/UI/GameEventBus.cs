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

        // System
        public static event Action<string> OnToastRequested;

        public static void FireGoldChanged(int ve) => OnGoldChanged?.Invoke(ve);
        public static void FireXPChanged(int current, int toNext) => OnXPChanged?.Invoke(current, toNext);
        public static void FireLevelUp(int level) => OnLevelUp?.Invoke(level);
        public static void FireUnitRolled(string unitId) => OnUnitRolled?.Invoke(unitId);
        public static void FireUnitStarredUp(string unitId, int stars) => OnUnitStarredUp?.Invoke(unitId, stars);
        public static void FireToast(string message) => OnToastRequested?.Invoke(message);

        public static void ClearAll()
        {
            OnGoldChanged = null;
            OnXPChanged = null;
            OnLevelUp = null;
            OnUnitRolled = null;
            OnUnitStarredUp = null;
            OnToastRequested = null;
        }
    }
}
