using System;
using System.IO;
using UnityEngine;
using ShatteredVeil.Core.Save;

namespace ShatteredVeil.Mono
{
    /// <summary>
    /// MonoBehaviour that handles file I/O for save data.
    /// Uses Application.persistentDataPath for storage.
    ///
    /// Auto-save triggers (call AutoSave after each):
    /// - Unit rolled/purchased
    /// - Star-up performed
    /// - Team composition changed
    /// - Building upgraded
    /// - Mission completed
    /// - Item equipped/unequipped
    /// - Hero assigned/respecced
    /// - Equipment enhanced/crafted
    /// </summary>
    public class SaveManager : MonoBehaviour
    {
        private const string SaveFileName = "save.json";
        private const string BackupFileName = "save_backup.json";

        private SaveData _currentSave;

        public SaveData CurrentSave => _currentSave;

        public static SaveManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private string SaveFilePath => Path.Combine(Application.persistentDataPath, SaveFileName);
        private string BackupFilePath => Path.Combine(Application.persistentDataPath, BackupFileName);

        public bool Save(SaveData data)
        {
            try
            {
                data.LastSavedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                string json = SaveSerializer.Serialize(data);

                // Write backup of previous save
                string savePath = SaveFilePath;
                if (File.Exists(savePath))
                {
                    File.Copy(savePath, BackupFilePath, overwrite: true);
                }

                File.WriteAllText(savePath, json);
                _currentSave = data;
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save game: {e.Message}");
                return false;
            }
        }

        public SaveData Load()
        {
            try
            {
                string savePath = SaveFilePath;
                if (!File.Exists(savePath))
                    return null;

                string json = File.ReadAllText(savePath);
                var data = SaveSerializer.Deserialize(json);
                _currentSave = data;
                return data;
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load game: {e.Message}");
                return null;
            }
        }

        public SaveData LoadOrCreateNew()
        {
            var data = Load();
            if (data == null)
            {
                data = SaveDefaults.CreateNewSave();
                Save(data);
            }
            _currentSave = data;
            return data;
        }

        public void AutoSave()
        {
            if (_currentSave != null)
            {
                Save(_currentSave);
            }
        }

        public void DeleteSave()
        {
            string savePath = SaveFilePath;
            if (File.Exists(savePath))
                File.Delete(savePath);

            string backupPath = BackupFilePath;
            if (File.Exists(backupPath))
                File.Delete(backupPath);

            _currentSave = null;
        }

        public bool HasSave()
        {
            return File.Exists(SaveFilePath);
        }
    }
}
