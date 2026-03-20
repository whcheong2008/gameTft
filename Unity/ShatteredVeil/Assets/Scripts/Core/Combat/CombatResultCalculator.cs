using System.Collections.Generic;
using System.Linq;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Reward tier for mission completion.
    /// </summary>
    public class CombatRewards
    {
        public int VE { get; set; }
        public int XP { get; set; }
        public int UnitDropCount { get; set; }
        public List<string> UnitDropIds { get; set; } = new List<string>();
        public string MVPUnitId { get; set; }
        public string MVPUnitName { get; set; }
        public float MVPDamage { get; set; }
        public int MVPKills { get; set; }
    }

    /// <summary>
    /// Pure C# calculator for combat results, star ratings, and rewards.
    /// No Unity dependencies.
    /// </summary>
    public static class CombatResultCalculator
    {
        /// <summary>
        /// Calculate star rating for a battle.
        /// 3 stars: 0 units lost AND &lt;30% total damage
        /// 2 stars: &lt;=1 unit lost AND &lt;60% total damage
        /// 1 star: completed (any losses)
        /// </summary>
        public static int CalculateStarRating(int unitsLost, float damagePercent)
        {
            if (unitsLost == 0 && damagePercent < 0.3f) return 3;
            if (unitsLost <= 1 && damagePercent < 0.6f) return 2;
            return 1;
        }

        /// <summary>
        /// Determine MVP from combat stats. Highest (damage + kills × 100) score.
        /// </summary>
        public static UnitCombatStats GetMVP(IReadOnlyDictionary<string, UnitCombatStats> stats)
        {
            UnitCombatStats mvp = null;
            float bestScore = -1f;

            foreach (var kvp in stats)
            {
                if (kvp.Value.Side != "player") continue;
                float score = kvp.Value.DamageDealt + kvp.Value.Kills * 100f;
                if (score > bestScore)
                {
                    bestScore = score;
                    mvp = kvp.Value;
                }
            }

            return mvp;
        }

        /// <summary>
        /// Calculate rewards based on star rating and stage data.
        /// </summary>
        public static CombatRewards CalculateRewards(
            bool victory,
            int stars,
            int baseVE,
            int baseXP,
            int baseUnitDrops,
            IReadOnlyDictionary<string, UnitCombatStats> unitStats)
        {
            var rewards = new CombatRewards();

            if (!victory)
            {
                // Defeat: partial rewards
                rewards.VE = baseVE / 4;
                rewards.XP = baseXP / 4;
                rewards.UnitDropCount = 0;
                return rewards;
            }

            // Victory rewards scale with stars
            float starMultiplier = 1f + (stars - 1) * 0.25f; // 1x/1.25x/1.5x
            rewards.VE = (int)(baseVE * starMultiplier);
            rewards.XP = (int)(baseXP * starMultiplier);
            rewards.UnitDropCount = stars == 3 ? baseUnitDrops + 1 : baseUnitDrops;

            // MVP
            var mvp = GetMVP(unitStats);
            if (mvp != null)
            {
                rewards.MVPUnitId = mvp.UnitId;
                rewards.MVPUnitName = mvp.UnitName;
                rewards.MVPDamage = mvp.DamageDealt;
                rewards.MVPKills = mvp.Kills;
            }

            return rewards;
        }

        /// <summary>
        /// Generate a summary log for the combat result.
        /// </summary>
        public static List<string> GenerateResultSummary(
            bool victory,
            int stars,
            CombatRewards rewards,
            IReadOnlyDictionary<string, UnitCombatStats> unitStats)
        {
            var lines = new List<string>();

            lines.Add(victory ? "=== VICTORY ===" : "=== DEFEAT ===");
            lines.Add($"Stars: {new string('*', stars)}{new string('-', 3 - stars)}");
            lines.Add($"Rewards: {rewards.VE} VE, {rewards.XP} XP");

            if (rewards.UnitDropCount > 0)
                lines.Add($"Unit drops: {rewards.UnitDropCount}");

            if (rewards.MVPUnitName != null)
                lines.Add($"MVP: {rewards.MVPUnitName} ({rewards.MVPDamage:F0} dmg, {rewards.MVPKills} kills)");

            // Scoreboard
            lines.Add("--- Player Team ---");
            var playerStats = unitStats.Values
                .Where(s => s.Side == "player")
                .OrderByDescending(s => s.DamageDealt)
                .ToList();

            foreach (var s in playerStats)
            {
                string alive = s.IsAlive ? "" : " [DEAD]";
                lines.Add($"  {s.UnitName}{alive}: {s.DamageDealt:F0} dmg, {s.HealingDone:F0} heal, {s.Kills} kills");
            }

            return lines;
        }
    }
}
