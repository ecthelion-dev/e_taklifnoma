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

  const previewData = createDefaultInvitation(heroTemplate, lang);
  const previewPalette = getPalette(heroTemplate, previewData.paletteId);

  const filteredTemplates =
    activeCategory === 'all'
      ? TEMPLATE_CATALOG
      : TEMPLATE_CATALOG.filter((tpl) => tpl.category === activeCategory);

  const renderCardOrnament = (tplId: TemplateId, primary: string, accent: string, muted: string) => {
    switch (tplId) {
      case 'milliy':
        return <MilliyArchOrnament color={primary} accent={accent} className="mb-2 h-12 w-40" />;
      case 'klassik':
        return <ClassicFlourish color={accent} className="mb-2 h-6 w-36" />;
      case 'islomiy':
        return <IslamicArchOrnament color={primary} accent={accent} className="mb-2 h-14 w-40" />;
      case 'shohona':
        return <RoyalCrestOrnament color={primary} className="mb-2 h-10 w-36" />;
      case 'sevgi-maktub':
      case 'sevgi-test':
        return <LoveSealOrnament color={primary} accent={accent} className="mb-2 h-12 w-40" />;
      case 'romantik-kecha':
        return <StarryHeartOrnament color={primary} accent={accent} className="mb-2 h-14 w-40" />;
      case 'bayram':
        return <FestiveGarlandOrnament color={primary} accent={accent} className="mb-2 h-11 w-40" />;
      case 'kechirim':
        return <ForgivenessOrnament color={primary} accent={accent} className="mb-2 h-12 w-40" />;
      case 'rahmat':
        return <GratitudeSunOrnament color={primary} accent={accent} className="mb-2 h-12 w-40" />;
      case 'sogindim':
        return <MissYouPlaneOrnament color={primary} accent={accent} className="mb-2 h-12 w-40" />;
      case 'tabrik':
        return <GreetingBouquetOrnament color={primary} accent={accent} className="mb-2 h-12 w-40" />;
      default:
        return (
          <span className="mb-2 text-[10px] font-bold tracking-[0.28em] uppercase" style={{ color: muted }}>
            WEDDING DAY
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-24">
        <div className="pointer-events-none absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-rose-200/35 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50/90 px-4 py-1.5 text-xs font-semibold text-rose-900">
              <Sparkles className="h-3.5 w-3.5 text-rose-600" />
              {t.hero.badge}
            </div>

            <h1 className="mt-6 font-serif-display text-4xl leading-[1.08] font-bold tracking-tight text-stone-950 sm:text-6xl">
              {t.hero.title}
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
              {t.hero.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                to="/create"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-950 px-7 py-3.5 text-sm font-semibold text-amber-50 shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-900"
              >
                {t.hero.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#templates"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3.5 text-sm font-semibold text-stone-800 transition hover:border-stone-400 hover:bg-stone-50"
              >
                {t.hero.ctaSecondary}
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 border-t border-stone-200/80 pt-7 text-xs font-medium text-stone-600 sm:text-sm">
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-700" />
                {t.hero.statsTemplates}
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-700" />
                {t.hero.statsBilingual}
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-700" />
                {t.hero.statsRsvp}
              </span>
            </div>
          </div>

          {/* Interactive Phone Mockup */}
          <div className="lg:col-span-5">
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
                          ? tpl.category === 'love'
                            ? 'bg-rose-700 text-white shadow-sm'
                            : 'bg-emerald-950 text-amber-100 shadow-sm'
                          : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {lang === 'ru' ? tpl.nameRu.split(' ')[0] : tpl.nameUz.split(' ')[0]}
                      {tpl.category === 'love' ? ' ❤️' : ''}
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
                      {previewData.venueName}
                    </p>

                    {heroTemplate === 'sevgi-test' ? (
                      <div
                        className="mt-4 rounded-xl px-3 py-2.5 text-xs font-semibold"
                        style={{ backgroundColor: `${previewPalette.accent}18`, color: previewPalette.primary }}
                      >
                        ❤️ 4 savol • 100% moslik testi
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-4 gap-1.5">
                        {['07', '14', '35', '42'].map((n, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg py-1.5"
                            style={{
                              backgroundColor: previewPalette.isDark
                                ? 'rgba(255,255,255,0.06)'
                                : `${previewPalette.primary}10`,
                            }}
                          >
                            <div className="font-serif-display text-base font-bold" style={{ color: previewPalette.primary }}>
                              {n}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

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

      {/* LOVE & ROMANCE SPOTLIGHT BANNER */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-gradient-to-br from-[#3A0C1D] via-[#5B132D] to-[#260917] px-6 py-12 text-rose-50 shadow-2xl sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-rose-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-amber-300/15 blur-3xl" />

          <div className="relative grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-white/10 px-4 py-1.5 text-xs font-semibold text-rose-100">
                <Heart className="h-3.5 w-3.5 fill-rose-300 text-rose-300" />
                {t.loveBanner.badge}
              </span>
              <h2 className="mt-4 font-serif-display text-3xl font-bold text-white sm:text-5xl">
                {t.loveBanner.title}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-rose-100/85 sm:text-base">
                {t.loveBanner.subtitle}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  to="/create?template=sevgi-maktub"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-200 px-6 py-3 text-xs font-bold text-rose-950 shadow-md transition hover:bg-white sm:text-sm"
                >
                  <Heart className="h-4 w-4 fill-rose-700 text-rose-700" />
                  {t.loveBanner.ctaLetter}
                </Link>
                <Link
                  to="/create?template=sevgi-test"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200/40 bg-white/10 px-6 py-3 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20 sm:text-sm"
                >
                  <Sparkles className="h-4 w-4 text-amber-200" />
                  {t.loveBanner.ctaQuiz}
                </Link>
                <Link
                  to="/i/demo-sevgi-test"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-rose-200 underline-offset-4 hover:underline sm:py-3 sm:text-sm"
                >
                  {t.loveBanner.demoQuiz} →
                </Link>
              </div>
            </div>

            <div className="hidden lg:col-span-4 lg:flex lg:justify-end">
              <div className="w-64 rounded-3xl border border-rose-200/20 bg-white/10 p-6 text-center backdrop-blur-md">
                <LoveSealOrnament color="#FDA4AF" accent="#FB7185" className="mx-auto h-16 w-48" />
                <p className="mt-2 font-serif-display text-2xl font-bold text-white">Jasur ❤️ Nigora</p>
                <p className="mt-1 text-xs text-rose-200/80">100% moslik natijasi</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEMPLATES SHOWCASE WITH CATEGORY FILTER */}
      <section id="templates" className="border-t border-stone-200/80 bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold tracking-[0.22em] text-amber-700 uppercase">
              {t.templatesSection.eyebrow}
            </p>
            <h2 className="mt-3 font-serif-display text-3xl font-bold text-stone-950 sm:text-5xl">
              {t.templatesSection.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">
              {t.templatesSection.subtitle}
            </p>

            {/* Category Filter Pills */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
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
                    onClick={() => setActiveCategory(cat.id)}
                    className={`rounded-full px-5 py-2 text-xs font-semibold transition sm:text-sm ${
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

          <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((tpl) => {
              const pal = tpl.palettes[0];
              return (
                <div
                  key={tpl.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-[#FAF8F5] transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div
                    className="relative flex h-60 flex-col items-center justify-center overflow-hidden p-6 text-center"
                    style={{ backgroundColor: pal.bg, color: pal.text }}
                  >
                    <div
                      className="flex h-full w-full flex-col items-center justify-center rounded-2xl px-4 py-5 shadow-sm transition duration-300 group-hover:scale-[1.02]"
                      style={{
                        backgroundColor: pal.surface,
                        border: `1px solid ${pal.accent}55`,
                      }}
                    >
                      {renderCardOrnament(tpl.id, pal.primary, pal.accent, pal.muted)}

                      <p className="font-serif-display text-2xl font-bold" style={{ color: pal.primary }}>
                        {tpl.previewNames}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
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

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-serif-display text-2xl font-bold text-stone-900">
                        {lang === 'ru' ? tpl.nameRu : tpl.nameUz}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          tpl.category === 'love'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100/80 text-amber-900'
                        }`}
                      >
                        {lang === 'ru' ? tpl.tagRu : tpl.tagUz}
                      </span>
                    </div>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                      {lang === 'ru' ? tpl.descRu : tpl.descUz}
                    </p>

                    <div className="mt-5 flex gap-2.5">
                      <Link
                        to={`/i/${tpl.demoSlug}`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-800 transition hover:bg-stone-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {t.templatesSection.liveDemo}
                      </Link>
                      <Link
                        to={`/create?template=${tpl.id}`}
                        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition ${
                          tpl.category === 'love'
                            ? 'bg-rose-700 hover:bg-rose-800'
                            : 'bg-emerald-950 hover:bg-emerald-900'
                        }`}
                      >
                        {t.templatesSection.useTemplate}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold tracking-[0.22em] text-amber-700 uppercase">
              {t.featuresSection.eyebrow}
            </p>
            <h2 className="mt-3 font-serif-display text-3xl font-bold text-stone-950 sm:text-5xl">
              {t.featuresSection.title}
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.featuresSection.items.map((item, idx) => {
              const Icon = FEATURE_ICONS[idx % FEATURE_ICONS.length];
              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-stone-200/90 bg-white p-7 shadow-xs transition hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-950 text-amber-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-serif-display text-2xl font-bold text-stone-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-t border-stone-200/80 bg-emerald-950 py-20 text-amber-50 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold tracking-[0.22em] text-amber-300 uppercase">
              {t.howSection.eyebrow}
            </p>
            <h2 className="mt-3 font-serif-display text-3xl font-bold text-white sm:text-5xl">
              {t.howSection.title}
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {t.howSection.steps.map((step) => (
              <div key={step.num} className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-xs">
                <span className="font-serif-display text-4xl font-bold text-amber-300">{step.num}</span>
                <h3 className="mt-4 font-serif-display text-2xl font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-emerald-100/80">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-8 py-4 text-sm font-bold text-emerald-950 shadow-lg transition hover:bg-amber-200"
            >
              {t.hero.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-stone-200 bg-[#FAF8F5] py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-stone-500 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-900" />
            <span className="font-serif-display text-lg font-bold text-stone-900">{t.brand}</span>
            <span>— {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-5">
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
