// =============================================================================
// units-abilities.js — Ability data and passive data for all units
// =============================================================================
// =============================================================================
// ABILITY DATA (132 entries: 66 base + 66 evolved)
// =============================================================================

var ABILITY_DATA = {
    // --- FIRE BASE ---
    flame_warrior:   { name: 'Blade Inferno',    desc: 'Slash forward, dealing 150% ATK in a cone. Apply Burn (15 DPS, 3s) to all hit.' },
    ember_scout:     { name: 'Ambush',           desc: 'Dash behind target, dealing 200% ATK and applying Burn (10 DPS, 3s). Refund 30 mana if it kills.' },
    cinder_archer:   { name: 'Fire Arrow',       desc: 'Next auto-attack empowered, deals 180% ATK and applies Burn (15 DPS, 3s).' },
    fire_acolyte:    { name: 'Sacred Flame',     desc: 'Heal lowest-HP ally for 140% ATK. If ally is below 35% HP, heal for 220% instead.' },
    magma_knight:    { name: 'Magma Eruption',   desc: 'Explode ground around self, dealing 160% ATK to nearby enemies and applying Burn (20 DPS, 3s). Gain Shield equal to 20% max HP.' },
    blaze_lancer:    { name: 'Lance Strike',     desc: 'Dash forward, dealing 180% ATK and applying Burn (12 DPS, 3s). Reset Momentum stacks.' },
    pyromancer:      { name: 'Infernal Storm',   desc: 'Cast storm at location, dealing 200% ATK to all enemies in area over 3s. Apply Burn (25 DPS, 4s).' },
    inferno_fox:     { name: 'Spirit Rush',      desc: 'Dash 3 times to 3 different enemies over 1.5s, dealing 100% ATK each. Final target takes 200%.' },
    fire_dragon:     { name: 'Breath Weapon',    desc: 'Breathe fire in a cone, dealing 250% ATK and applying Burn (30 DPS, 4s). Stun closest hit enemy for 1.5s.' },
    ashen_watcher:   { name: 'Pyre of Renewal', desc: 'Target lowest-HP ally. Column of flame erupts beneath them, healing for 300% ATK over 3s. Target immune to CC during heal. If Burning, consume Burn and increase heal 50%.' },
    phoenix:         { name: 'Rebirth',          desc: 'PASSIVE: On death, revive after 3s at 50% HP. First revive always triggers; subsequent on kills. Explode on revive for 150% ATK in area.' },

    // --- WATER BASE ---
    tide_hunter:     { name: 'Tidal Slash',      desc: 'Slash forward, dealing 160% ATK and applying Slow (15% attack speed, 3s) to all hit.' },
    frost_archer:    { name: 'Frost Shot',       desc: 'Shoot freeze projectile, dealing 170% ATK and applying Slow (20% AS, 3s). Frozen targets take 15% more damage for 4s.' },
    reef_stalker:    { name: 'Depth Strike',     desc: 'Teleport behind target, deal 220% ATK. If target is Slowed, deal 280% instead and reset dash cooldown.' },
    coral_priest:    { name: 'Tidal Blessing',   desc: 'Heal 2 lowest-HP allies for 150% ATK each. Grant them 10% DR for 4s.' },
    hydro_mage:      { name: 'Hydro Bolt',       desc: 'Launch water blast at target, dealing 200% ATK and applying Slow (18% AS, 3s). Chain to 1 nearby slowed enemy for 120% damage.' },
    shell_knight:    { name: 'Shelled Stance',   desc: 'Gain Shield equal to 25% max HP. All Water allies gain Shield equal to 12% max HP.' },
    tidal_shaman:    { name: 'Tidal Surge',      desc: 'Heal all Water allies for 160% ATK. They gain 15% dodge for 3s.' },
    riptide_blade:   { name: 'Maelstrom Spin',   desc: 'Spin rapidly, dealing 180% ATK to nearby enemies and applying Slow (20% AS, 3s). Gain 20% lifesteal for 4s.' },
    kraken:          { name: 'Maelstrom',        desc: 'Create whirlpool at target location (2-cell radius). Over 4s, deal 280% ATK total to enemies and pull them 1 cell toward center each second.' },
    abyssal_guardian:{ name: 'Tidal Fortress',  desc: 'Slam ground, creating 2-cell radius zone for 5s. Enemies Slowed 25%, take 80% ATK/s. Allies +10% DR. Guardian Rooted during channel, gains +20% DR.' },
    leviathan:       { name: 'Tidal Guardian',   desc: 'PASSIVE: Water allies gain 12% max HP and 8% DR. Enemies hitting Leviathan lose 8 mana. Start combat with 200 shield.' },

    // --- EARTH BASE ---
    stone_guard:     { name: 'Stone Barrier',    desc: 'Gain Shield equal to 28% max HP. Allies within 2 cells gain Shield equal to 15% max HP.' },
    bramble_knight:  { name: 'Thorn Bash',       desc: 'Deal 140% ATK and stun 1s. Gain Shield equal to 18% max HP. Nearby allies gain Shield equal to 10% max HP.' },
    seedling_archer: { name: 'Root Shot',        desc: 'Shoot projectile, dealing 160% ATK. Root target for 1.5s. Grant self +15% ATK per rooted enemy for 4s.' },
    earth_shaman:    { name: 'Earth\'s Blessing', desc: 'Heal 2 lowest-HP allies for 150% ATK. Grant them Shield equal to 12% max HP.' },
    crystal_mage:    { name: 'Stalagmite Burst', desc: 'Deal 200% ATK to target and adjacent enemies. Root them 1.5s. Grant allies in area Shield equal to 15% max HP.' },
    mud_stalker:     { name: 'Subterranean Strike', desc: 'Burrow for 1s, emerge at target dealing 220% ATK. Root target 1.5s. Gain Shield equal to 15% max HP.' },
    golem:           { name: 'Ground Slam',      desc: 'Slam ground dealing 180% ATK to nearby enemies and stunning them 1.2s. Grant self 15% DR for 4s.' },
    terra_sage:      { name: 'Earthen Barrage',  desc: 'Launch 3 earth projectiles at 3 highest-ATK enemies, each dealing 140% ATK and reducing their ATK 18% for 4s.' },
    ancient_treant:  { name: 'Nature\'s Wrath',  desc: 'Strike target dealing 220% ATK and rooting for 2s. Heal all Earth allies for 15% of damage dealt.' },
    grove_warden:    { name: 'Thornstorm',      desc: 'Fire 5 thorn projectiles at random enemies. Each deals 120% ATK and applies Slow 15% for 2s. Rooted or Slowed targets take 40% bonus damage.' },
    world_tree:      { name: 'Bloom of Life',    desc: 'PASSIVE: Every 8s, nearest lowest-HP 3 allies heal for 250% ATK. Overhealing converts to Shield (60%). Earth allies +10% healing received.' },

    // --- WIND BASE ---
    zephyr_scout:    { name: 'Swift Slash',      desc: 'Dash to target, deal 210% ATK. Grant self 25% dodge for 3s.' },
    wind_archer:     { name: 'Pierce Shot',      desc: 'Shoot arrow that pierces through enemies, dealing 170% ATK to each. Grant self +18% ATK speed for 4s.' },
    gale_dancer:     { name: 'Rejuvenating Breeze', desc: 'Heal 2 lowest-HP allies for 140% ATK each. Grant them +12% ATK speed for 4s.' },
    wind_squire:     { name: 'Gust Slash',       desc: 'Slash nearby enemies, dealing 140% ATK and applying +15% move speed to self and allies for 4s.' },
    sky_knight:      { name: 'Aegis Guard',      desc: 'Block next incoming damage, redirect it as AoE around self. Grant nearby allies Shield equal to 15% max HP.' },
    gust_sentinel:   { name: 'Cyclone Guard',    desc: 'Gain Shield equal to 28% max HP. For 4s, redirect all projectiles targeting nearby allies to self.' },
    monsoon_caller:  { name: 'Tornado',          desc: 'Summon tornado at location. Deals 200% ATK over 3s to enemies in area (2-cell radius). Silence them 2s.' },
    wind_duelist:    { name: 'Cyclone Slash',    desc: 'Spin slash, dealing 190% ATK in area. Gain 30% dodge for 3s. Reset dodge stacks.' },
    storm_sovereign: { name: 'Thunder Cleave',   desc: 'Teleport to lowest-HP enemy and deal 280% ATK. Adjacent enemies take 100% ATK splash.' },
    tempest_weaver:  { name: 'Cyclone Barrage', desc: 'Launch twisting projectile at highest-ATK enemy. Deal 220% ATK, knock 1 cell back. If knocked into another enemy, both take 120% ATK and Slow 20% for 2s.' },
    void_wyrm:       { name: 'Dimensional Rift', desc: 'PASSIVE: When any ally casts ability, fire bolt at random enemy for 90% ATK. Fires more often with ability-heavy teams.' },

    // --- LIGHTNING BASE ---
    spark_fencer:    { name: 'Crackle Slash',    desc: 'Slash with electric arc, dealing 150% ATK to target and adjacent enemies. Apply chain bonus for 3s.' },
    volt_runner:     { name: 'Volt Dash',        desc: 'Dash through target, dealing 210% ATK and applying chain damage bonus. Reset dash cooldown if crits.' },
    thunder_archer:  { name: 'Lightning Arrow',  desc: 'Shoot arrow that chains to enemies. Deal 170% ATK to each target hit.' },
    pulse_mender:    { name: 'Shock Pulse',      desc: 'Heal lowest-HP ally for 145% ATK. Chain heal to 1 nearby ally for 80% ATK.' },
    tesla_knight:    { name: 'Tesla Barrier',    desc: 'Gain Shield equal to 25% max HP. Allies within 1 cell gain Shield equal to 12% max HP. Reflect 25% of absorbed damage.' },
    shock_mage:      { name: 'Chain Lightning',  desc: 'Cast lightning at target, chains to 2 nearby enemies. Deal 170% ATK to each. Refund 20 mana per crit.' },
    ball_lightning:  { name: 'Sphere Summoning', desc: 'Summon ball lightning at location. It rolls toward enemies, dealing 180% ATK to each it hits and chaining damage.' },
    thunder_warden:  { name: 'Lightning Prison', desc: 'Emit lightning that stuns nearby enemies 1s and applies chain damage. Grant self 8% DR per Lightning ally for 5s.' },
    thunderbird:     { name: 'Lightning Descent', desc: 'Dive at lowest-HP enemy dealing 240% ATK and applying chain damage. Stun nearby enemies 0.8s.' },
    voltfang_stalker:{ name: 'Lightning Pounce', desc: 'Dash to lowest-HP enemy within 4 cells, deal 200% ATK. On kill, dash to next lowest-HP and deal 150% ATK. Chain up to 3 kills. Each dash leaves Afterimage (2s, 50% ATK to enemies stepping through).' },
    storm_dragon:    { name: 'Cataclysmic Storm', desc: 'PASSIVE: Every 6s, strike target with lightning dealing 300% ATK and chaining to all nearby enemies. Chains crit at 50%.' },

    // --- FORCE BASE ---
    iron_soldier:    { name: 'Power Strike',     desc: 'Deliver devastating punch, dealing 160% ATK. Grant nearby allies +12% ATK for 3s.' },
    shadow_blade:    { name: 'Killing Blow',     desc: 'Dash to target, deal 220% ATK. If target below 40% HP, guaranteed crit dealing 340% instead.' },
    steel_archer:    { name: 'Piercing Shot',    desc: 'Fire arrow that pierces all enemies, dealing 170% ATK each. Apply 18% DR reduction to targets.' },
    war_cleric:      { name: 'Holy Strike',      desc: 'Heal lowest-HP ally for 150% ATK. Deal 100% ATK damage to nearest enemy.' },
    battle_mage:     { name: 'Force Bolt',       desc: 'Hurl force projectile, dealing 210% ATK and knocking back target 1 cell. Reset projectile on kill.' },
    shield_bearer:   { name: 'Impenetrable Wall', desc: 'Gain Shield equal to 30% max HP. Grant nearby allies Shield equal to 15% max HP. Block next CC effect.' },
    gladiator:       { name: 'Brutal Strike',    desc: 'Perform powerful strike, dealing 220% ATK and applying 15% DR reduction to target for 4s.' },
    fortress:        { name: 'Defensive Stance', desc: 'Gain +12% DR for 6s. Taunt nearby enemies for 2s and reduce their ATK by 20%.' },
    siege_engineer:  { name: 'Artillery Strike', desc: 'Target furthest enemy and deal 280% ATK. Create impact crater (40% slow, 3s) around target.' },
    iron_duelist:    { name: 'Decisive Strike', desc: 'Next auto-attack deals 280% ATK and ignores 30% of target\'s DR. If target is Rival, apply Wound (target receives 30% less healing, 2s).' },
    titan_lord:      { name: 'Earthshaker',      desc: 'PASSIVE: Every 7s, slam ground dealing 320% ATK in area. Enemies rooted 2s and take 20% more damage for 5s. Force allies +15% ATK.' },

    // --- FIRE EVOLVED ---
    fire_berserker:   { name: 'Inferno Slash',     desc: 'Slash forward dealing 200% ATK to target + adjacent enemies. Apply Burn (25 DPS, 4s).' },
    flame_rogue:      { name: 'Phantom Blaze',     desc: 'Dash behind target, dealing 250% ATK and leaving fire trail (25 DPS, 3s). Refund 50 mana on kill.' },
    cinder_marksman:  { name: 'Fire Barrage',      desc: 'Fire 2 arrows (120% ATK each) and apply Burn (15 DPS, 3s). Enemies hit take +20% burn damage.' },
    ember_saint:      { name: 'Holy Inferno',      desc: 'Heal lowest-HP ally for 160% ATK. Grant +15% ATK for 4s. Apply Burn (15 DPS, 3s) to nearest enemy.' },
    volcano_titan:    { name: 'Volcanic Eruption',  desc: 'Explode ground in large AoE, dealing 200% ATK and applying Burn (25 DPS, 4s). Gain Shield equal to 30% max HP for 5s.' },
    inferno_lancer:   { name: 'Inferno Lance',     desc: 'Dash forward in a line, dealing 220% ATK to all enemies and applying Burn (18 DPS, 3s). Lifesteal based on Momentum stacks.' },

    // --- WATER EVOLVED ---
    tsunami_blade:    { name: 'Tsunami Slash',     desc: 'Slash forward dealing 200% ATK. Apply 20% Slow for 4s. Heal self for 30% of damage dealt.' },
    ice_sniper:       { name: 'Frozen Barrage',    desc: 'Shoot freeze projectile dealing 210% ATK. Apply 25% Slow for 4s. Slowed targets take 12% more damage.' },
    tidal_phantom:    { name: 'Phantom Strike',    desc: 'Teleport behind target dealing 280% ATK. Guaranteed crit against Slowed targets. Gain stealth for 2s.' },
    ocean_sage:       { name: 'Ocean\'s Blessing', desc: 'Heal 2 lowest-HP allies for 180% ATK each. Grant 12% DR for 5s. Cleanse one debuff.' },
    abyssal_mage:     { name: 'Abyssal Bolt',      desc: 'Launch water blast dealing 240% ATK. Chain to 2 nearby enemies. Apply 25% Slow for 4s.' },
    armored_sentinel: { name: 'Fortress Stance',   desc: 'Gain Shield equal to 32% max HP. All Water allies within 3 cells gain Shield equal to 18% max HP.' },

    // --- EARTH EVOLVED ---
    mountain_lord:    { name: 'Mountain Barrier',   desc: 'Gain Shield equal to 35% max HP. Allies within 2 cells gain Shield equal to 18% max HP. Transfer DR stacks.' },
    ironwood_sentinel:{ name: 'Ironwood Bash',     desc: 'Deal 170% ATK and stun 1.5s. Gain Shield equal to 22% max HP. All nearby allies gain Shield equal to 14% max HP.' },
    thornwood_ranger: { name: 'Thorn Shot',        desc: 'Shoot projectile dealing 200% ATK. Root target for 2s and apply 15% slow. Grant self +18% ATK for 4s.' },
    gaia_priest:      { name: 'Gaia\'s Blessing',  desc: 'Heal 2 lowest-HP allies for 180% ATK. Grant Shield equal to 15% max HP. Allies gain first CC immunity.' },
    geomancer:        { name: 'Crystal Barrage',   desc: 'Deal 240% ATK in wide area. Root enemies 2s. Grant allies in area Shield equal to 20% max HP.' },
    quake_reaper:     { name: 'Earthquake Strike',  desc: 'Burrow and emerge dealing 260% ATK to target and nearby enemies. Root 2s. Stun 0.5s.' },

    // --- WIND EVOLVED ---
    storm_assassin:   { name: 'Storm Slash',       desc: 'Dash to target dealing 260% ATK. Grant self 30% dodge for 3s. Resets on kill.' },
    gale_sniper:      { name: 'Gale Barrage',      desc: 'Pierce Shot penetrates all enemies dealing 210% ATK each. Grant self 15% dodge and +22% ATK speed for 4s.' },
    stormweaver:      { name: 'Storm Breeze',      desc: 'Heal 3 lowest-HP allies for 170% ATK each. Grant +18% ATK speed for 5s.' },
    zephyr_warrior:   { name: 'Zephyr Slash',      desc: 'Slash nearby enemies dealing 170% ATK. Grant self and allies +20% ATK speed and move speed for 4s.' },
    aegis_paladin:    { name: 'Divine Guard',      desc: 'Block next incoming damage. Redirect as AoE. Grant allies within 3 cells Shield equal to 20% max HP and 5% DR.' },
    tempest_guardian: { name: 'Tempest Guard',     desc: 'Gain Shield equal to 35% max HP. Redirect projectiles in 3-cell radius to self for 5s. Reflect 35% absorbed damage.' },

    // --- LIGHTNING EVOLVED ---
    arc_duelist:      { name: 'Arc Slash',          desc: 'Slash dealing 190% ATK to target and nearby enemies. Chain damage scales with Lightning synergy. Apply chain bonus for 4s.' },
    lightning_phantom:{ name: 'Lightning Dash',    desc: 'Dash through target dealing 260% ATK. Hits twice on crit. Reset dash on crit.' },
    storm_archer:     { name: 'Storm Arrow',       desc: 'Shoot piercing arrow dealing 210% ATK to each target. Chains to 2 extra enemies. Resets on crit.' },
    storm_medic:      { name: 'Storm Pulse',       desc: 'Heal lowest-HP ally for 180% ATK. Chain heal to 2 nearby allies for 100% ATK each.' },
    storm_bastion:    { name: 'Storm Barrier',     desc: 'Gain Shield equal to 32% max HP. Allies within 2 cells gain Shield equal to 15% max HP. Reflect 40% of absorbed damage.' },
    tempest_mage:     { name: 'Tempest Lightning', desc: 'Cast lightning chaining to 3 enemies. Deal 210% ATK each. Refund 40 mana per crit.' },

    // --- FORCE EVOLVED ---
    legionnaire:      { name: 'Legion Strike',     desc: 'Deal 200% ATK and apply 10% DR reduction to target for 4s. Grant nearby allies +15% ATK for 4s.' },
    night_stalker:    { name: 'Assassination',     desc: 'Dash to target dealing 270% ATK. Guaranteed crit below 40% HP. Resets on kill. Gain 15% lifesteal for 3s.' },
    ballista_archer:  { name: 'Ballista Shot',     desc: 'Fire 2 piercing arrows dealing 200% ATK each. Apply 25% DR reduction to all targets hit.' },
    battle_priest:    { name: 'Holy Wrath',        desc: 'Heal lowest-HP ally for 180% ATK. Deal 130% ATK damage to all nearby enemies.' },
    force_archmage:   { name: 'Force Blast',       desc: 'Hurl force projectile dealing 260% ATK. Knock back 2 cells. Ignore 18% DR.' },
    bastion:          { name: 'Fortress Wall',     desc: 'Gain Shield equal to 38% max HP. Grant nearby allies Shield equal to 20% max HP. Grant CC immunity for 3s.' },

    // --- FIRE T3-T5 EVOLVED ---
    arcane_inferno:      { name: 'Infernal Storm Enhanced', desc: 'Cast storm at location creating persistent fire zones. Deal 250% ATK over 4s. Apply Burn (30 DPS, 4s). Burn reapplies on zone entry.' },
    ninetail_blaze:      { name: 'Spirit Rush Enhanced', desc: 'Dash 5 times to 5 different enemies over 2s, dealing 120% ATK each. Final target takes 240%. Apply Burn to all hit.' },
    elder_wyrm:          { name: 'Breath Weapon Enhanced', desc: 'Breathe fire in extended cone dealing 280% ATK. Stun all hit for 2s. Apply Burn (30 DPS, 4s) in area.' },
    phoenix_priest:      { name: 'Pyre of Renewal Enhanced', desc: 'Target lowest and second-lowest HP allies. Column of flame erupts beneath them, healing 300% ATK over 3s. Target immune to CC during heal. If Burning, consume and heal +50%. Leave healing zone (50% ATK/s, 3s, 2-cell radius).' },
    eternal_phoenix:     { name: 'Rebirth Enhanced',     desc: 'PASSIVE: On death, revive after 2s at 70% HP. Always triggers. Explode on revive for 250% ATK. Fire allies gain 20% ATK for 6s.' },

    // --- WATER T3-T5 EVOLVED ---
    stormtide_oracle:    { name: 'Tidal Surge',          desc: 'Heal lowest-HP ally for 200% ATK. Grant 25% dodge for 4s. Apply 18% Slow to 2 nearest enemies.' },
    tsunami_warlord:     { name: 'Maelstrom Spin',       desc: 'Spin dealing 230% ATK to all nearby enemies. Apply 30% Slow. Heal for 35% of damage dealt. Stun Slowed enemies 0.5s.' },
    abyssal_terror:      { name: 'Maelstrom Enhanced',    desc: 'Deal 400% ATK total over 4s, pulling enemies 2 cells per second. Apply Slow (30%, 4s) to all in area.' },
    hadal_colossus:      { name: 'Tidal Fortress Enhanced', desc: 'Slam ground, creating 3-cell radius zone for 5s. Enemies Slowed 35%, take 80% ATK/s. Allies +10% DR. Guardian Rooted during channel, gains +20% DR. Enemies leaving zone Rooted 1s.' },
    primordial_leviathan:{ name: 'Tidal Guardian Enhanced', desc: 'PASSIVE: Water allies gain 18% max HP and 12% DR. Enemies lose 12 mana on hit. Start with 400 shield. Every 7s, pull enemies 1 cell closer.' },

    // --- EARTH T3-T5 EVOLVED ---
    iron_colossus:       { name: 'Ground Slam Enhanced', desc: 'Slam ground dealing 250% ATK. Stun for 1.8s. Grant 22% DR to nearby allies for 4s. Reduces AoE damage taken by 18%.' },
    earthweaver:         { name: 'Earthen Barrage',      desc: 'Launch 5 earth projectiles dealing 180% ATK each. Reduce enemy ATK by 25% for 4s. Grant allies 25% max HP shields.' },
    world_sentinel:      { name: 'Nature\'s Wrath',      desc: 'Deal 300% ATK to target. Root for 3s. Heal self for 25% of damage dealt. Grant immunity to slows.' },
    worldroot_sentinel:  { name: 'Thornstorm Enhanced',  desc: 'Fire 7 thorn projectiles at random enemies. Each deals 120% ATK, apply Slow 15% for 2s. Rooted/Slowed targets take 40% bonus. Plant Seedlings on each hit (4s duration). Seedlings Root enemies stepping on them (1.5s).' },
    yggdrasil:           { name: 'Bloom of Life Enhanced', desc: 'PASSIVE: Every 6s, heal 4 allies for 350% ATK. Overhealing converts to Shield (80%). Earth allies +15% healing. Dead allies revive once at 30% HP.' },

    // --- WIND T3-T5 EVOLVED ---
    tempest_lord:        { name: 'Tornado Enhanced',     desc: 'Summon tornado in 3-cell radius dealing 300% ATK. Silence all hit for 3s. Knock back enemies 1 cell.' },
    hurricane_blade:     { name: 'Cyclone Slash',        desc: 'Spin dealing 260% ATK to nearby enemies. Grant self 45% dodge for 4s. Apply Slow to all hit.' },
    tempest_emperor:     { name: 'Thunder Cleave',       desc: 'Deal 380% ATK in 2-cell splash. Guaranteed crit. Apply 15% Slow. Resets on kill.' },
    stormweft_oracle:    { name: 'Cyclone Barrage Enhanced', desc: 'Launch twisting projectile at highest-ATK enemy. Deal 220% ATK, knock 2 cells back. If knocked into wall/edge, Stun 1.5s. If into another enemy, both take 120% ATK and Slow 20% for 2s. Max 4 vortices.' },
    dimensional_dragon:  { name: 'Dimensional Rift Enhanced', desc: 'PASSIVE: When ally casts ability, fire 2 bolts at 120% ATK each. Every 10s, open rift dealing 150% ATK area damage.' },

    // --- LIGHTNING T3-T5 EVOLVED ---
    plasma_core:         { name: 'Sphere Summoning',     desc: 'Summon 2 lightning balls that orbit and deal 25 DPS each. Balls chain to enemies, applying +18% damage taken for 4s.' },
    storm_fortress:      { name: 'Lightning Prison Enhanced', desc: 'Create 2-cell radius prison. Stun for 1.5s. Grant 10% DR per ally inside. Excess crits convert to 1s stuns.' },
    roc_of_storms:       { name: 'Lightning Descent Enhanced', desc: 'Dive dealing 330% ATK. Stun for 1.5s. Chain lightning to nearby enemies. First hit guarantees crit.' },
    plasma_ravager:      { name: 'Lightning Pounce Enhanced', desc: 'Dash to lowest-HP enemy within 4 cells, deal 200% ATK. On kill, dash to next lowest-HP and deal 200% ATK. Chain up to 4 kills. Each dash leaves Afterimage (2s). Afterimages explode after 2s for 100% ATK in 1-cell radius.' },
    thunder_god:         { name: 'Cataclysmic Storm Enhanced', desc: 'PASSIVE: Every 4.5s, strike dealing 450% ATK. Chain to all nearby enemies. Chains always crit. Lightning allies +25% crit damage.' },

    // --- FORCE T3-T5 EVOLVED ---
    champion:            { name: 'Brutal Strike Enhanced', desc: 'Deal 320% ATK. Apply 25% DR reduction for 4s. Stun target 0.8s on kill. Triggers every 2 attacks.' },
    citadel:             { name: 'Defensive Stance Enhanced', desc: 'Gain +18% DR for 8s. Taunt at 2-cell range for 3s. Reduce enemy ATK by 30%. Immune to all CC.' },
    war_architect:       { name: 'Artillery Strike Enhanced', desc: 'Deal 380% ATK to furthest enemy. 2-cell crater with 50% slow for 4s. Ignore 25% DR.' },
    warforged_champion:  { name: 'Decisive Strike Enhanced', desc: 'Next auto-attack deals 350% ATK, ignores 50% of target\'s DR. If target is Rival, apply Wound (30% less healing, 2s). On kill, refund 50% mana. If Rival killed, gain +10% permanent ATK (stacks).' },
    cosmic_titan:        { name: 'Earthshaker Enhanced', desc: 'PASSIVE: Every 5.5s, slam dealing 480% ATK. Root 3s. Damage amp 25% for 6s. Force allies +20% ATK and +10% DR.' }
};

// =============================================================================
// PASSIVE DATA (66 base unit innate passives)
// =============================================================================

var PASSIVE_DATA = {
    // --- FIRE ---
    flame_warrior:   { name: 'Heated Blows',     desc: 'Every 3rd auto-attack deals 25% bonus damage.', trigger: 'on_attack', params: { interval: 3, bonusDamage: 0.25 } },
    ember_scout:     { name: 'First Blood',      desc: 'First attack after entering combat deals 50% bonus damage.', trigger: 'combat_start', params: { bonusDamage: 0.50 } },
    cinder_archer:   { name: 'Ignition',         desc: 'Auto-attacks against Burning enemies deal 20% bonus damage.', trigger: 'on_attack', params: { conditionalBonus: 0.20, condition: 'target_burning' } },
    fire_acolyte:    { name: 'Cauterize',        desc: 'Heals also apply Burn (8 DPS, 2s) to the nearest enemy.', trigger: 'on_attack', params: { burnDps: 8, burnDuration: 2 } },
    magma_knight:    { name: 'Molten Armor',     desc: 'When hit by melee attack, deals 15 fire damage back to attacker.', trigger: 'on_hit', params: { reflectDamage: 15 } },
    blaze_lancer:    { name: 'Momentum',         desc: 'Consecutive hits on the same target increase damage by 8% per stack (max 5).', trigger: 'on_attack', params: { damagePerStack: 0.08, maxStacks: 5 } },
    pyromancer:      { name: 'Pyromaniac',       desc: 'Burn effects on enemies hit by Pyromancer last 50% longer and deal 20% more DPS.', trigger: 'on_attack', params: { burnDurationMultiplier: 1.5, burnDpsMultiplier: 1.20 } },
    inferno_fox:     { name: 'Foxfire',          desc: 'Leaves fire trail when moving. Trail lasts 2.5s and deals 18 DPS to enemies on it.', trigger: 'periodic', params: { trailDps: 18, trailDuration: 2.5 } },
    fire_dragon:     { name: 'Dragonfire Aura',  desc: 'Enemies within 2 cells take 20 fire damage per second.', trigger: 'aura', params: { auraDps: 20, range: 2 } },
    ashen_watcher:   { name: 'Ember Shroud',    desc: 'Heals on allies linger as warm afterglow. Healed allies gain Shield equal to 15% of heal amount for 4s. Applies to all heals (abilities, lifesteal, regen). If ally Burning, shield grants 2s Burn immunity when applied.', trigger: 'on_heal', params: { shieldPct: 0.15, shieldDuration: 4, burnImmunityDuration: 2 } },
    phoenix:         { name: 'Eternal Flame',    desc: 'While alive, all Fire allies gain 15% ATK and 8% lifesteal. On revival, aura doubles for 6s.', trigger: 'aura', params: { atkBonus: 0.15, lifesteal: 0.08, range: 999 } },

    // --- WATER ---
    tide_hunter:     { name: 'Undertow',         desc: 'When Tide Hunter takes damage, the attacker is slowed 8% for 2.5s.', trigger: 'on_hit', params: { slowPct: 0.08, slowDuration: 2.5 } },
    frost_archer:    { name: 'Chill',            desc: 'Auto-attacks have 25% chance to slow target attack speed by 15% for 2s.', trigger: 'on_attack', params: { procChance: 0.25, slowPct: 0.15, slowDuration: 2 } },
    reef_stalker:    { name: 'Slippery',         desc: 'After dashing, gain 20% dodge for 3s.', trigger: 'on_attack', params: { dodgeBonus: 0.20, dodgeDuration: 3 } },
    coral_priest:    { name: 'Soothing Mists',   desc: 'Allies within 2.5 cells passively heal 0.8% max HP per second.', trigger: 'aura', params: { healPct: 0.008, range: 2.5 } },
    hydro_mage:      { name: 'Torrent',          desc: 'Abilities deal 18% bonus damage to Slowed targets.', trigger: 'on_attack', params: { bonusDamage: 0.18, condition: 'target_slowed' } },
    shell_knight:    { name: 'Shell Defense',    desc: 'Start combat with Shield equal to 18% max HP. On taking heavy hit, gain 8% DR for 3s.', trigger: 'combat_start', params: { shieldPct: 0.18, drThreshold: 0.15, drBonus: 0.08, drDuration: 3 } },
    tidal_shaman:    { name: 'Scepter of Tides', desc: 'Heals also apply Slow (12% AS, 2s) to nearest enemy.', trigger: 'on_attack', params: { slowPct: 0.12, slowDuration: 2 } },
    riptide_blade:   { name: 'Current',          desc: 'Attacks against Slowed enemies have 25% chance to grant +25% ATK for 3s.', trigger: 'on_attack', params: { procChance: 0.25, atkBonus: 0.25, atkDuration: 3, condition: 'target_slowed' } },
    kraken:          { name: 'Ink Cloud',        desc: 'Every 15s, release ink cloud (2-cell radius). Enemies in it have 35% miss chance for 3s.', trigger: 'periodic', params: { cooldown: 15, range: 2, missChance: 0.35, duration: 3 } },
    abyssal_guardian:{ name: 'Pressure Depths', desc: 'For every 10% max HP lost, gain +3% DR (stacks up to +30% at 1 HP). Attacks against this unit slowed 10%. Deeper health drops, harder to finish the kill.', trigger: 'aura', params: { drPerTenPct: 0.03, drMax: 0.30, attackerSlowPct: 0.10 } },
    leviathan:       { name: 'Abyssal Depths',   desc: 'Every 10s, submerge for 1.5s (untargetable). On resurfacing, deal 120% ATK and apply Slow (25% AS, 4s).', trigger: 'periodic', params: { cooldown: 10, submergeDuration: 1.5, emergeDamage: 1.20, slowPct: 0.25, slowDuration: 4 } },

    // --- EARTH ---
    stone_guard:     { name: 'Fortify',          desc: 'Gain 4% DR for every ally within 2.5 cells (max 20%).', trigger: 'aura', params: { drPerAlly: 0.04, range: 2.5, max: 0.20 } },
    bramble_knight:  { name: 'Thorns',           desc: 'Melee attackers take 12 damage when hitting Bramble Knight.', trigger: 'on_hit', params: { reflectDamage: 12 } },
    seedling_archer: { name: 'Overgrowth',       desc: 'Every 6s in combat, gain a stack of +4% ATK (max 6 stacks, +24%).', trigger: 'periodic', params: { cooldown: 6, atkPerStack: 0.04, maxStacks: 6 } },
    earth_shaman:    { name: 'Grounding',        desc: 'Allies healed by Earth Shaman gain 12% CC resistance for 4s.', trigger: 'on_attack', params: { ccResist: 0.12, duration: 4 } },
    crystal_mage:    { name: 'Crystal Shell',    desc: 'Start combat with Shield equal to 22% max HP. Shield reforms after 8s if broken.', trigger: 'combat_start', params: { shieldPct: 0.22, reformCooldown: 8 } },
    mud_stalker:     { name: 'Burrow',           desc: 'At combat start, burrow underground for 2s (untargetable). Emerge at furthest enemy. First attack guaranteed crit.', trigger: 'combat_start', params: { burrowDuration: 2, guaranteedCrit: true } },
    golem:           { name: 'Immovable',        desc: 'Cannot be knocked back, pulled, or displaced. Takes 12% reduced damage from AoE.', trigger: 'combat_start', params: { displacementImmune: true, aoeDR: 0.12 } },
    terra_sage:      { name: 'Living Earth',     desc: 'Every time Terra Sage casts ability, nearest ally gains Shield equal to 18% max HP.', trigger: 'on_attack', params: { allyShieldPct: 0.18 } },
    ancient_treant:  { name: 'Deep Roots',       desc: 'Cannot be slowed below 75% of base move speed. Regenerate 1.2% max HP/sec while standing still.', trigger: 'combat_start', params: { minMoveSpeedPct: 0.75, regenPct: 0.012 } },
    grove_warden:    { name: 'Deep Roots',       desc: 'While stationary for 3+ seconds, gain +15% ATK and +1 Range (total 6). Auto-attacks from rooted position have 20% chance to apply Root (1s) to target. Moving resets timer.', trigger: 'periodic', params: { stationaryDuration: 3, atkBonus: 0.15, rangeBonus: 1, rootChance: 0.20, rootDuration: 1 } },
    world_tree:      { name: 'Roots of Life',    desc: 'Allies heal 1.2% max HP per second passively, even if silenced/stunned.', trigger: 'aura', params: { healPct: 0.012, range: 999 } },

    // --- WIND ---
    zephyr_scout:    { name: 'Windwalk',         desc: 'After killing target, gain 35% move speed for 2.5s.', trigger: 'on_kill', params: { moveSpdBonus: 0.35, duration: 2.5 } },
    wind_archer:     { name: 'Tailwind',         desc: 'Gain 6% attack speed for each Wind ally on team (including self).', trigger: 'aura', params: { atkSpdPerAlly: 0.06, element: 'wind' } },
    gale_dancer:     { name: 'Zephyr\'s Grace',  desc: 'After casting ability, gain 28% move speed for 3s.', trigger: 'on_attack', params: { moveSpdBonus: 0.28, duration: 3 } },
    wind_squire:     { name: 'Momentum',         desc: 'Gain +8% ATK speed after hitting. Stacks up to 4 times (32%).', trigger: 'on_attack', params: { atkSpdPerStack: 0.08, maxStacks: 4 } },
    sky_knight:      { name: 'Inspiring Presence', desc: 'Allies within 2.5 cells gain 6% damage bonus.', trigger: 'aura', params: { dmgBonus: 0.06, range: 2.5 } },
    gust_sentinel:   { name: 'Deflection',       desc: '12% chance to deflect ranged attacks (bounce to random nearby enemy for 50% damage).', trigger: 'on_hit', params: { deflectChance: 0.12, deflectDamage: 0.50 } },
    monsoon_caller:  { name: 'Updraft',          desc: 'Kills grant all Wind allies 10% ATK speed for 5s (stacks up to 4 times).', trigger: 'on_kill', params: { atkSpdBonus: 0.10, duration: 5, maxStacks: 4, element: 'wind' } },
    wind_duelist:    { name: 'Dance of Blades',  desc: 'Every attack grants +5% dodge (max 5 stacks).', trigger: 'on_attack', params: { dodgePerStack: 0.05, maxStacks: 5 } },
    storm_sovereign: { name: 'Lightning Speed',  desc: 'First auto-attack after repositioning guarantees crit.', trigger: 'on_attack', params: { guaranteedCrit: true, condition: 'after_reposition' } },
    tempest_weaver:  { name: 'Lingering Gales', desc: 'Whenever Tempest Weaver casts ability, Vortex remains on target cell for 6s. Vortices deal 20% ATK/s to enemies, grant +15% dodge to allies. Max 3 active (oldest fades when 4th created). Stack with Wind dodge bonuses.', trigger: 'on_ability_cast', params: { vortexDps: 0.20, vortexAllydodgeBonus: 0.15, maxVortices: 3, vortexDuration: 6 } },
    void_wyrm:       { name: 'Reality Warp',     desc: 'Auto-attacks teleport target 1 cell in random direction (3s cooldown per target).', trigger: 'on_attack', params: { teleportDistance: 1, cooldownPerTarget: 3 } },

    // --- LIGHTNING ---
    spark_fencer:    { name: 'Static Charge',    desc: 'Attacks against enemies near another Lightning unit deal 18% bonus and chain 60 damage.', trigger: 'on_attack', params: { bonusDamage: 0.18, chainDamage: 60, range: 1 } },
    volt_runner:     { name: 'Dash Chain',       desc: 'Each dash grants +20% crit chance for 2s (stacks).', trigger: 'on_attack', params: { critPerStack: 0.20, duration: 2 } },
    thunder_archer:  { name: 'Charged Shot',     desc: 'Every 3 attacks, next attack deals 40% bonus damage and chains to 1 nearby enemy.', trigger: 'on_attack', params: { interval: 3, bonusDamage: 0.40, chainCount: 1 } },
    pulse_mender:    { name: 'Defibrillator',    desc: 'Heals grant healed ally +8% crit chance for 3s.', trigger: 'on_attack', params: { critBonus: 0.08, duration: 3 } },
    tesla_knight:    { name: 'Lightning Conductor', desc: 'Enemies hitting Tesla Knight within 1 cell gain +15% damage taken for 3s.', trigger: 'on_hit', params: { damageAmpPct: 0.15, range: 1, duration: 3 } },
    shock_mage:      { name: 'Electrocution',    desc: 'Abilities have 18% chance to crit and chain to 1 additional target.', trigger: 'on_attack', params: { abilityCritChance: 0.18, chainCount: 1 } },
    ball_lightning:  { name: 'Rolling Thunder',  desc: 'Creates persistent lightning orb (5s). Orb damages nearby enemies 15 DPS. Enemies hitting it take +12% damage.', trigger: 'periodic', params: { orbDuration: 5, orbDps: 15, damageAmp: 0.12 } },
    thunder_warden:  { name: 'Overcharge',       desc: 'Converts excess crits into stuns. Takes +8% crit damage.', trigger: 'on_hit', params: { critDamageIncrease: 0.08, critToStun: true } },
    thunderbird:     { name: 'Aerial Superiority', desc: 'Gains +20% ATK. First attack each combat guarantees crit.', trigger: 'combat_start', params: { atkBonus: 0.20, firstAttackCrit: true } },
    voltfang_stalker:{ name: 'Overcharge Frenzy', desc: 'Every crit grants +8% ATK speed for 4s (stacks up to 5 = +40%). At max stacks, auto-attacks chain to 1 adjacent enemy for 40% damage. Lightning crit bonus fuels this passive.', trigger: 'on_crit', params: { atkSpdPerStack: 0.08, maxStacks: 5, stackDuration: 4, chainDamage: 0.40, chainCount: 1 } },
    storm_dragon:    { name: 'Superconductor',   desc: 'All Lightning allies gain +18% crit chance. Storm Dragon crits grant nearby Lightning allies +25% ATK for 3s.', trigger: 'aura', params: { allyCritBonus: 0.18, critAtkBonus: 0.25, critAtkDuration: 3, element: 'lightning' } },

    // --- FORCE ---
    iron_soldier:    { name: 'Iron Skin',        desc: 'Gain 6% DR per Force ally (including self).', trigger: 'aura', params: { drPerAlly: 0.06, element: 'force' } },
    shadow_blade:    { name: 'Shadow Step',      desc: 'After kill, gain +25% move speed and dodge for 2s.', trigger: 'on_kill', params: { moveSpdBonus: 0.25, dodgeBonus: 0.25, duration: 2 } },
    steel_archer:    { name: 'Steady Aim',       desc: 'Gain +8% damage per second standing still (max 40%).', trigger: 'periodic', params: { damagePerSecond: 0.08, maxBonus: 0.40 } },
    war_cleric:      { name: 'War Prayer',       desc: 'Heals grant healed ally +8% ATK and +5% DR for 4s.', trigger: 'on_attack', params: { atkBonus: 0.08, drBonus: 0.05, duration: 4 } },
    battle_mage:     { name: 'Telekinetic Force', desc: 'Abilities ignore 12% of enemy DR.', trigger: 'on_attack', params: { drIgnore: 0.12 } },
    shield_bearer:   { name: 'Fortified Defense', desc: 'Nearby allies gain 5% DR and start with Shield equal to 10% max HP.', trigger: 'aura', params: { allyDR: 0.05, allyShieldPct: 0.10, range: 2 } },
    gladiator:       { name: 'Arena Master',     desc: 'Every 3 attacks, gain +40% ATK for next attack.', trigger: 'on_attack', params: { interval: 3, bonusDamage: 0.40 } },
    fortress:        { name: 'Unbreakable Will', desc: 'Cannot be Rooted, Stunned, or Slowed below base move speed.', trigger: 'combat_start', params: { ccImmune: true } },
    siege_engineer:  { name: 'War Machine',      desc: 'Attacks ignore 15% of target DR.', trigger: 'on_attack', params: { drIgnore: 0.15 } },
    iron_duelist:    { name: 'Challenge Protocol', desc: 'At combat start, mark highest-ATK enemy as Rival. While fighting Rival, gain +20% ATK and +10% DR. On Rival death, next highest-ATK becomes new Rival. If no Rival in range, gain +15% move speed toward Rival.', trigger: 'combat_start', params: { rivalAtkBonus: 0.20, rivalDrBonus: 0.10, moveSpdBonus: 0.15, rivalDiameter: 5 } },
    titan_lord:      { name: 'Colossus',         desc: 'Gain +25% max HP. Every 5th hit stuns target 1s. First CC immunity per combat.', trigger: 'combat_start', params: { hpBonus: 0.25, stunInterval: 5, stunDuration: 1, firstCcImmune: true } }
};

// =============================================================================
// EVOLVED PASSIVE DATA (66 evolved unit passives)
// =============================================================================

var EVOLVED_PASSIVE_DATA = {
    // --- FIRE EVOLVED ---
    fire_berserker:   { name: 'Scorching Blows',       desc: 'Every 2.5 attacks deals 40% bonus damage and applies Burn (25 DPS, 4s).', trigger: 'on_attack', params: { interval: 2.5, bonusDamage: 0.40, burnDps: 25, burnDuration: 4 } },
    flame_rogue:      { name: 'First Blood Enhanced',   desc: 'First attack deals 80% bonus and ignores 50% DR.', trigger: 'combat_start', params: { bonusDamage: 0.80, drIgnore: 0.50 } },
    cinder_marksman:  { name: 'Ignition Amplified',     desc: 'Attacks vs Burning enemies deal 30% bonus. Applies 10 DPS Burn.', trigger: 'on_attack', params: { conditionalBonus: 0.30, burnDps: 10, condition: 'target_burning' } },
    ember_saint:      { name: 'Cauterize Aura',         desc: 'Heals apply Burn (8 DPS, 2s) to 2 nearest enemies.', trigger: 'on_attack', params: { burnDps: 8, burnDuration: 2, targets: 2 } },
    volcano_titan:    { name: 'Molten Armor Enhanced',   desc: 'Deals 25 damage and leaves 3s lava pool (30 DPS).', trigger: 'on_hit', params: { reflectDamage: 25, lavaPoolDps: 30, lavaPoolDuration: 3 } },
    inferno_lancer:   { name: 'Momentum Mastery',       desc: 'Stacks increase to 10% and grant 5% lifesteal per stack.', trigger: 'on_attack', params: { damagePerStack: 0.10, maxStacks: 5, lifestealPerStack: 0.05 } },

    // --- WATER EVOLVED ---
    tsunami_blade:    { name: 'Undertow Enhanced',      desc: 'Attackers slowed 12% for 3s and lose 5 mana.', trigger: 'on_hit', params: { slowPct: 0.12, slowDuration: 3, manaSteal: 5 } },
    ice_sniper:       { name: 'Chill Amplified',        desc: '35% chance to slow 20% AS. Slowed targets take 12% more damage.', trigger: 'on_attack', params: { procChance: 0.35, slowPct: 0.20, damageAmp: 0.12 } },
    tidal_phantom:    { name: 'Slippery Enhanced',      desc: 'After dash, 35% dodge and stealth for 2s.', trigger: 'on_attack', params: { dodgeBonus: 0.35, stealthDuration: 2 } },
    ocean_sage:       { name: 'Soothing Mists Enhanced', desc: 'Allies heal 1.2% max HP/s. Apply Slow to enemies hitting nearby allies.', trigger: 'aura', params: { healPct: 0.012, range: 2.5, slowOnHit: true } },
    abyssal_mage:     { name: 'Torrent Amplified',      desc: 'Abilities deal 28% bonus damage to Slowed targets.', trigger: 'on_attack', params: { bonusDamage: 0.28, condition: 'target_slowed' } },
    armored_sentinel: { name: 'Shell Defense Enhanced',  desc: 'Start with 25% shield. On heavy hit, gain 12% DR for 3s.', trigger: 'combat_start', params: { shieldPct: 0.25, drBonus: 0.12, drDuration: 3 } },

    // --- EARTH EVOLVED ---
    mountain_lord:    { name: 'Fortify Enhanced',        desc: '5% DR per ally within 2.5 cells (max 25%).', trigger: 'aura', params: { drPerAlly: 0.05, range: 2.5, max: 0.25 } },
    ironwood_sentinel:{ name: 'Thorns Enhanced',        desc: 'Thorns scale with missing HP (up to 25 damage).', trigger: 'on_hit', params: { reflectDamage: 12, maxReflect: 25, scalesWithMissingHp: true } },
    thornwood_ranger: { name: 'Overgrowth Enhanced',    desc: 'Every 6s, +5% ATK per stack (max 6 stacks, +30%).', trigger: 'periodic', params: { cooldown: 6, atkPerStack: 0.05, maxStacks: 6 } },
    gaia_priest:      { name: 'Grounding Enhanced',     desc: '20% CC resistance. First CC per combat immune.', trigger: 'on_attack', params: { ccResist: 0.20, firstCcImmune: true } },
    geomancer:        { name: 'Crystal Shell Enhanced',  desc: 'Start with 30% shield. Reforms after 6s if broken.', trigger: 'combat_start', params: { shieldPct: 0.30, reformCooldown: 6 } },
    quake_reaper:     { name: 'Burrow Enhanced',        desc: 'Emergence deals AoE damage to nearby enemies. Guaranteed crit.', trigger: 'combat_start', params: { burrowDuration: 2, guaranteedCrit: true, aoeDamage: true } },

    // --- WIND EVOLVED ---
    storm_assassin:   { name: 'Windwalk Enhanced',      desc: 'After kill, 45% move speed and 20% dodge for 3s.', trigger: 'on_kill', params: { moveSpdBonus: 0.45, dodgeBonus: 0.20, duration: 3 } },
    gale_sniper:      { name: 'Tailwind Enhanced',      desc: '8% ATK speed per Wind ally. Attacks grant dodge.', trigger: 'aura', params: { atkSpdPerAlly: 0.08, element: 'wind', grantDodge: true } },
    stormweaver:      { name: 'Zephyr\'s Grace Enhanced', desc: '35% move speed after cast for 4s.', trigger: 'on_attack', params: { moveSpdBonus: 0.35, duration: 4 } },
    zephyr_warrior:   { name: 'Momentum Enhanced',      desc: '+8% ATK speed per hit, stacks 5 times (40%).', trigger: 'on_attack', params: { atkSpdPerStack: 0.08, maxStacks: 5 } },
    aegis_paladin:    { name: 'Inspiring Enhanced',     desc: 'Allies in 2.5 cells gain 8% damage and 5% DR.', trigger: 'aura', params: { dmgBonus: 0.08, drBonus: 0.05, range: 2.5 } },
    tempest_guardian: { name: 'Deflection Enhanced',    desc: '20% deflect chance. Reflect 35% absorbed damage.', trigger: 'on_hit', params: { deflectChance: 0.20, reflectDamage: 0.35 } },

    // --- LIGHTNING EVOLVED ---
    arc_duelist:      { name: 'Static Charge Enhanced',  desc: '25% bonus damage to enemies near Lightning allies. Chains to 2 targets.', trigger: 'on_attack', params: { bonusDamage: 0.25, chainCount: 2, range: 1 } },
    lightning_phantom:{ name: 'Dash Chain Enhanced',    desc: '+25% crit and +10% move speed per dash stack.', trigger: 'on_attack', params: { critPerStack: 0.25, moveSpdPerStack: 0.10, duration: 2 } },
    storm_archer:     { name: 'Charged Shot Enhanced',   desc: 'Every 2 attacks, 40% bonus and chains to 2 enemies.', trigger: 'on_attack', params: { interval: 2, bonusDamage: 0.40, chainCount: 2 } },
    storm_medic:      { name: 'Defibrillator Enhanced',  desc: 'Heals grant +12% crit and +5% ATK speed for 3s.', trigger: 'on_attack', params: { critBonus: 0.12, atkSpdBonus: 0.05, duration: 3 } },
    storm_bastion:    { name: 'Conductor Enhanced',     desc: 'Enemies in 2-cell radius gain +15% damage taken. Scales with synergy.', trigger: 'on_hit', params: { damageAmpPct: 0.15, range: 2, scalesWithSynergy: true } },
    tempest_mage:     { name: 'Electrocution Enhanced',  desc: '25% ability crit chance. Chains to 2 targets.', trigger: 'on_attack', params: { abilityCritChance: 0.25, chainCount: 2 } },

    // --- FORCE EVOLVED ---
    legionnaire:      { name: 'Iron Skin Enhanced',     desc: '8% DR per Force ally and +5% HP.', trigger: 'aura', params: { drPerAlly: 0.08, hpBonus: 0.05, element: 'force' } },
    night_stalker:    { name: 'Shadow Step Enhanced',   desc: 'After kill, 35% move speed and 20% dodge for 3s.', trigger: 'on_kill', params: { moveSpdBonus: 0.35, dodgeBonus: 0.20, duration: 3 } },
    ballista_archer:  { name: 'Steady Aim Enhanced',    desc: '+10% damage per second standing still (max 50%).', trigger: 'periodic', params: { damagePerSecond: 0.10, maxBonus: 0.50 } },
    battle_priest:    { name: 'War Prayer Enhanced',    desc: 'Heals grant +12% ATK and +8% DR for 4s.', trigger: 'on_attack', params: { atkBonus: 0.12, drBonus: 0.08, duration: 4 } },
    force_archmage:   { name: 'Telekinetic Enhanced',   desc: 'Abilities ignore 18% DR and deal +8% damage.', trigger: 'on_attack', params: { drIgnore: 0.18, bonusDamage: 0.08 } },
    bastion:          { name: 'Fortified Enhanced',     desc: 'Allies gain 8% DR and 12% starting shield.', trigger: 'aura', params: { allyDR: 0.08, allyShieldPct: 0.12, range: 2 } },

    // --- FIRE T3-T5 EVOLVED ---
    arcane_inferno:      { name: 'Pyromaniac Enhanced',      desc: 'Burn effects last 70% longer and deal 35% more DPS. Fire zones reapply burn on entry.', trigger: 'on_attack', params: { burnDurationMultiplier: 1.7, burnDpsMultiplier: 1.35, zoneReapply: true } },
    ninetail_blaze:      { name: 'Foxfire Enhanced',         desc: 'Fire trail lasts 4s, deals 30 DPS, and applies Burn (10 DPS, 2s) to enemies on it.', trigger: 'periodic', params: { trailDps: 30, trailDuration: 4, burnDps: 10, burnDuration: 2 } },
    elder_wyrm:          { name: 'Dragonfire Aura Enhanced', desc: 'Aura damage increased to 35 DPS. Extends to 3-cell range.', trigger: 'aura', params: { auraDps: 35, range: 3 } },
    phoenix_priest:      { name: 'Ember Shroud Enhanced',   desc: 'Heals linger as warm afterglow. Healed allies gain Shield 25% of heal amount for 4s and 2s Burn immunity. Applies to all heals. Second healing zone grants +15% move speed.', trigger: 'on_heal', params: { shieldPct: 0.25, shieldDuration: 4, burnImmunityDuration: 2, areaMoveSpdBonus: 0.15 } },
    eternal_phoenix:     { name: 'Eternal Flame Enhanced',   desc: 'All Fire allies gain 20% ATK and 12% lifesteal. On revival, aura doubles for 8s.', trigger: 'aura', params: { atkBonus: 0.20, lifesteal: 0.12, range: 999, revivalDuration: 8 } },

    // --- WATER T3-T5 EVOLVED ---
    stormtide_oracle:    { name: 'Scepter of Tides Enhanced', desc: 'Apply 18% slow to enemies. Heal-Slow spreads to 2 nearest enemies.', trigger: 'on_attack', params: { slowPct: 0.18, spreadTargets: 2 } },
    tsunami_warlord:     { name: 'Current Enhanced',         desc: 'Current trigger rate increases to 35% and grants +40% ATK for next attack.', trigger: 'on_attack', params: { procChance: 0.35, atkBonus: 0.40 } },
    abyssal_terror:      { name: 'Ink Cloud Enhanced',       desc: 'Ink Cloud triggers every 10s, lasts 4s, extends to 3-cell radius.', trigger: 'periodic', params: { cooldown: 10, duration: 4, range: 3 } },
    hadal_colossus:      { name: 'Pressure Depths Enhanced', desc: 'For every 10% max HP lost, gain +3% DR (up to +40% at 1 HP) and +2% lifesteal. Attacks against this unit slowed 10%. Deeper drops, harder kill and more survivability.', trigger: 'aura', params: { drPerTenPct: 0.03, drMax: 0.40, lifestealPerTenPct: 0.02, attackerSlowPct: 0.10 } },
    primordial_leviathan:{ name: 'Abyssal Depths Enhanced',  desc: 'Submerge every 7s for 2.5s. Resurfacing deals 150% ATK in 2-cell radius and applies Slow.', trigger: 'periodic', params: { cooldown: 7, submergeDuration: 2.5, emergeDamage: 1.50, range: 2 } },

    // --- EARTH T3-T5 EVOLVED ---
    iron_colossus:       { name: 'Immovable Enhanced',       desc: 'Reduces AoE damage by 18%. Ground Slam grants nearby allies 22% DR for 4s.', trigger: 'on_hit', params: { aoeDR: 0.18, allyDR: 0.22, allyDrDuration: 4 } },
    earthweaver:         { name: 'Living Earth Enhanced',    desc: 'Procs on every ability cast. Grants allies 25% max HP shields.', trigger: 'on_attack', params: { shieldPct: 0.25, procOnAbility: true } },
    world_sentinel:      { name: 'Deep Roots Enhanced',     desc: 'Prevents all slows. Regen 2% HP per second. Nature\'s Wrath heals for 25% of damage.', trigger: 'combat_start', params: { slowImmune: true, hpRegen: 0.02, healPctOfDamage: 0.25 } },
    worldroot_sentinel:  { name: 'Deep Roots Enhanced',     desc: 'While stationary 2+ seconds (instead of 3), gain +25% ATK and +2 Range (total 7). Auto-attacks have 20% chance to Root (1.5s). Every Thornstorm plants Seedlings (4s, Root enemies 1.5s on step).', trigger: 'periodic', params: { stationaryDuration: 2, atkBonus: 0.25, rangeBonus: 2, rootChance: 0.20, rootDuration: 1.5 } },
    yggdrasil:           { name: 'Roots of Life Enhanced',   desc: 'All allies heal 1.8% max HP per second passively, even if silenced or stunned.', trigger: 'aura', params: { healPct: 0.018, range: 999 } },

    // --- WIND T3-T5 EVOLVED ---
    tempest_lord:        { name: 'Updraft Enhanced',         desc: 'Stacks up to 6 times (60% ATK speed). Allies keep stacks for 7s after moving.', trigger: 'on_attack', params: { atkSpdPerStack: 0.10, maxStacks: 6, allyDuration: 7 } },
    hurricane_blade:     { name: 'Dance of Blades Enhanced', desc: '8% dodge per stack (max 8 stacks, 64% dodge). Cyclone Slash grants 45% dodge.', trigger: 'on_attack', params: { dodgePerStack: 0.08, maxStacks: 8 } },
    tempest_emperor:     { name: 'Lightning Speed Enhanced', desc: 'Guarantees crit on first attack. Applies 15% slow on hit. Thunder Cleave resets on kill.', trigger: 'combat_start', params: { guaranteedCrit: true, slowPct: 0.15, resetOnKill: true } },
    stormweft_oracle:    { name: 'Lingering Gales Enhanced', desc: 'Ability casts leave Vortices (8s). Vortices deal 30% ATK/s to enemies, grant +25% dodge to allies. Max 4 active. Stack with Wind dodge. Merged zones combine damage and buffs.', trigger: 'on_ability_cast', params: { vortexDps: 0.30, vortexAllyDodgeBonus: 0.25, maxVortices: 4, vortexDuration: 8 } },
    dimensional_dragon:  { name: 'Reality Warp Enhanced',    desc: 'Auto-attacks teleport target 2 cells and apply Slow (15% AS, 3s). 3s cooldown per target.', trigger: 'on_attack', params: { teleportDistance: 2, slowPct: 0.15, slowDuration: 3, cooldownPerTarget: 3 } },

    // --- LIGHTNING T3-T5 EVOLVED ---
    plasma_core:         { name: 'Rolling Thunder Enhanced', desc: 'Orb lasts 8s, deals 25 DPS. Enemies in orb take +18% damage. Orb bounces between enemies.', trigger: 'periodic', params: { orbDuration: 8, orbDps: 25, damageAmp: 0.18, bounces: true } },
    storm_fortress:      { name: 'Overcharge Enhanced',      desc: 'Converts excess crits into 1s stuns. Reflects 20% of crit damage converted.', trigger: 'on_hit', params: { critToStun: true, stunDuration: 1, reflectPct: 0.20 } },
    roc_of_storms:       { name: 'Aerial Superiority Enhanced', desc: '+30% ATK. First hit guarantees crit and applies Slow.', trigger: 'combat_start', params: { atkBonus: 0.30, firstAttackCrit: true, applySlow: true } },
    plasma_ravager:      { name: 'Overcharge Frenzy Enhanced', desc: 'Every crit grants +8% ATK speed (up to 7 = +56%). At max stacks, auto-attacks chain 60% damage to 1 adjacent. Afterimage explosions scale with stacks.', trigger: 'on_crit', params: { atkSpdPerStack: 0.08, maxStacks: 7, stackDuration: 4, chainDamage: 0.60, chainCount: 1 } },
    thunder_god:         { name: 'Superconductor Enhanced',  desc: '+25% crit chance to all Lightning allies. Crits chain to all enemies within 3 cells for +40% ATK.', trigger: 'aura', params: { allyCritBonus: 0.25, critChainRange: 3, critAtkBonus: 0.40, element: 'lightning' } },

    // --- FORCE T3-T5 EVOLVED ---
    champion:            { name: 'Arena Master Enhanced',    desc: 'Every 2 attacks, gain +60% ATK for next attack.', trigger: 'on_attack', params: { interval: 2, bonusDamage: 0.60 } },
    citadel:             { name: 'Unbreakable Will Enhanced', desc: 'Immune to all CC effects. Grants nearby allies 5% CC resistance.', trigger: 'combat_start', params: { ccImmune: true, allyCcResist: 0.05 } },
    war_architect:       { name: 'War Machine Enhanced',     desc: 'Ignores 25% DR. Applies 20% additional damage to targets hit by Artillery.', trigger: 'on_attack', params: { drIgnore: 0.25, artilleryDamageAmp: 0.20 } },
    warforged_champion:  { name: 'Challenge Protocol Enhanced', desc: 'Mark highest-ATK as Rival. While fighting Rival, gain +30% ATK and +15% DR. On Rival death, next highest becomes Rival and gain +10% permanent ATK (stacks). If no Rival in range, +15% move speed.', trigger: 'combat_start', params: { rivalAtkBonus: 0.30, rivalDrBonus: 0.15, permanentAtkPerKill: 0.10, moveSpdBonus: 0.15, rivalDiameter: 5 } },
    cosmic_titan:        { name: 'Colossus Enhanced',        desc: '+35% max HP. Every 4th hit stuns for 1.5s. CC immunity for first 8s of combat.', trigger: 'combat_start', params: { hpBonus: 0.35, stunInterval: 4, stunDuration: 1.5, ccImmuneDuration: 8 } }
};
