import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QrCode, Sparkles, ArrowLeft, Heart } from 'lucide-react';
import { api } from '../lib/api';
import type { InvitationData, RsvpItem } from '../types/invitation';
import { InvitationRenderer } from '../templates/InvitationRenderer';
import { getPalette } from '../templates/catalog';
import { getTranslations } from '../i18n/translations';
import { QrModal } from '../components/QrModal';
import { EnvelopeOpener } from '../components/EnvelopeOpener';

interface FloatingReaction {
  id: number;
  emoji: string;
  left: string;
  drift: string;
  rot: string;
}

export const InvitationPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<InvitationData | null>(null);
  const [wishes, setWishes] = useState<RsvpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [opened, setOpened] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setOpened(false);
    api
      .getInvitation(slug)
      .then((res) => {
        setData(res.invitation);
        setWishes(res.wishes || []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Taklifnoma topilmadi');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const launchReactions = (isLove: boolean) => {
    const emojis = isLove ? ['❤️', '💖', '🌸', '💕', '✨'] : ['✨', '🎊', '💐', '🌟', '🤍'];
    const batch: FloatingReaction[] = Array.from({ length: 8 }, (_, idx) => ({
      id: Date.now() + idx + Math.random(),
      emoji: emojis[idx % emojis.length],
      left: `${15 + Math.random() * 70}%`,
      drift: `${Math.round((Math.random() - 0.5) * 120)}px`,
      rot: `${Math.round((Math.random() - 0.5) * 60)}deg`,
    }));
    setReactions((prev) => [...prev.slice(-24), ...batch]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((item) => !batch.some((b) => b.id === item.id)));
    }, 2800);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-900 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F5] px-4 text-center">
        <h1 className="font-serif-display text-3xl font-bold text-stone-900">404</h1>
        <p className="mt-2 text-sm text-stone-600">{error || 'Taklifnoma topilmadi.'}</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Bosh sahifa
        </Link>
      </div>
    );
  }

  const palette = getPalette(data.templateId, data.paletteId);
  const t = getTranslations(data.lang).invitation;
  const isLoveTemplate =
    data.templateId === 'sevgi-maktub' ||
    data.templateId === 'sevgi-test' ||
    data.templateId === 'romantik-kecha' ||
    data.templateId === 'kechirim' ||
    data.templateId === 'sogindim';

  if (!opened) {
    return (
      <EnvelopeOpener
        data={data}
        palette={palette}
        isLove={isLoveTemplate}
        openLabel={isLoveTemplate ? t.openLoveEnvelope : t.openEnvelope}
        onOpened={() => {
          setOpened(true);
          launchReactions(isLoveTemplate);
        }}
      />
    );
  }

  const ambientSymbols = isLoveTemplate ? ['🌸', '❤️', '✨', '💕'] : ['✨', '🌟', '🤍'];

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ backgroundColor: palette.bg }}>
      {/* Subtle Ambient Drifting Petals / Sparkles */}
      <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
        {Array.from({ length: 10 }, (_, idx) => (
          <span
            key={idx}
            className="animate-ambient-fall absolute text-sm opacity-0"
            style={
              {
                left: `${(idx * 11 + 4) % 95}%`,
                '--dur': `${11 + (idx % 5) * 2.5}s`,
                '--delay': `${(idx % 6) * 1.4}s`,
                '--drift': `${(idx % 2 === 0 ? 1 : -1) * (25 + (idx % 3) * 15)}px`,
              } as React.CSSProperties
            }
          >
            {ambientSymbols[idx % ambientSymbols.length]}
          </span>
        ))}
      </div>

      {/* Interactive Reaction Stream */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        {reactions.map((r) => (
          <span
            key={r.id}
            className="animate-float-up absolute bottom-8 text-2xl"
            style={
              {
                left: r.left,
                '--drift': r.drift,
                '--rot': r.rot,
              } as React.CSSProperties
            }
          >
            {r.emoji}
          </span>
        ))}
      </div>

      {/* Top Floating Bar */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between gap-2 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3"
        style={{ backgroundColor: `${palette.bg}CC` }}
      >
        <Link
          to="/"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition hover:opacity-80 sm:px-3"
          style={{
            backgroundColor: palette.surface,
            color: palette.primary,
            border: `1px solid ${palette.accent}44`,
          }}
        >
          <Sparkles className="h-3.5 w-3.5" style={{ color: palette.accent }} />
          eTaklif
        </Link>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setShowQr(true)}
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition hover:opacity-80 sm:gap-1.5 sm:px-3 sm:text-xs"
            style={{
              backgroundColor: palette.surface,
              color: palette.primary,
              border: `1px solid ${palette.accent}44`,
            }}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span className="hidden xs:inline sm:inline">{t.qrButton}</span>
          </button>
          <Link
            to={`/create?template=${data.templateId}`}
            className="truncate rounded-full px-3 py-1.5 text-[11px] font-semibold transition hover:opacity-90 sm:px-3.5 sm:text-xs"
            style={{
              backgroundColor: palette.primary,
              color: palette.isDark ? '#111113' : '#FFFFFF',
            }}
          >
            {t.createOwn}
          </Link>
        </div>
      </div>

      {/* Smooth Reveal Wrapper */}
      <div className="animate-fade-in-up relative z-20">
        <InvitationRenderer
          data={data}
          wishes={wishes}
          onCelebrate={() => launchReactions(isLoveTemplate)}
          onRsvpSubmitted={(rsvp) => {
            launchReactions(isLoveTemplate);
            if (rsvp.wishMessage) {
              setWishes((prev) => [rsvp, ...prev]);
            }
          }}
        />
      </div>

      {/* Interactive Floating Reaction Button */}
      <button
        type="button"
        onClick={() => launchReactions(isLoveTemplate)}
        title={isLoveTemplate ? '❤️' : '✨'}
        className="fixed right-4 bottom-4 z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-xl transition active:scale-90 hover:scale-110 sm:right-5 sm:bottom-5 sm:h-14 sm:w-14"
        style={{
          backgroundColor: palette.accent,
          color: '#FFFFFF',
          border: '2px solid rgba(255,255,255,0.5)',
        }}
      >
        {isLoveTemplate ? <Heart className="h-6 w-6 fill-white" /> : <Sparkles className="h-6 w-6" />}
      </button>

      {showQr && <QrModal slug={data.slug} title={data.heroNames} onClose={() => setShowQr(false)} />}
    </div>
  );
};
