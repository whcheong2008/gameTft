using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.UI;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

/// <summary>
/// Editor utility that wires up all game scenes.
/// Run via menu: Tools > Setup Scenes.
/// </summary>
public static class SceneSetup
{
    private const string ScenesFolder = "Assets/Scenes";
    private const string BootPath = ScenesFolder + "/Boot.unity";
    private const string HubPath = ScenesFolder + "/Hub.unity";
    private const string GachaPath = ScenesFolder + "/Gacha.unity";
    private const string RosterPath = ScenesFolder + "/Roster.unity";
    private const string TeamBuilderPath = ScenesFolder + "/TeamBuilder.unity";
    private const string MissionSelectPath = ScenesFolder + "/MissionSelect.unity";
    private const string CombatPath = ScenesFolder + "/Combat.unity";

    [MenuItem("Tools/Setup Scenes")]
    public static void SetupAll()
    {
        EnsureScenesFolder();
        SetupBootScene();
        SetupHubScene();
        SetupGachaScene();
        SetupRosterScene();
        SetupTeamBuilderScene();
        SetupMissionSelectScene();
        SetupCombatScene();
        SetupBuildSettings();
        // Reopen Boot scene at the end so play starts from Boot
        EditorSceneManager.OpenScene(BootPath, OpenSceneMode.Single);
        Debug.Log("[SceneSetup] Done — all 7 scenes configured, build settings updated.");
    }

    [MenuItem("Tools/Setup Scenes/Boot Only")]
    public static void SetupBootScene()
    {
        EnsureScenesFolder();
        var scene = EditorSceneManager.OpenScene(BootPath, OpenSceneMode.Single);

        foreach (var go in scene.GetRootGameObjects())
            Object.DestroyImmediate(go);

        // Camera
        var camGo = CreateCamera(scene);

        // Canvas with loading text
        var canvasGo = CreateSceneCanvas("BootCanvas", scene);
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

        // EventSystem
        CreateEventSystem(scene);

        // SceneRouter
        var routerGo = new GameObject("SceneRouter");
        SceneManager.MoveGameObjectToScene(routerGo, scene);
        routerGo.AddComponent(typeof(ShatteredVeil.Mono.UI.SceneRouter));

        // GameBootstrap
        var bootstrapGo = new GameObject("GameBootstrap");
        SceneManager.MoveGameObjectToScene(bootstrapGo, scene);
        bootstrapGo.AddComponent(typeof(ShatteredVeil.Mono.UI.GameBootstrap));

        EditorSceneManager.SaveScene(scene, BootPath);
        Debug.Log("[SceneSetup] Boot scene configured.");
    }

    [MenuItem("Tools/Setup Scenes/Hub Only")]
    public static void SetupHubScene()
    {
        EnsureScenesFolder();
        var scene = CreateCleanScene();

        CreateCamera(scene);
        CreateEventSystem(scene);

        var controllerGo = new GameObject("HubController");
        SceneManager.MoveGameObjectToScene(controllerGo, scene);
        controllerGo.AddComponent(typeof(ShatteredVeil.Mono.UI.HubSceneController));

        EditorSceneManager.SaveScene(scene, HubPath);
        Debug.Log("[SceneSetup] Hub scene configured.");
    }

    public static void SetupGachaScene()
    {
        var scene = CreateCleanScene();
        CreateCamera(scene);
        CreateEventSystem(scene);

        var controllerGo = new GameObject("GachaController");
        SceneManager.MoveGameObjectToScene(controllerGo, scene);
        controllerGo.AddComponent(typeof(ShatteredVeil.Mono.UI.GachaSceneController));

        EditorSceneManager.SaveScene(scene, GachaPath);
        Debug.Log("[SceneSetup] Gacha scene configured.");
    }

    public static void SetupRosterScene()
    {
        var scene = CreateCleanScene();
        CreateCamera(scene);
        CreateEventSystem(scene);

        var controllerGo = new GameObject("RosterController");
        SceneManager.MoveGameObjectToScene(controllerGo, scene);
        controllerGo.AddComponent(typeof(ShatteredVeil.Mono.UI.RosterSceneController));

        EditorSceneManager.SaveScene(scene, RosterPath);
        Debug.Log("[SceneSetup] Roster scene configured.");
    }

    public static void SetupTeamBuilderScene()
    {
        var scene = CreateCleanScene();
        CreateCamera(scene);
        CreateEventSystem(scene);

        var controllerGo = new GameObject("TeamBuilderController");
        SceneManager.MoveGameObjectToScene(controllerGo, scene);
        controllerGo.AddComponent(typeof(ShatteredVeil.Mono.UI.TeamBuilderSceneController));

        EditorSceneManager.SaveScene(scene, TeamBuilderPath);
        Debug.Log("[SceneSetup] TeamBuilder scene configured.");
    }

    public static void SetupMissionSelectScene()
    {
        var scene = CreateCleanScene();
        CreateCamera(scene);
        CreateEventSystem(scene);

        var controllerGo = new GameObject("MissionSelectController");
        SceneManager.MoveGameObjectToScene(controllerGo, scene);
        controllerGo.AddComponent(typeof(ShatteredVeil.Mono.UI.MissionSceneController));

        EditorSceneManager.SaveScene(scene, MissionSelectPath);
        Debug.Log("[SceneSetup] MissionSelect scene configured.");
    }

    public static void SetupCombatScene()
    {
        var scene = CreateCleanScene();
        CreateCamera(scene);
        CreateEventSystem(scene);

        var controllerGo = new GameObject("CombatController");
        SceneManager.MoveGameObjectToScene(controllerGo, scene);
        controllerGo.AddComponent(typeof(ShatteredVeil.Mono.UI.CombatSceneController));

        EditorSceneManager.SaveScene(scene, CombatPath);
        Debug.Log("[SceneSetup] Combat scene configured.");
    }

    [MenuItem("Tools/Setup Scenes/Build Settings Only")]
    public static void SetupBuildSettings()
    {
        var scenes = new[]
        {
            new EditorBuildSettingsScene(BootPath, true),
            new EditorBuildSettingsScene(HubPath, true),
            new EditorBuildSettingsScene(GachaPath, true),
            new EditorBuildSettingsScene(RosterPath, true),
            new EditorBuildSettingsScene(TeamBuilderPath, true),
            new EditorBuildSettingsScene(MissionSelectPath, true),
            new EditorBuildSettingsScene(CombatPath, true),
        };
        EditorBuildSettings.scenes = scenes;
        Debug.Log("[SceneSetup] Build settings updated: Boot(0), Hub(1), Gacha(2), Roster(3), TeamBuilder(4), MissionSelect(5), Combat(6)");
    }

    // === Helpers ===

    private static void EnsureScenesFolder()
    {
        if (!AssetDatabase.IsValidFolder(ScenesFolder))
            AssetDatabase.CreateFolder("Assets", "Scenes");
    }

    private static Scene CreateCleanScene()
    {
        return EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
    }

    private static GameObject CreateCamera(Scene scene)
    {
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
        return camGo;
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
