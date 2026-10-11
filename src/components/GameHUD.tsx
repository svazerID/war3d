import React, { useState, useRef } from 'react';
import { RocketTypeId, GameMode, KillFeedItem } from '../types/game';
import { ROCKET_CONFIGS } from '../storage/gameStorage';
import { VirtualJoystick } from './VirtualJoystick';
import {
  Pause,
  Zap,
  Bomb,
  Flame,
  Shield,
  Crosshair,
  Award,
  Video,
  Target,
  Sparkles,
  Gamepad2,
  ArrowUpDown,
} from 'lucide-react';

interface GameHUDProps {
  score: number;
  kills: number;
  deaths: number;
  wave?: number;
  mode: GameMode;
  p1Hp: number;
  p1MaxHp: number;
  p1Shield: number;
  p1MaxShield: number;
  equippedRocket: RocketTypeId;
  onSwitchRocket: (type: RocketTypeId) => void;
  onFire: (aimDir?: { x: number; y: number }) => void;
  onDash: () => void;
  onJoystickMove: (vec: { x: number; y: number }) => void;
  onPause: () => void;
  cameraMode?: 'tactical' | 'follow';
  onToggleCamera?: () => void;
  autoFireEnabled?: boolean;
  onToggleAutoFire?: () => void;
  controlScheme?: 'joystick' | 'dpad';
  onToggleControlScheme?: () => void;
  invertY?: boolean;
  onToggleInvertY?: () => void;
  lockedTarget?: { name: string; dist: number } | null;
  killFeed: KillFeedItem[];
  fireCooldown: number;
  dashCooldown: number;
  // Radar data
  playerPos: { x: number; z: number };
  playerAngle: number;
  botPositions: { x: number; z: number; isDead: boolean }[];
  pickupPositions: { x: number; z: number; active: boolean; type: string }[];
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  kills,
  wave,
  mode,
  p1Hp,
  p1MaxHp,
  p1Shield,
  p1MaxShield,
  equippedRocket,
  onSwitchRocket,
  onFire,
  onDash,
  onJoystickMove,
  onPause,
  cameraMode = 'tactical',
  onToggleCamera,
  autoFireEnabled = false,
  onToggleAutoFire,
  controlScheme = 'joystick',
  onToggleControlScheme,
  invertY = false,
  onToggleInvertY,
  lockedTarget,
  killFeed,
  fireCooldown,
  dashCooldown,
  playerPos,
  playerAngle,
  botPositions,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (p1Hp / p1MaxHp) * 100));
  const shieldPercent = Math.max(0, Math.min(100, (p1Shield / p1MaxShield) * 100));

  const rockets: RocketTypeId[] = ['fast', 'explosive', 'piercing'];

  // Drag-to-aim states on fire button
  const [aimOffset, setAimOffset] = useState<{ x: number; y: number } | null>(null);
  const fireTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchIdRef = useRef<number | null>(null);

  const handleFirePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (touchIdRef.current !== null) return;
    touchIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    fireTouchStartRef.current = { x: e.clientX, y: e.clientY };
    setAimOffset({ x: 0, y: 0 });
  };

  const handleFirePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (touchIdRef.current !== e.pointerId || !fireTouchStartRef.current) return;
    e.preventDefault();
    const dx = e.clientX - fireTouchStartRef.current.x;
    const dy = e.clientY - fireTouchStartRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 45;
    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, maxDist);

    if (dist > 10) {
      setAimOffset({
        x: Math.cos(angle) * (clampedDist / maxDist),
        y: Math.sin(angle) * (clampedDist / maxDist),
      });
    } else {
      setAimOffset({ x: 0, y: 0 });
    }
  };

  const handleFirePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (touchIdRef.current !== e.pointerId) return;
    e.preventDefault();
    touchIdRef.current = null;
    fireTouchStartRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (aimOffset && (Math.abs(aimOffset.x) > 0.2 || Math.abs(aimOffset.y) > 0.2)) {
      onFire(aimOffset);
    } else {
      onFire(undefined);
    }
    setAimOffset(null);
  };

  const getRocketIcon = (id: RocketTypeId) => {
    switch (id) {
      case 'fast':
        return <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />;
      case 'explosive':
        return <Bomb className="w-3 h-3 sm:w-3.5 sm:h-3.5" />;
      case 'piercing':
        return <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5" />;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-1.5 sm:p-3 overflow-hidden max-w-full max-h-[100dvh]">
      {/* Top Header Bar - Optimized to NEVER wrap or overflow on mobile screens */}
      <div className="flex items-center justify-between w-full pointer-events-auto gap-1 max-w-full">
        {/* Left: Compact Player Health & Shield */}
        <div className="flex flex-col gap-0.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 sm:p-1.5 rounded-xl w-20 sm:w-28 shadow-lg shrink-0">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-300">
            <span className="flex items-center gap-0.5 text-cyan-400">
              <Shield className="w-2.5 h-2.5" />
              <span>SHD</span>
            </span>
            <span className="font-mono text-cyan-300 text-[9px]">{Math.round(p1Shield)}</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div
              style={{ width: `${shieldPercent}%` }}
              className="h-full bg-cyan-400 transition-all duration-150"
            />
          </div>

          <div className="flex items-center justify-between text-[9px] font-bold text-slate-300">
            <span className="flex items-center gap-0.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>HP</span>
            </span>
            <span className="font-mono text-emerald-300 text-[9px]">{Math.round(p1Hp)}</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div
              style={{ width: `${hpPercent}%` }}
              className={`h-full transition-all duration-150 ${
                hpPercent > 50
                  ? 'bg-emerald-400'
                  : hpPercent > 25
                  ? 'bg-amber-400'
                  : 'bg-red-500 animate-pulse'
              }`}
            />
          </div>
        </div>

        {/* Center: Score & Kills Pill */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-2 py-1 rounded-xl shadow-lg shrink-0">
          <div className="flex items-center gap-1 text-amber-400 font-black text-xs font-mono">
            <Award className="w-3.5 h-3.5" />
            <span>{score}</span>
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <div className="flex items-center gap-1 text-rose-400 font-bold text-[11px] font-mono">
            <Crosshair className="w-3 h-3" />
            <span>{kills}</span>
          </div>
          {mode === 'coop_survival' && wave && (
            <>
              <div className="h-3 w-px bg-slate-700" />
              <span className="text-[9px] font-bold text-cyan-400 font-mono">
                W{wave}
              </span>
            </>
          )}
        </div>

        {/* Right: Camera toggle, Radar & Pause */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Quick Camera Mode Switcher */}
          {onToggleCamera && (
            <button
              type="button"
              onClick={onToggleCamera}
              title="Ganti Mode Kamera"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 shadow"
            >
              <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
            </button>
          )}

          {/* Mini Circular Radar with Correct Screen-Aligned Blips */}
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-950/90 border border-cyan-500/60 backdrop-blur overflow-hidden shadow flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
            <div className="absolute w-full h-[1px] bg-cyan-500/20" />
            <div className="absolute h-full w-[1px] bg-cyan-500/20" />

            {/* Radar Center (Player Triangle) */}
            <div
              style={{ transform: `rotate(${(-playerAngle * 180) / Math.PI}deg)` }}
              className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-cyan-400 z-10"
            />

            {/* Enemy Bot Blips (Ahead is UP on radar) */}
            {botPositions.map((b, idx) => {
              if (b.isDead) return null;
              const dx = -((b.x - playerPos.x) / 50) * 14; // Invert X so screen-left matches world +X
              const dz = -((b.z - playerPos.z) / 50) * 14; // Invert Z so forward (+Z) is UP on radar
              if (Math.hypot(dx, dz) > 15) return null;

              return (
                <div
                  key={idx}
                  style={{ transform: `translate(${dx}px, ${dz}px)` }}
                  className="absolute w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm animate-pulse"
                />
              );
            })}
          </div>

          {/* Pause Button */}
          <button
            type="button"
            onClick={onPause}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white active:scale-90 transition-transform shadow"
          >
            <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>

      {/* Target Lock-On Indicator Badge (Centered Under Header) */}
      <div className="self-center pointer-events-none mt-1">
        {lockedTarget && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/90 border border-rose-500/60 text-[9px] sm:text-[10px] font-bold text-rose-300 shadow backdrop-blur animate-pulse max-w-[70vw] truncate">
            <Target className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="truncate">KUNCI: {lockedTarget.name} ({Math.round(lockedTarget.dist)}m)</span>
          </div>
        )}
      </div>

      {/* Kill Feed (Top-Left under bars) */}
      <div className="flex flex-col gap-0.5 max-w-[150px] sm:max-w-[180px] pointer-events-none mt-0.5">
        {killFeed.slice(-2).map((item) => (
          <div
            key={item.id}
            className="bg-slate-950/85 border border-slate-800 rounded px-1.5 py-0.5 text-[8px] sm:text-[9px] font-mono text-slate-300 backdrop-blur truncate shadow"
          >
            <span className={item.killer.startsWith('Pilot') ? 'text-cyan-400 font-bold' : 'text-slate-400'}>
              {item.killer}
            </span>
            <span className="text-rose-400 mx-1">⚡</span>
            <span className={item.victim.startsWith('Pilot') ? 'text-red-400 font-bold' : 'text-slate-400'}>
              {item.victim}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom Controls Area - Clean Left/Right Split (Center is completely open) */}
      <div className="flex items-end justify-between w-full pointer-events-auto pb-1 px-0.5 sm:px-1 gap-1">
        {/* Left Side: Steering Cluster (Toggles + Joystick) */}
        <div className="flex flex-col items-start gap-1">
          {/* Quick Steering Toggles (D-Pad & Invert Y) */}
          <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur border border-slate-800 p-0.5 rounded-lg shadow">
            {onToggleControlScheme && (
              <button
                type="button"
                onClick={onToggleControlScheme}
                title="Ganti Mode Kemudi"
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold ${
                  controlScheme === 'dpad'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Gamepad2 className="w-2.5 h-2.5" />
                <span>{controlScheme === 'dpad' ? 'D-PAD' : 'ANALOG'}</span>
              </button>
            )}

            {onToggleInvertY && (
              <button
                type="button"
                onClick={onToggleInvertY}
                title="Pembalik Arah Y Analog"
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold ${
                  invertY
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <ArrowUpDown className="w-2.5 h-2.5" />
                <span>{invertY ? 'INV: ON' : 'INV: OFF'}</span>
              </button>
            )}
          </div>

          {/* Virtual Joystick / D-Pad */}
          <VirtualJoystick
            size={104}
            label="KEMUDI"
            color="#06b6d4"
            mode={controlScheme === 'dpad' ? 'dpad' : 'fixed'}
            onChange={onJoystickMove}
          />
        </div>

        {/* Right Side: Combat Cluster (Rocket switch + Dash + Fire) */}
        <div className="flex flex-col items-end gap-1.5">
          {/* Top Row: Rocket Switcher & Auto-Fire Toggle */}
          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 rounded-xl shadow-lg">
            {/* Auto-Fire Toggle Button */}
            {onToggleAutoFire && (
              <button
                type="button"
                onClick={onToggleAutoFire}
                className={`flex items-center gap-0.5 px-1.5 sm:px-2 py-1 rounded-lg text-[8px] sm:text-[9px] font-black transition-all ${
                  autoFireEnabled
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>{autoFireEnabled ? 'AUTO: ON' : 'AUTO: OFF'}</span>
              </button>
            )}

            {/* 3 Rocket Type Buttons */}
            {rockets.map((type) => {
              const cfg = ROCKET_CONFIGS[type];
              const isEquipped = equippedRocket === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onSwitchRocket(type)}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
                    isEquipped
                      ? 'bg-cyan-500 text-slate-950 shadow shadow-cyan-500/40 ring-1 ring-cyan-300'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                  title={cfg.nameId}
                >
                  {getRocketIcon(type)}
                </button>
              );
            })}
          </div>

          {/* Bottom Row: DASH + Big FIRE Button */}
          <div className="flex items-end gap-1.5">
            {/* Dash / Booster Button */}
            <button
              type="button"
              onClick={onDash}
              disabled={dashCooldown > 0}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border flex flex-col items-center justify-center text-[9px] font-bold shadow-lg transition-transform active:scale-90 ${
                dashCooldown > 0
                  ? 'border-slate-800 bg-slate-900/70 text-slate-500'
                  : 'border-amber-500/60 bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-orange-500/30'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="text-[7px] sm:text-[8px] font-mono leading-none mt-0.5">
                {dashCooldown > 0 ? `${dashCooldown.toFixed(1)}s` : 'DASH'}
              </span>
            </button>

            {/* Primary FIRE Button */}
            <div className="relative">
              {aimOffset && (Math.abs(aimOffset.x) > 0.1 || Math.abs(aimOffset.y) > 0.1) && (
                <div
                  style={{
                    transform: `translate(${aimOffset.x * 40}px, ${aimOffset.y * 40}px)`,
                  }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-lg pointer-events-none z-30 animate-pulse"
                />
              )}

              <button
                type="button"
                onPointerDown={handleFirePointerDown}
                onPointerMove={handleFirePointerMove}
                onPointerUp={handleFirePointerUp}
                onPointerCancel={handleFirePointerUp}
                onClick={() => onFire(undefined)}
                disabled={fireCooldown > 0}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-rose-500/80 bg-gradient-to-br from-rose-600 via-red-600 to-orange-600 flex flex-col items-center justify-center text-white shadow-xl shadow-rose-600/40 active:scale-90 transition-transform select-none touch-none ${
                  fireCooldown > 0 ? 'opacity-75' : ''
                }`}
              >
                <Crosshair className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                <span className="text-[8px] sm:text-[9px] font-black tracking-wider uppercase mt-0.5">
                  {fireCooldown > 0 ? `${fireCooldown.toFixed(1)}s` : 'TEMBAK'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
