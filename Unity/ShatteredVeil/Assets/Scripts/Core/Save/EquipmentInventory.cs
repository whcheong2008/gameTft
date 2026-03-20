namespace ShatteredVeil.Core.Save
{
    [System.Serializable]
    public class EquipmentInventory
    {
        public EquipmentSaveData[] Items;
        public GemSaveData[] LooseGems;
    }

    [System.Serializable]
    public class EquipmentSaveData
    {
        public string Id;
        public string Slot;
        public int Tier;
        public int Rarity;
        public int EnhanceLevel;
        public AffixSaveData[] Affixes;
        public GemSaveData[] Gems;
        public string EquippedOnUnit;
    }

    [System.Serializable]
    public class AffixSaveData
    {
        public string AffixId;
        public float Value;
    }

    [System.Serializable]
    public class GemSaveData
    {
        public string GemId;
        public string Element;
        public int Tier;
    }
}
