namespace ShatteredVeil.Core.Save
{
    public static class SaveMigrator
    {
        public const int CURRENT_VERSION = 1;

        public static SaveData Migrate(SaveData data)
        {
            if (data == null) return null;

            if (data.Version <= 0)
                data.Version = 1;

            // Future migrations go here in sequence:
            // if (data.Version < 2) { /* migrate v1 -> v2 */ data.Version = 2; }
            // if (data.Version < 3) { /* migrate v2 -> v3 */ data.Version = 3; }

            return data;
        }
    }
}
