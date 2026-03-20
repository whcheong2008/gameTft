using System;
using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Result of a single status effect tick.
    /// </summary>
    public class StatusTickResult
    {
        public StatusEffectType Type;
        public float DamageDealt;
        public float HealingDone;
        public bool Expired;
        public CombatUnit Target;
    }

    /// <summary>
    /// Central manager for all status effects.
    /// Handles application (with immunity, tenacity, DR, stacking), ticking,
    /// removal, and querying of status effects on CombatUnits.
    /// </summary>
    public class StatusEffectSystem
    {
        public const int MAX_DOT_STACKS = 3;

        private readonly DiminishingReturns _dr;

        // Per-unit active effects
        private readonly Dictionary<int, List<StatusEffect>> _activeEffects
            = new Dictionary<int, List<StatusEffect>>();

        public StatusEffectSystem(DiminishingReturns dr = null)
        {
            _dr = dr ?? new DiminishingReturns();
        }

        /// <summary>
        /// Apply a status effect to a target unit.
        /// Returns true if successfully applied, false if resisted/immune.
        /// </summary>
        public bool ApplyEffect(CombatUnit target, StatusEffect effect, float currentTime = 0f,
            float tenacity = 0f)
        {
            // Check Immunity buff
            if (IsCC(effect.Type) && HasEffect(target, StatusEffectType.Immunity))
                return false;

            // For CC types, apply tenacity + diminishing returns
            if (IsHardCC(effect.Type))
            {
                float effectiveDuration = _dr.CalculateEffectiveDuration(
                    target, effect.Type, effect.Duration, tenacity, currentTime);
                if (effectiveDuration <= 0f)
                    return false;
                effect.Duration = effectiveDuration;
                effect.MaxDuration = effectiveDuration;
            }

            int key = target.GetHashCode();
            if (!_activeEffects.ContainsKey(key))
                _activeEffects[key] = new List<StatusEffect>();

            var effects = _activeEffects[key];

            // Handle stacking rules
            if (IsStackingType(effect.Type))
            {
                // DoTs: stack up to MAX_DOT_STACKS, refresh duration at cap
                int stackCount = 0;
                foreach (var e in effects)
                    if (e.Type == effect.Type) stackCount++;

                if (stackCount < MAX_DOT_STACKS)
                {
                    effects.Add(effect);
                }
                else
                {
                    // At cap: refresh duration on all stacks
                    foreach (var e in effects)
                    {
                        if (e.Type == effect.Type)
                            e.Duration = effect.Duration;
                    }
                }
            }
            else if (effect.Type == StatusEffectType.Shield)
            {
                // Shields are additive
                effects.Add(effect);
            }
            else if (effect.Type == StatusEffectType.Dodge)
            {
                // Dodge: highest value wins
                bool replaced = false;
                for (int i = 0; i < effects.Count; i++)
                {
                    if (effects[i].Type == StatusEffectType.Dodge)
                    {
                        if (effect.Value > effects[i].Value)
                            effects[i] = effect;
                        replaced = true;
                        break;
                    }
                }
                if (!replaced)
                    effects.Add(effect);
            }
            else
            {
                // Non-stacking: replace existing of same type
                for (int i = effects.Count - 1; i >= 0; i--)
                {
                    if (effects[i].Type == effect.Type)
                        effects.RemoveAt(i);
                }
                effects.Add(effect);
            }

            // Sync CombatUnit flags
            SyncUnitFlags(target);

            return true;
        }

        /// <summary>
        /// Tick all active effects for a unit. Returns tick events.
        /// </summary>
        public List<StatusTickResult> TickEffects(CombatUnit unit, float deltaTime)
        {
            var results = new List<StatusTickResult>();
            int key = unit.GetHashCode();

            List<StatusEffect> effects;
            if (!_activeEffects.TryGetValue(key, out effects) || effects.Count == 0)
                return results;

            for (int i = effects.Count - 1; i >= 0; i--)
            {
                var eff = effects[i];
                eff.Duration -= deltaTime;

                // Tick DoTs
                if (eff.Category == StatusEffectCategory.DoT && eff.TickInterval > 0)
                {
                    eff.TimeSinceLastTick += deltaTime;
                    if (eff.TimeSinceLastTick >= eff.TickInterval)
                    {
                        eff.TimeSinceLastTick -= eff.TickInterval;
                        float dmg = eff.Value; // DPS for 1 second
                        if (dmg > 0 && unit.IsAlive)
                        {
                            // DoT is true damage
                            unit.CurrentHP -= (int)Math.Floor(dmg);
                            if (unit.CurrentHP <= 0)
                            {
                                unit.CurrentHP = 0;
                                unit.IsAlive = false;
                            }
                            results.Add(new StatusTickResult
                            {
                                Type = eff.Type,
                                DamageDealt = dmg,
                                Target = unit
                            });
                        }
                    }
                }

                // Tick Regen
                if (eff.Type == StatusEffectType.Regen && eff.TickInterval > 0)
                {
                    eff.TimeSinceLastTick += deltaTime;
                    if (eff.TimeSinceLastTick >= eff.TickInterval)
                    {
                        eff.TimeSinceLastTick -= eff.TickInterval;
                        float heal = eff.Value;
                        if (heal > 0 && unit.IsAlive)
                        {
                            unit.CurrentHP += (int)Math.Floor(heal);
                            if (unit.CurrentHP > unit.MaxHP)
                                unit.CurrentHP = unit.MaxHP;
                            results.Add(new StatusTickResult
                            {
                                Type = StatusEffectType.Regen,
                                HealingDone = heal,
                                Target = unit
                            });
                        }
                    }
                }

                // Remove expired
                if (eff.IsExpired)
                {
                    results.Add(new StatusTickResult
                    {
                        Type = eff.Type,
                        Expired = true,
                        Target = unit
                    });
                    effects.RemoveAt(i);
                }
            }

            SyncUnitFlags(unit);
            return results;
        }

        /// <summary>
        /// Remove a specific effect type from a unit.
        /// </summary>
        public void RemoveEffect(CombatUnit unit, StatusEffectType type)
        {
            int key = unit.GetHashCode();
            List<StatusEffect> effects;
            if (!_activeEffects.TryGetValue(key, out effects))
                return;

            for (int i = effects.Count - 1; i >= 0; i--)
            {
                if (effects[i].Type == type)
                    effects.RemoveAt(i);
            }
            SyncUnitFlags(unit);
        }

        /// <summary>
        /// Cleanse: remove all debuffs from a unit. Longest-duration first.
        /// </summary>
        public void RemoveAllDebuffs(CombatUnit unit)
        {
            int key = unit.GetHashCode();
            List<StatusEffect> effects;
            if (!_activeEffects.TryGetValue(key, out effects))
                return;

            for (int i = effects.Count - 1; i >= 0; i--)
            {
                var cat = effects[i].Category;
                if (cat == StatusEffectCategory.CrowdControl ||
                    cat == StatusEffectCategory.DoT ||
                    cat == StatusEffectCategory.Debuff)
                {
                    effects.RemoveAt(i);
                }
            }
            SyncUnitFlags(unit);
        }

        /// <summary>
        /// Check if a unit has a specific effect type active.
        /// </summary>
        public bool HasEffect(CombatUnit unit, StatusEffectType type)
        {
            int key = unit.GetHashCode();
            List<StatusEffect> effects;
            if (!_activeEffects.TryGetValue(key, out effects))
                return false;

            foreach (var e in effects)
                if (e.Type == type) return true;
            return false;
        }

        /// <summary>
        /// Get total value for an effect type on a unit, summing all stacks.
        /// </summary>
        public float GetEffectValue(CombatUnit unit, StatusEffectType type)
        {
            int key = unit.GetHashCode();
            List<StatusEffect> effects;
            if (!_activeEffects.TryGetValue(key, out effects))
                return 0f;

            float total = 0f;
            foreach (var e in effects)
            {
                if (e.Type == type)
                    total += e.Value;
            }
            return total;
        }

        /// <summary>
        /// Get all active effects for a unit.
        /// </summary>
        public List<StatusEffect> GetEffects(CombatUnit unit)
        {
            int key = unit.GetHashCode();
            List<StatusEffect> effects;
            if (_activeEffects.TryGetValue(key, out effects))
                return new List<StatusEffect>(effects);
            return new List<StatusEffect>();
        }

        /// <summary>
        /// Absorb damage through shields. Returns remaining damage after absorption.
        /// </summary>
        public float AbsorbDamage(CombatUnit unit, float incomingDamage)
        {
            int key = unit.GetHashCode();
            List<StatusEffect> effects;
            if (!_activeEffects.TryGetValue(key, out effects))
                return incomingDamage;

            float remaining = incomingDamage;
            for (int i = 0; i < effects.Count && remaining > 0; i++)
            {
                if (effects[i].Type == StatusEffectType.Shield && effects[i].ShieldRemaining > 0)
                {
                    float absorbed = Math.Min(effects[i].ShieldRemaining, remaining);
                    effects[i].ShieldRemaining -= absorbed;
                    remaining -= absorbed;
                }
            }

            // Clean up depleted shields
            for (int i = effects.Count - 1; i >= 0; i--)
            {
                if (effects[i].Type == StatusEffectType.Shield && effects[i].ShieldRemaining <= 0)
                    effects.RemoveAt(i);
            }

            return remaining;
        }

        /// <summary>
        /// Whether the given type is a hard CC (affected by DR/tenacity).
        /// </summary>
        public static bool IsHardCC(StatusEffectType type)
        {
            return type == StatusEffectType.Stun ||
                   type == StatusEffectType.Freeze ||
                   type == StatusEffectType.Root;
        }

        /// <summary>
        /// Whether the given type is any CC.
        /// </summary>
        public static bool IsCC(StatusEffectType type)
        {
            return type == StatusEffectType.Stun ||
                   type == StatusEffectType.Freeze ||
                   type == StatusEffectType.Root ||
                   type == StatusEffectType.Silence ||
                   type == StatusEffectType.Slow ||
                   type == StatusEffectType.Taunt;
        }

        /// <summary>
        /// Whether the given type stacks (DoTs: up to 3).
        /// </summary>
        public static bool IsStackingType(StatusEffectType type)
        {
            return type == StatusEffectType.Burn ||
                   type == StatusEffectType.Poison ||
                   type == StatusEffectType.Bleed;
        }

        /// <summary>
        /// Sync CombatUnit convenience flags from active effects.
        /// </summary>
        private void SyncUnitFlags(CombatUnit unit)
        {
            unit.IsStunned = HasEffect(unit, StatusEffectType.Stun);
            unit.IsFrozen = HasEffect(unit, StatusEffectType.Freeze);
            unit.IsSilenced = HasEffect(unit, StatusEffectType.Silence);
            unit.IsTaunting = HasEffect(unit, StatusEffectType.Taunt);

            // Sync stasis
            if (HasEffect(unit, StatusEffectType.Stasis))
            {
                // Get remaining duration
                var effects = _activeEffects[unit.GetHashCode()];
                foreach (var e in effects)
                {
                    if (e.Type == StatusEffectType.Stasis)
                    {
                        unit.Stasis = (int)Math.Ceiling(e.Duration);
                        break;
                    }
                }
            }
            else
            {
                unit.Stasis = 0;
            }
        }

        /// <summary>
        /// Clear all effects for a unit.
        /// </summary>
        public void ClearAll(CombatUnit unit)
        {
            int key = unit.GetHashCode();
            if (_activeEffects.ContainsKey(key))
                _activeEffects[key].Clear();
            SyncUnitFlags(unit);
        }

        /// <summary>
        /// Reset the entire system (between combats).
        /// </summary>
        public void Reset()
        {
            _activeEffects.Clear();
            _dr.Reset();
        }
    }
}
