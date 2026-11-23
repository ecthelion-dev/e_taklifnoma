import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  CheckCircle2,
  Send,
  Heart,
  ExternalLink,
  CalendarPlus,
  Shirt,
  RotateCcw,
} from 'lucide-react';
import type { InvitationData, RsvpItem } from '../types/invitation';
import { getPalette } from './catalog';
import {
  MilliyArchOrnament,
  ClassicFlourish,
  IslamicArchOrnament,
  RoyalCrestOrnament,
  LoveSealOrnament,
  StarryHeartOrnament,
  FestiveGarlandOrnament,
  ForgivenessOrnament,
  GratitudeSunOrnament,
  MissYouPlaneOrnament,
  GreetingBouquetOrnament,
  CornerOrnament,
} from './Ornaments';
import { formatEventDate, getTranslations } from '../i18n/translations';
import { api } from '../lib/api';

interface InvitationRendererProps {
  data: InvitationData;
  wishes?: RsvpItem[];
  isPreview?: boolean;
  onRsvpSubmitted?: (rsvp: RsvpItem) => void;
  onCelebrate?: () => void;
}

function useCountdown(dateStr: string, timeStr: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, passed: false });

  useEffect(() => {
    const compute = () => {
      if (!dateStr) return;
      const target = new Date(`${dateStr}T${timeStr || '18:00'}:00`);
      const diff = target.getTime() - Date.now();
      if (isNaN(diff) || diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, passed: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds, passed: false });
    };
    compute();
    const timer = setInterval(compute, 1000);
    return () => clearInterval(timer);
  }, [dateStr, timeStr]);

  return timeLeft;
}

function downloadIcs(data: InvitationData) {
  const dateCompact = (data.eventDate || '').replace(/-/g, '');
  const timeCompact = (data.eventTime || '18:00').replace(/:/g, '') + '00';
  const start = `${dateCompact}T${timeCompact}`;
  const endHour = String(Math.min(23, Number((data.eventTime || '18:00').split(':')[0]) + 4)).padStart(2, '0');
  const endMin = (data.eventTime || '18:00').split(':')[1] || '00';
  const end = `${dateCompact}T${endHour}${endMin}00`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//eTaklif//Invitation//EN',
    'BEGIN:VEVENT',
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${data.title} — ${data.heroNames}`,
    `LOCATION:${data.venueName}${data.venueAddress ? ', ' + data.venueAddress : ''}`,
    `DESCRIPTION:${(data.welcomeText || '').replace(/\n/g, ' ')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.slug || 'taklifnoma'}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export const InvitationRenderer: React.FC<InvitationRendererProps> = ({
  data,
  wishes = [],
  isPreview = false,
  onRsvpSubmitted,
  onCelebrate,
}) => {
  const palette = getPalette(data.templateId, data.paletteId);
  const t = getTranslations(data.lang).invitation;
  const countdown = useCountdown(data.eventDate, data.eventTime);

  const isLoveTemplate =
    data.templateId === 'sevgi-maktub' ||
    data.templateId === 'sevgi-test' ||
    data.templateId === 'romantik-kecha';

  const isPersonalCard =
    isLoveTemplate ||
    data.templateId === 'kechirim' ||
    data.templateId === 'rahmat' ||
    data.templateId === 'sogindim' ||
    data.templateId === 'tabrik';

  // Interactive Forgiveness (Kechirim) state
  const [forgiven, setForgiven] = useState(false);
  const [dodgeCount, setDodgeCount] = useState(0);
  const [dodgeOffset, setDodgeOffset] = useState({ x: 0, y: 0 });

  // Interactive Virtual Hug (Sog'indim) state
  const [hugCount, setHugCount] = useState(0);

  const handleDodge = () => {
    setDodgeCount((c) => c + 1);
    const x = Math.round((Math.random() - 0.5) * 96);
    const y = Math.round((Math.random() - 0.5) * 44);
    setDodgeOffset({ x, y });
  };

  // Interactive Love Quiz state
  const quizQuestions = Array.isArray(data.quiz) ? data.quiz.filter((q) => q.question.trim()) : [];
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizDone, setQuizDone] = useState(false);

  // Reset quiz if question count changes in live preview
  useEffect(() => {
    setQuizIndex(0);
    setQuizAnswers([]);
    setQuizDone(false);
  }, [quizQuestions.length, data.slug]);

  const correctCount = quizAnswers.reduce(
    (acc, ans, idx) => (quizQuestions[idx] && ans === quizQuestions[idx].correctIndex ? acc + 1 : acc),
    0
  );
  const quizPercent =
    quizQuestions.length > 0 && quizDone ? Math.round((correctCount / quizQuestions.length) * 100) : null;

  const handleSelectQuizOption = (optIdx: number) => {
    const nextAnswers = [...quizAnswers, optIdx];
    setQuizAnswers(nextAnswers);
    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex(quizIndex + 1);
    } else {
      setQuizDone(true);
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setQuizAnswers([]);
    setQuizDone(false);
  };

  // RSVP state
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [attendance, setAttendance] = useState<'yes' | 'no' | 'maybe'>('yes');
  const [guestsCount, setGuestsCount] = useState(isLoveTemplate ? 1 : 2);
  const [wishMessage, setWishMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rsvpError, setRsvpError] = useState('');

  const handleRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview) {
      setSubmitted(true);
      return;
    }
    if (!guestName.trim()) return;
    setSubmitting(true);
    setRsvpError('');
    try {
      const res = await api.submitRsvp(data.slug, {
        guestName: guestName.trim(),
        phone: phone.trim(),
        attendance,
        guestsCount,
        wishMessage: wishMessage.trim(),
        quizScore: quizPercent,
      });
      setSubmitted(true);
      onRsvpSubmitted?.(res.rsvp);
    } catch (err) {
      setRsvpError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const isDark = Boolean(palette.isDark);
  const borderColor = isDark ? 'rgba(232, 197, 104, 0.24)' : 'rgba(28, 25, 23, 0.1)';
  const subtleBg = isDark ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.025)';
  const formattedDate = formatEventDate(data.eventDate, data.lang);

  const monogram = data.heroNames
    .split(/[&,+❤️]|va|и/i)
    .map((s) => s.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join(' & ');

  return (
    <div
      className="min-h-full w-full transition-colors duration-300"
      style={{
        backgroundColor: palette.bg,
        color: palette.text,
      }}
    >
      <div className="mx-auto max-w-xl px-3 py-6 sm:px-6 sm:py-12">
        {/* Main Framed Card */}
        <div
          className="relative overflow-hidden rounded-[24px] px-4 py-8 shadow-xl sm:rounded-[28px] sm:px-10 sm:py-14"
          style={{
            backgroundColor: palette.surface,
            border: `1.5px solid ${
              data.templateId === 'zamonaviy' ? borderColor : `${palette.accent}55`
            }`,
            boxShadow: isDark
              ? '0 24px 70px rgba(0,0,0,0.55)'
              : '0 20px 60px rgba(28,25,23,0.08)',
          }}
        >
          {/* Decorative Corners */}
          {data.templateId !== 'zamonaviy' && (
            <>
              <CornerOrnament color={palette.accent} className="pointer-events-none absolute top-3 left-3 h-12 w-12" />
              <CornerOrnament color={palette.accent} className="pointer-events-none absolute top-3 right-3 h-12 w-12 rotate-90" />
              <CornerOrnament color={palette.accent} className="pointer-events-none absolute bottom-3 left-3 h-12 w-12 -rotate-90" />
              <CornerOrnament color={palette.accent} className="pointer-events-none absolute right-3 bottom-3 h-12 w-12 rotate-180" />
            </>
          )}

          {/* HERO SECTION */}
          <div className={`relative z-10 ${data.templateId === 'zamonaviy' ? 'text-left' : 'text-center'}`}>
            {data.showBismillah && (
              <div className={`mb-4 ${data.templateId === 'zamonaviy' ? 'text-left' : 'text-center'}`}>
                <p className="font-arabic text-2xl tracking-wide sm:text-3xl" style={{ color: palette.accent }}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
              </div>
            )}

            {/* Template Top Ornaments */}
            {data.templateId === 'milliy' && (
              <MilliyArchOrnament color={palette.primary} accent={palette.accent} className="mx-auto mb-3 h-16 w-72 max-w-full sm:h-20" />
            )}
            {data.templateId === 'islomiy' && (
              <IslamicArchOrnament color={palette.primary} accent={palette.accent} className="mx-auto mb-3 h-20 w-72 max-w-full sm:h-24" />
            )}
            {data.templateId === 'shohona' && (
              <RoyalCrestOrnament color={palette.primary} className="mx-auto mb-3 h-12 w-64 max-w-full sm:h-14" />
            )}
            {(data.templateId === 'sevgi-maktub' || data.templateId === 'sevgi-test') && (
              <LoveSealOrnament color={palette.primary} accent={palette.accent} className="mx-auto mb-3 h-14 w-64 max-w-full sm:h-16" />
            )}
            {data.templateId === 'romantik-kecha' && (
              <StarryHeartOrnament color={palette.primary} accent={palette.accent} className="mx-auto mb-3 h-16 w-64 max-w-full sm:h-18" />
            )}
            {data.templateId === 'bayram' && (
              <FestiveGarlandOrnament color={palette.primary} accent={palette.accent} className="mx-auto mb-3 h-12 w-64 max-w-full sm:h-14" />
            )}
            {data.templateId === 'kechirim' && (
              <ForgivenessOrnament color={palette.primary} accent={palette.accent} className="mx-auto mb-3 h-14 w-64 max-w-full sm:h-16" />
            )}
            {data.templateId === 'rahmat' && (
              <GratitudeSunOrnament color={palette.primary} accent={palette.accent} className="mx-auto mb-3 h-14 w-64 max-w-full sm:h-16" />
            )}
            {data.templateId === 'sogindim' && (
              <MissYouPlaneOrnament color={palette.primary} accent={palette.accent} className="mx-auto mb-3 h-14 w-64 max-w-full sm:h-16" />
            )}
            {data.templateId === 'tabrik' && (
              <GreetingBouquetOrnament color={palette.primary} accent={palette.accent} className="mx-auto mb-3 h-14 w-64 max-w-full sm:h-16" />
            )}
            {data.templateId === 'klassik' && monogram && (
              <div
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full font-serif-display text-xl font-semibold tracking-wider"
                style={{
                  border: `1.5px solid ${palette.accent}`,
                  color: palette.primary,
                  backgroundColor: `${palette.accent}14`,
                }}
              >
                {monogram}
              </div>
            )}

            {/* Title */}
            {data.templateId === 'zamonaviy' ? (
              <div className="mb-6 flex items-center justify-between border-b pb-4" style={{ borderColor }}>
                <span className="text-[11px] font-semibold tracking-[0.25em] uppercase" style={{ color: palette.primary }}>
                  {data.title || 'INVITATION'}
                </span>
                <span className="text-xs font-medium" style={{ color: palette.muted }}>
                  {data.eventDate}
                </span>
              </div>
            ) : (
              <p className="mb-3 text-xs font-semibold tracking-[0.24em] uppercase" style={{ color: palette.accent }}>
                {data.title}
              </p>
            )}

            {/* Hero Names */}
            <h1
              className={
                data.templateId === 'zamonaviy'
                  ? 'break-words font-serif-display text-4xl leading-[1.08] font-medium tracking-tight sm:text-6xl'
                  : 'break-words font-serif-display text-3xl leading-tight font-semibold tracking-wide sm:text-5xl'
              }
              style={{ color: palette.primary }}
            >
              {data.heroNames || 'Javohir & Madina'}
            </h1>

            {data.hostLine && (
              <p
                className={`mt-4 text-sm leading-relaxed sm:text-base ${
                  data.templateId === 'zamonaviy' ? 'max-w-md' : 'mx-auto max-w-md'
                }`}
                style={{ color: palette.muted }}
              >
                {data.hostLine}
              </p>
            )}

            {data.photoUrl && (
              <div className="my-7 overflow-hidden rounded-2xl" style={{ border: `1px solid ${palette.accent}44` }}>
                <img
                  src={data.photoUrl}
                  alt={data.heroNames}
                  loading="lazy"
                  decoding="async"
                  className="h-64 w-full object-cover sm:h-72"
                />
              </div>
            )}

            {data.templateId === 'klassik' && (
              <ClassicFlourish color={palette.accent} className="mx-auto my-6 h-8 w-56" />
            )}
            {data.templateId !== 'klassik' && data.templateId !== 'zamonaviy' && (
              <div className="my-6 flex items-center justify-center gap-3">
                <span className="h-px w-14" style={{ backgroundColor: `${palette.accent}66` }} />
                {isLoveTemplate ? (
                  <Heart className="h-3.5 w-3.5 fill-current" style={{ color: palette.accent }} />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" style={{ color: palette.accent }} />
                )}
                <span className="h-px w-14" style={{ backgroundColor: `${palette.accent}66` }} />
              </div>
            )}

            {data.welcomeText && (
              <p
                className={`text-sm leading-7 sm:text-[15px] ${
                  data.templateId === 'zamonaviy' ? 'mt-6' : 'mx-auto max-w-md'
                }`}
                style={{ color: palette.text }}
              >
                {data.welcomeText}
              </p>
            )}

            {data.quoteText && (
              <blockquote
                className={`mt-6 rounded-2xl px-5 py-4 font-serif-display text-base italic sm:text-lg ${
                  data.templateId === 'zamonaviy' ? 'rounded-l-none border-l-2' : ''
                }`}
                style={{
                  backgroundColor: subtleBg,
                  borderColor: palette.accent,
                  color: palette.primary,
                }}
              >
                {data.quoteText}
              </blockquote>
            )}
          </div>

          {/* INTERACTIVE FORGIVENESS WIDGET (KECHIRIM) */}
          {data.templateId === 'kechirim' && (
            <div
              className="relative z-10 mt-9 overflow-hidden rounded-2xl p-5 text-center sm:p-6"
              style={{
                backgroundColor: isDark ? 'rgba(244, 63, 94, 0.08)' : `${palette.accent}10`,
                border: `1.5px solid ${palette.accent}44`,
              }}
            >
              <h2 className="font-serif-display text-2xl font-bold" style={{ color: palette.primary }}>
                {t.forgiveQuestion}
              </h2>

              {forgiven ? (
                <div className="mt-4 animate-fade-in-up">
                  <div className="text-4xl">❤️</div>
                  <p className="mt-2 text-sm font-semibold" style={{ color: palette.primary }}>
                    {t.forgiveAccepted}
                  </p>
                </div>
              ) : (
                <>
                  {dodgeCount > 0 && (
                    <p className="mt-2 text-xs font-medium" style={{ color: palette.accent }}>
                      {t.forgivePleas[(dodgeCount - 1) % t.forgivePleas.length]}
                    </p>
                  )}
                  <div className="mt-5 flex min-h-[76px] flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setForgiven(true);
                        onCelebrate?.();
                      }}
                      className="rounded-2xl px-6 py-3 text-sm font-bold shadow-md transition-transform duration-200 hover:scale-105"
                      style={{
                        backgroundColor: palette.accent,
                        color: '#FFFFFF',
                        transform: `scale(${Math.min(1.22, 1 + dodgeCount * 0.05)})`,
                      }}
                    >
                      {t.forgiveYes}
                    </button>
                    <button
                      type="button"
                      onMouseEnter={handleDodge}
                      onClick={handleDodge}
                      className="rounded-2xl px-4 py-2.5 text-xs font-semibold transition-transform duration-200"
                      style={{
                        backgroundColor: palette.surface,
                        border: `1px solid ${borderColor}`,
                        color: palette.muted,
                        transform: `translate(${dodgeOffset.x}px, ${dodgeOffset.y}px)`,
                      }}
                    >
                      {t.forgiveNo}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* INTERACTIVE VIRTUAL HUG WIDGET (SOG'INDIM) */}
          {data.templateId === 'sogindim' && (
            <div
              className="relative z-10 mt-9 rounded-2xl p-6 text-center"
              style={{
                backgroundColor: isDark ? 'rgba(129, 140, 248, 0.1)' : `${palette.accent}12`,
                border: `1.5px solid ${palette.accent}44`,
              }}
            >
              <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: palette.muted }}>
                {t.hugTitle}
              </p>
              <button
                type="button"
                onClick={() => {
                  setHugCount((c) => c + 1);
                  onCelebrate?.();
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold shadow-md transition active:scale-95 hover:scale-105"
                style={{
                  backgroundColor: palette.accent,
                  color: '#FFFFFF',
                }}
              >
                {t.hugBtn}
                {hugCount > 0 && (
                  <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">+{hugCount}</span>
                )}
              </button>
              {hugCount > 0 && (
                <p className="mt-3 text-xs font-semibold" style={{ color: palette.primary }}>
                  {t.hugSent}
                </p>
              )}
            </div>
          )}

          {/* INTERACTIVE LOVE QUIZ SECTION */}
          {quizQuestions.length > 0 && (
            <div
              className="relative z-10 mt-9 rounded-2xl p-5 sm:p-6"
              style={{
                backgroundColor: isDark ? 'rgba(244, 63, 94, 0.08)' : `${palette.accent}10`,
                border: `1.5px solid ${palette.accent}55`,
              }}
            >
              <div className="text-center">
                <h2 className="font-serif-display text-2xl font-bold" style={{ color: palette.primary }}>
                  {t.quizHeading}
                </h2>
                <p className="mt-1 text-xs" style={{ color: palette.muted }}>
                  {t.quizSubtitle}
                </p>
              </div>

              {quizDone && quizPercent !== null ? (
                <div className="mt-6 text-center">
                  <div
                    className="mx-auto flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 shadow-sm"
                    style={{
                      borderColor: palette.accent,
                      backgroundColor: palette.surface,
                    }}
                  >
                    <span className="font-serif-display text-3xl font-bold" style={{ color: palette.primary }}>
                      {quizPercent}%
                    </span>
                    <span className="text-[10px] font-semibold" style={{ color: palette.muted }}>
                      {correctCount}/{quizQuestions.length}
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-semibold" style={{ color: palette.primary }}>
                    {quizPercent >= 80
                      ? t.quizResultHigh
                      : quizPercent >= 50
                        ? t.quizResultMid
                        : t.quizResultLow}
                  </p>
                  <button
                    type="button"
                    onClick={resetQuiz}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition hover:opacity-80"
                    style={{
                      border: `1px solid ${palette.accent}77`,
                      color: palette.primary,
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t.quizRetry}
                  </button>
                </div>
              ) : (
                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between text-[11px] font-semibold" style={{ color: palette.muted }}>
                    <span>
                      {t.quizQuestionOf} {quizIndex + 1} / {quizQuestions.length}
                    </span>
                    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-black/10">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${((quizIndex + 1) / quizQuestions.length) * 100}%`,
                          backgroundColor: palette.accent,
                        }}
                      />
                    </div>
                  </div>

                  <p className="mb-4 text-center font-serif-display text-xl font-semibold" style={{ color: palette.text }}>
                    {quizQuestions[quizIndex]?.question}
                  </p>

                  <div className="grid gap-2.5">
                    {quizQuestions[quizIndex]?.options
                      .filter((o) => o.trim() !== '')
                      .map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectQuizOption(idx)}
                          className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition hover:scale-[1.01]"
                          style={{
                            backgroundColor: palette.surface,
                            border: `1px solid ${palette.accent}44`,
                            color: palette.text,
                          }}
                        >
                          <span
                            className="mr-2.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
                            style={{ backgroundColor: `${palette.accent}22`, color: palette.primary }}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          {opt}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COUNTDOWN TIMER */}
          {data.eventDate && (
            <div className="relative z-10 mt-9">
              {countdown.passed ? (
                <div
                  className="rounded-2xl py-4 text-center font-serif-display text-xl font-semibold"
                  style={{ backgroundColor: `${palette.accent}18`, color: palette.primary }}
                >
                  {t.eventPassed}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                  {[
                    { val: countdown.days, label: t.days },
                    { val: countdown.hours, label: t.hours },
                    { val: countdown.minutes, label: t.minutes },
                    { val: countdown.seconds, label: t.seconds },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl py-3.5 text-center"
                      style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : `${palette.primary}0B`,
                        border: `1px solid ${palette.accent}35`,
                      }}
                    >
                      <div className="font-serif-display text-2xl font-bold sm:text-3xl" style={{ color: palette.primary }}>
                        {String(item.val).padStart(2, '0')}
                      </div>
                      <div className="mt-0.5 text-[10px] font-medium tracking-wider uppercase sm:text-[11px]" style={{ color: palette.muted }}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WHEN & WHERE — hidden automatically for pure personal cards without venue/date */}
          {(data.eventDate || data.venueName || data.venueAddress) && (
          <div
            className="relative z-10 mt-9 rounded-2xl p-5 sm:p-6"
            style={{
              backgroundColor: subtleBg,
              border: `1px solid ${borderColor}`,
            }}
          >
            <h2 className="mb-4 text-center font-serif-display text-2xl font-semibold" style={{ color: palette.primary }}>
              {t.whenAndWhere}
            </h2>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0" style={{ color: palette.accent }} />
                <div>
                  <span className="text-xs uppercase tracking-wider" style={{ color: palette.muted }}>
                    {t.dateLabel}
                  </span>
                  <p className="font-semibold">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" style={{ color: palette.accent }} />
                <div>
                  <span className="text-xs uppercase tracking-wider" style={{ color: palette.muted }}>
                    {t.timeLabel}
                  </span>
                  <p className="font-semibold">{data.eventTime}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: palette.accent }} />
                <div>
                  <span className="text-xs uppercase tracking-wider" style={{ color: palette.muted }}>
                    {t.venueLabel}
                  </span>
                  <p className="font-semibold">{data.venueName}</p>
                  {data.venueAddress && (
                    <p className="mt-0.5 text-xs" style={{ color: palette.muted }}>
                      {data.venueAddress}
                    </p>
                  )}
                </div>
              </div>

              {data.dressCode && (
                <div className="flex items-start gap-3">
                  <Shirt className="mt-0.5 h-4 w-4 shrink-0" style={{ color: palette.accent }} />
                  <div>
                    <span className="text-xs uppercase tracking-wider" style={{ color: palette.muted }}>
                      {t.dressCodeLabel}
                    </span>
                    <p className="font-medium">{data.dressCode}</p>
                  </div>
                </div>
              )}

              {data.contactPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0" style={{ color: palette.accent }} />
                  <div>
                    <span className="text-xs uppercase tracking-wider" style={{ color: palette.muted }}>
                      {t.contactLabel}
                    </span>
                    <p className="font-medium">
                      <a href={`tel:${data.contactPhone.replace(/\s+/g, '')}`} className="hover:underline">
                        {data.contactPhone}
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              {data.mapUrl && (
                <a
                  href={data.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition hover:opacity-90"
                  style={{
                    backgroundColor: palette.primary,
                    color: isDark ? '#111113' : '#FFFFFF',
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t.openMap}
                </a>
              )}
              <button
                type="button"
                onClick={() => downloadIcs(data)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition hover:opacity-80"
                style={{
                  border: `1px solid ${palette.accent}77`,
                  color: palette.primary,
                }}
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                {t.addToCalendar}
              </button>
            </div>
          </div>
          )}

          {/* PROGRAM / TIMELINE */}
          {data.program && data.program.length > 0 && (
            <div className="relative z-10 mt-9">
              <h2 className="mb-5 text-center font-serif-display text-2xl font-semibold" style={{ color: palette.primary }}>
                {t.programHeading}
              </h2>
              <div className="relative space-y-4 pl-6">
                <div
                  className="pointer-events-none absolute top-2 bottom-2 left-[7px] w-px"
                  style={{ backgroundColor: `${palette.accent}55` }}
                />
                {data.program.map((item) => (
                  <div key={item.id} className="relative">
                    <span
                      className="absolute top-1.5 -left-6 h-3.5 w-3.5 rounded-full border-2"
                      style={{
                        backgroundColor: palette.surface,
                        borderColor: palette.accent,
                      }}
                    />
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span
                        className="rounded-md px-2 py-0.5 text-xs font-bold"
                        style={{
                          backgroundColor: `${palette.accent}22`,
                          color: palette.primary,
                        }}
                      >
                        {item.time}
                      </span>
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                    </div>
                    {item.description && (
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: palette.muted }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RSVP FORM */}
          <div
            className="relative z-10 mt-10 rounded-2xl p-5 sm:p-6"
            style={{
              backgroundColor: subtleBg,
              border: `1px solid ${palette.accent}44`,
            }}
          >
            <h2 className="text-center font-serif-display text-2xl font-semibold" style={{ color: palette.primary }}>
              {isPersonalCard ? t.rsvpLoveHeading : t.rsvpHeading}
            </h2>
            <p className="mt-1 text-center text-xs" style={{ color: palette.muted }}>
              {isPersonalCard ? t.rsvpPersonalSubtitle : t.rsvpSubtitle}
            </p>

            {quizPercent !== null && (
              <div
                className="mt-3 rounded-xl px-3 py-2 text-center text-xs font-semibold"
                style={{ backgroundColor: `${palette.accent}20`, color: palette.primary }}
              >
                ❤️ {t.quizYourScore}: {quizPercent}% ({correctCount}/{quizQuestions.length})
              </div>
            )}

            {submitted ? (
              <div className="mt-5 rounded-xl py-6 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10" style={{ color: palette.accent }} />
                <p className="mt-3 font-semibold">{t.rsvpSuccessTitle}</p>
                <p className="mt-1 text-xs" style={{ color: palette.muted }}>
                  {t.rsvpSuccessDesc}
                </p>
              </div>
            ) : (
              <form onSubmit={handleRsvp} className="mt-5 space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: palette.muted }}>
                    {t.guestName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                    style={{
                      backgroundColor: palette.surface,
                      border: `1px solid ${borderColor}`,
                      color: palette.text,
                    }}
                  />
                </div>

                {!isPersonalCard && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium" style={{ color: palette.muted }}>
                        {t.guestPhone}
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+998 90 ..."
                        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                        style={{
                          backgroundColor: palette.surface,
                          border: `1px solid ${borderColor}`,
                          color: palette.text,
                        }}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium" style={{ color: palette.muted }}>
                        {t.attendance}
                      </label>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {(
                          [
                            { id: 'yes', label: t.attYes },
                            { id: 'maybe', label: t.attMaybe },
                            { id: 'no', label: t.attNo },
                          ] as const
                        ).map((opt) => {
                          const active = attendance === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setAttendance(opt.id)}
                              className="rounded-xl px-2 py-2.5 text-xs font-medium transition"
                              style={{
                                backgroundColor: active ? palette.primary : palette.surface,
                                color: active ? (isDark ? '#111113' : '#FFFFFF') : palette.text,
                                border: `1px solid ${active ? palette.primary : borderColor}`,
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {attendance !== 'no' && (
                      <div>
                        <label className="mb-1 block text-xs font-medium" style={{ color: palette.muted }}>
                          {t.guestsCount}
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={15}
                          value={guestsCount}
                          onChange={(e) => setGuestsCount(Math.max(1, Number(e.target.value) || 1))}
                          className="w-28 rounded-xl px-3.5 py-2 text-sm outline-none"
                          style={{
                            backgroundColor: palette.surface,
                            border: `1px solid ${borderColor}`,
                            color: palette.text,
                          }}
                        />
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: palette.muted }}>
                    {t.wishLabel}
                  </label>
                  <textarea
                    rows={3}
                    value={wishMessage}
                    onChange={(e) => setWishMessage(e.target.value)}
                    placeholder={t.wishPlaceholder}
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                    style={{
                      backgroundColor: palette.surface,
                      border: `1px solid ${borderColor}`,
                      color: palette.text,
                    }}
                  />
                </div>

                {rsvpError && <p className="text-xs text-red-500">{rsvpError}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-60"
                  style={{
                    backgroundColor: palette.primary,
                    color: isDark ? '#111113' : '#FFFFFF',
                  }}
                >
                  <Send className="h-4 w-4" />
                  {submitting ? t.submitting : t.submitRsvp}
                </button>
              </form>
            )}
          </div>

          {/* GUESTBOOK WISHES */}
          {wishes.length > 0 && (
            <div className="relative z-10 mt-9">
              <h2
                className="mb-4 flex items-center justify-center gap-2 font-serif-display text-xl font-semibold"
                style={{ color: palette.primary }}
              >
                <Heart className="h-4 w-4" style={{ color: palette.accent }} />
                {t.wishesHeading}
              </h2>
              <div className="space-y-3">
                {wishes.slice(0, 6).map((w) => (
                  <div
                    key={w.id}
                    className="rounded-xl p-3.5 text-sm"
                    style={{
                      backgroundColor: subtleBg,
                      border: `1px solid ${borderColor}`,
                    }}
                  >
                    <p className="text-xs font-semibold" style={{ color: palette.primary }}>
                      {w.guestName}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: palette.text }}>
                      {w.wishMessage}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
