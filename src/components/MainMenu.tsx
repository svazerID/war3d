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
  ChevronRight,
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
    <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-6 overflow-y-auto z-20 bg-gradient-to-b from-slate-950 via-[#070b14] to-[#04060a]">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      {/* Top Bar: Profile, Level, Coins & Utilities */}
      <div className="relative flex items-center justify-between gap-3 w-full max-w-4xl mx-auto">
        {/* Player Profile Card */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 rounded-2xl backdrop-blur shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-black text-sm shadow-md">
            L{profile.level}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-white tracking-wide">{profile.name}</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-20 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div style={{ width: `${xpPercent}%` }} className="h-full bg-cyan-400" />
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {profile.xp}/{xpNeeded} XP
              </span>
            </div>
          </div>
        </div>

        {/* Coins & Settings */}
        <div className="flex items-center gap-2">
          {/* Coins Badge */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-500/40 px-3 py-2 rounded-2xl backdrop-blur shadow-lg">
            <Coins className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span className="text-xs font-black text-amber-300 font-mono">{profile.coins}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            aria-label="Toggle sound"
            className="w-9 h-9 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all shadow"
          >
            {profile.soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Haptics Toggle */}
          <button
            onClick={onToggleHaptics}
            aria-label="Toggle haptics"
            className="w-9 h-9 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all shadow"
          >
            <Smartphone className={`w-4 h-4 ${profile.hapticsEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
          </button>
        </div>
      </div>

      {/* Center Branding & Game Mode Selection */}
      <div className="relative my-auto flex flex-col items-center max-w-xl mx-auto w-full text-center py-4">
        {/* Title & Tagline */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 mb-2">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>WARFARE TEMPUR 3D MOBILE</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-orange-400 to-rose-500 tracking-tight drop-shadow-md">
          ROCKET WAR 3D
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-1 font-medium">
          Pertarungan roket real-time berkecepatan tinggi dengan kontrol sentuh presisi dan efek kehancuran dahsyat!
        </p>

        {/* Game Mode Selector */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5">
          {/* Mode 1: Solo vs AI Bots */}
          <button
            onClick={() => onSelectMode('solo_bots')}
            className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all active:scale-95 ${
              selectedMode === 'solo_bots'
                ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className={`p-2 rounded-xl mb-1.5 ${selectedMode === 'solo_bots' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
              <Bot className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-white">SOLO VS BOTS</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Deathmatch vs AI</span>
          </button>

          {/* Mode 2: Local 2-Player Co-op Survival */}
          <button
            onClick={() => onSelectMode('coop_survival')}
            className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all active:scale-95 ${
              selectedMode === 'coop_survival'
                ? 'border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-500/20'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className={`p-2 rounded-xl mb-1.5 ${selectedMode === 'coop_survival' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-white">CO-OP 2 PEMAIN</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Kerjasama Survival</span>
          </button>

          {/* Mode 3: Local 2-Player Duel */}
          <button
            onClick={() => onSelectMode('duel_pvp')}
            className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all active:scale-95 ${
              selectedMode === 'duel_pvp'
                ? 'border-rose-400 bg-rose-950/40 shadow-lg shadow-rose-500/20'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <div className={`p-2 rounded-xl mb-1.5 ${selectedMode === 'duel_pvp' ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
              <Swords className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-white">DUEL 1 VS 1</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Tarung 2 Pemain</span>
          </button>
        </div>

        {/* AI Difficulty Selector (Only in Solo or Co-op) */}
        {selectedMode !== 'duel_pvp' && (
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 p-1 rounded-xl mt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-2">AI BOT:</span>
            {(['cadet', 'veteran', 'apex'] as BotDifficulty[]).map((diff) => (
              <button
                key={diff}
                onClick={() => onSelectDifficulty(diff)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                  selectedDifficulty === diff
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {diff === 'cadet' ? 'Kadet' : diff === 'veteran' ? 'Veteran' : 'Apex (Sulit)'}
              </button>
            ))}
          </div>
        )}

        {/* Control Tips Card */}
        <div className="w-full max-w-sm mt-4 p-2.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-left text-xs space-y-1 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px]">
            <span>💡 KONTROL MUDAH & RESPONSIF:</span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-0.5">
            <p>• <strong>Kemudi:</strong> Geser joystick ke arah tujuan (atas = maju, bawah = mundur).</p>
            <p>• <strong>Tembak:</strong> Tekan tombol merah untuk <strong>bidik otomatis</strong> musuh terdekat!</p>
            <p>• <strong>Kamera:</strong> Sudut pandang atas (Taktis) bebas pusing & pandangan luas.</p>
          </div>
        </div>

        {/* BIG START BATTLE BUTTON */}
        <button
          onClick={onStartGame}
          className="mt-4 w-full max-w-sm py-4 rounded-2xl bg-gradient-to-r from-orange-600 via-rose-600 to-amber-500 text-white font-black text-lg tracking-wider uppercase shadow-xl shadow-rose-600/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>MULAI TEMPUR</span>
        </button>
      </div>

      {/* Bottom Menu Navigation & PWA Button */}
      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-3 w-full max-w-4xl mx-auto pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Armory Button */}
          <button
            onClick={onOpenArmory}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 active:scale-95 transition-all shadow"
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span>Gudang Senjata & Skin</span>
          </button>

          {/* Daily Missions Button with Notification Badge */}
          <button
            onClick={onOpenMissions}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 active:scale-95 transition-all shadow"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Misi Harian</span>
            {claimableMissionsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce">
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
