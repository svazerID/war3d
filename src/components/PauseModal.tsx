import React from 'react';
import {
  Volume2,
  VolumeX,
  Smartphone,
  Play,
  RotateCcw,
  Home,
  Video,
  Crosshair,
  Sliders,
  Sparkles,
  Gamepad2,
} from 'lucide-react';
import { PlayerProfile } from '../types/game';

interface PauseModalProps {
  profile: PlayerProfile;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
  onToggleCamera: () => void;
  onToggleAutoAim: () => void;
  onToggleAutoFire: () => void;
  onToggleControlScheme: () => void;
  onToggleSensitivity: () => void;
  onToggleInvertY?: () => void;
  onToggleInvertX?: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  profile,
  onResume,
  onRestart,
  onQuit,
  onToggleSound,
  onToggleHaptics,
  onToggleCamera,
  onToggleAutoAim,
  onToggleAutoFire,
  onToggleControlScheme,
  onToggleSensitivity,
  onToggleInvertY,
  onToggleInvertX,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-4 sm:p-5 text-white text-center">
        <h2 className="text-lg sm:text-xl font-black text-white tracking-wide mb-0.5">GAME DIHENTIKAN</h2>
        <p className="text-[10px] text-slate-400 mb-3">Pengaturan Kendali & Permainan</p>

        {/* Quick Settings Section */}
        <div className="space-y-1.5 mb-4 text-left">
          {/* Auto-Fire Toggle */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-white block">Tembak Otomatis (Auto-Fire)</span>
                <span className="text-[10px] text-slate-400">Tembak saat musuh di jangkauan</span>
              </div>
            </div>
            <button
              onClick={onToggleAutoFire}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                profile.autoFireEnabled
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {profile.autoFireEnabled ? 'AKTIF' : 'OFF'}
            </button>
          </div>

          {/* Camera Mode Toggle */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-xs font-bold text-white block">Tipe Kamera</span>
                <span className="text-[10px] text-slate-400">
                  {profile.cameraMode === 'tactical'
                    ? 'Sudut Atas (Stabil & Mudah)'
                    : 'Kamera Belakang 3D'}
                </span>
              </div>
            </div>
            <button
              onClick={onToggleCamera}
              className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold"
            >
              {profile.cameraMode === 'tactical' ? 'Taktis' : '3D'}
            </button>
          </div>

          {/* Control Scheme: Joystick vs D-Pad */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-xs font-bold text-white block">Model Kemudi</span>
                <span className="text-[10px] text-slate-400">
                  {profile.controlScheme === 'dpad' ? 'Tombol D-Pad (4 Arah)' : 'Joystick Analog Halus'}
                </span>
              </div>
            </div>
            <button
              onClick={onToggleControlScheme}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold"
            >
              {profile.controlScheme === 'dpad' ? 'D-Pad' : 'Joystick'}
            </button>
          </div>

          {/* Auto-Aim Assist Toggle */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-rose-400" />
              <div>
                <span className="text-xs font-bold text-white block">Kunci Target Otomatis</span>
                <span className="text-[10px] text-slate-400">Turret mengarah ke bot terdekat</span>
              </div>
            </div>
            <button
              onClick={onToggleAutoAim}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                profile.autoAimEnabled !== false
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {profile.autoAimEnabled !== false ? 'AKTIF' : 'OFF'}
            </button>
          </div>

          {/* Control Sensitivity Toggle */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-bold text-white block">Sensitivitas Kemudi</span>
                <span className="text-[10px] text-slate-400">Kecepatan putar tank</span>
              </div>
            </div>
            <button
              onClick={onToggleSensitivity}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold"
            >
              {profile.controlsSensitivity === 'normal' ? 'Normal' : 'Tinggi'}
            </button>
          </div>

          {/* Invert Analog Axis Settings */}
          {onToggleInvertY && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Arah Analog (Vertikal / Y)</span>
                <span className="text-[10px] text-slate-400">
                  {profile.invertY ? 'Invert (Atas = mundur)' : 'Normal (Atas = maju)'}
                </span>
              </div>
              <button
                onClick={onToggleInvertY}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                  profile.invertY
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {profile.invertY ? 'INVERT: ON' : 'NORMAL'}
              </button>
            </div>
          )}

          {onToggleInvertX && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Arah Analog (Horisontal / X)</span>
                <span className="text-[10px] text-slate-400">
                  {profile.invertX ? 'Invert (Kiri = kanan)' : 'Normal (Kiri = kiri)'}
                </span>
              </div>
              <button
                onClick={onToggleInvertX}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                  profile.invertX
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {profile.invertX ? 'INVERT: ON' : 'NORMAL'}
              </button>
            </div>
          )}
        </div>

        {/* Audio & Haptic Controls */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={onToggleSound}
            className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-[10px] font-bold transition-all ${
              profile.soundEnabled
                ? 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300'
                : 'border-slate-800 bg-slate-950 text-slate-500'
            }`}
          >
            {profile.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{profile.soundEnabled ? 'Suara ON' : 'Suara OFF'}</span>
          </button>

          <button
            onClick={onToggleHaptics}
            className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-[10px] font-bold transition-all ${
              profile.hapticsEnabled
                ? 'border-amber-500/50 bg-amber-950/40 text-amber-300'
                : 'border-slate-800 bg-slate-950 text-slate-500'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{profile.hapticsEnabled ? 'Getar ON' : 'Getar OFF'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onResume}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>LANJUTKAN TEMPUR</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ULANGI PERTANDINGAN</span>
          </button>

          <button
            onClick={onQuit}
            className="w-full py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>KEMBALI KE MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
