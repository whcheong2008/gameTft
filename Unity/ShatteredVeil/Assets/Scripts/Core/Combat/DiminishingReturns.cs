using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Tracks CC diminishing returns per unit. From GROUND-TRUTH.md section 7:
    /// - Window: 8 seconds
    /// - 1st CC: full duration
    /// - 2nd CC within 8s: 50% duration
    /// - 3rd+ CC within 8s: 25% duration
    /// - Minimum CC duration: 0.25s
    ///
    /// Tenacity: duration *= (1 - min(tenacity, 0.6)), applied BEFORE DR.
    /// CC Immunity: after stun/freeze ends, immune for duration + 1.0s.
    /// </summary>
    public class DiminishingReturns
    {
        public const float DR_WINDOW = 8.0f;
        public const float SECOND_CC_MULT = 0.5f;
        public const float THIRD_CC_MULT = 0.25f;
        public const float MIN_CC_DURATION = 0.25f;
        public const float TENACITY_CAP = 0.6f;
        public const float IMMUNITY_BUFFER = 1.0f;

        private struct CCRecord
        {
            public float Time;
        }

        // Per-unit CC history: maps unit hashcode to list of CC timestamps
        private readonly Dictionary<int, List<CCRecord>> _ccHistory
            = new Dictionary<int, List<CCRecord>>();

        // Per-unit stun/freeze immunity expiry
        private readonly Dictionary<int, float> _immuneUntil
            = new Dictionary<int, float>();

        /// <summary>
        /// Check if a unit is currently immune to stun/freeze.
        /// </summary>
        public bool IsImmune(CombatUnit unit, StatusEffectType type, float currentTime)
        {
            if (type != StatusEffectType.Stun && type != StatusEffectType.Freeze)
                return false;

            float expiry;
            if (_immuneUntil.TryGetValue(unit.GetHashCode(), out expiry))
                return currentTime < expiry;
            return false;
        }

        /// <summary>
        /// Apply tenacity and diminishing returns to a CC duration.
        /// Returns the effective duration, or 0 if immune/below minimum.
        /// </summary>
        public float CalculateEffectiveDuration(CombatUnit target, StatusEffectType type,
            float baseDuration, float tenacity, float currentTime)
        {
            // Check immunity for stun/freeze
            if (IsImmune(target, type, currentTime))
                return 0f;

            // Step 1: Apply tenacity (capped at 60%)
            float effectiveTenacity = tenacity > TENACITY_CAP ? TENACITY_CAP : tenacity;
            float duration = baseDuration * (1f - effectiveTenacity);

            // Step 2: Apply diminishing returns
            int key = target.GetHashCode();
            CleanHistory(key, currentTime);

            int recentCount = 0;
            List<CCRecord> history;
            if (_ccHistory.TryGetValue(key, out history))
                recentCount = history.Count;

            if (recentCount == 1)
                duration *= SECOND_CC_MULT;
            else if (recentCount >= 2)
                duration *= THIRD_CC_MULT;

            // Record this CC application
            if (!_ccHistory.ContainsKey(key))
                _ccHistory[key] = new List<CCRecord>();
            _ccHistory[key].Add(new CCRecord { Time = currentTime });

            // Check minimum
            if (duration < MIN_CC_DURATION)
                return 0f;

            // Set immunity for stun/freeze
            if (type == StatusEffectType.Stun || type == StatusEffectType.Freeze)
                _immuneUntil[key] = currentTime + duration + IMMUNITY_BUFFER;

            return duration;
        }

        /// <summary>
        /// Clean entries older than DR_WINDOW.
        /// </summary>
        private void CleanHistory(int key, float currentTime)
        {
            List<CCRecord> history;
            if (!_ccHistory.TryGetValue(key, out history))
                return;

            for (int i = history.Count - 1; i >= 0; i--)
            {
                if (currentTime - history[i].Time >= DR_WINDOW)
                    history.RemoveAt(i);
            }
        }

        /// <summary>
        /// Reset all DR tracking (e.g. between combats).
        /// </summary>
        public void Reset()
        {
            _ccHistory.Clear();
            _immuneUntil.Clear();
        }
    }
}
