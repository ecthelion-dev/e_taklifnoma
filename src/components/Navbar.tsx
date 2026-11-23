import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Menu, X, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useApp } from '../lib/AppContext';
import { getTranslations } from '../i18n/translations';

export const Navbar: React.FC = () => {
  const { lang, setLang, user, logout } = useApp();
  const t = getTranslations(lang);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#FAF8F5]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950 text-amber-300 shadow-sm transition group-hover:scale-105">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-serif-display text-2xl font-bold tracking-tight text-stone-900">
            {t.brand}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {isHome ? (
            <>
              <a href="#templates" className="text-sm font-medium text-stone-600 transition hover:text-stone-950">
                {t.nav.templates}
              </a>
              <a href="#features" className="text-sm font-medium text-stone-600 transition hover:text-stone-950">
                {t.nav.features}
              </a>
              <a href="#how" className="text-sm font-medium text-stone-600 transition hover:text-stone-950">
                {t.nav.howItWorks}
              </a>
            </>
          ) : (
            <Link to="/" className="text-sm font-medium text-stone-600 transition hover:text-stone-950">
              {t.nav.templates}
            </Link>
          )}
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 transition hover:text-stone-950"
          >
            <LayoutDashboard className="h-4 w-4" />
            {t.nav.dashboard}
          </Link>
        </nav>

        {/* Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {/* UZ / RU Switcher */}
          <div className="flex items-center rounded-full border border-stone-200 bg-white p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLang('uz')}
              className={`rounded-full px-2.5 py-1 transition ${
                lang === 'uz' ? 'bg-emerald-950 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              UZ
            </button>
            <button
              type="button"
              onClick={() => setLang('ru')}
              className={`rounded-full px-2.5 py-1 transition ${
                lang === 'ru' ? 'bg-emerald-950 text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              RU
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-stone-300"
              >
                <User className="h-3.5 w-3.5" />
                {user.name}
              </Link>
              <button
                type="button"
                onClick={logout}
                title={t.nav.logout}
                className="rounded-full p-2 text-stone-500 transition hover:bg-stone-200/70 hover:text-stone-900"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-full px-3.5 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-200/60"
            >
              {t.nav.login}
            </Link>
          )}

          <Link
            to="/create"
            className="rounded-full bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-amber-50 shadow-sm transition hover:bg-emerald-900"
          >
            {t.nav.create}
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setLang(lang === 'uz' ? 'ru' : 'uz')}
            className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-bold text-stone-700"
          >
            {lang.toUpperCase()}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-stone-700 hover:bg-stone-200/60"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="border-t border-stone-200 bg-[#FAF8F5] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-stone-700">
              {t.nav.templates}
            </Link>
            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-stone-700">
              {t.nav.dashboard}
            </Link>
            {user ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="text-left text-sm font-medium text-stone-700"
              >
                {t.nav.logout} ({user.name})
              </button>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-stone-700">
                {t.nav.login}
              </Link>
            )}
            <Link
              to="/create"
              onClick={() => setMobileOpen(false)}
              className="mt-1 rounded-xl bg-emerald-950 py-2.5 text-center text-sm font-semibold text-white"
            >
              {t.nav.create}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
