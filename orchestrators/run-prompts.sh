#!/bin/bash
# =============================================================================
# Prompt Orchestrator — Runs Unity prompts sequentially via Claude Code CLI
# =============================================================================
# Usage:
#   ./orchestrators/run-prompts.sh 52          # Run just prompt 52
#   ./orchestrators/run-prompts.sh 52 55       # Run prompts 52 through 55
#   ./orchestrators/run-prompts.sh             # Run all pending prompts
#
# What it does for each prompt:
#   1. Finds the prompt file in prompts/
#   2. Generates the launch prompt (with read-first docs, branch, commit msg)
#   3. Runs it via `claude -p` in non-interactive mode
#   4. Verifies the commit exists
#   5. Updates CONTINUITY.md
#   6. Commits + pushes continuity update
#   7. Moves to next prompt
#
# Prerequisites:
#   - claude CLI installed and authenticated
#   - Git credentials in keys/github.txt
#   - Run from the Game TFT root directory
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Color output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_step()  { echo -e "\n${YELLOW}═══════════════════════════════════════${NC}"; echo -e "${YELLOW} $1${NC}"; echo -e "${YELLOW}═══════════════════════════════════════${NC}\n"; }

# ── Prompt definitions ──────────────────────────────────────────────────────
# Each entry: PROMPT_NUM|PROMPT_FILE|BRANCH|COMMIT_MSG|READ_FIRST_DOCS
# READ_FIRST_DOCS is semicolon-separated

declare -A PROMPTS
PROMPTS[47]="47-unity-ui-foundation.md|feature/unity-ui-foundation|Prompt 47: UI foundation — SceneRouter, EventBus, PlaceholderFactory, TopBar, Toast, ConfirmDialog, UnitCard prefab|UNITY-ARCHITECTURE.md;js/ui-v2.js lines 1-170;js/hub.js"
PROMPTS[48]="48-unity-hub-scene.md|feature/unity-hub-scene|Prompt 48: Hub scene — building grid, upgrade flow, building panels, bottom nav, placeholder graphics|UNITY-ARCHITECTURE.md;js/hub.js;js/ui-v2.js lines 71-690;GROUND-TRUTH.md section 11"
PROMPTS[49]="49-unity-gacha-roster.md|feature/unity-gacha-roster|Prompt 49: Gacha + Roster — rolling UI, rate display, pity, roster grid, unit detail, star-up, sell, evolve|UNITY-ARCHITECTURE.md;js/ui-v2.js lines 867-1630;js/gacha.js;GROUND-TRUTH.md section 7 and 8"
PROMPTS[50]="50-unity-team-builder.md|feature/unity-team-builder|Prompt 50: Team Builder — 4x2 grid, unit placement, equipment panel, synergy preview, hero assignment|UNITY-ARCHITECTURE.md;js/ui-v2.js lines 1631-2030;js/teams.js;GROUND-TRUTH.md section 3 and 2;js/ui-v2.js lines 1149-1240"
PROMPTS[51]="51-unity-mission-select.md|feature/unity-mission-select|Prompt 51: Mission Select — region map (8 regions), stage list (74 stages), lock system, star progress, boss indicators|UNITY-ARCHITECTURE.md;js/ui-v2.js lines 2030-2600;GROUND-TRUTH.md section 9;STORY-STAGES-V2.md;js/missions.js"
PROMPTS[52]="52-unity-combat-scene.md|feature/unity-combat-scene|Prompt 52: Combat scene — grid renderer, unit animations, damage numbers, battle playback, speed controls, wave transitions, results screen|UNITY-ARCHITECTURE.md;js/ui-v2.js lines 2602-3500;GROUND-TRUTH.md section 1;js/combat-v2.js;COMBAT-DESIGN.md"

# ── Add new prompts here as they're written ─────────────────────────────────
# PROMPTS[53]="53-whatever.md|feature/whatever|Prompt 53: ...|doc1;doc2"

# ── Helper functions ────────────────────────────────────────────────────────

get_token() {
    cat "$REPO_ROOT/keys/github.txt" | tr -d '[:space:]'
}

git_push() {
    local branch="$1"
    local token
    token=$(get_token)
    git remote set-url origin "https://whcheong2008:${token}@github.com/whcheong2008/gameTft.git"
    git push --set-upstream origin "$branch" 2>&1 || git push 2>&1
    git remote set-url origin "https://github.com/whcheong2008/gameTft.git" 2>/dev/null || true
}

clean_git_locks() {
    rm -f "$REPO_ROOT/.git/index.lock" "$REPO_ROOT/.git/HEAD.lock" "$REPO_ROOT/.git/config.lock" 2>/dev/null || true
}

build_launch_prompt() {
    local prompt_file="$1"
    local branch="$2"
    local commit_msg="$3"
    local read_first="$4"

    # Build the read-first docs list
    local docs_list=""
    local i=1
    IFS=';' read -ra DOCS <<< "$read_first"
    for doc in "${DOCS[@]}"; do
        docs_list="${docs_list}${i}. \`${doc}\`
"
        ((i++))
    done

    cat <<PROMPT
Read the file \`prompts/${prompt_file}\` in full. This is your implementation prompt.

Before coding, also read these reference docs (in order):
${docs_list}
Then implement everything the prompt specifies:
- Branch: \`${branch}\`
- Create branch from main, implement, run tests, commit, push.
- Use \`keys/github.txt\` for the GitHub PAT when pushing (trim whitespace). Format: \`https://whcheong2008:<TOKEN>@github.com/whcheong2008/gameTft.git\`
- Commit message format: "${commit_msg}"

When done, report: files created, tests passed/failed, any issues.
PROMPT
}

verify_prompt_done() {
    local prompt_num="$1"
    local commit_msg_prefix="Prompt ${prompt_num}:"

    # Check if a commit with this prefix exists on any branch
    if git log --all --oneline | grep -qi "prompt ${prompt_num}:"; then
        local commit_hash
        commit_hash=$(git log --all --oneline | grep -i "prompt ${prompt_num}:" | head -1 | awk '{print $1}')
        local file_count
        file_count=$(git show --stat "$commit_hash" | grep -c "\.cs " || echo "0")
        log_info "Prompt ${prompt_num} commit found: ${commit_hash} (${file_count} C# files)"
        return 0
    else
        log_error "No commit found for Prompt ${prompt_num}"
        return 1
    fi
}

update_continuity() {
    local prompt_num="$1"
    local next_num="$2"

    # Mark current as Done in CONTINUITY.md
    if grep -q "| ${prompt_num} |" CONTINUITY.md 2>/dev/null; then
        sed -i "s/| ${prompt_num} |.*PENDING.*/| ${prompt_num} | ... | Done |/" CONTINUITY.md 2>/dev/null || true
    fi

    # Mark next as NEXT if provided
    if [ -n "$next_num" ] && grep -q "| ${next_num} |" CONTINUITY.md 2>/dev/null; then
        sed -i "s/| ${next_num} |.*PENDING.*/| ${next_num} | ... | PENDING ← **NEXT** |/" CONTINUITY.md 2>/dev/null || true
    fi
}

# ── Main execution ──────────────────────────────────────────────────────────

# Determine prompt range
START=${1:-47}
END=${2:-$START}

# If only one arg and it looks like a "run all from here" scenario
if [ $# -le 1 ]; then
    # Find the highest defined prompt
    max_prompt=0
    for key in "${!PROMPTS[@]}"; do
        [ "$key" -gt "$max_prompt" ] && max_prompt="$key"
    done
    if [ $# -eq 0 ]; then
        START=47
    fi
    END=$max_prompt
fi

log_step "Orchestrator starting: Prompts ${START} → ${END}"
echo "Working directory: $REPO_ROOT"
echo ""

FAILED=()
SUCCEEDED=()

for ((num=START; num<=END; num++)); do
    # Skip if no definition
    if [ -z "${PROMPTS[$num]+x}" ]; then
        log_warn "No definition for Prompt ${num}, skipping"
        continue
    fi

    # Check if already done
    if git log --all --oneline | grep -qi "prompt ${num}:"; then
        log_info "Prompt ${num} already completed, skipping"
        SUCCEEDED+=("$num")
        continue
    fi

    # Parse prompt definition
    IFS='|' read -r PFILE BRANCH COMMIT_MSG READ_DOCS <<< "${PROMPTS[$num]}"

    log_step "Running Prompt ${num}: ${PFILE}"

    # Build launch prompt
    LAUNCH=$(build_launch_prompt "$PFILE" "$BRANCH" "$COMMIT_MSG" "$READ_DOCS")
    echo "$LAUNCH"
    echo ""

    # Clean any stale git locks
    clean_git_locks

    # Run via Claude Code CLI
    log_info "Launching Claude Code (non-interactive)..."
    if claude -p "$LAUNCH" \
        --allowedTools "Bash Edit Write Read Glob Grep" \
        --dangerously-skip-permissions \
        --model opus \
        --max-budget-usd 5 \
        2>&1 | tee "/tmp/prompt-${num}-output.log"; then
        log_info "Claude Code session completed"
    else
        log_error "Claude Code session failed for Prompt ${num}"
        FAILED+=("$num")
        continue
    fi

    # Verify
    if verify_prompt_done "$num"; then
        SUCCEEDED+=("$num")

        # Determine next prompt
        next=$((num + 1))
        [ -z "${PROMPTS[$next]+x}" ] && next=""

        # Update continuity (best effort)
        # The Cowork session will do the proper update
        log_info "Prompt ${num} verified ✓"
    else
        log_error "Prompt ${num} verification failed"
        FAILED+=("$num")
    fi

    echo ""
done

# ── Summary ─────────────────────────────────────────────────────────────────

log_step "Orchestrator Complete"
echo "Succeeded: ${SUCCEEDED[*]:-none}"
echo "Failed:    ${FAILED[*]:-none}"

if [ ${#FAILED[@]} -gt 0 ]; then
    echo ""
    log_warn "Check logs at /tmp/prompt-*-output.log for failed prompts"
    exit 1
fi
