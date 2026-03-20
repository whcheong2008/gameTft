using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

/// <summary>
/// Editor utility that wires up Boot and Hub scenes with cameras, canvases, and controllers.
/// Run via menu: Tools > Setup Scenes.
/// </summary>
public static class SceneSetup
{
    private const string ScenesFolder = "Assets/Scenes";
    private const string BootPath = ScenesFolder + "/Boot.unity";
    private const string HubPath = ScenesFolder + "/Hub.unity";

    [MenuItem("Tools/Setup Scenes")]
    public static void SetupAll()
    {
        SetupBootScene();
        SetupHubScene();
        SetupBuildSettings();
        Debug.Log("[SceneSetup] Done — Boot and Hub scenes configured, build settings updated.");
    }

    [MenuItem("Tools/Setup Scenes/Boot Only")]
    public static void SetupBootScene()
    {
        // Create or open Boot scene
        var scene = EditorSceneManager.OpenScene(BootPath, OpenSceneMode.Single);

        // Clear existing objects
        foreach (var go in scene.GetRootGameObjects())
            Object.DestroyImmediate(go);

        // --- Main Camera ---
        var camGo = new GameObject("Main Camera");
        SceneManager.MoveGameObjectToScene(camGo, scene);
        camGo.tag = "MainCamera";
        var cam = camGo.AddComponent<Camera>();
        cam.clearFlags = CameraClearFlags.SolidColor;
        cam.backgroundColor = new Color(0.05f, 0.05f, 0.1f, 1f); // Dark blue-black
        cam.orthographic = true;
        cam.orthographicSize = 5;
        cam.nearClipPlane = -1;
        cam.farClipPlane = 100;
        camGo.AddComponent<AudioListener>();

        // --- Canvas ---
        var canvasGo = CreateSceneCanvas("BootCanvas", scene);

        // Loading text placeholder
        var loadingGo = new GameObject("LoadingText");
        loadingGo.transform.SetParent(canvasGo.transform, false);
        var loadingText = loadingGo.AddComponent<Text>();
        loadingText.text = "Loading...";
        loadingText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        loadingText.fontSize = 36;
        loadingText.color = Color.white;
        loadingText.alignment = TextAnchor.MiddleCenter;
        var loadingRt = loadingText.rectTransform;
        loadingRt.anchorMin = new Vector2(0.3f, 0.45f);
        loadingRt.anchorMax = new Vector2(0.7f, 0.55f);
        loadingRt.offsetMin = Vector2.zero;
        loadingRt.offsetMax = Vector2.zero;

        // --- SceneRouter ---
        var routerGo = new GameObject("SceneRouter");
        SceneManager.MoveGameObjectToScene(routerGo, scene);
        routerGo.AddComponent(typeof(ShatteredVeil.Mono.UI.SceneRouter));

        // --- GameBootstrap ---
        var bootstrapGo = new GameObject("GameBootstrap");
        SceneManager.MoveGameObjectToScene(bootstrapGo, scene);
        bootstrapGo.AddComponent(typeof(ShatteredVeil.Mono.UI.GameBootstrap));

        EditorSceneManager.SaveScene(scene, BootPath);
        Debug.Log("[SceneSetup] Boot scene configured: Camera + Canvas + SceneRouter + GameBootstrap");
    }

    [MenuItem("Tools/Setup Scenes/Hub Only")]
    public static void SetupHubScene()
    {
        // Create Hub scene (doesn't exist yet)
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        // --- Main Camera ---
        var camGo = new GameObject("Main Camera");
        SceneManager.MoveGameObjectToScene(camGo, scene);
        camGo.tag = "MainCamera";
        var cam = camGo.AddComponent<Camera>();
        cam.clearFlags = CameraClearFlags.SolidColor;
        cam.backgroundColor = new Color(0.05f, 0.05f, 0.1f, 1f);
        cam.orthographic = true;
        cam.orthographicSize = 5;
        cam.nearClipPlane = -1;
        cam.farClipPlane = 100;
        camGo.AddComponent<AudioListener>(); // Boot scene is unloaded, so Hub needs its own

        // No scene-level Canvas — HubSceneController creates all UI programmatically
        // to avoid duplicate canvases and UI elements.

        // --- HubSceneController ---
        var controllerGo = new GameObject("HubController");
        SceneManager.MoveGameObjectToScene(controllerGo, scene);
        controllerGo.AddComponent(typeof(ShatteredVeil.Mono.UI.HubSceneController));

        // Ensure Scenes folder exists
        if (!AssetDatabase.IsValidFolder(ScenesFolder))
            AssetDatabase.CreateFolder("Assets", "Scenes");

        EditorSceneManager.SaveScene(scene, HubPath);
        Debug.Log("[SceneSetup] Hub scene configured: Camera + HubSceneController (UI created programmatically)");
    }

    [MenuItem("Tools/Setup Scenes/Build Settings Only")]
    public static void SetupBuildSettings()
    {
        var scenes = new[]
        {
            new EditorBuildSettingsScene(BootPath, true),
            new EditorBuildSettingsScene(HubPath, true),
        };
        EditorBuildSettings.scenes = scenes;
        Debug.Log("[SceneSetup] Build settings updated: Boot (0), Hub (1)");
    }

    private static GameObject CreateSceneCanvas(string name, Scene scene)
    {
        var canvasGo = new GameObject(name);
        SceneManager.MoveGameObjectToScene(canvasGo, scene);
        var canvas = canvasGo.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;

        var scaler = canvasGo.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1080, 1920);
        scaler.matchWidthOrHeight = 0.5f;

        canvasGo.AddComponent<GraphicRaycaster>();
        return canvasGo;
    }

    private static GameObject CreateUIPlaceholder(string name, Transform parent,
        Vector2 anchorMin, Vector2 anchorMax, Vector2 pivot,
        Vector2 anchoredPosition, Vector2 sizeDelta)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);

        // Background
        var bg = go.AddComponent<Image>();
        bg.color = new Color(0.1f, 0.1f, 0.15f, 0.9f);
        var rt = bg.rectTransform;
        rt.anchorMin = anchorMin;
        rt.anchorMax = anchorMax;
        rt.pivot = pivot;
        rt.anchoredPosition = anchoredPosition;
        rt.sizeDelta = sizeDelta;

        // Label text
        var textGo = new GameObject("Label");
        textGo.transform.SetParent(go.transform, false);
        var text = textGo.AddComponent<Text>();
        text.text = name;
        text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        text.fontSize = 28;
        text.color = new Color(0.886f, 0.718f, 0.078f); // Gold accent
        text.alignment = TextAnchor.MiddleCenter;
        var textRt = text.rectTransform;
        textRt.anchorMin = Vector2.zero;
        textRt.anchorMax = Vector2.one;
        textRt.offsetMin = Vector2.zero;
        textRt.offsetMax = Vector2.zero;

        return go;
    }
}
