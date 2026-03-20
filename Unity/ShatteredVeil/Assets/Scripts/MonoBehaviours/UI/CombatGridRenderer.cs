using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Renders the combat grid: 4×2 player side (bottom) and 4×2 enemy side (top).
    /// Manages unit cell visuals (HP bars, mana bars, status icons, element colors).
    /// </summary>
    public class CombatGridRenderer : MonoBehaviour
    {
        // Grid dimensions matching Core/Combat grid: 4 cols × 2 rows per side
        private const int Cols = 4;
        private const int RowsPerSide = 2;
        private const int TotalRows = 4; // 2 enemy + 2 player

        // UI references
        private RectTransform _gridRoot;
        private Image[,] _cellBackgrounds;
        private Text[,] _cellNames;
        private Image[,] _hpBars;
        private Image[,] _hpFills;
        private Image[,] _manaBars;
        private Image[,] _manaFills;
        private Image[,] _shieldBars;
        private Text[,] _statusTexts;
        private Image _dividerLine;

        // Colors
        private static readonly Color PlayerRowColor = new Color(0.08f, 0.12f, 0.20f, 0.6f);
        private static readonly Color EnemyRowColor = new Color(0.20f, 0.08f, 0.08f, 0.6f);
        private static readonly Color EmptyCellColor = new Color(0.10f, 0.10f, 0.14f, 0.3f);
        private static readonly Color HPBarBG = new Color(0.15f, 0.15f, 0.15f);
        private static readonly Color HPFillColor = new Color(0.2f, 0.8f, 0.2f);
        private static readonly Color HPLowColor = new Color(0.9f, 0.2f, 0.2f);
        private static readonly Color ManaFillColor = new Color(0.2f, 0.4f, 0.9f);
        private static readonly Color ShieldColor = new Color(0.3f, 0.6f, 1.0f, 0.7f);
        private static readonly Color DeadCellColor = new Color(0.3f, 0.1f, 0.1f, 0.4f);

        // State
        private Dictionary<string, (int row, int col)> _unitPositions = new Dictionary<string, (int, int)>();

        /// <summary>
        /// Create the grid UI under the given parent.
        /// </summary>
        public void Initialize(RectTransform parent)
        {
            _gridRoot = CreatePanel(parent, "CombatGrid",
                new Vector2(0.05f, 0.15f), new Vector2(0.95f, 0.85f));

            _cellBackgrounds = new Image[TotalRows, Cols];
            _cellNames = new Text[TotalRows, Cols];
            _hpBars = new Image[TotalRows, Cols];
            _hpFills = new Image[TotalRows, Cols];
            _manaBars = new Image[TotalRows, Cols];
            _manaFills = new Image[TotalRows, Cols];
            _shieldBars = new Image[TotalRows, Cols];
            _statusTexts = new Text[TotalRows, Cols];

            float cellW = 1f / Cols;
            float cellH = 1f / TotalRows;

            for (int row = 0; row < TotalRows; row++)
            {
                bool isEnemy = row < RowsPerSide;
                for (int col = 0; col < Cols; col++)
                {
                    float x0 = col * cellW;
                    float y0 = 1f - (row + 1) * cellH; // top-down
                    float x1 = x0 + cellW;
                    float y1 = y0 + cellH;

                    // Cell background
                    var cellBg = CreateImage(_gridRoot, $"Cell_{row}_{col}",
                        new Vector2(x0 + 0.005f, y0 + 0.005f),
                        new Vector2(x1 - 0.005f, y1 - 0.005f),
                        isEnemy ? EnemyRowColor : PlayerRowColor);
                    _cellBackgrounds[row, col] = cellBg;

                    var cellRect = cellBg.rectTransform;

                    // Unit name text
                    _cellNames[row, col] = CreateText(cellRect, "Name", "",
                        new Vector2(0.05f, 0.55f), new Vector2(0.95f, 0.95f), 11);

                    // HP bar background
                    _hpBars[row, col] = CreateImage(cellRect, "HPBar",
                        new Vector2(0.05f, 0.35f), new Vector2(0.95f, 0.50f), HPBarBG);

                    // HP fill
                    _hpFills[row, col] = CreateImage(_hpBars[row, col].rectTransform, "HPFill",
                        new Vector2(0f, 0f), new Vector2(1f, 1f), HPFillColor);

                    // Shield overlay
                    _shieldBars[row, col] = CreateImage(_hpBars[row, col].rectTransform, "Shield",
                        new Vector2(0f, 0f), new Vector2(0f, 1f), ShieldColor);

                    // Mana bar
                    _manaBars[row, col] = CreateImage(cellRect, "ManaBar",
                        new Vector2(0.05f, 0.22f), new Vector2(0.95f, 0.33f), HPBarBG);
                    _manaFills[row, col] = CreateImage(_manaBars[row, col].rectTransform, "ManaFill",
                        new Vector2(0f, 0f), new Vector2(0f, 1f), ManaFillColor);

                    // Status text
                    _statusTexts[row, col] = CreateText(cellRect, "Status", "",
                        new Vector2(0.05f, 0.02f), new Vector2(0.95f, 0.20f), 8);

                    // Start hidden
                    SetCellEmpty(row, col);
                }
            }

            // Divider line between enemy/player
            _dividerLine = CreateImage(_gridRoot, "Divider",
                new Vector2(0f, 0.495f), new Vector2(1f, 0.505f),
                new Color(0.5f, 0.5f, 0.5f, 0.8f));
        }

        /// <summary>
        /// Update the entire grid from a frame snapshot.
        /// </summary>
        public void UpdateFromSnapshot(CombatFrameSnapshot frame)
        {
            if (frame == null) return;

            // Clear all cells
            _unitPositions.Clear();
            for (int r = 0; r < TotalRows; r++)
                for (int c = 0; c < Cols; c++)
                    SetCellEmpty(r, c);

            // Place enemy units (rows 0-1, mapped from their grid position)
            foreach (var unit in frame.EnemyUnits)
            {
                if (!unit.IsAlive) continue;
                int gridRow = Mathf.Clamp(unit.Row, 0, RowsPerSide - 1);
                int gridCol = Mathf.Clamp(unit.Col, 0, Cols - 1);
                SetCellUnit(gridRow, gridCol, unit);
                _unitPositions[unit.UnitId] = (gridRow, gridCol);
            }

            // Place player units (rows 2-3)
            foreach (var unit in frame.PlayerUnits)
            {
                if (!unit.IsAlive) continue;
                int gridRow = Mathf.Clamp(unit.Row + RowsPerSide, RowsPerSide, TotalRows - 1);
                int gridCol = Mathf.Clamp(unit.Col, 0, Cols - 1);
                SetCellUnit(gridRow, gridCol, unit);
                _unitPositions[unit.UnitId] = (gridRow, gridCol);
            }

            // Show dead units dimmed
            foreach (var unit in frame.EnemyUnits)
            {
                if (unit.IsAlive) continue;
                int gridRow = Mathf.Clamp(unit.Row, 0, RowsPerSide - 1);
                int gridCol = Mathf.Clamp(unit.Col, 0, Cols - 1);
                SetCellDead(gridRow, gridCol, unit);
            }
            foreach (var unit in frame.PlayerUnits)
            {
                if (unit.IsAlive) continue;
                int gridRow = Mathf.Clamp(unit.Row + RowsPerSide, RowsPerSide, TotalRows - 1);
                int gridCol = Mathf.Clamp(unit.Col, 0, Cols - 1);
                SetCellDead(gridRow, gridCol, unit);
            }
        }

        /// <summary>
        /// Flash a cell to indicate an action (attack, heal, ability).
        /// </summary>
        public void FlashCell(string unitId, Color flashColor, float duration = 0.3f)
        {
            if (!_unitPositions.TryGetValue(unitId, out var pos)) return;
            var cell = _cellBackgrounds[pos.row, pos.col];
            if (cell != null)
                StartCoroutine(FlashCoroutine(cell, flashColor, duration));
        }

        /// <summary>Get the world position of a grid cell (for damage number spawning).</summary>
        public Vector3 GetCellWorldPosition(string unitId)
        {
            if (_unitPositions.TryGetValue(unitId, out var pos))
            {
                var cell = _cellBackgrounds[pos.row, pos.col];
                if (cell != null) return cell.rectTransform.position;
            }
            return Vector3.zero;
        }

        /// <summary>Get cell position by row/col.</summary>
        public Vector3 GetCellWorldPosition(int row, int col)
        {
            if (row >= 0 && row < TotalRows && col >= 0 && col < Cols)
            {
                var cell = _cellBackgrounds[row, col];
                if (cell != null) return cell.rectTransform.position;
            }
            return Vector3.zero;
        }

        // --- Private helpers ---

        private void SetCellUnit(int row, int col, UnitSnapshot unit)
        {
            if (row < 0 || row >= TotalRows || col < 0 || col >= Cols) return;

            var elemColor = PlaceholderFactory.GetElementColor(unit.Element);

            // Background tinted by element
            var bgColor = elemColor * 0.3f;
            bgColor.a = 0.7f;
            _cellBackgrounds[row, col].color = bgColor;

            // Name
            string starStr = unit.Stars > 0 ? new string('*', unit.Stars) : "";
            string evolvedMark = unit.IsEvolved ? "+" : "";
            string bossTag = unit.IsBoss ? "[BOSS] " : "";
            _cellNames[row, col].text = $"{bossTag}{unit.UnitName}{evolvedMark}\n{starStr}";
            _cellNames[row, col].color = Color.white;
            _cellNames[row, col].gameObject.SetActive(true);

            // HP bar
            float hpPct = unit.HPPercent;
            _hpFills[row, col].rectTransform.anchorMax = new Vector2(hpPct, 1f);
            _hpFills[row, col].color = hpPct < 0.3f ? HPLowColor : HPFillColor;
            _hpBars[row, col].gameObject.SetActive(true);

            // Shield
            if (unit.Shield > 0 && unit.MaxHP > 0)
            {
                float shieldPct = Mathf.Min(unit.Shield / unit.MaxHP, 1f - hpPct);
                _shieldBars[row, col].rectTransform.anchorMin = new Vector2(hpPct, 0f);
                _shieldBars[row, col].rectTransform.anchorMax = new Vector2(hpPct + shieldPct, 1f);
                _shieldBars[row, col].gameObject.SetActive(true);
            }
            else
            {
                _shieldBars[row, col].gameObject.SetActive(false);
            }

            // Mana bar
            if (unit.MaxMana > 0)
            {
                _manaFills[row, col].rectTransform.anchorMax = new Vector2(unit.ManaPercent, 1f);
                _manaBars[row, col].gameObject.SetActive(true);
            }
            else
            {
                _manaBars[row, col].gameObject.SetActive(false);
            }

            // Status effects
            if (unit.ActiveStatuses != null && unit.ActiveStatuses.Count > 0)
            {
                int show = Mathf.Min(unit.ActiveStatuses.Count, 3);
                string statusStr = string.Join(" ", unit.ActiveStatuses.GetRange(0, show));
                if (unit.ActiveStatuses.Count > 3)
                    statusStr += $" +{unit.ActiveStatuses.Count - 3}";
                _statusTexts[row, col].text = statusStr;
                _statusTexts[row, col].gameObject.SetActive(true);
            }
            else
            {
                _statusTexts[row, col].gameObject.SetActive(false);
            }

            // Casting glow
            if (unit.IsCasting)
            {
                var outline = _cellBackgrounds[row, col].gameObject.GetComponent<Outline>();
                if (outline == null)
                    outline = _cellBackgrounds[row, col].gameObject.AddComponent<Outline>();
                outline.effectColor = elemColor;
                outline.effectDistance = new Vector2(2, 2);
                outline.enabled = true;
            }
            else
            {
                var outline = _cellBackgrounds[row, col].gameObject.GetComponent<Outline>();
                if (outline != null) outline.enabled = false;
            }
        }

        private void SetCellDead(int row, int col, UnitSnapshot unit)
        {
            if (row < 0 || row >= TotalRows || col < 0 || col >= Cols) return;

            _cellBackgrounds[row, col].color = DeadCellColor;
            _cellNames[row, col].text = $"{unit.UnitName}\n[DEAD]";
            _cellNames[row, col].color = new Color(0.5f, 0.5f, 0.5f);
            _cellNames[row, col].gameObject.SetActive(true);
            _hpBars[row, col].gameObject.SetActive(false);
            _manaBars[row, col].gameObject.SetActive(false);
            _statusTexts[row, col].gameObject.SetActive(false);
        }

        private void SetCellEmpty(int row, int col)
        {
            bool isEnemy = row < RowsPerSide;
            _cellBackgrounds[row, col].color = isEnemy ? EnemyRowColor : PlayerRowColor;
            _cellNames[row, col].text = "";
            _cellNames[row, col].gameObject.SetActive(false);
            _hpBars[row, col].gameObject.SetActive(false);
            _manaBars[row, col].gameObject.SetActive(false);
            _shieldBars[row, col].gameObject.SetActive(false);
            _statusTexts[row, col].gameObject.SetActive(false);

            var outline = _cellBackgrounds[row, col].gameObject.GetComponent<Outline>();
            if (outline != null) outline.enabled = false;
        }

        private System.Collections.IEnumerator FlashCoroutine(Image cell, Color flashColor, float duration)
        {
            var origColor = cell.color;
            cell.color = flashColor;
            float t = 0f;
            while (t < duration)
            {
                t += Time.deltaTime;
                cell.color = Color.Lerp(flashColor, origColor, t / duration);
                yield return null;
            }
            cell.color = origColor;
        }

        // --- UI creation helpers ---

        private RectTransform CreatePanel(RectTransform parent, string name,
            Vector2 anchorMin, Vector2 anchorMax)
        {
            var go = new GameObject(name, typeof(RectTransform));
            var rt = go.GetComponent<RectTransform>();
            rt.SetParent(parent, false);
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            return rt;
        }

        private Image CreateImage(RectTransform parent, string name,
            Vector2 anchorMin, Vector2 anchorMax, Color color)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image));
            var rt = go.GetComponent<RectTransform>();
            rt.SetParent(parent, false);
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var img = go.GetComponent<Image>();
            img.color = color;
            return img;
        }

        private Text CreateText(RectTransform parent, string name, string content,
            Vector2 anchorMin, Vector2 anchorMax, int fontSize)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Text));
            var rt = go.GetComponent<RectTransform>();
            rt.SetParent(parent, false);
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var txt = go.GetComponent<Text>();
            txt.text = content;
            txt.fontSize = fontSize;
            txt.color = Color.white;
            txt.alignment = TextAnchor.MiddleCenter;
            txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            txt.horizontalOverflow = HorizontalWrapMode.Overflow;
            txt.verticalOverflow = VerticalWrapMode.Overflow;
            return txt;
        }
    }
}
