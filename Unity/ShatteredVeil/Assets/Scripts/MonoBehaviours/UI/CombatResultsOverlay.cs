using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Full-screen overlay showing combat results: victory/defeat, star rating,
    /// rewards, MVP, and scoreboard. Appears when combat ends.
    /// </summary>
    public class CombatResultsOverlay : MonoBehaviour
    {
        private Canvas _canvas;
        private GameObject _root;
        private Text _titleText;
        private Text _starsText;
        private Text _rewardsText;
        private Text _mvpText;
        private Text _scoreboardText;
        private Button _continueButton;

        public event Action OnContinueClicked;

        private static readonly Color VictoryColor = new Color(0.886f, 0.718f, 0.078f); // Gold
        private static readonly Color DefeatColor = new Color(0.8f, 0.2f, 0.2f);
        private static readonly Color PanelBG = new Color(0.06f, 0.06f, 0.10f, 0.95f);
        private static readonly Color CardBG = new Color(0.10f, 0.10f, 0.16f);

        /// <summary>
        /// Create the results overlay UI (hidden by default).
        /// </summary>
        public void Initialize(Transform canvasParent)
        {
            // Create a separate canvas at high sort order
            var canvasGO = new GameObject("ResultsCanvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            _canvas = canvasGO.GetComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 500;
            canvasGO.transform.SetParent(canvasParent, false);

            var scaler = canvasGO.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            // Dark overlay
            _root = new GameObject("ResultsRoot", typeof(RectTransform), typeof(Image));
            var rootRT = _root.GetComponent<RectTransform>();
            rootRT.SetParent(_canvas.transform, false);
            rootRT.anchorMin = Vector2.zero;
            rootRT.anchorMax = Vector2.one;
            rootRT.offsetMin = Vector2.zero;
            rootRT.offsetMax = Vector2.zero;
            _root.GetComponent<Image>().color = PanelBG;

            // Content panel (centered, 800x600)
            var panel = CreatePanel(rootRT, "Panel",
                new Vector2(0.2f, 0.1f), new Vector2(0.8f, 0.9f), CardBG);

            // Title (Victory/Defeat)
            _titleText = CreateText(panel, "Title", "VICTORY",
                new Vector2(0.05f, 0.82f), new Vector2(0.95f, 0.96f), 36);
            _titleText.fontStyle = FontStyle.Bold;

            // Stars
            _starsText = CreateText(panel, "Stars", "",
                new Vector2(0.05f, 0.72f), new Vector2(0.95f, 0.82f), 28);

            // Rewards
            _rewardsText = CreateText(panel, "Rewards", "",
                new Vector2(0.05f, 0.50f), new Vector2(0.95f, 0.72f), 16);
            _rewardsText.alignment = TextAnchor.UpperCenter;

            // MVP
            _mvpText = CreateText(panel, "MVP", "",
                new Vector2(0.05f, 0.38f), new Vector2(0.95f, 0.50f), 14);

            // Scoreboard
            _scoreboardText = CreateText(panel, "Scoreboard", "",
                new Vector2(0.05f, 0.12f), new Vector2(0.95f, 0.38f), 11);
            _scoreboardText.alignment = TextAnchor.UpperLeft;

            // Continue button
            var btnGO = new GameObject("ContinueBtn", typeof(RectTransform), typeof(Image), typeof(Button));
            var btnRT = btnGO.GetComponent<RectTransform>();
            btnRT.SetParent(panel, false);
            btnRT.anchorMin = new Vector2(0.3f, 0.02f);
            btnRT.anchorMax = new Vector2(0.7f, 0.10f);
            btnRT.offsetMin = Vector2.zero;
            btnRT.offsetMax = Vector2.zero;
            btnGO.GetComponent<Image>().color = new Color(0.16f, 0.22f, 0.38f);

            _continueButton = btnGO.GetComponent<Button>();
            _continueButton.onClick.AddListener(() => OnContinueClicked?.Invoke());

            var btnText = CreateText(btnRT, "BtnText", "Continue",
                Vector2.zero, Vector2.one, 18);
            btnText.color = Color.white;

            _root.SetActive(false);
        }

        /// <summary>
        /// Show the results overlay with the given data.
        /// </summary>
        public void Show(bool victory, int stars, CombatRewards rewards,
            IReadOnlyDictionary<string, UnitCombatStats> unitStats)
        {
            // Title
            _titleText.text = victory ? "VICTORY" : "DEFEAT";
            _titleText.color = victory ? VictoryColor : DefeatColor;

            // Stars
            if (victory)
            {
                string starStr = "";
                for (int i = 0; i < 3; i++)
                    starStr += i < stars ? " * " : " - ";
                _starsText.text = starStr;
                _starsText.color = VictoryColor;
            }
            else
            {
                _starsText.text = "";
            }

            // Rewards
            if (rewards != null)
            {
                string rewardLines = $"VE: +{rewards.VE}    XP: +{rewards.XP}";
                if (rewards.UnitDropCount > 0)
                    rewardLines += $"\nUnit Drops: {rewards.UnitDropCount}";
                _rewardsText.text = rewardLines;
            }
            else
            {
                _rewardsText.text = "";
            }

            // MVP
            if (rewards?.MVPUnitName != null)
            {
                _mvpText.text = $"MVP: {rewards.MVPUnitName} - {rewards.MVPDamage:F0} damage, {rewards.MVPKills} kills";
                _mvpText.color = VictoryColor;
            }
            else
            {
                _mvpText.text = "";
            }

            // Scoreboard
            BuildScoreboard(unitStats);

            _root.SetActive(true);
            StartCoroutine(FadeIn());
        }

        /// <summary>Hide the overlay.</summary>
        public void Hide()
        {
            _root.SetActive(false);
        }

        private void BuildScoreboard(IReadOnlyDictionary<string, UnitCombatStats> unitStats)
        {
            if (unitStats == null)
            {
                _scoreboardText.text = "";
                return;
            }

            var lines = new List<string>();
            lines.Add("--- Player Team ---");

            var sorted = new List<UnitCombatStats>();
            foreach (var kvp in unitStats)
            {
                if (kvp.Value.Side == "player")
                    sorted.Add(kvp.Value);
            }
            sorted.Sort((a, b) => b.DamageDealt.CompareTo(a.DamageDealt));

            foreach (var s in sorted)
            {
                string alive = s.IsAlive ? "" : " [DEAD]";
                lines.Add($"  {s.UnitName}{alive}: {s.DamageDealt:F0} dmg | {s.HealingDone:F0} heal | {s.Kills} kills");
            }

            lines.Add("");
            lines.Add("--- Enemy Team ---");

            var enemySorted = new List<UnitCombatStats>();
            foreach (var kvp in unitStats)
            {
                if (kvp.Value.Side == "enemy")
                    enemySorted.Add(kvp.Value);
            }
            enemySorted.Sort((a, b) => b.DamageTaken.CompareTo(a.DamageTaken));

            foreach (var s in enemySorted)
            {
                lines.Add($"  {s.UnitName}: {s.DamageTaken:F0} taken | {s.DamageDealt:F0} dealt");
            }

            _scoreboardText.text = string.Join("\n", lines);
        }

        private IEnumerator FadeIn()
        {
            var canvasGroup = _root.GetComponent<CanvasGroup>();
            if (canvasGroup == null)
                canvasGroup = _root.AddComponent<CanvasGroup>();

            canvasGroup.alpha = 0f;
            float t = 0f;
            while (t < 0.5f)
            {
                t += Time.deltaTime;
                canvasGroup.alpha = Mathf.Lerp(0f, 1f, t / 0.5f);
                yield return null;
            }
            canvasGroup.alpha = 1f;
        }

        // --- UI helpers ---

        private RectTransform CreatePanel(RectTransform parent, string name,
            Vector2 anchorMin, Vector2 anchorMax, Color bgColor)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image));
            var rt = go.GetComponent<RectTransform>();
            rt.SetParent(parent, false);
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            go.GetComponent<Image>().color = bgColor;
            return rt;
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
            return txt;
        }
    }
}
