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
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.07, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.7);
    });
  } catch {
    // Optional audio
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

    const symbols = isLove
      ? ['❤️', '💖', '🌸', '✨', '💕', '🌹']
      : ['✨', '🌟', '💐', '🎊', '🤍', '⭐'];

    const burst: BurstParticle[] = Array.from({ length: 24 }, (_, idx) => {
      const angle = (idx / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const dist = 85 + Math.random() * 135;
      return {
        id: idx,
        emoji: symbols[idx % symbols.length],
        tx: `${Math.round(Math.cos(angle) * dist)}px`,
        ty: `${Math.round(Math.sin(angle) * dist - 36)}px`,
        rot: `${Math.round((Math.random() - 0.5) * 180)}deg`,
        size: 16 + Math.round(Math.random() * 11),
      };
    });
    setParticles(burst);

    setTimeout(() => setStage('lifting'), 340);
    setTimeout(() => setStage('fading'), 1080);
    setTimeout(() => onOpened(), 1480);
  };

  const isDark = Boolean(palette.isDark);
  const envelopeBase = palette.surface;
  const envelopeInside = isDark ? '#120D14' : '#F2ECE4';
  const sideFoldFilter = isDark ? 'brightness(0.9)' : 'brightness(0.96)';
  const bottomFoldFilter = isDark ? 'brightness(1.06)' : 'brightness(0.99)';
  const flapFilter = isDark ? 'brightness(1.12)' : 'brightness(1.02)';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-4 transition-all duration-500 ${
        stage === 'fading' ? 'scale-105 opacity-0' : 'scale-100 opacity-100'
      }`}
      style={{ backgroundColor: palette.bg, color: palette.text }}
    >
      {/* Soft radial ambient halo */}
      <div
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: palette.accent }}
      />

      {/* Top Header */}
      <div
        className={`mb-7 max-w-sm px-2 text-center transition-all duration-500 sm:mb-10 ${
          stage !== 'closed' ? '-translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <p
          className="text-[11px] font-semibold tracking-[0.26em] uppercase sm:text-xs"
          style={{ color: palette.accent }}
        >
          {data.title}
        </p>
        <h1
          className="mt-2 break-words font-serif-display text-3xl font-bold sm:text-4xl"
          style={{ color: palette.primary }}
        >
          {data.heroNames}
        </h1>
      </div>

      {/* Luxury 3D Sealed Envelope */}
      <div
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleOpen();
        }}
        className="perspective-1000 group relative cursor-pointer select-none"
      >
        {/* Celebration Burst Particles */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-50">
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

        {/* Outer Envelope Container */}
        <div
          className="relative aspect-[370/248] w-[min(88vw,380px)] rounded-2xl transition-transform duration-300 group-hover:scale-[1.02]"
          style={{
            backgroundColor: envelopeInside,
            boxShadow: isDark
              ? `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px ${palette.accent}44`
              : `0 26px 64px rgba(28,25,23,0.16), 0 0 0 1px ${palette.accent}55`,
          }}
        >
          {/* Inner Letter Card — 100% hidden while closed, smoothly rises when opened */}
          <div
            className="absolute right-4 left-4 z-10 flex flex-col items-center justify-center rounded-xl px-5 py-5 text-center shadow-xl transition-all duration-700 ease-out"
            style={{
              backgroundColor: isDark ? '#1D1821' : '#FFFEFB',
              border: `1px solid ${palette.accent}66`,
              top: '14px',
              bottom: '14px',
              opacity: stage === 'lifting' || stage === 'fading' ? 1 : 0,
              transform:
                stage === 'lifting' || stage === 'fading'
                  ? 'translateY(-48%) scale(1.03)'
                  : 'translateY(6%) scale(0.96)',
            }}
          >
            {isLove ? (
              <Heart className="h-6 w-6 fill-current" style={{ color: palette.accent }} />
            ) : (
              <Sparkles className="h-6 w-6" style={{ color: palette.accent }} />
            )}
            <p
              className="mt-2 text-[10px] font-semibold tracking-[0.22em] uppercase"
              style={{ color: palette.accent }}
            >
              {data.title}
            </p>
            <p className="mt-1 line-clamp-1 font-serif-display text-2xl font-bold" style={{ color: palette.primary }}>
              {data.heroNames}
            </p>
          </div>

          {/* Opaque Front Envelope Pocket (Left, Right, Bottom solid folds) */}
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl">
            {/* Left solid triangle fold */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: envelopeBase,
                filter: sideFoldFilter,
                clipPath: 'polygon(0 0, 52% 52%, 0 100%)',
              }}
            />
            {/* Right solid triangle fold */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: envelopeBase,
                filter: sideFoldFilter,
                clipPath: 'polygon(100% 0, 48% 52%, 100% 100%)',
              }}
            />
            {/* Bottom solid trapezoid/triangle fold */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: envelopeBase,
                filter: bottomFoldFilter,
                clipPath: 'polygon(0 100%, 50% 44%, 100% 100%)',
              }}
            />

            {/* Crisp foil crease & decorative inner frame lines */}
            <svg viewBox="0 0 370 248" fill="none" className="absolute inset-0 h-full w-full">
              {/* Subtle outer satin border */}
              <rect
                x="7"
                y="7"
                width="356"
                height="234"
                rx="11"
                stroke={palette.accent}
                strokeWidth="0.9"
                strokeOpacity="0.32"
              />
              {/* Bottom fold shadow + gold edge */}
              <path
                d="M1 247 L185 110 L369 247"
                stroke={palette.accent}
                strokeWidth="1.2"
                strokeOpacity="0.55"
              />
              {/* Subtle side creases */}
              <path
                d="M1 1 L156 130 M369 1 L214 130"
                stroke={palette.accent}
                strokeWidth="0.8"
                strokeOpacity="0.28"
              />
            </svg>
          </div>

          {/* Top Triangular Flap — solid opaque paper rotating open in 3D */}
          <div
            className="preserve-3d pointer-events-none absolute inset-x-0 top-0 h-[56%] origin-top transition-transform duration-700 ease-in-out"
            style={{
              zIndex: stage === 'closed' ? 30 : 5,
              transform: stage === 'closed' ? 'rotateX(0deg)' : 'rotateX(178deg)',
              filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.22))',
            }}
          >
            <div
              className="h-full w-full rounded-t-2xl"
              style={{
                backgroundColor: envelopeBase,
                filter: flapFilter,
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              }}
            />
            <svg viewBox="0 0 370 139" fill="none" className="absolute inset-0 h-full w-full">
              <path
                d="M2 2 L185 137 L368 2"
                stroke={palette.accent}
                strokeWidth="1.5"
                strokeOpacity="0.7"
              />
              <path
                d="M18 6 L185 127 L352 6"
                stroke={palette.accent}
                strokeWidth="0.7"
                strokeOpacity="0.32"
              />
            </svg>
          </div>

          {/* Embossed 3D Wax Seal Button */}
          <div
            className={`absolute top-[54%] left-1/2 z-40 flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 sm:h-[68px] sm:w-[68px] ${
              stage === 'closed'
                ? 'animate-seal-pulse opacity-100'
                : '-translate-x-1/2 -translate-y-1/2 scale-0 opacity-0'
            }`}
            style={{
              background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.38) 0%, ${palette.accent} 45%, rgba(0,0,0,0.28) 100%)`,
              backgroundColor: palette.accent,
              boxShadow: '0 10px 26px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.45)',
              border: '2px solid rgba(255,255,255,0.35)',
            }}
          >
            {/* Inner embossed wax ring */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-black/5">
              {isLove ? (
                <Heart className="h-6 w-6 fill-white text-white drop-shadow-xs" />
              ) : (
                <Sparkles className="h-6 w-6 text-white drop-shadow-xs" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Open CTA */}
      <button
        type="button"
        onClick={handleOpen}
        className={`mt-9 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-105 ${
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
