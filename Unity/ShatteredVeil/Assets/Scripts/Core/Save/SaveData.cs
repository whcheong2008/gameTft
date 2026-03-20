namespace ShatteredVeil.Core.Save
{
    [System.Serializable]
    public class SaveData
    {
        public int Version;
        public long LastSavedTimestamp;
        public PlayerData Player;
        public RosterData Roster;
        public TeamData[] Teams;
        public int ActiveTeamIndex;
        public HeroSaveData[] Heroes;
        public EquipmentInventory Equipment;
        public BuildingData[] Buildings;
        public MissionProgressData Missions;
        public AchievementData Achievements;
        public GachaStatsData GachaStats;
    }
}
