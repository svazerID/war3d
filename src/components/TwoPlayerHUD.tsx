import React from 'react';
import { GameMode, KillFeedItem } from '../types/game';
import { VirtualJoystick } from './VirtualJoystick';
import { Zap, Pause, Crosshair } from 'lucide-react';

interface TwoPlayerHUDProps {
  mode: GameMode;
  p1Score: number;
  p1Kills: number;
  p1Hp: number;
  p1MaxHp: number;
  p1Shield: number;
  p1MaxShield: number;
  p2Hp: number;
  p2MaxHp: number;
  p2Shield: number;
  p2MaxShield: number;
  wave?: number;
  onP1Move: (vec: { x: number; y: number }) => void;
  onP2Move: (vec: { x: number; y: number }) => void;
  onP1Fire: () => void;
  onP2Fire: () => void;
  onP1Dash: () => void;
  onP2Dash: () => void;
  onPause: () => void;
  killFeed: KillFeedItem[];
}

export const TwoPlayerHUD: React.FC<TwoPlayerHUDProps> = ({
  mode,
  p1Kills,
  p1Hp,
  p1MaxHp,
  p1Shield,
  p1MaxShield,
  p2Hp,
  p2MaxHp,
  p2Shield,
  p2MaxShield,
  wave,
  onP1Move,
  onP2Move,
  onP1Fire,
  onP2Fire,
  onP1Dash,
  onP2Dash,
  onPause,
}) => {
  const p1HpPct = Math.max(0, (p1Hp / p1MaxHp) * 100);
  const p1ShieldPct = Math.max(0, (p1Shield / p1MaxShield) * 100);
  const p2HpPct = Math.max(0, (p2Hp / p2MaxHp) * 100);
  const p2ShieldPct = Math.max(0, (p2Shield / p2MaxShield) * 100);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-1.5 sm:p-2 overflow-hidden max-w-full max-h-[100dvh]">
      {/* Top Header: Player 1 VS Player 2 Status */}
      <div className="flex items-center justify-between w-full pointer-events-auto gap-1">
        {/* P1 Bar (Cyan) */}
        <div className="flex flex-col gap-0.5 bg-slate-900/90 backdrop-blur border border-cyan-500/50 p-1 sm:p-1.5 rounded-xl w-20 sm:w-28 shrink-0">
          <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-black text-cyan-400">
            <span>P1</span>
            <span className="font-mono">{Math.round(p1Hp)} HP</span>
          </div>
          <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
            <div style={{ width: `${p1HpPct}%` }} className="h-full bg-cyan-400" />
          </div>
          <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
            <div style={{ width: `${p1ShieldPct}%` }} className="h-full bg-blue-500" />
          </div>
        </div>

        {/* Center Match Banner + Pause */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 px-2 py-0.5 sm:py-1 rounded-xl shrink-0">
          <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-tight">
            {mode === 'coop_survival' ? `WAVE ${wave || 1}` : `SKOR: ${p1Kills}`}
          </span>
          <button
            type="button"
            onClick={onPause}
            className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <Pause className="w-3 h-3" />
          </button>
        </div>

        {/* P2 Bar (Emerald) */}
        <div className="flex flex-col gap-0.5 bg-slate-900/90 backdrop-blur border border-emerald-500/50 p-1 sm:p-1.5 rounded-xl w-20 sm:w-28 shrink-0">
          <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-black text-emerald-400">
            <span>P2</span>
            <span className="font-mono">{Math.round(p2Hp)} HP</span>
          </div>
          <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
            <div style={{ width: `${p2HpPct}%` }} className="h-full bg-emerald-400" />
          </div>
          <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
            <div style={{ width: `${p2ShieldPct}%` }} className="h-full bg-teal-500" />
          </div>
        </div>
      </div>

      {/* Dual Player Controls at Bottom - Responsive & Contained */}
      <div className="flex items-end justify-between w-full pointer-events-auto pb-1 px-0.5 sm:px-1 gap-1">
        {/* PLAYER 1 CONTROLS (Left Side) */}
        <div className="flex items-end gap-1 bg-slate-950/60 p-1 sm:p-1.5 rounded-2xl border border-cyan-500/30 backdrop-blur-sm">
          <VirtualJoystick size={84} label="P1" color="#06b6d4" onChange={onP1Move} />
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={onP1Dash}
              className="w-8 h-8 rounded-lg bg-cyan-700/80 border border-cyan-400 flex items-center justify-center text-white active:scale-90"
              title="Dash P1"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onP1Fire}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-300 flex flex-col items-center justify-center text-white shadow font-black text-[9px] active:scale-90"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>TEMBAK</span>
            </button>
          </div>
        </div>

        {/* PLAYER 2 CONTROLS (Right Side) */}
        <div className="flex items-end gap-1 bg-slate-950/60 p-1 sm:p-1.5 rounded-2xl border border-emerald-500/30 backdrop-blur-sm">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={onP2Dash}
              className="w-8 h-8 rounded-lg bg-emerald-700/80 border border-emerald-400 flex items-center justify-center text-white active:scale-90"
              title="Dash P2"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onP2Fire}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-300 flex flex-col items-center justify-center text-white shadow font-black text-[9px] active:scale-90"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>TEMBAK</span>
            </button>
          </div>
          <VirtualJoystick size={84} label="P2" color="#10b981" onChange={onP2Move} />
        </div>
      </div>
    </div>
  );
};
