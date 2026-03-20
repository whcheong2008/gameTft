using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Story;
using ShatteredVeil.Core.Story.Content;

namespace ShatteredVeil.Tests.EditMode.Story
{
    [TestFixture]
    public class StoryContentR1R4Tests
    {
        [SetUp]
        public void SetUp()
        {
            StoryCatalog.Clear();
        }

        [Test]
        public void Region1_RegistersExactly9Scripts()
        {
            Region1Stories.RegisterAll();
            int count = 0;
            for (int i = 1; i <= 9; i++)
                if (StoryCatalog.HasStory($"1-{i}")) count++;
            Assert.AreEqual(9, count);
        }

        [Test]
        public void Region2_RegistersExactly9Scripts()
        {
            Region2Stories.RegisterAll();
            int count = 0;
            for (int i = 1; i <= 9; i++)
                if (StoryCatalog.HasStory($"2-{i}")) count++;
            Assert.AreEqual(9, count);
        }

        [Test]
        public void Region3_RegistersExactly9Scripts()
        {
            Region3Stories.RegisterAll();
            int count = 0;
            for (int i = 1; i <= 9; i++)
                if (StoryCatalog.HasStory($"3-{i}")) count++;
            Assert.AreEqual(9, count);
        }

        [Test]
        public void Region4_RegistersExactly9Scripts()
        {
            Region4Stories.RegisterAll();
            int count = 0;
            for (int i = 1; i <= 9; i++)
                if (StoryCatalog.HasStory($"4-{i}")) count++;
            Assert.AreEqual(9, count);
        }

        [Test]
        public void AllScripts_HaveNonEmptyStageName()
        {
            StoryContentRegistrar.RegisterAll();
            for (int r = 1; r <= 4; r++)
            {
                for (int s = 1; s <= 9; s++)
                {
                    var script = StoryCatalog.GetScript($"{r}-{s}");
                    Assert.IsNotNull(script, $"Missing script {r}-{s}");
                    Assert.IsNotEmpty(script.StageName, $"Empty StageName for {r}-{s}");
                }
            }
        }

        [Test]
        public void StoryAndBossStages_HaveNonEmptyPreMission()
        {
            StoryContentRegistrar.RegisterAll();
            for (int r = 1; r <= 4; r++)
            {
                for (int s = 1; s <= 9; s++)
                {
                    var script = StoryCatalog.GetScript($"{r}-{s}");
                    if (script.StageType == "story" || script.StageType == "boss")
                    {
                        Assert.IsTrue(script.PreMission.Count > 0,
                            $"Story/Boss stage {r}-{s} ({script.StageName}) has empty PreMission");
                    }
                }
            }
        }

        [Test]
        public void AllScripts_HaveEnvironmentDescription()
        {
            StoryContentRegistrar.RegisterAll();
            for (int r = 1; r <= 4; r++)
            {
                for (int s = 1; s <= 9; s++)
                {
                    var script = StoryCatalog.GetScript($"{r}-{s}");
                    Assert.IsNotEmpty(script.EnvironmentDescription,
                        $"Empty EnvironmentDescription for {r}-{s}");
                }
            }
        }

        [Test]
        public void AllCharacterIds_ExistInCharacterData()
        {
            StoryContentRegistrar.RegisterAll();
            var errors = new List<string>();

            for (int r = 1; r <= 4; r++)
            {
                for (int s = 1; s <= 9; s++)
                {
                    var script = StoryCatalog.GetScript($"{r}-{s}");
                    var allBeats = new List<StoryBeat>();
                    allBeats.AddRange(script.PreMission);
                    allBeats.AddRange(script.PostMission);
                    allBeats.AddRange(script.CombatDialogue);
                    allBeats.AddRange(script.DefeatDialogue);

                    foreach (var beat in allBeats)
                    {
                        if (beat.Type == BeatType.Dialogue || beat.Type == BeatType.CombatDialogue)
                        {
                            if (!string.IsNullOrEmpty(beat.CharacterId) &&
                                !CharacterData.Exists(beat.CharacterId))
                            {
                                errors.Add($"{r}-{s}: Unknown character '{beat.CharacterId}'");
                            }
                        }
                    }
                }
            }

            Assert.IsEmpty(errors, string.Join("\n", errors));
        }

        [Test]
        public void NoNullTextInDialogueBeats()
        {
            StoryContentRegistrar.RegisterAll();
            var errors = new List<string>();

            for (int r = 1; r <= 4; r++)
            {
                for (int s = 1; s <= 9; s++)
                {
                    var script = StoryCatalog.GetScript($"{r}-{s}");
                    var allBeats = new List<StoryBeat>();
                    allBeats.AddRange(script.PreMission);
                    allBeats.AddRange(script.PostMission);
                    allBeats.AddRange(script.CombatDialogue);
                    allBeats.AddRange(script.DefeatDialogue);

                    foreach (var beat in allBeats)
                    {
                        if ((beat.Type == BeatType.Dialogue ||
                             beat.Type == BeatType.Narration ||
                             beat.Type == BeatType.BriefCard ||
                             beat.Type == BeatType.CombatDialogue) &&
                            string.IsNullOrEmpty(beat.Text))
                        {
                            errors.Add($"{r}-{s}: Null/empty text in {beat.Type} beat");
                        }
                    }
                }
            }

            Assert.IsEmpty(errors, string.Join("\n", errors));
        }

        [Test]
        public void TotalRegisteredScripts_Is36()
        {
            StoryContentRegistrar.RegisterAll();
            Assert.AreEqual(36, StoryCatalog.Count);
        }

        [Test]
        public void BossStages_HaveCutsceneFlag()
        {
            StoryContentRegistrar.RegisterAll();
            for (int r = 1; r <= 4; r++)
            {
                for (int s = 1; s <= 9; s++)
                {
                    var script = StoryCatalog.GetScript($"{r}-{s}");
                    if (script.StageType == "boss")
                    {
                        Assert.IsTrue(script.HasCutscene,
                            $"Boss stage {r}-{s} ({script.StageName}) missing HasCutscene flag");
                    }
                }
            }
        }

        [Test]
        public void Stage1_1_IsTheArrival()
        {
            Region1Stories.RegisterAll();
            var script = StoryCatalog.GetScript("1-1");
            Assert.AreEqual("The Arrival", script.StageName);
            Assert.AreEqual("story", script.StageType);
            Assert.IsTrue(script.PreMission.Count > 0);
        }

        [Test]
        public void Stage4_4_IsTheRevelation()
        {
            Region4Stories.RegisterAll();
            var script = StoryCatalog.GetScript("4-4");
            Assert.AreEqual("The Revelation", script.StageName);
            Assert.AreEqual("story", script.StageType);
            Assert.IsTrue(script.HasCutscene);
            Assert.IsTrue(script.PreMission.Count >= 10,
                "The Revelation should have substantial pre-mission dialogue");
        }

        [Test]
        public void Stage4_8_IsLyricsSacrifice()
        {
            Region4Stories.RegisterAll();
            var script = StoryCatalog.GetScript("4-8");
            Assert.AreEqual("Lyric's Sacrifice", script.StageName);
            Assert.IsTrue(script.HasCutscene);
        }
    }
}
