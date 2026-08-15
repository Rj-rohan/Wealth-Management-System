/**
 * Investor snapshot — investing style, monthly budget split and quick stats.
 *
 * This was the top of the markets product's home screen. It now opens the
 * unified dashboard, above the wealth health score, so a user sees both halves
 * of their financial picture in one place.
 */

import { Link } from 'react-router-dom';
import { useInvestorProfile } from '../context/InvestorProfileContext';

const TYPE_ACCENTS: Record<string, { color: string; bg: string; border: string }> = {
  Conservative: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  'Aggressive Growth': { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
  'Wealth Builder': { color: '#A855F7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.2)' },
  Balanced: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
};

export default function InvestorSnapshotCard() {
  const { profile, loaded } = useInvestorProfile();

  if (!loaded) return null;

  if (!profile) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: 'var(--gold-dim)', border: '1px solid rgba(212,175,55,0.2)' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)', margin: 0 }}>
            Set your investing style
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)', margin: 0 }}>
            Four questions unlock personalised screening thresholds, budget-aware suggestions and
            research filtered to your investor type.
          </p>
        </div>
        <Link
          to="/settings/investing-style"
          className="px-5 py-2 rounded-xl font-semibold text-sm no-underline whitespace-nowrap"
          style={{ background: 'var(--gold)', color: '#000' }}
        >
          Get started
        </Link>
      </div>
    );
  }

  const budget = profile.monthlyInvestment || 0;
  const equityBudget = Math.round((budget * profile.investor.allocation.equity) / 100);
  const debtBudget = Math.round((budget * profile.investor.allocation.debt) / 100);
  const goldBudget = Math.round((budget * profile.investor.allocation.gold) / 100);
  const accent = TYPE_ACCENTS[profile.investor.type] || TYPE_ACCENTS.Balanced;
  const existingPortfolio = Number(profile.existingPortfolio || 0);

  const quickStats = [
    { label: 'Investment Horizon', value: `${profile.horizon} yrs`, sub: 'time in market' },
    {
      label: 'Risk Level',
      value: profile.riskAppetite.charAt(0).toUpperCase() + profile.riskAppetite.slice(1),
      sub: 'appetite',
    },
    {
      label: 'Existing Portfolio',
      value: existingPortfolio > 0 ? `₹${(existingPortfolio / 100000).toFixed(1)}L` : '₹0',
      sub: 'at onboarding',
    },
    { label: 'Max P/E', value: `${profile.investor.maxStockPE}x`, sub: 'recommended' },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
            >
              {profile.investor.icon}
            </div>
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--muted)', margin: 0 }}>
                Welcome back
              </p>
              <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)', margin: 0 }}>
                {profile.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: accent.bg, color: accent.color, border: `1px solid ${accent.border}` }}
                >
                  {profile.investor.type}
                </span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  Age {profile.age}
                </span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  ·
                </span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {profile.goal} goal
                </span>
                <Link
                  to="/settings/investing-style"
                  className="text-xs no-underline"
                  style={{ color: 'var(--accent)' }}
                >
                  Edit
                </Link>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p
              className="text-xs font-medium uppercase tracking-wider mb-1"
              style={{ color: 'var(--muted)', margin: 0 }}
            >
              Monthly Budget
            </p>
            <p className="text-3xl font-bold" style={{ color: 'var(--foreground)', margin: 0 }}>
              ₹{Number(budget).toLocaleString('en-IN')}
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--accent)', margin: 0 }}>
              ₹{equityBudget.toLocaleString('en-IN')} equity
            </p>
          </div>
        </div>

        {/* Allocation bar */}
        <div className="mt-5">
          <p
            className="text-xs font-medium uppercase tracking-wider mb-2"
            style={{ color: 'var(--muted)', margin: '0 0 0.5rem' }}
          >
            Target Asset Allocation
          </p>
          <div
            className="flex h-2 rounded-full overflow-hidden gap-0.5"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div className="rounded-full" style={{ width: `${profile.investor.allocation.equity}%`, background: '#22C55E' }} />
            <div className="rounded-full" style={{ width: `${profile.investor.allocation.debt}%`, background: '#A1A1AA' }} />
            <div className="rounded-full" style={{ width: `${profile.investor.allocation.gold}%`, background: '#D4AF37' }} />
          </div>
          <div className="flex gap-5 mt-2 flex-wrap">
            {[
              { label: 'Equity', pct: profile.investor.allocation.equity, amount: equityBudget, color: '#22C55E' },
              { label: 'Debt', pct: profile.investor.allocation.debt, amount: debtBudget, color: '#A1A1AA' },
              { label: 'Gold', pct: profile.investor.allocation.gold, amount: goldBudget, color: '#D4AF37' },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {row.label} {row.pct}%
                </span>
                <span className="text-xs font-medium ml-1" style={{ color: 'var(--foreground)' }}>
                  ₹{row.amount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs italic" style={{ color: 'var(--muted)', margin: 0 }}>
            &ldquo;{profile.investor.buffettAdvice}&rdquo;{' '}
            <span style={{ color: 'var(--gold)' }}>— Warren Buffett</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickStats.map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted)', margin: '0 0 0.5rem' }}>
              {s.label}
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--foreground)', margin: 0 }}>
              {s.value}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)', margin: 0 }}>
              {s.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
