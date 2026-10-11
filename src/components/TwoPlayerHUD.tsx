import React from 'react';
import { GameMode, KillFeedItem, RocketTypeId } from '../types/game';
import { VirtualJoystick } from './VirtualJoystick';
import { Shield, Crosshair, Zap, Pause, Award } from 'lucide-react';

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
  p1Score,
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
  killFeed,
}) => {
  const p1HpPct = Math.max(0, (p1Hp / p1MaxHp) * 100);
  const p1ShieldPct = Math.max(0, (p1Shield / p1MaxShield) * 100);
  const p2HpPct = Math.max(0, (p2Hp / p2MaxHp) * 100);
  const p2ShieldPct = Math.max(0, (p2Shield / p2MaxShield) * 100);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-2">
      {/* Top Header: Player 1 VS Player 2 Status */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        {/* P1 Bar (Blue) */}
        <div className="flex flex-col gap-1 bg-slate-900/80 backdrop-blur border border-cyan-500/40 p-2 rounded-xl min-w-[140px]">
          <div className="flex items-center justify-between text-[11px] font-black text-cyan-400">
            <span>P1 (CYAN)</span>
            <span className="font-mono">{Math.round(p1Hp)} HP</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
            <div style={{ width: `${p1HpPct}%` }} className="h-full bg-cyan-400" />
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div style={{ width: `${p1ShieldPct}%` }} className="h-full bg-blue-500" />
          </div>
        </div>

        {/* Center Match Banner */}
        <div className="flex flex-col items-center bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-xl">
          <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">
            {mode === 'coop_survival' ? `CO-OP WAVE ${wave || 1}` : 'DUEL 1 VS 1'}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-mono font-bold text-cyan-400">P1: {p1Kills}</span>
            <span className="text-xs text-slate-500 font-bold">-</span>
            <span className="text-xs font-mono font-bold text-emerald-400">P2</span>
          </div>
        </div>

        {/* P2 Bar (Emerald) */}
        <div className="flex flex-col gap-1 bg-slate-900/80 backdrop-blur border border-emerald-500/40 p-2 rounded-xl min-w-[140px]">
          <div className="flex items-center justify-between text-[11px] font-black text-emerald-400">
            <span>P2 (GREEN)</span>
            <span className="font-mono">{Math.round(p2Hp)} HP</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
            <div style={{ width: `${p2HpPct}%` }} className="h-full bg-emerald-400" />
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div style={{ width: `${p2ShieldPct}%` }} className="h-full bg-teal-500" />
          </div>
        </div>
      </div>

      {/* Center pause icon */}
      <div className="self-center pointer-events-auto">
        <button
          onClick={onPause}
          className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
        >
          <Pause className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dual Player Controls at Bottom */}
      <div className="flex items-end justify-between w-full pointer-events-auto pb-2 px-1">
        {/* PLAYER 1 CONTROLS (Left Side) */}
        <div className="flex items-end gap-3 bg-slate-950/40 p-2 rounded-3xl border border-cyan-500/20 backdrop-blur-sm">
          <VirtualJoystick size={110} label="P1 MOVE" color="#06b6d4" onChange={onP1Move} />
          <div className="flex flex-col gap-2">
            <button
              onClick={onP1Dash}
              className="w-11 h-11 rounded-xl bg-cyan-700/80 border border-cyan-400 flex items-center justify-center text-white active:scale-90"
            >
              <Zap className="w-4 h-4" />
            </button>
            <button
              onClick={onP1Fire}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-cyan-300 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 active:scale-90 font-black text-xs"
            >
              P1 FIRE
            </button>
          </div>
        </div>

        {/* PLAYER 2 CONTROLS (Right Side) */}
        <div className="flex items-end gap-3 bg-slate-950/40 p-2 rounded-3xl border border-emerald-500/20 backdrop-blur-sm">
          <div className="flex flex-col gap-2">
            <button
              onClick={onP2Dash}
              className="w-11 h-11 rounded-xl bg-emerald-700/80 border border-emerald-400 flex items-center justify-center text-white active:scale-90"
            >
              <Zap className="w-4 h-4" />
            </button>
            <button
              onClick={onP2Fire}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-emerald-300 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 active:scale-90 font-black text-xs"
            >
              P2 FIRE
            </button>
          </div>
          <VirtualJoystick size={110} label="P2 MOVE" color="#10b981" onChange={onP2Move} />
        </div>
      </div>
    </div>
  );
};
