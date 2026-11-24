import type { InvitationData, RsvpItem, UserProfile } from '../types/invitation';

const TOKENS_KEY = 'etaklif_edit_tokens';

export function getStoredEditTokens(): string[] {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEditToken(token: string) {
  if (!token) return;
  const current = getStoredEditTokens();
  if (!current.includes(token)) {
    localStorage.setItem(TOKENS_KEY, JSON.stringify([token, ...current]));
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const tokens = getStoredEditTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (tokens.length > 0) {
    headers['x-edit-tokens'] = tokens.join(',');
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  getConfig: () => apiFetch<{ telegramBotUsername: string | null }>('/api/config'),
  getMe: () => apiFetch<{ user: UserProfile | null }>('/api/auth/me'),
  login: (email: string, password: string) =>
    apiFetch<{ user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    apiFetch<{ user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  logout: () => apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  uploadPhoto: (dataUrl: string) =>
    apiFetch<{ url: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ dataUrl }),
    }),

  getDemos: () => apiFetch<{ invitations: InvitationData[] }>('/api/invitations/demos'),
  checkSlug: (slug: string) =>
    apiFetch<{ available: boolean; sanitized: string }>(`/api/invitations/check-slug/${encodeURIComponent(slug)}`),
  getMine: () => apiFetch<{ invitations: InvitationData[] }>('/api/invitations/mine'),
  claimMine: (editTokens: string[]) =>
    apiFetch<{ claimed: number }>('/api/invitations/claim', {
      method: 'POST',
      body: JSON.stringify({ editTokens }),
    }),

  getInvitation: (slug: string, preview = false) =>
    apiFetch<{ invitation: InvitationData; wishes: RsvpItem[]; canManage: boolean }>(
      `/api/invitations/${encodeURIComponent(slug)}${preview ? '?preview=1' : ''}`
    ),
  createInvitation: (payload: Partial<InvitationData>) =>
    apiFetch<{ invitation: InvitationData; editToken: string }>('/api/invitations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateInvitation: (slug: string, payload: Partial<InvitationData>) =>
    apiFetch<{ invitation: InvitationData }>(`/api/invitations/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteInvitation: (slug: string) =>
    apiFetch<{ ok: boolean }>(`/api/invitations/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    }),

  getQr: (slug: string) =>
    apiFetch<{ dataUrl: string; url: string }>(
      `/api/invitations/${encodeURIComponent(slug)}/qr?origin=${encodeURIComponent(window.location.origin)}`
    ),

  submitRsvp: (
    slug: string,
    payload: {
      guestName: string;
      phone: string;
      attendance: 'yes' | 'no' | 'maybe';
      guestsCount: number;
      wishMessage: string;
      quizScore?: number | null;
    }
  ) =>
    apiFetch<{ rsvp: RsvpItem }>(`/api/invitations/${encodeURIComponent(slug)}/rsvp`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getRsvps: (slug: string) =>
    apiFetch<{
      rsvps: RsvpItem[];
      summary: {
        totalResponses: number;
        goingResponses: number;
        declinedResponses: number;
        maybeResponses: number;
        totalGuests: number;
      };
    }>(`/api/invitations/${encodeURIComponent(slug)}/rsvps`),
  deleteRsvp: (slug: string, id: number) =>
    apiFetch<{ ok: boolean }>(`/api/invitations/${encodeURIComponent(slug)}/rsvps/${id}`, {
      method: 'DELETE',
    }),
};
