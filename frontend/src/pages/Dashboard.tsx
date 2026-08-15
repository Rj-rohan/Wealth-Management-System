import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { apiJson } from '../services/api';
import AppShell from '../components/AppShell';
import ScoreGauge from '../components/ScoreGauge';
import NetWorthChart from '../components/NetWorthChart';
import InvestorSnapshotCard from '../components/InvestorSnapshotCard';
import InvestmentToolsGrid from '../components/InvestmentToolsGrid';
import { formatCurrency } from '../utils/formatters';



const PILLAR_LABELS: Record<string, string> = {
  score_emergency_fund: '🚨 Emergency Fund (20 pts)',
  score_debt_mgmt: '💳 Debt Management (20 pts)',
  score_savings_rate: '📈 Savings Rate (15 pts)',
  score_portfolio_drift: '⚖️ Portfolio Drift (15 pts)',
  score_retirement_readiness: '🏖️ Retirement (15 pts)',
  score_insurance_protection: '🛡️ Insurance (10 pts)',
  score_estate_planning: '📜 Estate Plan (5 pts)'
};

function stripMarkdownText(text: string): string {
  if (!text) return '';
  return text
    .replace(/##\s*Summary/gi, '')
    .replace(/##\s*Recommendation/gi, '')
    .replace(/##\s*Explanation/gi, '')
    .replace(/##\s*Action Plan/gi, '')
    .replace(/##\s*Sources/gi, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    user, whs, goals, recommendations, netWorthHistory, isLoadingDashboard,
    fetchDashboardData, dismissRecommendation,
    currency, toggleChat, sendChatMessage,
  } = useAppStore();

  const [explainers, setExplainers] = useState<Record<string, any>>({});
  const [selectedRecIdModal, setSelectedRecIdModal] = useState<string | null>(null);

  const handleExplain = async (recId: string) => {
    if (explainers[recId]) return;
    setExplainers(prev => ({ ...prev, [recId]: 'loading' }));
    try {
      const data = await apiJson(`/users/${user!.id}/recommendations/${recId}/explain`);
      setExplainers(prev => ({ ...prev, [recId]: data }));
    } catch (e) {
      setExplainers(prev => ({ ...prev, [recId]: null }));
    }
  };

  useEffect(() => {
    if (user) fetchDashboardData(user.id);
  }, [user?.id]);

  if (!user) return null;
  if (isLoadingDashboard) {
    return (
      <AppShell pageTitle="Dashboard">
        <div className="page-state">
          <div className="spinner" />
          <p>Loading your wealth profile...</p>
        </div>
      </AppShell>
    );
  }

  const currentNetWorth = netWorthHistory.length > 0 ? netWorthHistory[netWorthHistory.length - 1].net_worth : 0;
  const activeRecs = recommendations.filter(r => r.status === 'Active');


  return (
    <AppShell pageTitle="Dashboard" pageSubtitle="Your complete financial picture">
      <div className="px-6 py-6 max-w-6xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Investing style, budget split and quick stats */}
        <InvestorSnapshotCard />

        <>
          {/* Row 1: WHS + Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 280px) 1fr', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <h3 style={{ margin: '0 0 1rem', alignSelf: 'flex-start', fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wealth Health Score</h3>
              {whs && <ScoreGauge score={whs.score} category={whs.category} />}
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem', marginBottom: 0 }}>
                Edelman 7-Pillar Methodology
              </p>
            </div>

            <div className="glass-panel">
              <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Financial Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Net Worth', value: formatCurrency(currentNetWorth, currency), color: currentNetWorth >= 0 ? 'var(--status-healthy)' : '#e63946' },
                  { label: 'Savings Rate', value: `${whs?.savings_rate ?? 0}%`, color: (whs?.savings_rate ?? 0) >= 15 ? 'var(--status-healthy)' : 'var(--status-caution)' },
                  { label: 'Emergency Fund', value: `${whs?.emergency_fund_coverage ?? 0}mo`, color: (whs?.emergency_fund_coverage ?? 0) >= 6 ? 'var(--status-healthy)' : 'var(--status-caution)' },
                  { label: 'Retirement Ready', value: `${whs?.retirement_readiness ?? 0}%`, color: (whs?.retirement_readiness ?? 0) >= 70 ? 'var(--status-healthy)' : '#e63946' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color }}>{value}</div>
                  </div>
                ))}
              </div>
              {netWorthHistory.length > 0 && <NetWorthChart data={netWorthHistory} />}
            </div>
          </div>

          {/* Row 2: Pillar Breakdown */}
          {whs && (
            <div className="glass-panel">
              <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>7-Pillar Breakdown</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
                {Object.entries(PILLAR_LABELS).map(([key, label]) => {
                  const score = (whs as any)[key] ?? 0;
                  const color = score >= 70 ? 'var(--status-healthy)' : score >= 40 ? 'var(--status-caution)' : '#e63946';
                  return (
                    <div key={key} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.875rem', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>{label}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{score}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>/100</div>
                      <div style={{ marginTop: '0.5rem', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: `${Math.max(0, Math.min(100, Number(score)))}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Row 3: Goals + Recommendations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goal Progress</h3>
                <button onClick={() => navigate('/planning/goals')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                  View All →
                </button>
              </div>
              {goals.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>No goals yet. Complete the Goals section to track progress.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {goals.slice(0, 4).map(goal => {
                    const fundedPct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.already_saved / goal.target_amount) * 100)) : 0;
                    return (
                      <div key={goal.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.875rem', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{goal.name}</span>
                          <span style={{ fontSize: '0.75rem', color: goal.shortfall > 0 ? 'var(--status-caution)' : 'var(--status-healthy)' }}>
                            {goal.shortfall > 0 ? `${formatCurrency(goal.shortfall, currency)} gap` : '✓ On Track'}
                          </span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                          <div style={{ width: `${fundedPct}%`, height: '100%', background: goal.shortfall > 0 ? 'var(--status-caution)' : 'var(--status-healthy)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          <span>{fundedPct}% funded</span>
                          <span>Target: {goal.target_year}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Priority Actions
                  {activeRecs.length > 0 && (
                    <span style={{ marginLeft: '0.5rem', background: '#ef4444', color: '#fff', fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '12px', fontWeight: 800 }}>
                      {activeRecs.length}
                    </span>
                  )}
                </h3>
              </div>
              {activeRecs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#94a3b8' }}>
                  <div style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>✅</div>
                  <p style={{ margin: 0, fontWeight: 600 }}>All actions resolved!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '520px', overflowY: 'auto' }}>
                  {activeRecs.map(rec => {
                    const isCritical = rec.priority === 'Critical' || rec.priority === 'High';
                    const badgeBg = isCritical ? 'rgba(239, 68, 68, 0.18)' : rec.priority === 'Medium' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.18)';
                    const badgeColor = isCritical ? '#f87171' : rec.priority === 'Medium' ? '#fbbf24' : '#34d399';
                    const borderColor = isCritical ? 'rgba(239, 68, 68, 0.35)' : rec.priority === 'Medium' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)';

                    return (
                      <div 
                        key={rec.id} 
                        style={{
                          background: 'rgba(15, 23, 42, 0.65)', padding: '1.1rem', borderRadius: '12px',
                          border: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', gap: '0.75rem',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)', transition: 'transform 0.2s ease',
                        }}
                      >
                        {/* Header: Severity & Category */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{
                              fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px',
                              background: badgeBg, color: badgeColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
                            }}>
                              {rec.priority}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.55rem', borderRadius: '8px' }}>
                              {rec.category}
                            </span>
                          </div>
                        </div>

                        {/* Title / Issue Summary */}
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.45 }}>
                          {rec.alert_message}
                        </div>

                        {/* Action & Benefit */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem' }}>
                          {rec.action && (
                            <div style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
                              <span>↳</span> <span>{rec.action}</span>
                            </div>
                          )}
                          {rec.expected_benefit && (
                            <div style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
                              <span>✨</span> <span>{rec.expected_benefit}</span>
                            </div>
                          )}
                        </div>

                        {/* Card Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <button 
                            onClick={() => {
                              handleExplain(rec.id);
                              setSelectedRecIdModal(rec.id);
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem',
                              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff',
                              border: 'none', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600,
                              cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', transition: 'all 0.2s ease',
                            }}
                          >
                            <span>🤖</span> View AI Analysis
                          </button>

                          <button 
                            onClick={() => dismissRecommendation(rec.id)}
                            style={{
                              background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
                              color: '#94a3b8', padding: '0.4rem 0.75rem', borderRadius: '8px',
                              cursor: 'pointer', fontSize: '0.76rem', transition: 'all 0.2s ease',
                            }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>


        </>

        {/* Research & market tools */}
        <InvestmentToolsGrid />

      {/* AI Analysis Modal for Priority Action */}
      {selectedRecIdModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '1.5rem',
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: '20px', width: '100%', maxWidth: '640px', maxHeight: '85vh',
            display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.6rem', background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🤖</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
                      AI Priority Action Analysis
                    </h3>
                    {/* Urgency badge — only rendered when AI returns urgency */}
                    {explainers[selectedRecIdModal]?.explanation?.urgency && (
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem',
                        borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.06em',
                        background:
                          explainers[selectedRecIdModal].explanation.urgency === 'High' ? 'rgba(239,68,68,0.18)' :
                          explainers[selectedRecIdModal].explanation.urgency === 'Medium' ? 'rgba(245,158,11,0.18)' :
                          'rgba(16,185,129,0.18)',
                        color:
                          explainers[selectedRecIdModal].explanation.urgency === 'High' ? '#f87171' :
                          explainers[selectedRecIdModal].explanation.urgency === 'Medium' ? '#fbbf24' :
                          '#34d399',
                        border: `1px solid ${
                          explainers[selectedRecIdModal].explanation.urgency === 'High' ? 'rgba(239,68,68,0.35)' :
                          explainers[selectedRecIdModal].explanation.urgency === 'Medium' ? 'rgba(245,158,11,0.35)' :
                          'rgba(16,185,129,0.35)'
                        }`,
                      }}>
                        {explainers[selectedRecIdModal].explanation.urgency === 'High' ? '🔴' :
                         explainers[selectedRecIdModal].explanation.urgency === 'Medium' ? '🟡' : '🟢'}
                        {' '}{explainers[selectedRecIdModal].explanation.urgency}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedRecIdModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.6rem', overflowY: 'auto', flex: 1, color: '#e2e8f0', lineHeight: 1.6, fontSize: '0.9rem' }}>
              {explainers[selectedRecIdModal] === 'loading' ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', flexDirection: 'column', gap: '1rem', color: '#94a3b8' }}>
                  <div className="spinner" />
                  <p>Synthesizing financial reasoning & action steps...</p>
                </div>
              ) : explainers[selectedRecIdModal]?.explanation ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                  {/* Issue — always shown */}
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #f87171' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f87171', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      The Financial Issue
                    </div>
                    <p style={{ margin: 0, color: '#f1f5f9' }}>
                      {stripMarkdownText(explainers[selectedRecIdModal].explanation.issue)}
                    </p>
                  </div>

                  {/* Context — only rendered when present */}
                  {explainers[selectedRecIdModal].explanation.context && (
                    <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #818cf8' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#818cf8', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Why It Matters
                      </div>
                      <p style={{ margin: 0, color: '#c7d2fe' }}>
                        {stripMarkdownText(explainers[selectedRecIdModal].explanation.context)}
                      </p>
                    </div>
                  )}

                  {/* Action — only rendered when present; list if array, plain text if string */}
                  {explainers[selectedRecIdModal].explanation.action && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #34d399' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#34d399', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Recommended Actions
                      </div>
                      {Array.isArray(explainers[selectedRecIdModal].explanation.action) ? (
                        <ol style={{ margin: 0, paddingLeft: '1.2rem', color: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {explainers[selectedRecIdModal].explanation.action.map((step: string, i: number) => (
                            <li key={i} style={{ lineHeight: 1.5 }}>{stripMarkdownText(step)}</li>
                          ))}
                        </ol>
                      ) : (
                        <p style={{ margin: 0, color: '#f1f5f9' }}>
                          {stripMarkdownText(explainers[selectedRecIdModal].explanation.action)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Follow-up chips — only rendered when present; click opens AI chat pre-filled */}
                  {Array.isArray(explainers[selectedRecIdModal].explanation.follow_ups) &&
                   explainers[selectedRecIdModal].explanation.follow_ups.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                        Ask AI Advisor
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {explainers[selectedRecIdModal].explanation.follow_ups.map((q: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSelectedRecIdModal(null);
                              setTimeout(() => {
                                toggleChat();
                                sendChatMessage?.(q);
                              }, 200);
                            }}
                            style={{
                              padding: '0.4rem 0.85rem', background: 'rgba(99,102,241,0.12)',
                              border: '1px solid rgba(99,102,241,0.3)', borderRadius: '999px',
                              color: '#a5b4fc', fontSize: '0.78rem', cursor: 'pointer',
                              fontWeight: 500, transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.25)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.12)')}
                          >
                            💬 {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  Unable to load AI analysis. Please try again.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.6rem', background: 'rgba(15, 23, 42, 0.95)',
              borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                Advisory simulation only. Not financial advice.
              </span>
              <button
                onClick={() => setSelectedRecIdModal(null)}
                style={{
                  padding: '0.5rem 1.25rem', background: '#334155', color: '#fff',
                  border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}

