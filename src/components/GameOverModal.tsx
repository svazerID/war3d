import React, { useEffect } from 'react';
import { MatchStats } from '../types/game';
import { Trophy, Skull, Coins, Award, RotateCcw, Home, Target, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioManager } from '../sound/audioManager';

interface GameOverModalProps {
  stats: MatchStats;
  earnedCoins: number;
  earnedXp: number;
  levelUp: boolean;
  newLevel: number;
  onRestart: () => void;
  onQuit: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  earnedCoins,
  earnedXp,
  levelUp,
  newLevel,
  onRestart,
  onQuit,
}) => {
  useEffect(() => {
    if (stats.won) {
      audioManager.playVictory();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      audioManager.playDefeat();
    }
  }, [stats.won]);

  const minutes = Math.floor(stats.durationSeconds / 60);
  const seconds = stats.durationSeconds % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 text-white text-center">
        {/* Victory / Defeat Header */}
        <div className="flex flex-col items-center mb-4">
          <div
            className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl mb-3 ${
              stats.won
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-amber-500/30'
                : 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-rose-600/30'
            }`}
          >
            {stats.won ? <Trophy className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
          </div>

          <h2
            className={`text-2xl font-black tracking-tight ${
              stats.won ? 'text-amber-400' : 'text-rose-400'
            }`}
          >
            {stats.won ? 'KEMENANGAN TELAK!' : 'MISI GAGAL'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {stats.won
              ? 'Selamat Pilot! Kamu menguasai medan pertempuran roket.'
              : 'Kendaraanmu hancur. Perbaiki dan kembali bertempur!'}
          </p>
        </div>

        {/* Level Up Banner */}
        {levelUp && (
          <div className="p-3 mb-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-500/50 flex items-center justify-center gap-2 animate-bounce">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-black text-amber-300">
              NAIK LEVEL! KAMU SEKARANG LEVEL {newLevel}
            </span>
          </div>
        )}

        {/* Match Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 mb-4">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">KILLS / DEATHS</span>
            <span className="text-sm font-black text-white font-mono mt-0.5">
              {stats.kills} / {stats.deaths}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">AKURASI</span>
            <span className="text-sm font-black text-cyan-400 font-mono mt-0.5">
              {stats.accuracy}%
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">DURASI</span>
            <span className="text-sm font-black text-slate-300 font-mono mt-0.5">
              {timeFormatted}
            </span>
          </div>
        </div>

        {/* Rewards Breakdown */}
        <div className="flex items-center justify-around p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-semibold block">KOIN DIDAPAT</span>
              <span className="text-base font-black text-amber-300 font-mono">+{earnedCoins}</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-semibold block">XP DIDAPAT</span>
              <span className="text-base font-black text-cyan-300 font-mono">+{earnedXp}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-rose-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>MAIN LAGI</span>
          </button>

          <button
            onClick={onQuit}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>KEMBALI KE MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
