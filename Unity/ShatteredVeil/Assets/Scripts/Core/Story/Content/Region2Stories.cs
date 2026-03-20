using System.Collections.Generic;

namespace ShatteredVeil.Core.Story.Content
{
    public static class Region2Stories
    {
        public static void RegisterAll()
        {
            StoryCatalog.Register("2-1", CreateStage2_1());
            StoryCatalog.Register("2-2", CreateStage2_2());
            StoryCatalog.Register("2-3", CreateStage2_3());
            StoryCatalog.Register("2-4", CreateStage2_4());
            StoryCatalog.Register("2-5", CreateStage2_5());
            StoryCatalog.Register("2-6", CreateStage2_6());
            StoryCatalog.Register("2-7", CreateStage2_7());
            StoryCatalog.Register("2-8", CreateStage2_8());
            StoryCatalog.Register("2-9", CreateStage2_9());
        }

        private static StoryScript CreateStage2_1()
        {
            return new StoryScript
            {
                StageId = "2-1",
                StageName = "Recall Orders",
                StageType = "gameplay",
                EnvironmentDescription = "Military post on the road south. The landscape transitions from frontier grassland to farming country -- green, gentle, unremarkable. The road is packed earth, worn smooth by merchant traffic.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.BriefCard("Military command recalls Kael and Lyric to the Barracks for advanced training duties. A new threat emerges in the contested east.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The group departs the settlement with handshakes and promises to return. Dren stands at the gate and watches them go."),
                    StoryBeat.Narration("Kael walks point. Lyric handles conversation. Senna maintains the daily attunement schedule. Otho walks into a fence post.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage2_2()
        {
            return new StoryScript
            {
                StageId = "2-2",
                StageName = "The Destroyed Village",
                StageType = "story",
                EnvironmentDescription = "A village hit overnight. Buildings standing but people gone. Doors hang open. Food sits on tables, gone cold. A dog wanders confused between empty houses. The emptiness is more chilling than ruins.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Kael sweeps the perimeter. Clear. Whatever came through is gone."),
                    StoryBeat.Narration("Lyric finds Mira in the ruins of the eastern district -- sixteen years old, crouched behind a collapsed wall with a broken shovel in her hands. Not hiding. Watching. Assessing."),
                    StoryBeat.Dialogue("senna", "Veilborn.", "shocked"),
                    StoryBeat.Narration("Senna approaches with hands up."),
                    StoryBeat.Dialogue("senna", "It's okay. We're Resonants.", "neutral"),
                    StoryBeat.Narration("Mira stands. Doesn't lower the shovel."),
                    StoryBeat.Dialogue("mira", "I know what you are. I can feel your bonds from here.", "determined"),
                    StoryBeat.Dialogue("lyric", "What's your name?", "neutral"),
                    StoryBeat.Dialogue("mira", "Mira.", "neutral"),
                    StoryBeat.Dialogue("lyric", "Are there other survivors, Mira?", "sad"),
                    StoryBeat.Dialogue("mira", "No Veilborn. The others ran east. I stayed because...", "neutral"),
                    StoryBeat.PauseBeat(1f),
                    StoryBeat.Dialogue("mira", "I stayed.", "determined"),
                    StoryBeat.Narration("Senna nods -- no debate, no discussion. Mira is Veilborn, she's alone, and Senna is Senna. That's enough.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("On the road to the Barracks, Mira rides on Kael's supply pack when tired. He doesn't comment. She doesn't thank."),
                    StoryBeat.Narration("Lyric tries jokes that don't land. Mira's mouth twitches -- not a smile, close."),
                    StoryBeat.Dialogue("mira", "That's terrible.", "neutral"),
                    StoryBeat.Dialogue("lyric", "Thank you. I have hundreds more.", "happy"),
                    StoryBeat.Narration("Otho gives Mira a blank notebook."),
                    StoryBeat.Dialogue("otho", "For observations. A good scholar writes everything down.", "neutral"),
                    StoryBeat.Narration("Mira takes it.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage2_3()
        {
            return new StoryScript
            {
                StageId = "2-3",
                StageName = "Barracks Approach",
                StageType = "character",
                EnvironmentDescription = "The road transitions from farming country to training grounds. The landscape opens into a river valley. The Barracks sprawls across it -- training fields, barracks buildings, arenas, an archive. Flags mark training zones.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("On the third morning, Mira asks Kael:"),
                    StoryBeat.Dialogue("mira", "Why did you sign up for this?", "neutral"),
                    StoryBeat.Dialogue("kael", "Sign up for what?", "neutral"),
                    StoryBeat.Dialogue("mira", "The military. The fighting. You could've done anything else with what you are.", "neutral"),
                    StoryBeat.Dialogue("kael", "Someone had to.", "neutral"),
                    StoryBeat.Dialogue("mira", "That's not a reason. That's an excuse.", "determined"),
                    StoryBeat.Dialogue("kael", "Fine. Because I'm good at it and the alternative was farming.", "neutral"),
                    StoryBeat.Dialogue("mira", "That's worse.", "neutral"),
                    StoryBeat.Narration("She walks ahead. Kael looks at Lyric, who's grinning.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The group arrives at the Barracks. A new Resonant is assigned to their squad: Ren, a tank specialist with arms like tree trunks and a vocabulary of roughly twelve words."),
                    StoryBeat.Narration("He and Kael recognize each other immediately. They'd been in the same training cohort years ago. An exercise had gone wrong. Three recruits were exposed on an open field. Kael had stepped in, held the line, and taken a hit that left him unconscious for two days."),
                    StoryBeat.Narration("He'd never thought about it much. Ren had thought about it quite a lot.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage2_4()
        {
            return new StoryScript
            {
                StageId = "2-4",
                StageName = "Training Grounds Orientation",
                StageType = "character",
                EnvironmentDescription = "Central training yard. Sand, packed earth, training dummies, weapon racks. The Barracks archive is a stone building nearby. Recruits rotate through drills. The river valley stretches green in the distance.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Ren falls into position beside Kael -- slightly behind, slightly to the left, covering the angle Kael's fighting style leaves open. He's studied how Kael moves. Not recently. For years."),
                    StoryBeat.Dialogue("lyric", "Your new shadow knows your blind side better than I do.", "happy"),
                    StoryBeat.Narration("Between exercises, Lyric catches Kael watching Mira practice attunement with Senna."),
                    StoryBeat.Dialogue("lyric", "She reminds you of someone.", "neutral"),
                    StoryBeat.Dialogue("kael", "Don't.", "neutral"),
                    StoryBeat.Dialogue("lyric", "I was going to say me. At that age. Annoying, too smart, no idea how much trouble she's in.", "happy"),
                    StoryBeat.Dialogue("kael", "You were worse.", "neutral"),
                    StoryBeat.Dialogue("lyric", "I was much worse.", "happy")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("During a live exercise, one recruit freezes. Ren catches the breach before anyone gets hurt."),
                    StoryBeat.Dialogue("lyric", "Pull him.", "determined"),
                    StoryBeat.Dialogue("kael", "Give him another chance.", "neutral"),
                    StoryBeat.Narration("Lyric doesn't argue but doesn't agree. The disagreement is noted but not resolved.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage2_5()
        {
            return new StoryScript
            {
                StageId = "2-5",
                StageName = "Archive Discovery",
                StageType = "story",
                EnvironmentDescription = "The Barracks archive -- a vast stone building filled with pre-Shattering records. Shelves line every wall. Ancient paper, ancient ink. Light through high windows, dusty and golden. The air smells of leather and parchment.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Otho emerges from the archive on the fifth night practically vibrating. He spreads scrolls across a table."),
                    StoryBeat.Dialogue("otho", "You need to see this.", "happy"),
                    StoryBeat.Narration("Ancient paper. Careful diagrams of Veil energy patterns."),
                    StoryBeat.Dialogue("otho", "The archive has pre-Shattering records that I don't think anyone's touched in decades. There's a reference -- oblique, but unmistakable -- to a place where Veil energy naturally converges. A fixed point. The scholars called it the Wellspring.", "happy"),
                    StoryBeat.Dialogue("otho", "They believed it was the oldest and thinnest point in the Veil, where the barrier barely exists at all.", "neutral"),
                    StoryBeat.Dialogue("otho", "Fair warning -- these texts are charmingly outdated. They thought there were only three elements. They hadn't identified Lightning or Force. They didn't even distinguish between Echoes and Voidspawn -- lumped everything under one term, Veilcrossers.", "neutral"),
                    StoryBeat.Dialogue("otho", "But the observational data is solid. They tracked Veil events for generations. And this convergence point keeps appearing.", "determined")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Mira asks to see the maps. Lyric teases Otho about getting excited over dusty scrolls."),
                    StoryBeat.Narration("The conversation turns to the Wellspring -- where it might be, whether it still exists."),
                    StoryBeat.Narration("Later, when everyone is asleep, Otho still reads. He's copying the ancient scholars' Veil-crossing event logs -- every recorded instance, plotted by location and frequency.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage2_6()
        {
            return new StoryScript
            {
                StageId = "2-6",
                StageName = "The Archon Emerges",
                StageType = "boss",
                HasCutscene = true,
                EnvironmentDescription = "The Barracks arena -- a large circular space with walls on all sides. Sand for footing. Viewing stands for recruits. The Archon materializes from a massive Void tear in the arena center. Three meters tall, elemental energy crackling across stone-like skin.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Alarms sound. A powerful Voidspawn has been drawn to the concentration of Resonant energy at the training grounds."),
                    StoryBeat.Narration("The Archon appears -- a creature that shifts between combat stances."),
                    StoryBeat.Dialogue("lyric", "It's going to be a show. Don't look away -- this is what it looks like when you have Echoes and a team that trusts each other.", "determined"),
                    StoryBeat.Dialogue("senna", "I'll maintain the bonds. It's going to try to interfere. It won't work.", "determined")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Lyric moves between recruit clusters -- checking injuries, trading stories. He makes each group feel like they turned the fight."),
                    StoryBeat.Narration("Kael sits next to Ren, who eats silently at the edge of firelight."),
                    StoryBeat.Dialogue("kael", "That predator-stance intercept. You moved before it shifted.", "neutral"),
                    StoryBeat.Narration("Ren chews. Swallows."),
                    StoryBeat.Dialogue("kael", "How long have you known that?", "neutral"),
                    StoryBeat.Narration("Ren looks at him. Looks back at his food. Keeps eating. Kael sits with him. The silence is comfortable."),
                    StoryBeat.Dialogue("lyric", "He's been studying you for years, hasn't he?", "happy"),
                    StoryBeat.Narration("Kael nods."),
                    StoryBeat.Dialogue("lyric", "That's devotion. Guard that.", "neutral")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "It's armoring up -- burst it now before the shield regenerates!", "turn_1"),
                    StoryBeat.Combat("kael", "Predator stance -- it's diving! Get your healers behind the tanks!", "boss_phase_2"),
                    StoryBeat.Combat("lyric", "Hold steady!", "turn_3"),
                    StoryBeat.Combat("lyric", "We've got this!", "turn_5")
                }
            };
        }

        private static StoryScript CreateStage2_7()
        {
            return new StoryScript
            {
                StageId = "2-7",
                StageName = "New Team Members",
                StageType = "character",
                EnvironmentDescription = "Barracks common area. Recruits gather. Training gear is stacked. Two new arrivals: Sera, sharp-eyed and assessing, and Maren, warm and immediate with attunement techniques.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Sera arrives from the capital academy. She's a mage specialist. She respects Lyric more than Kael. Kael notices."),
                    StoryBeat.Narration("Maren comes from a field hospital in the southern provinces -- a healer who's spent two years mending Resonants after bad deployments."),
                    StoryBeat.Narration("Within a day, she and Senna are trading attunement techniques like old friends. Within two days, Mira is sitting closer to Maren at meals than anyone except Senna.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Mission briefing. Orders arrive: deploy east to a contested region with simultaneous Voidspawn assaults."),
                    StoryBeat.Narration("The group is now at full strength: Kael, Lyric, Ren, Sera, Maren, Senna, Mira, Otho. Eight people."),
                    StoryBeat.Narration("The warmth of the Barracks -- the sense of a growing, functional team -- is about to fracture. But for this moment, they're whole.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage2_8()
        {
            return new StoryScript
            {
                StageId = "2-8",
                StageName = "Barracks Training Finale",
                StageType = "gameplay",
                EnvironmentDescription = "Barracks training arena. Final combined exercises before deployment. The full team assembled for the first time in the arena where the Archon fell.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.BriefCard("Full team combined exercise. Test synergy pairings before eastern deployment.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The team performs well in combined exercises. Synergy pairings click into place. Ren and Sera. Maren and Lyric. Kael orchestrating. Senna binding it all together."),
                    StoryBeat.Narration("Tomorrow, they march east.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Synergy pairs -- lock in!", "turn_1"),
                    StoryBeat.Combat("lyric", "Looking good! Push harder!", "turn_3")
                }
            };
        }

        private static StoryScript CreateStage2_9()
        {
            return new StoryScript
            {
                StageId = "2-9",
                StageName = "March East",
                StageType = "gameplay",
                EnvironmentDescription = "The road east from the Barracks. Farming country gives way to contested terrain. The horizon shimmer is visible again -- closer, more present. The group marches in formation.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.BriefCard("The full team deploys east toward contested settlements. Voidspawn activity is increasing across the region.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The march east brings increasingly frequent Voidspawn encounters. The team handles them efficiently."),
                    StoryBeat.Narration("The contested eastern settlements await.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Formation tight. Stay sharp.", "turn_1")
                }
            };
        }
    }
}
