# Hero System — Design Idea (Not Yet Implemented)

> Captured during Session 10 to preserve context. This is a brainstorm, not a finalized design.

## Core Concept
Heroes are story characters that can be **equipped onto units** as an overlay. Think soul transfer / possession.

## Key Properties
- Heroes are separate entities from units
- Each hero can be equipped to ONE unit at a time (transferable)
- A unit can have at most ONE hero equipped
- Heroes have their own XP and level progression
- Heroes unlock a **skill tree** (limited number of heroes = limited number of skill trees to design)
- Heroes enable the unit to **equip items** (units without heroes cannot equip items)

## Progression Layers
1. **Base unit**: Stats, abilities, element, archetype (current system)
2. **Unit XP/Level**: Per-unit leveling from combat (prompt 26)
3. **Ascension**: Awakened/Exalted/Transcendent (prompt 26)
4. **Hero overlay**: Equipped hero adds skill tree bonuses, enables items
5. **Items**: Only equippable when a hero is attached

## Why This Works
- **Transferable investment**: Hero XP and skill tree progress moves with the hero, not stuck on a unit. Swap heroes between units freely.
- **Natural gating**: Early game = raw units. Mid game = acquire heroes, start equipping. Late game = skilled-up heroes with full item loadouts.
- **Limited design scope**: Few heroes = few skill trees to design (unlike per-unit talent trees for 60+ units).
- **Story integration**: Heroes ARE the story characters. Lore system ties directly into gameplay.
- **Strategic depth**: Which hero goes on which unit? A tanky hero on an assassin? A DPS hero on a healer?

## Open Questions
- How many heroes? (Tied to story — probably 6-10?)
- How are heroes acquired? (Story progression? Region rewards?)
- What does a hero skill tree look like? (Probably 2-3 branches, ~10-15 nodes each)
- Does the hero modify the unit's abilities, or add entirely new effects?
- Visual indicator when a hero is equipped to a unit?
- Can the same hero be equipped to different units across different team loadouts, or is it globally locked?

## Impact on Existing Systems
- **Item system**: Currently any unit can equip items. This would CHANGE that — only hero-equipped units can use items. Major rework.
- **Balance**: Heroes add a multiplier layer. Need to ensure non-hero units are still viable for early/mid game.
- **UI**: Need hero management screen, hero-unit assignment, skill tree viewer.
- **Save data**: New hero objects with XP, level, skill allocations, assigned unit.
