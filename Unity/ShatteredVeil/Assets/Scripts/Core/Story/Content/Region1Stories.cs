using System.Collections.Generic;

namespace ShatteredVeil.Core.Story.Content
{
    public static class Region1Stories
    {
        public static void RegisterAll()
        {
            StoryCatalog.Register("1-1", CreateStage1_1());
            StoryCatalog.Register("1-2", CreateStage1_2());
            StoryCatalog.Register("1-3", CreateStage1_3());
            StoryCatalog.Register("1-4", CreateStage1_4());
            StoryCatalog.Register("1-5", CreateStage1_5());
            StoryCatalog.Register("1-6", CreateStage1_6());
            StoryCatalog.Register("1-7", CreateStage1_7());
            StoryCatalog.Register("1-8", CreateStage1_8());
            StoryCatalog.Register("1-9", CreateStage1_9());
        }

        private static StoryScript CreateStage1_1()
        {
            return new StoryScript
            {
                StageId = "1-1",
                StageName = "The Arrival",
                StageType = "story",
                EnvironmentDescription = "Rolling grasslands broken by wooden palisade walls. Northern and eastern sections show gaps. A watchtower leans on the southeast corner. The horizon stretches flat until it blurs into a visible shimmer: the Veil's breath.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Kael observes the settlement's defenses with Lyric. Three breaches north, two east."),
                    StoryBeat.Dialogue("lyric", "They're not going to like us.", "neutral"),
                    StoryBeat.Dialogue("kael", "We're not here to be liked.", "determined"),
                    StoryBeat.Dialogue("lyric", "We're also not here to be feared. These people have been fighting Voidspawn for months without support. If we walk in like military inspectors, they'll smile to our faces and ignore everything we say.", "neutral"),
                    StoryBeat.Narration("He takes a bite of an apple that appears from nowhere. The group descends to meet Captain Torren and the militia volunteers, including a young man named Dren.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Lyric handles introductions, learning Torren's children's names and hearing about grain stores and the eastern breach. The settlement's stiffness melts into relief."),
                    StoryBeat.Narration("Kael addresses twelve militia volunteers with essence-forged spears on formation and positioning."),
                    StoryBeat.Dialogue("lyric", "Stay behind the big ones, don't wander off, and if something ugly charges you, let one of us deal with it.", "happy"),
                    StoryBeat.Narration("Senna gathers them separately to explain Veilborn, the Luminous Plane, and how Echoes differ from Voidspawn. This is the rhythm: Kael builds the plan. Lyric makes it human.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage1_2()
        {
            return new StoryScript
            {
                StageId = "1-2",
                StageName = "Northern Breach Patrol",
                StageType = "character",
                EnvironmentDescription = "Rocky scrubland transitioning to grassland. A six-meter gap where wooden logs have rotted away, creating a natural chokepoint. The grass is flattened where Voidspawn have crossed recently. Bleached bone fragments catch the light.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Senna performs an attunement check on the group, sitting cross-legged with eyes closed, fingers twitching as if plucking invisible strings."),
                    StoryBeat.Dialogue("senna", "Kael, your Earth Echo is pulling left. Are you stressed?", "neutral"),
                    StoryBeat.Narration("He denies it."),
                    StoryBeat.Dialogue("senna", "Liar. Lyric, yours is humming. Good mood?", "neutral"),
                    StoryBeat.Dialogue("lyric", "Always.", "happy"),
                    StoryBeat.Dialogue("senna", "I know both of you better than you know yourselves. Don't forget that.", "determined"),
                    StoryBeat.Narration("Otho crouches nearby scraping soil into a vial, muttering about residual densities. He'll walk into a tree on the march back.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("After the fight, Kael notices Lyric with Dren."),
                    StoryBeat.Dialogue("lyric", "First one's always the worst. Gets easier.", "neutral"),
                    StoryBeat.Narration("Later, walking back:"),
                    StoryBeat.Dialogue("lyric", "Dren's going to be fine.", "happy"),
                    StoryBeat.Dialogue("kael", "You always know their names.", "neutral"),
                    StoryBeat.Dialogue("lyric", "You always know where they should stand. We cover different things.", "happy"),
                    StoryBeat.Narration("The silence between them is comfortable."),
                    StoryBeat.Dialogue("senna", "Kael, your Echo bond was pulling more than usual today.", "neutral")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Hold formation.", "turn_1"),
                    StoryBeat.Combat("kael", "Let them come to you.", "turn_3"),
                    StoryBeat.Combat("lyric", "Nice work, Dren.", "victory")
                }
            };
        }

        private static StoryScript CreateStage1_3()
        {
            return new StoryScript
            {
                StageId = "1-3",
                StageName = "Eastern Scouts",
                StageType = "gameplay",
                EnvironmentDescription = "Farmland at the settlement's eastern approach. Rows of crops dying in the heat. A farmhouse sits isolated near the tree line, its windows dark. The eastern horizon shows that shimmer again, closer now.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.BriefCard("Scouts report movement near the eastern breach. Investigate and clear the approach.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The group passes a farmhouse. A family is outside. The father waves. They refuse evacuation."),
                    StoryBeat.Narration("Kael spends an hour reinforcing entry points, shows the father where the palisade is thinnest, and leaves two spare essence-forged spears."),
                    StoryBeat.Dialogue("kael", "Keep these by the door. Aim for the joints -- that's where the hide is thinnest.", "determined"),
                    StoryBeat.Narration("The next day, the children are playing by the well. The father has mounted one of the spears by the front door. This is Kael's principle: people choose. You don't sacrifice them without their consent.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Positions locked. Advance.", "turn_1"),
                    StoryBeat.Combat("lyric", "We've got them!", "turn_5")
                }
            };
        }

        private static StoryScript CreateStage1_4()
        {
            return new StoryScript
            {
                StageId = "1-4",
                StageName = "Veil Anomaly",
                StageType = "character",
                EnvironmentDescription = "Observatory-like ruin near the settlement's Veilborn quarter. Stone platforms, crystalline growths, instruments long corroded. The Veil feels thicker here. Sky flickers occasionally.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("After clearing a Voidspawn incursion, Otho examines the emergence sites while Kael stands watch."),
                    StoryBeat.Dialogue("otho", "The emergence pattern is interesting. The Void tears opened closest to the Veilborn quarter. The Voidspawn probably prioritize us because we're their biggest threat.", "neutral"),
                    StoryBeat.Dialogue("otho", "But here's what I can't account for: precision. They come from the Void -- a different world. So how does a creature from over there know, immediately upon arrival, exactly where the Veilborn are standing over here?", "neutral"),
                    StoryBeat.Dialogue("senna", "They sense Veil energy. Everyone knows that.", "neutral"),
                    StoryBeat.Dialogue("otho", "Yes. Everyone knows that.", "neutral"),
                    StoryBeat.Narration("He writes this in his notebook. The seed is planted -- something about the Veil is wrong in ways nobody's articulated yet.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Evening at camp. Senna gathers the group."),
                    StoryBeat.Dialogue("senna", "The Echoes are drifting more than usual. Something in the background is pulling at them. I've felt it for years, but it's getting louder.", "neutral")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage1_5()
        {
            return new StoryScript
            {
                StageId = "1-5",
                StageName = "Second Wave",
                StageType = "gameplay",
                EnvironmentDescription = "Grassland between settlement and perimeter. Voidspawn trails are visible. The horizon shimmer has crept closer. The emptiness of the landscape makes every creature stand out.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.BriefCard("Voidspawn patrols are intensifying. Three encounters reported near the settlement edge. The creatures are more organized.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Night camp. Otho works late with his notebook, cross-referencing Frontier Veil patterns."),
                    StoryBeat.Narration("Senna comes to find him for dinner. He closes his notebook quickly."),
                    StoryBeat.Dialogue("otho", "Coming. Just finishing up.", "neutral"),
                    StoryBeat.Narration("The group eats together. Lyric tries to get a laugh from the militia. The settlement feels safer now. Nobody knows this is the last night where everything makes sense.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Spread formation!", "turn_1"),
                    StoryBeat.Combat("lyric", "Don't break ranks!", "turn_3"),
                    StoryBeat.Combat("senna", "Echo bonds are steady. Push harder.", "turn_5")
                }
            };
        }

        private static StoryScript CreateStage1_6()
        {
            return new StoryScript
            {
                StageId = "1-6",
                StageName = "Perimeter Reinforcement",
                StageType = "character",
                EnvironmentDescription = "Palisade wall, especially the eastern and northern breaches. Militia volunteers work alongside the party to reinforce weak points. The sun is setting, casting orange light across the grass.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Kael works one-on-one with militia members, showing optimal positioning. Lyric moves between groups, checking injuries, trading stories."),
                    StoryBeat.Narration("Senna supervises Dren's attunement sensitivity training. He still shakes, but less. Otho observes Veil patterns from the watchtower.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("At the communal fire, Lyric pulls Kael aside."),
                    StoryBeat.Dialogue("lyric", "Dren's in his first real fight. He could break. But he's not going to, because he thinks we believe in him.", "neutral"),
                    StoryBeat.Dialogue("kael", "He did stand firm.", "neutral"),
                    StoryBeat.Dialogue("lyric", "He barely moved. But Torren saw what I did -- saw him included in the victory. That's leadership. Not just winning. Making sure the people who didn't directly win still feel like they contributed.", "determined"),
                    StoryBeat.Narration("This is what separates them. Kael sees patterns and positions. Lyric sees people and meaning.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage1_7()
        {
            return new StoryScript
            {
                StageId = "1-7",
                StageName = "The Warden Approaches",
                StageType = "boss",
                HasCutscene = true,
                EnvironmentDescription = "Eastern perimeter where the Veil's shimmer is most visible. The landscape is transitional -- grass giving way to something crystalline. The Veil Warden stands three meters tall, made of corrupted stone. The air tastes like ozone.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Dialogue("senna", "Something massive just crossed through. Guardian-class, but... twisted. Corrupted.", "shocked"),
                    StoryBeat.Narration("The group approaches cautiously. The Warden is still, waiting."),
                    StoryBeat.Dialogue("senna", "It was benign once. Something twisted it.", "sad"),
                    StoryBeat.Narration("The Warden roars -- a sound that echoes wrong, like multiple frequencies playing at once."),
                    StoryBeat.Dialogue("lyric", "We've won harder fights. We've lost easier ones. This one we handle together. And we celebrate when it's done.", "determined"),
                    StoryBeat.Dialogue("kael", "It'll telegraph attacks with a red-zone shimmer. Reposition away from the center when you see it.", "determined")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The Warden falls. Stone crumbles. Corrupted energy dissipates. The militia erupts in ragged cheers."),
                    StoryBeat.Dialogue("lyric", "You survived your first boss. Drinks are on me.", "happy"),
                    StoryBeat.Narration("At the fire afterward, Senna approaches Kael and Lyric."),
                    StoryBeat.Dialogue("senna", "These corruptions are happening faster than they used to.", "neutral"),
                    StoryBeat.Dialogue("otho", "Yes. They are.", "neutral"),
                    StoryBeat.Narration("Kael and Lyric share a look -- comfortable, familiar. The mission was going well. They didn't know this was the last time everything would feel simple.")
                },
                CombatDialogue = new List<StoryBeat>
                {
                    StoryBeat.Combat("kael", "Red zone! Reposition away from the center!", "turn_1"),
                    StoryBeat.Combat("lyric", "Hold steady! We've got this!", "turn_3"),
                    StoryBeat.Combat("senna", "It's drawing on the Veil... I can feel it pulling.", "boss_phase_2")
                }
            };
        }

        private static StoryScript CreateStage1_8()
        {
            return new StoryScript
            {
                StageId = "1-8",
                StageName = "Settlement Secured",
                StageType = "character",
                EnvironmentDescription = "Settlement central square at night. Fires burning. Militia volunteers sit in clusters. The palisade gaps are now reinforced. The eastern breach is sealed. Beyond the walls, the grassland is dark and silent.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Lyric walks the settlement, checking on Dren and other militia members. He makes each conversation feel personal. He's everywhere and nowhere -- a ghost of morale moving between fires.")
                },
                PostMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("Kael sits with Lyric at the final fire. The settlement is safe. The frontier is held."),
                    StoryBeat.Dialogue("lyric", "You survived your first boss. Drinks are on me.", "happy"),
                    StoryBeat.Narration("Dren actually smiles. It's a good moment. A simple moment."),
                    StoryBeat.Narration("In the background, Senna and Otho share a look across the fire -- something unspoken. The Veil density here is rising. The corruptions are accelerating."),
                    StoryBeat.Narration("But tonight, the settlement is safe. Nobody at this fire knows that tomorrow brings recall orders. Nobody knows that the Frontier was the last place where everything was simple.")
                },
                CombatDialogue = new List<StoryBeat>()
            };
        }

        private static StoryScript CreateStage1_9()
        {
            return new StoryScript
            {
                StageId = "1-9",
                StageName = "Frontier Farewell",
                StageType = "character",
                EnvironmentDescription = "Settlement gate at dawn. The group is packed and ready to depart. Militia members line the road. The grasslands stretch south toward farming country.",
                PreMission = new List<StoryBeat>
                {
                    StoryBeat.Narration("The group departs the settlement with handshakes and promises to return. Dren stands at the gate and watches them go."),
                    StoryBeat.Narration("The journey south begins. Kael walks point. Lyric handles conversation. Senna maintains the daily attunement schedule without breaking stride. Otho walks into a fence post.")
                },
                PostMission = new List<StoryBeat>(),
                CombatDialogue = new List<StoryBeat>()
            };
        }
    }
}
