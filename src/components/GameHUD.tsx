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
  deaths,
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
  lockedTarget,
  killFeed,
  fireCooldown,
  dashCooldown,
  playerPos,
  playerAngle,
  botPositions,
  pickupPositions,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (p1Hp / p1MaxHp) * 100));
  const shieldPercent = Math.max(0, Math.min(100, (p1Shield / p1MaxShield) * 100));

  const rockets: RocketTypeId[] = ['fast', 'explosive', 'piercing'];

  // Drag-to-aim states on fire button
  const [aimOffset, setAimOffset] = useState<{ x: number; y: number } | null>(null);
  const fireTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchIdRef = useRef<number | null>(null);

  const handleFireTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current !== null) return;
    const t = e.changedTouches[0];
    touchIdRef.current = t.identifier;
    fireTouchStartRef.current = { x: t.clientX, y: t.clientY };
    setAimOffset({ x: 0, y: 0 });
  };

  const handleFireTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current === null || !fireTouchStartRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchIdRef.current) {
        const dx = t.clientX - fireTouchStartRef.current.x;
        const dy = t.clientY - fireTouchStartRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 60;
        const angle = Math.atan2(dy, dx);
        const clampedDist = Math.min(dist, maxDist);

        if (dist > 14) {
          setAimOffset({
            x: Math.cos(angle) * (clampedDist / maxDist),
            y: Math.sin(angle) * (clampedDist / maxDist),
          });
        } else {
          setAimOffset({ x: 0, y: 0 });
        }
        break;
      }
    }
  };

  const handleFireTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        fireTouchStartRef.current = null;

        // If dragged with aim
        if (aimOffset && (Math.abs(aimOffset.x) > 0.2 || Math.abs(aimOffset.y) > 0.2)) {
          onFire(aimOffset);
        } else {
          // Tap: Auto-aim!
          onFire(undefined);
        }
        setAimOffset(null);
        break;
      }
    }
  };

  const getRocketIcon = (id: RocketTypeId) => {
    switch (id) {
      case 'fast':
        return <Zap className="w-4 h-4" />;
      case 'explosive':
        return <Bomb className="w-4 h-4" />;
      case 'piercing':
        return <Flame className="w-4 h-4" />;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-3 safe-area-inset">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between w-full pointer-events-auto">
        {/* Left: Player Health & Shield */}
        <div className="flex flex-col gap-1.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 p-2.5 rounded-2xl min-w-[170px] shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>SHIELD</span>
            </span>
            <span className="font-mono text-cyan-400">{Math.round(p1Shield)}</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-cyan-500/20">
            <div
              style={{ width: `${shieldPercent}%` }}
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-200"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mt-0.5">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>ARMOR</span>
            </span>
            <span className="font-mono text-emerald-400">{Math.round(p1Hp)}</span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-emerald-500/20">
            <div
              style={{ width: `${hpPercent}%` }}
              className={`h-full transition-all duration-200 ${
                hpPercent > 50
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                  : hpPercent > 25
                  ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                  : 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse'
              }`}
            />
          </div>
        </div>

        {/* Center: Match Score & Lock-on Alert */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 px-4 py-2 rounded-2xl shadow-lg">
            <div className="flex items-center gap-1 text-amber-400 font-black text-sm">
              <Award className="w-4 h-4" />
              <span>{score}</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="flex items-center gap-1 text-rose-400 font-bold text-xs">
              <Crosshair className="w-3.5 h-3.5" />
              <span>{kills} KILLS</span>
            </div>
            {mode === 'coop_survival' && wave && (
              <>
                <div className="h-4 w-px bg-slate-700" />
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  WAVE {wave}
                </span>
              </>
            )}
          </div>

          {/* Target Lock-On Indicator Badge */}
          {lockedTarget ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/60 text-[11px] font-bold text-rose-300 shadow-lg shadow-rose-500/20 backdrop-blur animate-pulse">
              <Target className="w-3.5 h-3.5 text-rose-400 animate-spin-slow" />
              <span>TARGET TERKUNCI: {lockedTarget.name} ({Math.round(lockedTarget.dist)}m)</span>
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 font-semibold px-2">
              Mode Bidik: Otomatis saat musuh mendekat
            </div>
          )}
        </div>

        {/* Right: Camera toggle, Radar & Pause */}
        <div className="flex items-center gap-2">
          {/* Quick Camera Mode Switcher */}
          {onToggleCamera && (
            <button
              onClick={onToggleCamera}
              title="Ganti Mode Kamera"
              className="flex flex-col items-center justify-center px-2 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 backdrop-blur text-slate-300 hover:text-white active:scale-95 shadow"
            >
              <Video className="w-4 h-4 text-cyan-400" />
              <span className="text-[9px] font-bold uppercase mt-0.5">
                {cameraMode === 'tactical' ? 'Taktis' : '3D'}
              </span>
            </button>
          )}

          {/* Circular Radar */}
          <div className="relative w-15 h-15 rounded-full bg-slate-950/85 border-2 border-cyan-500/50 backdrop-blur-md overflow-hidden shadow-md flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
            <div className="absolute w-8 h-8 rounded-full border border-cyan-500/30" />
            <div className="absolute w-full h-[1px] bg-cyan-500/20" />
            <div className="absolute h-full w-[1px] bg-cyan-500/20" />

            {/* Radar Center (Player) */}
            <div
              style={{ transform: `rotate(${(-playerAngle * 180) / Math.PI}deg)` }}
              className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-cyan-400 z-10"
            />

            {/* Enemy Bot Blips */}
            {botPositions.map((b, idx) => {
              if (b.isDead) return null;
              const dx = ((b.x - playerPos.x) / 50) * 24;
              const dz = ((b.z - playerPos.z) / 50) * 24;
              const dist = Math.sqrt(dx * dx + dz * dz);
              if (dist > 25) return null;

              return (
                <div
                  key={idx}
                  style={{ transform: `translate(${dx}px, ${dz}px)` }}
                  className="absolute w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500 animate-pulse"
                />
              );
            })}

            {/* Pickups */}
            {pickupPositions.map((p, idx) => {
              if (!p.active) return null;
              const dx = ((p.x - playerPos.x) / 50) * 24;
              const dz = ((p.z - playerPos.z) / 50) * 24;
              const dist = Math.sqrt(dx * dx + dz * dz);
              if (dist > 25) return null;

              return (
                <div
                  key={'pk_' + idx}
                  style={{ transform: `translate(${dx}px, ${dz}px)` }}
                  className={`absolute w-1 h-1 rounded-full ${
                    p.type === 'shield' ? 'bg-cyan-400' : p.type === 'health' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
              );
            })}
          </div>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="w-10 h-10 rounded-2xl bg-slate-900/80 border border-slate-700/60 backdrop-blur-md flex items-center justify-center text-slate-300 hover:text-white active:scale-90 transition-transform shadow-lg"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kill Feed (Top-Left) */}
      <div className="flex flex-col gap-1 max-w-[240px] pointer-events-none mt-2">
        {killFeed.slice(-3).map((item) => (
          <div
            key={item.id}
            className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-200 backdrop-blur animate-fade-in flex items-center gap-1.5 shadow"
          >
            <span className={item.killer.startsWith('Pilot') ? 'text-cyan-400 font-bold' : 'text-slate-300'}>
              {item.killer}
            </span>
            <span className="text-rose-400">⚡</span>
            <span className={item.victim.startsWith('Pilot') ? 'text-red-400 font-bold' : 'text-slate-400'}>
              {item.victim}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom Controls Area */}
      <div className="flex items-end justify-between w-full pointer-events-auto pb-1">
        {/* Left: Movement Joystick with widened responsive touch area */}
        <div className="p-1">
          <VirtualJoystick size={138} label="KEMUDI" color="#06b6d4" onChange={onJoystickMove} />
        </div>

        {/* Center Bottom: Rocket Type Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 p-1.5 rounded-2xl shadow-xl mb-1">
          {rockets.map((type) => {
            const cfg = ROCKET_CONFIGS[type];
            const isEquipped = equippedRocket === type;

            return (
              <button
                key={type}
                onClick={() => onSwitchRocket(type)}
                className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  isEquipped
                    ? 'bg-gradient-to-b from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="mb-0.5">{getRocketIcon(type)}</div>
                <span className="text-[10px] tracking-tight">{cfg.nameId.replace('Roket ', '')}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Action Buttons (Fire & Dash) */}
        <div className="flex items-end gap-3 p-1">
          {/* Dash / Booster Button */}
          <button
            onClick={onDash}
            disabled={dashCooldown > 0}
            className={`relative w-13 h-13 rounded-2xl border flex flex-col items-center justify-center text-xs font-bold shadow-lg transition-transform active:scale-90 ${
              dashCooldown > 0
                ? 'border-slate-800 bg-slate-900/60 text-slate-500'
                : 'border-amber-500/50 bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-orange-500/30'
            }`}
          >
            <Zap className="w-5 h-5 mb-0.5" />
            <span className="text-[9px] font-mono leading-none">
              {dashCooldown > 0 ? `${dashCooldown.toFixed(1)}s` : 'DASH'}
            </span>
          </button>

          {/* Primary FIRE Button with Touch Drag Aim + Tap Auto-Aim */}
          <div className="relative">
            {/* Visual Aim Pointer Arrow if dragging */}
            {aimOffset && (Math.abs(aimOffset.x) > 0.1 || Math.abs(aimOffset.y) > 0.1) && (
              <div
                style={{
                  transform: `translate(${aimOffset.x * 60}px, ${aimOffset.y * 60}px)`,
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-cyan-400 border-2 border-white shadow-lg shadow-cyan-400/80 pointer-events-none z-30 animate-pulse"
              />
            )}

            <button
              onTouchStart={handleFireTouchStart}
              onTouchMove={handleFireTouchMove}
              onTouchEnd={handleFireTouchEnd}
              onClick={() => onFire(undefined)}
              disabled={fireCooldown > 0}
              className={`w-20 h-20 rounded-full border-4 border-rose-500/70 bg-gradient-to-br from-rose-600 via-red-600 to-orange-600 flex flex-col items-center justify-center text-white shadow-2xl shadow-rose-600/50 active:scale-90 transition-transform active:brightness-125 select-none ${
                fireCooldown > 0 ? 'opacity-80' : ''
              }`}
            >
              <Crosshair className="w-7 h-7 stroke-[2.5]" />
              <span className="text-[10px] font-black tracking-wider uppercase mt-0.5">
                {fireCooldown > 0 ? `${fireCooldown.toFixed(1)}s` : 'TEMBAK'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
