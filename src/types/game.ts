export type RocketTypeId = 'fast' | 'explosive' | 'piercing';

export type GameMode = 'solo_bots' | 'coop_survival' | 'duel_pvp';

export type BotDifficulty = 'cadet' | 'veteran' | 'apex';

export interface RocketConfig {
  id: RocketTypeId;
  name: string;
  nameId: string;
  description: string;
  baseDamage: number;
  speed: number;
  radius: number; // Blast radius in meters
  cooldown: number; // Seconds
  color: string;
  trailColor: string;
  icon: string;
  bulletScale: number;
}

export interface WeaponUpgradeState {
  damageLevel: number; // 0 to 5
  speedLevel: number;
  radiusLevel: number;
  cooldownLevel: number;
}

export interface RocketSkin {
  id: string;
  name: string;
  rocketType: RocketTypeId;
  color: string;
  accentColor: string;
  cost: number;
  unlocked: boolean;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardCoins: number;
  rewardXp: number;
  type: 'kills' | 'explosive_kills' | 'piercing_kills' | 'matches_played' | 'damage_dealt' | 'coop_victory';
  completed: boolean;
  claimed: boolean;
}

export interface PlayerProfile {
  id: string;
  name: string;
  level: number;
  xp: number;
  coins: number;
  highScore: number;
  equippedRocket: RocketTypeId;
  equippedSkin: Record<RocketTypeId, string>;
  upgrades: Record<RocketTypeId, WeaponUpgradeState>;
  unlockedSkins: string[];
  missionsDate: string;
  missions: DailyMission[];
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  cameraMode?: 'tactical' | 'follow';
  autoAimEnabled?: boolean;
  controlsSensitivity?: 'normal' | 'high';
  totalKills: number;
  matchesPlayed: number;
}

export interface KillFeedItem {
  id: string;
  killer: string;
  victim: string;
  weapon: RocketTypeId;
  isPlayer: boolean;
  timestamp: number;
}

export interface MatchStats {
  kills: number;
  deaths: number;
  score: number;
  damageDealt: number;
  rocketsFired: number;
  rocketsHit: number;
  accuracy: number;
  durationSeconds: number;
  won: boolean;
  mode: GameMode;
}
