using System.Collections.Generic;

namespace ShatteredVeil.Core.Story.Content
{
    public static class Region7Stories
    {
        public static void RegisterAll()
        {
            StoryCatalog.Register("7-1", CreateStage7_1());
            StoryCatalog.Register("7-2", CreateStage7_2());
            StoryCatalog.Register("7-3", CreateStage7_3());
            StoryCatalog.Register("7-4", CreateStage7_4());
            StoryCatalog.Register("7-5", CreateStage7_5());
            StoryCatalog.Register("7-6", CreateStage7_6());
            StoryCatalog.Register("7-7", CreateStage7_7());
            StoryCatalog.Register("7-8", CreateStage7_8());
            StoryCatalog.Register("7-9", CreateStage7_9());
            StoryCatalog.Register("7-10", CreateStage7_10());
        }

        private static StoryScript CreateStage7_1()
        {
            return new StoryScript
            {
                StageId = "7-1",
                StageName = "Voss Found",
                StageType = "character",
                EnvironmentDescription = "Canyon where reality stutters. The Veil is so thin that the mortal world and the Otherside overlap visibly.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The group finds Voss fighting alone in the canyon. His bonds are degrading -- he has been running without a Veilborn for months."),
                    StoryBeat.Narration("Ren crashes into the fight. Sera vaporizes creatures flanking Voss.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Dialogue("voss", "Veilborn.", "neutral"),
                    StoryBeat.Dialogue("kael", "Two of them. Three, counting Otho.", "neutral"),
                    StoryBeat.Dialogue("voss", "I need attunement. I'll be combat-ineffective in two weeks.", "determined"),
                    StoryBeat.Dialogue("voss", "I heard about your seal plan. You have Veilborn and I need them. You're heading to the Wellspring and you need another fighter. Simple math.", "determined")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Go!", "turn_1"),
                    StoryBeat.Combat("sera", "Formation tight!", "turn_3")
                }
            };
        }

        private static StoryScript CreateStage7_2()
        {
            return new StoryScript
            {
                StageId = "7-2",
                StageName = "Senna Refreshes Voss",
                StageType = "character",
                EnvironmentDescription = "Camp, evening. The canyon is stabilizing around them.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Senna refreshes Voss's attunement. She works carefully, tracing the degraded bonds."),
                    StoryBeat.Dialogue("senna", "How long without a Veilborn?", "neutral"),
                    StoryBeat.Dialogue("voss", "Four months.", "neutral"),
                    StoryBeat.Dialogue("senna", "That shouldn't be possible.", "shocked"),
                    StoryBeat.Dialogue("voss", "I'm stubborn.", "neutral"),
                    StoryBeat.Dialogue("senna", "Where's your attunist?", "neutral"),
                    StoryBeat.Dialogue("voss", "Left. After the truth spread.", "neutral")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Senna maintains Voss's bonds repeatedly over the following days. A professional transaction -- nothing more, nothing less.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage7_3()
        {
            return new StoryScript
            {
                StageId = "7-3",
                StageName = "Voss Integration",
                StageType = "character",
                EnvironmentDescription = "Camp during Voss's first week with the group.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Voss integrates by not trying to integrate. He treats Veilborn like professionals."),
                    StoryBeat.Dialogue("voss", "Your secondary bonds are pulling. Can you tighten them?", "neutral"),
                    StoryBeat.Narration("He asks Mira directly. No guilt. No philosophy.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Mira starts sitting closer to the group. Voss's practicality reminds her she has value beyond being a problem.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage7_4()
        {
            return new StoryScript
            {
                StageId = "7-4",
                StageName = "Sera and Voss Understand",
                StageType = "character",
                EnvironmentDescription = "Camp, post-combat. Voss warming up. Sera watching.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Dialogue("sera", "You favor your right side. Your left bond is degraded.", "neutral"),
                    StoryBeat.Dialogue("voss", "I know.", "neutral"),
                    StoryBeat.Dialogue("sera", "I'll compensate.", "determined"),
                    StoryBeat.Narration("Two pragmatists sizing each other up.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Sera and Voss work together seamlessly afterward. No discussion needed -- just mutual understanding.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage7_5()
        {
            return new StoryScript
            {
                StageId = "7-5",
                StageName = "Ren's Tactical Input",
                StageType = "character",
                EnvironmentDescription = "Proving Grounds warzone. A Voidspawn stronghold looms ahead.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("During the assault on the stronghold, Ren speaks his first tactical comment."),
                    StoryBeat.Dialogue("ren", "Hold position. Let them come to us.", "determined"),
                    StoryBeat.Narration("Kael adapts immediately."),
                    StoryBeat.Dialogue("kael", "Shift defensive stance!", "determined")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Ren is no longer just a supporter. Kael recognizes him as a tactical equal.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("ren", "Hold position. Let them come to us.", "turn_1"),
                    StoryBeat.Combat("kael", "Shift defensive stance!", "turn_3")
                }
            };
        }

        private static StoryScript CreateStage7_6()
        {
            return new StoryScript
            {
                StageId = "7-6",
                StageName = "Final Approach Warzone",
                StageType = "gameplay",
                EnvironmentDescription = "Concentrated Voidspawn warzone. Gravity shifts unpredictably. The sky strobes with unnatural light.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.BriefCard("The group fights through the Proving Grounds.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The group pushes deeper into the Proving Grounds. The Sovereign looms larger overhead with every step.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Hold the line!", "turn_1"),
                    StoryBeat.Combat("sera", "Spread formation -- they're everywhere!", "turn_3"),
                    StoryBeat.Combat("maren", "Healing incoming -- stay mobile!", "turn_5"),
                    StoryBeat.Combat("senna", "Bonds holding -- push!", "turn_7")
                }
            };
        }

        private static StoryScript CreateStage7_7()
        {
            return new StoryScript
            {
                StageId = "7-7",
                StageName = "Otho's Final Calculations",
                StageType = "character",
                EnvironmentDescription = "Camp. Otho works obsessively. Papers cover the table.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Kael addresses the full group. He explains the plan: Veilborn channel the seal at the convergence point. The barrier closes. Echoes are lost. Veilborn lose their powers but live.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Dialogue("senna", "And we do this willingly.", "determined"),
                    StoryBeat.Dialogue("voss", "When do we move?", "neutral"),
                    StoryBeat.Dialogue("kael", "Tomorrow.", "determined"),
                    StoryBeat.Dialogue("voss", "Good.", "neutral")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage7_8()
        {
            return new StoryScript
            {
                StageId = "7-8",
                StageName = "Final Camp Preparations",
                StageType = "character",
                EnvironmentDescription = "Final camp. The ground is crystal, faintly luminous beneath their feet.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Otho finishes his calculations. Senna does final attunement checks. Mira writes her final observations. Energy moves in spirals around the camp.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Nobody sleeps. Maren checks supplies. Ren cleans weapons. Sera sits quiet. Senna holds a wooden charm one last time.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage7_9()
        {
            return new StoryScript
            {
                StageId = "7-9",
                StageName = "The Arbiter of Trials",
                StageType = "boss",
                HasCutscene = true,
                EnvironmentDescription = "Warzone arena. The Sovereign is visible constantly overhead, a massive presence painting the sky wrong colors.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The Arbiter stands guard -- an ancient Voidspawn with intelligence behind its eyes. It blocks the path to the Wellspring."),
                    StoryBeat.Dialogue("kael", "This thing is a guardian.", "determined"),
                    StoryBeat.Dialogue("senna", "We're doing this willingly.", "determined"),
                    StoryBeat.Dialogue("voss", "Together.", "determined"),
                    StoryBeat.Narration("Three phases: Synergy Suppression, Battlefield Split, and a final DPS Race countdown.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The Arbiter dissolves. The path to the Wellspring is clear."),
                    StoryBeat.Dialogue("kael", "Together. Whatever happens.", "determined"),
                    StoryBeat.Dialogue("voss", "Together.", "determined")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Both sides -- push the damage!", "boss_phase_1"),
                    StoryBeat.Combat("voss", "Interrupt the charge!", "boss_phase_2"),
                    StoryBeat.Combat("sera", "Burst now!", "boss_phase_3"),
                    StoryBeat.Combat("maren", "Healing is down to reserves -- finish this!", "boss_phase_3")
                }
            };
        }

        private static StoryScript CreateStage7_10()
        {
            return new StoryScript
            {
                StageId = "7-10",
                StageName = "The Wellspring Awaits",
                StageType = "character",
                EnvironmentDescription = "Final approach. The crystal ground is smooth and unbroken. The Sovereign hangs overhead.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The group reaches the Wellspring zone."),
                    StoryBeat.Dialogue("kael", "Tomorrow morning. We seal the Wellspring. We close the Veil. We end the Sovereign's influence. And we all go home.", "determined"),
                    StoryBeat.Narration("Senna, Mira, and Otho stand together. Maren squeezes Senna's hand.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Final camp. Nobody sleeps. All eight sit watching the Sovereign paint the sky wrong colors. Tomorrow: the end. Tonight: still together.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }
    }
}
