import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Eye,
  Users,
  ExternalLink,
  Pencil,
  QrCode,
  Trash2,
  Download,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Info,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { QrModal } from '../components/QrModal';
import { useApp } from '../lib/AppContext';
import { getTranslations, formatEventDate } from '../i18n/translations';
import { api } from '../lib/api';
import type { InvitationData, RsvpItem } from '../types/invitation';

export const DashboardPage: React.FC = () => {
  const { lang, user } = useApp();
  const t = getTranslations(lang).dashboard;

  const [invitations, setInvitations] = useState<InvitationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [rsvps, setRsvps] = useState<RsvpItem[]>([]);
  const [rsvpSummary, setRsvpSummary] = useState({
    totalResponses: 0,
    goingResponses: 0,
    declinedResponses: 0,
    maybeResponses: 0,
    totalGuests: 0,
  });
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [qrSlug, setQrSlug] = useState<{ slug: string; title: string } | null>(null);

  const loadMine = async () => {
    setLoading(true);
    try {
      const res = await api.getMine();
      setInvitations(res.invitations);
      if (res.invitations.length > 0 && !selectedSlug) {
        setSelectedSlug(res.invitations[0].slug);
      }
    } catch {
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMine();
  }, [user]);

  useEffect(() => {
    if (!selectedSlug) {
      setRsvps([]);
      return;
    }
    setRsvpLoading(true);
    api
      .getRsvps(selectedSlug)
      .then((res) => {
        setRsvps(res.rsvps);
        setRsvpSummary(res.summary);
      })
      .catch(() => setRsvps([]))
      .finally(() => setRsvpLoading(false));
  }, [selectedSlug]);

  const handleDeleteInv = async (slug: string) => {
    if (!window.confirm(t.confirmDelete)) return;
    await api.deleteInvitation(slug);
    const remaining = invitations.filter((i) => i.slug !== slug);
    setInvitations(remaining);
    if (selectedSlug === slug) {
      setSelectedSlug(remaining[0]?.slug || null);
    }
  };

  const handleDeleteRsvp = async (id: number) => {
    if (!selectedSlug) return;
    await api.deleteRsvp(selectedSlug, id);
    const res = await api.getRsvps(selectedSlug);
    setRsvps(res.rsvps);
    setRsvpSummary(res.summary);
  };

  const exportCsv = () => {
    if (!selectedSlug || rsvps.length === 0) return;
    const header = ['Ism', 'Telefon', 'Holat', 'Mehmonlar soni', 'Test natijasi (%)', 'Tilaklar', 'Vaqt'];
    const rows = rsvps.map((r) => [
      `"${(r.guestName || '').replace(/"/g, '""')}"`,
      `"${(r.phone || '').replace(/"/g, '""')}"`,
      r.attendance,
      r.guestsCount,
      r.quizScore !== null && r.quizScore !== undefined ? `${r.quizScore}%` : '',
      `"${(r.wishMessage || '').replace(/"/g, '""')}"`,
      r.createdAt,
    ]);
    const csv = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSlug}-mehmonlar.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedInv = invitations.find((i) => i.slug === selectedSlug);

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-serif-display text-3xl font-bold text-stone-950 sm:text-4xl">
              {t.title}
            </h1>
            <p className="mt-1 text-sm text-stone-600">{t.subtitle}</p>
          </div>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-semibold text-amber-50 shadow-sm hover:bg-emerald-900"
          >
            <Plus className="h-4 w-4" />
            {t.newBtn}
          </Link>
        </div>

        {/* Tip for non-logged-in users */}
        {!user && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-950">
            <span className="inline-flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-700" />
              {t.guestTip}
            </span>
            <Link to="/login" className="font-bold underline">
              {getTranslations(lang).nav.login}
            </Link>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-emerald-900 border-t-transparent" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-stone-200 bg-white px-6 py-16 text-center shadow-xs">
            <h2 className="font-serif-display text-2xl font-bold text-stone-900">{t.emptyTitle}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">{t.emptyDesc}</p>
            <Link
              to="/create"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-950 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-900"
            >
              <Plus className="h-4 w-4" />
              {t.newBtn}
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-7 lg:grid-cols-12">
            {/* LEFT: Invitations List */}
            <div className="space-y-4 lg:col-span-5">
              {invitations.map((inv) => {
                const active = inv.slug === selectedSlug;
                return (
                  <div
                    key={inv.slug}
                    onClick={() => setSelectedSlug(inv.slug)}
                    className={`cursor-pointer rounded-3xl border bg-white p-5 transition ${
                      active
                        ? 'border-emerald-900 ring-1 ring-emerald-900 shadow-md'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600 uppercase">
                          {inv.templateId}
                        </span>
                        <h3 className="mt-2 font-serif-display text-2xl font-bold text-stone-900">
                          {inv.heroNames}
                        </h3>
                        <p className="text-xs text-stone-500">
                          {formatEventDate(inv.eventDate, lang)} • {inv.venueName}
                        </p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-stone-50 p-3 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-sm font-bold text-stone-900">
                          <Eye className="h-3.5 w-3.5 text-stone-400" />
                          {inv.viewsCount || 0}
                        </div>
                        <div className="text-[11px] text-stone-500">{t.views}</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-stone-900">{inv.rsvpCount || 0}</div>
                        <div className="text-[11px] text-stone-500">{t.responses}</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-sm font-bold text-emerald-800">
                          <Users className="h-3.5 w-3.5" />
                          {inv.totalGuests || 0}
                        </div>
                        <div className="text-[11px] text-stone-500">{t.guests}</div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/i/${inv.slug}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t.open}
                      </Link>
                      <Link
                        to={`/edit/${inv.slug}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {t.edit}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setQrSlug({ slug: inv.slug, title: inv.heroNames })}
                        className="inline-flex items-center gap-1 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        {t.qr}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteInv(inv.slug)}
                        className="ml-auto inline-flex items-center gap-1 rounded-xl border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT: RSVP Details Panel */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div>
                    <h2 className="font-serif-display text-2xl font-bold text-stone-900">
                      {t.guestList}
                    </h2>
                    {selectedInv && (
                      <p className="text-xs text-stone-500">
                        {selectedInv.heroNames} — /i/{selectedInv.slug}
                      </p>
                    )}
                  </div>
                  {rsvps.length > 0 && (
                    <button
                      type="button"
                      onClick={exportCsv}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t.exportCsv}
                    </button>
                  )}
                </div>

                {/* Summary Pills */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-emerald-50 p-3">
                    <p className="text-xs text-emerald-800">{t.totalExpected}</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-950">{rsvpSummary.totalGuests}</p>
                  </div>
                  <div className="rounded-2xl bg-stone-50 p-3">
                    <p className="text-xs text-stone-500">{t.going}</p>
                    <p className="mt-1 text-2xl font-bold text-stone-900">{rsvpSummary.goingResponses}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-3">
                    <p className="text-xs text-amber-800">{t.maybe}</p>
                    <p className="mt-1 text-2xl font-bold text-amber-900">{rsvpSummary.maybeResponses}</p>
                  </div>
                  <div className="rounded-2xl bg-red-50 p-3">
                    <p className="text-xs text-red-700">{t.declined}</p>
                    <p className="mt-1 text-2xl font-bold text-red-900">{rsvpSummary.declinedResponses}</p>
                  </div>
                </div>

                {/* Guest List */}
                <div className="mt-6">
                  {rsvpLoading ? (
                    <p className="py-10 text-center text-xs text-stone-400">...</p>
                  ) : rsvps.length === 0 ? (
                    <p className="py-12 text-center text-sm text-stone-500">{t.noRsvps}</p>
                  ) : (
                    <div className="divide-y divide-stone-100">
                      {rsvps.map((r) => (
                        <div key={r.id} className="flex items-start justify-between gap-3 py-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-stone-900">{r.guestName}</span>
                              {r.attendance === 'yes' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {t.going} ({r.guestsCount})
                                </span>
                              )}
                              {r.attendance === 'maybe' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                                  <HelpCircle className="h-3 w-3" />
                                  {t.maybe}
                                </span>
                              )}
                              {r.attendance === 'no' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
                                  <XCircle className="h-3 w-3" />
                                  {t.declined}
                                </span>
                              )}
                              {r.quizScore !== null && r.quizScore !== undefined && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800">
                                  ❤️ {t.quizScoreLabel}: {r.quizScore}%
                                </span>
                              )}
                            </div>
                            {r.phone && <p className="mt-0.5 text-xs text-stone-500">{r.phone}</p>}
                            {r.wishMessage && (
                              <p className="mt-1.5 rounded-xl bg-stone-50 px-3 py-2 text-xs italic text-stone-700">
                                “{r.wishMessage}”
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteRsvp(r.id)}
                            className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {qrSlug && <QrModal slug={qrSlug.slug} title={qrSlug.title} onClose={() => setQrSlug(null)} />}
    </div>
  );
};
