/**
 * Investing style — goal, risk appetite, horizon and monthly budget.
 *
 * These four answers classify the investor type that personalises the Research
 * and Markets screens. The step is shared by the onboarding wizard and the
 * standalone "investing style" page, so there is one form for both.
 *
 * Age and existing portfolio value are not asked here — onboarding already
 * captures date of birth and account holdings, and both are derived from those.
 */

import { useEffect, useState } from 'react';
import { apiJson, InvestorClassification } from '../services/api';

export interface InvestingStyleValue {
  goal: string;
  riskAppetite: string;
  horizon: string | number;
  monthlyInvestment: string | number;
}

export const GOAL_OPTIONS = [
  { value: 'wealth', label: 'Wealth Creation', emoji: '💰', desc: 'Grow money over long term' },
  { value: 'retirement', label: 'Retirement Planning', emoji: '🏖️', desc: 'Secure my future' },
  { value: 'house', label: 'Buy a House', emoji: '🏠', desc: 'Save for property' },
  { value: 'education', label: "Child's Education", emoji: '🎓', desc: 'Fund education goals' },
  { value: 'income', label: 'Regular Income', emoji: '📈', desc: 'Dividends & passive income' },
];

export const RISK_OPTIONS = [
  { value: 'low', label: 'Low', emoji: '🛡️', desc: 'Capital preservation first' },
  { value: 'medium', label: 'Medium', emoji: '⚖️', desc: 'Balanced growth & safety' },
  { value: 'high', label: 'High', emoji: '🚀', desc: 'Maximize long-term growth' },
];

export const TYPE_ACCENTS: Record<string, { color: string; bg: string; border: string }> = {
  Conservative: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
  'Aggressive Growth': { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' },
  'Wealth Builder': { color: '#A855F7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)' },
  Balanced: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
};

export function isInvestingStyleComplete(v: InvestingStyleValue): boolean {
  return Boolean(v.goal && v.riskAppetite && Number(v.horizon) > 0);
}

interface Props {
  value: InvestingStyleValue;
  onChange: (patch: Partial<InvestingStyleValue>) => void;
  /** Age derived from date of birth — used for the live classification preview. */
  age: number;
  /** Annual income, when known, to show the investment rate hint. */
  annualIncome?: number;
}

export default function InvestingStyleStep({ value, onChange, age, annualIncome }: Props) {
  const [preview, setPreview] = useState<InvestorClassification | null>(null);

  // Classification is computed by the backend so the preview always matches
  // what will be saved.
  useEffect(() => {
    if (!isInvestingStyleComplete(value) || !age) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    apiJson<InvestorClassification>('/investor-profile/classify', {
      method: 'POST',
      body: JSON.stringify({
        age,
        riskAppetite: value.riskAppetite,
        horizon: Number(value.horizon),
        monthlyInvestment: Number(value.monthlyInvestment) || 0,
        goal: value.goal,
      }),
    })
      .then((c) => {
        if (!cancelled) setPreview(c);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value.goal, value.riskAppetite, value.horizon, value.monthlyInvestment, age]);

  const monthly = Number(value.monthlyInvestment) || 0;
  const monthlyIncome = annualIncome ? annualIncome / 12 : 0;
  const investmentRate = monthlyIncome > 0 && monthly > 0 ? Math.round((monthly / monthlyIncome) * 100) : null;
  const accent = preview ? TYPE_ACCENTS[preview.type] : TYPE_ACCENTS.Balanced;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Primary goal */}
      <div>
        <label className="text-sm font-medium block mb-3" style={{ color: 'var(--text-secondary)' }}>
          Primary Investment Goal
        </label>
        <div className="space-y-2">
          {GOAL_OPTIONS.map((g) => {
            const isSelected = value.goal === g.value;
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => onChange({ goal: g.value })}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150"
                style={{
                  background: isSelected ? 'var(--accent-dim)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSelected ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                  cursor: 'pointer',
                }}
              >
                <span className="text-lg flex-shrink-0">{g.emoji}</span>
                <div className="flex-1">
                  <p
                    className="text-sm font-medium"
                    style={{ color: isSelected ? 'var(--accent)' : 'var(--foreground)', margin: 0 }}
                  >
                    {g.label}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)', margin: 0 }}>
                    {g.desc}
                  </p>
                </div>
                {isSelected && (
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--accent)' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Risk appetite */}
      <div>
        <label className="text-sm font-medium block mb-3" style={{ color: 'var(--text-secondary)' }}>
          Risk Appetite
        </label>
        <div className="grid grid-cols-3 gap-2">
          {RISK_OPTIONS.map((r) => {
            const isSelected = value.riskAppetite === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => onChange({ riskAppetite: r.value })}
                className="flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl transition-all duration-150"
                style={{
                  background: isSelected ? 'var(--accent-dim)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSelected ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                  cursor: 'pointer',
                }}
              >
                <span className="text-xl">{r.emoji}</span>
                <p
                  className="text-xs font-semibold"
                  style={{ color: isSelected ? 'var(--accent)' : 'var(--foreground)', margin: 0 }}
                >
                  {r.label}
                </p>
                <p className="text-xs text-center leading-tight" style={{ color: 'var(--muted)', margin: 0 }}>
                  {r.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Horizon + budget */}
      <div className="form-grid-2">
        <div>
          <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
            Investment Horizon (years)
          </label>
          <input
            type="number"
            min={1}
            className="form-input"
            value={value.horizon}
            onChange={(e) => onChange({ horizon: e.target.value })}
            placeholder="e.g. 10"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
            Monthly Investment Budget (₹)
          </label>
          <input
            type="number"
            min={0}
            className="form-input"
            value={value.monthlyInvestment}
            onChange={(e) => onChange({ monthlyInvestment: e.target.value })}
            placeholder="e.g. 15000"
          />
          {investmentRate !== null && (
            <div
              className="mt-2 px-3 py-2 rounded-lg text-xs font-medium"
              style={{
                background: investmentRate >= 20 ? 'var(--accent-dim)' : 'rgba(245,158,11,0.1)',
                color: investmentRate >= 20 ? 'var(--accent)' : 'var(--warning)',
                border: `1px solid ${investmentRate >= 20 ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
              }}
            >
              Investing {investmentRate}% of income
              {investmentRate >= 20 ? ' — excellent, Buffett-approved.' : ' — Buffett recommends at least 20%'}
            </div>
          )}
        </div>
      </div>

      {/* Live classification */}
      {preview && (
        <div className="rounded-xl p-5" style={{ background: accent.bg, border: `1px solid ${accent.border}` }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{preview.icon}</span>
            <div>
              <p
                className="text-xs font-medium uppercase tracking-wider mb-0.5"
                style={{ color: accent.color, margin: 0 }}
              >
                You are a
              </p>
              <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)', margin: 0 }}>
                {preview.type} Investor
              </h3>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)', margin: 0 }}>
            {preview.desc}
          </p>

          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--muted)', margin: '0 0 0.5rem' }}
            >
              Recommended Allocation
            </p>
            <div
              className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-2"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div style={{ width: `${preview.allocation.equity}%`, background: '#22C55E', borderRadius: '99px' }} />
              <div style={{ width: `${preview.allocation.debt}%`, background: '#A1A1AA', borderRadius: '99px' }} />
              <div style={{ width: `${preview.allocation.gold}%`, background: '#D4AF37', borderRadius: '99px' }} />
            </div>
            <div className="flex gap-4 text-xs">
              <span style={{ color: '#22C55E' }}>Equity {preview.allocation.equity}%</span>
              <span style={{ color: '#A1A1AA' }}>Debt {preview.allocation.debt}%</span>
              <span style={{ color: '#D4AF37' }}>Gold {preview.allocation.gold}%</span>
            </div>
          </div>

          {monthly > 0 && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--muted)', margin: '0 0 0.75rem' }}
              >
                Monthly ₹{monthly.toLocaleString('en-IN')} split
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Equity', pct: preview.allocation.equity, color: '#22C55E' },
                  { label: 'Debt/FD', pct: preview.allocation.debt, color: '#A1A1AA' },
                  { label: 'Gold/SGB', pct: preview.allocation.gold, color: '#D4AF37' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                      <span className="text-xs" style={{ color: 'var(--foreground)' }}>
                        {row.label}
                      </span>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                      ₹{Math.round((monthly * row.pct) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className="mt-4 rounded-xl p-4"
            style={{ background: 'var(--gold-dim)', border: '1px solid rgba(212,175,55,0.15)' }}
          >
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--gold)', margin: '0 0 0.375rem' }}>
              Buffett says for {preview.type} investors:
            </p>
            <p className="text-sm italic" style={{ color: 'var(--foreground)', margin: 0 }}>
              &ldquo;{preview.buffettAdvice}&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
