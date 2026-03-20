using System;
using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Manages boss-specific combat logic: 2x2 grid placement, phase transitions,
    /// enrage timer, telegraphs, and boss ability selection.
    /// </summary>
    public class BossSystem
    {
        private readonly Dictionary<int, int> _currentPhase = new Dictionary<int, int>();
        private readonly Dictionary<int, float> _elapsedTime = new Dictionary<int, float>();
        private readonly Dictionary<int, bool> _isEnraged = new Dictionary<int, bool>();
        private readonly Dictionary<int, List<TelegraphData>> _activeTelegraphs
            = new Dictionary<int, List<TelegraphData>>();
        private readonly Dictionary<int, Dictionary<string, float>> _abilityCooldowns
            = new Dictionary<int, Dictionary<string, float>>();
        private readonly Dictionary<int, bool> _phaseTransitioning = new Dictionary<int, bool>();
        private readonly Dictionary<int, float> _phaseTransitionTimer = new Dictionary<int, float>();

        public const float PHASE_TRANSITION_DURATION = 2.0f;

        /// <summary>
        /// Initialize boss on the grid (2x2 placement) and set phase 0.
        /// </summary>
        public bool InitBoss(CombatUnit boss, BossData data, GridSystem grid)
        {
            int key = boss.GetHashCode();
            _currentPhase[key] = 0;
            _elapsedTime[key] = 0f;
            _isEnraged[key] = false;
            _activeTelegraphs[key] = new List<TelegraphData>();
            _abilityCooldowns[key] = new Dictionary<string, float>();
            _phaseTransitioning[key] = false;
            _phaseTransitionTimer[key] = 0f;

            // Place boss occupying GridWidth x GridHeight cells from anchor position
            var anchor = boss.Position;
            bool allPlaced = true;
            for (int r = 0; r < data.GridHeight; r++)
            {
                for (int c = 0; c < data.GridWidth; c++)
                {
                    if (r == 0 && c == 0) continue; // Anchor already placed
                    var pos = new GridPosition(anchor.Row + r, anchor.Col + c);
                    if (!grid.IsInBounds(pos))
                    {
                        allPlaced = false;
                        continue;
                    }
                    // Mark cells as occupied by boss (use grid's internal tracking)
                }
            }

            // Initialize ability cooldowns at half (first use comes faster)
            if (data.Phases.Length > 0)
            {
                var phase = data.Phases[0];
                foreach (var abilityId in phase.AbilityIds)
                {
                    foreach (var ability in data.Abilities)
                    {
                        if (ability.Id == abilityId)
                        {
                            _abilityCooldowns[key][abilityId] = ability.Cooldown * 0.5f;
                            break;
                        }
                    }
                }
            }

            return allPlaced;
        }

        /// <summary>
        /// Get all cells occupied by a boss (from anchor position).
        /// </summary>
        public List<GridPosition> GetOccupiedCells(CombatUnit boss, BossData data)
        {
            var cells = new List<GridPosition>();
            var anchor = boss.Position;
            for (int r = 0; r < data.GridHeight; r++)
            {
                for (int c = 0; c < data.GridWidth; c++)
                {
                    cells.Add(new GridPosition(anchor.Row + r, anchor.Col + c));
                }
            }
            return cells;
        }

        /// <summary>
        /// Check if boss HP has crossed a phase threshold.
        /// </summary>
        public bool CheckPhaseTransition(CombatUnit boss, BossData data)
        {
            if (!boss.IsAlive) return false;
            int key = boss.GetHashCode();
            int currentPhase;
            if (!_currentPhase.TryGetValue(key, out currentPhase))
                return false;

            if (data.PhaseThresholds == null || data.PhaseThresholds.Length == 0)
                return false;

            // Check if HP dropped below next threshold
            float hpPct = (float)boss.CurrentHP / boss.MaxHP;
            if (currentPhase < data.PhaseThresholds.Length)
            {
                if (hpPct <= data.PhaseThresholds[currentPhase])
                    return true;
            }

            return false;
        }

        /// <summary>
        /// Execute a phase transition. Returns event describing the transition.
        /// </summary>
        public PhaseTransitionEvent TransitionPhase(CombatUnit boss, BossData data)
        {
            int key = boss.GetHashCode();
            int oldPhase = _currentPhase[key];
            int newPhase = oldPhase + 1;

            if (newPhase >= data.Phases.Length)
                return null;

            _currentPhase[key] = newPhase;
            _phaseTransitioning[key] = true;
            _phaseTransitionTimer[key] = PHASE_TRANSITION_DURATION;

            // Reset ability cooldowns for new phase
            _abilityCooldowns[key].Clear();
            var phase = data.Phases[newPhase];
            foreach (var abilityId in phase.AbilityIds)
            {
                foreach (var ability in data.Abilities)
                {
                    if (ability.Id == abilityId)
                    {
                        _abilityCooldowns[key][abilityId] = 3.0f; // Initial cooldown delay
                        break;
                    }
                }
            }

            return new PhaseTransitionEvent
            {
                OldPhase = oldPhase,
                NewPhase = newPhase,
                SpecialMechanic = phase.SpecialMechanic,
                Description = boss.Name + " enters Phase " + (newPhase + 1)
            };
        }

        /// <summary>
        /// Select boss ability based on current phase, cooldowns, and targeting.
        /// </summary>
        public BossAbility SelectBossAbility(CombatUnit boss, BossData data,
            CombatState state, Random rng)
        {
            int key = boss.GetHashCode();

            // If phase transitioning, no ability
            bool transitioning;
            if (_phaseTransitioning.TryGetValue(key, out transitioning) && transitioning)
                return null;

            int currentPhase;
            if (!_currentPhase.TryGetValue(key, out currentPhase))
                return null;

            if (currentPhase >= data.Phases.Length)
                return null;

            var phase = data.Phases[currentPhase];
            Dictionary<string, float> cooldowns;
            if (!_abilityCooldowns.TryGetValue(key, out cooldowns))
            {
                cooldowns = new Dictionary<string, float>();
                _abilityCooldowns[key] = cooldowns;
            }

            // Find first ability off cooldown
            foreach (var abilityId in phase.AbilityIds)
            {
                float cd;
                if (cooldowns.TryGetValue(abilityId, out cd) && cd > 0)
                    continue;

                // Find the ability definition
                foreach (var ability in data.Abilities)
                {
                    if (ability.Id == abilityId)
                    {
                        // Put it on cooldown
                        cooldowns[abilityId] = ability.Cooldown;
                        return ability;
                    }
                }
            }

            return null;
        }

        /// <summary>
        /// Create telegraph warning for a boss ability.
        /// </summary>
        public TelegraphData CreateTelegraph(CombatUnit boss, BossAbility ability,
            CombatState state, GridSystem grid)
        {
            if (ability.TelegraphTime <= 0) return null;

            var telegraph = new TelegraphData
            {
                AbilityId = ability.Id,
                WarningDuration = ability.TelegraphTime,
                Type = ability.AoeRadius > 0 ? TelegraphType.AoE : TelegraphType.Targeted
            };

            // Determine affected cells based on target type
            var affectedCells = new List<GridPosition>();
            var playerTeam = state.PlayerTeam;

            switch (ability.TargetType)
            {
                case "highest_hp":
                    CombatUnit highestHp = null;
                    foreach (var u in playerTeam)
                        if (u.IsAlive && (highestHp == null || u.CurrentHP > highestHp.CurrentHP))
                            highestHp = u;
                    if (highestHp != null)
                        affectedCells = GetCellsInRadius(highestHp.Position, ability.AoeRadius, grid);
                    break;

                case "highest_atk":
                    CombatUnit highestAtk = null;
                    foreach (var u in playerTeam)
                        if (u.IsAlive && (highestAtk == null || u.ATK > highestAtk.ATK))
                            highestAtk = u;
                    if (highestAtk != null)
                        affectedCells = GetCellsInRadius(highestAtk.Position, ability.AoeRadius, grid);
                    break;

                case "all_players":
                    foreach (var u in playerTeam)
                        if (u.IsAlive) affectedCells.Add(u.Position);
                    break;

                default:
                    // Default: AoE around boss
                    affectedCells = GetCellsInRadius(boss.Position, ability.AoeRadius, grid);
                    break;
            }

            telegraph.AffectedCells = affectedCells;

            int key = boss.GetHashCode();
            if (!_activeTelegraphs.ContainsKey(key))
                _activeTelegraphs[key] = new List<TelegraphData>();
            _activeTelegraphs[key].Add(telegraph);

            return telegraph;
        }

        /// <summary>
        /// Check if enrage timer has expired.
        /// </summary>
        public bool CheckEnrage(CombatUnit boss, BossData data, float elapsedTime)
        {
            int key = boss.GetHashCode();
            bool alreadyEnraged;
            if (_isEnraged.TryGetValue(key, out alreadyEnraged) && alreadyEnraged)
                return false; // Already enraged

            _elapsedTime[key] = elapsedTime;

            if (elapsedTime >= data.EnrageTimer)
            {
                _isEnraged[key] = true;

                // Apply enrage stats
                boss.ATK = (int)Math.Floor(boss.ATK * data.EnrageAtkMultiplier);
                boss.SPD = (int)Math.Floor(boss.SPD * data.EnrageSpdMultiplier);

                return true;
            }

            return false;
        }

        /// <summary>
        /// Update cooldowns and phase transition timers.
        /// </summary>
        public void Tick(CombatUnit boss, BossData data, float deltaTime)
        {
            int key = boss.GetHashCode();

            // Tick phase transition
            bool transitioning;
            if (_phaseTransitioning.TryGetValue(key, out transitioning) && transitioning)
            {
                _phaseTransitionTimer[key] -= deltaTime;
                if (_phaseTransitionTimer[key] <= 0)
                    _phaseTransitioning[key] = false;
                return; // No actions during transition
            }

            // Tick ability cooldowns
            Dictionary<string, float> cooldowns;
            if (_abilityCooldowns.TryGetValue(key, out cooldowns))
            {
                var keys = new List<string>(cooldowns.Keys);
                foreach (var abilityKey in keys)
                {
                    if (cooldowns[abilityKey] > 0)
                        cooldowns[abilityKey] -= deltaTime;
                }
            }

            // Tick telegraph warning durations
            List<TelegraphData> telegraphs;
            if (_activeTelegraphs.TryGetValue(key, out telegraphs))
            {
                for (int i = telegraphs.Count - 1; i >= 0; i--)
                {
                    telegraphs[i].WarningDuration -= deltaTime;
                    if (telegraphs[i].WarningDuration <= 0)
                        telegraphs.RemoveAt(i);
                }
            }
        }

        public int GetCurrentPhase(CombatUnit boss)
        {
            int key = boss.GetHashCode();
            int phase;
            return _currentPhase.TryGetValue(key, out phase) ? phase : 0;
        }

        public bool IsEnraged(CombatUnit boss)
        {
            int key = boss.GetHashCode();
            bool enraged;
            return _isEnraged.TryGetValue(key, out enraged) && enraged;
        }

        public bool IsTransitioning(CombatUnit boss)
        {
            int key = boss.GetHashCode();
            bool transitioning;
            return _phaseTransitioning.TryGetValue(key, out transitioning) && transitioning;
        }

        public List<TelegraphData> GetActiveTelegraphs(CombatUnit boss)
        {
            int key = boss.GetHashCode();
            List<TelegraphData> telegraphs;
            if (_activeTelegraphs.TryGetValue(key, out telegraphs))
                return new List<TelegraphData>(telegraphs);
            return new List<TelegraphData>();
        }

        private List<GridPosition> GetCellsInRadius(GridPosition center, int radius, GridSystem grid)
        {
            var cells = new List<GridPosition>();
            for (int r = center.Row - radius; r <= center.Row + radius; r++)
            {
                for (int c = center.Col - radius; c <= center.Col + radius; c++)
                {
                    var pos = new GridPosition(r, c);
                    if (grid.IsInBounds(pos) && center.ManhattanDistance(pos) <= radius)
                        cells.Add(pos);
                }
            }
            return cells;
        }
    }
}
