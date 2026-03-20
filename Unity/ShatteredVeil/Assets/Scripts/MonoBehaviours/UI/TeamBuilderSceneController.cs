using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
using ShatteredVeil.Core.Teams;
using ShatteredVeil.Core.Units;
using ShatteredVeil.Core.Gacha;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Team Builder screen UI controller. Creates UI procedurally at runtime.
    /// Mirrors js/ui-v2.js: renderTeamBuilderScreen, renderTeamSynergyPreview, showQuickEquipPanel.
    ///
    /// Layout:
    /// - Left panel: roster list with filter/sort
    /// - Center: 4×2 grid (team board) with enemy zone preview above
    /// - Right panel: synergy preview + hero assignment
    /// - Bottom: equipment bar
    /// </summary>
    public class TeamBuilderSceneController : MonoBehaviour
    {
        private TeamBuilderSystem teamSystem;
        private Dictionary<string, IUnitData> unitCatalog;
        private Dictionary<string, OwnedUnit> collection;

        // Available heroes for assignment
        private Dictionary<string, string> availableHeroes; // heroId -> heroName

        // UI state
        private string selectedRosterUnit;
        private string selectedGridUnit;
        private string elementFilter = "All";
        private string archetypeFilter = "All";
        private string sortBy = "Tier";

        // UI references
        private Canvas canvas;
        private RectTransform rootPanel;
        private RectTransform rosterPanel;
        private RectTransform boardPanel;
        private RectTransform synergyPanel;
        private RectTransform equipPanel;
        private Text teamInfoText;
        private Text synergyText;
        private ScrollRect rosterScroll;
        private RectTransform rosterContent;

        // Grid cells
        private readonly Image[,] gridCells = new Image[TeamBuilderSystem.GridCols, TeamBuilderSystem.GridRows];
        private readonly Text[,] gridLabels = new Text[TeamBuilderSystem.GridCols, TeamBuilderSystem.GridRows];

        // Colors (matching existing UI)
        private static readonly Color GoldColor = new Color(0.886f, 0.718f, 0.078f);
        private static readonly Color DarkBg = new Color(0.06f, 0.06f, 0.1f);
        private static readonly Color PanelBg = new Color(0.08f, 0.08f, 0.14f);
        private static readonly Color ButtonBg = new Color(0.16f, 0.22f, 0.38f);
        private static readonly Color ActiveFilterBg = new Color(0.886f, 0.718f, 0.078f);
        private static readonly Color InactiveFilterBg = new Color(0.13f, 0.13f, 0.13f);
        private static readonly Color EmptyCellBg = new Color(0.12f, 0.12f, 0.18f);
        private static readonly Color OccupiedCellBg = new Color(0.15f, 0.2f, 0.3f);
        private static readonly Color EnemyCellBg = new Color(0.1f, 0.04f, 0.04f);
        private static readonly Color SelectedCellBg = new Color(0.3f, 0.35f, 0.15f);
        private static readonly Color OnTeamColor = new Color(0.4f, 0.75f, 0.47f);

        /// <summary>
        /// Initialize the team builder with all required systems and data.
        /// </summary>
        public void Initialize(
            TeamBuilderSystem system,
            Dictionary<string, IUnitData> catalog,
            Dictionary<string, OwnedUnit> collection,
            Dictionary<string, string> availableHeroes = null)
        {
            teamSystem = system;
            unitCatalog = catalog ?? new Dictionary<string, IUnitData>();
            this.collection = collection ?? new Dictionary<string, OwnedUnit>();
            this.availableHeroes = availableHeroes ?? new Dictionary<string, string>();

            teamSystem.OnTeamChanged += OnTeamChanged;

            BuildUI();
            RefreshAll();
        }

        private void OnDestroy()
        {
            if (teamSystem != null)
                teamSystem.OnTeamChanged -= OnTeamChanged;
        }

        private void OnTeamChanged()
        {
            GameEventBus.FireTeamChanged();
            RefreshGrid();
            RefreshSynergyPreview();
            RefreshRoster();
        }

        // ---- UI Construction ----

        private void BuildUI()
        {
            // Canvas
            var canvasGO = new GameObject("TeamBuilderCanvas");
            canvasGO.transform.SetParent(transform);
            canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            var scaler = canvasGO.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080, 1920);
            canvasGO.AddComponent<GraphicRaycaster>();

            // Root
            rootPanel = CreatePanel(canvasGO.transform, "Root", DarkBg);
            rootPanel.anchorMin = Vector2.zero;
            rootPanel.anchorMax = Vector2.one;
            rootPanel.offsetMin = Vector2.zero;
            rootPanel.offsetMax = Vector2.zero;

            // Title bar
            var title = CreateText(rootPanel, "Team Builder", 24, GoldColor);
            SetAnchors(title.rectTransform, 0, 0.95f, 1, 1f);

            // Team info
            teamInfoText = CreateText(rootPanel, "", 14, Color.white);
            SetAnchors(teamInfoText.rectTransform, 0, 0.92f, 1, 0.95f);

            // Three-column layout
            BuildRosterPanel();  // Left: 0.0 - 0.3
            BuildBoardPanel();   // Center: 0.3 - 0.7
            BuildSynergyPanel(); // Right: 0.7 - 1.0
            BuildEquipPanel();   // Bottom: full width
        }

        private void BuildRosterPanel()
        {
            rosterPanel = CreatePanel(rootPanel, "RosterPanel", PanelBg);
            SetAnchors(rosterPanel, 0.01f, 0.15f, 0.3f, 0.91f);

            // Section title
            var rosterTitle = CreateText(rosterPanel, "Roster", 16, GoldColor);
            SetAnchors(rosterTitle.rectTransform, 0.02f, 0.95f, 0.98f, 1f);

            // Filter bar
            BuildFilterBar();

            // Scroll area for roster
            var scrollGO = new GameObject("RosterScroll");
            scrollGO.transform.SetParent(rosterPanel, false);
            var scrollRt = scrollGO.AddComponent<RectTransform>();
            SetAnchors(scrollRt, 0.02f, 0f, 0.98f, 0.78f);
            rosterScroll = scrollGO.AddComponent<ScrollRect>();
            scrollGO.AddComponent<Image>().color = new Color(0.05f, 0.05f, 0.08f, 0.5f);
            scrollGO.AddComponent<Mask>().showMaskGraphic = true;

            var contentGO = new GameObject("Content");
            contentGO.transform.SetParent(scrollGO.transform, false);
            rosterContent = contentGO.AddComponent<RectTransform>();
            rosterContent.anchorMin = new Vector2(0, 1);
            rosterContent.anchorMax = new Vector2(1, 1);
            rosterContent.pivot = new Vector2(0.5f, 1);
            rosterContent.sizeDelta = new Vector2(0, 0);

            var vlg = contentGO.AddComponent<VerticalLayoutGroup>();
            vlg.spacing = 2;
            vlg.padding = new RectOffset(2, 2, 2, 2);
            vlg.childForceExpandWidth = true;
            vlg.childForceExpandHeight = false;

            var csf = contentGO.AddComponent<ContentSizeFitter>();
            csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            rosterScroll.content = rosterContent;
            rosterScroll.horizontal = false;
            rosterScroll.vertical = true;
        }

        private void BuildFilterBar()
        {
            var filterPanel = CreatePanel(rosterPanel, "FilterPanel", Color.clear);
            SetAnchors(filterPanel, 0.02f, 0.78f, 0.98f, 0.95f);

            // Sort row
            var sortLabel = CreateText(filterPanel, "Sort:", 10, new Color(0.5f, 0.5f, 0.5f));
            SetAnchors(sortLabel.rectTransform, 0f, 0.7f, 0.15f, 1f);

            string[] sortOpts = { "Tier", "Name", "Element" };
            for (int i = 0; i < sortOpts.Length; i++)
            {
                float x0 = 0.15f + i * 0.28f;
                float x1 = x0 + 0.26f;
                var sortOpt = sortOpts[i];
                var btn = CreateButton(filterPanel, "Sort_" + sortOpt, sortOpt,
                    sortBy == sortOpt ? ActiveFilterBg : InactiveFilterBg,
                    sortBy == sortOpt ? Color.black : new Color(0.8f, 0.8f, 0.8f));
                SetAnchors(btn.GetComponent<RectTransform>(), x0, 0.7f, x1, 1f);
                btn.GetComponent<Button>().onClick.AddListener(() =>
                {
                    sortBy = sortOpt;
                    RefreshAll();
                });
            }

            // Element filter row
            string[] elements = { "All", "Fire", "Water", "Earth", "Wind", "Lightning", "Force" };
            for (int i = 0; i < elements.Length; i++)
            {
                float x0 = i * (1f / elements.Length);
                float x1 = x0 + (1f / elements.Length) - 0.005f;
                var elem = elements[i];
                string label = elem == "All" ? "All" : PlaceholderFactory.GetElementAbbrev(elem);
                Color btnColor = elem == "All" ? Color.gray : PlaceholderFactory.GetElementColor(elem);
                bool isActive = elementFilter == elem;

                var btn = CreateButton(filterPanel, "Elem_" + elem, label,
                    isActive ? btnColor : InactiveFilterBg,
                    isActive ? Color.black : new Color(0.8f, 0.8f, 0.8f));
                SetAnchors(btn.GetComponent<RectTransform>(), x0, 0.35f, x1, 0.65f);
                btn.GetComponent<Button>().onClick.AddListener(() =>
                {
                    elementFilter = elem;
                    RefreshAll();
                });
            }

            // Archetype filter row
            string[] archetypes = { "All", "Guardian", "Warden", "Vanguard", "Duelist", "Predator", "Ranger", "Sorcerer", "Mystic", "Sage" };
            for (int i = 0; i < archetypes.Length; i++)
            {
                float x0 = i * (1f / archetypes.Length);
                float x1 = x0 + (1f / archetypes.Length) - 0.003f;
                var arch = archetypes[i];
                string label = arch == "All" ? "All" : arch.Substring(0, 2);

                bool isActive = archetypeFilter == arch;
                var btn = CreateButton(filterPanel, "Arch_" + arch, label,
                    isActive ? ActiveFilterBg : InactiveFilterBg,
                    isActive ? Color.black : new Color(0.8f, 0.8f, 0.8f));
                SetAnchors(btn.GetComponent<RectTransform>(), x0, 0f, x1, 0.3f);
                btn.GetComponent<Button>().onClick.AddListener(() =>
                {
                    archetypeFilter = arch;
                    RefreshAll();
                });
            }
        }

        private void BuildBoardPanel()
        {
            boardPanel = CreatePanel(rootPanel, "BoardPanel", PanelBg);
            SetAnchors(boardPanel, 0.31f, 0.15f, 0.69f, 0.91f);

            // Enemy zone preview (top, dimmed)
            var enemyZone = CreatePanel(boardPanel, "EnemyZone", Color.clear);
            SetAnchors(enemyZone, 0.02f, 0.65f, 0.98f, 0.95f);

            var enemyLabel = CreateText(enemyZone, "Enemy Zone", 12, new Color(0.6f, 0.3f, 0.3f, 0.5f));
            SetAnchors(enemyLabel.rectTransform, 0f, 0.85f, 1f, 1f);

            // 4×2 enemy preview grid (dimmed, non-interactive)
            for (int row = 0; row < TeamBuilderSystem.GridRows; row++)
            {
                for (int col = 0; col < TeamBuilderSystem.GridCols; col++)
                {
                    float x0 = col * 0.25f + 0.01f;
                    float x1 = x0 + 0.23f;
                    float y1 = 0.85f - row * 0.42f;
                    float y0 = y1 - 0.38f;

                    var cell = CreatePanel(enemyZone, "EnemyCell_" + col + "_" + row, EnemyCellBg);
                    SetAnchors(cell, x0, y0, x1, y1);
                    cell.GetComponent<Image>().color = new Color(EnemyCellBg.r, EnemyCellBg.g, EnemyCellBg.b, 0.3f);
                }
            }

            // Divider label
            var divider = CreateText(boardPanel, "--- Your Team ---", 11, new Color(0.5f, 0.5f, 0.6f));
            SetAnchors(divider.rectTransform, 0f, 0.6f, 1f, 0.65f);

            // Player's 4×2 grid
            var teamGrid = CreatePanel(boardPanel, "TeamGrid", Color.clear);
            SetAnchors(teamGrid, 0.02f, 0.15f, 0.98f, 0.6f);

            for (int row = 0; row < TeamBuilderSystem.GridRows; row++)
            {
                for (int col = 0; col < TeamBuilderSystem.GridCols; col++)
                {
                    float x0 = col * 0.25f + 0.01f;
                    float x1 = x0 + 0.23f;
                    float y1 = 1f - row * 0.5f - 0.02f;
                    float y0 = y1 - 0.46f;

                    var cellGO = new GameObject("Cell_" + col + "_" + row);
                    cellGO.transform.SetParent(teamGrid, false);
                    var cellRt = cellGO.AddComponent<RectTransform>();
                    SetAnchors(cellRt, x0, y0, x1, y1);

                    var cellImg = cellGO.AddComponent<Image>();
                    cellImg.color = EmptyCellBg;
                    gridCells[col, row] = cellImg;

                    // Unit label inside cell
                    var labelText = CreateText(cellRt, "", 10, Color.white);
                    labelText.rectTransform.anchorMin = Vector2.zero;
                    labelText.rectTransform.anchorMax = Vector2.one;
                    labelText.rectTransform.offsetMin = new Vector2(2, 2);
                    labelText.rectTransform.offsetMax = new Vector2(-2, -2);
                    labelText.alignment = TextAnchor.MiddleCenter;
                    gridLabels[col, row] = labelText;

                    // Click handler
                    var btn = cellGO.AddComponent<Button>();
                    btn.targetGraphic = cellImg;
                    int c = col, r = row;
                    btn.onClick.AddListener(() => OnGridCellClicked(c, r));
                }
            }

            // Row labels
            var frontLabel = CreateText(boardPanel, "Front", 9, new Color(0.5f, 0.5f, 0.6f));
            SetAnchors(frontLabel.rectTransform, 0f, 0.46f, 0.07f, 0.56f);

            var backLabel = CreateText(boardPanel, "Back", 9, new Color(0.5f, 0.5f, 0.6f));
            SetAnchors(backLabel.rectTransform, 0f, 0.2f, 0.07f, 0.3f);

            // Clear team button
            var clearBtn = CreateButton(boardPanel, "ClearTeam", "Clear Team",
                new Color(0.4f, 0.15f, 0.15f), Color.white);
            SetAnchors(clearBtn.GetComponent<RectTransform>(), 0.3f, 0.02f, 0.7f, 0.1f);
            clearBtn.GetComponent<Button>().onClick.AddListener(OnClearTeamClicked);
        }

        private void BuildSynergyPanel()
        {
            synergyPanel = CreatePanel(rootPanel, "SynergyPanel", PanelBg);
            SetAnchors(synergyPanel, 0.7f, 0.15f, 0.99f, 0.91f);

            var synTitle = CreateText(synergyPanel, "Synergies", 16, GoldColor);
            SetAnchors(synTitle.rectTransform, 0.02f, 0.95f, 0.98f, 1f);

            // Synergy content (scrollable text)
            var synScrollGO = new GameObject("SynergyScroll");
            synScrollGO.transform.SetParent(synergyPanel, false);
            var synScrollRt = synScrollGO.AddComponent<RectTransform>();
            SetAnchors(synScrollRt, 0.02f, 0.3f, 0.98f, 0.94f);
            var synScroll = synScrollGO.AddComponent<ScrollRect>();
            synScrollGO.AddComponent<Image>().color = new Color(0.05f, 0.05f, 0.08f, 0.3f);
            synScrollGO.AddComponent<Mask>().showMaskGraphic = true;

            var synContentGO = new GameObject("SynContent");
            synContentGO.transform.SetParent(synScrollGO.transform, false);
            var synContentRt = synContentGO.AddComponent<RectTransform>();
            synContentRt.anchorMin = new Vector2(0, 1);
            synContentRt.anchorMax = new Vector2(1, 1);
            synContentRt.pivot = new Vector2(0.5f, 1);

            synergyText = synContentGO.AddComponent<Text>();
            synergyText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            synergyText.fontSize = 11;
            synergyText.color = Color.white;
            synergyText.alignment = TextAnchor.UpperLeft;
            synergyText.horizontalOverflow = HorizontalWrapMode.Wrap;
            synergyText.verticalOverflow = VerticalWrapMode.Overflow;

            var synCsf = synContentGO.AddComponent<ContentSizeFitter>();
            synCsf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            synScroll.content = synContentRt;
            synScroll.horizontal = false;
            synScroll.vertical = true;

            // Hero assignment section
            var heroTitle = CreateText(synergyPanel, "Hero Assignment", 14, GoldColor);
            SetAnchors(heroTitle.rectTransform, 0.02f, 0.24f, 0.98f, 0.3f);

            var heroInfo = CreateText(synergyPanel, "Select a unit on the grid\nto assign a hero", 10,
                new Color(0.5f, 0.5f, 0.6f));
            SetAnchors(heroInfo.rectTransform, 0.02f, 0.0f, 0.98f, 0.24f);
        }

        private void BuildEquipPanel()
        {
            equipPanel = CreatePanel(rootPanel, "EquipPanel", PanelBg);
            SetAnchors(equipPanel, 0.01f, 0.01f, 0.99f, 0.14f);

            var equipTitle = CreateText(equipPanel, "Equipment", 14, GoldColor);
            SetAnchors(equipTitle.rectTransform, 0.01f, 0.7f, 0.99f, 1f);

            var equipInfo = CreateText(equipPanel, "Select a unit on the grid to manage equipment", 11,
                new Color(0.5f, 0.5f, 0.6f));
            SetAnchors(equipInfo.rectTransform, 0.01f, 0f, 0.99f, 0.65f);
        }

        // ---- Refresh Methods ----

        private void RefreshAll()
        {
            RefreshTeamInfo();
            RefreshRoster();
            RefreshGrid();
            RefreshSynergyPreview();
        }

        private void RefreshTeamInfo()
        {
            if (teamInfoText != null && teamSystem != null)
            {
                teamInfoText.text = "Team: " + teamSystem.CurrentTeamSize + " / " +
                    teamSystem.MaxTeamSize + " units";
            }
        }

        private void RefreshRoster()
        {
            if (rosterContent == null || teamSystem == null) return;

            // Clear existing
            for (int i = rosterContent.childCount - 1; i >= 0; i--)
                Destroy(rosterContent.GetChild(i).gameObject);

            var roster = teamSystem.GetRosterForDisplay();
            roster = teamSystem.FilterRoster(roster, elementFilter, archetypeFilter);
            teamSystem.SortRoster(roster, sortBy);

            foreach (var entry in roster)
            {
                CreateRosterCard(entry);
            }
        }

        private void CreateRosterCard(RosterDisplayEntry entry)
        {
            var cardGO = new GameObject("RosterCard_" + entry.UnitId);
            cardGO.transform.SetParent(rosterContent, false);
            var cardRt = cardGO.AddComponent<RectTransform>();
            cardRt.sizeDelta = new Vector2(0, 52);

            Color cardBg = entry.IsOnTeam
                ? new Color(0.1f, 0.2f, 0.12f)
                : new Color(0.1f, 0.1f, 0.15f);
            var cardImg = cardGO.AddComponent<Image>();
            cardImg.color = cardBg;

            // Evolved indicator (gold left border)
            if (entry.IsEvolved)
            {
                var borderGO = new GameObject("EvolvedBorder");
                borderGO.transform.SetParent(cardGO.transform, false);
                var borderRt = borderGO.AddComponent<RectTransform>();
                borderRt.anchorMin = new Vector2(0, 0);
                borderRt.anchorMax = new Vector2(0, 1);
                borderRt.sizeDelta = new Vector2(3, 0);
                borderRt.anchoredPosition = new Vector2(1.5f, 0);
                borderGO.AddComponent<Image>().color = GoldColor;
            }

            // Element color bar
            Color elemColor = PlaceholderFactory.GetElementColor(entry.Data.Element);
            string elemAbbrev = PlaceholderFactory.GetElementAbbrev(entry.Data.Element);

            var elemBar = new GameObject("ElemBar");
            elemBar.transform.SetParent(cardGO.transform, false);
            var elemBarRt = elemBar.AddComponent<RectTransform>();
            elemBarRt.anchorMin = new Vector2(0, 0);
            elemBarRt.anchorMax = new Vector2(0.06f, 1);
            elemBarRt.offsetMin = new Vector2(entry.IsEvolved ? 4 : 0, 0);
            elemBarRt.offsetMax = Vector2.zero;
            elemBar.AddComponent<Image>().color = elemColor;

            // Unit name + info
            string stars = new string('*', entry.Stars);
            string heroLabel = !string.IsNullOrEmpty(entry.HeroId) && availableHeroes.ContainsKey(entry.HeroId)
                ? " [" + availableHeroes[entry.HeroId] + "]"
                : "";
            string statusMark = entry.IsOnTeam ? " [ON TEAM]" : "";

            int scaledHP = UnitStatCalculator.CalculateHP(entry.Data, entry.Stars);
            int scaledATK = UnitStatCalculator.CalculateATK(entry.Data, entry.Stars);

            var nameText = CreateText(cardRt, entry.Data.Name + " " + stars + statusMark + heroLabel,
                11, entry.IsOnTeam ? OnTeamColor : Color.white);
            nameText.rectTransform.anchorMin = new Vector2(0.08f, 0.45f);
            nameText.rectTransform.anchorMax = new Vector2(0.98f, 1f);
            nameText.rectTransform.offsetMin = Vector2.zero;
            nameText.rectTransform.offsetMax = Vector2.zero;
            nameText.alignment = TextAnchor.MiddleLeft;

            var statsText = CreateText(cardRt,
                elemAbbrev + " " + entry.Data.Archetype.Substring(0, System.Math.Min(3, entry.Data.Archetype.Length)) +
                " T" + entry.Data.Tier + " | HP:" + scaledHP + " ATK:" + scaledATK,
                9, new Color(0.6f, 0.6f, 0.7f));
            statsText.rectTransform.anchorMin = new Vector2(0.08f, 0f);
            statsText.rectTransform.anchorMax = new Vector2(0.98f, 0.45f);
            statsText.rectTransform.offsetMin = Vector2.zero;
            statsText.rectTransform.offsetMax = Vector2.zero;
            statsText.alignment = TextAnchor.MiddleLeft;

            // Click handler
            var btn = cardGO.AddComponent<Button>();
            btn.targetGraphic = cardImg;
            string uid = entry.UnitId;
            bool onTeam = entry.IsOnTeam;
            btn.onClick.AddListener(() =>
            {
                if (onTeam)
                {
                    // Click on-team unit → remove
                    teamSystem.RemoveUnit(uid);
                    GameEventBus.FireUnitRemoved(uid);
                    GameEventBus.FireToast("Removed " + entry.Data.Name);
                }
                else
                {
                    // Select for placement
                    selectedRosterUnit = uid;
                    RefreshRoster(); // Re-highlight
                    GameEventBus.FireToast("Select a grid cell for " + entry.Data.Name);
                }
            });

            // Highlight if selected
            if (selectedRosterUnit == uid && !onTeam)
            {
                cardImg.color = new Color(0.2f, 0.2f, 0.1f);
            }
        }

        private void RefreshGrid()
        {
            if (teamSystem == null) return;

            for (int col = 0; col < TeamBuilderSystem.GridCols; col++)
            {
                for (int row = 0; row < TeamBuilderSystem.GridRows; row++)
                {
                    var slot = teamSystem.GetUnitAt(col, row);
                    var cellImg = gridCells[col, row];
                    var label = gridLabels[col, row];

                    if (slot != null && unitCatalog.TryGetValue(slot.UnitId, out IUnitData data))
                    {
                        Color elemColor = PlaceholderFactory.GetElementColor(data.Element);
                        cellImg.color = new Color(elemColor.r * 0.4f, elemColor.g * 0.4f, elemColor.b * 0.4f);

                        string heroStr = "";
                        string heroId = teamSystem.GetHeroForUnit(slot.UnitId);
                        if (!string.IsNullOrEmpty(heroId) && availableHeroes.ContainsKey(heroId))
                            heroStr = "\n[" + availableHeroes[heroId] + "]";

                        string elemA = PlaceholderFactory.GetElementAbbrev(data.Element);
                        label.text = elemA + "\n" + data.Name.Split(' ')[0] + heroStr;
                        label.color = Color.white;

                        // Highlight if selected
                        if (selectedGridUnit == slot.UnitId)
                            cellImg.color = SelectedCellBg;
                    }
                    else
                    {
                        cellImg.color = EmptyCellBg;
                        label.text = "";
                    }
                }
            }

            RefreshTeamInfo();
        }

        private void RefreshSynergyPreview()
        {
            if (synergyText == null || teamSystem == null) return;

            var preview = teamSystem.GetSynergyPreview();

            if (preview.TeamSize == 0)
            {
                synergyText.text = "Place units to see synergies";
                return;
            }

            string text = "";

            // Archetype synergies
            text += "<color=#" + ColorUtility.ToHtmlStringRGB(GoldColor) + ">Archetypes</color>\n";
            string[] archetypeOrder = { "Guardian", "Warden", "Vanguard", "Duelist", "Predator", "Ranger", "Sorcerer", "Mystic", "Sage" };
            foreach (string arch in archetypeOrder)
            {
                if (preview.ArchetypeCounts.TryGetValue(arch, out int count) && count > 0)
                {
                    int tier = preview.ActiveArchetypeSynergies.ContainsKey(arch) ? preview.ActiveArchetypeSynergies[arch] : 0;
                    int nextThresh = GetNextArchetypeThreshold(count);
                    string tierColor = tier > 0 ? "#6BCB77" : "#888888";
                    text += "<color=" + tierColor + ">" + arch.Substring(0, 3) + " " + count + "/" + nextThresh;
                    if (tier > 0) text += " (T" + tier + ")";
                    text += "</color>\n";

                    // Show thresholds
                    for (int t = 0; t < TeamBuilderSystem.ArchetypeThresholds.Length; t++)
                    {
                        bool active = (t + 1) <= tier;
                        string mark = active ? "+" : "o";
                        string color = active ? "#6BCB77" : "#555555";
                        text += "  <color=" + color + ">" + mark + " " + TeamBuilderSystem.ArchetypeThresholds[t] + "</color>\n";
                    }
                }
            }

            // Element synergies
            text += "\n<color=#" + ColorUtility.ToHtmlStringRGB(GoldColor) + ">Elements</color>\n";
            string[] elementOrder = { "Fire", "Water", "Earth", "Wind", "Lightning", "Force" };
            foreach (string elem in elementOrder)
            {
                if (preview.ElementCounts.TryGetValue(elem, out int count) && count > 0)
                {
                    int tier = preview.ActiveElementSynergies.ContainsKey(elem) ? preview.ActiveElementSynergies[elem] : 0;
                    int nextThresh = GetNextElementThreshold(count);
                    bool isPrismatic = count >= 10;

                    Color ec = PlaceholderFactory.GetElementColor(elem);
                    string elemHex = ColorUtility.ToHtmlStringRGB(tier > 0 ? ec : Color.gray);
                    text += "<color=#" + elemHex + ">" + PlaceholderFactory.GetElementAbbrev(elem) +
                        " " + count + "/" + nextThresh;
                    if (tier > 0) text += " (T" + tier + ")";
                    if (isPrismatic) text += " PRISMATIC";
                    text += "</color>\n";

                    for (int t = 0; t < TeamBuilderSystem.ElementThresholds.Length; t++)
                    {
                        bool active = (t + 1) <= tier;
                        string mark = active ? "+" : "o";
                        string color = active ? "#6BCB77" : "#555555";
                        text += "  <color=" + color + ">" + mark + " " + TeamBuilderSystem.ElementThresholds[t] + "</color>\n";
                    }
                }
            }

            synergyText.text = text;
        }

        // ---- Event Handlers ----

        private void OnGridCellClicked(int col, int row)
        {
            if (teamSystem == null) return;

            var existingSlot = teamSystem.GetUnitAt(col, row);

            if (!string.IsNullOrEmpty(selectedRosterUnit))
            {
                // Place selected roster unit
                var result = teamSystem.AddUnit(selectedRosterUnit, col, row);
                if (result.Success)
                {
                    GameEventBus.FireUnitPlaced(selectedRosterUnit, col, row);
                    if (unitCatalog.TryGetValue(selectedRosterUnit, out IUnitData data))
                        GameEventBus.FireToast("Placed " + data.Name);
                }
                else
                {
                    GameEventBus.FireToast(result.Message);
                }
                selectedRosterUnit = null;
                return;
            }

            if (existingSlot != null)
            {
                // Select unit on grid (for hero assignment, equipment, move)
                if (selectedGridUnit == existingSlot.UnitId)
                {
                    selectedGridUnit = null; // Deselect
                }
                else
                {
                    selectedGridUnit = existingSlot.UnitId;
                    RefreshHeroPanel();
                    RefreshEquipPanel();
                }
                RefreshGrid();
            }
        }

        private void OnClearTeamClicked()
        {
            if (teamSystem == null) return;
            teamSystem.ClearTeam();
            selectedGridUnit = null;
            selectedRosterUnit = null;
            GameEventBus.FireToast("Team cleared");
        }

        // ---- Hero Panel ----

        private void RefreshHeroPanel()
        {
            if (synergyPanel == null || teamSystem == null) return;

            // Find or create hero assignment area
            var heroArea = synergyPanel.Find("HeroArea");
            if (heroArea != null)
                Destroy(heroArea.gameObject);

            if (string.IsNullOrEmpty(selectedGridUnit)) return;
            if (!unitCatalog.TryGetValue(selectedGridUnit, out IUnitData unitData)) return;

            var heroAreaGO = new GameObject("HeroArea");
            heroAreaGO.transform.SetParent(synergyPanel, false);
            var heroAreaRt = heroAreaGO.AddComponent<RectTransform>();
            SetAnchors(heroAreaRt, 0.02f, 0f, 0.98f, 0.28f);

            var vlg = heroAreaGO.AddComponent<VerticalLayoutGroup>();
            vlg.spacing = 2;
            vlg.padding = new RectOffset(2, 2, 2, 2);
            vlg.childForceExpandWidth = true;
            vlg.childForceExpandHeight = false;

            // Label
            var label = CreateLayoutText(heroAreaGO.transform, "Hero for " + unitData.Name, 11, GoldColor, 18);

            // Current hero
            string currentHero = teamSystem.GetHeroForUnit(selectedGridUnit);
            if (!string.IsNullOrEmpty(currentHero) && availableHeroes.ContainsKey(currentHero))
            {
                var current = CreateLayoutText(heroAreaGO.transform,
                    "Current: " + availableHeroes[currentHero], 10, OnTeamColor, 16);

                // Unassign button
                var unassignBtn = CreateLayoutButton(heroAreaGO.transform, "Unassign", 14,
                    new Color(0.4f, 0.15f, 0.15f), Color.white);
                string uid = selectedGridUnit;
                unassignBtn.GetComponent<Button>().onClick.AddListener(() =>
                {
                    teamSystem.UnassignHero(uid);
                    GameEventBus.FireHeroUnassigned(uid);
                    RefreshHeroPanel();
                });
            }

            // Available heroes
            foreach (var hero in availableHeroes)
            {
                if (hero.Key == currentHero) continue;

                var heroBtn = CreateLayoutButton(heroAreaGO.transform, hero.Value, 14,
                    ButtonBg, Color.white);
                string heroId = hero.Key;
                string uid = selectedGridUnit;
                heroBtn.GetComponent<Button>().onClick.AddListener(() =>
                {
                    teamSystem.AssignHero(uid, heroId);
                    GameEventBus.FireHeroAssigned(uid, heroId);
                    GameEventBus.FireToast("Assigned " + availableHeroes[heroId]);
                    RefreshHeroPanel();
                });
            }
        }

        private void RefreshEquipPanel()
        {
            if (equipPanel == null) return;

            // Clear children except title
            for (int i = equipPanel.childCount - 1; i >= 0; i--)
            {
                var child = equipPanel.GetChild(i);
                if (child.name != "EquipPanel") // Keep the panel itself
                    Destroy(child.gameObject);
            }

            // Rebuild title
            var titleText = CreateText(equipPanel, "Equipment", 14, GoldColor);
            SetAnchors(titleText.rectTransform, 0.01f, 0.7f, 0.99f, 1f);

            if (string.IsNullOrEmpty(selectedGridUnit))
            {
                var info = CreateText(equipPanel, "Select a unit on the grid to manage equipment", 11,
                    new Color(0.5f, 0.5f, 0.6f));
                SetAnchors(info.rectTransform, 0.01f, 0f, 0.99f, 0.65f);
                return;
            }

            if (!unitCatalog.TryGetValue(selectedGridUnit, out IUnitData unitData))
                return;

            var unitLabel = CreateText(equipPanel,
                "Equipment for " + unitData.Name + " (items system pending)", 11,
                new Color(0.5f, 0.5f, 0.6f));
            SetAnchors(unitLabel.rectTransform, 0.01f, 0f, 0.99f, 0.65f);
        }

        // ---- Helpers ----

        private static int GetNextElementThreshold(int count)
        {
            foreach (int t in TeamBuilderSystem.ElementThresholds)
                if (count < t) return t;
            return TeamBuilderSystem.ElementThresholds[TeamBuilderSystem.ElementThresholds.Length - 1];
        }

        private static int GetNextArchetypeThreshold(int count)
        {
            foreach (int t in TeamBuilderSystem.ArchetypeThresholds)
                if (count < t) return t;
            return TeamBuilderSystem.ArchetypeThresholds[TeamBuilderSystem.ArchetypeThresholds.Length - 1];
        }

        // ---- UI Factory Methods (matching GachaSceneController pattern) ----

        private static RectTransform CreatePanel(Transform parent, string name, Color bgColor)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            var img = go.AddComponent<Image>();
            img.color = bgColor;
            return rt;
        }

        private static Text CreateText(Transform parent, string content, int fontSize, Color color)
        {
            var go = new GameObject("Text");
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            var text = go.AddComponent<Text>();
            text.text = content;
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            text.fontSize = fontSize;
            text.color = color;
            text.alignment = TextAnchor.MiddleCenter;
            text.horizontalOverflow = HorizontalWrapMode.Wrap;
            text.verticalOverflow = VerticalWrapMode.Truncate;
            text.raycastTarget = false;
            return text;
        }

        private static Text CreateText(RectTransform parent, string content, int fontSize, Color color)
        {
            return CreateText((Transform)parent, content, fontSize, color);
        }

        private static Text CreateLayoutText(Transform parent, string content, int fontSize, Color color, float height)
        {
            var text = CreateText(parent, content, fontSize, color);
            text.alignment = TextAnchor.MiddleLeft;
            var le = text.gameObject.AddComponent<LayoutElement>();
            le.preferredHeight = height;
            le.flexibleWidth = 1;
            return text;
        }

        private static GameObject CreateButton(Transform parent, string name, string label,
            Color bgColor, Color textColor)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.AddComponent<RectTransform>();
            var img = go.AddComponent<Image>();
            img.color = bgColor;
            var btn = go.AddComponent<Button>();
            btn.targetGraphic = img;

            var textGO = new GameObject("Label");
            textGO.transform.SetParent(go.transform, false);
            var textRt = textGO.AddComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = new Vector2(2, 1);
            textRt.offsetMax = new Vector2(-2, -1);

            var text = textGO.AddComponent<Text>();
            text.text = label;
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            text.fontSize = 10;
            text.color = textColor;
            text.alignment = TextAnchor.MiddleCenter;
            text.horizontalOverflow = HorizontalWrapMode.Overflow;
            text.raycastTarget = false;

            return go;
        }

        private static GameObject CreateLayoutButton(Transform parent, string label, float height,
            Color bgColor, Color textColor)
        {
            var go = CreateButton(parent, "Btn_" + label, label, bgColor, textColor);
            var le = go.AddComponent<LayoutElement>();
            le.preferredHeight = height;
            le.flexibleWidth = 1;
            return go;
        }

        private static void SetAnchors(RectTransform rt, float xMin, float yMin, float xMax, float yMax)
        {
            rt.anchorMin = new Vector2(xMin, yMin);
            rt.anchorMax = new Vector2(xMax, yMax);
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }
    }
}
