# Bug Tracker — HTML Prototype

> Log bugs during playtesting. Game-breakers get fixed now. Everything else deferred to Unity port.

## Severity Levels
- **CRITICAL**: Game crashes, softlocks, save corruption, can't progress
- **HIGH**: System not working (combat broken, gacha not rolling, heroes not applying)
- **MEDIUM**: Numbers wrong, UI broken but playable, visual glitches
- **LOW**: Polish issues, text errors, minor UI quirks → Unity

## Active Bugs (Fix Now)

| # | Severity | System | Description | Status |
|---|----------|--------|-------------|--------|
| 1 | CRITICAL | Team Builder / Heroes | Team builder crashes after hero assignment — `unitHero.def.emoji.charAt(0)` fails because HERO_DATA has no `emoji` field. Causes: can't navigate back, black squares on grid (partial render before crash). | **FIXED** — replaced with unicode ⚔ |

## Deferred to Unity

| # | Severity | System | Description |
|---|----------|--------|-------------|
| | | | (none yet) |

## Known Limitations (Not Bugs)

- No story content / cutscenes (intentionally deferred to Unity)
- No hard mode stages (design not finalized)
- No endless mode / challenge modes (deferred)
- Fragment stub in heroes.js (harmless, returns empty)
- Many hero skill node effects are placeholder `function(unit, hero) {}` — combat integration is partial. Full implementation in Unity.
- Item system may have old references to "gold" instead of "Veil Essence" in some UI strings
