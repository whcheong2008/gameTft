using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.UI;
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
        var scene = EditorSceneManager.OpenScene(BootPath, OpenSceneMode.Single);

        foreach (var go in scene.GetRootGameObjects())
            Object.DestroyImmediate(go);

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
        camGo.AddComponent<AudioListener>();

        // --- Canvas ---
        var canvasGo = CreateSceneCanvas("BootCanvas", scene);

        // Loading text
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

        // --- EventSystem ---
        CreateEventSystem(scene);

        // --- SceneRouter ---
        var routerGo = new GameObject("SceneRouter");
        SceneManager.MoveGameObjectToScene(routerGo, scene);
        routerGo.AddComponent(typeof(ShatteredVeil.Mono.UI.SceneRouter));

        // --- GameBootstrap ---
        var bootstrapGo = new GameObject("GameBootstrap");
        SceneManager.MoveGameObjectToScene(bootstrapGo, scene);
        bootstrapGo.AddComponent(typeof(ShatteredVeil.Mono.UI.GameBootstrap));

        EditorSceneManager.SaveScene(scene, BootPath);
        Debug.Log("[SceneSetup] Boot scene configured.");
    }

    [MenuItem("Tools/Setup Scenes/Hub Only")]
    public static void SetupHubScene()
    {
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
        camGo.AddComponent<AudioListener>();

        // --- EventSystem ---
        CreateEventSystem(scene);

        // --- HubSceneController (creates all UI programmatically) ---
        var controllerGo = new GameObject("HubController");
        SceneManager.MoveGameObjectToScene(controllerGo, scene);
        controllerGo.AddComponent(typeof(ShatteredVeil.Mono.UI.HubSceneController));

        if (!AssetDatabase.IsValidFolder(ScenesFolder))
            AssetDatabase.CreateFolder("Assets", "Scenes");

        EditorSceneManager.SaveScene(scene, HubPath);
        Debug.Log("[SceneSetup] Hub scene configured.");
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

    private static void CreateEventSystem(Scene scene)
    {
        var esGo = new GameObject("EventSystem");
        SceneManager.MoveGameObjectToScene(esGo, scene);
        esGo.AddComponent<EventSystem>();
        esGo.AddComponent<InputSystemUIInputModule>();
    }

    private static GameObject CreateSceneCanvas(string name, Scene scene)
    {
        var canvasGo = new GameObject(name);
        SceneManager.MoveGameObjectToScene(canvasGo, scene);
        var canvas = canvasGo.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;

        var scaler = canvasGo.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1280, 720);
        scaler.matchWidthOrHeight = 0.5f;

        canvasGo.AddComponent<GraphicRaycaster>();
        return canvasGo;
    }
}
