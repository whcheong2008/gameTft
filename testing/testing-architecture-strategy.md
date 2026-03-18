# Testing Architecture Strategy — Thinking Document

## Purpose

This document is a strategic guide for building out the testing infrastructure for our game (auto-battler combat with gacha hub mechanics). It's written as a thinking framework, not a rigid spec — Cowork should adapt this based on its deeper context of the game's current state, systems, and codebase.

The goal: make sure that as we polish, fix bugs, tune balance, and eventually port to Unity, we never break what's already working.

---

## Timing: When to Introduce What

Testing isn't a single phase — it layers in across the project lifecycle.

### Phase 0: Right Now (Pre-Port, HTML Version)

**Git setup is the immediate priority.** Before any more development happens:

- Initialize a Git repo on the current HTML codebase
- Establish `main` as the always-working branch
- Set up a branching convention: `feature/`, `fix/`, `polish/`, `balance/`
- Every change from this point forward goes through a branch → test → merge workflow
- Document the current state of the game as the "reference build" — what works, what's known-broken, what's placeholder. This becomes the baseline we validate the Unity port against

**Extract and document game logic separately.** Before porting, we should clearly isolate the pure logic layer from the presentation layer:

- Battle resolution logic (targeting, damage calc, turn order, skill effects)
- Gacha pull mechanics (rates, pity system, banner logic)
- Progression systems (leveling, upgrade costs, resource economy)
- Roster/inventory management

This separation serves two purposes: it makes the port cleaner (we know exactly what logic to translate to C#), and it tells us exactly what needs unit tests. If a system is pure input→output logic with no UI dependency, it's testable.

**Write a "ground truth" document.** Capture the intended behavior of every core system in plain language. Example: "A 3-star character has a 5.5% pull rate. Pity triggers at 90 pulls. Damage formula is ATK * skill_multiplier * (1 - DEF/(DEF + 100))." This becomes the source of truth that both unit tests and balance simulations validate against. Cowork likely already has much of this — consolidate it.

### Phase 1: During the Port

**Port logic first, presentation second.** The C# game logic should be functional and testable before any Unity scenes, animations, or UI exist. This means:

- Translate the core systems to C# classes that can run independently of MonoBehaviour/Unity lifecycle
- Write unit tests against the ground truth document as each system is ported
- Run the tests. If they match the HTML version's behavior, the port is correct

**Maintain the HTML version as a running reference.** Don't delete or stop maintaining it until the Unity version is validated. When something looks wrong in Unity, you need to be able to check: "does the HTML version do the same thing?" If yes, it's a design issue. If no, it's a port bug.

**Integration validation checkpoints.** At defined milestones during the port, do a side-by-side comparison:

- Run the same battle scenario in both versions — same characters, same levels, same seed if possible. Do they produce the same outcome?
- Pull 10,000 times in both versions. Compare rarity distributions
- Run a full player session flow in both. Same progression, same costs, same rewards?

### Phase 2: Post-Port, Polish Phase

This is where the full testing architecture earns its keep. See the detailed breakdown below.

---

## Testing Architecture: The Layers

Think of this as a pyramid. The base runs constantly and catches most issues. Each layer above runs less frequently but catches different kinds of problems.

### Layer 1: Unit Tests (Automated, Run on Every Change)

**What they cover:** Pure logic with deterministic outputs.

Systems to test:

- **Damage calculation** — Given attacker stats, defender stats, skill used, element matchups → expected damage value. Test edge cases: zero defense, massive overkill, elemental immunity, crit vs non-crit
- **Battle resolution** — Given a team composition on each side → deterministic outcome (if we seed the RNG). Test: correct targeting priority, correct turn order, correct skill activation conditions, correct win/loss determination
- **Gacha system** — Given N pulls → statistical distribution within expected tolerance. Test: pity counter increments correctly, pity resets after trigger, banner rate-up works, guaranteed mechanics fire at the right threshold
- **Progression/economy** — Given a character at level X with Y resources → correct post-upgrade state. Test: costs deducted correctly, stats applied correctly, insufficient resources blocked correctly, max level cap enforced
- **Roster management** — Add/remove characters, duplicate handling, lock/favorite mechanics

**How to write them:** Use Unity Test Framework (NUnit). Each system should have its own test file. Tests should be independent — no test should depend on another test's state. Use `[SetUp]` to initialize clean state before each test.

**Key principle:** If Cowork or Code changes any core system, the corresponding unit tests must be updated in the same branch. Tests and logic travel together.

### Layer 2: Balance Simulation (Automated, Run on Demand)

**What it covers:** Is the game economy healthy? Is progression paced correctly? Are any characters dominant?

This is different from unit tests — it's not checking correctness, it's checking design intent.

**Simulations to build:**

- **Economy simulator** — Model a player playing for 30/60/90 days at different engagement levels (casual: 15 min/day, moderate: 1 hr/day, hardcore: 3+ hr/day) and spending levels (free, light spender, whale). Track: resource accumulation, roster completeness, progression milestones hit. Output: "A free casual player can reach X by day 30, Y by day 60." If these numbers don't match design intent, balance needs tuning
- **Battle balance simulator** — Run every character against every other character (or team comp vs team comp) across 1,000 battles each. Output: win rates. If any character has a >70% win rate against the field, they're probably overtuned. If any character has <30%, they might need a buff
- **Gacha fairness simulator** — Simulate 100,000 players each pulling until they get their target character. Output: distribution of pulls required, cost distribution, percentage of players who hit pity. This validates that the pity system and rates produce an acceptable player experience

**When to run:** After any balance data change (stat adjustments, rate changes, cost changes, new character additions). Not on every commit — these are slow and exploratory.

**Key principle:** Keep all balance numbers in external data files (ScriptableObjects in Unity, or JSON). Never hardcode balance values in logic. This way, tuning balance means changing data, not code — which is much safer.

### Layer 3: Integration / Smoke Tests (Semi-Automated + Manual)

**What it covers:** Do the systems work together? Does the full player loop function?

**The critical path smoke test (manual, 5-10 minutes):**

Run this after every merge to main:

1. Launch game → hub loads correctly
2. Navigate to gacha screen → pull a character → character appears in roster
3. Navigate to roster → select character → upgrade them → stats change correctly
4. Navigate to battle select → choose a stage → enter battle
5. Battle plays out → auto-battler resolves → result screen shows
6. Rewards granted → return to hub → rewards reflected in inventory
7. Pull again → pity counter reflects previous pulls

If any step fails, the merge broke something. Revert and investigate.

**Automated integration tests (where possible):**

Some of this loop can be scripted in Unity's Play Mode tests:

- Instantiate a battle scene programmatically → run to completion → assert victory/defeat and reward values
- Simulate a pull sequence → assert roster state
- Simulate an upgrade → assert stat changes and resource deduction

These won't catch visual bugs but they catch data flow bugs.

### Layer 4: Visual / UX / Feel Testing (Manual Only)

**What it covers:** Does it look right? Does it feel good?

This cannot be automated — it requires human judgment. But it can be systematic.

**Visual checklist (run periodically, especially after animation/UI work):**

- All character sprites render at correct size and position in battle
- Z-ordering is correct (no units rendering behind backgrounds, UI on top of everything)
- Animations play fully without cutting off
- Particle effects appear and despawn correctly
- UI scales correctly on different aspect ratios (test at 16:9, 18:9, 20:9 at minimum)
- No placeholder or missing assets visible
- Text fits within UI containers (no overflow or truncation)
- Transitions between screens are smooth, no flicker or pop-in

**Feel checklist (subjective, but track it):**

- Battle pacing: does auto-battle feel engaging or tedious to watch?
- Hit feedback: do attacks feel impactful? (screen shake, flash, SFX timing)
- Gacha pull experience: does the reveal feel exciting?
- UI responsiveness: do buttons respond instantly? Any perceptible lag?
- Audio: is BGM at appropriate volume relative to SFX? Do sounds trigger at the right moment?

**How to track:** Keep a running list of feel issues with severity (blocks-ship / should-fix / nice-to-have). Revisit weekly.

---

## The "Don't Break Things" Discipline

### One Concern Per Branch

Every change — bug fix, balance tweak, new animation, refactor — gets its own branch. This seems slow but prevents the nightmare scenario of five changes tangling together and one of them breaking something.

Branch naming:
- `fix/battle-crash-on-empty-team`
- `balance/reduce-3star-pull-rate`
- `polish/summon-reveal-animation`
- `feature/new-character-kai`

### Merge Ritual

Before merging any branch to main:

1. Run all unit tests → must pass
2. Run the smoke test → must pass
3. If it's a balance change → run relevant simulation, verify results match intent
4. If it's a visual change → run visual checklist on affected areas
5. Merge
6. Tag the merge if it's a meaningful milestone (e.g., `v0.3.0-battle-polish`)

### When Things Break Anyway

They will. The response protocol:

1. Don't panic. Don't start hacking fixes on main
2. Identify which merge introduced the issue (Git log / bisect)
3. Revert the merge on main if it's severe (game is unplayable)
4. Fix on the original branch
5. Re-test, re-merge

Claude Code can handle the Git forensics (bisect, log, diff) to quickly identify which change broke things.

---

## Data-Driven Architecture Reminder

This is worth emphasizing because it's the single biggest thing that makes polish safe:

**Separate data from logic.**

All of these should live in external, editable data files — not in code:

- Character stat tables (base stats, growth rates per level)
- Skill definitions (damage multipliers, effect types, targeting rules)
- Gacha rate tables (per-rarity rates, pity thresholds, banner configurations)
- Economy tables (stamina costs, upgrade material requirements, reward tables per stage)
- Difficulty scaling (enemy stat scaling per stage, team power recommendations)
- UI text / localization strings

When these live in data files:
- Tuning balance = editing a JSON/ScriptableObject, not touching code
- Code changes only happen for new mechanics or bug fixes
- The risk surface of any balance change is tiny
- You can A/B test different balance configurations by swapping files

Cowork should enforce this pattern during the port. If Code writes a damage formula with a hardcoded multiplier, flag it — that multiplier belongs in data.

---

## Priority Order

If I had to sequence this work:

1. **Git setup — now, today** (on the HTML version)
2. **Ground truth document — before the port** (capture all intended behavior)
3. **Logic/data separation — during pre-port refactor or as part of the port**
4. **Unit tests for core systems — built alongside the C# port, not after**
5. **Smoke test checklist — as soon as the Unity version is playable end-to-end**
6. **Balance simulators — once core systems are ported and unit-tested**
7. **Visual/feel checklists — once animations and UI are in place**

The earlier layers protect the later work. Unit tests protect you during balance tuning. Balance simulations protect you from shipping a broken economy. The smoke test catches anything the automated tests miss.

---

## Final Thought

The testing architecture isn't a separate project — it's part of how we build. Every feature branch includes its tests. Every balance change includes its simulation run. Every merge includes its smoke test. If testing feels like extra work happening "after" development, we're doing it wrong. It should be woven into the workflow so tightly that skipping it feels wrong.

Cowork: adapt all of this to the actual game systems and current codebase state. You know the specifics better than this document can. The principles are the guide — the implementation details are yours to shape.
