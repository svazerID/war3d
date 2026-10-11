import { PlayerProfile, RocketConfig, RocketSkin, DailyMission, RocketTypeId, WeaponUpgradeState } from '../types/game';

export const ROCKET_CONFIGS: Record<RocketTypeId, RocketConfig> = {
  fast: {
    id: 'fast',
    name: 'Swift Dart',
    nameId: 'Roket Cepat',
    description: 'Kecepatan supersonik & reload kilat. Sangat efektif untuk mengejar musuh gesit.',
    baseDamage: 32,
    speed: 44,
    radius: 2.2,
    cooldown: 0.32,
    color: '#06b6d4', // cyan-500
    trailColor: '#38bdf8',
    icon: 'Zap',
    bulletScale: 0.8,
  },
  explosive: {
    id: 'explosive',
    name: 'Titan Blaster',
    nameId: 'Roket Peledak',
    description: 'Hulu ledak berat dengan radius ledakan raksasa yang mengguncang medan tempur.',
    baseDamage: 75,
    speed: 26,
    radius: 6.8,
    cooldown: 0.85,
    color: '#f97316', // orange-500
    trailColor: '#ef4444',
    icon: 'Bomb',
    bulletScale: 1.3,
  },
  piercing: {
    id: 'piercing',
    name: 'Plasma Lance',
    nameId: 'Roket Piercing',
    description: 'Energi plasma terkonsentrasi yang menembus rintangan dan multiple musuh sekaligus.',
    baseDamage: 55,
    speed: 38,
    radius: 2.0,
    cooldown: 0.58,
    color: '#a855f7', // purple-500
    trailColor: '#e879f9',
    icon: 'Flame',
    bulletScale: 1.0,
  },
};

export const AVAILABLE_SKINS: RocketSkin[] = [
  // Fast skins
  { id: 'fast_default', name: 'Cyber Blue', rocketType: 'fast', color: '#0284c7', accentColor: '#38bdf8', cost: 0, unlocked: true },
  { id: 'fast_neon', name: 'Neon Hyper', rocketType: 'fast', color: '#06b6d4', accentColor: '#22d3ee', cost: 120, unlocked: false },
  { id: 'fast_gold', name: 'Golden Comet', rocketType: 'fast', color: '#eab308', accentColor: '#fef08a', cost: 350, unlocked: false },

  // Explosive skins
  { id: 'exp_default', name: 'Titan Warhead', rocketType: 'explosive', color: '#ea580c', accentColor: '#f97316', cost: 0, unlocked: true },
  { id: 'exp_magma', name: 'Magma Core', rocketType: 'explosive', color: '#dc2626', accentColor: '#ff0055', cost: 150, unlocked: false },
  { id: 'exp_hazard', name: 'Toxic Hazard', rocketType: 'explosive', color: '#84cc16', accentColor: '#a3e635', cost: 300, unlocked: false },

  // Piercing skins
  { id: 'prc_default', name: 'Plasma Violet', rocketType: 'piercing', color: '#9333ea', accentColor: '#c084fc', cost: 0, unlocked: true },
  { id: 'prc_frost', name: 'Frost Pierce', rocketType: 'piercing', color: '#2563eb', accentColor: '#60a5fa', cost: 180, unlocked: false },
  { id: 'prc_void', name: 'Void Phantom', rocketType: 'piercing', color: '#4f46e5', accentColor: '#818cf8', cost: 400, unlocked: false },
];

function generateDefaultMissions(): DailyMission[] {
  return [
    {
      id: 'm1',
      title: 'Dominasi Medan',
      description: 'Musnahkan 8 tank roket musuh',
      target: 8,
      progress: 0,
      rewardCoins: 100,
      rewardXp: 150,
      type: 'kills',
      completed: false,
      claimed: false,
    },
    {
      id: 'm2',
      title: 'Ledakan Dahsyat',
      description: 'Musnahkan 4 musuh menggunakan Roket Peledak',
      target: 4,
      progress: 0,
      rewardCoins: 120,
      rewardXp: 180,
      type: 'explosive_kills',
      completed: false,
      claimed: false,
    },
    {
      id: 'm3',
      title: 'Tombak Menembus',
      description: 'Kalahkan 3 bot dengan Roket Piercing',
      target: 3,
      progress: 0,
      rewardCoins: 90,
      rewardXp: 130,
      type: 'piercing_kills',
      completed: false,
      claimed: false,
    },
    {
      id: 'm4',
      title: 'Veteran Tempur',
      description: 'Selesaikan 3 pertempuran (menang atau kalah)',
      target: 3,
      progress: 0,
      rewardCoins: 80,
      rewardXp: 100,
      type: 'matches_played',
      completed: false,
      claimed: false,
    },
    {
      id: 'm5',
      title: 'Kerjasama Kooperatif',
      description: 'Raih 1 kemenangan di Mode Co-op 2 Pemain',
      target: 1,
      progress: 0,
      rewardCoins: 150,
      rewardXp: 250,
      type: 'coop_victory',
      completed: false,
      claimed: false,
    },
  ];
}

const STORAGE_KEY = 'rocket_war_3d_player_data';

export function loadPlayerProfile(): PlayerProfile {
  const todayStr = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data: PlayerProfile = JSON.parse(raw);
      // Ensure daily missions are valid for today
      if (data.missionsDate !== todayStr || !data.missions || data.missions.length === 0) {
        data.missionsDate = todayStr;
        data.missions = generateDefaultMissions();
      }
      if (!data.cameraMode) data.cameraMode = 'tactical';
      if (data.autoAimEnabled === undefined) data.autoAimEnabled = true;
      if (!data.controlsSensitivity) data.controlsSensitivity = 'high';
      return data;
    }
  } catch (e) {
    console.warn('Failed to parse saved game profile, creating fresh one:', e);
  }

  // Default fresh profile
  const initialProfile: PlayerProfile = {
    id: 'pilot_' + Math.random().toString(36).substring(2, 8),
    name: 'Pilot-' + Math.floor(100 + Math.random() * 900),
    level: 1,
    xp: 0,
    coins: 200, // Starter coins
    highScore: 0,
    equippedRocket: 'fast',
    equippedSkin: {
      fast: 'fast_default',
      explosive: 'exp_default',
      piercing: 'prc_default',
    },
    upgrades: {
      fast: { damageLevel: 0, speedLevel: 0, radiusLevel: 0, cooldownLevel: 0 },
      explosive: { damageLevel: 0, speedLevel: 0, radiusLevel: 0, cooldownLevel: 0 },
      piercing: { damageLevel: 0, speedLevel: 0, radiusLevel: 0, cooldownLevel: 0 },
    },
    unlockedSkins: ['fast_default', 'exp_default', 'prc_default'],
    missionsDate: todayStr,
    missions: generateDefaultMissions(),
    soundEnabled: true,
    musicEnabled: true,
    hapticsEnabled: true,
    cameraMode: 'tactical',
    autoAimEnabled: true,
    controlsSensitivity: 'high',
    totalKills: 0,
    matchesPlayed: 0,
  };

  savePlayerProfile(initialProfile);
  return initialProfile;
}

export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save player profile:', e);
  }
}

export function getXpRequiredForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.35, level - 1));
}

export function getUpgradeCost(currentLevel: number): number {
  return 50 * (currentLevel + 1);
}

export function getUpgradedRocketStats(base: RocketConfig, upgrades: WeaponUpgradeState): RocketConfig {
  const damageMult = 1 + upgrades.damageLevel * 0.12;
  const speedMult = 1 + upgrades.speedLevel * 0.08;
  const radiusMult = 1 + upgrades.radiusLevel * 0.10;
  const cooldownMult = Math.max(0.4, 1 - upgrades.cooldownLevel * 0.08);

  return {
    ...base,
    baseDamage: Math.round(base.baseDamage * damageMult),
    speed: Math.round(base.speed * speedMult),
    radius: Number((base.radius * radiusMult).toFixed(1)),
    cooldown: Number((base.cooldown * cooldownMult).toFixed(2)),
  };
}
