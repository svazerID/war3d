import React from 'react';
import { PlayerProfile, DailyMission } from '../types/game';
import { X, Calendar, CheckCircle2, Coins, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioManager } from '../sound/audioManager';

interface DailyMissionsModalProps {
  profile: PlayerProfile;
  onClose: () => void;
  onClaimMission: (missionId: string) => void;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({
  profile,
  onClose,
  onClaimMission,
}) => {
  const handleClaim = (m: DailyMission) => {
    if (!m.completed || m.claimed) return;
    audioManager.playPickup();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
    onClaimMission(m.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">MISI HARIAN</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info banner */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 text-center text-xs text-slate-400">
          Selesaikan misi harian untuk mendapatkan koin emas dan XP kenaikan level!
        </div>

        {/* Missions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {profile.missions.map((m) => {
            const pct = Math.min(100, Math.round((m.progress / m.target) * 100));

            return (
              <div
                key={m.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  m.claimed
                    ? 'border-slate-800 bg-slate-950/50 opacity-60'
                    : m.completed
                    ? 'border-emerald-500/50 bg-emerald-950/20 shadow-md shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-xs font-black text-white">{m.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{m.description}</p>
                  </div>

                  {/* Rewards preview */}
                  <div className="flex items-center gap-2 text-xs font-mono font-bold whitespace-nowrap">
                    <span className="flex items-center gap-0.5 text-amber-400">
                      <Coins className="w-3.5 h-3.5" />
                      +{m.rewardCoins}
                    </span>
                    <span className="flex items-center gap-0.5 text-cyan-400">
                      <Award className="w-3.5 h-3.5" />
                      +{m.rewardXp}
                    </span>
                  </div>
                </div>

                {/* Progress bar and button */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1">
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full transition-all ${
                          m.completed ? 'bg-emerald-400' : 'bg-cyan-400'
                        }`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                      <span>Progres</span>
                      <span>
                        {m.progress}/{m.target} ({pct}%)
                      </span>
                    </div>
                  </div>

                  {/* Button */}
                  {m.claimed ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-500 px-3 py-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Selesai</span>
                    </div>
                  ) : m.completed ? (
                    <button
                      onClick={() => handleClaim(m)}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/30 active:scale-95 transition-all animate-pulse"
                    >
                      KLAIM
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-[11px] font-semibold text-slate-400">
                      Berjalan
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
