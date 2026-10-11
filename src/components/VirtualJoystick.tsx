import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface VirtualJoystickProps {
  size?: number;
  label?: string;
  color?: string;
  mode?: 'fixed' | 'dpad';
  onChange: (vector: { x: number; y: number }) => void;
  className?: string;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  size = 110,
  label = 'KEMUDI',
  color = '#06b6d4',
  mode = 'fixed',
  onChange,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const [currentVector, setCurrentVector] = useState({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);

  const radius = size / 2;
  const maxKnobOffset = radius * 0.72;

  const processPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const deltaX = clientX - cx;
      const deltaY = clientY - cy;

      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const angle = Math.atan2(deltaY, deltaX);

      const clampedDist = Math.min(dist, maxKnobOffset);
      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;

      setKnobPos({ x: knobX, y: knobY });

      const normalizedDist = clampedDist / maxKnobOffset;
      if (normalizedDist < 0.08) {
        setCurrentVector({ x: 0, y: 0 });
        onChange({ x: 0, y: 0 });
      } else {
        const vx = Number((Math.cos(angle) * normalizedDist).toFixed(3));
        const vy = Number((Math.sin(angle) * normalizedDist).toFixed(3));
        setCurrentVector({ x: vx, y: vy });
        onChange({ x: vx, y: vy });
      }
    },
    [maxKnobOffset, onChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    activePointerIdRef.current = e.pointerId;
    setIsActive(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }
    processPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    processPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    activePointerIdRef.current = null;
    setIsActive(false);
    setKnobPos({ x: 0, y: 0 });
    setCurrentVector({ x: 0, y: 0 });
    onChange({ x: 0, y: 0 });
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      onChange({ x: 0, y: 0 });
    };
  }, [onChange]);

  // Active directions for visual feedback
  const isUpActive = currentVector.y < -0.25;
  const isDownActive = currentVector.y > 0.25;
  const isLeftActive = currentVector.x < -0.25;
  const isRightActive = currentVector.x > 0.25;

  // D-Pad mode layout
  if (mode === 'dpad') {
    const handleDirPress = (dx: number, dy: number) => {
      onChange({ x: dx, y: dy });
    };

    const handleDirRelease = () => {
      onChange({ x: 0, y: 0 });
    };

    return (
      <div className={`relative grid grid-cols-3 gap-1 w-24 h-24 sm:w-28 sm:h-28 select-none touch-none ${className}`}>
        <div />
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); handleDirPress(0, -1); }}
          onPointerUp={handleDirRelease}
          onPointerCancel={handleDirRelease}
          className="rounded-xl bg-slate-900/90 border border-cyan-500/50 active:bg-cyan-500 active:text-slate-950 flex items-center justify-center text-cyan-300 shadow touch-none"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <div />

        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); handleDirPress(-1, 0); }}
          onPointerUp={handleDirRelease}
          onPointerCancel={handleDirRelease}
          className="rounded-xl bg-slate-900/90 border border-cyan-500/50 active:bg-cyan-500 active:text-slate-950 flex items-center justify-center text-cyan-300 shadow touch-none"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center justify-center text-[9px] font-mono font-bold text-slate-500">
          DPAD
        </div>
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); handleDirPress(1, 0); }}
          onPointerUp={handleDirRelease}
          onPointerCancel={handleDirRelease}
          className="rounded-xl bg-slate-900/90 border border-cyan-500/50 active:bg-cyan-500 active:text-slate-950 flex items-center justify-center text-cyan-300 shadow touch-none"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div />
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); handleDirPress(0, 1); }}
          onPointerUp={handleDirRelease}
          onPointerCancel={handleDirRelease}
          className="rounded-xl bg-slate-900/90 border border-cyan-500/50 active:bg-cyan-500 active:text-slate-950 flex items-center justify-center text-cyan-300 shadow touch-none"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
        <div />
      </div>
    );
  }

  // Smooth Fixed Analog Joystick with Real-time Direction Glow
  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        touchAction: 'none',
      }}
      className={`relative select-none rounded-full border-2 border-slate-700/80 bg-slate-950/75 backdrop-blur-md flex items-center justify-center cursor-pointer shadow-xl transition-colors touch-none ${
        isActive ? 'border-cyan-400 bg-slate-950/90 shadow-cyan-500/40' : ''
      } ${className}`}
    >
      {/* 4 Direction Indicator Chevrons with active highlight */}
      <div
        className={`absolute top-1 left-1/2 -translate-x-1/2 text-[9px] transition-colors pointer-events-none ${
          isUpActive ? 'text-cyan-400 font-black scale-125' : 'text-slate-600'
        }`}
      >
        ▲
      </div>
      <div
        className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] transition-colors pointer-events-none ${
          isDownActive ? 'text-cyan-400 font-black scale-125' : 'text-slate-600'
        }`}
      >
        ▼
      </div>
      <div
        className={`absolute left-1 top-1/2 -translate-y-1/2 text-[9px] transition-colors pointer-events-none ${
          isLeftActive ? 'text-cyan-400 font-black scale-125' : 'text-slate-600'
        }`}
      >
        ◄
      </div>
      <div
        className={`absolute right-1 top-1/2 -translate-y-1/2 text-[9px] transition-colors pointer-events-none ${
          isRightActive ? 'text-cyan-400 font-black scale-125' : 'text-slate-600'
        }`}
      >
        ►
      </div>

      {/* Axis crosshairs */}
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-[1px] bg-slate-700/40 pointer-events-none" />
      <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-[1px] bg-slate-700/40 pointer-events-none" />

      {/* Label under joystick */}
      <span className="absolute -bottom-4 text-[8px] sm:text-[9px] font-mono tracking-wider font-extrabold text-cyan-400 uppercase pointer-events-none drop-shadow">
        {label}
      </span>

      {/* Joystick Thumb Knob */}
      <div
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          borderColor: color,
        }}
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 bg-gradient-to-br from-slate-800 to-slate-950 shadow-lg flex items-center justify-center pointer-events-none transition-transform duration-75 ${
          isActive ? 'scale-110 shadow-cyan-400/60 ring-2 ring-cyan-400/30' : ''
        }`}
      >
        <div
          style={{ backgroundColor: color }}
          className="w-3.5 h-3.5 rounded-full opacity-90 shadow-sm shadow-cyan-400"
        />
      </div>
    </div>
  );
};
