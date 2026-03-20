using System.Collections.Generic;
using NUnit.Framework;
using ShatteredVeil.Core.Story;
using ShatteredVeil.Core.Story.Content;

namespace ShatteredVeil.Tests.EditMode.Story
{
    [TestFixture]
    public class StoryContentR5R8Tests
    {
        [SetUp]
        public void SetUp()
        {
            StoryCatalog.Clear();
        }

        [Test]
        public void Region5_RegistersExactly10Scripts()
        {
            Region5Stories.RegisterAll();
            int count = 0;
            for (int i = 1; i <= 10; i++)
                if (StoryCatalog.HasStory($"5-{i}")) count++;
            Assert.AreEqual(10, count);
        }

        [Test]
        public void Region6_RegistersExactly10Scripts()
        {
            Region6Stories.RegisterAll();
            int count = 0;
            for (int i = 1; i <= 10; i++)
                if (StoryCatalog.HasStory($"6-{i}")) count++;
            Assert.AreEqual(10, count);
        }

        [Test]
        public void Region7_RegistersExactly10Scripts()
        {
            Region7Stories.RegisterAll();
            int count = 0;
            for (int i = 1; i <= 10; i++)
                if (StoryCatalog.HasStory($"7-{i}")) count++;
            Assert.AreEqual(10, count);
        }

        [Test]
        public void Region8_RegistersExactly8Scripts()
        {
            Region8Stories.RegisterAll();
            int count = 0;
            for (int i = 1; i <= 8; i++)
                if (StoryCatalog.HasStory($"8-{i}")) count++;
            Assert.AreEqual(8, count);
        }

        [Test]
        public void FullRegistrar_Registers74TotalScripts()
        {
            StoryContentRegistrar.RegisterAll();
            Assert.AreEqual(74, StoryCatalog.Count);
        }

        [Test]
        public void Region8FinalStage_HasCutscene()
        {
            Region8Stories.RegisterAll();
            var script = StoryCatalog.GetScript("8-8");
            Assert.IsNotNull(script);
            Assert.IsTrue(script.HasCutscene, "Final stage 8-8 should have HasCutscene=true");
        }

        [Test]
        public void MiraAppearsInRegion5()
        {
            Region5Stories.RegisterAll();
            bool miraFound = false;
            for (int i = 1; i <= 10; i++)
            {
                var script = StoryCatalog.GetScript($"5-{i}");
                if (script == null) continue;
                foreach (var beat in script.PreMission)
                {
                    if (beat.CharacterId == "mira") { miraFound = true; break; }
                }
                if (miraFound) break;
                foreach (var beat in script.PostMission)
                {
                    if (beat.CharacterId == "mira") { miraFound = true; break; }
                }
                if (miraFound) break;
            }
            Assert.IsTrue(miraFound, "Mira should appear in Region 5 scripts");
        }

        [Test]
        public void AllCharacterIds_ExistInCharacterData_R5R8()
        {
            StoryContentRegistrar.RegisterAll();
            var errors = new List<string>();

            for (int r = 5; r <= 8; r++)
            {
                int maxStage = r == 8 ? 8 : 10;
                for (int s = 1; s <= maxStage; s++)
                {
                    var script = StoryCatalog.GetScript($"{r}-{s}");
                    if (script == null) continue;

                    var allBeats = new List<StoryBeat>();
                    allBeats.AddRange(script.PreMission);
                    allBeats.AddRange(script.PostMission);
                    allBeats.AddRange(script.CombatDialogue);
                    allBeats.AddRange(script.DefeatDialogue);

                    foreach (var beat in allBeats)
                    {
                        if ((beat.Type == BeatType.Dialogue || beat.Type == BeatType.CombatDialogue) &&
                            !string.IsNullOrEmpty(beat.CharacterId) &&
                            !CharacterData.Exists(beat.CharacterId))
                        {
                            errors.Add($"{r}-{s}: Unknown character '{beat.CharacterId}'");
                        }
                    }
                }
            }

            Assert.IsEmpty(errors, string.Join("\n", errors));
        }

        [Test]
        public void AllScripts_R5R8_HaveEnvironmentDescription()
        {
            StoryContentRegistrar.RegisterAll();
            for (int r = 5; r <= 8; r++)
            {
                int maxStage = r == 8 ? 8 : 10;
                for (int s = 1; s <= maxStage; s++)
                {
                    var script = StoryCatalog.GetScript($"{r}-{s}");
                    Assert.IsNotNull(script, $"Missing script {r}-{s}");
                    Assert.IsNotEmpty(script.EnvironmentDescription,
                        $"Empty EnvironmentDescription for {r}-{s}");
                }
            }
        }

        [Test]
        public void AllBossStages_R5R8_HaveCutscene()
        {
            StoryContentRegistrar.RegisterAll();
            for (int r = 5; r <= 8; r++)
            {
                int maxStage = r == 8 ? 8 : 10;
                for (int s = 1; s <= maxStage; s++)
                {
                    var script = StoryCatalog.GetScript($"{r}-{s}");
                    if (script != null && script.StageType == "boss")
                    {
                        Assert.IsTrue(script.HasCutscene,
                            $"Boss stage {r}-{s} ({script.StageName}) missing HasCutscene flag");
                    }
                }
            }
        }
    }
}
