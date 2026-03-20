#!/usr/bin/env node
// Generates Unity .asset (YAML) files for all 132 UnitTemplate SOs and 15 SynergyDefinition SOs.
// Parses data from UnitDataImporter.cs (which has correct v2 data).
// Run: node generate-assets.js

const fs = require('fs');
const path = require('path');

const UNIT_SCRIPT_GUID = 'd4a3b2c1e5f6a7b8c9d0e1f2a3b4c5d6';
const SYNERGY_SCRIPT_GUID = 'e5b4c3d2f6a7b8c9d0e1f2a3b4c5d6e7';
const UNITS_DIR = path.join(__dirname, 'Assets/Resources/Units');
const SYNERGIES_DIR = path.join(__dirname, 'Assets/Resources/Synergies');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function generateGuid(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    const base = seed.split('').map(c => c.charCodeAt(0).toString(16)).join('').padEnd(24, '0').substring(0, 24);
    return hex + base;
}

// Parse UnitDataImporter.cs to extract U() calls
function parseUnitData() {
    const csPath = path.join(__dirname, 'Assets/Scripts/Editor/UnitDataImporter.cs');
    const content = fs.readFileSync(csPath, 'utf8');

    const units = [];
    // Match U("id","name",tier,"type","arch","secArch","elem",hp,atk,aspd,range,mspd,mana,...)
    const regex = /U\("([^"]+)","([^"]+)",(\d+),"([^"]+)","([^"]+)","([^"]+)","([^"]+)",(\d+),(\d+),([\d.]+)f,([\d.]+)f,([\d.]+)f,(\d+)([^)]*)\)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        const extra = match[14];
        const entry = {
            unitId: match[1],
            displayName: match[2],
            tier: parseInt(match[3]),
            unitType: match[4],
            archetype: match[5],
            secondaryArchetype: match[6],
            element: match[7],
            baseHP: parseInt(match[8]),
            baseATK: parseInt(match[9]),
            attackSpeed: parseFloat(match[10]),
            attackRange: parseFloat(match[11]),
            moveSpeed: parseFloat(match[12]),
            maxMana: parseInt(match[13]),
            evolvedFormId: '',
            isEvolved: false,
            baseFormId: '',
            abilityTemplate: '',
        };

        // Parse optional params
        const evolvedMatch = extra.match(/evolvedId:"([^"]+)"/);
        if (evolvedMatch) entry.evolvedFormId = evolvedMatch[1];

        const isEvoMatch = extra.match(/isEvo:true/);
        if (isEvoMatch) entry.isEvolved = true;

        const baseIdMatch = extra.match(/baseId:"([^"]+)"/);
        if (baseIdMatch) entry.baseFormId = baseIdMatch[1];

        const templateMatch = extra.match(/template:"([^"]+)"/);
        if (templateMatch) entry.abilityTemplate = templateMatch[1];

        units.push(entry);
    }
    return units;
}

function writeUnitAsset(entry) {
    const yaml = `%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!114 &11400000
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: 0}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: ${UNIT_SCRIPT_GUID}, type: 3}
  m_Name: ${entry.unitId}
  m_EditorClassIdentifier:
  unitId: ${entry.unitId}
  displayName: ${entry.displayName}
  element: ${entry.element}
  unitType: ${entry.unitType}
  archetype: ${entry.archetype}
  secondaryArchetype: ${entry.secondaryArchetype}
  abilityTemplate: ${entry.abilityTemplate}
  tier: ${entry.tier}
  baseHP: ${entry.baseHP}
  baseATK: ${entry.baseATK}
  attackSpeed: ${entry.attackSpeed}
  attackRange: ${entry.attackRange}
  moveSpeed: ${entry.moveSpeed}
  maxMana: ${entry.maxMana}
  evolvedFormId: ${entry.evolvedFormId}
  isEvolved: ${entry.isEvolved ? 1 : 0}
  baseFormId: ${entry.baseFormId}
`;

    const filePath = path.join(UNITS_DIR, `${entry.unitId}.asset`);
    fs.writeFileSync(filePath, yaml);

    const metaGuid = generateGuid(entry.unitId);
    const meta = `fileFormatVersion: 2
guid: ${metaGuid}
NativeFormatImporter:
  externalObjects: {}
  mainObjectFileID: 11400000
  userData:
  assetBundleName:
  assetBundleVariant:
`;
    fs.writeFileSync(filePath + '.meta', meta);
}

function writeSynergyAsset(type, name, tiers) {
    const tiersYaml = tiers.map(t => `  - threshold: ${t.threshold}\n    description: ${t.description}`).join('\n');

    const yaml = `%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!114 &11400000
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {fileID: 0}
  m_PrefabInstance: {fileID: 0}
  m_PrefabAsset: {fileID: 0}
  m_GameObject: {fileID: 0}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {fileID: 11500000, guid: ${SYNERGY_SCRIPT_GUID}, type: 3}
  m_Name: ${type}_${name}
  m_EditorClassIdentifier:
  synergyType: ${type}
  synergyName: ${name}
  tiers:
${tiersYaml}
`;

    const filePath = path.join(SYNERGIES_DIR, `${type}_${name}.asset`);
    fs.writeFileSync(filePath, yaml);

    const metaGuid = generateGuid(`synergy_${type}_${name}`);
    const meta = `fileFormatVersion: 2
guid: ${metaGuid}
NativeFormatImporter:
  externalObjects: {}
  mainObjectFileID: 11400000
  userData:
  assetBundleName:
  assetBundleVariant:
`;
    fs.writeFileSync(filePath + '.meta', meta);
}

// === GENERATE UNITS ===
ensureDir(UNITS_DIR);
ensureDir(SYNERGIES_DIR);

const units = parseUnitData();
console.log(`Parsed ${units.length} unit entries from UnitDataImporter.cs`);

for (const u of units) {
    writeUnitAsset(u);
}
console.log(`Generated ${units.length} unit .asset files in ${UNITS_DIR}`);

// Verify all have abilityTemplate
const missingTemplate = units.filter(u => !u.abilityTemplate);
if (missingTemplate.length > 0) {
    console.warn(`WARNING: ${missingTemplate.length} units missing abilityTemplate:`, missingTemplate.map(u => u.unitId));
}

// === GENERATE SYNERGIES ===
const synergies = [
    { type: 'element', name: 'fire', tiers: [
        { threshold: 2, description: "Attacks apply Burn (10 DPS, 3s)" },
        { threshold: 4, description: "Burn 20 DPS. On kill, enemy explodes for 15% max HP to adjacent" },
        { threshold: 7, description: "Burn 35 DPS, 5s. Fire abilities apply Burn. Fire units +20% ATK. Kill explosions chain" },
        { threshold: 10, description: "Prismatic: Enemies start burning. Ability mana cost -50%. Death explosions 200 AoE. Fire immune to Burn" },
    ]},
    { type: 'element', name: 'water', tiers: [
        { threshold: 2, description: "Enemy attack speed -15%" },
        { threshold: 4, description: "Enemy ATK speed -25%. Allies heal 1.5% max HP/s" },
        { threshold: 7, description: "Enemy ATK speed -40%. Heal 3%/s. Enemies below 40% HP deal -20% damage" },
        { threshold: 10, description: "Prismatic: Permanent 35% slow. Water abilities heal 20% of damage dealt. Enemies below 25% HP frozen 2s" },
    ]},
    { type: 'element', name: 'earth', tiers: [
        { threshold: 2, description: "Shield: 15% max HP at combat start" },
        { threshold: 4, description: "Shield 25% max HP. +8% DR" },
        { threshold: 7, description: "Shield 40% max HP. +15% DR. Shields regen 3%/s when not hit" },
        { threshold: 10, description: "Prismatic: Shield 60% max HP. +25% DR. Shield regen 5%/s always. Root random enemy every 8s. Earth immune to crit" },
    ]},
    { type: 'element', name: 'wind', tiers: [
        { threshold: 2, description: "+15% attack speed" },
        { threshold: 4, description: "+25% ATK speed. +12% dodge" },
        { threshold: 7, description: "+40% ATK speed. +25% dodge. Dodge grants 10 mana + 40% ATK counter" },
        { threshold: 10, description: "Prismatic: +60% ATK speed. +40% dodge. 40% chance abilities cast twice. Dodge counter 15 mana + 80% ATK" },
    ]},
    { type: 'element', name: 'lightning', tiers: [
        { threshold: 2, description: "+10% crit chance. Crits chain 50 damage to 1 adjacent" },
        { threshold: 4, description: "+18% crit. +15% crit damage. Chains hit 2" },
        { threshold: 7, description: "+30% crit. +30% crit damage. Chains hit 3. Abilities can crit (15%)" },
        { threshold: 10, description: "Prismatic: +50% crit. +60% crit damage. Abilities chain to 2 at 50%. On crit 120 AoE" },
    ]},
    { type: 'element', name: 'force', tiers: [
        { threshold: 2, description: "+10% ATK, +10% HP" },
        { threshold: 4, description: "+18% ATK, +18% HP. Ignore 10% DR" },
        { threshold: 7, description: "+30% ATK, +30% HP. Ignore 20% DR. First CC immune per combat" },
        { threshold: 10, description: "Prismatic: +50% ATK, +50% HP. Ignore 40% DR. CC immune 6s. Revive once at 30% HP" },
    ]},
    { type: 'archetype', name: 'guardian', tiers: [
        { threshold: 2, description: "+250 HP, +5% DR, shield" },
        { threshold: 4, description: "+550 HP, +10% DR" },
        { threshold: 6, description: "+900 HP, +15% DR, shield-break tenacity" },
        { threshold: 8, description: "+1300 HP, +20% DR, last-stand invulnerability" },
    ]},
    { type: 'archetype', name: 'warden', tiers: [
        { threshold: 2, description: "CC duration +20%, tenacity +15%" },
        { threshold: 4, description: "CC duration +35%, tenacity +30%" },
        { threshold: 6, description: "CC duration +50%, tenacity +45%, first CC immune" },
        { threshold: 8, description: "CC duration +65%, tenacity +60%, full CC immune" },
    ]},
    { type: 'archetype', name: 'vanguard', tiers: [
        { threshold: 2, description: "+200 HP, +20 ATK (x2 front row), charge stun" },
        { threshold: 4, description: "+400 HP, +35 ATK (x2 front row)" },
        { threshold: 6, description: "+650 HP, +55 ATK (x2 front row), lifesteal" },
        { threshold: 8, description: "+950 HP, +80 ATK (x2 front row), slow immune" },
    ]},
    { type: 'archetype', name: 'duelist', tiers: [
        { threshold: 2, description: "Double-strike 15% chance" },
        { threshold: 4, description: "Double-strike 30%, lifesteal" },
        { threshold: 6, description: "Double-strike 40%, can't miss" },
        { threshold: 8, description: "Double-strike 55%, guaranteed crit every 3rd attack" },
    ]},
    { type: 'archetype', name: 'predator', tiers: [
        { threshold: 2, description: "ATK speed +25%, execute +15% below 50% HP" },
        { threshold: 4, description: "ATK speed +40%, execute +25%, dash reset on kill" },
        { threshold: 6, description: "ATK speed +55%, execute +35%, on-kill ATK buff" },
        { threshold: 8, description: "ATK speed +70%, execute +50% below 60% HP" },
    ]},
    { type: 'archetype', name: 'ranger', tiers: [
        { threshold: 2, description: "+1 range, furthest target damage +15%" },
        { threshold: 4, description: "+1 range, furthest +25%, pierce" },
        { threshold: 6, description: "+2 range, furthest +35%, focused shot" },
        { threshold: 8, description: "+3 range, furthest +50%, target mark amp" },
    ]},
    { type: 'archetype', name: 'sorcerer', tiers: [
        { threshold: 2, description: "Ability damage +15%, starting mana +10" },
        { threshold: 4, description: "Ability damage +30%, starting mana +20, mana refund" },
        { threshold: 6, description: "Ability damage +50%, starting mana +30, spell penetration" },
        { threshold: 8, description: "Ability damage +75%, starting mana +40, first cast double damage" },
    ]},
    { type: 'archetype', name: 'mystic', tiers: [
        { threshold: 2, description: "Element resist +20%, status duration +20%" },
        { threshold: 4, description: "Element resist +35%, status duration +35%, resist shred" },
        { threshold: 6, description: "Element resist +50%, status duration +50%, ability damage per unique element" },
        { threshold: 8, description: "Element resist +65%, status duration +65%" },
    ]},
    { type: 'archetype', name: 'sage', tiers: [
        { threshold: 2, description: "Heal bonus +35%" },
        { threshold: 4, description: "Heal bonus +70%, heal-shield" },
        { threshold: 6, description: "Heal bonus +110%, passive mana, overheal-to-shield" },
        { threshold: 8, description: "Heal bonus +160%, death-save once per combat" },
    ]},
];

for (const s of synergies) {
    writeSynergyAsset(s.type, s.name, s.tiers);
}
console.log(`Generated ${synergies.length} synergy .asset files in ${SYNERGIES_DIR}`);
console.log('Done!');
