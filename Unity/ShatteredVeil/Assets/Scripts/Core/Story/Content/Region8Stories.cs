using System.Collections.Generic;

namespace ShatteredVeil.Core.Story.Content
{
    public static class Region8Stories
    {
        public static void RegisterAll()
        {
            StoryCatalog.Register("8-1", CreateStage8_1());
            StoryCatalog.Register("8-2", CreateStage8_2());
            StoryCatalog.Register("8-3", CreateStage8_3());
            StoryCatalog.Register("8-4", CreateStage8_4());
            StoryCatalog.Register("8-5", CreateStage8_5());
            StoryCatalog.Register("8-6", CreateStage8_6());
            StoryCatalog.Register("8-7", CreateStage8_7());
            StoryCatalog.Register("8-8", CreateStage8_8());
        }

        private static StoryScript CreateStage8_1()
        {
            return new StoryScript
            {
                StageId = "8-1",
                StageName = "The Nexus Revealed",
                StageType = "story",
                HasCutscene = true,
                EnvironmentDescription = "Wellspring -- Veil Nexus. Crystal ground stretches in every direction. The sky is bifurcated: half blue, half violet. The Sovereign fills the sky above, vast and formless. Voidspawn pour from tears in the air.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Mira writes in her notebook, hand moving fast, not looking up."),
                    StoryBeat.Dialogue("kael", "We're moving out.", "determined"),
                    StoryBeat.Narration("Mira closes the notebook. Tucks it inside her coat.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Every step closer to the Nexus brings harder resistance. The Sovereign knows they are coming.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage8_2()
        {
            return new StoryScript
            {
                StageId = "8-2",
                StageName = "The Sovereign Gauntlet I",
                StageType = "gameplay",
                HasCutscene = true,
                EnvironmentDescription = "Crystal ground cracking underfoot. The sky pulses between violet and black in rhythmic waves.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.BriefCard("The final approach is a gauntlet. Every step costs blood.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The Veil is seething. Eruption accelerating.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Hold the line!", "turn_1"),
                    StoryBeat.Combat("maren", "Healing incoming!", "turn_3")
                }
            };
        }

        private static StoryScript CreateStage8_3()
        {
            return new StoryScript
            {
                StageId = "8-3",
                StageName = "The Sovereign Gauntlet II",
                StageType = "gameplay",
                HasCutscene = true,
                EnvironmentDescription = "Crystal ground cracking further. The sky pulses faster, the violet deepening. The air itself resists forward movement.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Voss moves to the front without being asked."),
                    StoryBeat.Dialogue("kael", "Voss.", "neutral"),
                    StoryBeat.Dialogue("voss", "You gave your word this would work. I'm holding you to it.", "determined")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Eruption still accelerating. The ground beneath them is more light than stone.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("voss", "Everything -- push!", "turn_1"),
                    StoryBeat.Combat("kael", "Hold the line!", "turn_3")
                }
            };
        }

        private static StoryScript CreateStage8_4()
        {
            return new StoryScript
            {
                StageId = "8-4",
                StageName = "The Sovereign Phase One",
                StageType = "boss",
                HasCutscene = true,
                EnvironmentDescription = "The Sovereign up close. No face, no features. Corruption given geometry. It fills the arena like weather.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Cutscene. The group stands before the Sovereign. It has no face. No features. It is corruption given geometry, and it fills the sky like weather.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Phase one ends. The Sovereign is still at eighty percent. It hasn't even noticed them yet.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Spread the damage!", "turn_1"),
                    StoryBeat.Combat("sera", "No single element!", "turn_3"),
                    StoryBeat.Combat("maren", "Healing reserves -- be careful!", "turn_5")
                }
            };
        }

        private static StoryScript CreateStage8_5()
        {
            return new StoryScript
            {
                StageId = "8-5",
                StageName = "The Sovereign Phase Two",
                StageType = "boss",
                HasCutscene = true,
                EnvironmentDescription = "The arena contracts. Grid squares dissolve at the edges, falling into void. The Sovereign reshapes itself.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The Sovereign copies them. Four Void Champions rise from the ground -- dark mirrors of the party."),
                    StoryBeat.Narration("Voss just attacks the nearest copy. No hesitation. No strategy.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Phase two ends. The Sovereign is at sixty percent. The copies dissolve. It is learning.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Focus fire -- one target!", "turn_1"),
                    StoryBeat.Combat("maren", "Healers, priority!", "turn_3"),
                    StoryBeat.Combat("sera", "Its copy is using my spells -- shut it down!", "turn_5")
                }
            };
        }

        private static StoryScript CreateStage8_6()
        {
            return new StoryScript
            {
                StageId = "8-6",
                StageName = "The Sovereign Phase Three",
                StageType = "boss",
                HasCutscene = true,
                EnvironmentDescription = "The battlefield shrinks further. Twelve-second void pulses sweep across the remaining ground. The Sovereign is wounded but vast.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Dialogue("senna", "Healing is suppressed -- I can't keep everyone alive. Focus damage.", "strained"),
                    StoryBeat.Dialogue("voss", "EVERYTHING! NOW!", "determined"),
                    StoryBeat.Narration("Sera channels her final burst.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The Sovereign falls."),
                    StoryBeat.PauseBeat(3f),
                    StoryBeat.Narration("Three seconds of quiet. Then the corruption begins pooling. Rebuilding."),
                    StoryBeat.Dialogue("otho", "It's regenerating. The Veil is still open.", "shocked")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Final burst -- NOW!", "turn_1"),
                    StoryBeat.Combat("sera", "Everything we have!", "turn_3"),
                    StoryBeat.Combat("voss", "FINISH IT!", "turn_5")
                }
            };
        }

        private static StoryScript CreateStage8_7()
        {
            return new StoryScript
            {
                StageId = "8-7",
                StageName = "The Seal",
                StageType = "story",
                HasCutscene = true,
                EnvironmentDescription = "Center of the Nexus. The crystal ground is at its brightest. The Veil is absent here -- two worlds overlapping, visible simultaneously.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Senna, Otho, and Mira kneel in a triangle at the center. They begin channeling."),
                    StoryBeat.PauseBeat(2f),
                    StoryBeat.Narration("Small tears seal. Wild Echoes scream as their connections sever. The Sovereign slows."),
                    StoryBeat.Narration("But the large tears hold. The ancient rents in the Veil won't close."),
                    StoryBeat.Dialogue("otho", "It's not enough. The large tears aren't responding. We need more.", "strained")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Ren moves between the Veilborn and the Sovereign. Sera falls in beside him. Then Maren. The Resonants form a wall."),
                    StoryBeat.Narration("The Veilborn have time. The Resonants will give them that.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage8_8()
        {
            return new StoryScript
            {
                StageId = "8-8",
                StageName = "The End",
                StageType = "story",
                HasCutscene = true,
                EnvironmentDescription = "Nexus center. Three Veilborn channeling. Resonants standing guard. The sky is half-sealed, half-torn. The world is balanced on a knife's edge.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The Nexus hums with channeled energy. Senna, Otho, and Mira pour everything they have into the Veil."),
                    StoryBeat.Effect("screen_shake", 1f),
                    StoryBeat.PauseBeat(2f),
                    StoryBeat.Narration("The remaining tears resist. The Sovereign stirs. The Resonants brace."),
                    StoryBeat.Effect("flash_white", 0.5f),
                    StoryBeat.PauseBeat(1.5f),
                    StoryBeat.Narration("It is not enough.")
                },
                PostMission = new List<StoryBeat>
                {
                    // Senna's choice
                    StoryBeat.Narration("Senna understands. She stands."),
                    StoryBeat.PauseBeat(1f),
                    StoryBeat.Dialogue("senna", "I can burn my connection instead of severing it. One life. Freely given. Even your principles allow that.", "determined"),
                    StoryBeat.Dialogue("kael", "Senna, no --", "shocked"),
                    StoryBeat.Dialogue("senna", "You promised Lyric you'd find another way. This is the other way. It's just not the one you wanted.", "sad"),
                    StoryBeat.PauseBeat(2f),
                    StoryBeat.Narration("Senna returns to the triangle. She kneels. She burns."),
                    StoryBeat.Effect("screen_shake", 1.5f),
                    StoryBeat.Effect("flash_white", 1f),
                    StoryBeat.PauseBeat(1f),
                    StoryBeat.Narration("The largest tear shudders. Her body glows -- brighter than the crystal beneath her."),
                    StoryBeat.Effect("fade_black", 2f),
                    StoryBeat.PauseBeat(3f),
                    StoryBeat.Effect("fade_from_black", 2f),
                    StoryBeat.Narration("Senna's glow had faded. She had fallen."),
                    StoryBeat.PauseBeat(2f),

                    // Otho's choice
                    StoryBeat.Narration("Then Otho stood. He didn't speak. He caught Kael's eye. His nod was small. Sad. Certain."),
                    StoryBeat.PauseBeat(1.5f),
                    StoryBeat.Narration("He joined the burn."),
                    StoryBeat.Effect("flash_white", 1f),
                    StoryBeat.Narration("Two more tears slammed shut. The Sovereign cracked."),
                    StoryBeat.PauseBeat(2f),

                    // The last tear
                    StoryBeat.Narration("One tear remained. The oldest. It held."),
                    StoryBeat.Narration("The Sovereign began pulling itself together."),
                    StoryBeat.PauseBeat(2f),

                    // Mira
                    StoryBeat.Narration("Mira was standing behind Kael. Notebook clutched to her chest. Shaking."),
                    StoryBeat.PauseBeat(1f),
                    StoryBeat.Narration("She stepped forward. Stopped."),
                    StoryBeat.PauseBeat(1f),
                    StoryBeat.Narration("Stepped forward. Stopped."),
                    StoryBeat.PauseBeat(2f),

                    // Kael's decision
                    StoryBeat.Narration("Kael channeled. Everything. Through the Veilborn connections. Through Senna's trace. Through Otho's. Through Mira's."),
                    StoryBeat.Effect("flash_white", 2f),
                    StoryBeat.Effect("screen_shake", 2f),
                    StoryBeat.PauseBeat(1f),
                    StoryBeat.Narration("The last tear slammed shut."),
                    StoryBeat.PauseBeat(1f),
                    StoryBeat.Narration("The sky closed."),
                    StoryBeat.PauseBeat(0.5f),
                    StoryBeat.Narration("The crystal shattered outward."),
                    StoryBeat.Effect("screen_shake", 1.5f),
                    StoryBeat.PauseBeat(1f),
                    StoryBeat.Narration("The Sovereign collapsed."),
                    StoryBeat.PauseBeat(3f),

                    // Silence
                    StoryBeat.Narration("Silence. The hum of the Veil -- gone."),
                    StoryBeat.PauseBeat(3f),

                    // Meaning
                    StoryBeat.Narration("Senna had chosen. Otho had chosen. Mira was still deciding."),
                    StoryBeat.PauseBeat(1.5f),
                    StoryBeat.Narration("And Kael had decided for her."),
                    StoryBeat.PauseBeat(2f),
                    StoryBeat.Narration("He saved the world the way Lyric would have."),
                    StoryBeat.PauseBeat(3f),

                    // Epilogue
                    StoryBeat.Effect("fade_black", 2f),
                    StoryBeat.PauseBeat(3f),
                    StoryBeat.Effect("fade_from_black", 3f),
                    StoryBeat.Narration("The Veil sealed. Voidspawn stopped everywhere -- mid-stride, mid-attack -- and dissolved."),
                    StoryBeat.Narration("The Echoes were gone. The world was saved."),
                    StoryBeat.PauseBeat(2f),
                    StoryBeat.Narration("And diminished. Quieter. Less.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }
    }
}
