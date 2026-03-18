# Prompt 25 — Archetype Synergy Rework

> **Purpose**: Rework all 9 archetype synergies to be archetype-focused (buffs apply to units WITH that archetype, not the whole team), and extend thresholds to 2/4/6/8 to account for the upcoming dual-archetype system.
>
> **This is a DESIGN-ONLY prompt.** Output a proposed rework as a markdown document. Do NOT modify any code files. Save your output to `SYNERGY-REWORK.md` in the project root.
>
> **Read before starting**: `js/units.js` (ARCHETYPES object near the top), `UNITS-DESIGN.md`, `COMBAT-DESIGN.md` (sections on synergy application).

---

## Context

### Current State
The game has 9 archetypes, each with synergy bonuses at 2-3 thresholds (2/4 or 2/4/6). Many bonuses are team-wide (e.g., Sage gives team regen, Warden gives allies tenacity). The current ARCHETYPES object in `units.js` defines all bonuses.

### Upcoming Change: Dual Archetypes
An ascension system is being added. When a unit reaches "Awakened" tier, it gains a fixed secondary archetype and counts as 1 toward that archetype's synergy. At "Transcendent" tier, the unit's PRIMARY archetype counts as 2. This means:
- A team of 9 units could realistically reach 8+ in a single archetype
- Higher thresholds (6, 8) become achievable goals, not impossible ones
- Mixed-archetype teams get more interesting with units contributing to multiple synergies

### Design Goals
1. **Archetype-focused buffs**: Synergy bonuses should primarily buff units that HAVE that archetype (primary or secondary). Avoid team-wide buffs. Exception: a small number of aura-like effects can affect nearby allies, but the main beneficiary should be the archetype units themselves.
2. **4 thresholds per archetype**: 2/4/6/8 for all 9 archetypes. This creates a smooth power curve from early-game (2) to late-game ascension builds (8).
3. **Escalating impact**: 2-threshold = noticeable. 4-threshold = strong. 6-threshold = build-defining. 8-threshold = game-warping (hard to reach, huge payoff).
4. **Archetype identity**: Each archetype should have a clear fantasy. The synergy should reinforce what that archetype IS, not just give generic stats.
5. **No element overlap**: Synergies should not duplicate what element synergies do (element damage, element resist). Keep archetypes about ROLE, elements about POWER TYPE.

---

## The 9 Archetypes and Their Identities

Use these as the starting point. The identity should drive the synergy design:

| Archetype | Identity | Unit Types | Fantasy |
|-----------|----------|------------|---------|
| Guardian | Damage absorption | Tanks, some mages | "We don't die" — shields, HP, damage reduction |
| Warden | Crowd control | Tanks, warriors | "You can't move" — CC duration, CC immunity, lockdown |
| Vanguard | Frontline aggression | Warriors, tanks | "First in, hit hard" — charge bonuses, front-row power |
| Duelist | Sustained 1v1 | Warriors, assassins | "I win every fight" — double-strike, lifesteal, can't miss |
| Predator | Burst assassination | Assassins, warriors | "Kill fast, move on" — execute damage, speed, resets |
| Ranger | Ranged precision | Archers, some mages | "Death from distance" — range, pierce, focused fire |
| Sorcerer | Ability power | Mages | "Spells win wars" — ability damage, mana, cooldowns |
| Mystic | Elemental mastery | Mages, assassins, healers | "Elements amplified" — element damage, element effects |
| Sage | Healing/sustain | Healers | "No one falls" — healing power, regen, overheal |

---

## Analysis Tasks

Before designing new synergies, analyze:

1. **Current synergy bonuses**: Read the ARCHETYPES object in `units.js`. List each archetype's current bonuses and note which are team-wide vs archetype-specific.

2. **Unit distribution**: Count how many units have each archetype as primary (already done: Guardian 8, Duelist 7, Predator 7, Sage 7, Sorcerer 7, Ranger 6, Vanguard 6, Mystic 6, Warden 6). Note that secondary archetypes will add roughly 5-8 more per archetype.

3. **Reachability analysis**: With a 9-unit team, what's the realistic max count per archetype?
   - Without ascension: max ~3-4 of one archetype (just primaries)
   - With Awakened (secondary): a unit counts toward 2 archetypes, so 6-8 becomes reachable with investment
   - With Transcendent (primary counts as 2): 8 becomes achievable for dedicated builds

4. **Combat impact**: Consider how bonuses interact with the combat engine (damage pipeline, mana system, status effects, movement). Reference COMBAT-DESIGN.md for mechanics.

---

## Output Format

Save to `SYNERGY-REWORK.md` with this structure:

```markdown
# Archetype Synergy Rework Proposal

## Design Philosophy
[Brief summary of your approach]

## Synergy Definitions

### Guardian (2/4/6/8)
- **2**: [bonus — should affect Guardian units]
- **4**: [bonus]
- **6**: [bonus]
- **8**: [bonus — game-warping capstone]

[Repeat for all 9 archetypes]

## Comparison Table
[Old vs new for each archetype at each threshold]

## Reachability Notes
[How easy/hard is each threshold to reach at different game phases]

## Balance Considerations
[Any concerns, edge cases, or interactions to watch for]
```

---

## Guidelines

- Keep the bonuses as JavaScript-compatible data. Use the same property naming style as the current ARCHETYPES object (camelCase, numeric values).
- The 8-threshold bonus should feel like a reward for heavy investment, not a requirement. A player who reaches 6 should feel powerful; 8 is for min-maxers.
- Consider that some archetypes are naturally more common (Guardian 8 primary, Duelist 7) vs rare (Ranger 6, Mystic 6, Warden 6). The rarer archetypes should have slightly more impactful per-threshold bonuses to compensate.
- Think about team composition trade-offs. Going deep (8 Guardian) means sacrificing archetype diversity. The 8-threshold should reward that commitment without making it the only viable strategy.
- For Sage specifically: healing bonuses should scale the Sage units' healing output, not give the whole team passive regen. Overheal mechanics are fine as a capstone.
