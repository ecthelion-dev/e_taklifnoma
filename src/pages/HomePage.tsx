import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Heart,
  Users,
  QrCode,
  MapPin,
  Languages,
  Palette,
  Eye,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useApp } from '../lib/AppContext';
import { getTranslations } from '../i18n/translations';
import { TEMPLATE_CATALOG, createDefaultInvitation, getPalette } from '../templates/catalog';
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
} from '../templates/Ornaments';
import type { TemplateCategory, TemplateId } from '../types/invitation';

const FEATURE_ICONS = [Palette, Heart, Users, QrCode, MapPin, Languages];

const HERO_TABS: TemplateId[] = ['kechirim', 'sevgi-maktub', 'sevgi-test', 'milliy', 'islomiy'];

export const HomePage: React.FC = () => {
  const { lang } = useApp();
  const t = getTranslations(lang);
  const [heroTemplate, setHeroTemplate] = useState<TemplateId>('sevgi-maktub');
  const [activeCategory, setActiveCategory] = useState<'all' | TemplateCategory>('all');
  const [showAllMobile, setShowAllMobile] = useState(false);

  const previewData = createDefaultInvitation(heroTemplate, lang);
  const previewPalette = getPalette(heroTemplate, previewData.paletteId);

  const filteredTemplates =
    activeCategory === 'all'
      ? TEMPLATE_CATALOG
      : TEMPLATE_CATALOG.filter((tpl) => tpl.category === activeCategory);

  const renderCardOrnament = (tplId: TemplateId, primary: string, accent: string, muted: string) => {
    switch (tplId) {
      case 'milliy':
        return <MilliyArchOrnament color={primary} accent={accent} className="mb-1.5 h-8 w-28 sm:mb-2 sm:h-12 sm:w-40" />;
      case 'klassik':
        return <ClassicFlourish color={accent} className="mb-1.5 h-5 w-24 sm:mb-2 sm:h-6 sm:w-36" />;
      case 'islomiy':
        return <IslamicArchOrnament color={primary} accent={accent} className="mb-1.5 h-9 w-28 sm:mb-2 sm:h-14 sm:w-40" />;
      case 'shohona':
        return <RoyalCrestOrnament color={primary} className="mb-1.5 h-7 w-24 sm:mb-2 sm:h-10 sm:w-36" />;
      case 'sevgi-maktub':
      case 'sevgi-test':
        return <LoveSealOrnament color={primary} accent={accent} className="mb-1.5 h-8 w-28 sm:mb-2 sm:h-12 sm:w-40" />;
      case 'romantik-kecha':
        return <StarryHeartOrnament color={primary} accent={accent} className="mb-1.5 h-9 w-28 sm:mb-2 sm:h-14 sm:w-40" />;
      case 'bayram':
        return <FestiveGarlandOrnament color={primary} accent={accent} className="mb-1.5 h-8 w-28 sm:mb-2 sm:h-11 sm:w-40" />;
      case 'kechirim':
        return <ForgivenessOrnament color={primary} accent={accent} className="mb-1.5 h-8 w-28 sm:mb-2 sm:h-12 sm:w-40" />;
      case 'rahmat':
        return <GratitudeSunOrnament color={primary} accent={accent} className="mb-1.5 h-8 w-28 sm:mb-2 sm:h-12 sm:w-40" />;
      case 'sogindim':
        return <MissYouPlaneOrnament color={primary} accent={accent} className="mb-1.5 h-8 w-28 sm:mb-2 sm:h-12 sm:w-40" />;
      case 'tabrik':
        return <GreetingBouquetOrnament color={primary} accent={accent} className="mb-1.5 h-8 w-28 sm:mb-2 sm:h-12 sm:w-40" />;
      default:
        return (
          <span className="mb-1.5 text-[9px] font-bold tracking-[0.22em] uppercase sm:mb-2 sm:text-[10px]" style={{ color: muted }}>
            WEDDING DAY
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900">
      <Navbar />

      {/* HERO SECTION — compact on mobile, editorial on desktop */}
      <section className="relative overflow-hidden pt-6 pb-8 sm:pt-14 sm:pb-20">
        <div className="pointer-events-none absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-rose-200/35 blur-3xl sm:h-96 sm:w-96" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl sm:h-80 sm:w-80" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/90 px-3 py-1 text-[11px] font-semibold text-rose-900 sm:px-4 sm:py-1.5 sm:text-xs">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-rose-600" />
              <span className="line-clamp-1">{t.hero.badge}</span>
            </div>

            <h1 className="mt-4 font-serif-display text-3xl leading-[1.08] font-bold tracking-tight text-stone-950 sm:mt-6 sm:text-5xl lg:text-6xl">
              {t.hero.title}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-600 sm:mt-5 sm:text-lg">
              {t.hero.subtitle}
            </p>

            {/* 2-col compact row on mobile, inline flex on sm+ */}
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-8 sm:flex sm:flex-wrap sm:items-center sm:gap-3.5">
              <Link
                to="/create"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-950 px-4 py-3 text-xs font-semibold text-amber-50 shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-900 sm:px-7 sm:py-3.5 sm:text-sm"
              >
                <span className="truncate">{t.hero.ctaPrimary}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              </Link>
              <a
                href="#templates"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 py-3 text-xs font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-stone-50 sm:px-6 sm:py-3.5 sm:text-sm"
              >
                <span className="truncate">{t.hero.ctaSecondary}</span>
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-stone-200/80 pt-4 text-[11px] font-medium text-stone-600 sm:mt-10 sm:gap-6 sm:pt-7 sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-700 sm:h-4 sm:w-4" />
                {t.hero.statsTemplates}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-700 sm:h-4 sm:w-4" />
                {t.hero.statsBilingual}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-700 sm:h-4 sm:w-4" />
                {t.hero.statsRsvp}
              </span>
            </div>
          </div>

          {/* Interactive Phone Mockup — shown on desktop (lg+) so mobile stays clean & short */}
          <div className="hidden lg:col-span-5 lg:block">
            <div className="mx-auto max-w-[345px]">
              <div className="mb-4 flex flex-wrap justify-center gap-1.5">
                {HERO_TABS.map((tplId) => {
                  const tpl = TEMPLATE_CATALOG.find((x) => x.id === tplId)!;
                  const active = heroTemplate === tplId;
                  return (
                    <button
                      key={tplId}
                      type="button"
                      onClick={() => setHeroTemplate(tplId)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        active
                          ? tpl.category === 'love' || tpl.category === 'emotions'
                            ? 'bg-rose-700 text-white shadow-sm'
                            : 'bg-emerald-950 text-amber-100 shadow-sm'
                          : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {lang === 'ru' ? tpl.nameRu.split(' ')[0] : tpl.nameUz.split(' ')[0]}
                      {tpl.category === 'love' ? ' ❤️' : tpl.category === 'emotions' ? ' 💌' : ''}
                    </button>
                  );
                })}
              </div>

              <div className="animate-float-slow rounded-[42px] border-[8px] border-stone-900 bg-stone-900 p-2 shadow-2xl">
                <div
                  className="relative overflow-hidden rounded-[32px] px-5 py-7 text-center transition-colors duration-300"
                  style={{
                    backgroundColor: previewPalette.bg,
                    color: previewPalette.text,
                  }}
                >
                  <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-black/15" />

                  <div
                    className="rounded-2xl px-4 py-6 shadow-sm"
                    style={{
                      backgroundColor: previewPalette.surface,
                      border: `1px solid ${previewPalette.accent}55`,
                    }}
                  >
                    {heroTemplate === 'islomiy' && (
                      <p className="font-arabic text-lg" style={{ color: previewPalette.accent }}>
                        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                      </p>
                    )}
                    <div className="flex justify-center">
                      {renderCardOrnament(heroTemplate, previewPalette.primary, previewPalette.accent, previewPalette.muted)}
                    </div>

                    <p className="text-[10px] font-semibold tracking-[0.22em] uppercase" style={{ color: previewPalette.accent }}>
                      {previewData.title}
                    </p>
                    <h3 className="mt-2 font-serif-display text-3xl font-bold" style={{ color: previewPalette.primary }}>
                      {previewData.heroNames}
                    </h3>
                    <p className="mt-2 text-[11px] leading-relaxed" style={{ color: previewPalette.muted }}>
                      {previewData.venueName || previewData.hostLine}
                    </p>

                    <div className="mt-5 flex gap-2">
                      <Link
                        to={`/i/demo-${heroTemplate}`}
                        className="flex-1 rounded-xl py-2 text-[11px] font-semibold transition hover:opacity-90"
                        style={{
                          backgroundColor: previewPalette.primary,
                          color: previewPalette.isDark ? '#111' : '#fff',
                        }}
                      >
                        {t.templatesSection.liveDemo}
                      </Link>
                      <Link
                        to={`/create?template=${heroTemplate}`}
                        className="flex-1 rounded-xl py-2 text-[11px] font-semibold"
                        style={{
                          border: `1px solid ${previewPalette.accent}88`,
                          color: previewPalette.primary,
                        }}
                      >
                        {t.templatesSection.useTemplate}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEMPLATES SHOWCASE — 2-col compact gallery on mobile, 3-col on desktop */}
      <section id="templates" className="border-t border-stone-200/80 bg-white py-10 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-bold tracking-[0.22em] text-amber-700 uppercase sm:text-xs">
              {t.templatesSection.eyebrow}
            </p>
            <h2 className="mt-2 font-serif-display text-2xl font-bold text-stone-950 sm:mt-3 sm:text-5xl">
              {t.templatesSection.title}
            </h2>

            {/* Category Filter Pills — horizontal scroll on mobile */}
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 sm:mt-7 sm:flex-wrap sm:justify-center sm:overflow-visible">
              {(
                [
                  { id: 'all', label: t.categories.all },
                  { id: 'emotions', label: t.categories.emotions },
                  { id: 'love', label: t.categories.love },
                  { id: 'wedding', label: t.categories.wedding },
                  { id: 'family', label: t.categories.family },
                ] as const
              ).map((cat) => {
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setShowAllMobile(true);
                    }}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition sm:px-5 sm:py-2 sm:text-sm ${
                      active
                        ? cat.id === 'love' || cat.id === 'emotions'
                          ? 'bg-rose-700 text-white shadow-sm'
                          : 'bg-emerald-950 text-amber-50 shadow-sm'
                        : 'border border-stone-200 bg-[#FAF8F5] text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2 columns on mobile for compact browsing, 3 on lg */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 lg:grid-cols-3">
            {filteredTemplates.map((tpl, index) => {
              const pal = tpl.palettes[0];
              const hiddenOnMobile = !showAllMobile && activeCategory === 'all' && index >= 6;
              return (
                <div
                  key={tpl.id}
                  className={`group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-[#FAF8F5] transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-3xl ${
                    hiddenOnMobile ? 'hidden sm:flex' : 'flex'
                  }`}
                >
                  <div
                    className="relative flex h-32 flex-col items-center justify-center overflow-hidden p-2.5 text-center sm:h-52 sm:p-5"
                    style={{ backgroundColor: pal.bg, color: pal.text }}
                  >
                    <div
                      className="flex h-full w-full flex-col items-center justify-center rounded-xl px-2 py-2.5 shadow-sm transition duration-300 group-hover:scale-[1.02] sm:rounded-2xl sm:px-4 sm:py-4"
                      style={{
                        backgroundColor: pal.surface,
                        border: `1px solid ${pal.accent}55`,
                      }}
                    >
                      {renderCardOrnament(tpl.id, pal.primary, pal.accent, pal.muted)}

                      <p className="line-clamp-1 font-serif-display text-base font-bold sm:text-2xl" style={{ color: pal.primary }}>
                        {tpl.previewNames}
                      </p>

                      <div className="mt-2 hidden items-center justify-center gap-1.5 sm:mt-3 sm:flex">
                        {tpl.palettes.slice(0, 6).map((p) => (
                          <span
                            key={p.id}
                            className="h-3 w-3 rounded-full border border-black/15"
                            style={{ backgroundColor: p.primary }}
                            title={lang === 'ru' ? p.nameRu : p.nameUz}
                          />
                        ))}
                        {tpl.palettes.length > 6 && (
                          <span className="text-[10px] font-semibold" style={{ color: pal.muted }}>
                            +{tpl.palettes.length - 6}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-3 sm:p-5">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="truncate font-serif-display text-base font-bold text-stone-900 sm:text-xl">
                        {lang === 'ru' ? tpl.nameRu : tpl.nameUz}
                      </h3>
                      <span
                        className={`w-fit rounded-full px-2 py-0.5 text-[9px] font-semibold sm:px-2.5 sm:text-[11px] ${
                          tpl.category === 'love' || tpl.category === 'emotions'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100/80 text-amber-900'
                        }`}
                      >
                        {lang === 'ru' ? tpl.tagRu : tpl.tagUz}
                      </span>
                    </div>

                    <p className="mt-2 hidden flex-1 text-xs leading-relaxed text-stone-600 sm:block sm:text-sm">
                      {lang === 'ru' ? tpl.descRu : tpl.descUz}
                    </p>

                    <div className="mt-3 flex flex-col gap-1.5 sm:mt-4 sm:flex-row sm:gap-2.5">
                      <Link
                        to={`/i/${tpl.demoSlug}`}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-stone-800 transition hover:bg-stone-100 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-xs"
                      >
                        <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        {t.templatesSection.liveDemo}
                      </Link>
                      <Link
                        to={`/create?template=${tpl.id}`}
                        className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-white transition sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-xs ${
                          tpl.category === 'love' || tpl.category === 'emotions'
                            ? 'bg-rose-700 hover:bg-rose-800'
                            : 'bg-emerald-950 hover:bg-emerald-900'
                        }`}
                      >
                        {t.templatesSection.useTemplate}
                        <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile "Show all 13" button */}
          {!showAllMobile && activeCategory === 'all' && filteredTemplates.length > 6 && (
            <div className="mt-5 text-center sm:hidden">
              <button
                type="button"
                onClick={() => setShowAllMobile(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-800 shadow-xs"
              >
                {lang === 'ru' ? `Показать все (${filteredTemplates.length})` : `Barchasini ko‘rish (${filteredTemplates.length})`}
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* COMPACT LOVE & ROMANCE BANNER */}
      <section className="px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#3A0C1D] via-[#5B132D] to-[#260917] px-5 py-7 text-rose-50 shadow-xl sm:rounded-[36px] sm:px-12 sm:py-12">
          <div className="relative grid items-center gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/30 bg-white/10 px-3 py-1 text-[11px] font-semibold text-rose-100 sm:text-xs">
                <Heart className="h-3 w-3 fill-rose-300 text-rose-300" />
                {t.loveBanner.badge}
              </span>
              <h2 className="mt-3 font-serif-display text-2xl font-bold text-white sm:text-4xl">
                {t.loveBanner.title}
              </h2>
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-rose-100/85 sm:mt-3 sm:text-base">
                {t.loveBanner.subtitle}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3">
                <Link
                  to="/create?template=sevgi-maktub"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-200 px-3.5 py-2.5 text-[11px] font-bold text-rose-950 shadow-md transition hover:bg-white sm:px-6 sm:py-3 sm:text-sm"
                >
                  <Heart className="h-3.5 w-3.5 shrink-0 fill-rose-700 text-rose-700" />
                  <span className="truncate">{t.loveBanner.ctaLetter}</span>
                </Link>
                <Link
                  to="/create?template=sevgi-test"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-rose-200/40 bg-white/10 px-3.5 py-2.5 text-[11px] font-semibold text-white transition hover:bg-white/20 sm:px-6 sm:py-3 sm:text-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-200" />
                  <span className="truncate">{t.loveBanner.ctaQuiz}</span>
                </Link>
              </div>
            </div>

            <div className="hidden lg:col-span-4 lg:flex lg:justify-end">
              <div className="w-60 rounded-3xl border border-rose-200/20 bg-white/10 p-5 text-center backdrop-blur-md">
                <LoveSealOrnament color="#FDA4AF" accent="#FB7185" className="mx-auto h-14 w-44" />
                <p className="mt-2 font-serif-display text-2xl font-bold text-white">Jasur ❤️ Nigora</p>
                <p className="mt-1 text-xs text-rose-200/80">100% moslik natijasi</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES — 2-col compact on mobile */}
      <section id="features" className="py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-bold tracking-[0.22em] text-amber-700 uppercase sm:text-xs">
              {t.featuresSection.eyebrow}
            </p>
            <h2 className="mt-2 font-serif-display text-2xl font-bold text-stone-950 sm:mt-3 sm:text-4xl">
              {t.featuresSection.title}
            </h2>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-6 lg:grid-cols-3">
            {t.featuresSection.items.map((item, idx) => {
              const Icon = FEATURE_ICONS[idx % FEATURE_ICONS.length];
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs transition hover:shadow-md sm:rounded-3xl sm:p-6"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950 text-amber-300 sm:h-11 sm:w-11 sm:rounded-2xl">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <h3 className="mt-3 font-serif-display text-base font-bold text-stone-900 sm:mt-4 sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-stone-600 sm:mt-2 sm:text-sm">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — compact */}
      <section id="how" className="border-t border-stone-200/80 bg-emerald-950 py-10 text-amber-50 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif-display text-2xl font-bold text-white sm:text-4xl">
              {t.howSection.title}
            </h2>
          </div>

          <div className="mt-6 grid gap-3 sm:mt-10 sm:gap-6 md:grid-cols-3">
            {t.howSection.steps.map((step) => (
              <div key={step.num} className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-4 sm:block sm:rounded-3xl sm:p-6">
                <span className="font-serif-display text-2xl font-bold text-amber-300 sm:text-4xl">{step.num}</span>
                <div>
                  <h3 className="font-serif-display text-lg font-semibold text-white sm:mt-3 sm:text-2xl">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-100/80 sm:mt-2 sm:text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 text-center sm:mt-10">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-7 py-3 text-xs font-bold text-emerald-950 shadow-lg transition hover:bg-amber-200 sm:px-8 sm:py-4 sm:text-sm"
            >
              {t.hero.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-stone-200 bg-[#FAF8F5] py-6 sm:py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-stone-500 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-900" />
            <span className="font-serif-display text-lg font-bold text-stone-900">{t.brand}</span>
            <span>•</span>
            <span>
              {lang === 'ru' ? 'Разработчик:' : 'Dasturchi:'}{' '}
              <strong className="font-semibold text-stone-800">Farrux</strong>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/create" className="hover:text-stone-900">
              {t.nav.create}
            </Link>
            <Link to="/dashboard" className="hover:text-stone-900">
              {t.nav.dashboard}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
