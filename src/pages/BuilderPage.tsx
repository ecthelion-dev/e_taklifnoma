import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Palette,
  FileText,
  MapPin,
  ListOrdered,
  Heart,
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Plus,
  Trash2,
  Upload,
  Check,
  Copy,
  Download,
  ExternalLink,
  Send,
  Sparkles,
  LayoutDashboard,
  X,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useApp } from '../lib/AppContext';
import { getTranslations } from '../i18n/translations';
import { TEMPLATE_CATALOG, createDefaultInvitation, getDefaultQuiz, getTemplateMeta } from '../templates/catalog';
import { InvitationRenderer } from '../templates/InvitationRenderer';
import type { EventType, InvitationData, Lang, TemplateCategory, TemplateId } from '../types/invitation';
import { api, saveEditToken } from '../lib/api';

type EditorTab = 'design' | 'details' | 'venue' | 'program' | 'quiz' | 'media';

export const BuilderPage: React.FC = () => {
  const { lang } = useApp();
  const fullT = getTranslations(lang);
  const t = fullT.builder;
  const [searchParams] = useSearchParams();
  const { slug: editSlug } = useParams<{ slug?: string }>();
  const isEditing = Boolean(editSlug);

  const initialTpl = (searchParams.get('template') as TemplateId) || 'milliy';
  const validTpl: TemplateId = TEMPLATE_CATALOG.some((x) => x.id === initialTpl) ? initialTpl : 'milliy';

  const [form, setForm] = useState<InvitationData>(() => createDefaultInvitation(validTpl, lang));
  const [activeTab, setActiveTab] = useState<EditorTab>('design');
  const [tplCategory, setTplCategory] = useState<'all' | TemplateCategory>('all');
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  const [slugStatus, setSlugStatus] = useState<'idle' | 'available' | 'taken'>('idle');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [publishedQr, setPublishedQr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!editSlug) return;
    api
      .getInvitation(editSlug, true)
      .then((res) => {
        setForm({ ...res.invitation, quiz: res.invitation.quiz || [] });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Yuklab bo‘lmadi');
      });
  }, [editSlug]);

  useEffect(() => {
    if (isEditing || !form.slug.trim()) {
      setSlugStatus('idle');
      return;
    }
    const timer = setTimeout(() => {
      api
        .checkSlug(form.slug)
        .then((res) => {
          setSlugStatus(res.available ? 'available' : 'taken');
        })
        .catch(() => setSlugStatus('idle'));
    }, 350);
    return () => clearTimeout(timer);
  }, [form.slug, isEditing]);

  const currentTplMeta = getTemplateMeta(form.templateId);

  const updateField = <K extends keyof InvitationData>(key: K, value: InvitationData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectTemplate = (tplId: TemplateId) => {
    if (!isEditing) {
      // Fresh smart template defaults when creating new invitation
      const fresh = createDefaultInvitation(tplId, form.lang);
      setForm((prev) => ({
        ...fresh,
        slug: prev.slug,
        photoUrl: prev.photoUrl,
      }));
      return;
    }
    const meta = getTemplateMeta(tplId);
    setForm((prev) => ({
      ...prev,
      templateId: tplId,
      paletteId: meta.defaultPaletteId,
      showBismillah: tplId === 'islomiy' ? true : prev.showBismillah,
      quiz: tplId === 'sevgi-test' && prev.quiz.length === 0 ? getDefaultQuiz(prev.lang) : prev.quiz,
    }));
  };

  const compressImageFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(String(reader.result));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Rasm hajmi 10MB dan kichik bo‘lishi kerak.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const dataUrl = await compressImageFile(file);
      const res = await api.uploadPhoto(dataUrl);
      updateField('photoUrl', res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rasm yuklashda xatolik');
    } finally {
      setUploading(false);
    }
  };

  const addProgramItem = () => {
    updateField('program', [
      ...form.program,
      { id: String(Date.now()), time: '19:00', title: '', description: '' },
    ]);
  };

  const updateProgramItem = (id: string, key: 'time' | 'title' | 'description', val: string) => {
    updateField(
      'program',
      form.program.map((item) => (item.id === id ? { ...item, [key]: val } : item))
    );
  };

  const removeProgramItem = (id: string) => {
    updateField(
      'program',
      form.program.filter((item) => item.id !== id)
    );
  };

  // Quiz editor helpers
  const addQuizQuestion = () => {
    updateField('quiz', [
      ...(form.quiz || []),
      {
        id: `q-${Date.now()}`,
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
      },
    ]);
  };

  const updateQuizQuestion = (id: string, text: string) => {
    updateField(
      'quiz',
      (form.quiz || []).map((q) => (q.id === id ? { ...q, question: text } : q))
    );
  };

  const updateQuizOption = (id: string, optIdx: number, val: string) => {
    updateField(
      'quiz',
      (form.quiz || []).map((q) => {
        if (q.id !== id) return q;
        const nextOpts = [...q.options];
        nextOpts[optIdx] = val;
        return { ...q, options: nextOpts };
      })
    );
  };

  const updateQuizCorrect = (id: string, correctIndex: number) => {
    updateField(
      'quiz',
      (form.quiz || []).map((q) => (q.id === id ? { ...q, correctIndex } : q))
    );
  };

  const removeQuizQuestion = (id: string) => {
    updateField(
      'quiz',
      (form.quiz || []).filter((q) => q.id !== id)
    );
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      let finalSlug = '';
      if (isEditing && editSlug) {
        const res = await api.updateInvitation(editSlug, form);
        finalSlug = res.invitation.slug;
      } else {
        const res = await api.createInvitation(form);
        saveEditToken(res.editToken);
        finalSlug = res.invitation.slug;
      }
      setPublishedSlug(finalSlug);
      const qrRes = await api.getQr(finalSlug).catch(() => null);
      if (qrRes) setPublishedQr(qrRes.dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const shareUrl = publishedSlug ? `${window.location.origin}/i/${publishedSlug}` : '';

  const tabs: Array<{ id: EditorTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'design', label: t.tabs.design, icon: Palette },
    { id: 'details', label: t.tabs.details, icon: FileText },
    { id: 'venue', label: t.tabs.venue, icon: MapPin },
    { id: 'program', label: t.tabs.program, icon: ListOrdered },
    { id: 'quiz', label: t.tabs.quiz, icon: Heart },
    { id: 'media', label: t.tabs.media, icon: ImageIcon },
  ];

  const visibleTemplates =
    tplCategory === 'all' ? TEMPLATE_CATALOG : TEMPLATE_CATALOG.filter((x) => x.category === tplCategory);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F5]">
      <Navbar />

      {/* Top Studio Bar */}
      <div className="border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif-display text-2xl font-bold text-stone-900">
            {isEditing ? t.editTitle : t.title}
          </h1>

          <div className="flex items-center gap-2.5">
            <div className="flex rounded-xl border border-stone-200 bg-stone-100 p-0.5 text-xs font-semibold lg:hidden">
              <button
                type="button"
                onClick={() => setMobileView('editor')}
                className={`rounded-lg px-3 py-1.5 ${mobileView === 'editor' ? 'bg-white shadow-xs' : 'text-stone-500'}`}
              >
                {t.tabs.details}
              </button>
              <button
                type="button"
                onClick={() => setMobileView('preview')}
                className={`rounded-lg px-3 py-1.5 ${mobileView === 'preview' ? 'bg-white shadow-xs' : 'text-stone-500'}`}
              >
                {t.mobilePreview}
              </button>
            </div>

            <div className="hidden items-center rounded-xl border border-stone-200 bg-stone-100 p-0.5 text-xs font-semibold lg:flex">
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${
                  previewMode === 'mobile' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                {t.mobilePreview}
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${
                  previewMode === 'desktop' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                {t.desktopPreview}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-950 px-5 py-2.5 text-xs font-semibold text-amber-50 shadow-sm transition hover:bg-emerald-900 disabled:opacity-60 sm:text-sm"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              {saving ? t.saving : isEditing ? t.saveChanges : t.publish}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-auto mt-3 w-full max-w-7xl px-4 sm:px-6">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Main Split Workspace */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12">
        {/* LEFT EDITOR PANEL */}
        <div className={`lg:col-span-5 ${mobileView === 'preview' ? 'hidden lg:block' : 'block'}`}>
          <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xs">
            {/* Section Tabs — 3x2 on mobile, 6x1 on sm+ */}
            <div className="grid grid-cols-3 gap-1 border-b border-stone-200 bg-stone-50/70 p-1.5 sm:grid-cols-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-semibold transition sm:text-[11px] ${
                      active
                        ? tab.id === 'quiz'
                          ? 'bg-rose-700 text-white shadow-xs'
                          : 'bg-emerald-950 text-amber-50 shadow-xs'
                        : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="space-y-5 p-5 sm:p-6">
              {activeTab === 'design' && (
                <>
                  {/* Category filter pills inside builder */}
                  <div>
                    <label className="mb-2 block text-xs font-bold tracking-wider text-stone-500 uppercase">
                      {t.fields.template}
                    </label>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {(
                        [
                          { id: 'all', label: fullT.categories.all },
                          { id: 'emotions', label: fullT.categories.emotions },
                          { id: 'love', label: fullT.categories.love },
                          { id: 'wedding', label: fullT.categories.wedding },
                          { id: 'family', label: fullT.categories.family },
                        ] as const
                      ).map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setTplCategory(cat.id)}
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                            tplCategory === cat.id
                              ? cat.id === 'love' || cat.id === 'emotions'
                                ? 'bg-rose-700 text-white'
                                : 'bg-emerald-950 text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                      {visibleTemplates.map((tpl) => {
                        const active = form.templateId === tpl.id;
                        const pal = tpl.palettes[0];
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => handleSelectTemplate(tpl.id)}
                            className={`flex items-center gap-3 rounded-2xl border p-2.5 text-left transition ${
                              active
                                ? tpl.category === 'love'
                                  ? 'border-rose-700 bg-rose-50/70 ring-1 ring-rose-700'
                                  : 'border-emerald-900 bg-emerald-50/60 ring-1 ring-emerald-900'
                                : 'border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/10 text-xs font-bold"
                              style={{ backgroundColor: pal.bg, color: pal.primary }}
                            >
                              {tpl.category === 'love' ? '❤️' : tpl.category === 'emotions' ? '💌' : 'Aa'}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-stone-900">
                                {lang === 'ru' ? tpl.nameRu : tpl.nameUz}
                              </p>
                              <p className="truncate text-[10px] text-stone-500">
                                {lang === 'ru' ? tpl.tagRu : tpl.tagUz}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Color Palette Selector — 2 cols on small phones, 3 cols on sm+ */}
                  <div>
                    <label className="mb-2 block text-xs font-bold tracking-wider text-stone-500 uppercase">
                      {t.fields.palette}
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {currentTplMeta.palettes.map((pal) => {
                        const active = form.paletteId === pal.id;
                        return (
                          <button
                            key={pal.id}
                            type="button"
                            onClick={() => updateField('paletteId', pal.id)}
                            className={`rounded-2xl border p-2.5 text-left transition ${
                              active ? 'border-emerald-900 ring-1 ring-emerald-900' : 'border-stone-200'
                            }`}
                          >
                            <div className="flex gap-1.5">
                              <span className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: pal.bg }} />
                              <span className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: pal.primary }} />
                              <span className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: pal.accent }} />
                            </div>
                            <p className="mt-2 truncate text-[11px] font-semibold text-stone-700">
                              {lang === 'ru' ? pal.nameRu : pal.nameUz}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Event Type */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold tracking-wider text-stone-500 uppercase">
                      {t.fields.eventType}
                    </label>
                    <select
                      value={form.eventType}
                      onChange={(e) => updateField('eventType', e.target.value as EventType)}
                      className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-800"
                    >
                      {(Object.keys(t.eventTypes) as EventType[]).map((key) => (
                        <option key={key} value={key}>
                          {t.eventTypes[key]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Invitation Language */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold tracking-wider text-stone-500 uppercase">
                      {t.fields.invLang}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['uz', 'ru'] as Lang[]).map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => updateField('lang', l)}
                          className={`rounded-xl border py-2.5 text-xs font-semibold transition ${
                            form.lang === l
                              ? 'border-emerald-900 bg-emerald-950 text-white'
                              : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          {l === 'uz' ? 'O‘zbekcha' : 'Русский'}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'details' && (
                <>
                  {!isEditing && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-600">{t.fields.slug}</label>
                      <div className="flex items-center overflow-hidden rounded-xl border border-stone-200 focus-within:border-emerald-800">
                        <span className="bg-stone-100 px-3 py-2.5 text-xs text-stone-500">/i/</span>
                        <input
                          type="text"
                          value={form.slug}
                          onChange={(e) =>
                            updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
                          }
                          placeholder="javohir-va-madina"
                          className="w-full px-3 py-2.5 text-sm outline-none"
                        />
                      </div>
                      {slugStatus === 'available' && (
                        <p className="mt-1 text-xs font-medium text-emerald-700">{t.fields.slugAvailable}</p>
                      )}
                      {slugStatus === 'taken' && (
                        <p className="mt-1 text-xs font-medium text-red-600">{t.fields.slugTaken}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">{t.fields.title}</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">{t.fields.heroNames} *</label>
                    <input
                      type="text"
                      value={form.heroNames}
                      onChange={(e) => updateField('heroNames', e.target.value)}
                      className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">{t.fields.hostLine}</label>
                    <input
                      type="text"
                      value={form.hostLine}
                      onChange={(e) => updateField('hostLine', e.target.value)}
                      className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">{t.fields.welcomeText}</label>
                    <textarea
                      rows={4}
                      value={form.welcomeText}
                      onChange={(e) => updateField('welcomeText', e.target.value)}
                      className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">{t.fields.quoteText}</label>
                    <input
                      type="text"
                      value={form.quoteText}
                      onChange={(e) => updateField('quoteText', e.target.value)}
                      className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-800"
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-stone-200 p-3 text-xs font-medium text-stone-700">
                    <input
                      type="checkbox"
                      checked={form.showBismillah}
                      onChange={(e) => updateField('showBismillah', e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-900"
                    />
                    {t.fields.showBismillah}
                  </label>
                </>
              )}

              {activeTab === 'venue' && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-600">{t.fields.eventDate} *</label>
                      <input
                        type="date"
                        value={form.eventDate}
                        onChange={(e) => updateField('eventDate', e.target.value)}
                        className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-800"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-600">{t.fields.eventTime}</label>
                      <input
                        type="time"
                        value={form.eventTime}
                        onChange={(e) => updateField('eventTime', e.target.value)}
                        className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">{t.fields.venueName} *</label>
                    <input
                      type="text"
                      value={form.venueName}
                      onChange={(e) => updateField('venueName', e.target.value)}
                      className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">{t.fields.venueAddress}</label>
                    <input
                      type="text"
                      value={form.venueAddress}
                      onChange={(e) => updateField('venueAddress', e.target.value)}
                      className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">{t.fields.mapUrl}</label>
                    <input
                      type="url"
                      value={form.mapUrl}
                      onChange={(e) => updateField('mapUrl', e.target.value)}
                      placeholder="https://yandex.uz/maps/..."
                      className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">{t.fields.dressCode}</label>
                    <input
                      type="text"
                      value={form.dressCode}
                      onChange={(e) => updateField('dressCode', e.target.value)}
                      className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">{t.fields.contactPhone}</label>
                    <input
                      type="tel"
                      value={form.contactPhone}
                      onChange={(e) => updateField('contactPhone', e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-800"
                    />
                  </div>
                </>
              )}

              {activeTab === 'program' && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-stone-500 uppercase">
                      {t.fields.programTitle}
                    </span>
                    <button
                      type="button"
                      onClick={addProgramItem}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t.fields.addProgram}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {form.program.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3">
                        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                          <input
                            type="text"
                            value={item.time}
                            onChange={(e) => updateProgramItem(item.id, 'time', e.target.value)}
                            placeholder="18:00"
                            className="w-20 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none"
                          />
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateProgramItem(item.id, 'title', e.target.value)}
                            placeholder="Bosqich nomi"
                            className="flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeProgramItem(item.id)}
                            className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => updateProgramItem(item.id, 'description', e.target.value)}
                          placeholder="Qisqa izoh (ixtiyoriy)"
                          className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'quiz' && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-rose-700 uppercase">
                      {t.fields.quizTitle}
                    </span>
                    <button
                      type="button"
                      onClick={addQuizQuestion}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t.fields.addQuestion}
                    </button>
                  </div>
                  <p className="mb-4 text-[11px] leading-relaxed text-stone-500">{t.fields.quizHint}</p>

                  <div className="space-y-4">
                    {(form.quiz || []).map((q, qIdx) => (
                      <div key={q.id} className="rounded-2xl border border-rose-200/70 bg-rose-50/40 p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-700 text-[11px] font-bold text-white">
                            {qIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) => updateQuizQuestion(q.id, e.target.value)}
                            placeholder="Savol matni..."
                            className="flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeQuizQuestion(q.id)}
                            className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-2.5 space-y-1.5">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={q.correctIndex === optIdx}
                                onChange={() => updateQuizCorrect(q.id, optIdx)}
                                title={t.fields.correctAnswer}
                                className="h-3.5 w-3.5 accent-rose-700"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => updateQuizOption(q.id, optIdx, e.target.value)}
                                placeholder={`Variant ${optIdx + 1}`}
                                className="flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div>
                  <label className="mb-2 block text-xs font-bold tracking-wider text-stone-500 uppercase">
                    {t.fields.photoUpload}
                  </label>

                  {form.photoUrl ? (
                    <div className="space-y-3">
                      <img
                        src={form.photoUrl}
                        alt="Uploaded"
                        className="h-52 w-full rounded-2xl border border-stone-200 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => updateField('photoUrl', '')}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t.fields.removePhoto}
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center transition hover:border-emerald-700 hover:bg-emerald-50/30">
                      <Upload className="h-8 w-8 text-stone-400" />
                      <p className="mt-3 text-sm font-semibold text-stone-700">
                        {uploading ? '...' : t.fields.photoUpload}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">{t.fields.photoHint}</p>
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT LIVE PREVIEW PANEL */}
        <div className={`lg:col-span-7 ${mobileView === 'editor' ? 'hidden lg:block' : 'block'}`}>
          <div className="flex justify-center lg:sticky lg:top-20">
            {previewMode === 'mobile' ? (
              <div className="w-full overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl lg:max-w-[410px] lg:rounded-[46px] lg:border-[10px] lg:border-stone-900 lg:bg-stone-900 lg:p-2 lg:shadow-2xl">
                <div className="max-h-[78vh] overflow-y-auto bg-white lg:h-[740px] lg:max-h-none lg:rounded-[34px]">
                  <InvitationRenderer data={form} isPreview />
                </div>
              </div>
            ) : (
              <div className="max-h-[78vh] w-full overflow-y-auto rounded-3xl border border-stone-200 shadow-xl lg:h-[760px] lg:max-h-none">
                <InvitationRenderer data={form} isPreview />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PUBLISHED SUCCESS MODAL */}
      {publishedSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() => setPublishedSlug(null)}
              className="absolute top-4 right-4 rounded-full p-2 text-stone-400 hover:bg-stone-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <Check className="h-7 w-7" />
            </div>

            <h2 className="mt-4 font-serif-display text-3xl font-bold text-stone-900">
              {t.publishedModal.title}
            </h2>
            <p className="mt-1.5 text-xs text-stone-600">{t.publishedModal.subtitle}</p>

            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-left">
              <span className="truncate text-xs font-medium text-stone-700">{shareUrl}</span>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(shareUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-950 px-2.5 py-1.5 text-[11px] font-semibold text-white"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t.publishedModal.copied : t.publishedModal.copyLink}
              </button>
            </div>

            {publishedQr && (
              <div className="my-5 flex flex-col items-center">
                <img src={publishedQr} alt="QR Code" className="h-44 w-44 rounded-2xl border border-stone-200 p-2" />
                <a
                  href={publishedQr}
                  download={`etaklif-${publishedSlug}-qr.png`}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  {t.publishedModal.downloadQr}
                </a>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to={`/i/${publishedSlug}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-950 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t.publishedModal.openInvitation}
              </Link>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(form.heroNames)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 py-2.5 text-xs font-semibold text-white hover:bg-sky-600"
              >
                <Send className="h-3.5 w-3.5" />
                {t.publishedModal.shareTelegram}
              </a>
              <Link
                to="/dashboard"
                className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                {t.publishedModal.goDashboard}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
