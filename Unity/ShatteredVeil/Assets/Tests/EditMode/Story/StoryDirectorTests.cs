using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Story;

namespace ShatteredVeil.Tests.EditMode.Story
{
    [TestFixture]
    public class StoryDirectorTests
    {
        [Test]
        public void StoryScript_PreMissionWithZeroBeats_IsValid()
        {
            var script = new StoryScript
            {
                StageId = "1-1",
                StageName = "Empty",
                PreMission = new List<StoryBeat>()
            };
            Assert.AreEqual(0, script.PreMission.Count);
        }

        [Test]
        public void StoryScript_PreMissionWithDialogueBeats_ProducesCorrectSequence()
        {
            var script = new StoryScript
            {
                StageId = "1-1",
                StageName = "Test",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Dialogue("kael", "First line."),
                    StoryBeat.Narration("A pause in the air."),
                    StoryBeat.Dialogue("lyric", "Second line.", "happy")
                }
            };

            Assert.AreEqual(3, script.PreMission.Count);
            Assert.AreEqual(BeatType.Dialogue, script.PreMission[0].Type);
            Assert.AreEqual("kael", script.PreMission[0].CharacterId);
            Assert.AreEqual(BeatType.Narration, script.PreMission[1].Type);
            Assert.AreEqual(BeatType.Dialogue, script.PreMission[2].Type);
            Assert.AreEqual("happy", script.PreMission[2].Expression);
        }

        [Test]
        public void CombatDialogue_FilterByTrigger_ReturnsCorrectBeats()
        {
            var script = new StoryScript
            {
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Hold formation!", "turn_1"),
                    StoryBeat.Combat("lyric", "Stay close!", "turn_1"),
                    StoryBeat.Combat("kael", "They're breaking!", "enemy_half_hp"),
                    StoryBeat.Combat("senna", "I sense something.", "boss_phase_2")
                }
            };

            var turn1 = script.GetCombatDialogueForTrigger("turn_1");
            Assert.AreEqual(2, turn1.Count);
            Assert.AreEqual("Hold formation!", turn1[0].Text);
            Assert.AreEqual("Stay close!", turn1[1].Text);

            var halfHp = script.GetCombatDialogueForTrigger("enemy_half_hp");
            Assert.AreEqual(1, halfHp.Count);

            var bossPhase = script.GetCombatDialogueForTrigger("boss_phase_2");
            Assert.AreEqual(1, bossPhase.Count);

            var victory = script.GetCombatDialogueForTrigger("victory");
            Assert.AreEqual(0, victory.Count);
        }

        [Test]
        public void CutsceneMarker_CreatesValidBeat()
        {
            var beat = StoryBeat.Cutscene("The Veil Shatters");
            Assert.AreEqual(BeatType.CutsceneMarker, beat.Type);
            Assert.AreEqual("The Veil Shatters", beat.Text);
        }

        [Test]
        public void MixedBeatSequence_AllTypesHandled()
        {
            var beats = new List<StoryBeat>
            {
                StoryBeat.Dialogue("kael", "Ready?"),
                StoryBeat.Expression("kael", "determined"),
                StoryBeat.PauseBeat(0.5f),
                StoryBeat.Narration("The ground trembled."),
                StoryBeat.Effect("shake", 1f),
                StoryBeat.BriefCard("Chapter begins."),
                StoryBeat.Cutscene("Opening"),
                StoryBeat.Environment("A dark forest.")
            };

            Assert.AreEqual(8, beats.Count);
            Assert.AreEqual(BeatType.Dialogue, beats[0].Type);
            Assert.AreEqual(BeatType.SetExpression, beats[1].Type);
            Assert.AreEqual(BeatType.Pause, beats[2].Type);
            Assert.AreEqual(BeatType.Narration, beats[3].Type);
            Assert.AreEqual(BeatType.ScreenEffect, beats[4].Type);
            Assert.AreEqual(BeatType.BriefCard, beats[5].Type);
            Assert.AreEqual(BeatType.CutsceneMarker, beats[6].Type);
            Assert.AreEqual(BeatType.EnvironmentDesc, beats[7].Type);
        }

        [Test]
        public void StoryScript_DefaultLists_AreEmpty()
        {
            var script = new StoryScript { StageId = "test" };
            Assert.IsNotNull(script.PreMission);
            Assert.IsNotNull(script.PostMission);
            Assert.IsNotNull(script.CombatDialogue);
            Assert.IsNotNull(script.DefeatDialogue);
            Assert.AreEqual(0, script.PreMission.Count);
        }

        [Test]
        public void DefeatDialogue_CanBeShort()
        {
            var script = new StoryScript
            {
                StageId = "1-5",
                DefeatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Dialogue("kael", "Fall back. Regroup.")
                }
            };

            Assert.AreEqual(1, script.DefeatDialogue.Count);
        }

        [Test]
        public void HasCutscene_Flag_DefaultsFalse()
        {
            var script = new StoryScript { StageId = "1-1" };
            Assert.IsFalse(script.HasCutscene);
        }
    }
}
