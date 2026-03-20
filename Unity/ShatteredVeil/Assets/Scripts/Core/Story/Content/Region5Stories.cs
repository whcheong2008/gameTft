using System.Collections.Generic;

namespace ShatteredVeil.Core.Story.Content
{
    public static class Region5Stories
    {
        public static void RegisterAll()
        {
            StoryCatalog.Register("5-1", CreateStage5_1());
            StoryCatalog.Register("5-2", CreateStage5_2());
            StoryCatalog.Register("5-3", CreateStage5_3());
            StoryCatalog.Register("5-4", CreateStage5_4());
            StoryCatalog.Register("5-5", CreateStage5_5());
            StoryCatalog.Register("5-6", CreateStage5_6());
            StoryCatalog.Register("5-7", CreateStage5_7());
            StoryCatalog.Register("5-8", CreateStage5_8());
            StoryCatalog.Register("5-9", CreateStage5_9());
            StoryCatalog.Register("5-10", CreateStage5_10());
        }

        private static StoryScript CreateStage5_1()
        {
            return new StoryScript
            {
                StageId = "5-1",
                StageName = "The Wellspring",
                StageType = "story",
                HasCutscene = true,
                EnvironmentDescription = "Group travels through hostile terrain. Trees twisted into crystal, rivers alien. Sovereign's slow creep visible.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Otho explains the Wellspring theory -- a convergence point where the Veil is thinnest. Veilborn channeling the seal would lose their powers but live."),
                    StoryBeat.Dialogue("otho", "I'm maybe sixty percent sure it will work.", "neutral"),
                    StoryBeat.Dialogue("senna", "Lose my powers. Stop being the thing that draws the darkness. I've made worse bargains.", "determined"),
                    StoryBeat.Dialogue("otho", "Three of us is the minimum. We go fast, we go light.", "neutral")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The group moves east. The path to the Wellspring is set.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage5_2()
        {
            return new StoryScript
            {
                StageId = "5-2",
                StageName = "Maren Returns",
                StageType = "character",
                EnvironmentDescription = "Open road, four days after leaving the observatory. The Veil feels thinner.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Maren comes from the west, alone. Senna opens her arms. Maren cries."),
                    StoryBeat.Dialogue("maren", "I walked away. I walked away and the dying didn't stop. It just meant I couldn't see it. And that was worse.", "sad")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Senna finds Maren apart from the group."),
                    StoryBeat.Dialogue("maren", "Every village I've ever been near, I was drawing the darkness toward it.", "sad"),
                    StoryBeat.Dialogue("senna", "That's not who you are.", "neutral"),
                    StoryBeat.Dialogue("maren", "It's what I am. Those are different things.", "sad")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage5_3()
        {
            return new StoryScript
            {
                StageId = "5-3",
                StageName = "Sera Rejoins",
                StageType = "character",
                EnvironmentDescription = "Eastern settlements, twelve days after Maren's return.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Sera arrives exhausted. The Veilborn relocations didn't work."),
                    StoryBeat.Dialogue("sera", "Your plan. The seal. Tell me what you need.", "determined")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Mira adjusts Sera's attunement."),
                    StoryBeat.Dialogue("sera", "When did you get good at this?", "neutral"),
                    StoryBeat.Dialogue("mira", "While you were gone.", "neutral")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage5_4()
        {
            return new StoryScript
            {
                StageId = "5-4",
                StageName = "Mira's Attunement Training",
                StageType = "character",
                EnvironmentDescription = "Camp during eastward travel. Senna training Mira.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Senna trains Mira formally. Mira adjusts Kael's bond."),
                    StoryBeat.Dialogue("kael", "That felt... different.", "neutral"),
                    StoryBeat.Dialogue("mira", "Bad different?", "neutral"),
                    StoryBeat.Dialogue("kael", "Not wrong. Cleaner, maybe.", "neutral")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Senna delegates more to Mira.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage5_5()
        {
            return new StoryScript
            {
                StageId = "5-5",
                StageName = "The Ferryman's Village",
                StageType = "story",
                EnvironmentDescription = "River crossing, peaceful ferryman's village.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The ferryman recognizes Senna."),
                    StoryBeat.Dialogue("narrator", "The kind lady!", "happy"),
                    StoryBeat.Narration("He gives her his daughter's wooden charm. Normal conversation crossing the river. Then: smoke on the horizon.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The village has been hit. Kael finds a matching wooden bird in the rubble. The ferryman is rowing back. He doesn't know yet."),
                    StoryBeat.Narration("Senna holds the charm.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage5_6()
        {
            return new StoryScript
            {
                StageId = "5-6",
                StageName = "Hardening East",
                StageType = "gameplay",
                EnvironmentDescription = "Terrain increasingly unstable. Trees at wrong angles.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.BriefCard("The group pushes through destabilizing terrain.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Mira is getting faster at field attunement.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Hold formation through the shifts!", "turn_1"),
                    StoryBeat.Combat("mira", "Attunement adjusting -- stay steady!", "turn_3"),
                    StoryBeat.Combat("maren", "Healing incoming -- push!", "turn_5")
                }
            };
        }

        private static StoryScript CreateStage5_7()
        {
            return new StoryScript
            {
                StageId = "5-7",
                StageName = "Attunement Breakthrough",
                StageType = "character",
                EnvironmentDescription = "Camp in unstable terrain. Fire and water in the same space.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Mira's technique has improved dramatically. Sera nods at her."),
                    StoryBeat.Narration("Senna finds Mira with her notebook. Senna nods. Just once.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Tomorrow they reach the center.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage5_8()
        {
            return new StoryScript
            {
                StageId = "5-8",
                StageName = "The Elemental Chimera",
                StageType = "boss",
                HasCutscene = true,
                EnvironmentDescription = "Elemental chaos terrain. The Chimera stands at the center.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.BriefCard("An Elemental Chimera blocks the path forward. It shifts between elements unpredictably.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The Chimera falls. Senna nods at Mira. She's proven herself.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "It's shifting -- switch elements!", "turn_1"),
                    StoryBeat.Combat("maren", "Healing incoming -- hold formation!", "turn_3"),
                    StoryBeat.Combat("narrator", "Mira performs her first field attunement under pressure, stabilizing Kael's bond.", "boss_phase_2")
                }
            };
        }

        private static StoryScript CreateStage5_9()
        {
            return new StoryScript
            {
                StageId = "5-9",
                StageName = "Connector March",
                StageType = "gameplay",
                EnvironmentDescription = "Corrupted landscape shifting around the group.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.BriefCard("The group marches toward the Crucible through shifting, corrupted terrain.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The group reaches the Crucible's edge.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Hold the line!", "turn_1"),
                    StoryBeat.Combat("senna", "Bonds holding steady!", "turn_3"),
                    StoryBeat.Combat("sera", "Move, move, move!", "turn_5")
                }
            };
        }

        private static StoryScript CreateStage5_10()
        {
            return new StoryScript
            {
                StageId = "5-10",
                StageName = "The Seal Plan Refined",
                StageType = "character",
                EnvironmentDescription = "Camp at the Crucible's edge. Crystal formations surround the group.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Otho refines the seal theory. Three Veilborn are needed."),
                    StoryBeat.Dialogue("otho", "Clean severance should handle newer tears. But the oldest ones... there's a harder way -- burning the connection. Not survivable.", "neutral"),
                    StoryBeat.Dialogue("senna", "Then make sure your math is right.", "determined")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Tomorrow they enter the Crucible proper.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }
    }
}
