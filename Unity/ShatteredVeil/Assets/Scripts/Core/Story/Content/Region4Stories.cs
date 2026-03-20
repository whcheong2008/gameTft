using System.Collections.Generic;

namespace ShatteredVeil.Core.Story.Content
{
    public static class Region4Stories
    {
        public static void RegisterAll()
        {
            StoryCatalog.Register("4-1", CreateStage4_1());
            StoryCatalog.Register("4-2", CreateStage4_2());
            StoryCatalog.Register("4-3", CreateStage4_3());
            StoryCatalog.Register("4-4", CreateStage4_4());
            StoryCatalog.Register("4-5", CreateStage4_5());
            StoryCatalog.Register("4-6", CreateStage4_6());
            StoryCatalog.Register("4-7", CreateStage4_7());
            StoryCatalog.Register("4-8", CreateStage4_8());
            StoryCatalog.Register("4-9", CreateStage4_9());
        }

        private static StoryScript CreateStage4_1()
        {
            return new StoryScript
            {
                StageId = "4-1",
                StageName = "The Border",
                StageType = "story",
                HasCutscene = true,
                EnvironmentDescription = "The world changes at the border. One step: solid earth. Next step: the ground is translucent. The grass is crystal. The sky flickers between mortal blue and alien violet. Wild Echoes drift like luminous jellyfish, unbound and purposeless.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The group approaches the border."),
                    StoryBeat.Dialogue("senna", "The attunement bonds feel noisy here. Like trying to tune an instrument in a windstorm.", "sad"),
                    StoryBeat.Narration("The eastern horizon is no longer a bruise. It's a wall. The Sovereign. Not a creature. A geography. A fact of nature that happens to be advancing.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Otho stares at the eastern horizon with his notebook open, his pen still. He hasn't written anything since the ridge."),
                    StoryBeat.Narration("That night, Kael asks him what he found at the observatory they're about to approach.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("senna", "They're not responding to attunement -- just avoid them.", "turn_1"),
                    StoryBeat.Combat("kael", "Spread out -- don't let them coordinate!", "turn_3")
                }
            };
        }

        private static StoryScript CreateStage4_2()
        {
            return new StoryScript
            {
                StageId = "4-2",
                StageName = "The Observatory Ruins",
                StageType = "story",
                EnvironmentDescription = "A ruin of ancient stone and corroded instruments. Crystal growths cover it. Inside, shelves hold ancient star maps, population records, Veil measurements. The air is thick with Veil energy. The sky flickers constantly between worlds.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Otho enters the observatory with focus."),
                    StoryBeat.Dialogue("otho", "I need time with these records. Keep the perimeter clear.", "determined"),
                    StoryBeat.Narration("He doesn't explain what he's looking for.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("When Otho emerges, his hands are shaking. He carries ancient charts -- star maps, population records, Veil measurements."),
                    StoryBeat.Dialogue("otho", "I need to verify something. Give me tonight.", "sad"),
                    StoryBeat.Narration("The group camps in the observatory ruins. Outside, tears keep spreading. They can hear new ones opening -- ripping sounds, over and over, getting closer. Nobody sleeps well.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Hold the perimeter!", "turn_1"),
                    StoryBeat.Combat("maren", "Healing incoming!", "turn_3"),
                    StoryBeat.Combat("kael", "More coming from the east!", "turn_5")
                }
            };
        }

        private static StoryScript CreateStage4_3()
        {
            return new StoryScript
            {
                StageId = "4-3",
                StageName = "Feeding the Enemy",
                StageType = "gameplay",
                EnvironmentDescription = "Crystal terrain, increasingly alien. The air tastes like ozone. Voidspawn emerge from tears that open and close in a rhythm like breathing.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.BriefCard("The Sovereign's perimeter is not a line but a gradient. Terrain grows more alien with every step.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Something is wrong. Every Voidspawn killed is replaced almost immediately. The Sovereign pulses. Every time Senna strains harder, every time Resonants push Echoes harder, the Sovereign brightens. Tears open faster."),
                    StoryBeat.Narration("Sixty seconds. That's all they last before Kael calls the retreat."),
                    StoryBeat.Dialogue("lyric", "Did you see it? When Senna pushed harder, it got stronger. We were feeding it.", "shocked"),
                    StoryBeat.Narration("Kael has no answer.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Retreat! Fall back!", "turn_3")
                }
            };
        }

        private static StoryScript CreateStage4_4()
        {
            return new StoryScript
            {
                StageId = "4-4",
                StageName = "The Revelation",
                StageType = "story",
                HasCutscene = true,
                EnvironmentDescription = "The observatory's main chamber. Stone table covered in ancient charts and Otho's notebook pages. Flickering light casts moving shadows.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Otho gathers everyone. He speaks slowly. Carefully."),
                    StoryBeat.Dialogue("otho", "The ancient scholars tracked every crossing event for generations. Echoes and Voidspawn. They didn't separate them -- they used one word for both. Veilcrossers.", "neutral"),
                    StoryBeat.Dialogue("otho", "We assumed that was because they hadn't discovered the two planes yet.", "neutral"),
                    StoryBeat.Narration("He lays out a chart. Columns of numbers. Lines of correlation."),
                    StoryBeat.Dialogue("otho", "They didn't separate them because there was nothing to separate.", "sad"),
                    StoryBeat.PauseBeat(2f),
                    StoryBeat.Dialogue("otho", "The birth registries map Veilborn population by region and year. The crossing logs map all Veil events by the same regions and years. The correlation is absolute.", "neutral"),
                    StoryBeat.Dialogue("otho", "When the last Veilborn in a region died, the tears sealed and everything stopped. Echoes and Voidspawn both. When new Veilborn were born, both returned.", "neutral"),
                    StoryBeat.SetExpression("otho", "sad"),
                    StoryBeat.Dialogue("otho", "There is no Luminous Plane. There is no Void. There is one Otherside, and the Veilborn are the only opening.", "sad"),
                    StoryBeat.Dialogue("otho", "Echoes and Voidspawn are the same kind of entity -- Veilcrossers -- coming through the same door. The corruption that distinguishes Voidspawn is simply what happens when crossing energy accumulates without guidance.", "neutral"),
                    StoryBeat.Narration("Senna goes white. Not gradually -- all at once, as if someone drained the color from her face."),
                    StoryBeat.Narration("Mira looks at Senna. Then at Otho. Then at her own hands."),
                    StoryBeat.Dialogue("mira", "What does that mean? That we cause them?", "shocked"),
                    StoryBeat.PauseBeat(2f),
                    StoryBeat.Narration("Nobody answers.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Dialogue("otho", "The Sovereign isn't an ancient evil pressing inward. It's a manifestation -- an accumulation of all the corruption that has leaked through the Veil over centuries of Veilborn existence.", "neutral"),
                    StoryBeat.Dialogue("otho", "It grows as long as any Veilborn live. And the eruption here -- the tears spreading outward -- this is what happens when the accumulation reaches a tipping point. The Veil is breaking down. Not locally. Globally.", "sad"),
                    StoryBeat.Dialogue("lyric", "Close the Veil.", "neutral"),
                    StoryBeat.Dialogue("otho", "Kill every Veilborn, and the Veil seals permanently. No more Echoes. No more Voidspawn. The Sovereign, cut off from its source... dies.", "sad"),
                    StoryBeat.PauseBeat(3f),
                    StoryBeat.Narration("Senna sits with Mira, who won't let go of Senna's hand. Otho hunches over his notes. Ren stands watch. Sera sits alone. Maren sits between them, belonging to neither side. Lyric sits alone, staring at nothing.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage4_5()
        {
            return new StoryScript
            {
                StageId = "4-5",
                StageName = "The Choice",
                StageType = "story",
                HasCutscene = true,
                EnvironmentDescription = "The observatory ruins at midnight. Fires have burned low. The walls flicker between stone and crystal. Outside, another tear opens.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Lyric comes to Kael at midnight. His voice isn't angry. It's exhausted. Gentle, almost."),
                    StoryBeat.Dialogue("lyric", "You were there. You saw it. Every time Senna pushed harder, it got stronger. The data says why.", "sad"),
                    StoryBeat.Dialogue("lyric", "There are maybe four thousand Veilborn in the world. The Sovereign has absorbed at least thirty settlements. And the eruption is accelerating.", "neutral"),
                    StoryBeat.Dialogue("lyric", "If we don't close the Veil, this becomes everywhere. Every city. Every village. The entire world, Shattered.", "determined"),
                    StoryBeat.PauseBeat(1f),
                    StoryBeat.Dialogue("lyric", "I'm not saying I want this. I'm saying there's no other answer. Four thousand lives against -- what? Millions? Everyone?", "sad"),
                    StoryBeat.Dialogue("lyric", "This isn't a difficult calculation. It's the easiest calculation in the world. It's just the hardest thing I've ever had to say.", "sad"),
                    StoryBeat.PauseBeat(2f),
                    StoryBeat.Dialogue("kael", "You're asking me to kill Senna.", "angry"),
                    StoryBeat.Dialogue("lyric", "I know.", "sad"),
                    StoryBeat.Dialogue("kael", "You're asking me to kill Mira. She's sixteen.", "angry"),
                    StoryBeat.Dialogue("lyric", "I know.", "sad"),
                    StoryBeat.Dialogue("kael", "You're asking me to murder every person who has ever trusted us to protect them.", "angry"),
                    StoryBeat.Dialogue("lyric", "I'm asking you to save everyone else.", "sad"),
                    StoryBeat.PauseBeat(1f),
                    StoryBeat.Dialogue("kael", "My father could have saved our village. All he had to do was hand over the refugees. Seventeen people for a whole village. Easy math.", "sad"),
                    StoryBeat.Dialogue("lyric", "Your father's village burned, Kael.", "neutral"),
                    StoryBeat.Dialogue("kael", "And the seventeen survived. And they built a new village. And their children are alive today.", "determined"),
                    StoryBeat.Dialogue("lyric", "And your father is dead. And so is everyone who lived next to him.", "neutral"),
                    StoryBeat.Dialogue("kael", "I won't do it. And I won't let you do it.", "determined"),
                    StoryBeat.Dialogue("lyric", "Then people are going to die. A lot of people. Because you couldn't.", "sad"),
                    StoryBeat.Narration("He stands and walks away. The fire dies to embers.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The next morning, Lyric walks toward the tent where the Veilborn sleep. He walks openly, in daylight. His hand is on his weapon.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage4_6()
        {
            return new StoryScript
            {
                StageId = "4-6",
                StageName = "Kael vs Lyric",
                StageType = "boss",
                HasCutscene = true,
                EnvironmentDescription = "The observatory courtyard, crystal and stone. The Sovereign visible in the distance, pulsing. Tears opening and closing around them.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Kael steps into Lyric's path. Everything has already been said. Midnight used up all the words. What's left is simpler and worse.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Lyric fights the way he always fights: smart, aggressive, adaptive. He uses the tactics they developed together. Fighting Lyric is like fighting a mirror."),
                    StoryBeat.Narration("But Lyric isn't trying to kill Kael. He's trying to get past him -- pathing around the defense, angling toward the tent."),
                    StoryBeat.Narration("Ren holds the flank without being asked. Sera stands apart, unwilling to fight. Maren is in front of the tent with arms spread."),
                    StoryBeat.Narration("Kael blocks every path, absorbs every strike. Lyric falls to one knee."),
                    StoryBeat.Dialogue("lyric", "You win. For now.", "sad"),
                    StoryBeat.Effect("shake", 2f),
                    StoryBeat.Narration("The ground tears open. Not a normal tear -- a rupture. The largest Veil breach the group has ever seen. The Shattered Colossus drags itself into the world.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage4_7()
        {
            return new StoryScript
            {
                StageId = "4-7",
                StageName = "The Colossus",
                StageType = "boss",
                HasCutscene = true,
                EnvironmentDescription = "Observatory courtyard with active Veil breach. The Colossus dominates the space. The sky splits further. Wild Echoes scream.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Kael and Lyric look at each other across the broken ground. No words. No agreement. Just muscle memory of a thousand fights together.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The Colossus falls. The group stands in the ruins. Everyone injured. The Veil seething. The eruption hasn't slowed. If anything, the Colossus fight made it worse."),
                    StoryBeat.Narration("Lyric and Kael stand facing each other. The fight is over. The boss is dead. Nothing is resolved."),
                    StoryBeat.Narration("Lyric looks at Senna. At Mira. At Otho. At Maren. At Sera. At Ren. Then back at Kael."),
                    StoryBeat.Dialogue("lyric", "I still think I'm right. But I'm going to do something stupid instead. Because you're my friend, and I want to believe you're not wrong.", "sad")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Both sides, push the damage!", "turn_1"),
                    StoryBeat.Combat("lyric", "Interrupt the charge!", "turn_3"),
                    StoryBeat.Combat("maren", "Healing both sides -- coordinate!", "turn_5")
                }
            };
        }

        private static StoryScript CreateStage4_8()
        {
            return new StoryScript
            {
                StageId = "4-8",
                StageName = "Lyric's Sacrifice",
                StageType = "story",
                HasCutscene = true,
                EnvironmentDescription = "The observatory center. The largest active rupture in the Veil -- three meters wide and growing, light and corruption pouring through.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Lyric walks toward the rupture. Senna kneels to try an attunement adjustment. He doesn't stop."),
                    StoryBeat.Narration("He reaches the rupture and channels. Not through Echoes. Not through Veilborn intermediary. Through himself. Directly into the tear. Raw Resonant energy.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Effect("flash_white", 2f),
                    StoryBeat.Narration("The tear narrows. The smaller tears snap closed. The ripping sounds stop. The sky above the observatory goes solid for the first time since the group entered the Shattered Lands."),
                    StoryBeat.Narration("Lyric's body glows -- not with light, but with something that looked like light's echo."),
                    StoryBeat.Dialogue("lyric", "Find another way. You owe me that.", "sad"),
                    StoryBeat.Effect("flash_white", 1f),
                    StoryBeat.Narration("Light pours from his eyes and hands. Then it stops. He collapses. The sky holds."),
                    StoryBeat.Effect("fade_black", 2f),
                    StoryBeat.PauseBeat(2f),
                    StoryBeat.Effect("fade_from_black", 2f),
                    StoryBeat.Narration("Senna knelt beside him and closed his eyes."),
                    StoryBeat.Narration("Mira cried silently, her face pressed into Senna's shoulder."),
                    StoryBeat.Narration("Otho turned away."),
                    StoryBeat.Narration("Maren made a sound that wasn't quite a word."),
                    StoryBeat.Narration("Kael stood very still for a very long time.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage4_9()
        {
            return new StoryScript
            {
                StageId = "4-9",
                StageName = "The Fracture",
                StageType = "character",
                EnvironmentDescription = "The observatory ruins, day after. The group is reduced. Not in dramatic confrontation -- in quiet conversations as people make their choices.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Ren stays without hesitating. A departing fighter asks him directly."),
                    StoryBeat.Dialogue("narrator", "You're staying?", "neutral"),
                    StoryBeat.Narration("Ren doesn't look up from checking his equipment."),
                    StoryBeat.Dialogue("narrator", "I'm with Kael.", "determined"),
                    StoryBeat.Narration("That's enough."),
                    StoryBeat.PauseBeat(1f),
                    StoryBeat.Narration("Sera packs methodically."),
                    StoryBeat.Dialogue("narrator", "I can't stay and watch you let this happen. I'm going to do something useful. Move Veilborn away from population centers.", "determined"),
                    StoryBeat.Narration("She heads east. It won't work, but she doesn't know that yet."),
                    StoryBeat.PauseBeat(1f),
                    StoryBeat.Narration("Maren is the one that hurts. She loves Senna. But she can see the math. She watched soldiers die at Hallen."),
                    StoryBeat.Narration("Before she leaves, she goes to where Lyric's body lies. She touches his hand -- once, briefly."),
                    StoryBeat.Dialogue("maren", "You deserved better than being right.", "sad"),
                    StoryBeat.Narration("Senna watches her go. Doesn't respond. Doesn't move.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Five people remain: Kael, Ren, Senna, Mira, Otho. Two fighters. Three non-combatants."),
                    StoryBeat.Narration("The warmth of the Frontier, the Barracks, the Synergy Trials -- all gone. What remains is grief and a promise. Find another way."),
                    StoryBeat.Narration("Kael takes Lyric's training tag -- worn smooth from years. He puts it around his own neck. He doesn't explain."),
                    StoryBeat.Narration("News trickles in from the south. The eruption's ripple has reached settlements hundreds of miles away. Settlements that fell while the group deliberated.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }
    }
}
