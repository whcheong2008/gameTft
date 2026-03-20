using System.Collections.Generic;

namespace ShatteredVeil.Core.Story.Content
{
    public static class Region3Stories
    {
        public static void RegisterAll()
        {
            StoryCatalog.Register("3-1", CreateStage3_1());
            StoryCatalog.Register("3-2", CreateStage3_2());
            StoryCatalog.Register("3-3", CreateStage3_3());
            StoryCatalog.Register("3-4", CreateStage3_4());
            StoryCatalog.Register("3-5", CreateStage3_5());
            StoryCatalog.Register("3-6", CreateStage3_6());
            StoryCatalog.Register("3-7", CreateStage3_7());
            StoryCatalog.Register("3-8", CreateStage3_8());
            StoryCatalog.Register("3-9", CreateStage3_9());
        }

        private static StoryScript CreateStage3_1()
        {
            return new StoryScript
            {
                StageId = "3-1",
                StageName = "First Synergy",
                StageType = "gameplay",
                EnvironmentDescription = "Eastern settlements under siege. Rolling hills with farmland, scattered militia positions. The horizon shows that shimmer -- closer than it was in the Frontier. Voidspawn emerge from tears in an accelerating rhythm.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.BriefCard("The eastern region faces coordinated Voidspawn assaults on multiple settlements. Command wants synergy tactics tested -- paired Resonants for combined effect.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("After the first engagement, the group is confident. Kael pairs people effectively. Lyric's pressure keeps enemies off healers."),
                    StoryBeat.Narration("Sera is as good as advertised -- her Echo-channeled magic hits like a siege weapon. But in the third engagement, something changes.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Synergy lock -- Burst on my mark!", "turn_1"),
                    StoryBeat.Combat("maren", "Healing up, push harder!", "turn_3"),
                    StoryBeat.Combat("kael", "I've got the flank!", "turn_5")
                }
            };
        }

        private static StoryScript CreateStage3_2()
        {
            return new StoryScript
            {
                StageId = "3-2",
                StageName = "Sera's Recklessness",
                StageType = "character",
                EnvironmentDescription = "Voidspawn nest on a settlement's edge. Crystal formations jut from the ground. The Veil is noticeably thin -- sky flickers occasionally. Tears open and close. The enemy formation is spread across a wide area.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Kael studies the formation. There's an opening if someone can break through the middle, split the enemies into isolated groups. It's risky."),
                    StoryBeat.Narration("Sera sees it before Kael finishes explaining. She moves.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Sera overchannels her Echo magic, pulling ambient Veil energy from the contested territory itself. The enemy line detonates."),
                    StoryBeat.Narration("But Sera's Echo bond flickers -- visible as stuttering light around her wrist. It shouldn't be flickering."),
                    StoryBeat.Narration("Kael finds her sitting apart, breathing hard."),
                    StoryBeat.Dialogue("kael", "Your bond just destabilized for four seconds.", "determined"),
                    StoryBeat.Dialogue("kael", "And if it had snapped entirely?", "angry"),
                    StoryBeat.Dialogue("narrator", "We won faster.", "neutral"),
                    StoryBeat.Dialogue("narrator", "Then I would have fixed it.", "determined"),
                    StoryBeat.Narration("She meets his eyes."),
                    StoryBeat.Dialogue("narrator", "Bonds snap. Healers mend them. That's the job.", "neutral"),
                    StoryBeat.Narration("Kael leaves her there. Lyric, watching, is grinning. Lyric understands something about ambition and principle that Kael is still learning.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage3_3()
        {
            return new StoryScript
            {
                StageId = "3-3",
                StageName = "The Hallen Dilemma",
                StageType = "story",
                EnvironmentDescription = "Hallen -- a settlement on a hill surrounded by farmland. A Veilborn quarter with twenty-three Veilborn on the western slope. The sky is increasingly wrong -- the shimmer becoming a visible weight on the air.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("A Voidspawn advance bears down from the north. Hundreds of creatures, organized. The settlement can hold, but the cost will be high. Twenty, maybe thirty dead."),
                    StoryBeat.Narration("Kael studies the maps. Two options: evacuate village and lose the Veil-anchor, or hold village and keep the network intact."),
                    StoryBeat.Dialogue("lyric", "We hold it. Twenty die here so two hundred don't die across the region over the next month.", "determined"),
                    StoryBeat.Narration("Kael looks at the settlement below. People in the streets. Children playing near the well."),
                    StoryBeat.Dialogue("kael", "I won't order them to stand and die in their own homes.", "determined"),
                    StoryBeat.Dialogue("lyric", "They're militia. They signed up for this.", "neutral"),
                    StoryBeat.Dialogue("kael", "They signed up to defend their families. Not to be a calculation.", "angry"),
                    StoryBeat.Dialogue("maren", "There's a middle option. Partial evacuation -- get the non-combatants out, keep the militia and Veilborn in place. Split the defense between us and the locals.", "neutral")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("That night, the group camps on the ridge above Hallen. Fires from the cleanup below cast orange light on the clouds."),
                    StoryBeat.Narration("Lyric comes to Kael's fire late. They sit for a long time before he speaks."),
                    StoryBeat.Dialogue("lyric", "The compromise cost more lives than holding would have.", "sad"),
                    StoryBeat.Dialogue("kael", "It saved the people in the village.", "neutral"),
                    StoryBeat.Dialogue("lyric", "Twelve extra soldiers died for that.", "sad"),
                    StoryBeat.Dialogue("kael", "We don't trade lives, Lyric.", "determined"),
                    StoryBeat.Dialogue("lyric", "Everyone trades lives, Kael. Some people just don't count.", "sad"),
                    StoryBeat.Narration("Neither is angry. Both are scared. The conversation breaks off before it reaches its end."),
                    StoryBeat.Narration("Later, Maren finds Lyric alone at the ridge edge. She sits without being asked."),
                    StoryBeat.Dialogue("maren", "You know the worst part isn't being wrong. It's being right and watching it not matter.", "sad"),
                    StoryBeat.Dialogue("lyric", "I don't think you're right. But I see what it costs you to be willing to be.", "neutral"),
                    StoryBeat.Narration("She doesn't wait for a response. Just stands and walks back toward camp.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Hold the north flank!", "turn_1"),
                    StoryBeat.Combat("lyric", "We're pulling civilians -- cover that position!", "turn_3"),
                    StoryBeat.Combat("maren", "Healing incoming -- push forward!", "turn_5")
                }
            };
        }

        private static StoryScript CreateStage3_4()
        {
            return new StoryScript
            {
                StageId = "3-4",
                StageName = "Bond Separation",
                StageType = "character",
                EnvironmentDescription = "Camp, early morning before the daily attunement ritual.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Senna pulls Kael aside."),
                    StoryBeat.Dialogue("senna", "I'm going to work with you and Lyric separately for a while. Your bonds are interfering with each other.", "neutral"),
                    StoryBeat.Dialogue("senna", "When you're tense, it pulls on his resonance. When he withdraws, it makes yours tighter. I can smooth it out better one at a time.", "neutral"),
                    StoryBeat.Dialogue("kael", "We're fine, Senna.", "neutral"),
                    StoryBeat.Dialogue("senna", "I know you're fine. I also know what your bonds feel like, and right now they sound like two instruments trying to play different songs. Let me tune you properly.", "determined"),
                    StoryBeat.Narration("She gives him the look that means the conversation is over. This is the beginning of physical separation -- not a split, but the start of one.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("For the first time since the Frontier, Kael and Lyric sit at different fires.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage3_5()
        {
            return new StoryScript
            {
                StageId = "3-5",
                StageName = "Multiple Settlement Defense",
                StageType = "gameplay",
                EnvironmentDescription = "Multiple settlements across the contested eastern region. Different terrain -- hills, valleys, forests. The Veil's shimmer is constant on the eastern horizon. Voidspawn patrols hit harder.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.BriefCard("Montage of settlement defense missions. The group adapts to different tactical needs across multiple sites.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("As the group moves between settlements, the distance between Kael and Lyric becomes visible. They coordinate perfectly in combat. But away from the fight, they eat separately."),
                    StoryBeat.Narration("The bond separation Senna engineered is becoming a real fracture. The group notices. Senna does too, but she doesn't intervene -- not yet.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Hold the eastern gate!", "turn_1"),
                    StoryBeat.Combat("maren", "Healing on the center!", "turn_3"),
                    StoryBeat.Combat("kael", "Burst now!", "turn_5")
                }
            };
        }

        private static StoryScript CreateStage3_6()
        {
            return new StoryScript
            {
                StageId = "3-6",
                StageName = "The Watch",
                StageType = "story",
                EnvironmentDescription = "A Veilborn sanctuary guarded by a military garrison. Stone walls, defensive positions, the feeling of a place that's held against impossible odds for a very long time.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Kael draws watch duty with a veteran soldier named Harl. The man is older, weathered, with the patient stillness of someone who's stood on walls for decades."),
                    StoryBeat.Dialogue("narrator", "Twenty years at this sanctuary. Patterns. Stuff Command doesn't put in the reports.", "neutral"),
                    StoryBeat.Dialogue("narrator", "The attacks track the headcount. When the sanctuary is full -- thirty, forty Veilborn -- we get hit hard. When most deploy and we're down to five or six, the attacks almost stop.", "neutral"),
                    StoryBeat.Dialogue("kael", "Makes sense. More Veilborn means stronger Veil energy concentration. Bigger signal.", "neutral"),
                    StoryBeat.Dialogue("narrator", "That's what I figured too. For about the first ten years.", "neutral"),
                    StoryBeat.Dialogue("narrator", "But when they come back from missions, the attacks resume within hours. Not the next day. That night. Before dawn. Every time.", "neutral"),
                    StoryBeat.Dialogue("narrator", "If the Voidspawn are detecting a stronger signal and then mustering forces, that takes time. Days, at least. But the response is almost instant.", "neutral"),
                    StoryBeat.Dialogue("narrator", "Six years ago, twelve Veilborn researchers arrived in the middle of the night. Unannounced. No convoy, no signal fires. By dawn, three new Void tears along the eastern perimeter. The biggest surge in months.", "neutral"),
                    StoryBeat.Dialogue("narrator", "Sometimes it feels less like they're detecting us and more like they're arriving with us. Like we bring them in our luggage.", "neutral"),
                    StoryBeat.Narration("He laughs -- a short, dry sound. Kael smiles politely. They finish the shift in silence.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The seed is planted. Harl's observation -- that Voidspawn correlation with Veilborn isn't detection but arrival -- will sit in Kael's mind until it becomes the seed of everything that follows.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage3_7()
        {
            return new StoryScript
            {
                StageId = "3-7",
                StageName = "The Horizon Darkens",
                StageType = "story",
                EnvironmentDescription = "A ridge overlooking the conquered eastern settlements. The sky to the east is wrong -- not dark, but dense. Like a bruise on the horizon. It doesn't move like clouds. The ground hums with a low, subsonic frequency.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The group crests the ridge and stops. The sky to the east is wrong."),
                    StoryBeat.Narration("Otho stares at it. His hand goes to his notebook, hovers over the page, and drops. He doesn't write. For the first time since Kael's known him, Otho looks at something interesting and doesn't record it."),
                    StoryBeat.Dialogue("senna", "What is it?", "sad"),
                    StoryBeat.Dialogue("otho", "I hope I'm wrong.", "sad"),
                    StoryBeat.Narration("He walks away. He doesn't explain.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The group camps that night knowing something has changed. The world is larger and worse than they understood."),
                    StoryBeat.Narration("Otho continues his cross-referencing in isolation. Kael and Lyric sit apart. Senna feels the attunement bonds strain with collective anxiety. Mira writes in her notebook -- questions without answers.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage3_8()
        {
            return new StoryScript
            {
                StageId = "3-8",
                StageName = "The Twin Heralds",
                StageType = "boss",
                HasCutscene = true,
                EnvironmentDescription = "A corrupted canyon where the Veil is thin. Sky flickers. Ground is partially crystalline. Two massive Voidspawn occupy the arena -- one melee brute, one arcane caster. The arena has multiple levels.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Dialogue("kael", "They fight in tandem. When close together, they amplify. We split them, whittle both to critical, then burst simultaneously. No enrage. No berserk phase. Clean execution.", "determined"),
                    StoryBeat.Narration("Lyric nods -- same instinct. They don't coordinate verbally. The instinct is identical. This is what their friendship built: the ability to think as one without speaking.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Both Heralds fall within three seconds. No enrage. Perfect execution. The canyon goes silent. The flickering sky stabilizes briefly before resuming."),
                    StoryBeat.Narration("Afterward, they sit apart. Kael at one fire reviewing maps. Lyric at another, talking with militia remnants."),
                    StoryBeat.Narration("The physical distance between them is only a few meters. It feels like miles."),
                    StoryBeat.Narration("Otho sits in his tent with his notebook open, cross-referencing. He works late. He doesn't sleep well."),
                    StoryBeat.Narration("The group packs up the next morning and moves east toward the Shattered Lands. Toward the answer Otho hopes he's wrong about. He isn't.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Split the Heralds!", "turn_1"),
                    StoryBeat.Combat("lyric", "Keep them apart!", "turn_3"),
                    StoryBeat.Combat("maren", "Healing tight -- spread formation!", "turn_5"),
                    StoryBeat.Combat("kael", "Both at critical. On my mark -- now.", "enemy_half_hp")
                }
            };
        }

        private static StoryScript CreateStage3_9()
        {
            return new StoryScript
            {
                StageId = "3-9",
                StageName = "Eastward March",
                StageType = "gameplay",
                EnvironmentDescription = "The road east from the canyon. Terrain grows increasingly alien. The horizon is no longer a shimmer but a visible wall of corruption. The group marches in silence.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.BriefCard("The group marches east toward the Shattered Lands. The terrain grows increasingly hostile with every mile.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The march continues. The world changes around them. No one speaks much. The Shattered Lands await.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Stay tight. This terrain is unstable.", "turn_1")
                }
            };
        }
    }
}
