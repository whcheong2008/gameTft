using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Tests.EditMode.Combat
{
    [TestFixture]
    public class CombatPlaybackTests
    {
        private List<CombatEvent> _events;
        private List<CombatFrameSnapshot> _keyFrames;
        private CombatPlayback _playback;

        [SetUp]
        public void SetUp()
        {
            _events = new List<CombatEvent>();
            _keyFrames = new List<CombatFrameSnapshot>();
        }

        private CombatPlayback CreatePlayback(int totalWaves = 1)
        {
            return new CombatPlayback(_events, _keyFrames, totalWaves);
        }

        private CombatFrameSnapshot MakeFrame(float timestamp, int waveIndex = 0, int turnNumber = 0)
        {
            return new CombatFrameSnapshot
            {
                Timestamp = timestamp,
                WaveIndex = waveIndex,
                TurnNumber = turnNumber,
                PlayerUnits = new List<UnitSnapshot>
                {
                    new UnitSnapshot
                    {
                        UnitId = "player_1",
                        UnitName = "Flame Warrior",
                        Side = "player",
                        Element = "fire",
                        Tier = 1,
                        Stars = 1,
                        IsAlive = true,
                        Row = 0,
                        Col = 0,
                        HP = 100,
                        MaxHP = 100,
                        Mana = 0,
                        MaxMana = 60
                    }
                },
                EnemyUnits = new List<UnitSnapshot>
                {
                    new UnitSnapshot
                    {
                        UnitId = "enemy_1",
                        UnitName = "Void Spawn",
                        Side = "enemy",
                        Element = "force",
                        Tier = 1,
                        Stars = 1,
                        IsAlive = true,
                        Row = 0,
                        Col = 0,
                        HP = 80,
                        MaxHP = 80,
                        Mana = 0,
                        MaxMana = 0
                    }
                }
            };
        }

        // ===== State Machine Tests =====

        [Test]
        public void InitialState_IsNotStarted()
        {
            var playback = CreatePlayback();
            Assert.AreEqual(PlaybackState.NotStarted, playback.State);
        }

        [Test]
        public void Play_SetsStatePlaying()
        {
            _keyFrames.Add(MakeFrame(0f));
            var playback = CreatePlayback();

            playback.Play();

            Assert.AreEqual(PlaybackState.Playing, playback.State);
        }

        [Test]
        public void Pause_FromPlaying_SetsPaused()
        {
            _keyFrames.Add(MakeFrame(0f));
            var playback = CreatePlayback();
            playback.Play();

            playback.Pause();

            Assert.AreEqual(PlaybackState.Paused, playback.State);
        }

        [Test]
        public void Resume_FromPaused_SetsPlaying()
        {
            _keyFrames.Add(MakeFrame(0f));
            var playback = CreatePlayback();
            playback.Play();
            playback.Pause();

            playback.Resume();

            Assert.AreEqual(PlaybackState.Playing, playback.State);
        }

        [Test]
        public void TogglePause_CyclesPlayPause()
        {
            _keyFrames.Add(MakeFrame(0f));
            var playback = CreatePlayback();
            playback.Play();

            playback.TogglePause();
            Assert.AreEqual(PlaybackState.Paused, playback.State);

            playback.TogglePause();
            Assert.AreEqual(PlaybackState.Playing, playback.State);
        }

        [Test]
        public void Pause_WhenNotPlaying_DoesNothing()
        {
            var playback = CreatePlayback();
            playback.Pause();
            Assert.AreEqual(PlaybackState.NotStarted, playback.State);
        }

        [Test]
        public void Play_WhenFinished_DoesNothing()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.BattleEnd,
                Timestamp = 0.1f,
                Victory = true,
                Stars = 3
            });
            var playback = CreatePlayback();
            playback.Play();
            playback.Tick(1f); // process all events

            Assert.AreEqual(PlaybackState.Finished, playback.State);
            playback.Play(); // should not change
            Assert.AreEqual(PlaybackState.Finished, playback.State);
        }

        // ===== Speed Control Tests =====

        [Test]
        public void InitialSpeed_IsNormal()
        {
            var playback = CreatePlayback();
            Assert.AreEqual(PlaybackSpeed.Normal, playback.Speed);
        }

        [Test]
        public void CycleSpeed_GoesNormalToFastToVeryFast()
        {
            var playback = CreatePlayback();

            Assert.AreEqual(PlaybackSpeed.Fast, playback.CycleSpeed());
            Assert.AreEqual(PlaybackSpeed.VeryFast, playback.CycleSpeed());
            Assert.AreEqual(PlaybackSpeed.Normal, playback.CycleSpeed());
        }

        [Test]
        public void SetSpeed_SetsDirectly()
        {
            var playback = CreatePlayback();
            playback.SetSpeed(PlaybackSpeed.VeryFast);
            Assert.AreEqual(PlaybackSpeed.VeryFast, playback.Speed);
        }

        // ===== Tick / Event Playback Tests =====

        [Test]
        public void Tick_WhenNotPlaying_ReturnsZero()
        {
            _events.Add(new CombatEvent { Type = CombatEventType.AutoAttack, Timestamp = 0.1f });
            var playback = CreatePlayback();

            int processed = playback.Tick(1f);

            Assert.AreEqual(0, processed);
        }

        [Test]
        public void Tick_ProcessesEventsUpToCurrentTime()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent { Type = CombatEventType.AutoAttack, Timestamp = 0.1f, Value = 50 });
            _events.Add(new CombatEvent { Type = CombatEventType.AutoAttack, Timestamp = 0.2f, Value = 30 });
            _events.Add(new CombatEvent { Type = CombatEventType.AutoAttack, Timestamp = 0.5f, Value = 40 });

            var playback = CreatePlayback();
            playback.Play();

            int processed = playback.Tick(0.25f); // time = 0.25

            Assert.AreEqual(2, processed); // events at 0.1 and 0.2
            Assert.AreEqual(2, playback.CurrentEventIndex);
        }

        [Test]
        public void Tick_FiresOnEventPlayed()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.AutoAttack,
                Timestamp = 0.1f,
                Value = 42,
                SourceUnitId = "player_1",
                TargetUnitId = "enemy_1"
            });

            var playback = CreatePlayback();
            CombatEvent receivedEvent = null;
            playback.OnEventPlayed += evt => receivedEvent = evt;
            playback.Play();
            playback.Tick(0.2f);

            Assert.IsNotNull(receivedEvent);
            Assert.AreEqual(CombatEventType.AutoAttack, receivedEvent.Type);
            Assert.AreEqual(42, receivedEvent.Value, 0.001f);
        }

        [Test]
        public void Tick_SpeedMultiplier_ScalesTime()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent { Type = CombatEventType.AutoAttack, Timestamp = 0.4f });

            var playback = CreatePlayback();
            playback.SetSpeed(PlaybackSpeed.Fast); // 2x
            playback.Play();

            int processed = playback.Tick(0.25f); // effective time: 0.5s

            Assert.AreEqual(1, processed); // event at 0.4 should fire
        }

        [Test]
        public void Tick_4xSpeed_ProcessesEventsFaster()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent { Type = CombatEventType.AutoAttack, Timestamp = 0.8f });

            var playback = CreatePlayback();
            playback.SetSpeed(PlaybackSpeed.VeryFast); // 4x
            playback.Play();

            int processed = playback.Tick(0.25f); // effective time: 1.0s

            Assert.AreEqual(1, processed);
        }

        [Test]
        public void Tick_BattleEnd_SetsStateFinished()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.BattleEnd,
                Timestamp = 0.1f,
                Victory = true,
                Stars = 3
            });

            var playback = CreatePlayback();
            playback.Play();
            playback.Tick(0.2f);

            Assert.AreEqual(PlaybackState.Finished, playback.State);
        }

        [Test]
        public void Tick_BattleEnd_FiresOnCombatFinished()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.BattleEnd,
                Timestamp = 0.1f,
                Victory = true,
                Stars = 2
            });

            var playback = CreatePlayback();
            bool? victory = null;
            int? stars = null;
            playback.OnCombatFinished += (v, s) => { victory = v; stars = s; };
            playback.Play();
            playback.Tick(0.2f);

            Assert.IsTrue(victory);
            Assert.AreEqual(2, stars);
        }

        // ===== Wave Transition Tests =====

        [Test]
        public void Tick_WaveComplete_TriggersTransition()
        {
            _keyFrames.Add(MakeFrame(0f, 0));
            _keyFrames.Add(MakeFrame(1f, 1));
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.WaveComplete,
                Timestamp = 0.5f,
                WaveIndex = 0
            });
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.BattleEnd,
                Timestamp = 1.5f,
                Victory = true,
                Stars = 3
            });

            var playback = new CombatPlayback(_events, _keyFrames, 2);
            playback.Play();
            playback.Tick(0.6f);

            Assert.AreEqual(PlaybackState.WaveTransition, playback.State);
        }

        [Test]
        public void ConfirmWaveTransition_ResumesPlayback()
        {
            _keyFrames.Add(MakeFrame(0f, 0));
            _keyFrames.Add(MakeFrame(1f, 1));
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.WaveComplete,
                Timestamp = 0.5f,
                WaveIndex = 0
            });
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.BattleEnd,
                Timestamp = 1.5f,
                Victory = true,
                Stars = 3
            });

            var playback = new CombatPlayback(_events, _keyFrames, 2);
            playback.Play();
            playback.Tick(0.6f); // hits wave complete

            Assert.AreEqual(PlaybackState.WaveTransition, playback.State);
            Assert.AreEqual(0, playback.CurrentWave);

            playback.ConfirmWaveTransition();

            Assert.AreEqual(PlaybackState.Playing, playback.State);
            Assert.AreEqual(1, playback.CurrentWave);
        }

        [Test]
        public void OnWaveTransition_FiresWithCorrectArgs()
        {
            _keyFrames.Add(MakeFrame(0f, 0));
            _keyFrames.Add(MakeFrame(1f, 1));
            _events.Add(new CombatEvent { Type = CombatEventType.WaveComplete, Timestamp = 0.5f });

            int? receivedCurrent = null;
            int? receivedTotal = null;

            var playback = new CombatPlayback(_events, _keyFrames, 3);
            playback.OnWaveTransition += (c, t) => { receivedCurrent = c; receivedTotal = t; };
            playback.Play();
            playback.Tick(0.6f);

            Assert.AreEqual(0, receivedCurrent);
            Assert.AreEqual(3, receivedTotal);
        }

        // ===== Skip Tests =====

        [Test]
        public void SkipToEnd_ProcessesAllEvents()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent { Type = CombatEventType.AutoAttack, Timestamp = 0.1f, Value = 10 });
            _events.Add(new CombatEvent { Type = CombatEventType.AutoAttack, Timestamp = 0.5f, Value = 20 });
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.BattleEnd,
                Timestamp = 1.0f,
                Victory = false,
                Stars = 0
            });

            var playback = CreatePlayback();
            playback.Play();
            playback.SkipToEnd();

            Assert.AreEqual(PlaybackState.Finished, playback.State);
            Assert.AreEqual(3, playback.CurrentEventIndex);
        }

        [Test]
        public void SkipToEnd_FiresCombatFinished()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.BattleEnd,
                Timestamp = 1.0f,
                Victory = true,
                Stars = 1
            });

            var playback = CreatePlayback();
            bool? victory = null;
            playback.OnCombatFinished += (v, s) => victory = v;
            playback.Play();
            playback.SkipToEnd();

            Assert.IsTrue(victory);
        }

        // ===== Stats Tracking Tests =====

        [Test]
        public void Stats_TrackDamageDealt()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.AutoAttack,
                Timestamp = 0.1f,
                SourceUnitId = "player_1",
                TargetUnitId = "enemy_1",
                Value = 50
            });
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.AutoAttack,
                Timestamp = 0.2f,
                SourceUnitId = "player_1",
                TargetUnitId = "enemy_1",
                Value = 30
            });

            var playback = CreatePlayback();
            playback.Play();
            playback.Tick(0.3f);

            var stats = playback.GetUnitStats();
            Assert.AreEqual(80, stats["player_1"].DamageDealt, 0.001f);
        }

        [Test]
        public void Stats_TrackHealing()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.Heal,
                Timestamp = 0.1f,
                SourceUnitId = "player_1",
                TargetUnitId = "player_1",
                Value = 25
            });

            var playback = CreatePlayback();
            playback.Play();
            playback.Tick(0.2f);

            var stats = playback.GetUnitStats();
            Assert.AreEqual(25, stats["player_1"].HealingDone, 0.001f);
        }

        [Test]
        public void Stats_TrackKills()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.UnitDeath,
                Timestamp = 0.1f,
                SourceUnitId = "player_1",
                TargetUnitId = "enemy_1"
            });

            var playback = CreatePlayback();
            playback.Play();
            playback.Tick(0.2f);

            var stats = playback.GetUnitStats();
            Assert.AreEqual(1, stats["player_1"].Kills);
            Assert.IsFalse(stats["enemy_1"].IsAlive);
        }

        [Test]
        public void Stats_TrackAbilityCasts()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.AbilityCast,
                Timestamp = 0.1f,
                SourceUnitId = "player_1"
            });

            var playback = CreatePlayback();
            playback.Play();
            playback.Tick(0.2f);

            var stats = playback.GetUnitStats();
            Assert.AreEqual(1, stats["player_1"].AbilityCasts);
        }

        [Test]
        public void Stats_TrackDamageTaken()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.Damage,
                Timestamp = 0.1f,
                SourceUnitId = "enemy_1",
                TargetUnitId = "player_1",
                Value = 35
            });

            var playback = CreatePlayback();
            playback.Play();
            playback.Tick(0.2f);

            var stats = playback.GetUnitStats();
            Assert.AreEqual(35, stats["player_1"].DamageTaken, 0.001f);
        }

        // ===== Star Tracking Tests =====

        [Test]
        public void StarTracking_NoLosses_ReportsCorrectly()
        {
            _keyFrames.Add(MakeFrame(0f));
            var playback = CreatePlayback();
            playback.Play();

            var (unitsLost, dmgPct) = playback.GetStarTrackingData();

            Assert.AreEqual(0, unitsLost);
            Assert.AreEqual(0f, dmgPct, 0.001f);
        }

        [Test]
        public void StarTracking_TracksUnitsLostAndDamage()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.Damage,
                Timestamp = 0.1f,
                SourceUnitId = "enemy_1",
                TargetUnitId = "player_1",
                Value = 40
            });
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.UnitDeath,
                Timestamp = 0.2f,
                SourceUnitId = "enemy_1",
                TargetUnitId = "player_1"
            });

            var playback = CreatePlayback();
            playback.Play();
            playback.Tick(0.3f);

            var (unitsLost, dmgPct) = playback.GetStarTrackingData();
            Assert.AreEqual(1, unitsLost);
            Assert.AreEqual(0.4f, dmgPct, 0.01f); // 40 / 100 maxHP
        }

        // ===== Log Tests =====

        [Test]
        public void GetLogEntries_ReturnsProcessedMessages()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.AutoAttack,
                Timestamp = 0.1f,
                LogMessage = "Flame Warrior attacks Void Spawn for 50 damage"
            });
            _events.Add(new CombatEvent
            {
                Type = CombatEventType.Heal,
                Timestamp = 0.2f,
                LogMessage = "Ocean Sage heals Flame Warrior for 25"
            });

            var playback = CreatePlayback();
            playback.Play();
            playback.Tick(0.3f);

            var log = playback.GetLogEntries();
            Assert.AreEqual(2, log.Count);
            Assert.IsTrue(log[0].Contains("Flame Warrior"));
            Assert.IsTrue(log[1].Contains("Ocean Sage"));
        }

        [Test]
        public void GetLogEntries_SkipsEmptyMessages()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent { Type = CombatEventType.Move, Timestamp = 0.1f, LogMessage = null });
            _events.Add(new CombatEvent { Type = CombatEventType.AutoAttack, Timestamp = 0.2f, LogMessage = "Attack!" });

            var playback = CreatePlayback();
            playback.Play();
            playback.Tick(0.3f);

            var log = playback.GetLogEntries();
            Assert.AreEqual(1, log.Count);
            Assert.AreEqual("Attack!", log[0]);
        }

        // ===== Progress Tests =====

        [Test]
        public void Progress_ReportsCorrectly()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent { Type = CombatEventType.AutoAttack, Timestamp = 0.1f });
            _events.Add(new CombatEvent { Type = CombatEventType.AutoAttack, Timestamp = 0.2f });
            _events.Add(new CombatEvent { Type = CombatEventType.AutoAttack, Timestamp = 0.3f });
            _events.Add(new CombatEvent { Type = CombatEventType.AutoAttack, Timestamp = 0.4f });

            var playback = CreatePlayback();
            Assert.AreEqual(0f, playback.Progress, 0.001f);

            playback.Play();
            playback.Tick(0.25f); // 2 of 4 events

            Assert.AreEqual(0.5f, playback.Progress, 0.001f);
        }

        [Test]
        public void EmptyPlayback_ProgressIsZero()
        {
            var playback = CreatePlayback();
            Assert.AreEqual(0f, playback.Progress, 0.001f);
        }

        // ===== Frame Snapshot Tests =====

        [Test]
        public void GetCurrentFrame_ReturnsLastFrameBeforeTime()
        {
            _keyFrames.Add(MakeFrame(0f, 0, 0));
            _keyFrames.Add(MakeFrame(0.5f, 0, 5));
            _keyFrames.Add(MakeFrame(1.0f, 0, 10));

            var playback = CreatePlayback();
            playback.Play();
            playback.Tick(0.7f); // time = 0.7

            var frame = playback.GetCurrentFrame();
            Assert.IsNotNull(frame);
            Assert.AreEqual(5, frame.TurnNumber); // frame at 0.5
        }

        [Test]
        public void GetCurrentFrame_ReturnsFirstFrame_WhenNoTimeElapsed()
        {
            _keyFrames.Add(MakeFrame(0f, 0, 0));
            _keyFrames.Add(MakeFrame(1f, 0, 10));

            var playback = CreatePlayback();

            var frame = playback.GetCurrentFrame();
            Assert.IsNotNull(frame);
            Assert.AreEqual(0, frame.TurnNumber);
        }

        // ===== OnFrameUpdated Tests =====

        [Test]
        public void Play_FiresInitialKeyframe()
        {
            _keyFrames.Add(MakeFrame(0f));

            var playback = CreatePlayback();
            CombatFrameSnapshot receivedFrame = null;
            playback.OnFrameUpdated += f => receivedFrame = f;

            playback.Play();

            Assert.IsNotNull(receivedFrame);
            Assert.AreEqual(1, receivedFrame.PlayerUnits.Count);
        }

        // ===== OnStateChanged Tests =====

        [Test]
        public void StateChanges_FireCallback()
        {
            _keyFrames.Add(MakeFrame(0f));

            var playback = CreatePlayback();
            var stateChanges = new List<PlaybackState>();
            playback.OnStateChanged += s => stateChanges.Add(s);

            playback.Play();
            playback.Pause();
            playback.Resume();

            Assert.AreEqual(3, stateChanges.Count);
            Assert.AreEqual(PlaybackState.Playing, stateChanges[0]);
            Assert.AreEqual(PlaybackState.Paused, stateChanges[1]);
            Assert.AreEqual(PlaybackState.Playing, stateChanges[2]);
        }

        // ===== Edge Cases =====

        [Test]
        public void NullEvents_HandledGracefully()
        {
            var playback = new CombatPlayback(null, null, 1);
            Assert.AreEqual(0, playback.EventCount);
            Assert.AreEqual(PlaybackState.NotStarted, playback.State);
        }

        [Test]
        public void EmptyEvents_FinishesImmediately()
        {
            var playback = CreatePlayback();
            playback.Play();
            int processed = playback.Tick(1f);

            Assert.AreEqual(0, processed);
            Assert.AreEqual(PlaybackState.Finished, playback.State);
        }

        [Test]
        public void Tick_WhenPaused_ReturnsZero()
        {
            _keyFrames.Add(MakeFrame(0f));
            _events.Add(new CombatEvent { Type = CombatEventType.AutoAttack, Timestamp = 0.1f });

            var playback = CreatePlayback();
            playback.Play();
            playback.Pause();

            int processed = playback.Tick(1f);
            Assert.AreEqual(0, processed);
        }
    }
}
