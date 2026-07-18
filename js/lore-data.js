// =============================================================================
// lore-data.js — Codex content: world/region lore, stage narration, unit lore
// cards, hero entries, bond stories (Prompt 63 — Phase 2.8 Lore Delivery).
// Adapted from STORY-DRAFT-V1.md / STORY-STAGES-V2.md / STORY-BEATS-CATALOG-V2.md /
// HERO-REWORK.md / UNITS-DESIGN.md. Terminology: the Veil, the Otherside, Echoes,
// Voidspawn, Resonants, Veilborn, Attunement, Veil Essence, the Sovereign.
// =============================================================================

// ---- World Lore (always visible — foundational, non-spoiler knowledge) ----
// Reflects what every Resonant is taught, not the truth uncovered in Region 4.

var WORLD_LORE = [
    {
        id: 'the_veil',
        title: 'The Veil',
        text: 'A barrier between the mortal realm and the Otherside. It has always existed, thinning in places, and it is the reason Echoes can be summoned and Voidspawn occasionally break through. Nobody alive remembers a world without it.'
    },
    {
        id: 'resonants_and_veilborn',
        title: 'Resonants & Veilborn',
        text: 'The gifted are born one or the other, never both. Resonants channel Echo energy outward through their bodies — faster, stronger, sharper, even unarmed. Veilborn sense the Veil inward: they sustain Echo bonds, read energy patterns, and perform the Attunement that binds an Echo to a Resonant. Neither is complete without the other.'
    },
    {
        id: 'echoes_and_voidspawn',
        title: 'Echoes & Voidspawn',
        text: 'So the elders teach it: the Otherside is two planes, not one. The Luminous Plane is home to Echoes — peaceful spirits that can be summoned to fight, defend, or serve. The Void is a corrupted anti-dimension that spawns hostile Voidspawn through tears that form naturally as the Veil ages. Two worlds, two doors, one group of people who keep the right one open.'
    },
    {
        id: 'veil_essence',
        title: 'Veil Essence',
        text: 'The universal currency, harvested from defeated Voidspawn. Every Attunement Rite, every star-up, every piece of forged equipment costs essence. The loop is simple: fight Voidspawn, harvest their energy, use it to summon and strengthen Echoes, fight more Voidspawn.'
    }
];

// ---- Region Lore (unlocked on first stage clear in that region) ----

var REGION_LORE = {
    1: {
        title: 'The Frontier',
        text: 'Rolling grassland at the edge of the world, where the Veil\'s shimmer never quite settles on the horizon. Kael and Lyric\'s first deployment together: a settlement under mounting Voidspawn pressure, and a chance to prove two very different men make one very good team.'
    },
    2: {
        title: 'The Barracks Trials',
        text: 'A military training ground in the contested east, where recruits earn their formations and squads earn their trust. This is where Mira and Ren joined the group, and where old pre-Shattering scrolls first entered Otho\'s notebook — the beginning of a question nobody thought to ask twice.'
    },
    3: {
        title: 'The Synergy Trials',
        text: 'Escalating Voidspawn activity across the frontier brought the group to full strength — five Resonants, three Veilborn — and forced its first real disagreement about what a life is worth. Something vast and wrong showed itself on the eastern horizon here, and nobody had a name for it yet.'
    },
    4: {
        title: 'The Shattered Lands',
        text: 'A devastated stretch where the Veil has worn so thin the sky flickers between worlds, and Echoes and Voidspawn wander the same broken ground without distinction. Whatever the group learns here will not be able to be unlearned.'
    },
    5: {
        title: 'The Dual Convergence',
        text: 'The long road toward a place called the Wellspring, where the Veil is said to be thinnest of all. A theory, a possible answer, and the slow, careful work of rebuilding a group that came apart at the seams.'
    },
    6: {
        title: 'The Elemental Crucible',
        text: 'Ground where reality forgets which world it belongs to, crystal and stone trading places mid-step. Every element the Veil holds is unstable here, and so is everyone walking through it.'
    },
    7: {
        title: 'The Proving Grounds',
        text: 'The last stretch of solid ground before the Nexus. New allies, old wounds, and a plan the whole group has finally agreed to try — together, and on their own terms.'
    },
    8: {
        title: 'The Abyss Gate',
        text: 'Where the sky splits open and the Sovereign waits, vast and faceless, filling the horizon it once merely bruised. Whatever happens here, happens once.'
    }
};

// ---- Stage Narration (1-3 sentence intro blurb per stage, keyed to STAGES ids) ----
// Unlocked once the stage is cleared. Shown as a flavor block in the stage list.

var STAGE_LORE = {
    r1_s1: 'Kael counts the breaches in the palisade — three north, two east. Lyric turns the tally into something the militia can stomach: stay behind the big ones, don\'t wander off, let a Resonant handle anything ugly. First impressions, and the pattern that will hold for the rest of the campaign.',
    r1_s2: 'Senna reads the attunement bond and catches Kael in a small lie about being stressed before he\'s finished denying it. At the northern breach, the militiaman Dren stands his ground for the first time, and Lyric makes sure he knows it mattered.',
    r1_s3: 'Dying crop rows and a shuttered farmhouse mark the settlement\'s eastern edge. The horizon shimmer is close enough now to feel like ozone before a storm.',
    r1_s4: 'A frontier family refuses to evacuate. Lyric wants to override them; Kael won\'t. They leave two spears by the door instead — the family\'s choice to make, not theirs.',
    r1_s5: 'Voidspawn patrols hit harder after dark, more of them, moving with a coordination nobody remembers seeing before.',
    r1_s6: 'Round the fire, Senna tunes both of "her boys" like instruments she\'s owned for years — needling Kael\'s denial, teasing Lyric\'s good mood. Otho mutters about soil density and walks into a tree.',
    r1_s7: 'Otho notices the Void tears keep opening closest to the Veilborn quarter — oddly precise, for creatures supposedly arriving from somewhere else entirely. Senna has an easy explanation. He writes the question down anyway.',
    r1_s8: 'The reinforced walls hold, and the group pushes past them — into open grassland where the Voidspawn trails run thicker and the shimmer never quite settles.',
    r1_boss: 'A guardian spirit, twisted past recognition, crackles at the settlement\'s edge — something benign, corrupted into a weapon. It falls, the militia cheers, and Senna notices out loud that these corruptions are coming faster than they used to.',

    r2_s1: 'Recalled south, the group passes a village hit overnight — no fire, no fight, just empty houses and cold food. In the wreckage they find Mira, sixteen and Veilborn, still gripping a broken shovel like she meant to use it.',
    r2_s2: 'Ren joins the squad and says almost nothing about the training exercise where Kael took a hit meant for him. He hasn\'t needed to — he\'s been studying Kael\'s blind side ever since.',
    r2_s3: 'A Voidspawn skirmish on the approach to the Barracks. Mira watches from behind the line — her first real look at what a Resonant with a bonded Echo can do.',
    r2_s4: 'Archetype drills on the training sand: Guardians soak the rush, Rangers chip the walls, Sorcerers burst the healers. Lyric catches Kael watching Mira train and grins before Kael can tell him not to.',
    r2_s5: 'Recruits and Resonants sweep the valley for stragglers. Ren shadows Kael\'s fighting angles instead of joining every fight himself — still measuring, still learning.',
    r2_s6: 'A recruit freezes mid-drill. Lyric wants him pulled; Kael argues for one more chance. Neither of them is wrong, and the recruit stays.',
    r2_s7: 'Pre-Shattering scrolls describe a fixed point where the Veil runs thinnest — the Wellspring. Buried in the same pile, dismissed as an old scholarly error, sits a detail nobody thinks twice about: the ancients never had separate words for Echoes and Voidspawn at all.',
    r2_s8: 'Gear repaired, bonds refreshed, recruits drilled once more — the Barracks readies itself for whatever the escalating tears to the east are about to send through.',
    r2_boss: 'A Voidspawn drawn by the sheer concentration of Resonant energy tears its way into the training arena. Kael calls the phase shifts, Ren reads them before they land, and the recruits watch a team that trusts each other work.',

    r3_s1: 'Two more Resonants join the roster — Sera, sharp and competitive; Maren, warm and steady. Paired with Ren\'s wall and Sera\'s burst damage, the eastern settlements start holding their lines again.',
    r3_s2: 'Senna starts running attunement sessions with Kael and Lyric separately. Their bonds have begun pulling against each other, and she\'d rather tune two instruments alone than let them fight each other\'s song.',
    r3_s3: 'Sera pulls more power from the field than clean attunement should allow, and the enemy line doesn\'t break — it detonates. Her bond flickers, visibly, for four full seconds afterward. Nobody mentions it twice.',
    r3_s4: 'Hallen\'s Veilborn quarter sits in a Voidspawn advance\'s path. Lyric wants to hold it — twenty lives for two hundred; Kael won\'t order anyone to die defending their own home. The compromise saves the village and costs twelve extra soldiers — the first crack neither of them can unsay.',
    r3_s5: 'Settlement after settlement, the synergy tactics click — Ren and Sera locked together, Maren steady behind Lyric\'s pressure. Away from the fighting, Kael and Lyric have started eating at separate fires.',
    r3_s6: 'Twenty years on the wall taught the veteran Harl something Command never wrote down: the attacks don\'t track detection, they track arrival — Voidspawn showing up within hours of new Veilborn, however quietly they came. He laughs it off as bringing them in his luggage. Kael doesn\'t laugh.',
    r3_s7: 'The group pushes through the last defended settlements before the ridge, formations tightening, the enemy hitting harder and closer together with every mile east.',
    r3_s8: 'Cresting a ridge, the group stops. The eastern sky isn\'t dark — it\'s dense, a bruise that hums in the teeth. Otho stares at it and, for the first time anyone\'s seen, doesn\'t write anything down.',
    r3_boss: 'Two Voidspawn that amplify each other whenever they fight close together, in a canyon where the sky flickers between worlds. Kael and Lyric split the team without a word passing between them — and after the clean kill, sit apart for the first time all campaign.',

    r4_s1: 'The world changes at the border — crystal grass, a flickering sky, wild Echoes drifting past Voidspawn that never seem to notice them. The horizon that used to be a bruise is now a wall, slow and vast and advancing.',
    r4_s2: 'Otho holes up in a ruined observatory with star charts and old birth registries while the group holds the perimeter against waves that come faster than they should. He emerges with shaking hands, asking for one more night.',
    r4_s3: 'The group scouts the Sovereign\'s perimeter and learns the hard way: every Voidspawn they kill is replaced before it hits the ground, and the harder Senna strains to hold the bonds, the brighter the thing pulses. Sixty seconds in, Kael calls the retreat. Lyric already knows why.',
    r4_s4: 'Otho lays out the charts: there was never a Luminous Plane and a Void — one Otherside, one door, and the Veilborn are that door. Every Echo and every Voidspawn crossed through the same opening. Senna goes white; Mira asks if that means they cause it, and no one has an answer.',
    r4_s5: 'Lyric comes to Kael\'s fire with the math already finished — four thousand Veilborn against everyone else, the easiest calculation in the world and the hardest thing he\'s ever said. Kael won\'t do it, and won\'t let him either. Lyric walks into the dark, and neither of them sleeps.',
    r4_s6: 'At dawn, Lyric walks openly toward the Veilborn tent. Kael steps into his path — not to kill him, and not to be killed, just to be the wall between his oldest friend and the people who trust him.',
    r4_s7: 'The largest rupture yet tears open, drawn by the fight itself, and something massive drags its way through. Kael and Lyric stop fighting each other and start fighting together — no words needed, just the same old coordination.',
    r4_s8: 'The rift keeps widening no matter how much falls into it. Every Voidspawn cleared buys seconds, not safety, and the group is running out of both.',
    r4_boss: 'A titan of stone and corrupted dark drags itself from the largest breach the group has ever seen. When it finally falls, Lyric walks to the rupture and pours everything he is into sealing it by hand — "Find another way. You owe me that" — and doesn\'t get back up.',

    r5_s1: 'Otho surfaces from grief with a plan: the Wellspring, the old convergence point, where three Veilborn channeling together might seal the Veil for good. They\'d lose their powers, not their lives. Senna calls it the best bargain she\'s heard in a long time.',
    r5_s2: 'Senna starts training Mira properly now that every hand matters more. Where Senna\'s attunement lands like a held chord, Mira\'s is lighter, cleaner — Kael notices the difference the first time she adjusts his bond.',
    r5_s3: 'The road east is thinner than it should be, patrols hitting daily as the group closes on the Wellspring\'s outer reach.',
    r5_s4: 'A ferryman remembers Senna healing his daughter\'s fever years ago and rows the group across for free, passing along a small wooden bird his daughter carved for "the kind lady." On the far bank, past the tree line, they find his village burning.',
    r5_s5: 'Maren finds the group on the road, hollowed out from months of watching from a distance. Walking away didn\'t stop the dying — it just meant she couldn\'t see it, and that was worse.',
    r5_s6: 'The land past the river won\'t settle — trees at wrong angles, water too still under a sky that isn\'t always the right one. Mira\'s field attunement gets faster with every skirmish.',
    r5_s7: 'Voidspawn hit in tighter, more coordinated groups the deeper the group pushes — as if something ahead has started to notice them coming.',
    r5_s8: 'Losing her powers means losing the thing that keeps drawing the darkness toward the people she loves. Senna calls it the best trade she\'s ever been offered, and very nearly believes herself.',
    r5_s9: 'Otho refines the seal: three Veilborn should be enough for a clean closure, though the oldest tears might need more than clean ever gives. He doesn\'t finish that thought around Mira.',
    r5_boss: 'Guardian of the Crucible\'s threshold, a creature that shifts elements without warning and punishes any team that can\'t shift with it. Mid-fight, Mira lands her first field attunement under real pressure — steadying Kael\'s bond before Senna even has to move.',

    r6_s1: 'The Crucible can\'t decide which world it belongs to — one step on earth, the next on ringing crystal, the sky flickering through colors with no name. The Sovereign is visible from any high ground now, no longer on the horizon but rising above it. Mira starts getting nosebleeds and wipes them on her sleeve without comment.',
    r6_s2: 'In a refugee valley, Mira finds two children whose Veilborn parents died when a Voidspawn surge followed the group\'s own trail to their sanctuary. The boy cooks like he taught himself; the girl hasn\'t spoken in weeks. The group resupplies and leaves before dawn — staying any longer only endangers them further.',
    r6_s3: 'Sera keeps pulling raw power from the corrupted air, faster and harder than her bonds can really take. She doesn\'t mention the cost. Kael notices anyway.',
    r6_s4: '"Will I stop being Veilborn after we seal the Wellspring?" Otho tells her the truth — yes, permanently. Mira just says: "Good."',
    r6_s5: 'The Sovereign fills more of the sky every day the group climbs deeper into the Crucible, and the ground hums loud enough to feel in the teeth.',
    r6_s6: 'Alone at the fire, Senna holds the ferryman\'s wooden charm and admits what the seal will actually cost her — not her life, just everything she\'s ever known how to be. Mira sits with her and doesn\'t try to fix it.',
    r6_s7: 'Another engagement, another overcharge — Sera burns through her bond to win the fight faster, degrading it further. Senna spends longer each night putting her back together.',
    r6_s8: 'The Crucible\'s worst terrain finally gives way to the warzone beyond it — wreckage, cratered ground, the unmistakable signs of a Sovereign that knows something is coming for it.',
    r6_s9: 'Walking in silence after the refugee camp, Mira finally asks Kael if Lyric was right. "About the problem, yes. About the solution, no." "What if your solution doesn\'t work either?" He has nothing. She writes something down and doesn\'t say what.',
    r6_boss: 'A crystalline guardian that cycles through elemental immunities, demanding everything the team has just to keep pace. When it shatters into scattered light, Kael looks east toward the Proving Grounds and admits, for the first time, that they can\'t do this with the people they have left.',

    r7_s1: 'What\'s left of the group crosses into the Proving Grounds together — fewer than they started with, but whole in the way that still matters. The terrain here stutters like a skipping record, mortal world and Otherside overlapping in the same breath.',
    r7_s2: 'A lone Resonant fights a Voidspawn patrol on fading Echo bonds, four months without a Veilborn to maintain them. Kael\'s group breaks the patrol; Voss counts the Veilborn among them and asks for nothing but attunement. "Simple math."',
    r7_s3: 'Ren speaks up mid-assault for the first time in months — "Hold position. Let them come to us" — and Kael, mid-order, actually stops and listens.',
    r7_s4: 'The Sovereign\'s constant presence makes the bonds hum until it hurts. Mira wipes blood from her lip and keeps working; Voss treats her like infrastructure worth maintaining, not a problem to feel guilty about — the first relief she\'s had in weeks.',
    r7_s5: 'Voss trains, fights, eats, sleeps — no small talk, no apology for needing Veilborn support. Senna spends days coaxing his corroded bonds back to something functional.',
    r7_s6: 'Sera clocks the weakness Voss won\'t mention — a bond degraded on his blind side — and offers to cover it without being asked. Two pragmatists settling terms in under a minute.',
    r7_s7: 'The warzone thickens the closer the group gets to the Wellspring, as if the Sovereign itself is trying to block the road.',
    r7_s8: 'A Voidspawn stronghold blocks the pass. Ren\'s read on the terrain holds the line, and the assault ends in minutes instead of casualties.',
    r7_s9: 'Kael lays out the plan to all eight of them: the Veilborn channel the seal, lose their powers, live. Senna adds the part that matters most — "We do this willingly. No one is executing us. We\'re choosing."',
    r7_boss: 'An ancient Voidspawn guardian strips their synergy, splits the battlefield, and forces a countdown they can\'t out-heal. Voss throws everything he has at it, Kael lands the final blow, and then looks at what\'s left of the group and simply says: "Together."',

    r8_s1: 'Before the final push, Mira sits apart with her notebook, mid-sentence about spirals that fold back on themselves, when Kael calls the group to move. She tucks it away, meaning to finish the thought later.',
    r8_s2: 'Voss moves to the front without being asked. "You gave your word this would work. I\'m holding you to it."',
    r8_s3: 'The crystal underfoot cracks and reforms with every step, tears opening and closing like something breathing. The Sovereign is close enough now to watch them come.',
    r8_s4: 'Up close, the Sovereign has no face — just corruption given geometry, copying whatever element hits it hardest. Kael spreads the damage thin and refuses to give it a single target to learn from.',
    r8_s5: 'The Sovereign answers with mirrors of its own — four Void Champions wearing the team\'s own faces and abilities. Voss just attacks the nearest copy and keeps moving; everyone else has to look their own reflection in the eye first.',
    r8_s6: 'A pulse of void energy every twelve seconds, unavoidable and building. The Sovereign finally buckles and falls — and starts pulling itself back together within three seconds of hitting the ground.',
    r8_s7: 'The small tears seal, but the oldest ones hold. Senna understands what "feedback" always meant, tells Kael she\'s choosing this, and burns her connection instead of severing it. Otho follows without a word — two people, both choosing, and the sky still not whole.',
    r8_boss: 'One tear remains, the oldest, and Mira can\'t make her hand finish rising before it starts widening again. Kael channels everything he has left through her fading bond without waiting for her to decide — the Veil slams shut, the Sovereign collapses to nothing, and the world goes quiet in a way it never has before.'
};

// ---- Unit Lore Cards (1-2 sentences per base unit, keyed to UNIT_TEMPLATES) ----
// Unlocked when the unit is first obtained.

var UNIT_LORE = {
    // FIRE
    flame_warrior: 'The simplest of fire spirits, young and quick to anger. It hoards heat in its blade with every strike, waiting for the blow that finally ignites.',
    ember_scout: 'Fire that has not learned patience. It strikes first and hardest, certain the fight is already over before the enemy notices it has begun.',
    cinder_archer: 'A hunter of embers already lit. It does not start fires so much as finish them, loosing arrows into whatever is already burning.',
    fire_acolyte: 'A young flame that learned mercy the hard way. Its warmth mends wounds, but it can\'t help singeing whatever stands too close to the fire.',
    magma_knight: 'Slow-moving and thick-skinned, this Echo wears its own heat like armor. Strike it, and the fire strikes back.',
    blaze_lancer: 'It fixes on a single target and burns hotter with every hit, a fire that does not spread so much as concentrate.',
    pyromancer: 'Deep enough in the Otherside to have opinions about fire. It does not merely burn things; it tends other flames, coaxing them to burn longer and hungrier.',
    inferno_fox: 'A quick, clever spirit that leaves the ground smoldering wherever it has passed, more mischief than malice until it decides to strike.',
    fire_dragon: 'It rouses slowly and rarely, deep enough in the Otherside that most Rites end in silence before this one finally answers. When it does, the air around the summoning circle is already warm.',
    ashen_watcher: 'An old ember-spirit that has outlived its own flame more than once. It does not burn things back to life so much as coax them from the ash, patient in a way few fires ever are.',
    phoenix: 'The Phoenix does not answer the Attunement Rite so much as permit it, a fire that has died and returned so many times it no longer fears the difference. Where it burns, nothing stays dead for long, itself least of all.',

    // WATER
    tide_hunter: 'A simple spirit of the shallows, patient until it is touched, and then it drags whatever struck it down with the current.',
    frost_archer: 'Its arrows carry the first bite of winter, small and cold, content to wear an enemy down one shot at a time.',
    reef_stalker: 'Quick through open water and gone before the strike lands, this Echo trusts the current to carry it away faster than any blade can follow.',
    coral_priest: 'Gentle and unhurried, it tends wounds the way the tide smooths stone: slowly, and without being asked twice.',
    hydro_mage: 'It does not rush the fight. It waits for the water to do its work first, then strikes at whatever the current has already weakened.',
    shell_knight: 'Armored and unbothered, it has learned that most blows can simply be waited out behind a hard enough shell.',
    tidal_shaman: 'An old water-spirit that mends and unmakes in the same breath, healing hands that leave the tide pulling at an enemy\'s feet.',
    riptide_blade: 'It reads the pull of the water on an enemy\'s limbs and strikes exactly where the current has left them slowest.',
    kraken: 'Deep-dwelling and rarely roused, it answers the Rite the way the sea answers a stone dropped into it: slowly, and then all at once, pulling everything down with it.',
    abyssal_guardian: 'Something that has stood at the bottom of the deepest trench longer than the Veil has had a name for it. It does not attack so much as refuse to move.',
    leviathan: 'The Leviathan surfaces so rarely that most Resonants who summon it never learn its true size, only the weight of water it displaces, and the silence that follows when it submerges again.',

    // EARTH
    stone_guard: 'A plain stone spirit that grows steadier the more company it keeps, content to be a wall so long as someone stands beside it.',
    bramble_knight: 'Simple and stubborn, it does not chase a fight. It grows thorns and waits for the fight to come to it.',
    seedling_archer: 'Young growth, barely rooted, that gets stronger the longer it is left standing, a slow threat most enemies notice too late.',
    earth_shaman: 'It mends with the same steadiness it draws from the ground itself, and lends that same unshakeable footing to whoever it heals.',
    crystal_mage: 'Encased in its own hardened light, it treats every blow as an inconvenience rather than a threat, and simply grows the shell back.',
    mud_stalker: 'It goes under the ground before the fight begins and does not resurface until it has already chosen where to strike.',
    golem: 'Old and utterly literal. It was made to stand in one place, and nothing short of the Veil itself has ever managed to move it.',
    terra_sage: 'A quiet, deliberate spirit. Every strike it commits to the field, it also spends shoring up the ally nearest to it.',
    ancient_treant: 'Rooted beyond easy counting, its bark remembers Veils that closed centuries before this one thinned. It moves like something that has never once needed to hurry.',
    grove_warden: 'A watcher grown into the shape of a bow, older than the grove it guards. It has seen enough intruders that its aim no longer wavers.',
    world_tree: 'The World Tree is older than the distinction between the Otherside and this one; some say its roots touch both. It does not fight so much as insist that everything nearby keeps living.',

    // WIND
    zephyr_scout: 'Barely more than a gust given shape, it cannot sit still. Every kill just gives it another reason to run faster.',
    wind_archer: 'It shoots faster with every kindred spirit at its back, a simple wind-thing that trusts the flock more than the lone gust.',
    gale_dancer: 'Light-footed and restless, it can\'t stay still long enough to finish healing before it\'s already moved on to the next ally.',
    wind_squire: 'An eager young wind-spirit, quick to swing and quicker to swing again. It never really slows down once it starts.',
    sky_knight: 'It carries itself like it\'s already won, and somehow that confidence spreads to whoever fights beside it.',
    gust_sentinel: 'A spirit of moving air that simply isn\'t where an arrow expects it to be, and sends the arrow somewhere else entirely.',
    monsoon_caller: 'It calls down weather that has no business existing indoors or out, and every fallen enemy only feeds the storm it is building.',
    wind_duelist: 'It treats a duel like a dance it already knows the steps to, drifting untouched through blows that should have landed.',
    storm_sovereign: 'Restless and never in the same place twice. By the time an enemy registers where it stood, it has already gone somewhere worse for them to be.',
    tempest_weaver: 'An old weather-spirit that treats the battlefield like a loom, and every ally\'s spell like another thread it can pull taut.',
    void_wyrm: 'The Void Wyrm barely belongs to any one place. It answers the Rite reluctantly, and when it moves, the space around it seems to reconsider where things ought to be.',

    // LIGHTNING
    spark_fencer: 'Young and quick-tempered, it fights best beside its own kind, arcing its strikes toward whichever kindred spirit stands closest.',
    volt_runner: 'It does not walk into a fight so much as arrive at it, gathering speed and certainty with every dash until the strike is inevitable.',
    thunder_archer: 'It counts its own shots without meaning to, and every third one lands like it\'s been saving up the charge.',
    pulse_mender: 'Its healing arrives like a jolt rather than a balm, mending a wound and sharpening the ally\'s next strike in the same motion.',
    tesla_knight: 'Touch it and the air around it turns hostile. This Echo does not need to retaliate directly when the charge in its skin does the work.',
    shock_mage: 'It never quite finishes a spell in one place. The current always wants somewhere else to go, and it rarely argues.',
    ball_lightning: 'An unstable little sphere of stored charge that would rather be left alone, and makes that very clear to anyone who gets close.',
    thunder_warden: 'Old and grounded, it absorbs a strike the way a rod draws down a storm, and gives back more than it was struck with.',
    thunderbird: 'It does not arrive so much as descend, a spirit that spent generations circling above the Veil before deciding a single dive was worth the fall.',
    voltfang_stalker: 'A predator that thinks in fractions of a second. By the time thunder reaches an enemy\'s ears, this Echo has already decided whether they live.',
    storm_dragon: 'The Storm Dragon does not summon lightning so much as remember it. Every strike it lands wakes something in every lesser bolt still crackling nearby.',

    // FORCE
    iron_soldier: 'A plain, disciplined spirit, comfortable only in formation. It holds its line better with every ally who holds theirs.',
    shadow_blade: 'It does not linger after a kill. Will and momentum are the only elements it answers to, and both say: move.',
    steel_archer: 'Utterly still until it isn\'t. This Echo trusts patience over speed, and lets every unmoving second sharpen the shot.',
    war_cleric: 'It does not just mend a wound. It hands back the will to keep swinging, which is the only kind of healing this spirit really understands.',
    battle_mage: 'It does not ask permission from an enemy\'s guard. Force, once willed, goes where it is sent regardless of what stands in the way.',
    shield_bearer: 'A quiet, dutiful spirit that would rather stand between an ally and a blow than be thanked for it afterward.',
    gladiator: 'It fights like it is being watched, building toward one decisive blow with the discipline of something that has never lost by accident.',
    fortress: 'Nothing sways it: not fear, not force, not the pull of the Veil itself. It simply will not be moved, and that has always been enough.',
    siege_engineer: 'Ancient and methodical, it does not fight so much as calculate, and by the time the calculation is finished, the outcome is rarely in doubt.',
    iron_duelist: 'A veteran of more duels than it can be bothered to count, deep enough in the Otherside that it answers few Rites, and finishes the ones it does.',
    titan_lord: 'The Titan Lord barely answers the Attunement Rite at all. It simply arrives, as if the ground itself had been waiting for a reason to stand up.'
};

// ---- Hero Entries (unlocked when hero is unlocked) ----

var HERO_LORE = {
    kael: 'A Resonant, one of the strongest of his generation, quiet in the way that looks like calm until someone pushes the wrong line. He leads by being right about the tactical call and first into danger, not by charisma. His principles aren\'t philosophy — they\'re instinct, inherited from a father who refused to trade lives even to save a village. "No one falls while I stand."',
    lyric: 'Kael\'s closest friend since their training days — charismatic, warm, the one who remembers your mother\'s name. His utilitarianism comes from the same place Kael\'s principles do: love, stretched far enough to calculate. "Maximum output, whatever the cost."',
    ren: 'A tank Resonant, quiet and steady, who communicates through positioning more than words. He stays through every crisis without hesitating, not out of philosophy but personal loyalty — Kael saved his life once, and that was enough. "I\'m here. That\'s enough."',
    sera: 'A Resonant caster, competitive and sharp, who respects pragmatism because she believes sentimentality gets people killed. She leaves the group when it fractures to do something she considers useful, and returns humbled, the arrogance traded for something quieter. "Hit the right target at the right time."',
    maren: 'A Resonant as warm and empathetic as Lyric, who loves the Veilborn of the group personally, especially Senna. She leaves not because she thinks anyone is wrong, but because she can\'t watch principle cost lives — and returns understanding that walking away doesn\'t make the dying stop. "Everyone comes home."',
    voss: 'A Resonant who fought alone for four months on a fading Echo bond after his Veilborn attunist left. Blunt and practical, he treats the Veilborn as essential infrastructure, not a moral question — a clean relief, for once. "Results. Now."'
};

// ---- Bond Stories (one short paragraph per bond in units-bonds.js) ----
// Unlocked when the bond first triggers on a deployed team (stats.bondsUsedSeen).

var BOND_LORE = {
    fire_duo: 'Flame Warrior and Pyromancer answered the same Attunement Rite an hour apart — the same fire, split into a blade and a storm. When both walk the field, neither burns alone.',
    water_duo: 'Frost Archer\'s stillness and Tidal Shaman\'s current are the same water wearing two different moods. Veilborn who\'ve bonded both say the attunement hums like a tide finding its rhythm.',
    earth_duo: 'Stone Guard held the line long before Golem answered the Rite to stand beside it — one flesh and stone, one wholly stone, both immovable for the same reason.',
    wind_duo: 'Zephyr Scout scouts the gap; Wind Duelist closes it. Summoned from the same restless current, they move like a single gust that forgot to stay one shape.',
    lightning_duo: 'Spark Fencer\'s blade and Thunder Archer\'s bowstring hum with the same charge — strike close, strike far, same storm, same instant.',
    force_duo: 'Gladiator breaks the line so Shield Bearer doesn\'t have to hold it alone. Force Echoes don\'t share an element the way fire or water do — they answer to will, and these two share one.',
    fire_and_ice: 'Fire wants to consume; water wants to endure. Flame Warrior and Frost Archer shouldn\'t work together at all — and the fact that they do, better than most matched pairs, is the kind of thing Otho used to write down, before he learned what write-downs meant.',
    silent_storm: 'Neither Shadow Blade nor Zephyr Scout make a sound crossing open ground. Summoned Echoes rarely share a hunting style this closely without sharing an origin — nobody has confirmed whether they do.',
    immovable_object: 'Molten rock and armored shell, fire and water, agreeing on exactly one thing: neither of them is going anywhere. Attunists call this the stubbornest bond in the roster.',
    conductor: 'Water carries a charge better than air ever could. Shock Mage and Hydro Mage learned that lesson from each other faster than any Veilborn could have taught it to them.',
    elemental_trinity: 'Fire, water, and earth in their oldest, least-corrupted forms. Phoenix, Leviathan, and World Tree are old enough that some Veilborn wonder if they remember a time before the Sovereign — before there was anything to remember it from.',
    arcane_circle: 'Three sorcerer-Echoes, three elements, one shared fluency in bending Veil energy into shape. Their combined casting reads less like three spells and more like one argument, settled in real time.',
    shadow_pack: 'Fire, water, and wind hunters who\'ve learned to move as if hunting were never a solo act. None of the three particularly likes company. They make an exception for each other.',
    iron_wall: 'Fire, earth, and lightning, all built the same way: thick, slow, and very hard to move. Together they don\'t so much hold a line as become one.',
    healing_light: 'Fire, water, and wind healers, each channeling the same instinct through a different current. Attunists who\'ve bonded all three describe it as the closest thing to hearing three Echoes agree on anything.',
    legendary_convergence: 'Lightning, wind, and force, at their most ancient and least willing to be summoned twice. When all three answer the same Rite, Veilborn say the pull from the Otherside feels less like a call and more like a conversation.',
    deep_and_shallow: 'Abyssal Guardian holds the deep water; Tide Hunter works the shallows it protects. When the Guardian\'s fortress rises, the current it displaces gives Tide Hunter somewhere faster to stand.',
    fire_and_ash: 'Fire Dragon burns; Ashen Watcher tends to what\'s left after. It isn\'t a comfortable bond to hold — most Veilborn need years of attunement before they\'re ready to carry both at once — but nothing heals a Burning ally faster.',
    eye_of_the_storm: 'Three wind Echoes, three different storms, one shared eye. Where their zones overlap, Veilborn report the strangest calm they\'ve ever felt mid-battle — like standing in weather that\'s decided not to hurt you, this time.'
};
