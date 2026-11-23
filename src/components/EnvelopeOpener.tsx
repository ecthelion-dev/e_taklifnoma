import React, { useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import type { ColorPalette, InvitationData } from '../types/invitation';

interface EnvelopeOpenerProps {
  data: InvitationData;
  palette: ColorPalette;
  isLove: boolean;
  openLabel: string;
  onOpened: () => void;
}

interface BurstParticle {
  id: number;
  emoji: string;
  tx: string;
  ty: string;
  rot: string;
  size: number;
}

function playGentleChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.08, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.7);
    });
  } catch {
    // Audio playback is optional
  }
}

export const EnvelopeOpener: React.FC<EnvelopeOpenerProps> = ({
  data,
  palette,
  isLove,
  openLabel,
  onOpened,
}) => {
  const [stage, setStage] = useState<'closed' | 'opening' | 'lifting' | 'fading'>('closed');
  const [particles, setParticles] = useState<BurstParticle[]>([]);

  const handleOpen = () => {
    if (stage !== 'closed') return;
    playGentleChime();
    setStage('opening');

    // Generate celebration particle burst
    const symbols = isLove
      ? ['❤️', '💖', '🌸', '✨', '💕', '🌹']
      : ['✨', '🌟', '💐', '🎊', '🤍', '⭐'];

    const burst: BurstParticle[] = Array.from({ length: 24 }, (_, idx) => {
      const angle = (idx / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const dist = 90 + Math.random() * 140;
      return {
        id: idx,
        emoji: symbols[idx % symbols.length],
        tx: `${Math.round(Math.cos(angle) * dist)}px`,
        ty: `${Math.round(Math.sin(angle) * dist - 40)}px`,
        rot: `${Math.round((Math.random() - 0.5) * 180)}deg`,
        size: 16 + Math.round(Math.random() * 12),
      };
    });
    setParticles(burst);

    setTimeout(() => setStage('lifting'), 320);
    setTimeout(() => setStage('fading'), 1050);
    setTimeout(() => onOpened(), 1450);
  };

  const isDark = Boolean(palette.isDark);
  const flapColor = isDark ? palette.surface : palette.surface;
  const pocketShade = isDark ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.045)';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-4 transition-opacity duration-500 ${
        stage === 'fading' ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
      style={{ backgroundColor: palette.bg, color: palette.text }}
    >
      {/* Ambient soft background glow */}
      <div
        className="pointer-events-none absolute h-96 w-96 rounded-full blur-3xl opacity-30"
        style={{ backgroundColor: palette.accent }}
      />

      {/* Top Title Hint */}
      <div
        className={`mb-6 max-w-sm px-2 text-center transition-all duration-500 sm:mb-10 ${
          stage !== 'closed' ? '-translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <p className="text-[11px] font-semibold tracking-[0.22em] uppercase sm:text-xs" style={{ color: palette.accent }}>
          {data.title}
        </p>
        <h1 className="mt-2 break-words font-serif-display text-2xl font-bold sm:text-4xl" style={{ color: palette.primary }}>
          {data.heroNames}
        </h1>
      </div>

      {/* Interactive 3D Envelope */}
      <div
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleOpen();
        }}
        className="perspective-1000 relative cursor-pointer select-none"
      >
        {/* Burst Particles centered on the wax seal */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-40">
          {particles.map((p) => (
            <span
              key={p.id}
              className="animate-particle-burst absolute"
              style={
                {
                  fontSize: `${p.size}px`,
                  '--tx': p.tx,
                  '--ty': p.ty,
                  '--rot': p.rot,
                } as React.CSSProperties
              }
            >
              {p.emoji}
            </span>
          ))}
        </div>

        {/* Envelope Body — fluid width for 320px–desktop */}
        <div
          className="relative aspect-[370/256] w-[min(88vw,370px)] rounded-2xl shadow-2xl transition-transform duration-300 hover:scale-[1.02]"
          style={{
            backgroundColor: palette.surface,
            border: `1.5px solid ${palette.accent}66`,
            boxShadow: isDark
              ? '0 28px 70px rgba(0,0,0,0.65)'
              : '0 24px 60px rgba(28,25,23,0.16)',
          }}
        >
          {/* Inner Sliding Letter Card */}
          <div
            className="absolute right-3 left-3 z-10 flex flex-col items-center justify-center rounded-xl px-4 py-4 text-center shadow-lg transition-all duration-700 ease-out sm:right-4 sm:left-4 sm:px-5 sm:py-6"
            style={{
              backgroundColor: isDark ? '#1e1b24' : '#FFFEFC',
              border: `1px solid ${palette.accent}55`,
              top: '12px',
              bottom: '12px',
              transform:
                stage === 'lifting' || stage === 'fading'
                  ? 'translateY(-44%) scale(1.03)'
                  : stage === 'opening'
                    ? 'translateY(-10%)'
                    : 'translateY(0%)',
            }}
          >
            {isLove ? (
              <Heart className="h-6 w-6 fill-current" style={{ color: palette.accent }} />
            ) : (
              <Sparkles className="h-6 w-6" style={{ color: palette.accent }} />
            )}
            <p className="mt-2 text-[10px] font-semibold tracking-[0.22em] uppercase" style={{ color: palette.accent }}>
              {data.title}
            </p>
            <p className="mt-1 font-serif-display text-2xl font-bold" style={{ color: palette.primary }}>
              {data.heroNames}
            </p>
            {data.hostLine && (
              <p className="mt-1.5 line-clamp-2 text-[11px]" style={{ color: palette.muted }}>
                {data.hostLine}
              </p>
            )}
          </div>

          {/* Left & Right Envelope Side Folds (front pocket) */}
          <div
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl"
          >
            {/* Left fold */}
            <div
              className="absolute inset-y-0 left-0 w-1/2"
              style={{
                background: pocketShade,
                clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
              }}
            />
            {/* Right fold */}
            <div
              className="absolute inset-y-0 right-0 w-1/2"
              style={{
                background: pocketShade,
                clipPath: 'polygon(100% 0, 0 50%, 100% 100%)',
              }}
            />
            {/* Bottom fold */}
            <div
              className="absolute inset-x-0 bottom-0 h-[62%]"
              style={{
                backgroundColor: palette.surface,
                clipPath: 'polygon(0 100%, 50% 15%, 100% 100%)',
                borderTop: `1px solid ${palette.accent}33`,
              }}
            />
            {/* Gold diagonal accent line on bottom fold */}
            <svg viewBox="0 0 370 256" fill="none" className="absolute inset-0 h-full w-full">
              <path
                d="M2 254 L185 112 L368 254"
                stroke={palette.accent}
                strokeWidth="1.2"
                strokeOpacity="0.45"
              />
            </svg>
          </div>

          {/* Top Triangular Flap — rotates open in 3D */}
          <div
            className="preserve-3d pointer-events-none absolute inset-x-0 top-0 h-[58%] origin-top transition-transform duration-700 ease-in-out"
            style={{
              zIndex: stage === 'closed' ? 30 : 5,
              transform: stage === 'closed' ? 'rotateX(0deg)' : 'rotateX(178deg)',
            }}
          >
            <div
              className="h-full w-full rounded-t-2xl"
              style={{
                backgroundColor: flapColor,
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                boxShadow: 'inset 0 -2px 12px rgba(0,0,0,0.08)',
              }}
            />
            <svg viewBox="0 0 370 148" fill="none" className="absolute inset-0 h-full w-full">
              <path
                d="M2 2 L185 145 L368 2"
                stroke={palette.accent}
                strokeWidth="1.4"
                strokeOpacity="0.65"
              />
            </svg>
          </div>

          {/* Center Wax Seal Button */}
          <div
            className={`absolute top-[52%] left-1/2 z-40 flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
              stage === 'closed'
                ? 'animate-seal-pulse opacity-100'
                : '-translate-x-1/2 -translate-y-1/2 scale-0 opacity-0'
            }`}
            style={{
              backgroundColor: palette.accent,
              color: '#FFFFFF',
              border: '3px solid rgba(255,255,255,0.45)',
            }}
          >
            {isLove ? (
              <Heart className="h-7 w-7 fill-white text-white" />
            ) : (
              <Sparkles className="h-7 w-7 text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Bottom CTA Button */}
      <button
        type="button"
        onClick={handleOpen}
        className={`mt-10 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-105 ${
          stage !== 'closed' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
        }`}
        style={{
          backgroundColor: palette.primary,
          color: isDark ? '#111113' : '#FFFFFF',
        }}
      >
        {isLove ? <Heart className="h-4 w-4 fill-current" /> : <Sparkles className="h-4 w-4" />}
        {openLabel}
      </button>
    </div>
  );
};
