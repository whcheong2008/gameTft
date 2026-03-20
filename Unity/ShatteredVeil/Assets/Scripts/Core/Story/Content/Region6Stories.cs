using System.Collections.Generic;

namespace ShatteredVeil.Core.Story.Content
{
    public static class Region6Stories
    {
        public static void RegisterAll()
        {
            StoryCatalog.Register("6-1", CreateStage6_1());
            StoryCatalog.Register("6-2", CreateStage6_2());
            StoryCatalog.Register("6-3", CreateStage6_3());
            StoryCatalog.Register("6-4", CreateStage6_4());
            StoryCatalog.Register("6-5", CreateStage6_5());
            StoryCatalog.Register("6-6", CreateStage6_6());
            StoryCatalog.Register("6-7", CreateStage6_7());
            StoryCatalog.Register("6-8", CreateStage6_8());
            StoryCatalog.Register("6-9", CreateStage6_9());
            StoryCatalog.Register("6-10", CreateStage6_10());
        }

        private static StoryScript CreateStage6_1()
        {
            return new StoryScript
            {
                StageId = "6-1",
                StageName = "The Crucible Opens",
                StageType = "gameplay",
                EnvironmentDescription = "The Veil is so thin the landscape can't decide which world it belongs to. Crystal formations crunch underfoot. The sky shifts from deep blue to violet and back without warning.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.BriefCard("The group enters the Elemental Crucible--where the Veil is thinnest and reality itself is uncertain.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("From any high ground, the Sovereign is visible now -- a dark shape against the fractured horizon."),
                    StoryBeat.Narration("Mira wipes her nose. Blood. She says nothing, but Senna sees it.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Terrain shift--reposition!", "turn_1"),
                    StoryBeat.Combat("sera", "Elements are wild--adapt!", "turn_3"),
                    StoryBeat.Combat("senna", "Bonds holding--push harder!", "turn_5")
                }
            };
        }

        private static StoryScript CreateStage6_2()
        {
            return new StoryScript
            {
                StageId = "6-2",
                StageName = "Veil Instability Effects",
                StageType = "gameplay",
                EnvironmentDescription = "Multiple zones within the Crucible. Each pocket of space carries different elemental weight -- scorching heat gives way to freezing cold within steps. The ground pulses with unstable Veil energy.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.BriefCard("The group fights through the Elemental Crucible--each engagement harder than the last.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Sera's magic was devastating in the fight, but it leaves a faint corruption residue on her hands. She doesn't mention it."),
                    StoryBeat.Narration("Kael notices. He says nothing -- yet.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Hold through the shifts!", "turn_1"),
                    StoryBeat.Combat("senna", "I've got you, bonds are stable!", "turn_3"),
                    StoryBeat.Combat("sera", "Formation tight--move!", "turn_5")
                }
            };
        }

        private static StoryScript CreateStage6_3()
        {
            return new StoryScript
            {
                StageId = "6-3",
                StageName = "Will I Stop Being Veilborn?",
                StageType = "character",
                EnvironmentDescription = "Camp in the heart of the Crucible. The landscape is beautiful and terrible in equal measure -- crystalline formations catch light that shouldn't exist, casting prismatic shadows across the campsite.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Dialogue("mira", "Otho. Will I stop being Veilborn after we seal the Nexus?", "neutral"),
                    StoryBeat.Narration("Otho pauses carefully before answering."),
                    StoryBeat.Dialogue("otho", "Yes. Your connection will be severed. Permanently. You'll be... normal.", "neutral"),
                    StoryBeat.Dialogue("mira", "Good.", "neutral")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Later, Senna finds Mira alone at the edge of camp, writing in her notebook. The page is full of observations about attunement behavior after severance -- questions with no answers.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage6_4()
        {
            return new StoryScript
            {
                StageId = "6-4",
                StageName = "Refugee Camp",
                StageType = "story",
                EnvironmentDescription = "A valley sheltering a refugee camp. Hundreds of tents stretch across the uneven ground, threadbare and patched. Cook fires send thin smoke into the violet sky.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The group passes through the camp. Mira spots two siblings -- a boy around twelve and a girl around nine. The girl stares at nothing."),
                    StoryBeat.Narration("Their parents were Veilborn at a sanctuary the group passed through earlier. The surge followed their trail.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Maren crouches near the girl. The boy watches, protective."),
                    StoryBeat.Dialogue("narrator", "She stopped after we got here. Won't eat much.", "sad"),
                    StoryBeat.Narration("Maren understands. She stays with the children longer than she should."),
                    StoryBeat.Dialogue("senna", "We need to leave. Soon.", "neutral"),
                    StoryBeat.Narration("They leave at dawn.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage6_5()
        {
            return new StoryScript
            {
                StageId = "6-5",
                StageName = "Do You Think Lyric Was Right?",
                StageType = "character",
                EnvironmentDescription = "The road east after the refugee camp. Flat, cracked ground stretching toward the deeper Crucible. The silence is heavy.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("An hour of silence passes before Mira speaks."),
                    StoryBeat.Dialogue("mira", "Do you think Lyric was right?", "neutral"),
                    StoryBeat.Dialogue("kael", "I think he was right about the problem. I think he was wrong about the solution.", "neutral"),
                    StoryBeat.Dialogue("mira", "What if your solution doesn't work either?", "neutral"),
                    StoryBeat.Narration("Kael had nothing.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Mira nodded quietly. Wrote something in her notebook. They continued east.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage6_6()
        {
            return new StoryScript
            {
                StageId = "6-6",
                StageName = "Sera's Sacrifice",
                StageType = "character",
                EnvironmentDescription = "Camp in the deep Crucible. The air crackles with raw elemental energy. Every surface carries a faint luminescence.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("After a devastating engagement, Kael finds Sera breathing hard, braced against a crystal formation."),
                    StoryBeat.Dialogue("kael", "Your bond just destabilized for multiple seconds.", "determined"),
                    StoryBeat.Dialogue("sera", "We won faster.", "neutral"),
                    StoryBeat.Narration("Her bonds are degrading from overchanneling. The math is simple and ugly.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Senna spends extra time on Sera's attunement that night. Neither speaks.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage6_7()
        {
            return new StoryScript
            {
                StageId = "6-7",
                StageName = "Senna's Weight",
                StageType = "character",
                EnvironmentDescription = "Camp at night. The Veil presses down oppressively, thickening the air. Stars are visible but wrong -- too many, too bright, in patterns that don't match any sky.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Senna sits alone, holding the ferryman's charm. Mira finds her."),
                    StoryBeat.Dialogue("senna", "I've spent twenty years not questioning what I am. I heal people. I attune Echoes. I'm going to lose that.", "sad"),
                    StoryBeat.Dialogue("mira", "You'll still be you.", "neutral"),
                    StoryBeat.Dialogue("senna", "Will I? I don't know who I am without this.", "sad")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("They return to camp together. Senna sleeps uneasily.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage6_8()
        {
            return new StoryScript
            {
                StageId = "6-8",
                StageName = "The Prismatic Sentinel",
                StageType = "boss",
                HasCutscene = true,
                EnvironmentDescription = "The passage out of the Crucible. A crystalline entity blocks the way -- the Prismatic Sentinel, refracting light into blinding cascades. The ground beneath it is scorched in alternating elemental patterns.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Dialogue("kael", "We need more fighters.", "determined"),
                    StoryBeat.Narration("He mentions hearing about a solo Resonant running without a Veilborn partner."),
                    StoryBeat.Dialogue("senna", "That shouldn't be possible.", "shocked")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The Sentinel shatters into prismatic shards that dissolve before hitting the ground."),
                    StoryBeat.Dialogue("kael", "We can't do this alone.", "determined"),
                    StoryBeat.Dialogue("senna", "We're not alone.", "neutral")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "It's immune to Fire--pull back!", "turn_1"),
                    StoryBeat.Combat("sera", "Vulnerability window--burst now!", "boss_phase_2"),
                    StoryBeat.Combat("senna", "Bonds holding--keep pushing!", "turn_5"),
                    StoryBeat.Combat("maren", "Healing incoming--maintain formation!", "turn_7")
                }
            };
        }

        private static StoryScript CreateStage6_9()
        {
            return new StoryScript
            {
                StageId = "6-9",
                StageName = "Toward the Proving Grounds",
                StageType = "gameplay",
                EnvironmentDescription = "The transition zone between the Crucible and the Proving Grounds. The landscape looks like a warzone -- scorched earth, shattered crystal, the remnants of old Veil surges.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.BriefCard("The group leaves the Crucible behind.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The Proving Grounds stretch ahead. The Veil is so thin the landscape warps constantly -- buildings appear and vanish, horizons shift like reflections in water.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Hold position!", "turn_1"),
                    StoryBeat.Combat("senna", "Bonds steady--push!", "turn_3"),
                    StoryBeat.Combat("sera", "Keep moving!", "turn_5")
                }
            };
        }

        private static StoryScript CreateStage6_10()
        {
            return new StoryScript
            {
                StageId = "6-10",
                StageName = "Rest Before the Final Push",
                StageType = "character",
                EnvironmentDescription = "Camp at the entrance to the Proving Grounds. The ground is becoming crystalline -- grass gives way to translucent formations that glow faintly in the dark.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Otho refines his calculations by the light of a Veil-touched lantern. Senna checks attunements one by one. Mira writes observations in her notebook, filling page after page."),
                    StoryBeat.Narration("Tomorrow begins the final push.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The fire burns low. Nobody speaks much. Maren checks supplies methodically. Ren cleans weapons with practiced hands. Sera sits quiet, staring into the flames."),
                    StoryBeat.Narration("Senna holds the wooden charm in her lap. Tomorrow it all ends. Tonight they rest.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }
    }
}
