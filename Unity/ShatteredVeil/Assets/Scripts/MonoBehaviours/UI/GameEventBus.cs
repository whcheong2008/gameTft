using System;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Lightweight pub/sub for Core-to-UI communication.
    /// Static class — no MonoBehaviour needed.
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

        // Team
        public static event Action<int> OnTeamIndexChanged;       // teamIndex (from hub)
        public static event Action OnTeamChanged;                  // generic team changed
        public static event Action<string, string> OnItemEquipped; // unitId, itemId
        public static event Action<string, int, int> OnUnitPlaced; // unitId, col, row
        public static event Action<string> OnUnitRemoved;          // unitId
        public static event Action<string, string> OnHeroAssigned; // unitId, heroId
        public static event Action<string> OnHeroUnassigned;       // unitId

        // Combat
        public static event Action OnCombatStarted;
        public static event Action<int> OnCombatTurnCompleted;
        public static event Action<bool, int> OnCombatEnded;

        // Buildings
        public static event Action<string, int> OnBuildingUpgraded;

        // System
        public static event Action OnSaveCompleted;
        public static event Action<string> OnToastRequested;

        // --- Fire methods ---

        public static void FireGoldChanged(int newAmount) => OnGoldChanged?.Invoke(newAmount);
        public static void FireXPChanged(int newXP, int xpToNext) => OnXPChanged?.Invoke(newXP, xpToNext);
        public static void FireLevelUp(int newLevel) => OnLevelUp?.Invoke(newLevel);
        public static void FireUnitRolled(string unitId) => OnUnitRolled?.Invoke(unitId);
        public static void FireUnitStarredUp(string unitId, int newStars) => OnUnitStarredUp?.Invoke(unitId, newStars);
        public static void FireTeamIndexChanged(int teamIndex) => OnTeamIndexChanged?.Invoke(teamIndex);
        public static void FireTeamChanged() => OnTeamChanged?.Invoke();
        public static void FireItemEquipped(string unitId, string itemId) => OnItemEquipped?.Invoke(unitId, itemId);
        public static void FireUnitPlaced(string unitId, int col, int row) => OnUnitPlaced?.Invoke(unitId, col, row);
        public static void FireUnitRemoved(string unitId) => OnUnitRemoved?.Invoke(unitId);
        public static void FireHeroAssigned(string unitId, string heroId) => OnHeroAssigned?.Invoke(unitId, heroId);
        public static void FireHeroUnassigned(string unitId) => OnHeroUnassigned?.Invoke(unitId);
        public static void FireCombatStarted() => OnCombatStarted?.Invoke();
        public static void FireCombatTurnCompleted(int turnNumber) => OnCombatTurnCompleted?.Invoke(turnNumber);
        public static void FireCombatEnded(bool victory, int stars) => OnCombatEnded?.Invoke(victory, stars);
        public static void FireBuildingUpgraded(string buildingId, int newLevel) => OnBuildingUpgraded?.Invoke(buildingId, newLevel);
        public static void FireSaveCompleted() => OnSaveCompleted?.Invoke();
        public static void FireToastRequested(string message) => OnToastRequested?.Invoke(message);
        public static void FireToast(string message) => OnToastRequested?.Invoke(message);

        /// <summary>
        /// Clears all subscribers. Call on scene teardown or test cleanup.
        /// </summary>
        public static void ClearAll()
        {
            OnGoldChanged = null;
            OnXPChanged = null;
            OnLevelUp = null;
            OnUnitRolled = null;
            OnUnitStarredUp = null;
            OnTeamIndexChanged = null;
            OnTeamChanged = null;
            OnItemEquipped = null;
            OnUnitPlaced = null;
            OnUnitRemoved = null;
            OnHeroAssigned = null;
            OnHeroUnassigned = null;
            OnCombatStarted = null;
            OnCombatTurnCompleted = null;
            OnCombatEnded = null;
            OnBuildingUpgraded = null;
            OnSaveCompleted = null;
            OnToastRequested = null;
        }
    }
}
