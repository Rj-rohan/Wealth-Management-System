/**
 * HoldingsView — Detailed table of portfolio holdings grouped by institution.
 * Shows asset class, value, and liquidity flag for each holding.
 */
import { PortfolioSummary } from '../types';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/formatters';

const CATEGORY_COLORS: Record<string, string> = {
  Stocks: '#6366f1', 'Mutual Funds': '#8b5cf6', Bonds: '#2ec4b6',
  Gold: '#f4a261', Cash: '#94a3b8', 'Real Estate': '#10b981',
  'Fixed Deposits': '#3b82f6', EPF: '#f59e0b', PPF: '#ec4899',
  NPS: '#06b6d4', Crypto: '#f97316', Other: '#64748b',
};
const getColor = (cat: string) => CATEGORY_COLORS[cat] ?? '#64748b';

interface Props {
  summary: PortfolioSummary;
}

export default function HoldingsView({ summary }: Props) {
  const { currency } = useAppStore();
  const { by_asset_class, by_institution, total_portfolio_value, holdings_count, account_count, institution_count } = summary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        {[
          { label: 'Holdings', value: holdings_count },
          { label: 'Accounts', value: account_count },
          { label: 'Institutions', value: institution_count },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.6rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.2rem' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* By Asset Class */}
      <div>
        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          By Asset Class
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {by_asset_class.map(item => (
            <div key={item.category} style={{
              display: 'grid', gridTemplateColumns: '24px 1fr 80px 60px 30px',
              gap: '0.5rem', alignItems: 'center',
              background: 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '0.5rem 0.75rem',
            }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: getColor(item.category) }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{item.category}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textAlign: 'right' }}>
                {formatCurrency(item.value, currency)}
              </span>
              <div style={{ position: 'relative', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  width: `${item.percentage}%`, background: getColor(item.category),
                  borderRadius: '3px', transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* By Institution */}
      <div>
        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          By Institution
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {by_institution.map(inst => {
            const pct = total_portfolio_value > 0 ? (inst.total_value / total_portfolio_value) * 100 : 0;
            return (
              <div key={inst.institution_id} style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', alignItems: 'center',
                background: 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '0.6rem 0.75rem',
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{inst.institution_name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    {inst.institution_type} · {inst.account_count} {inst.account_count === 1 ? 'account' : 'accounts'}
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{pct.toFixed(1)}%</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {formatCurrency(inst.total_value, currency)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: 0, opacity: 0.7 }}>{summary.disclaimer}</p>
    </div>
  );
}
