using UnityEngine;
using UnityEngine.UI;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Bottom navigation bar for the Hub scene.
    /// 5 buttons: Hub, Gacha, Roster, Team, Missions.
    /// Each button triggers SceneRouter.LoadScene().
    /// </summary>
    public class BottomNavController : MonoBehaviour
    {
        private Canvas navCanvas;

        private static readonly NavItem[] NavItems = new NavItem[]
        {
            new NavItem { Label = "Hub",     Scene = "Hub",           Color = new Color(0.886f, 0.718f, 0.078f) },
            new NavItem { Label = "Gacha",   Scene = "Gacha",         Color = new Color(0.6f, 0.2f, 0.8f) },
            new NavItem { Label = "Roster",  Scene = "Roster",        Color = new Color(0.2f, 0.6f, 0.9f) },
            new NavItem { Label = "Team",    Scene = "TeamBuilder",   Color = new Color(0.2f, 0.8f, 0.4f) },
            new NavItem { Label = "Missions",Scene = "MissionSelect", Color = new Color(0.9f, 0.3f, 0.2f) },
        };

        private struct NavItem
        {
            public string Label;
            public string Scene;
            public Color Color;
        }

        private void Start()
        {
            CreateNavBar();
        }

        private void CreateNavBar()
        {
            // Canvas
            var canvasGo = new GameObject("BottomNavCanvas");
            canvasGo.transform.SetParent(transform, false);
            navCanvas = canvasGo.AddComponent<Canvas>();
            navCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
            navCanvas.sortingOrder = 200;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280, 720);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGo.AddComponent<GraphicRaycaster>();

            // Nav bar background
            var barGo = new GameObject("NavBar");
            barGo.transform.SetParent(canvasGo.transform, false);
            var barImg = barGo.AddComponent<Image>();
            barImg.color = new Color(0.08f, 0.08f, 0.14f);
            var barRt = barImg.rectTransform;
            barRt.anchorMin = new Vector2(0, 0);
            barRt.anchorMax = new Vector2(1, 0);
            barRt.pivot = new Vector2(0.5f, 0);
            barRt.anchoredPosition = Vector2.zero;
            barRt.sizeDelta = new Vector2(0, 60);

            // Horizontal layout
            var hlg = barGo.AddComponent<HorizontalLayoutGroup>();
            hlg.spacing = 4;
            hlg.padding = new RectOffset(8, 8, 8, 8);
            hlg.childForceExpandWidth = true;
            hlg.childForceExpandHeight = true;
            hlg.childControlWidth = true;
            hlg.childControlHeight = true;

            // Create buttons
            for (int i = 0; i < NavItems.Length; i++)
            {
                CreateNavButton(barGo.transform, NavItems[i]);
            }
        }

        private void CreateNavButton(Transform parent, NavItem item)
        {
            var btnGo = new GameObject("Nav_" + item.Label);
            btnGo.transform.SetParent(parent, false);

            var btnImg = btnGo.AddComponent<Image>();
            btnImg.color = new Color(0.12f, 0.12f, 0.2f);

            var btn = btnGo.AddComponent<Button>();
            var scene = item.Scene;
            btn.onClick.AddListener(() => OnNavClicked(scene));

            // Icon placeholder (colored square)
            var iconGo = new GameObject("Icon");
            iconGo.transform.SetParent(btnGo.transform, false);
            var iconImg = iconGo.AddComponent<Image>();
            iconImg.color = item.Color;
            var iconRt = iconImg.rectTransform;
            iconRt.anchorMin = new Vector2(0.5f, 0.5f);
            iconRt.anchorMax = new Vector2(0.5f, 0.5f);
            iconRt.anchoredPosition = new Vector2(0, 12);
            iconRt.sizeDelta = new Vector2(40, 40);

            // Label
            var labelGo = new GameObject("Label");
            labelGo.transform.SetParent(btnGo.transform, false);
            var labelText = labelGo.AddComponent<Text>();
            labelText.text = item.Label;
            labelText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            labelText.fontSize = 20;
            labelText.color = item.Color;
            labelText.alignment = TextAnchor.UpperCenter;
            var labelRt = labelText.rectTransform;
            labelRt.anchorMin = new Vector2(0, 0);
            labelRt.anchorMax = new Vector2(1, 0.35f);
            labelRt.offsetMin = Vector2.zero;
            labelRt.offsetMax = Vector2.zero;
        }

        private void OnNavClicked(string sceneName)
        {
            if (SceneRouter.Instance != null)
            {
                // Don't reload current scene
                if (SceneRouter.Instance.CurrentScene == sceneName) return;
                SceneRouter.Instance.LoadScene(sceneName);
            }
            else
            {
                Debug.LogWarning("[BottomNav] SceneRouter not found.");
            }
        }
    }
}
