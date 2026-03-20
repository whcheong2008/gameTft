using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using ShatteredVeil.Core.Combat;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Main controller for the Combat scene. Orchestrates:
    /// - Grid rendering (CombatGridRenderer)
    /// - Damage numbers (DamageNumberController)
    /// - Combat playback (CombatPlayback — pure C#)
    /// - Speed controls (1x/2x/4x)
    /// - Wave transitions with repositioning
    /// - Results overlay (CombatResultsOverlay)
    /// - Synergy bar
    /// - Combat log
    /// - "FIGHT!" start text
    ///
    /// Architecture: receives pre-computed combat events from CombatEngine,
    /// then plays them back visually. The scene controller is purely a visualization
    /// layer — no combat logic here.
    /// </summary>
    public class CombatSceneController : MonoBehaviour
    {
        // Sub-controllers
        private CombatGridRenderer _gridRenderer;
        private DamageNumberController _damageNumbers;
        private CombatResultsOverlay _resultsOverlay;

        // UI references
        private Canvas _mainCanvas;
        private RectTransform _canvasRT;
        private Text _waveText;
        private Text _turnText;
        private Text _speedText;
        private Button _speedButton;
        private Button _pauseButton;
        private Text _pauseText;
        private Button _skipButton;
        private ScrollRect _logScroll;
        private Text _logText;
        private RectTransform _synergyPanel;
        private Text _synergyText;
        private GameObject _startOverlay;
        private Text _startText;

        // Wave transition UI
        private GameObject _waveTransitionPanel;
        private Text _waveTransitionText;
        private Button _waveContinueButton;

        // Playback
        private CombatPlayback _playback;
        private bool _initialized;

        // Colors
        private static readonly Color GoldColor = new Color(0.886f, 0.718f, 0.078f);
        private static readonly Color DarkBG = new Color(0.06f, 0.06f, 0.10f);
        private static readonly Color PanelBG = new Color(0.08f, 0.08f, 0.14f);
        private static readonly Color ButtonBG = new Color(0.16f, 0.22f, 0.38f);

        /// <summary>
        /// Initialize the combat scene with pre-computed events and keyframes.
        /// Called by the game flow manager after CombatEngine produces results.
        /// </summary>
        public void Initialize(List<CombatEvent> events, List<CombatFrameSnapshot> keyFrames, int totalWaves)
        {
            _playback = new CombatPlayback(events, keyFrames, totalWaves);

            BuildUI();
            SubscribeToPlayback();

            _initialized = true;

            // Show "FIGHT!" text, then start playback
            StartCoroutine(ShowStartSequence());
        }

        /// <summary>
        /// Initialize with a pre-built playback instance (for testing / dependency injection).
        /// </summary>
        public void Initialize(CombatPlayback playback)
        {
            _playback = playback;

            BuildUI();
            SubscribeToPlayback();

            _initialized = true;
            StartCoroutine(ShowStartSequence());
        }

        private void Update()
        {
            if (!_initialized || _playback == null) return;

            int eventsProcessed = _playback.Tick(Time.deltaTime);

            // Update HUD
            UpdateHUD();
        }

        private void OnDestroy()
        {
            UnsubscribeFromPlayback();
        }

        // ===== UI CONSTRUCTION =====

        private void BuildUI()
        {
            // Main canvas
            var canvasGO = new GameObject("CombatCanvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            _mainCanvas = canvasGO.GetComponent<Canvas>();
            _mainCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _mainCanvas.sortingOrder = 100;

            var scaler = canvasGO.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            _canvasRT = canvasGO.GetComponent<RectTransform>();

            // Background
            var bgImage = canvasGO.AddComponent<Image>();
            bgImage.color = DarkBG;

            // Top bar: wave info + turn counter
            BuildTopBar(_canvasRT);

            // Grid renderer
            _gridRenderer = gameObject.AddComponent<CombatGridRenderer>();
            _gridRenderer.Initialize(_canvasRT);

            // Damage numbers
            _damageNumbers = gameObject.AddComponent<DamageNumberController>();
            _damageNumbers.Initialize(_canvasRT);

            // Bottom bar: speed, pause, skip, log
            BuildBottomBar(_canvasRT);

            // Synergy bar (right side)
            BuildSynergyPanel(_canvasRT);

            // Start overlay ("FIGHT!")
            BuildStartOverlay(_canvasRT);

            // Wave transition panel
            BuildWaveTransitionPanel(_canvasRT);

            // Results overlay
            _resultsOverlay = gameObject.AddComponent<CombatResultsOverlay>();
            _resultsOverlay.Initialize(canvasGO.transform);
            _resultsOverlay.OnContinueClicked += HandleResultsContinue;
        }

        private void BuildTopBar(RectTransform parent)
        {
            var topBar = CreatePanel(parent, "TopBar",
                new Vector2(0f, 0.92f), new Vector2(1f, 1f), PanelBG);

            _waveText = CreateText(topBar, "WaveText", "Wave 1",
                new Vector2(0.02f, 0f), new Vector2(0.3f, 1f), 18);
            _waveText.alignment = TextAnchor.MiddleLeft;
            _waveText.color = GoldColor;

            _turnText = CreateText(topBar, "TurnText", "Turn 0",
                new Vector2(0.7f, 0f), new Vector2(0.98f, 1f), 16);
            _turnText.alignment = TextAnchor.MiddleRight;
        }

        private void BuildBottomBar(RectTransform parent)
        {
            var bottomBar = CreatePanel(parent, "BottomBar",
                new Vector2(0f, 0f), new Vector2(1f, 0.14f), PanelBG);

            // Speed button
            var speedBtnGO = CreateButton(bottomBar, "SpeedBtn", "1x",
                new Vector2(0.02f, 0.15f), new Vector2(0.12f, 0.85f));
            _speedButton = speedBtnGO.GetComponent<Button>();
            _speedText = speedBtnGO.GetComponentInChildren<Text>();
            _speedButton.onClick.AddListener(HandleSpeedClick);

            // Pause button
            var pauseBtnGO = CreateButton(bottomBar, "PauseBtn", "||",
                new Vector2(0.13f, 0.15f), new Vector2(0.23f, 0.85f));
            _pauseButton = pauseBtnGO.GetComponent<Button>();
            _pauseText = pauseBtnGO.GetComponentInChildren<Text>();
            _pauseButton.onClick.AddListener(HandlePauseClick);

            // Skip button
            var skipBtnGO = CreateButton(bottomBar, "SkipBtn", ">>|",
                new Vector2(0.24f, 0.15f), new Vector2(0.34f, 0.85f));
            _skipButton = skipBtnGO.GetComponent<Button>();
            _skipButton.onClick.AddListener(HandleSkipClick);

            // Combat log
            BuildCombatLog(bottomBar);
        }

        private void BuildCombatLog(RectTransform parent)
        {
            // Log scroll area
            var scrollGO = new GameObject("LogScroll", typeof(RectTransform), typeof(ScrollRect), typeof(Image));
            var scrollRT = scrollGO.GetComponent<RectTransform>();
            scrollRT.SetParent(parent, false);
            scrollRT.anchorMin = new Vector2(0.36f, 0.05f);
            scrollRT.anchorMax = new Vector2(0.98f, 0.95f);
            scrollRT.offsetMin = Vector2.zero;
            scrollRT.offsetMax = Vector2.zero;
            scrollGO.GetComponent<Image>().color = new Color(0.04f, 0.04f, 0.08f, 0.8f);

            _logScroll = scrollGO.GetComponent<ScrollRect>();
            _logScroll.horizontal = false;
            _logScroll.vertical = true;
            _logScroll.movementType = ScrollRect.MovementType.Clamped;

            // Content
            var contentGO = new GameObject("Content", typeof(RectTransform));
            var contentRT = contentGO.GetComponent<RectTransform>();
            contentRT.SetParent(scrollRT, false);
            contentRT.anchorMin = new Vector2(0f, 1f);
            contentRT.anchorMax = new Vector2(1f, 1f);
            contentRT.pivot = new Vector2(0f, 1f);
            contentRT.sizeDelta = new Vector2(0, 0);

            var csf = contentGO.AddComponent<ContentSizeFitter>();
            csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            _logText = CreateText(contentRT, "LogText", "",
                Vector2.zero, Vector2.one, 11);
            _logText.alignment = TextAnchor.UpperLeft;
            _logText.verticalOverflow = VerticalWrapMode.Overflow;
            _logText.horizontalOverflow = HorizontalWrapMode.Wrap;

            // Fix layout
            var layoutElem = _logText.gameObject.AddComponent<LayoutElement>();
            layoutElem.preferredWidth = -1;

            _logScroll.content = contentRT;

            // Viewport mask
            var viewport = scrollRT;
            _logScroll.viewport = viewport;
            var mask = scrollGO.AddComponent<Mask>();
            mask.showMaskGraphic = true;
        }

        private void BuildSynergyPanel(RectTransform parent)
        {
            _synergyPanel = CreatePanel(parent, "SynergyPanel",
                new Vector2(0.80f, 0.15f), new Vector2(1f, 0.92f),
                new Color(0.08f, 0.08f, 0.14f, 0.85f));

            var titleText = CreateText(_synergyPanel, "SynergyTitle", "Synergies",
                new Vector2(0.05f, 0.92f), new Vector2(0.95f, 1f), 13);
            titleText.color = GoldColor;

            _synergyText = CreateText(_synergyPanel, "SynergyList", "",
                new Vector2(0.05f, 0f), new Vector2(0.95f, 0.92f), 10);
            _synergyText.alignment = TextAnchor.UpperLeft;
            _synergyText.verticalOverflow = VerticalWrapMode.Overflow;
        }

        private void BuildStartOverlay(RectTransform parent)
        {
            _startOverlay = new GameObject("StartOverlay", typeof(RectTransform), typeof(Image));
            var rt = _startOverlay.GetComponent<RectTransform>();
            rt.SetParent(parent, false);
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            _startOverlay.GetComponent<Image>().color = new Color(0, 0, 0, 0.6f);

            _startText = CreateText(rt, "FightText", "FIGHT!",
                new Vector2(0.2f, 0.3f), new Vector2(0.8f, 0.7f), 72);
            _startText.color = GoldColor;
            _startText.fontStyle = FontStyle.Bold;

            _startOverlay.SetActive(false);
        }

        private void BuildWaveTransitionPanel(RectTransform parent)
        {
            _waveTransitionPanel = new GameObject("WaveTransition", typeof(RectTransform), typeof(Image));
            var rt = _waveTransitionPanel.GetComponent<RectTransform>();
            rt.SetParent(parent, false);
            rt.anchorMin = new Vector2(0.2f, 0.3f);
            rt.anchorMax = new Vector2(0.8f, 0.7f);
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            _waveTransitionPanel.GetComponent<Image>().color = PanelBG;

            _waveTransitionText = CreateText(rt, "WaveText", "Wave Complete!",
                new Vector2(0.1f, 0.5f), new Vector2(0.9f, 0.9f), 28);
            _waveTransitionText.color = GoldColor;

            var info = CreateText(rt, "Info", "Units healed. Reposition and continue.",
                new Vector2(0.1f, 0.3f), new Vector2(0.9f, 0.5f), 14);

            var btnGO = CreateButton(rt, "ContinueBtn", "Continue",
                new Vector2(0.3f, 0.05f), new Vector2(0.7f, 0.25f));
            _waveContinueButton = btnGO.GetComponent<Button>();
            _waveContinueButton.onClick.AddListener(HandleWaveContinue);

            _waveTransitionPanel.SetActive(false);
        }

        // ===== PLAYBACK CALLBACKS =====

        private void SubscribeToPlayback()
        {
            _playback.OnEventPlayed += HandleEvent;
            _playback.OnFrameUpdated += HandleFrameUpdate;
            _playback.OnStateChanged += HandleStateChange;
            _playback.OnWaveTransition += HandleWaveTransition;
            _playback.OnCombatFinished += HandleCombatFinished;
        }

        private void UnsubscribeFromPlayback()
        {
            if (_playback == null) return;
            _playback.OnEventPlayed -= HandleEvent;
            _playback.OnFrameUpdated -= HandleFrameUpdate;
            _playback.OnStateChanged -= HandleStateChange;
            _playback.OnWaveTransition -= HandleWaveTransition;
            _playback.OnCombatFinished -= HandleCombatFinished;
        }

        private void HandleEvent(CombatEvent evt)
        {
            // Spawn damage numbers
            switch (evt.Type)
            {
                case CombatEventType.AutoAttack:
                case CombatEventType.Damage:
                    if (evt.TargetUnitId != null)
                    {
                        var pos = _gridRenderer.GetCellWorldPosition(evt.TargetUnitId);
                        _damageNumbers.Spawn(pos, evt.Value, DamageNumberType.Normal, (int)_playback.Speed);
                    }
                    // Flash attacker
                    if (evt.SourceUnitId != null)
                        _gridRenderer.FlashCell(evt.SourceUnitId, Color.white);
                    break;

                case CombatEventType.CriticalHit:
                    if (evt.TargetUnitId != null)
                    {
                        var pos = _gridRenderer.GetCellWorldPosition(evt.TargetUnitId);
                        _damageNumbers.Spawn(pos, evt.Value, DamageNumberType.Crit, (int)_playback.Speed);
                    }
                    if (evt.SourceUnitId != null)
                        _gridRenderer.FlashCell(evt.SourceUnitId, new Color(1f, 0.85f, 0f));
                    break;

                case CombatEventType.AbilityCast:
                    if (evt.SourceUnitId != null)
                    {
                        var elemColor = PlaceholderFactory.GetElementColor(evt.Element);
                        _gridRenderer.FlashCell(evt.SourceUnitId, elemColor, 0.5f);
                    }
                    if (evt.Value > 0 && evt.TargetUnitId != null)
                    {
                        var pos = _gridRenderer.GetCellWorldPosition(evt.TargetUnitId);
                        _damageNumbers.Spawn(pos, evt.Value, DamageNumberType.Ability, (int)_playback.Speed);
                    }
                    break;

                case CombatEventType.Heal:
                    if (evt.TargetUnitId != null)
                    {
                        var pos = _gridRenderer.GetCellWorldPosition(evt.TargetUnitId);
                        _damageNumbers.Spawn(pos, evt.Value, DamageNumberType.Heal, (int)_playback.Speed);
                    }
                    break;

                case CombatEventType.ShieldAbsorb:
                    if (evt.TargetUnitId != null)
                    {
                        var pos = _gridRenderer.GetCellWorldPosition(evt.TargetUnitId);
                        _damageNumbers.Spawn(pos, evt.Value, DamageNumberType.Shield, (int)_playback.Speed);
                    }
                    break;

                case CombatEventType.Dodge:
                    if (evt.TargetUnitId != null)
                    {
                        var pos = _gridRenderer.GetCellWorldPosition(evt.TargetUnitId);
                        _damageNumbers.SpawnText(pos, "DODGE", DamageNumberType.Dodge, (int)_playback.Speed);
                    }
                    break;

                case CombatEventType.UnitDeath:
                    if (evt.TargetUnitId != null)
                        _gridRenderer.FlashCell(evt.TargetUnitId, new Color(0.5f, 0f, 0f), 0.5f);
                    break;
            }

            // Append to combat log
            if (!string.IsNullOrEmpty(evt.LogMessage))
                AppendLog(evt.LogMessage, evt.Type);
        }

        private void HandleFrameUpdate(CombatFrameSnapshot frame)
        {
            _gridRenderer.UpdateFromSnapshot(frame);
            UpdateSynergyPanel(frame);
        }

        private void HandleStateChange(PlaybackState state)
        {
            switch (state)
            {
                case PlaybackState.Paused:
                    _pauseText.text = ">";
                    break;
                case PlaybackState.Playing:
                    _pauseText.text = "||";
                    _waveTransitionPanel.SetActive(false);
                    break;
            }
        }

        private void HandleWaveTransition(int currentWave, int totalWaves)
        {
            _waveTransitionText.text = $"Wave {currentWave + 1} Complete!";
            _waveTransitionPanel.SetActive(true);
            AppendLog($"--- Wave {currentWave + 1} complete. Reposition units. ---", CombatEventType.WaveComplete);
        }

        private void HandleCombatFinished(bool victory, int stars)
        {
            var stats = _playback.GetUnitStats();
            var (unitsLost, damagePercent) = _playback.GetStarTrackingData();

            // Calculate rewards (base values — in real flow these come from StageData)
            var rewards = CombatResultCalculator.CalculateRewards(
                victory, stars, 500, 200, 2, stats);

            _resultsOverlay.Show(victory, stars, rewards, stats);

            // Fire event bus
            GameEventBus.FireCombatEnded(victory, stars);
        }

        private void HandleResultsContinue()
        {
            _resultsOverlay.Hide();
            // In real flow: SceneRouter.Instance.ReturnToHub() or LoadScene("MissionSelect")
            // For now just fire event — the game flow manager handles navigation
        }

        // ===== BUTTON HANDLERS =====

        private void HandleSpeedClick()
        {
            if (_playback == null) return;
            var newSpeed = _playback.CycleSpeed();
            _speedText.text = $"{(int)newSpeed}x";
        }

        private void HandlePauseClick()
        {
            if (_playback == null) return;
            _playback.TogglePause();
        }

        private void HandleSkipClick()
        {
            if (_playback == null) return;
            _playback.SkipToEnd();
        }

        private void HandleWaveContinue()
        {
            if (_playback == null) return;
            _playback.ConfirmWaveTransition();
        }

        // ===== HUD UPDATES =====

        private void UpdateHUD()
        {
            if (_playback == null) return;

            _waveText.text = $"Wave {_playback.CurrentWave + 1}/{_playback.TotalWaves}";

            var frame = _playback.GetCurrentFrame();
            if (frame != null)
                _turnText.text = $"Turn {frame.TurnNumber}";
        }

        private void UpdateSynergyPanel(CombatFrameSnapshot frame)
        {
            if (frame == null) return;

            var lines = new List<string>();

            if (frame.ActiveArchetypes != null)
            {
                foreach (var kvp in frame.ActiveArchetypes)
                {
                    if (kvp.Value >= 2)
                        lines.Add($"{kvp.Key}: {kvp.Value}");
                }
            }

            if (frame.ActiveElements != null)
            {
                foreach (var kvp in frame.ActiveElements)
                {
                    if (kvp.Value >= 2)
                        lines.Add($"{kvp.Key}: {kvp.Value}");
                }
            }

            _synergyText.text = lines.Count > 0 ? string.Join("\n", lines) : "No active synergies";
        }

        private void AppendLog(string message, CombatEventType type)
        {
            if (_logText == null) return;

            string colorHex;
            switch (type)
            {
                case CombatEventType.CriticalHit:
                    colorHex = "FFD700"; break;
                case CombatEventType.UnitDeath:
                    colorHex = "FF4444"; break;
                case CombatEventType.Heal:
                    colorHex = "44FF44"; break;
                case CombatEventType.AbilityCast:
                    colorHex = "AA88FF"; break;
                case CombatEventType.WaveComplete:
                case CombatEventType.WaveStart:
                    colorHex = "FFD700"; break;
                default:
                    colorHex = "CCCCCC"; break;
            }

            _logText.text += $"<color=#{colorHex}>{message}</color>\n";

            // Auto-scroll to bottom
            if (_logScroll != null)
                Canvas.ForceUpdateCanvases();
        }

        private IEnumerator ShowStartSequence()
        {
            _startOverlay.SetActive(true);
            GameEventBus.FireCombatStarted();

            yield return new WaitForSeconds(1.0f);

            _startOverlay.SetActive(false);

            // Start playback
            _playback.Play();
        }

        // ===== UI CREATION HELPERS =====

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
            txt.supportRichText = true;
            return txt;
        }

        private GameObject CreateButton(RectTransform parent, string name, string label,
            Vector2 anchorMin, Vector2 anchorMax)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Button));
            var rt = go.GetComponent<RectTransform>();
            rt.SetParent(parent, false);
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            go.GetComponent<Image>().color = ButtonBG;

            var txt = CreateText(rt, "Label", label, Vector2.zero, Vector2.one, 14);
            txt.color = Color.white;

            return go;
        }
    }
}
