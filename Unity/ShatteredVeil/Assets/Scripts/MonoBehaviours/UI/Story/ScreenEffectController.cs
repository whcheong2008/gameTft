using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace ShatteredVeil.Mono.UI.Story
{
    public class ScreenEffectController : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private Image _overlayImage;
        [SerializeField] private Camera _mainCamera;

        [Header("Settings")]
        [SerializeField] private float _defaultShakeIntensity = 0.1f;

        private Vector3 _originalCameraPosition;

        public void FadeToBlack(float duration, Action onComplete = null)
        {
            StartCoroutine(FadeOverlay(Color.clear, Color.black, duration, onComplete));
        }

        public void FadeFromBlack(float duration, Action onComplete = null)
        {
            StartCoroutine(FadeOverlay(Color.black, Color.clear, duration, onComplete));
        }

        public void FlashWhite(float duration, Action onComplete = null)
        {
            StartCoroutine(FlashEffect(Color.white, duration, onComplete));
        }

        public void ScreenShake(float duration, float intensity = 0f, Action onComplete = null)
        {
            if (intensity <= 0f) intensity = _defaultShakeIntensity;
            StartCoroutine(ShakeEffect(duration, intensity, onComplete));
        }

        public void PlayEffect(string effectType, float duration, Action onComplete = null)
        {
            switch (effectType?.ToLower())
            {
                case "fade_black":
                    FadeToBlack(duration, onComplete);
                    break;
                case "fade_from_black":
                    FadeFromBlack(duration, onComplete);
                    break;
                case "flash_white":
                    FlashWhite(duration, onComplete);
                    break;
                case "shake":
                    ScreenShake(duration, _defaultShakeIntensity, onComplete);
                    break;
                default:
                    onComplete?.Invoke();
                    break;
            }
        }

        private IEnumerator FadeOverlay(Color from, Color to, float duration, Action onComplete)
        {
            if (_overlayImage == null)
            {
                onComplete?.Invoke();
                yield break;
            }

            _overlayImage.gameObject.SetActive(true);
            _overlayImage.raycastTarget = to.a > 0.5f;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                _overlayImage.color = Color.Lerp(from, to, elapsed / duration);
                yield return null;
            }

            _overlayImage.color = to;
            if (to.a <= 0f)
                _overlayImage.gameObject.SetActive(false);

            onComplete?.Invoke();
        }

        private IEnumerator FlashEffect(Color color, float duration, Action onComplete)
        {
            if (_overlayImage == null)
            {
                onComplete?.Invoke();
                yield break;
            }

            _overlayImage.gameObject.SetActive(true);
            _overlayImage.color = color;

            float halfDuration = duration * 0.5f;
            float elapsed = 0f;

            while (elapsed < halfDuration)
            {
                elapsed += Time.deltaTime;
                yield return null;
            }

            elapsed = 0f;
            while (elapsed < halfDuration)
            {
                elapsed += Time.deltaTime;
                _overlayImage.color = Color.Lerp(color, Color.clear, elapsed / halfDuration);
                yield return null;
            }

            _overlayImage.color = Color.clear;
            _overlayImage.gameObject.SetActive(false);
            onComplete?.Invoke();
        }

        private IEnumerator ShakeEffect(float duration, float intensity, Action onComplete)
        {
            var cam = _mainCamera != null ? _mainCamera : Camera.main;
            if (cam == null)
            {
                onComplete?.Invoke();
                yield break;
            }

            _originalCameraPosition = cam.transform.localPosition;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float x = UnityEngine.Random.Range(-intensity, intensity);
                float y = UnityEngine.Random.Range(-intensity, intensity);
                cam.transform.localPosition = _originalCameraPosition + new Vector3(x, y, 0);
                yield return null;
            }

            cam.transform.localPosition = _originalCameraPosition;
            onComplete?.Invoke();
        }
    }
}
