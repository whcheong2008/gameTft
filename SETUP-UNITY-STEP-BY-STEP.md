# Unity + MCP Setup — Exact Steps (Windows)

Do these in order. Each step has the exact link, command, or click path.

---

## Step 1: Install Python 3.11+ (if not already installed)

**Check first** — open PowerShell:
```powershell
python --version
```
If you see `Python 3.11.x` or higher, skip to Step 2.

**If not installed:**
1. Go to: https://www.python.org/downloads/
2. Download the latest Python 3.12 or 3.13 installer for Windows
3. **IMPORTANT**: Check "Add python.exe to PATH" on the first screen
4. Click "Install Now"
5. Verify: `python --version`

---

## Step 2: Install `uv` (Python package manager — required by Unity MCP)

Open PowerShell and run:
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Then verify:
```powershell
uv --version
```

Should show something like `uv 0.6.x`.

Reference: https://docs.astral.sh/uv/getting-started/installation/

---

## Step 3: Install Unity Hub

1. Go to: https://unity.com/download
2. Click "Download for Windows"
3. Run the installer (`UnityHubSetup.exe`)
4. Sign in or create a Unity account when prompted
5. Activate a license (Personal is free)

---

## Step 4: Install Unity 6 LTS (or 2022.3 LTS) via Unity Hub

1. Open Unity Hub
2. Click **Installs** (left sidebar)
3. Click **Install Editor**
4. Find **Unity 2022.3.x LTS** (the latest patch under the 2022.3 row) — click **Install**
5. On the modules screen, check:
   - **Microsoft Visual Studio Community** (if you don't have an IDE)
   - **Windows Build Support (IL2CPP)** — checked by default
6. Click **Install** — this takes 10-20 minutes

---

## Step 5: Create the Unity Project

1. Open Unity Hub
2. Click **Projects** (left sidebar)
3. Click **New Project**
4. Settings:
   - **Editor version**: Select the `2022.3.x LTS` you just installed
   - **Template**: Select **2D (URP)** — the one that says "Universal 2D" or "2D (URP Core)"
   - **Project name**: `ShatteredVeil` (or leave default — the folder name matters more)
   - **Location**: Navigate to your repo folder and set it so the project creates inside `unity/`. The path should look like:
     ```
     C:\Users\whche\OneDrive\Documents\...\Game TFT\unity
     ```
     The project files (Assets, Packages, ProjectSettings) should land directly in that `unity/` folder.
5. Click **Create Project**
6. Wait for the editor to open (first launch takes 2-5 minutes)

**Verify**: You should now have:
```
Game TFT/
├── unity/
│   ├── Assets/
│   ├── Packages/
│   ├── ProjectSettings/
│   └── ... (Library, Temp, etc.)
```

---

## Step 6: Install the Unity MCP Package

In the Unity Editor (which should now be open):

1. Go to **Window → Package Manager**
2. Click the **+** button (top-left of Package Manager window)
3. Select **Add package from git URL...**
4. Paste this exact URL:
   ```
   https://github.com/CoplayDev/unity-mcp.git?path=/MCPForUnity#main
   ```
5. Click **Add**
6. Wait for import to complete (watch the progress bar at the bottom of Unity)

**Verify**: In the Package Manager, you should see "MCP for Unity" listed under "In Project".

Reference: https://github.com/CoplayDev/unity-mcp

---

## Step 7: Start the MCP Server in Unity

1. In Unity Editor, go to **Window → MCP for Unity**
2. A panel opens. Click **Start** (or "Start Server")
3. It should show the server running on `localhost:8080`
4. You should see a green status or "Server running" message

Leave Unity open with the server running. It must stay running while Claude Code works.

---

## Step 8: Configure Claude Code to Connect to Unity MCP

### Option A: HTTP (simpler — recommended)

In your Claude Code config file, add the Unity MCP server.

Run in terminal/PowerShell:
```powershell
claude mcp add --scope user --transport http unityMCP http://localhost:8080/mcp
```

OR manually edit your Claude Code config (`~/.claude/settings.json` or wherever your MCP config lives) and add:

```json
{
  "mcpServers": {
    "unityMCP": {
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

### Option B: Stdio (alternative, if HTTP doesn't work)

```powershell
claude mcp add --scope user --transport stdio unityMCP -- C:/Users/whche/AppData/Local/Microsoft/WinGet/Links/uvx.exe --from mcpforunityserver mcp-for-unity --transport stdio
```

Or manually add to config:
```json
{
  "mcpServers": {
    "unityMCP": {
      "command": "C:/Users/whche/AppData/Local/Microsoft/WinGet/Links/uvx.exe",
      "args": ["--from", "mcpforunityserver", "mcp-for-unity", "--transport", "stdio"]
    }
  }
}
```

**Note**: The `uvx.exe` path may differ. Find yours with: `where uvx`

---

## Step 9: Verify the Connection

In Claude Code, run:
```
claude mcp list
```

You should see `unityMCP` listed and connected.

Then ask Claude Code to test:
```
"Use the editor_state resource to check if Unity is connected"
```

It should return info about your Unity project (editor version, play mode state, etc.).

---

## Step 10: Commit the `.gitignore` Update

Before Claude Code does anything else, update `.gitignore` so Unity's generated files don't get committed:

```powershell
cd "path/to/Game TFT"
git checkout -b feature/unity-project-setup
```

Add to `.gitignore`:
```
# Unity
unity/Library/
unity/Temp/
unity/Logs/
unity/UserSettings/
unity/Builds/
unity/obj/
unity/Assets/Plugins/Editor/JetBrains*
*.csproj
*.sln
*.pidb
*.pdb
*.userprefs
*.booproj
*.svd
*.unityproj
*.suo
*.tmp
*.user
*.pidb.meta
*.pdb.meta
```

Then:
```powershell
git add .gitignore
git commit -m "Add Unity gitignore rules before project setup"
```

---

## You're Done — Now Hand Off to Claude Code

At this point:
- Unity is open with the 2D URP project at `Game TFT/unity/`
- Unity MCP server is running on localhost:8080
- Claude Code is connected to Unity MCP
- `.gitignore` is updated
- You're on branch `feature/unity-project-setup`

Tell Claude Code:
```
"Read prompts/34-unity-project-setup.md and implement everything in the 'What Claude Code Does' section. You're already on the feature/unity-project-setup branch."
```

And in a separate Claude Code session (can run in parallel, no Unity needed):
```
"Read prompts/35-ground-truth-extraction.md and implement. Create the branch feature/ground-truth first."
```

---

## Troubleshooting

**Unity MCP won't start**: Make sure `uv --version` works in PowerShell. If not, reinstall uv and restart Unity.

**Claude Code can't connect**: Make sure Unity is open AND the MCP server is running (green status in Window → MCP for Unity). Try restarting Claude Code.

**Package Manager won't add the git URL**: Check your internet connection. The URL requires GitHub access. If you're behind a firewall, try the OpenUPM alternative: https://openupm.com/packages/com.coplaydev.unity-mcp/

**"uvx not found"**: Run `where uvx` in PowerShell. If nothing shows, `uv` didn't install correctly. Reinstall from Step 2.
