using NUnit.Framework;
using ShatteredVeil.Core.Save;

namespace ShatteredVeil.Tests.EditMode.Save
{
    [TestFixture]
    public class SaveMigratorTests
    {
        [Test]
        public void V1Save_PassesThroughUnchanged()
        {
            var data = SaveDefaults.CreateNewSave();
            Assert.AreEqual(1, data.Version);

            var migrated = SaveMigrator.Migrate(data);

            Assert.AreEqual(1, migrated.Version);
            Assert.AreEqual("Player", migrated.Player.Name);
            Assert.AreEqual(500, migrated.Player.VeilEssence);
        }

        [Test]
        public void MissingVersionField_DefaultsTo1()
        {
            var data = new SaveData
            {
                Version = 0,
                Player = new PlayerData { Name = "Test", Level = 1, XP = 0, VeilEssence = 100 }
            };

            var migrated = SaveMigrator.Migrate(data);

            Assert.AreEqual(1, migrated.Version);
        }

        [Test]
        public void Migrate_NullData_ReturnsNull()
        {
            var result = SaveMigrator.Migrate(null);
            Assert.IsNull(result);
        }

        [Test]
        public void CurrentVersion_Is1()
        {
            Assert.AreEqual(1, SaveMigrator.CURRENT_VERSION);
        }

        [Test]
        public void Deserialize_OldVersion_TriggersMigration()
        {
            // Manually craft JSON with Version 0 to test migration via deserialize path
            string json = "{\"Version\":0,\"LastSavedTimestamp\":0," +
                          "\"Player\":{\"Name\":\"OldSave\",\"Level\":5,\"XP\":100,\"VeilEssence\":1000}," +
                          "\"Roster\":{\"Units\":[]}," +
                          "\"Teams\":[]," +
                          "\"ActiveTeamIndex\":0," +
                          "\"Heroes\":[]," +
                          "\"Equipment\":{\"Items\":[],\"LooseGems\":[]}," +
                          "\"Buildings\":[]," +
                          "\"Missions\":{\"CurrentRegion\":1,\"HighestCompletedStage\":0,\"StarRatings\":{}}," +
                          "\"Achievements\":{\"Earned\":[],\"Claimed\":[]}," +
                          "\"GachaStats\":{\"TotalRolls\":0,\"RollsSincePity\":0,\"PityResets\":0}}";

            var data = SaveSerializer.Deserialize(json);

            Assert.AreEqual(1, data.Version);
            Assert.AreEqual("OldSave", data.Player.Name);
            Assert.AreEqual(5, data.Player.Level);
        }
    }
}
