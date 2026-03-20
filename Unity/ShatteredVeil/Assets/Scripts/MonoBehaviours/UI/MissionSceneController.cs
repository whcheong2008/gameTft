using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using ShatteredVeil.Core.Missions;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Mission Select screen. Shows regions and their stages.
    /// Player picks a stage → (future) enters team select → combat.
    /// All UI built programmatically.
    /// </summary>
    public class MissionSceneController : MonoBehaviour
    {
        private Canvas canvas;
        private RectTransform contentRoot;
        private ScrollRect scrollRect;
        private int selectedRegion = 1;

        private static readonly Color GoldColor = new Color(0.886f, 0.718f, 0.078f);
        private static readonly Color DarkBg = new Color(0.06f, 0.06f, 0.1f);
        private static readonly Color PanelBg = new Color(0.08f, 0.08f, 0.14f);
        private static readonly Color ButtonBg = new Color(0.16f, 0.22f, 0.38f);

        private void Start()
        {
            BuildUI();
            RefreshStages();
        }

        private void BuildUI()
        {
            // Canvas
            var canvasGo = new GameObject("MissionCanvas");
            canvasGo.transform.SetParent(transform, false);
            canvas = canvasGo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280, 720);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();

            // Root panel
            var root = CreatePanel(canvasGo.transform, "Root", DarkBg);
            root.anchorMin = Vector2.zero;
            root.anchorMax = Vector2.one;
            root.offsetMin = Vector2.zero;
            root.offsetMax = Vector2.zero;

            // Title
            var title = CreateText(root, "Veil Expeditions", 24, GoldColor);
            SetAnchors(title.rectTransform, 0, 0.92f, 1, 0.98f);

            // Region tabs
            var tabPanel = CreatePanel(root, "RegionTabs", Color.clear);
            SetAnchors(tabPanel, 0.01f, 0.85f, 0.99f, 0.92f);
            var hlg = tabPanel.gameObject.AddComponent<HorizontalLayoutGroup>();
            hlg.spacing = 2;
            hlg.childForceExpandWidth = true;
            hlg.childForceExpandHeight = true;
            hlg.padding = new RectOffset(2, 2, 2, 2);

            for (int r = 1; r <= MissionCatalog.RegionCount; r++)
            {
                var region = MissionCatalog.GetRegion(r);
                var btnGo = new GameObject("Region_" + r);
                btnGo.transform.SetParent(tabPanel, false);
                btnGo.AddComponent<RectTransform>();
                var img = btnGo.AddComponent<Image>();
                img.color = r == selectedRegion ? GoldColor : ButtonBg;
                var btn = btnGo.AddComponent<Button>();

                var txtGo = new GameObject("Text");
                txtGo.transform.SetParent(btnGo.transform, false);
                var txtRt = txtGo.AddComponent<RectTransform>();
                txtRt.anchorMin = Vector2.zero;
                txtRt.anchorMax = Vector2.one;
                txtRt.offsetMin = Vector2.zero;
                txtRt.offsetMax = Vector2.zero;
                var txt = txtGo.AddComponent<Text>();
                txt.text = r.ToString();
                txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                txt.fontSize = 14;
                txt.color = r == selectedRegion ? Color.black : Color.white;
                txt.alignment = TextAnchor.MiddleCenter;

                int capturedR = r;
                btn.onClick.AddListener(() => { selectedRegion = capturedR; RefreshStages(); });
            }

            // Scroll area for stages
            var scrollGo = new GameObject("StageScroll");
            scrollGo.transform.SetParent(root, false);
            var scrollBg = scrollGo.AddComponent<Image>();
            scrollBg.color = PanelBg;
            var scrollRt = scrollBg.rectTransform;
            SetAnchors(scrollRt, 0.02f, 0.02f, 0.98f, 0.85f);

            var viewportGo = new GameObject("Viewport");
            viewportGo.transform.SetParent(scrollGo.transform, false);
            var vpImg = viewportGo.AddComponent<Image>();
            vpImg.color = Color.white;
            vpImg.raycastTarget = true;
            var vpRt = vpImg.rectTransform;
            vpRt.anchorMin = Vector2.zero;
            vpRt.anchorMax = Vector2.one;
            vpRt.offsetMin = Vector2.zero;
            vpRt.offsetMax = Vector2.zero;
            var mask = viewportGo.AddComponent<Mask>();
            mask.showMaskGraphic = false;

            var contentGo = new GameObject("Content");
            contentGo.transform.SetParent(viewportGo.transform, false);
            contentRoot = contentGo.AddComponent<RectTransform>();
            contentRoot.anchorMin = new Vector2(0, 1);
            contentRoot.anchorMax = new Vector2(1, 1);
            contentRoot.pivot = new Vector2(0.5f, 1);
            contentRoot.sizeDelta = new Vector2(0, 0);

            scrollRect = scrollGo.AddComponent<ScrollRect>();
            scrollRect.horizontal = false;
            scrollRect.vertical = true;
            scrollRect.content = contentRoot;
            scrollRect.viewport = vpRt;
            scrollRect.movementType = ScrollRect.MovementType.Clamped;
            scrollRect.scrollSensitivity = 20f;
        }

        private void RefreshStages()
        {
            // Clear
            for (int i = contentRoot.childCount - 1; i >= 0; i--)
                Destroy(contentRoot.GetChild(i).gameObject);

            var region = MissionCatalog.GetRegion(selectedRegion);
            if (region == null) return;

            // Region header
            var headerGo = new GameObject("Header");
            headerGo.transform.SetParent(contentRoot, false);
            var headerRt = headerGo.AddComponent<RectTransform>();
            headerRt.anchorMin = new Vector2(0, 1);
            headerRt.anchorMax = new Vector2(1, 1);
            headerRt.pivot = new Vector2(0.5f, 1);
            headerRt.anchoredPosition = new Vector2(0, -5);
            headerRt.sizeDelta = new Vector2(-20, 50);
            var headerTxt = headerGo.AddComponent<Text>();
            headerTxt.text = region.Name + " — " + region.Subtitle;
            headerTxt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            headerTxt.fontSize = 18;
            headerTxt.color = GoldColor;
            headerTxt.alignment = TextAnchor.MiddleCenter;

            float cardHeight = 70f;
            float spacing = 8f;
            float yOffset = 60f; // after header

            for (int i = 0; i < region.StageIds.Length; i++)
            {
                var stage = MissionCatalog.GetStage(region.StageIds[i]);
                if (stage == null) continue;

                var cardGo = new GameObject("Stage_" + stage.Id);
                cardGo.transform.SetParent(contentRoot, false);

                var cardRt = cardGo.AddComponent<RectTransform>();
                cardRt.anchorMin = new Vector2(0, 1);
                cardRt.anchorMax = new Vector2(1, 1);
                cardRt.pivot = new Vector2(0.5f, 1);
                cardRt.anchoredPosition = new Vector2(0, -(yOffset + i * (cardHeight + spacing)));
                cardRt.sizeDelta = new Vector2(-20, cardHeight);

                var cardBg = cardGo.AddComponent<Image>();
                bool isBoss = stage.IsBoss;
                cardBg.color = isBoss
                    ? new Color(0.25f, 0.15f, 0.1f)
                    : new Color(0.1f, 0.1f, 0.16f);

                // Stage info text
                var infoGo = new GameObject("Info");
                infoGo.transform.SetParent(cardGo.transform, false);
                var infoRt = infoGo.AddComponent<RectTransform>();
                infoRt.anchorMin = new Vector2(0.02f, 0);
                infoRt.anchorMax = new Vector2(0.7f, 1);
                infoRt.offsetMin = Vector2.zero;
                infoRt.offsetMax = Vector2.zero;
                var infoTxt = infoGo.AddComponent<Text>();
                string bossTag = isBoss ? " [BOSS]" : "";
                int waveCount = stage.Waves != null ? stage.Waves.Count : 1;
                infoTxt.text = $"{stage.StageNumber}. {stage.Name}{bossTag}\n" +
                               $"Lv.{stage.RequiredLevel}  |  {waveCount} wave(s)  |  " +
                               $"{(MissionCatalog.VEPerStage.TryGetValue(stage.Region, out var ve) ? ve : 200)} VE";
                infoTxt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                infoTxt.fontSize = 13;
                infoTxt.color = Color.white;
                infoTxt.alignment = TextAnchor.MiddleLeft;

                // Battle button
                var btnGo = new GameObject("BattleBtn");
                btnGo.transform.SetParent(cardGo.transform, false);
                var btnRt = btnGo.AddComponent<RectTransform>();
                btnRt.anchorMin = new Vector2(0.72f, 0.15f);
                btnRt.anchorMax = new Vector2(0.98f, 0.85f);
                btnRt.offsetMin = Vector2.zero;
                btnRt.offsetMax = Vector2.zero;
                var btnImg = btnGo.AddComponent<Image>();
                btnImg.color = isBoss ? new Color(0.6f, 0.2f, 0.1f) : ButtonBg;
                var btn = btnGo.AddComponent<Button>();

                var btnTxtGo = new GameObject("Text");
                btnTxtGo.transform.SetParent(btnGo.transform, false);
                var btnTxtRt = btnTxtGo.AddComponent<RectTransform>();
                btnTxtRt.anchorMin = Vector2.zero;
                btnTxtRt.anchorMax = Vector2.one;
                btnTxtRt.offsetMin = Vector2.zero;
                btnTxtRt.offsetMax = Vector2.zero;
                var btnTxt = btnTxtGo.AddComponent<Text>();
                btnTxt.text = "Battle";
                btnTxt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                btnTxt.fontSize = 16;
                btnTxt.color = GoldColor;
                btnTxt.alignment = TextAnchor.MiddleCenter;

                string stageId = stage.Id;
                btn.onClick.AddListener(() => OnBattleClicked(stageId));
            }

            // Set content height
            float totalHeight = yOffset + region.StageIds.Length * (cardHeight + spacing) + 20;
            contentRoot.sizeDelta = new Vector2(0, totalHeight);
        }

        private void OnBattleClicked(string stageId)
        {
            Debug.Log("[MissionSelect] Battle clicked: " + stageId);
            // Future: transition to TeamBuilder or Combat scene
            GameEventBus.FireToast("Selected: " + stageId);
        }

        // --- UI Helpers ---

        private RectTransform CreatePanel(Transform parent, string name, Color color)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var rt = go.AddComponent<RectTransform>();
            go.AddComponent<Image>().color = color;
            return rt;
        }

        private Text CreateText(RectTransform parent, string text, int size, Color color)
        {
            var go = new GameObject("Text");
            go.transform.SetParent(parent, false);
            go.AddComponent<RectTransform>();
            var txt = go.AddComponent<Text>();
            txt.text = text;
            txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            txt.fontSize = size;
            txt.color = color;
            txt.alignment = TextAnchor.MiddleCenter;
            return txt;
        }

        private void SetAnchors(RectTransform rt, float xMin, float yMin, float xMax, float yMax)
        {
            rt.anchorMin = new Vector2(xMin, yMin);
            rt.anchorMax = new Vector2(xMax, yMax);
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }
    }
}
