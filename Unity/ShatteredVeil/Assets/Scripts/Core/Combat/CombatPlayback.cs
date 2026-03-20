using System;
using System.Collections.Generic;
using System.Linq;

namespace ShatteredVeil.Core.Combat
{
    /// <summary>
    /// Speed multiplier options for combat playback.
    /// </summary>
    public enum PlaybackSpeed
    {
        Normal = 1,
        Fast = 2,
        VeryFast = 4
    }

    /// <summary>
    /// Current state of combat playback.
    /// </summary>
    public enum PlaybackState
    {
        NotStarted,
        Playing,
        Paused,
        WaveTransition,
        Finished
    }

    /// <summary>
    /// Pure C# combat playback controller. Manages timeline of CombatEvents for UI visualization.
    /// No Unity dependencies — the MonoBehaviour scene controller reads state and renders.
    ///
    /// Flow:
    /// 1. CombatEngine runs a full battle and produces List&lt;CombatEvent&gt;
    /// 2. CombatPlayback receives the events and manages playback position
    /// 3. UI calls Tick(dt) each frame; playback advances and fires callbacks
    /// 4. Speed controls (1x/2x/4x) scale the tick delta
    /// </summary>
    public class CombatPlayback
    {
        private readonly List<CombatEvent> _events;
        private readonly List<CombatFrameSnapshot> _keyFrames;
        private readonly Dictionary<string, UnitCombatStats> _unitStats;

        private int _currentEventIndex;
        private float _currentTime;
        private PlaybackSpeed _speed = PlaybackSpeed.Normal;
        private PlaybackState _state = PlaybackState.NotStarted;
        private int _currentWave;
        private int _totalWaves;

        // --- Star tracking ---
        private int _unitsLost;
        private float _totalDamageTaken;
        private float _totalMaxHP;

        /// <summary>Fired when a new combat event should be visualized.</summary>
        public event Action<CombatEvent> OnEventPlayed;

        /// <summary>Fired when a keyframe is reached (for full grid refresh).</summary>
        public event Action<CombatFrameSnapshot> OnFrameUpdated;

        /// <summary>Fired when playback state changes.</summary>
        public event Action<PlaybackState> OnStateChanged;

        /// <summary>Fired when a wave transition begins (pause for repositioning).</summary>
        public event Action<int, int> OnWaveTransition; // currentWave, totalWaves

        /// <summary>Fired when combat ends.</summary>
        public event Action<bool, int> OnCombatFinished; // victory, stars

        public PlaybackState State => _state;
        public PlaybackSpeed Speed => _speed;
        public float CurrentTime => _currentTime;
        public int CurrentWave => _currentWave;
        public int TotalWaves => _totalWaves;
        public int EventCount => _events.Count;
        public int CurrentEventIndex => _currentEventIndex;
        public IReadOnlyList<CombatEvent> Events => _events;

        public float Progress => _events.Count > 0
            ? (float)_currentEventIndex / _events.Count
            : 0f;

        public CombatPlayback(List<CombatEvent> events, List<CombatFrameSnapshot> keyFrames, int totalWaves)
        {
            _events = events ?? new List<CombatEvent>();
            _keyFrames = keyFrames ?? new List<CombatFrameSnapshot>();
            _totalWaves = totalWaves;
            _currentWave = 0;
            _currentEventIndex = 0;
            _currentTime = 0f;
            _unitStats = new Dictionary<string, UnitCombatStats>();

            // Initialize unit stats from first keyframe
            if (_keyFrames.Count > 0)
            {
                var frame = _keyFrames[0];
                foreach (var u in frame.PlayerUnits)
                {
                    _unitStats[u.UnitId] = new UnitCombatStats
                    {
                        UnitId = u.UnitId,
                        UnitName = u.UnitName,
                        Element = u.Element,
                        Side = "player"
                    };
                    _totalMaxHP += u.MaxHP;
                }
                foreach (var u in frame.EnemyUnits)
                {
                    _unitStats[u.UnitId] = new UnitCombatStats
                    {
                        UnitId = u.UnitId,
                        UnitName = u.UnitName,
                        Element = u.Element,
                        Side = "enemy"
                    };
                }
            }
        }

        /// <summary>Start playback from the beginning.</summary>
        public void Play()
        {
            if (_state == PlaybackState.Finished) return;
            _state = PlaybackState.Playing;
            OnStateChanged?.Invoke(_state);

            // Fire initial keyframe
            if (_keyFrames.Count > 0 && _currentEventIndex == 0)
            {
                OnFrameUpdated?.Invoke(_keyFrames[0]);
            }
        }

        /// <summary>Pause playback.</summary>
        public void Pause()
        {
            if (_state != PlaybackState.Playing) return;
            _state = PlaybackState.Paused;
            OnStateChanged?.Invoke(_state);
        }

        /// <summary>Resume from pause.</summary>
        public void Resume()
        {
            if (_state != PlaybackState.Paused) return;
            _state = PlaybackState.Playing;
            OnStateChanged?.Invoke(_state);
        }

        /// <summary>Toggle pause/play.</summary>
        public void TogglePause()
        {
            if (_state == PlaybackState.Playing) Pause();
            else if (_state == PlaybackState.Paused) Resume();
        }

        /// <summary>
        /// Cycle speed: 1x → 2x → 4x → 1x.
        /// </summary>
        public PlaybackSpeed CycleSpeed()
        {
            switch (_speed)
            {
                case PlaybackSpeed.Normal: _speed = PlaybackSpeed.Fast; break;
                case PlaybackSpeed.Fast: _speed = PlaybackSpeed.VeryFast; break;
                case PlaybackSpeed.VeryFast: _speed = PlaybackSpeed.Normal; break;
            }
            return _speed;
        }

        /// <summary>Set speed directly.</summary>
        public void SetSpeed(PlaybackSpeed speed) => _speed = speed;

        /// <summary>
        /// Advance to next wave after repositioning. Call when player confirms.
        /// </summary>
        public void ConfirmWaveTransition()
        {
            if (_state != PlaybackState.WaveTransition) return;
            _currentWave++;
            _state = PlaybackState.Playing;
            OnStateChanged?.Invoke(_state);
        }

        /// <summary>
        /// Skip the entire remaining playback and jump to the result.
        /// </summary>
        public void SkipToEnd()
        {
            while (_currentEventIndex < _events.Count)
            {
                var evt = _events[_currentEventIndex];
                TrackStats(evt);
                _currentEventIndex++;
            }

            _state = PlaybackState.Finished;
            OnStateChanged?.Invoke(_state);

            // Find the battle end event
            var endEvent = _events.LastOrDefault(e => e.Type == CombatEventType.BattleEnd);
            if (endEvent != null)
            {
                OnCombatFinished?.Invoke(endEvent.Victory, endEvent.Stars);
            }

            // Fire final keyframe
            if (_keyFrames.Count > 0)
            {
                OnFrameUpdated?.Invoke(_keyFrames[_keyFrames.Count - 1]);
            }
        }

        /// <summary>
        /// Advance playback by dt seconds. Called each frame by the scene controller.
        /// Returns the number of events processed this tick.
        /// </summary>
        public int Tick(float dt)
        {
            if (_state != PlaybackState.Playing) return 0;

            float scaledDt = dt * (int)_speed;
            _currentTime += scaledDt;

            int eventsProcessed = 0;

            while (_currentEventIndex < _events.Count)
            {
                var evt = _events[_currentEventIndex];

                if (evt.Timestamp > _currentTime)
                    break; // not yet time for this event

                // Process event
                TrackStats(evt);
                OnEventPlayed?.Invoke(evt);
                _currentEventIndex++;
                eventsProcessed++;

                // Check for wave transition
                if (evt.Type == CombatEventType.WaveComplete && _currentWave < _totalWaves - 1)
                {
                    _state = PlaybackState.WaveTransition;
                    OnStateChanged?.Invoke(_state);
                    OnWaveTransition?.Invoke(_currentWave, _totalWaves);

                    // Find and fire the keyframe for the next wave
                    var nextFrame = _keyFrames.FirstOrDefault(f => f.WaveIndex == _currentWave + 1);
                    if (nextFrame != null)
                        OnFrameUpdated?.Invoke(nextFrame);

                    return eventsProcessed;
                }

                // Check for battle end
                if (evt.Type == CombatEventType.BattleEnd)
                {
                    _state = PlaybackState.Finished;
                    OnStateChanged?.Invoke(_state);
                    OnCombatFinished?.Invoke(evt.Victory, evt.Stars);

                    if (_keyFrames.Count > 0)
                        OnFrameUpdated?.Invoke(_keyFrames[_keyFrames.Count - 1]);

                    return eventsProcessed;
                }

                // Update keyframe if available
                var frame = _keyFrames.FirstOrDefault(f =>
                    Math.Abs(f.Timestamp - evt.Timestamp) < 0.001f);
                if (frame != null)
                    OnFrameUpdated?.Invoke(frame);

                // Safety: limit events per tick to prevent infinite loops
                if (eventsProcessed > 100) break;
            }

            // All events consumed
            if (_currentEventIndex >= _events.Count && _state == PlaybackState.Playing)
            {
                _state = PlaybackState.Finished;
                OnStateChanged?.Invoke(_state);
            }

            return eventsProcessed;
        }

        /// <summary>
        /// Get the current keyframe snapshot (last one before current time).
        /// </summary>
        public CombatFrameSnapshot GetCurrentFrame()
        {
            CombatFrameSnapshot best = null;
            foreach (var f in _keyFrames)
            {
                if (f.Timestamp <= _currentTime)
                    best = f;
                else
                    break;
            }
            return best ?? (_keyFrames.Count > 0 ? _keyFrames[0] : null);
        }

        /// <summary>Get all unit combat stats for scoreboard.</summary>
        public IReadOnlyDictionary<string, UnitCombatStats> GetUnitStats() => _unitStats;

        /// <summary>Get combat log entries up to current time.</summary>
        public List<string> GetLogEntries(int maxCount = 50)
        {
            var entries = new List<string>();
            int start = Math.Max(0, _currentEventIndex - maxCount);
            for (int i = start; i < _currentEventIndex && i < _events.Count; i++)
            {
                if (!string.IsNullOrEmpty(_events[i].LogMessage))
                    entries.Add(_events[i].LogMessage);
            }
            return entries;
        }

        private void TrackStats(CombatEvent evt)
        {
            switch (evt.Type)
            {
                case CombatEventType.AutoAttack:
                case CombatEventType.Damage:
                case CombatEventType.CriticalHit:
                    if (evt.SourceUnitId != null && _unitStats.TryGetValue(evt.SourceUnitId, out var attacker))
                        attacker.DamageDealt += evt.Value;
                    if (evt.TargetUnitId != null && _unitStats.TryGetValue(evt.TargetUnitId, out var defender))
                    {
                        defender.DamageTaken += evt.Value;
                        if (defender.Side == "player")
                            _totalDamageTaken += evt.Value;
                    }
                    break;

                case CombatEventType.Heal:
                    if (evt.SourceUnitId != null && _unitStats.TryGetValue(evt.SourceUnitId, out var healer))
                        healer.HealingDone += evt.Value;
                    break;

                case CombatEventType.AbilityCast:
                    if (evt.SourceUnitId != null && _unitStats.TryGetValue(evt.SourceUnitId, out var caster))
                        caster.AbilityCasts++;
                    break;

                case CombatEventType.UnitDeath:
                    if (evt.TargetUnitId != null && _unitStats.TryGetValue(evt.TargetUnitId, out var dead))
                    {
                        dead.IsAlive = false;
                        if (dead.Side == "player")
                            _unitsLost++;
                    }
                    // Credit the kill
                    if (evt.SourceUnitId != null && _unitStats.TryGetValue(evt.SourceUnitId, out var killer))
                        killer.Kills++;
                    break;
            }
        }

        /// <summary>Get star tracking data for results screen.</summary>
        public (int unitsLost, float damagePercent) GetStarTrackingData()
        {
            float dmgPercent = _totalMaxHP > 0 ? _totalDamageTaken / _totalMaxHP : 0f;
            return (_unitsLost, dmgPercent);
        }
    }
}
