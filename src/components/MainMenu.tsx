import React from 'react';
import { GameMode, BotDifficulty, PlayerProfile } from '../types/game';
import { getXpRequiredForLevel } from '../storage/gameStorage';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import {
  Play,
  Wrench,
  Calendar,
  Volume2,
  VolumeX,
  Smartphone,
  Users,
  Swords,
  Bot,
  Coins,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface MainMenuProps {
  profile: PlayerProfile;
  selectedMode: GameMode;
  selectedDifficulty: BotDifficulty;
  onSelectMode: (mode: GameMode) => void;
  onSelectDifficulty: (diff: BotDifficulty) => void;
  onStartGame: () => void;
  onOpenArmory: () => void;
  onOpenMissions: () => void;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  profile,
  selectedMode,
  selectedDifficulty,
  onSelectMode,
  onSelectDifficulty,
  onStartGame,
  onOpenArmory,
  onOpenMissions,
  onToggleSound,
  onToggleHaptics,
}) => {
  const xpNeeded = getXpRequiredForLevel(profile.level);
  const xpPercent = Math.min(100, Math.round((profile.xp / xpNeeded) * 100));
  const claimableMissionsCount = profile.missions.filter((m) => m.completed && !m.claimed).length;

  return (
    <div className="relative w-full h-full max-h-[100dvh] flex flex-col justify-between p-2 sm:p-5 overflow-y-auto z-20 bg-gradient-to-b from-slate-950 via-[#070b14] to-[#04060a]">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      {/* Top Bar: Profile, Coins & Toggles */}
      <div className="relative flex items-center justify-between gap-2 w-full max-w-3xl mx-auto">
        {/* Player Profile Card */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1.5 rounded-xl backdrop-blur shadow">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-black text-xs shadow">
            L{profile.level}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-white tracking-wide truncate max-w-[110px] sm:max-w-[150px]">
              {profile.name}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-14 sm:w-20 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div style={{ width: `${xpPercent}%` }} className="h-full bg-cyan-400" />
              </div>
              <span className="text-[9px] font-mono text-slate-400">
                {profile.xp}/{xpNeeded}
              </span>
            </div>
          </div>
        </div>

        {/* Coins & Settings */}
        <div className="flex items-center gap-1.5">
          {/* Coins Badge */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-amber-500/40 px-2.5 py-1.5 rounded-xl backdrop-blur shadow">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-black text-amber-300 font-mono">{profile.coins}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            aria-label="Toggle sound"
            className="w-8 h-8 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 shadow"
          >
            {profile.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Haptics Toggle */}
          <button
            onClick={onToggleHaptics}
            aria-label="Toggle haptics"
            className="w-8 h-8 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 shadow"
          >
            <Smartphone className={`w-3.5 h-3.5 ${profile.hapticsEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
          </button>
        </div>
      </div>

      {/* Center Branding & Game Mode Selection */}
      <div className="relative my-auto flex flex-col items-center max-w-lg mx-auto w-full text-center py-2 sm:py-4">
        {/* Title & Tagline */}
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-[10px] font-bold text-cyan-300 mb-1">
          <ShieldAlert className="w-3 h-3" />
          <span>3D MOBILE ROCKET COMBAT</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-orange-400 to-rose-500 tracking-tight drop-shadow">
          ROCKET WAR 3D
        </h1>

        {/* Game Mode Selector - Responsive 3 Cards */}
        <div className="w-full grid grid-cols-3 gap-1.5 sm:gap-2.5 mt-3 sm:mt-4">
          {/* Mode 1: Solo vs AI Bots */}
          <button
            onClick={() => onSelectMode('solo_bots')}
            className={`flex flex-col items-center p-2 sm:p-3 rounded-xl border text-center transition-all active:scale-95 ${
              selectedMode === 'solo_bots'
                ? 'border-cyan-400 bg-cyan-950/50 shadow-md shadow-cyan-500/20'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className={`p-1.5 rounded-lg mb-1 ${selectedMode === 'solo_bots' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
              <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-black text-white leading-tight">SOLO BOTS</span>
            <span className="text-[9px] text-slate-400 mt-0.5 hidden sm:block">Deathmatch AI</span>
          </button>

          {/* Mode 2: Local 2-Player Co-op Survival */}
          <button
            onClick={() => onSelectMode('coop_survival')}
            className={`flex flex-col items-center p-2 sm:p-3 rounded-xl border text-center transition-all active:scale-95 ${
              selectedMode === 'coop_survival'
                ? 'border-emerald-400 bg-emerald-950/50 shadow-md shadow-emerald-500/20'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className={`p-1.5 rounded-lg mb-1 ${selectedMode === 'coop_survival' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-black text-white leading-tight">CO-OP 2P</span>
            <span className="text-[9px] text-slate-400 mt-0.5 hidden sm:block">Kerjasama</span>
          </button>

          {/* Mode 3: Local 2-Player Duel */}
          <button
            onClick={() => onSelectMode('duel_pvp')}
            className={`flex flex-col items-center p-2 sm:p-3 rounded-xl border text-center transition-all active:scale-95 ${
              selectedMode === 'duel_pvp'
                ? 'border-rose-400 bg-rose-950/50 shadow-md shadow-rose-500/20'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className={`p-1.5 rounded-lg mb-1 ${selectedMode === 'duel_pvp' ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
              <Swords className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-black text-white leading-tight">DUEL 1V1</span>
            <span className="text-[9px] text-slate-400 mt-0.5 hidden sm:block">Tarung 2 Pemain</span>
          </button>
        </div>

        {/* AI Difficulty Selector */}
        {selectedMode !== 'duel_pvp' && (
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 p-1 rounded-xl mt-2.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase px-1.5">BOT:</span>
            {(['cadet', 'veteran', 'apex'] as BotDifficulty[]).map((diff) => (
              <button
                key={diff}
                onClick={() => onSelectDifficulty(diff)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${
                  selectedDifficulty === diff
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {diff === 'cadet' ? 'Kadet' : diff === 'veteran' ? 'Veteran' : 'Apex'}
              </button>
            ))}
          </div>
        )}

        {/* Compact Quick Tip */}
        <div className="w-full max-w-sm mt-3 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-left text-[11px] text-slate-300 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Kemudi joystick analog kiri, turret otomatis bidik musuh terdekat!</span>
        </div>

        {/* BIG START BATTLE BUTTON */}
        <button
          onClick={onStartGame}
          className="mt-3.5 w-full max-w-xs py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-rose-600 to-amber-500 text-white font-black text-base tracking-wider uppercase shadow-lg shadow-rose-600/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>MULAI TEMPUR</span>
        </button>
      </div>

      {/* Bottom Menu Navigation & PWA Button */}
      <div className="relative flex flex-row items-center justify-between gap-2 w-full max-w-3xl mx-auto pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5">
          {/* Armory Button */}
          <button
            onClick={onOpenArmory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-[11px] font-bold text-slate-200 hover:text-white hover:bg-slate-800 active:scale-95 transition-all shadow"
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gudang Senjata</span>
          </button>

          {/* Daily Missions Button with Notification Badge */}
          <button
            onClick={onOpenMissions}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-[11px] font-bold text-slate-200 hover:text-white hover:bg-slate-800 active:scale-95 transition-all shadow"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Misi</span>
            {claimableMissionsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce">
                {claimableMissionsCount}
              </span>
            )}
          </button>
        </div>

        {/* PWA Install Button */}
        <PWAInstallButton />
      </div>
    </div>
  );
};
