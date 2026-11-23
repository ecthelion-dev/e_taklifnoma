import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './lib/AppContext';

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const BuilderPage = lazy(() => import('./pages/BuilderPage').then((m) => ({ default: m.BuilderPage })));
const InvitationPage = lazy(() => import('./pages/InvitationPage').then((m) => ({ default: m.InvitationPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));

const PageLoader: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5]">
    <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-900 border-t-transparent" />
  </div>
);

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<BuilderPage />} />
            <Route path="/edit/:slug" element={<BuilderPage />} />
            <Route path="/i/:slug" element={<InvitationPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
