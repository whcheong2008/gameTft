# Prompt 28 — Item System Redesign Proposal

> **Purpose**: Redesign the item system from component-based crafting to RPG-style equipment slots. This is a **DESIGN-ONLY** prompt. Output a proposed redesign as a markdown document. Do NOT modify any code files. Save your output to `ITEMS-REDESIGN.md` in the project root.
>
> **Read before starting**: `js/items.js` (current item system), `ITEMS-DESIGN.md` (current item design doc), `HERO-SYSTEM-IDEA.md` (upcoming hero system that will gate item equipping).

---

## Context

### Current Item System
The game has a component-based item system:
- 12 base components that combine in pairs to form ~20+ combined items
- Rarity tiers (Standard, Uncommon, Rare, Epic)
- 4 item sets (element-themed) with set bonuses
- 7 ability items with combat effects
- 6 mythic items
- Enhancement system (+0 to +10)
- Gem socket system (9 types × 4 rarities)
- Item affinity system (matching by type/archetype/element)
- Items drop from missions and can be crafted at the Forge

### Why Rework
The component-combination system is more suited to auto-chess (Teamfight Tactics style) where items are disposable. For a 30-40 hour single-player RPG experience, we want traditional equipment that players invest in and upgrade over time.

### Hero System (Upcoming)
A hero system is planned where story characters (heroes) are equipped onto units. **Only units with an equipped hero can use items.** This means items become a mid-to-late game system, not available from the start. The hero system will have ~6-10 heroes with their own skill trees.

---

## Design Requirements

### Equipment Slots
Design 7-9 equipment slots. Suggested:
- Weapon (determines attack style)
- Helm (defensive)
- Chest / Body Armor (defensive)
- Gloves / Gauntlets (offensive)
- Boots (speed/utility)
- Accessory 1 (ring/amulet — flexible)
- Accessory 2 (ring/amulet — flexible)

Optionally add 1-2 more if it creates interesting choices:
- Shield / Off-hand (tanks/supports only? or universal?)
- Cape / Cloak (utility/dodge?)

### Equipment Tiers
Design a tier system that maps to game progression:
- Common (white) — early regions
- Uncommon (green) — regions 2-3
- Rare (blue) — regions 4-5
- Epic (purple) — regions 6-7
- Legendary (orange) — region 8 / endgame

### Equipment Properties
Each piece of equipment should have:
- Base stats (HP, ATK, ATK Speed, DEF/DR, etc. — slot-appropriate)
- Possibly a passive effect or proc at higher tiers
- Enhancement level (+0 to +10, carry over from current system)
- Gem socket(s) at higher tiers (carry over from current system)

### Equipment Acquisition
- **Mission drops**: Equipment drops from missions, tier scaled to region difficulty
- **Forge crafting**: Use materials to craft specific equipment (replaces component combining)
- **Upgrade path**: Lower tier equipment can be upgraded to next tier using materials (not replaced/discarded)

### What to Keep from Current System
- Enhancement system (+0 to +10) — works well, keep it
- Gem socket system — works well, keep it
- Forge building as the crafting hub — keep it
- Set bonuses — rethink for equipment sets (e.g., "Inferno Set" = fire-themed weapon + helm + chest = set bonus)
- Mythic items — keep as the top-tier legendary equipment

### What to Remove
- Component combining (the A+B=C recipe system)
- Component-based items entirely
- Item bench as a flat list (replace with per-unit equipment screen)

---

## Analysis Tasks

1. **Audit current items.js**: Count all item types, understand the data model, note what's used in combat
2. **Design equipment for each slot**: Stats, tiers, how many items per slot per tier
3. **Design 3-4 equipment sets**: Each set = 3-4 pieces across different slots. Set bonus at 2/3/4 piece thresholds.
4. **Design the upgrade path**: How does a Common weapon become an Uncommon weapon? Materials needed?
5. **Design the drop system**: What drops from which regions? How does the player target specific slots?
6. **Consider hero interaction**: Since only hero-equipped units can use items, and there are ~6-10 heroes, the total number of fully-equipped units is limited. This affects how many items the player needs.
7. **Mythic equipment**: How do the 6 existing mythics translate to the new system? Are they slot-specific?

---

## Output Format

Save to `ITEMS-REDESIGN.md` with:
- Equipment slot definitions
- Full item list per slot per tier (name, stats, effects)
- Set definitions
- Upgrade path and material requirements
- Drop table by region
- Forge recipes
- Migration notes (what changes from current system)
- Impact on existing game systems (combat, save data, UI)

Keep the total item count manageable — we want depth over breadth. ~5-8 items per slot per tier is plenty.
