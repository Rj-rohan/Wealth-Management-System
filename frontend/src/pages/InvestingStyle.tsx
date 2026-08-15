/**
 * Investing style settings.
 *
 * Reachable from the sidebar-less prompts on Research and Markets screens, and
 * used by accounts that completed wealth discovery before the investing-style
 * step existed. Same form as the onboarding step — one implementation.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import InvestingStyleStep, {
  InvestingStyleValue,
  isInvestingStyleComplete,
} from '../components/InvestingStyleStep';
import { useInvestorProfile } from '../context/InvestorProfileContext';

export default function InvestingStyle() {
  const { profile, loaded, saveProfile } = useInvestorProfile();
  const navigate = useNavigate();

  const [value, setValue] = useState<InvestingStyleValue>({
    goal: '',
    riskAppetite: '',
    horizon: '',
    monthlyInvestment: '',
  });
  const [age, setAge] = useState(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setValue({
        goal: profile.goal,
        riskAppetite: profile.riskAppetite,
        horizon: profile.horizon,
        monthlyInvestment: profile.monthlyInvestment,
      });
      setAge(profile.age);
    }
  }, [profile]);

  async function handleSave() {
    if (!isInvestingStyleComplete(value)) return;
    setSaving(true);
    setError(null);
    try {
      await saveProfile({
        age,
        riskAppetite: value.riskAppetite,
        horizon: Number(value.horizon),
        monthlyInvestment: Number(value.monthlyInvestment) || 0,
        goal: value.goal,
        existingPortfolio: profile?.existingPortfolio ?? 0,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Could not save your investing style. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <AppShell pageTitle="Investing Style">
        <div className="page-state">
          <div className="spinner" />
          <p>Loading your profile…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      pageTitle="Investing Style"
      pageSubtitle="Sets your investor type, allocation targets and screener thresholds"
    >
      <div className="px-6 py-6 max-w-3xl mx-auto space-y-6">
        <div className="info-box">
          Your investor type personalises the stock screener, the budget-aware suggestions in Portfolio,
          and which shareholder-letter lessons are surfaced. It does not change your Wealth Health Score
          or goal calculations.
        </div>

        <div className="glass-panel">
          <div className="form-grid-2" style={{ marginBottom: '1.5rem' }}>
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Age
              </label>
              <input
                type="number"
                min={18}
                max={100}
                className="form-input"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
              />
            </div>
          </div>

          <InvestingStyleStep
            value={value}
            onChange={(patch) => setValue((prev) => ({ ...prev, ...patch }))}
            age={age}
          />

          {error && (
            <p className="text-sm mt-4" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          <button
            className="btn-primary"
            style={{ marginTop: '1.5rem', width: '100%' }}
            disabled={!isInvestingStyleComplete(value) || saving}
            onClick={handleSave}
          >
            {saving ? 'Saving…' : profile ? 'Update Investing Style' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
