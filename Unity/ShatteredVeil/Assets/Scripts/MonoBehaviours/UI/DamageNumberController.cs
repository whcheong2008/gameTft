using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace ShatteredVeil.Mono.UI
{
    /// <summary>
    /// Type of damage number to display.
    /// </summary>
    public enum DamageNumberType
    {
        Normal,
        Crit,
        Ability,
        Heal,
        Shield,
        Dodge,
        Dot,
        Boss
    }

    /// <summary>
    /// Manages floating damage/healing numbers in the combat scene.
    /// Numbers float upward and fade out over time.
    /// Throttles display at high combat speeds to prevent visual spam.
    /// </summary>
    public class DamageNumberController : MonoBehaviour
    {
        private RectTransform _container;
        private readonly Queue<GameObject> _pool = new Queue<GameObject>();
        private float _lastSpawnTime;
        private int _activeCount;

        private const int MaxActive = 20;
        private const float AnimDuration = 0.8f;
        private const float FloatDistance = 60f;
        private const int DefaultFontSize = 16;

        /// <summary>
        /// Initialize the damage number system under the given parent canvas.
        /// </summary>
        public void Initialize(RectTransform parent)
        {
            var go = new GameObject("DamageNumbers", typeof(RectTransform));
            _container = go.GetComponent<RectTransform>();
            _container.SetParent(parent, false);
            _container.anchorMin = Vector2.zero;
            _container.anchorMax = Vector2.one;
            _container.offsetMin = Vector2.zero;
            _container.offsetMax = Vector2.zero;

            // Pre-pool some damage numbers
            for (int i = 0; i < 10; i++)
                _pool.Enqueue(CreateDamageNumberObject());
        }

        /// <summary>
        /// Spawn a damage number at the given world position.
        /// </summary>
        public void Spawn(Vector3 worldPosition, float value, DamageNumberType type, int speedMultiplier = 1)
        {
            // Throttle at high speeds
            if (ShouldThrottle(type, speedMultiplier)) return;
            if (_activeCount >= MaxActive) return;

            _lastSpawnTime = Time.time;

            var go = GetFromPool();
            go.SetActive(true);
            _activeCount++;

            var rt = go.GetComponent<RectTransform>();
            rt.position = worldPosition;

            // Random horizontal offset to prevent stacking
            float xOffset = Random.Range(-15f, 15f);
            rt.anchoredPosition += new Vector2(xOffset, 0);

            var txt = go.GetComponent<Text>();
            txt.text = FormatValue(value, type);
            txt.color = GetColor(type);
            txt.fontSize = GetFontSize(type);

            StartCoroutine(AnimateNumber(go, rt, txt));
        }

        /// <summary>
        /// Spawn a text-based damage number (for dodge, status, etc.).
        /// </summary>
        public void SpawnText(Vector3 worldPosition, string text, DamageNumberType type, int speedMultiplier = 1)
        {
            if (ShouldThrottle(type, speedMultiplier)) return;
            if (_activeCount >= MaxActive) return;

            _lastSpawnTime = Time.time;

            var go = GetFromPool();
            go.SetActive(true);
            _activeCount++;

            var rt = go.GetComponent<RectTransform>();
            rt.position = worldPosition;

            float xOffset = Random.Range(-15f, 15f);
            rt.anchoredPosition += new Vector2(xOffset, 0);

            var txt = go.GetComponent<Text>();
            txt.text = text;
            txt.color = GetColor(type);
            txt.fontSize = GetFontSize(type);

            StartCoroutine(AnimateNumber(go, rt, txt));
        }

        private bool ShouldThrottle(DamageNumberType type, int speedMultiplier)
        {
            if (speedMultiplier <= 1) return false;

            float gap = speedMultiplier >= 4 ? 0.15f : 0.1f;

            // Skip DoT numbers at high speed
            if (type == DamageNumberType.Dot && speedMultiplier >= 2)
                return true;

            // Throttle normal damage at high speed
            if (type == DamageNumberType.Normal && Time.time - _lastSpawnTime < gap)
                return true;

            return false;
        }

        private string FormatValue(float value, DamageNumberType type)
        {
            int rounded = Mathf.RoundToInt(value);
            switch (type)
            {
                case DamageNumberType.Heal:
                case DamageNumberType.Shield:
                    return $"+{rounded}";
                case DamageNumberType.Crit:
                    return $"{rounded}!";
                case DamageNumberType.Dodge:
                    return "DODGE";
                default:
                    return rounded.ToString();
            }
        }

        private Color GetColor(DamageNumberType type)
        {
            switch (type)
            {
                case DamageNumberType.Crit: return new Color(1f, 0.85f, 0f);      // Gold
                case DamageNumberType.Ability: return new Color(0.6f, 0.4f, 1f);   // Purple
                case DamageNumberType.Heal: return new Color(0.3f, 1f, 0.3f);      // Green
                case DamageNumberType.Shield: return new Color(0.3f, 0.6f, 1f);    // Blue
                case DamageNumberType.Dodge: return new Color(0.7f, 0.7f, 0.7f);   // Gray
                case DamageNumberType.Dot: return new Color(1f, 0.5f, 0.2f);       // Orange
                case DamageNumberType.Boss: return new Color(1f, 0.2f, 0.2f);      // Red
                default: return Color.white;
            }
        }

        private int GetFontSize(DamageNumberType type)
        {
            switch (type)
            {
                case DamageNumberType.Crit: return 22;
                case DamageNumberType.Boss: return 20;
                case DamageNumberType.Ability: return 18;
                case DamageNumberType.Dot: return 12;
                default: return DefaultFontSize;
            }
        }

        private IEnumerator AnimateNumber(GameObject go, RectTransform rt, Text txt)
        {
            Vector2 startPos = rt.anchoredPosition;
            Color startColor = txt.color;
            float t = 0f;

            while (t < AnimDuration)
            {
                t += Time.deltaTime;
                float progress = t / AnimDuration;

                // Float upward
                rt.anchoredPosition = startPos + new Vector2(0, FloatDistance * progress);

                // Fade out in second half
                if (progress > 0.5f)
                {
                    float fadeProgress = (progress - 0.5f) * 2f;
                    var c = startColor;
                    c.a = 1f - fadeProgress;
                    txt.color = c;
                }

                yield return null;
            }

            go.SetActive(false);
            _pool.Enqueue(go);
            _activeCount--;
        }

        private GameObject GetFromPool()
        {
            if (_pool.Count > 0)
                return _pool.Dequeue();
            return CreateDamageNumberObject();
        }

        private GameObject CreateDamageNumberObject()
        {
            var go = new GameObject("DmgNum", typeof(RectTransform), typeof(Text));
            var rt = go.GetComponent<RectTransform>();
            rt.SetParent(_container, false);
            rt.sizeDelta = new Vector2(100, 30);
            rt.pivot = new Vector2(0.5f, 0.5f);

            var txt = go.GetComponent<Text>();
            txt.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            txt.alignment = TextAnchor.MiddleCenter;
            txt.horizontalOverflow = HorizontalWrapMode.Overflow;
            txt.verticalOverflow = VerticalWrapMode.Overflow;
            txt.raycastTarget = false;

            go.SetActive(false);
            return go;
        }
    }
}
