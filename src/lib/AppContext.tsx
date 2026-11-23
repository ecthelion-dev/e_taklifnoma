import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Lang, UserProfile } from '../types/invitation';
import { api, getStoredEditTokens } from './api';

interface AppContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  user: UserProfile | null;
  authLoading: boolean;
  setUser: (u: UserProfile | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('etaklif_lang');
    return saved === 'ru' ? 'ru' : 'uz';
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const setLang = (next: Lang) => {
    setLangState(next);
    localStorage.setItem('etaklif_lang', next);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      if (res.user) {
        const tokens = getStoredEditTokens();
        if (tokens.length > 0) {
          api.claimMine(tokens).catch(() => {});
        }
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AppContext.Provider value={{ lang, setLang, user, authLoading, setUser, refreshUser, logout }}>
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
