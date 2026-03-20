using System.IO;
using System.Text;
using UnityEditor;
using UnityEngine;
using ShatteredVeil.Core;

namespace ShatteredVeil.Editor
{
    public class AssetProgressWindow : EditorWindow
    {
        private int _unitCount;
        private int _unitTotal;
        private int _charCount;
        private int _charTotal;
        private int _iconCount;
        private int _iconTotal;
        private int _bgCount;
        private int _bgTotal;
        private int _bossCount;
        private int _bossTotal;

        [MenuItem("ShatteredVeil/Asset Progress")]
        public static void ShowWindow()
        {
            GetWindow<AssetProgressWindow>("Asset Progress");
        }

        private void OnEnable()
        {
            Refresh();
        }

        private void OnGUI()
        {
            GUILayout.Label("Asset Progress", EditorStyles.boldLabel);
            GUILayout.Space(10);

            DrawProgress("Unit Portraits", _unitCount, _unitTotal);
            DrawProgress("Character Portraits", _charCount, _charTotal);
            DrawProgress("Icons", _iconCount, _iconTotal);
            DrawProgress("Backgrounds", _bgCount, _bgTotal);
            DrawProgress("Boss Sprites", _bossCount, _bossTotal);
            GUILayout.Space(5);

            int total = _unitCount + _charCount + _iconCount + _bgCount + _bossCount;
            int totalMax = _unitTotal + _charTotal + _iconTotal + _bgTotal + _bossTotal;
            DrawProgress("TOTAL", total, totalMax);

            GUILayout.Space(15);

            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Refresh"))
                Refresh();
            if (GUILayout.Button("Export Missing List"))
                ExportMissingList();
            GUILayout.EndHorizontal();
        }

        private void DrawProgress(string label, int current, int total)
        {
            float pct = total > 0 ? (float)current / total : 0f;
            string text = $"{label}: {current} / {total} ({pct:P0})";
            EditorGUILayout.LabelField(text);
            var rect = GUILayoutUtility.GetRect(18, 18, "TextField");
            EditorGUI.ProgressBar(rect, pct, "");
        }

        private void Refresh()
        {
            _unitTotal = 0;
            _unitCount = 0;
            _charTotal = 0;
            _charCount = 0;
            _iconTotal = 0;
            _iconCount = 0;
            _bgTotal = 0;
            _bgCount = 0;
            _bossTotal = 0;
            _bossCount = 0;

            foreach (var entry in AssetManifest.AllAssets)
            {
                bool exists = AssetExists(entry.Path);
                entry.HasRealAsset = exists;

                switch (entry.Category)
                {
                    case AssetCategory.UnitPortrait:
                        _unitTotal++;
                        if (exists) _unitCount++;
                        break;
                    case AssetCategory.CharacterPortrait:
                        _charTotal++;
                        if (exists) _charCount++;
                        break;
                    case AssetCategory.Icon:
                        _iconTotal++;
                        if (exists) _iconCount++;
                        break;
                    case AssetCategory.Background:
                        _bgTotal++;
                        if (exists) _bgCount++;
                        break;
                    case AssetCategory.BossSprite:
                        _bossTotal++;
                        if (exists) _bossCount++;
                        break;
                }
            }

            Repaint();
        }

        private bool AssetExists(string path)
        {
            string fullPath = Path.Combine(Application.dataPath, path);
            return File.Exists(fullPath + ".png") ||
                   File.Exists(fullPath + ".jpg") ||
                   File.Exists(fullPath + ".psd");
        }

        private void ExportMissingList()
        {
            var sb = new StringBuilder();
            sb.AppendLine("Id,Path,Category,TargetSize");

            foreach (var entry in AssetManifest.AllAssets)
            {
                if (!entry.HasRealAsset)
                {
                    sb.AppendLine($"{entry.Id},{entry.Path},{entry.Category},{entry.TargetSize}");
                }
            }

            string exportPath = Path.Combine(Application.dataPath, "..", "missing_assets.csv");
            File.WriteAllText(exportPath, sb.ToString());
            Debug.Log($"Missing assets list exported to: {exportPath}");
            EditorUtility.RevealInFinder(exportPath);
        }
    }
}
