/**
 * API client — the single place the app talks to the backend.
 *
 * Two surfaces are served by the same Express process and share one session:
 *   API_BASE     /api/v1  — accounts, onboarding, goals, WHS, portfolio, AI advisor
 *   MARKETS_BASE /api     — quotes, news, risk, treasury, reports, AI CFO
 *
 * Every call goes through `apiFetch`, which attaches the bearer token and
 * normalises error handling, so no screen has to plumb auth headers by hand.
 */

import { useAppStore } from '../store/useAppStore';

export const API_BASE = '/api/v1';
export const MARKETS_BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = useAppStore.getState().user?.token;
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Fetch against the backend with the session token attached.
 * `path` is relative to /api/v1 unless it already starts with `/api`.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('/api') ? path : `${API_BASE}${path}`;
  const hasBody = init.body !== undefined && init.body !== null;

  const res = await fetch(url, {
    ...init,
    headers: authHeaders({
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...((init.headers as Record<string, string>) || {}),
    }),
  });

  // A dead session should drop the user back to sign-in rather than render
  // half-empty screens.
  if (res.status === 401) {
    useAppStore.getState().logout();
  }
  return res;
}

/** Fetch and parse JSON, throwing ApiError with the server's message on failure. */
export async function apiJson<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* response had no JSON body */
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Wealth planning ───────────────────────────────────────────────────────────

export async function fetchWHS(userId: string) {
  return apiJson(`/users/${userId}/wealth-health-score`);
}

export async function fetchNetWorth(userId: string) {
  return apiJson(`/users/${userId}/net-worth`);
}

export async function fetchRecommendations(userId: string) {
  return apiJson(`/users/${userId}/recommendations`);
}

export async function dismissRecommendation(userId: string, recId: string) {
  return apiJson(`/users/${userId}/recommendations/${recId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Dismissed' }),
  });
}

export async function sendAIChatMessage(userId: string, message: string, chatHistory: any[] = []) {
  return apiJson(`/users/${userId}/ai/chat`, {
    method: 'POST',
    body: JSON.stringify({ message, chatHistory }),
  });
}

export async function updatePreferences(userId: string, display_currency: string) {
  return apiJson(`/users/${userId}/preferences`, {
    method: 'PATCH',
    body: JSON.stringify({ display_currency }),
  });
}

// ─── Investor profile ──────────────────────────────────────────────────────────

export interface InvestorClassification {
  type: string;
  icon: string;
  desc: string;
  allocation: { equity: number; debt: number; gold: number };
  buffettAdvice: string;
  maxStockPE: number;
  minDividendYield: number;
}

export interface InvestorProfile {
  age: number;
  riskAppetite: string;
  horizon: number;
  monthlyInvestment: number;
  goal: string;
  existingPortfolio: number;
  investor: InvestorClassification;
}

export async function fetchInvestorProfile(userId: string): Promise<InvestorProfile | null> {
  const res = await apiFetch(`/users/${userId}/investor-profile`);
  if (res.status === 404) return null;
  if (!res.ok) throw new ApiError('Failed to load investor profile', res.status);
  return res.json();
}

export async function saveInvestorProfile(
  userId: string,
  inputs: Omit<InvestorProfile, 'investor'>
): Promise<InvestorProfile> {
  return apiJson(`/users/${userId}/investor-profile`, {
    method: 'PUT',
    body: JSON.stringify(inputs),
  });
}

export async function deleteInvestorProfile(userId: string): Promise<void> {
  await apiJson(`/users/${userId}/investor-profile`, { method: 'DELETE' });
}

// ─── Portfolio tracker ─────────────────────────────────────────────────────────

export interface TrackerHolding {
  id: string;
  ticker: string;
  qty: number;
  buyPrice: number;
  currentPrice: number;
}

export async function fetchTrackerHoldings(userId: string): Promise<TrackerHolding[]> {
  return apiJson(`/users/${userId}/tracker/holdings`);
}

export async function addTrackerHolding(
  userId: string,
  holding: Omit<TrackerHolding, 'id'>
): Promise<TrackerHolding> {
  return apiJson(`/users/${userId}/tracker/holdings`, {
    method: 'POST',
    body: JSON.stringify(holding),
  });
}

export async function removeTrackerHolding(userId: string, holdingId: string): Promise<void> {
  await apiJson(`/users/${userId}/tracker/holdings/${holdingId}`, { method: 'DELETE' });
}

// ─── Watchlist ─────────────────────────────────────────────────────────────────

export interface WatchlistItem {
  id: string;
  companyName: string;
  score: number;
  rating: string;
  date: string;
}

export async function fetchWatchlist(userId: string): Promise<WatchlistItem[]> {
  return apiJson(`/users/${userId}/watchlist`);
}

export async function addWatchlistItem(
  userId: string,
  item: Omit<WatchlistItem, 'id'>
): Promise<WatchlistItem> {
  return apiJson(`/users/${userId}/watchlist`, {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function removeWatchlistItem(userId: string, itemId: string): Promise<void> {
  await apiJson(`/users/${userId}/watchlist/${itemId}`, { method: 'DELETE' });
}
