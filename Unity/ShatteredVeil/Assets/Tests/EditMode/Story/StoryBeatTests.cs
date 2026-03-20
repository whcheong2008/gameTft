using System;
using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Story;

namespace ShatteredVeil.Tests.EditMode.Story
{
    [TestFixture]
    public class StoryBeatTests
    {
        [SetUp]
        public void SetUp()
        {
            StoryCatalog.Clear();
        }

        [Test]
        public void AllBeatTypes_CreateValidStoryBeat()
        {
            foreach (BeatType type in Enum.GetValues(typeof(BeatType)))
            {
                var beat = new StoryBeat { Type = type, Text = "Test" };
                Assert.AreEqual(type, beat.Type);
                Assert.AreEqual("Test", beat.Text);
            }
        }

        [Test]
        public void DialogueFactory_SetsCorrectFields()
        {
            var beat = StoryBeat.Dialogue("kael", "Hold the line.", "determined");
            Assert.AreEqual(BeatType.Dialogue, beat.Type);
            Assert.AreEqual("kael", beat.CharacterId);
            Assert.AreEqual("Hold the line.", beat.Text);
            Assert.AreEqual("determined", beat.Expression);
        }

        [Test]
        public void NarrationFactory_SetsCorrectFields()
        {
            var beat = StoryBeat.Narration("The wind howled.");
            Assert.AreEqual(BeatType.Narration, beat.Type);
            Assert.IsNull(beat.CharacterId);
            Assert.AreEqual("The wind howled.", beat.Text);
        }

        [Test]
        public void BriefCardFactory_SetsCorrectFields()
        {
            var beat = StoryBeat.BriefCard("Chapter 1");
            Assert.AreEqual(BeatType.BriefCard, beat.Type);
            Assert.AreEqual("Chapter 1", beat.Text);
        }

        [Test]
        public void CombatFactory_SetsCorrectFields()
        {
            var beat = StoryBeat.Combat("lyric", "Watch the flank!", "turn_1");
            Assert.AreEqual(BeatType.CombatDialogue, beat.Type);
            Assert.AreEqual("lyric", beat.CharacterId);
            Assert.AreEqual("Watch the flank!", beat.Text);
            Assert.AreEqual("turn_1", beat.TriggerCondition);
        }

        [Test]
        public void EffectFactory_SetsCorrectFields()
        {
            var beat = StoryBeat.Effect("fade_black", 2f);
            Assert.AreEqual(BeatType.ScreenEffect, beat.Type);
            Assert.AreEqual("fade_black", beat.EffectType);
            Assert.AreEqual(2f, beat.Duration);
        }

        [Test]
        public void PauseFactory_SetsDuration()
        {
            var beat = StoryBeat.PauseBeat(1.5f);
            Assert.AreEqual(BeatType.Pause, beat.Type);
            Assert.AreEqual(1.5f, beat.Duration);
        }

        [Test]
        public void ExpressionFactory_SetsFields()
        {
            var beat = StoryBeat.SetExpression("kael", "angry");
            Assert.AreEqual(BeatType.SetExpression, beat.Type);
            Assert.AreEqual("kael", beat.CharacterId);
            Assert.AreEqual("angry", beat.Expression);
        }

        [Test]
        public void CutsceneFactory_SetsFields()
        {
            var beat = StoryBeat.Cutscene("The Veil opens");
            Assert.AreEqual(BeatType.CutsceneMarker, beat.Type);
            Assert.AreEqual("The Veil opens", beat.Text);
        }

        [Test]
        public void StoryScript_EmptyBeatLists_IsValid()
        {
            var script = new StoryScript
            {
                StageId = "1-1",
                StageName = "Test",
                StageType = "story",
                PreMission = new List<StoryBeat>(),
                PostMission = new List<StoryBeat>(),
                CombatDialogue = new List<StoryBeat>(),
                DefeatDialogue = new List<StoryBeat>()
            };
            Assert.AreEqual("1-1", script.StageId);
            Assert.AreEqual(0, script.PreMission.Count);
            Assert.AreEqual(0, script.PostMission.Count);
        }

        [Test]
        public void StoryScript_GetCombatDialogueForTrigger_FiltersCorrectly()
        {
            var script = new StoryScript
            {
                StageId = "1-2",
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Hold!", "turn_1"),
                    StoryBeat.Combat("lyric", "Behind you!", "ally_death"),
                    StoryBeat.Combat("kael", "Push forward!", "turn_5")
                }
            };

            var turn1 = script.GetCombatDialogueForTrigger("turn_1");
            Assert.AreEqual(1, turn1.Count);
            Assert.AreEqual("Hold!", turn1[0].Text);

            var allyDeath = script.GetCombatDialogueForTrigger("ally_death");
            Assert.AreEqual(1, allyDeath.Count);

            var none = script.GetCombatDialogueForTrigger("boss_phase_2");
            Assert.AreEqual(0, none.Count);
        }

        [Test]
        public void CharacterData_ContainsAllMainCast()
        {
            var mainCast = new[] { "kael", "lyric", "senna", "otho", "maren", "mira" };
            foreach (var id in mainCast)
            {
                Assert.IsTrue(CharacterData.Exists(id), $"Missing character: {id}");
                var info = CharacterData.Get(id);
                Assert.IsNotNull(info);
                Assert.IsNotEmpty(info.DisplayName);
                Assert.IsNotEmpty(info.Element);
                Assert.IsTrue(info.AvailableExpressions.Length > 0);
            }
        }

        [Test]
        public void CharacterData_ContainsSupportingCast()
        {
            Assert.IsTrue(CharacterData.Exists("torren"));
            Assert.IsTrue(CharacterData.Exists("dren"));
            Assert.IsTrue(CharacterData.Exists("narrator"));
        }

        [Test]
        public void CharacterData_ReturnsNullForUnknown()
        {
            Assert.IsNull(CharacterData.Get("nobody"));
            Assert.IsFalse(CharacterData.Exists("nobody"));
        }

        [Test]
        public void CharacterData_JoinsAtRegion_IsCorrect()
        {
            Assert.AreEqual(1, CharacterData.Get("kael").JoinsAtRegion);
            Assert.AreEqual(1, CharacterData.Get("lyric").JoinsAtRegion);
            Assert.AreEqual(3, CharacterData.Get("maren").JoinsAtRegion);
            Assert.AreEqual(5, CharacterData.Get("mira").JoinsAtRegion);
        }

        [Test]
        public void StoryCatalog_RegisterAndRetrieve()
        {
            var script = new StoryScript { StageId = "1-1", StageName = "The Arrival" };
            StoryCatalog.Register("1-1", script);

            Assert.IsTrue(StoryCatalog.HasStory("1-1"));
            var retrieved = StoryCatalog.GetScript("1-1");
            Assert.IsNotNull(retrieved);
            Assert.AreEqual("The Arrival", retrieved.StageName);
        }

        [Test]
        public void StoryCatalog_ReturnsNullForUnregistered()
        {
            Assert.IsFalse(StoryCatalog.HasStory("99-99"));
            Assert.IsNull(StoryCatalog.GetScript("99-99"));
        }

        [Test]
        public void StoryCatalog_OverwriteExistingStage()
        {
            StoryCatalog.Register("1-1", new StoryScript { StageName = "Old" });
            StoryCatalog.Register("1-1", new StoryScript { StageName = "New" });

            Assert.AreEqual("New", StoryCatalog.GetScript("1-1").StageName);
            Assert.AreEqual(1, StoryCatalog.Count);
        }

        [Test]
        public void StoryCatalog_ClearRemovesAll()
        {
            StoryCatalog.Register("1-1", new StoryScript());
            StoryCatalog.Register("1-2", new StoryScript());
            Assert.AreEqual(2, StoryCatalog.Count);

            StoryCatalog.Clear();
            Assert.AreEqual(0, StoryCatalog.Count);
            Assert.IsFalse(StoryCatalog.HasStory("1-1"));
        }
    }
}
