/**
 * Investor profile context.
 *
 * The Markets and Research screens are personalised by investing style —
 * screener thresholds, budget-aware suggestions, which shareholder-letter
 * lessons surface. That profile used to live in browser localStorage with the
 * classification computed client-side; it is now owned by the backend and
 * scoped to the signed-in account, so it follows the user across devices.
 *
 * The shape exposed here is unchanged from the original context, so the screens
 * that consume it read the same fields.
 */

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import {
  fetchInvestorProfile,
  saveInvestorProfile as saveInvestorProfileApi,
  deleteInvestorProfile as deleteInvestorProfileApi,
  InvestorProfile,
} from '../services/api';
import { useAppStore } from '../store/useAppStore';

export interface InvestorProfileWithName extends InvestorProfile {
  name: string;
}

export interface InvestorInputs {
  age: number;
  riskAppetite: string;
  horizon: number;
  monthlyInvestment: number;
  goal: string;
  existingPortfolio?: number;
}

interface ContextValue {
  profile: InvestorProfileWithName | null;
  loaded: boolean;
  error: string | null;
  saveProfile: (inputs: InvestorInputs) => Promise<InvestorProfileWithName>;
  clearProfile: () => Promise<void>;
  reload: () => Promise<void>;
}

const InvestorProfileContext = createContext<ContextValue | null>(null);

export function InvestorProfileProvider({ children }: { children: ReactNode }) {
  const user = useAppStore((s) => s.user);
  const [profile, setProfile] = useState<InvestorProfileWithName | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withName = useCallback(
    (p: InvestorProfile): InvestorProfileWithName => ({ ...p, name: user?.name || 'Investor' }),
    [user?.name]
  );

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    setError(null);
    try {
      const p = await fetchInvestorProfile(user.id);
      setProfile(p ? withName(p) : null);
    } catch (err: any) {
      console.error('Investor profile load failed:', err);
      setError(err?.message || 'Could not load your investor profile.');
      setProfile(null);
    } finally {
      setLoaded(true);
    }
  }, [user?.id, withName]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProfile(inputs: InvestorInputs) {
    if (!user) throw new Error('You must be signed in to save an investor profile.');
    const saved = await saveInvestorProfileApi(user.id, {
      age: Number(inputs.age),
      riskAppetite: inputs.riskAppetite,
      horizon: Number(inputs.horizon),
      monthlyInvestment: Number(inputs.monthlyInvestment) || 0,
      goal: inputs.goal,
      existingPortfolio: Number(inputs.existingPortfolio) || 0,
    });
    const next = withName(saved);
    setProfile(next);
    return next;
  }

  async function clearProfile() {
    if (!user) return;
    await deleteInvestorProfileApi(user.id);
    setProfile(null);
  }

  return (
    <InvestorProfileContext.Provider
      value={{ profile, loaded, error, saveProfile, clearProfile, reload: load }}
    >
      {children}
    </InvestorProfileContext.Provider>
  );
}

export function useInvestorProfile(): ContextValue {
  const ctx = useContext(InvestorProfileContext);
  if (!ctx) {
    throw new Error('useInvestorProfile must be used inside <InvestorProfileProvider>');
  }
  return ctx;
}
