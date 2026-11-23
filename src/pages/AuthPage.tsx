import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useApp } from '../lib/AppContext';
import { getTranslations } from '../i18n/translations';
import { api, getStoredEditTokens } from '../lib/api';

export const AuthPage: React.FC = () => {
  const { lang, setUser } = useApp();
  const t = getTranslations(lang).auth;
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res =
        mode === 'login'
          ? await api.login(email, password)
          : await api.register(name, email, password);
      setUser(res.user);
      const tokens = getStoredEditTokens();
      if (tokens.length > 0) {
        await api.claimMine(tokens).catch(() => {});
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-950 text-amber-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-center font-serif-display text-3xl font-bold text-stone-950">
            {mode === 'login' ? t.loginTitle : t.registerTitle}
          </h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">{t.name}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-800"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">{t.email}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-800"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">{t.password}</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-800"
              />
            </div>

            {error && <p className="text-xs font-medium text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-950 py-3 text-sm font-semibold text-amber-50 hover:bg-emerald-900 disabled:opacity-60"
            >
              {loading ? '...' : mode === 'login' ? t.loginBtn : t.registerBtn}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-stone-600">
            {mode === 'login' ? (
              <>
                {t.noAccount}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className="font-bold text-emerald-900 underline"
                >
                  {t.registerBtn}
                </button>
              </>
            ) : (
              <>
                {t.hasAccount}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="font-bold text-emerald-900 underline"
                >
                  {t.loginBtn}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
