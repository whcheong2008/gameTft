# Prompt 21 — Git Repository Initialization

> **Purpose**: Set up Git properly on the current codebase. Create `.gitignore`, make the initial commit capturing the complete Phase 1 + Phase 2 state, and establish branch conventions.
>
> **Context**: A `.git` directory exists but is EMPTY (no HEAD, no config, no objects — just the folder). You need to remove it and run `git init` fresh before proceeding.

---

## Step 0: Initialize Git Properly

The existing `.git` directory is empty/broken. Fix it:

```bash
rm -rf .git
git init
```

Verify with `git status` — should show all files as untracked.

---

## Step 1: Create `.gitignore`

Create a `.gitignore` file in the project root with:

```
# OS files
.DS_Store
Thumbs.db
desktop.ini

# Editor files
*.swp
*.swo
*~
.vscode/
.idea/

# Claude internal
.claude/

# Sensitive
fibery api.txt

# Node (future-proofing)
node_modules/
```

**Notes:**
- `.claude/` contains Claude session data — not game code, should not be tracked
- `fibery api.txt` contains API credentials — must never be committed
- Everything else in the project IS game content and should be tracked

---

## Step 2: Stage Everything and Make Initial Commit

```bash
git add -A
git status
```

Verify the staged files look correct. You should see approximately:
- Root: `game-v2.html`, `game.html`, `.gitignore`, 9 design docs (`*.md`), `CONTINUITY.md`
- `js/`: 17 JavaScript files (9 V2 active + 8 V1 historical)
- `prompts/`: 23 prompt files (00 through 20, plus 11b and 19a/19b)
- `orchestrators/`: 3 orchestrator docs
- `testing/`: 1 testing strategy doc

**Should NOT appear in staged files:**
- `.claude/` directory
- `fibery api.txt`

If everything looks right, commit:

```bash
git commit -m "Initial commit: Complete Phase 1 + Phase 2 codebase

Game state: fully playable auto-battler with gacha hub mechanics.
- Phase 1 complete: combat engine rebuild (grid, damage, mana, abilities, status effects, bosses)
- Phase 2 prompts 17-20 ready: expanded roster (60 base + 60 evolved = 120 units), 6 elements, 9 archetypes
- Item system: components, recipes, forge, set items, ability items
- 14 story missions, evolution lab, 7 buildings
- 9 design docs covering combat, units, items, progression, content, missions, scope
- Testing architecture strategy documented

Tech: vanilla JS, global scope, no modules. V2 loads via script tags in game-v2.html."
```

---

## Step 3: Set Up Branch Conventions

Do NOT create any branches yet — just document the convention. Add a section to the top of `CONTINUITY.md` (right after the status line) or print it to console:

**Branch naming convention:**
- `feature/` — new functionality (e.g., `feature/new-character-kai`)
- `fix/` — bug fixes (e.g., `fix/battle-crash-on-empty-team`)
- `balance/` — balance/tuning changes (e.g., `balance/reduce-3star-pull-rate`)
- `polish/` — visual/UX improvements (e.g., `polish/summon-reveal-animation`)

**Workflow:**
1. Branch from `main` for every change
2. Test on branch
3. Merge to `main` only when verified working
4. Tag meaningful milestones (e.g., `v0.3.0-phase2-roster`)

---

## Step 4: Connect Remote and Push

```bash
git remote add origin https://github.com/whcheong2008/gameTft.git
git branch -M main
git tag v0.2.0-phase1-complete
git push -u origin main
git push origin v0.2.0-phase1-complete
```

This connects to the GitHub repo, renames the default branch to `main`, tags the initial commit, and pushes everything including the tag.

---

## Step 5: Verify

Run these checks:
1. `git log --oneline` — should show exactly 1 commit
2. `git tag` — should show `v0.2.0-phase1-complete`
3. `git status` — should be clean (nothing untracked except ignored files)
4. Verify `fibery api.txt` is NOT in the commit: `git ls-files | grep fibery` should return nothing
5. Verify `.claude/` is NOT in the commit: `git ls-files | grep claude` should return nothing
6. `git remote -v` — should show `origin` pointing to `https://github.com/whcheong2008/gameTft.git`

Report the results of all 6 checks.
