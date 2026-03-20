using System;
using System.Collections.Generic;
using System.Text;

namespace ShatteredVeil.Core.Save
{
    public static class SaveSerializer
    {
        public static string Serialize(SaveData data)
        {
            if (data == null)
                throw new ArgumentNullException(nameof(data));

            return JsonHelper.ToJson(data);
        }

        public static SaveData Deserialize(string json)
        {
            if (string.IsNullOrEmpty(json))
                throw new ArgumentException("JSON string is null or empty", nameof(json));

            var data = JsonHelper.FromJson<SaveData>(json);

            if (data.Version < SaveMigrator.CURRENT_VERSION)
                data = SaveMigrator.Migrate(data);

            return data;
        }
    }
}
