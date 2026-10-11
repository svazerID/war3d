import React, { useRef, useState, useCallback } from 'react';

interface VirtualJoystickProps {
  size?: number;
  label?: string;
  color?: string;
  onChange: (vector: { x: number; y: number }) => void;
  className?: string;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  size = 136,
  label = 'GERAK',
  color = '#06b6d4',
  onChange,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const radius = size / 2;
  const maxKnobOffset = radius * 0.75;

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;

      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const angle = Math.atan2(deltaY, deltaX);

      const clampedDist = Math.min(dist, maxKnobOffset);
      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;

      setKnobPos({ x: knobX, y: knobY });

      // Generous deadzone to prevent jitter, smooth linear response
      const normalizedDist = clampedDist / maxKnobOffset;
      if (normalizedDist < 0.08) {
        onChange({ x: 0, y: 0 });
      } else {
        onChange({
          x: Number((Math.cos(angle) * normalizedDist).toFixed(3)),
          y: Number((Math.sin(angle) * normalizedDist).toFixed(3)),
        });
      }
    },
    [maxKnobOffset, onChange]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsActive(true);
    handlePointer(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        handlePointer(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setIsActive(false);
        setKnobPos({ x: 0, y: 0 });
        onChange({ x: 0, y: 0 });
        break;
      }
    }
  };

  // Mouse fallback for desktop browser testing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsActive(true);
    handlePointer(e.clientX, e.clientY);

    const onMouseMove = (moveEvent: MouseEvent) => {
      handlePointer(moveEvent.clientX, moveEvent.clientY);
    };

    const onMouseUp = () => {
      setIsActive(false);
      setKnobPos({ x: 0, y: 0 });
      onChange({ x: 0, y: 0 });
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        touchAction: 'none',
      }}
      className={`relative select-none rounded-full border-2 border-slate-700/70 bg-slate-900/70 backdrop-blur-md flex items-center justify-center cursor-pointer shadow-2xl transition-colors ${
        isActive ? 'border-cyan-400 bg-slate-900/90 shadow-cyan-500/30' : ''
      } ${className}`}
    >
      {/* Outer subtle glow ring */}
      <div className="absolute inset-1 rounded-full border border-cyan-500/20 pointer-events-none" />

      {/* Direction Crosshairs */}
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-[1px] bg-slate-700/50 pointer-events-none" />
      <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-[1px] bg-slate-700/50 pointer-events-none" />

      {/* Label */}
      <span className="absolute -bottom-5 text-[10px] font-mono tracking-wider font-extrabold text-cyan-400 uppercase pointer-events-none drop-shadow">
        {label}
      </span>

      {/* Joystick Thumb Knob */}
      <div
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          borderColor: color,
        }}
        className={`w-13 h-13 rounded-full border-2 bg-gradient-to-br from-slate-800 to-slate-950 shadow-xl flex items-center justify-center pointer-events-none transition-transform duration-75 ${
          isActive ? 'scale-110 shadow-cyan-400/50 brightness-110' : ''
        }`}
      >
        <div
          style={{ backgroundColor: color }}
          className="w-4 h-4 rounded-full opacity-90 shadow-sm shadow-cyan-400"
        />
      </div>
    </div>
  );
};
