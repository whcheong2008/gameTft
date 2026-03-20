# =============================================================================
# Prompt Orchestrator — Runs Unity prompts sequentially via Claude Code CLI
# =============================================================================
# Usage (PowerShell):
#   .\orchestrators\run-prompts.ps1 52          # Run just prompt 52
#   .\orchestrators\run-prompts.ps1 52 55       # Run prompts 52 through 55
#   .\orchestrators\run-prompts.ps1             # Run all defined prompts (skips completed)
#
# What it does for each prompt:
#   1. Finds the prompt file in prompts/
#   2. Generates the launch prompt (with read-first docs, branch, commit msg)
#   3. Runs it via `claude -p` in non-interactive mode
#   4. Verifies the commit exists
#   5. Logs output to orchestrators/logs/
#   6. Reports summary at the end
#
# Prerequisites:
#   - claude CLI installed and on PATH
#   - Git credentials in keys/github.txt
#   - Run from the Game TFT root directory
# =============================================================================

param(
    [int]$Start = 0,
    [int]$End = 0
)

$ErrorActionPreference = "Continue"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RepoRoot

# Create logs directory
$LogDir = Join-Path $RepoRoot "orchestrators\logs"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

# ── Prompt definitions ──────────────────────────────────────────────────────
# Format: @{ File; Branch; CommitMsg; ReadFirstDocs (semicolon-separated) }

$Prompts = @{
    47 = @{
        File = "47-unity-ui-foundation.md"
        Branch = "feature/unity-ui-foundation"
        CommitMsg = "Prompt 47: UI foundation — SceneRouter, EventBus, PlaceholderFactory, TopBar, Toast, ConfirmDialog, UnitCard prefab"
        Docs = "UNITY-ARCHITECTURE.md;js/ui-v2.js lines 1-170;js/hub.js"
    }
    48 = @{
        File = "48-unity-hub-scene.md"
        Branch = "feature/unity-hub-scene"
        CommitMsg = "Prompt 48: Hub scene — building grid, upgrade flow, building panels, bottom nav, placeholder graphics"
        Docs = "UNITY-ARCHITECTURE.md;js/hub.js;js/ui-v2.js lines 71-690;GROUND-TRUTH.md section 11"
    }
    49 = @{
        File = "49-unity-gacha-roster.md"
        Branch = "feature/unity-gacha-roster"
        CommitMsg = "Prompt 49: Gacha + Roster — rolling UI, rate display, pity, roster grid, unit detail, star-up, sell, evolve"
        Docs = "UNITY-ARCHITECTURE.md;js/ui-v2.js lines 867-1630;js/gacha.js;GROUND-TRUTH.md section 7 and 8"
    }
    50 = @{
        File = "50-unity-team-builder.md"
        Branch = "feature/unity-team-builder"
        CommitMsg = "Prompt 50: Team Builder — 4x2 grid, unit placement, equipment panel, synergy preview, hero assignment"
        Docs = "UNITY-ARCHITECTURE.md;js/ui-v2.js lines 1631-2030;js/teams.js;GROUND-TRUTH.md section 3 and 2;js/ui-v2.js lines 1149-1240"
    }
    51 = @{
        File = "51-unity-mission-select.md"
        Branch = "feature/unity-mission-select"
        CommitMsg = "Prompt 51: Mission Select — region map (8 regions), stage list (74 stages), lock system, star progress, boss indicators"
        Docs = "UNITY-ARCHITECTURE.md;js/ui-v2.js lines 2030-2600;GROUND-TRUTH.md section 9;STORY-STAGES-V2.md;js/missions.js"
    }
    52 = @{
        File = "52-unity-combat-scene.md"
        Branch = "feature/unity-combat-scene"
        CommitMsg = "Prompt 52: Combat scene — grid renderer, unit animations, damage numbers, battle playback, speed controls, wave transitions, results screen"
        Docs = "UNITY-ARCHITECTURE.md;js/ui-v2.js lines 2602-3500;GROUND-TRUTH.md section 1;js/combat-v2.js;COMBAT-DESIGN.md"
    }
    # ── Add new prompts here ──
    # 53 = @{
    #     File = "53-whatever.md"
    #     Branch = "feature/whatever"
    #     CommitMsg = "Prompt 53: ..."
    #     Docs = "doc1;doc2"
    # }
}

# ── Helper functions ────────────────────────────────────────────────────────

function Write-Step($msg) {
    Write-Host ""
    Write-Host "=======================================" -ForegroundColor Yellow
    Write-Host " $msg" -ForegroundColor Yellow
    Write-Host "=======================================" -ForegroundColor Yellow
    Write-Host ""
}

function Write-OK($msg)   { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[!]  $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "[X]  $msg" -ForegroundColor Red }

function Get-GitToken {
    $tokenPath = Join-Path $RepoRoot "keys\github.txt"
    return (Get-Content $tokenPath -Raw).Trim()
}

function Push-WithToken($branch) {
    $token = Get-GitToken
    git remote set-url origin "https://whcheong2008:${token}@github.com/whcheong2008/gameTft.git" 2>$null
    git push --set-upstream origin $branch 2>&1
    git remote set-url origin "https://github.com/whcheong2008/gameTft.git" 2>$null
}

function Clean-GitLocks {
    @("index.lock", "HEAD.lock", "config.lock") | ForEach-Object {
        $lockPath = Join-Path $RepoRoot ".git\$_"
        if (Test-Path $lockPath) { Remove-Item $lockPath -Force -ErrorAction SilentlyContinue }
    }
}

function Test-PromptDone($num) {
    $result = git log --all --oneline 2>$null | Select-String -Pattern "(?i)prompt ${num}:"
    return ($null -ne $result)
}

function Build-LaunchPrompt($promptDef) {
    $docsList = ""
    $i = 1
    foreach ($doc in ($promptDef.Docs -split ";")) {
        $docsList += "${i}. ``$doc```n"
        $i++
    }

    return @"
Read the file ``prompts/$($promptDef.File)`` in full. This is your implementation prompt.

Before coding, also read these reference docs (in order):
$docsList
Then implement everything the prompt specifies:
- Branch: ``$($promptDef.Branch)``
- Create branch from main, implement, run tests, commit, push.
- Use ``keys/github.txt`` for the GitHub PAT when pushing (trim whitespace). Format: ``https://whcheong2008:<TOKEN>@github.com/whcheong2008/gameTft.git``
- Commit message format: "$($promptDef.CommitMsg)"

When done, report: files created, tests passed/failed, any issues.
"@
}

# ── Determine range ─────────────────────────────────────────────────────────

$allKeys = $Prompts.Keys | Sort-Object
$minKey = ($allKeys | Measure-Object -Minimum).Minimum
$maxKey = ($allKeys | Measure-Object -Maximum).Maximum

if ($Start -eq 0 -and $End -eq 0) {
    # Run all
    $Start = $minKey
    $End = $maxKey
} elseif ($End -eq 0) {
    # Single prompt
    $End = $Start
}

# ── Main execution ──────────────────────────────────────────────────────────

Write-Step "Orchestrator: Prompts $Start -> $End"
Write-Host "Working directory: $RepoRoot"
Write-Host ""

$Succeeded = @()
$Failed = @()
$Skipped = @()

for ($num = $Start; $num -le $End; $num++) {
    # Skip if no definition
    if (-not $Prompts.ContainsKey($num)) {
        Write-Warn "No definition for Prompt $num, skipping"
        continue
    }

    # Check if already done
    if (Test-PromptDone $num) {
        Write-OK "Prompt $num already completed, skipping"
        $Skipped += $num
        continue
    }

    $def = $Prompts[$num]
    Write-Step "Running Prompt ${num}: $($def.File)"

    # Build launch prompt
    $launch = Build-LaunchPrompt $def
    Write-Host $launch -ForegroundColor DarkGray
    Write-Host ""

    # Clean stale git locks
    Clean-GitLocks

    # Run via Claude Code CLI
    Write-OK "Launching Claude Code (non-interactive)..."
    $logFile = Join-Path $LogDir "prompt-${num}.log"
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$timestamp] Starting Prompt $num" | Out-File $logFile

    try {
        $output = claude -p $launch `
            --allowedTools "Bash Edit Write Read Glob Grep" `
            --dangerously-skip-permissions `
            --model opus `
            --max-budget-usd 5 2>&1

        $output | Out-File $logFile -Append
        Write-OK "Claude Code session completed"
    }
    catch {
        Write-Fail "Claude Code session failed for Prompt $num"
        $_.Exception.Message | Out-File $logFile -Append
        $Failed += $num
        continue
    }

    # Verify
    Start-Sleep -Seconds 2  # Give git a moment
    if (Test-PromptDone $num) {
        # Get commit info
        $commitLine = git log --all --oneline 2>$null | Select-String -Pattern "(?i)prompt ${num}:" | Select-Object -First 1
        Write-OK "Prompt $num verified: $commitLine"
        $Succeeded += $num
    }
    else {
        Write-Fail "Prompt $num verification failed — no matching commit found"
        Write-Warn "Check log: $logFile"
        $Failed += $num
    }

    Write-Host ""
}

# ── Summary ─────────────────────────────────────────────────────────────────

Write-Step "Orchestrator Complete"
Write-Host "Succeeded: $($Succeeded -join ', ')" -ForegroundColor Green
Write-Host "Skipped:   $($Skipped -join ', ')" -ForegroundColor DarkGray
Write-Host "Failed:    $(if ($Failed.Count -gt 0) { $Failed -join ', ' } else { 'none' })" -ForegroundColor $(if ($Failed.Count -gt 0) { 'Red' } else { 'Green' })
Write-Host ""
Write-Host "Logs: $LogDir"

if ($Failed.Count -gt 0) {
    Write-Host ""
    Write-Warn "To retry failed prompts:"
    foreach ($f in $Failed) {
        Write-Host "  .\orchestrators\run-prompts.ps1 $f"
    }
    exit 1
}
