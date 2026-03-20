using System;
using System.Collections.Generic;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Main combat loop orchestrator.
    /// Headless combat runner — equivalent to combat-benchmark.js.
    /// </summary>
    public class CombatEngine
    {
        private readonly CombatState _state;
        private readonly Random _rng;
        private readonly GridSystem _grid;
        private Queue<CombatUnit> _turnQueue;

        public CombatEngine(CombatState state, Random rng)
        {
            _state = state;
            _rng = rng;
            _grid = new GridSystem();

            // Place units on grid
            PlaceTeam(_state.PlayerTeam, 0); // rows 0-1
            PlaceTeam(_state.EnemyTeam, 2);  // rows 2-3

            _state.Phase = BattlePhase.InProgress;
            _state.TurnNumber = 0;
            RebuildTurnQueue();
        }

        private void PlaceTeam(List<CombatUnit> team, int startRow)
        {
            int col = 0;
            int row = startRow;
            foreach (var unit in team)
            {
                var pos = new GridPosition(row, col);
                if (!_grid.PlaceUnit(unit, pos))
                {
                    // Try next available position
                    for (int r = startRow; r < startRow + GridSystem.ROWS_PER_SIDE; r++)
                    {
                        for (int c = 0; c < GridSystem.COLS; c++)
                        {
                            if (_grid.PlaceUnit(unit, new GridPosition(r, c)))
                                goto placed;
                        }
                    }
                }
                placed:
                col++;
                if (col >= GridSystem.COLS)
                {
                    col = 0;
                    row++;
                }
            }
        }

        private void RebuildTurnQueue()
        {
            var allAlive = new List<CombatUnit>();
            foreach (var u in _state.PlayerTeam)
                if (u.IsAlive) allAlive.Add(u);
            foreach (var u in _state.EnemyTeam)
                if (u.IsAlive) allAlive.Add(u);

            _turnQueue = TurnOrderSystem.BuildTurnOrder(allAlive);
        }

        public TurnResult ExecuteTurn()
        {
            if (_state.Phase != BattlePhase.InProgress)
                return null;

            // Get next unit, skipping dead
            CombatUnit actor = DequeueNextAlive();
            if (actor == null)
            {
                // No units left in queue, rebuild
                RebuildTurnQueue();
                actor = DequeueNextAlive();
                if (actor == null)
                {
                    _state.Phase = BattlePhase.Defeat; // No one alive = draw = loss
                    return new TurnResult { BattleOver = true, EndPhase = BattlePhase.Defeat };
                }
            }

            _state.TurnNumber++;

            var result = new TurnResult { Attacker = actor };

            // Check stun/freeze skip
            if (TurnOrderSystem.ShouldSkipTurn(actor))
            {
                result.Skipped = true;
                result.SkipReason = actor.IsStunned ? "Stunned" : "Frozen";
                // Clear stun after skip
                actor.IsStunned = false;
                actor.IsFrozen = false;
                CheckWinCondition(result);
                return result;
            }

            // Select target
            var enemies = actor.Team == Team.Player ? _state.EnemyTeam : _state.PlayerTeam;
            var target = TargetingSystem.GetTarget(actor, enemies, TargetingRule.Nearest, _rng);

            if (target == null)
            {
                // No enemies alive — win
                _state.Phase = actor.Team == Team.Player
                    ? BattlePhase.Victory
                    : BattlePhase.Defeat;
                result.BattleOver = true;
                result.EndPhase = _state.Phase;
                return result;
            }

            result.Target = target;

            // Check range — if not in range, move toward target
            int range = Math.Max(1, actor.AttackRange);
            if (!_grid.IsInRange(actor.Position, target.Position, range))
            {
                var from = actor.Position;
                bool moved = _grid.MoveToward(actor, target.Position);
                if (moved)
                {
                    result.AttackerMoved = true;
                    result.MovedFrom = from;
                    result.MovedTo = actor.Position;
                }

                // After moving, check if now in range
                if (!_grid.IsInRange(actor.Position, target.Position, range))
                {
                    // Still not in range — turn spent moving
                    CheckWinCondition(result);
                    return result;
                }
            }

            // Check ability cast: mana full → cast ability → reset mana
            var abilityData = AbilityCatalog.Get(actor.UnitId);
            if (abilityData != null && ManaSystem.CanCastAbility(actor))
            {
                // Cast ability
                var abilityResult = AbilityExecutor.Execute(actor, abilityData, _state, _grid, _rng);
                ManaSystem.ConsumeMana(actor);

                result.UsedAbility = true;
                result.AbilityResult = abilityResult;
                result.Damage = abilityResult.TotalDamage;

                // Check if any target died from the ability
                foreach (var dmgInst in abilityResult.DamageInstances)
                {
                    if (dmgInst.Killed)
                    {
                        result.TargetDied = true;
                        _grid.RemoveUnit(dmgInst.Target);
                    }
                }
            }
            else
            {
                // Auto-attack
                var ctx = new DamageContext();
                var dmgResult = DamageCalculator.Calculate(actor, target, ctx, _rng);

                result.Damage = dmgResult.Damage;
                result.IsCrit = dmgResult.IsCrit;
                result.IsDodged = dmgResult.IsDodged;

                // Mana gain on auto-attack
                ManaSystem.GainManaOnAttack(actor);

                // Mana gain on hit for target
                if (target.IsAlive && dmgResult.Damage > 0)
                    ManaSystem.GainManaOnHit(target, dmgResult.Damage);

                // Check if target died
                if (!target.IsAlive)
                {
                    result.TargetDied = true;
                    _grid.RemoveUnit(target);
                }
            }

            CheckWinCondition(result);
            return result;
        }

        private CombatUnit DequeueNextAlive()
        {
            while (_turnQueue.Count > 0)
            {
                var unit = _turnQueue.Dequeue();
                if (unit.IsAlive) return unit;
            }
            return null;
        }

        private void CheckWinCondition(TurnResult result)
        {
            bool playerAlive = HasAliveUnits(_state.PlayerTeam);
            bool enemyAlive = HasAliveUnits(_state.EnemyTeam);

            if (!enemyAlive)
            {
                _state.Phase = BattlePhase.Victory;
                result.BattleOver = true;
                result.EndPhase = BattlePhase.Victory;
            }
            else if (!playerAlive)
            {
                _state.Phase = BattlePhase.Defeat;
                result.BattleOver = true;
                result.EndPhase = BattlePhase.Defeat;
            }

            // Check turn limit (timeout → draw = loss)
            if (!result.BattleOver && _state.TurnNumber >= _state.MaxTurns)
            {
                _state.Phase = BattlePhase.Defeat;
                result.BattleOver = true;
                result.EndPhase = BattlePhase.Defeat;
            }
        }

        private bool HasAliveUnits(List<CombatUnit> team)
        {
            foreach (var u in team)
                if (u.IsAlive) return true;
            return false;
        }

        public BattleResult RunFullBattle()
        {
            var battleResult = new BattleResult();

            while (_state.Phase == BattlePhase.InProgress)
            {
                // Rebuild queue each round
                if (_turnQueue.Count == 0)
                    RebuildTurnQueue();

                var turn = ExecuteTurn();
                if (turn == null) break;

                battleResult.Log.Add(turn);

                if (turn.BattleOver)
                    break;
            }

            battleResult.TurnCount = _state.TurnNumber;
            battleResult.IsDraw = _state.TurnNumber >= _state.MaxTurns;

            if (_state.Phase == BattlePhase.Victory)
                battleResult.Winner = Team.Player;
            else
                battleResult.Winner = Team.Enemy;

            return battleResult;
        }
    }
}
