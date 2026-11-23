import React, { useEffect, useState } from 'react';
import { X, Download, Copy, Check, Send } from 'lucide-react';
import { api } from '../lib/api';
import { useApp } from '../lib/AppContext';
import { getTranslations } from '../i18n/translations';

interface QrModalProps {
  slug: string;
  title?: string;
  onClose: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({ slug, title, onClose }) => {
  const { lang } = useApp();
  const t = getTranslations(lang).builder.publishedModal;
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [shareUrl, setShareUrl] = useState(`${window.location.origin}/i/${slug}`);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .getQr(slug)
      .then((res) => {
        setQrDataUrl(res.dataUrl);
        setShareUrl(res.url);
      })
      .catch(() => {});
  }, [slug]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `etaklif-${slug}-qr.png`;
    a.click();
  };

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
    title ? `${title}` : 'Elektron taklifnoma'
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="font-serif-display text-2xl font-bold text-stone-900">
          {title || 'QR-kod'}
        </h3>
        <p className="mt-1 text-xs text-stone-500">{shareUrl}</p>

        <div className="my-5 flex justify-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="h-56 w-56 rounded-2xl border border-stone-200 p-2 shadow-sm"
            />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center rounded-2xl bg-stone-100 text-xs text-stone-400">
              ...
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-semibold text-stone-800 hover:bg-stone-100"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? t.copied : t.copyLink}
          </button>

          <button
            type="button"
            onClick={downloadQr}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs font-semibold text-stone-800 hover:bg-stone-100"
          >
            <Download className="h-4 w-4" />
            {t.downloadQr}
          </button>

          <a
            href={telegramShareUrl}
            target="_blank"
            rel="noreferrer"
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-600"
          >
            <Send className="h-4 w-4" />
            {t.shareTelegram}
          </a>
        </div>
      </div>
    </div>
  );
};
