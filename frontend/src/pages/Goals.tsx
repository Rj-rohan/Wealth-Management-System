import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { apiFetch } from '../services/api';
import AppShell from '../components/AppShell';
import { Goal, AIGoalCoachMessage, GoalCoachExplanation, GoalChatContext } from '../types';
import { formatCurrency } from '../utils/formatters';

interface GoalOptions {
  goal_id: string;
  shortfall: number;
  option_a_required_monthly_savings: number;
  option_b_supported_present_cost: number;
  option_c_delay_months: number;
}

const CATEGORY_THEMES: Record<string, {
  bgGradient: string;
  borderColor: string;
  avatarBg: string;
  icon: string;
  accentColor: string;
  badgeBg: string;
  badgeColor: string;
  progressGradient: string;
}> = {
  Education: {
    bgGradient: 'linear-gradient(145deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
    borderColor: 'rgba(124, 58, 237, 0.35)',
    avatarBg: 'rgba(124, 58, 237, 0.25)',
    icon: '🎓',
    accentColor: '#a78bfa',
    badgeBg: 'rgba(124, 58, 237, 0.2)',
    badgeColor: '#c4b5fd',
    progressGradient: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
  },
  Purchase: {
    bgGradient: 'linear-gradient(145deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
    borderColor: 'rgba(124, 58, 237, 0.35)',
    avatarBg: 'rgba(124, 58, 237, 0.25)',
    icon: '🚗',
    accentColor: '#a78bfa',
    badgeBg: 'rgba(124, 58, 237, 0.2)',
    badgeColor: '#c4b5fd',
    progressGradient: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
  },
  Retirement: {
    bgGradient: 'linear-gradient(145deg, rgba(17, 94, 89, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)',
    borderColor: 'rgba(20, 184, 166, 0.35)',
    avatarBg: 'rgba(20, 184, 166, 0.25)',
    icon: '☂️',
    accentColor: '#2dd4bf',
    badgeBg: 'rgba(20, 184, 166, 0.2)',
    badgeColor: '#5eead4',
    progressGradient: 'linear-gradient(90deg, #0d9488 0%, #10b981 100%)',
  },
  'Emergency Fund': {
    bgGradient: 'linear-gradient(145deg, rgba(17, 94, 89, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)',
    borderColor: 'rgba(20, 184, 166, 0.35)',
    avatarBg: 'rgba(20, 184, 166, 0.25)',
    icon: '🛡️',
    accentColor: '#2dd4bf',
    badgeBg: 'rgba(20, 184, 166, 0.2)',
    badgeColor: '#5eead4',
    progressGradient: 'linear-gradient(90deg, #0d9488 0%, #10b981 100%)',
  },
  Default: {
    bgGradient: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    avatarBg: 'rgba(99, 102, 241, 0.2)',
    icon: '🎯',
    accentColor: '#818cf8',
    badgeBg: 'rgba(99, 102, 241, 0.2)',
    badgeColor: '#a5b4fc',
    progressGradient: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)',
  }
};

const PRIORITY_BADGES: Record<string, { bg: string; color: string; label: string }> = {
  High: { bg: 'rgba(225, 29, 72, 0.2)', color: '#f43f5e', label: 'HIGH PRIORITY' },
  Medium: { bg: 'rgba(217, 119, 6, 0.2)', color: '#fbbf24', label: 'MEDIUM PRIORITY' },
  Low: { bg: 'rgba(16, 185, 129, 0.2)', color: '#34d399', label: 'LOW PRIORITY' },
};

// Situation badge config for AI Coach adaptive display
const SITUATION_CHIPS: Record<string, { bg: string; color: string; label: string; icon: string }> = {
  fully_funded:    { bg: 'rgba(16, 185, 129, 0.18)', color: '#34d399', label: 'Fully Funded',    icon: '✓' },
  on_track:        { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', label: 'On Track',        icon: '✓' },
  small_shortfall: { bg: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', label: 'Gap',             icon: '⚠' },
  large_shortfall: { bg: 'rgba(239, 68, 68, 0.18)',  color: '#f87171', label: 'Critical Gap',   icon: '⚠' },
  missing_data:    { bg: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8', label: 'Data Missing',    icon: '?' },
};

export default function Goals() {
  const { user, currency, openChatWithGoalContext } = useAppStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [options, setOptions] = useState<Record<string, GoalOptions>>({});
  const [coachMessages, setCoachMessages] = useState<Record<string, AIGoalCoachMessage>>({});
  const [loading, setLoading] = useState(true);
  const [selectedGoalIdModal, setSelectedGoalIdModal] = useState<string | null>(null);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [newGoalForm, setNewGoalForm] = useState({
    name: '',
    category: 'Purchase',
    priority: 'Medium',
    target_amount: '',
    target_year: (new Date().getFullYear() + 5).toString(),
    already_saved: '',
    monthly_contribution: ''
  });
  const [submittingGoal, setSubmittingGoal] = useState(false);
  const [openMenuGoalId, setOpenMenuGoalId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuGoalId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGoalForm.name || !newGoalForm.target_amount || !newGoalForm.target_year) return;

    setSubmittingGoal(true);
    try {
      const res = await apiFetch(`/users/${user.id}/goals`, {
        method: 'POST',
        body: JSON.stringify({
          name: newGoalForm.name,
          category: newGoalForm.category,
          priority: newGoalForm.priority,
          target_amount: Number(newGoalForm.target_amount),
          target_year: Number(newGoalForm.target_year),
          already_saved: Number(newGoalForm.already_saved || 0),
          monthly_contribution: Number(newGoalForm.monthly_contribution || 0),
        })
      });

      if (!res.ok) throw new Error('Failed to create goal');
      const createdGoal: Goal = await res.json();

      setGoals(prev => [createdGoal, ...prev]);
      setIsAddGoalModalOpen(false);
      setNewGoalForm({
        name: '',
        category: 'Purchase',
        priority: 'Medium',
        target_amount: '',
        target_year: (new Date().getFullYear() + 5).toString(),
        already_saved: '',
        monthly_contribution: ''
      });

      // Fetch Edelman options only when there's a shortfall
      if (createdGoal.shortfall > 0) {
        apiFetch(`/users/${user.id}/goals/${createdGoal.id}/options`)
          .then(r => r.ok ? r.json() : null)
          .then(opt => {
            if (opt) setOptions(prev => ({ ...prev, [createdGoal.id]: opt }));
          });
      }
      // Always fetch coach — includes optimization for on-track goals
      apiFetch(`/users/${user.id}/goals/${createdGoal.id}/coach`)
        .then(r => r.ok ? r.json() : null)
        .then(msg => {
          if (msg) setCoachMessages(prev => ({ ...prev, [createdGoal.id]: msg }));
        });
    } catch (err) {
      console.error('Error creating goal:', err);
    } finally {
      setSubmittingGoal(false);
    }
  };

  const handleDeleteGoal = async (goalId: string, goalName: string) => {
    if (!user) return;
    if (!window.confirm(`Are you sure you want to delete "${goalName}"?`)) return;

    try {
      const res = await apiFetch(`/users/${user.id}/goals/${goalId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete goal');
      setGoals(prev => prev.filter(g => g.id !== goalId));
      setOptions(prev => {
        const next = { ...prev };
        delete next[goalId];
        return next;
      });
      setCoachMessages(prev => {
        const next = { ...prev };
        delete next[goalId];
        return next;
      });
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingGoal) return;

    setSubmittingEdit(true);
    try {
      const res = await apiFetch(`/users/${user.id}/goals/${editingGoal.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingGoal.name,
          category: editingGoal.category,
          priority: editingGoal.priority,
          target_amount: Number(editingGoal.target_amount),
          target_year: Number(editingGoal.target_year),
          already_saved: Number(editingGoal.already_saved || 0),
          monthly_contribution: Number(editingGoal.monthly_contribution || 0),
        })
      });

      if (!res.ok) throw new Error('Failed to update goal');
      const updatedGoal: Goal = await res.json();

      setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
      setEditingGoal(null);

      // Refresh Edelman options only when there's a shortfall
      if (updatedGoal.shortfall > 0) {
        apiFetch(`/users/${user.id}/goals/${updatedGoal.id}/options`)
          .then(r => r.ok ? r.json() : null)
          .then(opt => {
            if (opt) setOptions(prev => ({ ...prev, [updatedGoal.id]: opt }));
          });
      } else {
        // Clear stale options if goal is now on track
        setOptions(prev => {
          const next = { ...prev };
          delete next[updatedGoal.id];
          return next;
        });
      }
      // Always refresh coach for updated goal
      apiFetch(`/users/${user.id}/goals/${updatedGoal.id}/coach`)
        .then(r => r.ok ? r.json() : null)
        .then(msg => {
          if (msg) setCoachMessages(prev => ({ ...prev, [updatedGoal.id]: msg }));
        });
    } catch (err) {
      console.error('Error updating goal:', err);
    } finally {
      setSubmittingEdit(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    apiFetch(`/users/${user.id}/goals`)
      .then(res => res.json())
      .then(data => {
        const goalList = Array.isArray(data) ? data : [];
        setGoals(goalList);
        setLoading(false);

        goalList.forEach((g: Goal) => {
          // Fetch options only when there's a shortfall to solve
          if (g.shortfall > 0) {
            apiFetch(`/users/${user.id}/goals/${g.id}/options`)
              .then(r => r.ok ? r.json() : null)
              .then(opt => {
                if (opt) setOptions(prev => ({ ...prev, [g.id]: opt }));
              });
          }
          // Always fetch coach — includes optimization tips for on-track/fully-funded goals
          apiFetch(`/users/${user.id}/goals/${g.id}/coach`)
            .then(r => r.ok ? r.json() : null)
            .then(msg => {
              if (msg) setCoachMessages(prev => ({ ...prev, [g.id]: msg }));
            });
        });
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user]);

  if (!user) return null;
  if (loading) {
    return (
      <AppShell pageTitle="Goals & Retirement">
        <div className="page-state">
          <div className="spinner" />
          <p>Loading your financial goals dashboard...</p>
        </div>
      </AppShell>
    );
  }

  const activeModalGoal = goals.find(g => g.id === selectedGoalIdModal);
  const activeModalCoachMsg = selectedGoalIdModal ? coachMessages[selectedGoalIdModal] : null;

  return (
    <AppShell pageTitle="Goals & Retirement" pageSubtitle="Funding progress, gap solving and retirement coaching">
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem 1.5rem 3rem' }}>
      {/* Top Navigation / Dashboard Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.4rem', fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Financial Goals
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>
            Each goal includes Edelman Solver options to close any funding gap.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{
            display: 'flex', gap: '0.85rem', alignItems: 'center', padding: '0.45rem 0.9rem',
            background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', fontSize: '0.82rem',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34d399', fontWeight: 600 }}>
              <span>✓</span> {goals.filter(g => g.shortfall <= 0).length} on track
            </span>
            <span style={{ color: '#475569' }}>|</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fbbf24', fontWeight: 600 }}>
              <span>⚠️</span> {goals.filter(g => g.shortfall > 0).length} with shortfall
            </span>
          </div>

          <button 
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff',
              border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '0.88rem',
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)', transition: 'transform 0.2s ease',
            }}
            onClick={() => setIsAddGoalModalOpen(true)}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> Add New Goal
          </button>
        </div>
      </div>

      {/* Responsive Grid Styles */}
      <style>{`
        .goals-responsive-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.75rem;
          width: 100%;
        }
        @media (max-width: 900px) {
          .goals-responsive-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Grid Layout of Themed Goal Cards */}
      <div className="goals-responsive-grid">
        {goals.map(goal => {
          const theme = CATEGORY_THEMES[goal.category] || CATEGORY_THEMES.Default;
          const priority = PRIORITY_BADGES[goal.priority] || PRIORITY_BADGES.Medium;
          const opt = options[goal.id];
          const fundedPct = goal.target_amount > 0
            ? Math.min(100, Math.round((goal.already_saved / goal.target_amount) * 100)) : 0;

          const coachExplanation: GoalCoachExplanation | undefined = coachMessages[goal.id]?.explanation;
          const coachSummary = coachExplanation?.summary || '';
          const coachSituation = coachExplanation?.situation;
          const situationChip = coachSituation ? SITUATION_CHIPS[coachSituation] : null;
          const previewText = coachSummary.length > 180 ? coachSummary.slice(0, 180) + '…' : coachSummary;

          return (
            <div 
              key={goal.id} 
              style={{
                background: theme.bgGradient,
                border: `1px solid ${theme.borderColor}`,
                borderRadius: '16px',
                padding: '1.6rem',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Card Header & Avatar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '50%',
                    background: theme.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem', border: `1px solid ${theme.borderColor}`,
                  }}>
                    {theme.icon}
                  </div>

                  <div>
                    <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                      {goal.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '12px',
                        background: theme.badgeBg, color: theme.badgeColor, fontWeight: 600,
                      }}>
                        {goal.category}
                      </span>
                      <span style={{
                        fontSize: '0.68rem', padding: '0.2rem 0.6rem', borderRadius: '12px',
                        background: priority.bg, color: priority.color, fontWeight: 700, letterSpacing: '0.04em',
                      }}>
                        {priority.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8', background: 'rgba(15,23,42,0.5)', padding: '0.25rem 0.65rem', borderRadius: '8px' }}>
                    Target: {goal.target_year}
                  </span>

                  {/* Three-Dot Menu */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuGoalId(openMenuGoalId === goal.id ? null : goal.id);
                      }}
                      title="Goal Actions"
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#94a3b8',
                        borderRadius: '8px',
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      ⋮
                    </button>

                    {openMenuGoalId === goal.id && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute', top: '115%', right: 0, zIndex: 100,
                          background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                          padding: '0.4rem', minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '0.2rem'
                        }}
                      >
                        <button
                          onClick={() => {
                            setOpenMenuGoalId(null);
                            setEditingGoal(goal);
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.5rem 0.8rem',
                            background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '0.84rem',
                            borderRadius: '6px', cursor: 'pointer', textAlign: 'left', width: '100%', fontWeight: 500
                          }}
                        >
                          <span>✏️</span> Edit Goal
                        </button>

                        <button
                          onClick={() => {
                            setOpenMenuGoalId(null);
                            handleDeleteGoal(goal.id, goal.name);
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.5rem 0.8rem',
                            background: 'rgba(225, 29, 72, 0.12)', border: 'none', color: '#f43f5e', fontSize: '0.84rem',
                            borderRadius: '6px', cursor: 'pointer', textAlign: 'left', width: '100%', fontWeight: 600
                          }}
                        >
                          <span>🗑️</span> Delete Goal
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>
                    {fundedPct}% <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94a3b8' }}>funded</span>
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#cbd5e1' }}>
                    {formatCurrency(goal.already_saved, currency)} <span style={{ color: '#64748b' }}>/ {formatCurrency(goal.target_amount, currency)}</span>
                  </span>
                </div>
                <div style={{ height: '8px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{
                    width: `${fundedPct}%`, height: '100%', borderRadius: '4px',
                    background: theme.progressGradient, boxShadow: `0 0 10px ${theme.accentColor}80`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>

              {/* Key Metric Tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{
                  background: 'rgba(15, 23, 42, 0.55)', padding: '0.9rem 1rem', borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.85rem',
                }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                    👛
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.15rem' }}>
                      Monthly Contribution
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                      {formatCurrency(goal.monthly_contribution, currency)}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(15, 23, 42, 0.55)', padding: '0.9rem 1rem', borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.85rem',
                }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                    🍰
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.15rem' }}>
                      Projected Shortfall
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: goal.shortfall > 0 ? '#f87171' : '#34d399' }}>
                      {goal.shortfall > 0 ? formatCurrency(goal.shortfall, currency) : '✓ Fully Funded'}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Goal Coach Card — adaptive summary + situation chip */}
              {coachSummary && (
                <div style={{
                  marginBottom: '1.25rem', padding: '1.1rem', borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.65)', border: `1px solid ${theme.borderColor}`,
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>🤖</span>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: theme.accentColor }}>
                        AI Goal Coach
                      </span>
                      {situationChip && (
                        <span style={{
                          fontSize: '0.68rem', padding: '0.18rem 0.55rem', borderRadius: '10px',
                          background: situationChip.bg, color: situationChip.color, fontWeight: 700, letterSpacing: '0.03em',
                        }}>
                          {situationChip.icon} {situationChip.label}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedGoalIdModal(goal.id)}
                      style={{
                        background: 'transparent', border: 'none', color: theme.accentColor,
                        fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
                      }}
                    >
                      Full Strategy &rarr;
                    </button>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.55 }}>
                    {previewText}
                  </p>
                </div>
              )}

              {/* Edelman Solver Options */}
              {opt && (
                <div style={{
                  marginTop: 'auto', padding: '1.1rem', borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', flexDirection: 'column', gap: '0.85rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.88rem', color: '#38bdf8' }}>
                    <span>⚡</span> Edelman Solver Options
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {/* Option A */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.65rem 0.85rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.84rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0' }}>
                        <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>↑</span>
                        <span>Increase savings to <strong style={{ color: '#fff' }}>{formatCurrency(opt.option_a_required_monthly_savings, currency)}/mo</strong></span>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                        +{formatCurrency(Math.max(0, opt.option_a_required_monthly_savings - goal.monthly_contribution), currency)}
                      </span>
                    </div>

                    {/* Option B */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.84rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0' }}>
                        <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>↓</span>
                        <span>Reduce target to <strong style={{ color: '#fff' }}>{formatCurrency(opt.option_b_supported_present_cost, currency)}</strong></span>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                        -{formatCurrency(goal.shortfall, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Goal Coach — Adaptive Strategy Modal */}
      {selectedGoalIdModal && activeModalGoal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.78)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '1.5rem',
        }}>
          <div style={{
            background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: '20px', width: '100%', maxWidth: '700px', maxHeight: '88vh',
            display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            {(() => {
              const modalTheme = CATEGORY_THEMES[activeModalGoal.category] || CATEGORY_THEMES.Default;
              const modalExpl: GoalCoachExplanation | undefined = activeModalCoachMsg?.explanation;
              const modalSit = modalExpl?.situation;
              const modalSitChip = modalSit ? SITUATION_CHIPS[modalSit] : null;

              return (
                <>
                  <div style={{
                    padding: '1.3rem 1.7rem',
                    background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '12px',
                        background: modalTheme.avatarBg, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '1.3rem', border: `1px solid ${modalTheme.borderColor}`,
                      }}>
                        {modalTheme.icon}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>
                          {activeModalGoal.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>AI Goal Coach</span>
                          {modalSitChip && (
                            <span style={{
                              fontSize: '0.68rem', padding: '0.18rem 0.55rem', borderRadius: '10px',
                              background: modalSitChip.bg, color: modalSitChip.color, fontWeight: 700, letterSpacing: '0.03em',
                            }}>
                              {modalSitChip.icon} {modalSitChip.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedGoalIdModal(null)}
                      style={{
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8', fontSize: '1.15rem', cursor: 'pointer', lineHeight: 1,
                        width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Body — Adaptive Sections */}
                  <div style={{ padding: '1.6rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!modalExpl ? (
                      <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 1rem' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading AI Goal Coach strategy…</p>
                      </div>
                    ) : (
                      <>
                        {/* Section A: Situation Banner — always shown */}
                        <div style={{
                          padding: '1rem 1.1rem', borderRadius: '12px',
                          background: modalSitChip ? `${modalSitChip.bg}` : 'rgba(99,102,241,0.1)',
                          border: `1px solid ${modalSitChip?.color ? modalSitChip.color + '30' : 'rgba(99,102,241,0.2)'}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.1rem' }}>🤖</span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: modalSitChip?.color || '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {modalSitChip?.label || 'Goal Status'}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                            {modalExpl.summary}
                          </p>
                        </div>

                        {/* Section B: Why It Matters — only if context */}
                        {modalExpl.context && (
                          <div style={{
                            padding: '1rem 1.1rem', borderRadius: '12px',
                            background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.07)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '1rem' }}>💡</span>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Why It Matters</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.65 }}>{modalExpl.context}</p>
                          </div>
                        )}

                        {/* Section C: Strategies — only if strategies[] present */}
                        {modalExpl.strategies && modalExpl.strategies.length > 0 && (
                          <div style={{
                            padding: '1rem 1.1rem', borderRadius: '12px',
                            background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.07)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                              <span style={{ fontSize: '1rem' }}>⚡</span>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Strategies</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                              {modalExpl.strategies.map((s, i) => (
                                <div key={i} style={{
                                  display: 'flex', gap: '0.75rem', padding: '0.75rem 0.9rem', borderRadius: '10px',
                                  background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99,102,241,0.18)',
                                }}>
                                  <span style={{
                                    minWidth: '22px', height: '22px', borderRadius: '50%', background: 'rgba(99,102,241,0.25)',
                                    color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.72rem', fontWeight: 800, flexShrink: 0, marginTop: '1px',
                                  }}>{i + 1}</span>
                                  <span style={{ fontSize: '0.875rem', color: '#e2e8f0', lineHeight: 1.6 }}>{s}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Section D: Trade-offs — only for large_shortfall */}
                        {modalExpl.tradeoffs && modalExpl.tradeoffs.length > 0 && (
                          <div style={{
                            padding: '1rem 1.1rem', borderRadius: '12px',
                            background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245,158,11,0.18)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
                              <span style={{ fontSize: '1rem' }}>⚖️</span>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trade-offs</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {modalExpl.tradeoffs.map((t, i) => (
                                <div key={i} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                                  <span style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }}>›</span>
                                  <span>{t}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Section E: Next Action — CTA block */}
                        {modalExpl.action && (
                          <div style={{
                            padding: '1rem 1.1rem', borderRadius: '12px',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(79,70,229,0.1) 100%)',
                            border: '1px solid rgba(99,102,241,0.3)',
                            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                          }}>
                            <span style={{
                              minWidth: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99,102,241,0.3)',
                              color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '1rem', flexShrink: 0,
                            }}>→</span>
                            <div>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Next Action</div>
                              <p style={{ margin: 0, fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.6, fontWeight: 500 }}>{modalExpl.action}</p>
                            </div>
                          </div>
                        )}

                        {/* Section F: Optimization Tips — for on_track / fully_funded */}
                        {modalExpl.optimization && (
                          <div style={{
                            padding: '1rem 1.1rem', borderRadius: '12px',
                            background: 'rgba(16, 185, 129, 0.07)', border: '1px solid rgba(16,185,129,0.22)',
                            display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                          }}>
                            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>✨</span>
                            <div>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Optimization</div>
                              <p style={{ margin: 0, fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.65 }}>{modalExpl.optimization}</p>
                            </div>
                          </div>
                        )}

                        {/* Section G: Missing Data Notice */}
                        {modalExpl.missing && modalExpl.missing.length > 0 && (
                          <div style={{
                            padding: '1rem 1.1rem', borderRadius: '12px',
                            background: 'rgba(100, 116, 139, 0.1)', border: '1px solid rgba(100,116,139,0.25)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.6rem' }}>
                              <span style={{ fontSize: '1rem' }}>📋</span>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Data Needed</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {modalExpl.missing.map((m, i) => (
                                <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.55 }}>
                                  <span style={{ color: '#64748b', flexShrink: 0 }}>•</span>
                                  <span>{m}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div style={{
                    padding: '0.9rem 1.7rem',
                    background: 'rgba(15, 23, 42, 0.95)',
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic' }}>
                      Advisory simulation only. Not financial advice.
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        onClick={() => {
                          const gOpt = options[activeModalGoal.id];
                          const coachExpl = activeModalCoachMsg?.explanation;
                          const ctx: GoalChatContext = {
                            goalId: activeModalGoal.id,
                            goalName: activeModalGoal.name,
                            category: activeModalGoal.category,
                            targetAmount: activeModalGoal.target_amount,
                            targetYear: activeModalGoal.target_year,
                            alreadySaved: activeModalGoal.already_saved,
                            monthlyContribution: activeModalGoal.monthly_contribution,
                            shortfall: activeModalGoal.shortfall,
                            fundedPercentage: activeModalGoal.target_amount > 0 
                              ? Math.min(100, Math.round((activeModalGoal.already_saved / activeModalGoal.target_amount) * 100))
                              : 0,
                            situation: coachExpl?.situation,
                            optionA_monthlySavings: gOpt?.option_a_required_monthly_savings,
                            optionB_presentCost: gOpt?.option_b_supported_present_cost,
                            optionC_delayMonths: gOpt?.option_c_delay_months,
                            coachSummary: coachExpl?.summary,
                          };
                          openChatWithGoalContext(ctx);
                          setSelectedGoalIdModal(null);
                        }}
                        style={{
                          padding: '0.5rem 1.1rem',
                          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                          transition: 'transform 0.15s ease',
                        }}
                      >
                        <span>💬</span> Continue in AI Chat
                      </button>

                      <button
                        onClick={() => setSelectedGoalIdModal(null)}
                        style={{
                          padding: '0.5rem 1.2rem', background: 'rgba(51,65,85,0.9)',
                          color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer',
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ─── ADD NEW GOAL MODAL ──────────────────────────────────────────────── */}
      {isAddGoalModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1.5rem'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '16px',
            width: '100%', maxWidth: '540px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🎯</span>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem', fontWeight: 700 }}>
                  Add New Financial Goal
                </h3>
              </div>
              <button 
                onClick={() => setIsAddGoalModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateGoal} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                  GOAL NAME *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Dream Vacation, Home Down Payment"
                  value={newGoalForm.name}
                  onChange={e => setNewGoalForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%', padding: '0.65rem 0.9rem', background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                    CATEGORY
                  </label>
                  <select 
                    value={newGoalForm.category}
                    onChange={e => setNewGoalForm(prev => ({ ...prev, category: e.target.value }))}
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', background: 'rgba(15,23,42,0.9)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', outline: 'none'
                    }}
                  >
                    <option value="Education">Education 🎓</option>
                    <option value="Retirement">Retirement ☂️</option>
                    <option value="Purchase">Purchase 🚗</option>
                    <option value="Emergency Fund">Emergency Fund 🛡️</option>
                    <option value="Other">Other 🎯</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                    PRIORITY
                  </label>
                  <select 
                    value={newGoalForm.priority}
                    onChange={e => setNewGoalForm(prev => ({ ...prev, priority: e.target.value }))}
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', background: 'rgba(15,23,42,0.9)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', outline: 'none'
                    }}
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                    TARGET AMOUNT ({currency === 'INR' ? '₹' : '$'}) *
                  </label>
                  <input 
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 500000"
                    value={newGoalForm.target_amount}
                    onChange={e => setNewGoalForm(prev => ({ ...prev, target_amount: e.target.value }))}
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                    TARGET YEAR *
                  </label>
                  <input 
                    type="number"
                    required
                    min={new Date().getFullYear()}
                    max={2100}
                    placeholder="2032"
                    value={newGoalForm.target_year}
                    onChange={e => setNewGoalForm(prev => ({ ...prev, target_year: e.target.value }))}
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                    ALREADY SAVED ({currency === 'INR' ? '₹' : '$'})
                  </label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="e.g. 50000"
                    value={newGoalForm.already_saved}
                    onChange={e => setNewGoalForm(prev => ({ ...prev, already_saved: e.target.value }))}
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                    MONTHLY SAVINGS ({currency === 'INR' ? '₹' : '$'})
                  </label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="e.g. 3000"
                    value={newGoalForm.monthly_contribution}
                    onChange={e => setNewGoalForm(prev => ({ ...prev, monthly_contribution: e.target.value }))}
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.8rem' }}>
                <button 
                  type="button"
                  onClick={() => setIsAddGoalModalOpen(false)}
                  style={{
                    padding: '0.6rem 1.25rem', background: 'transparent', color: '#94a3b8',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submittingGoal}
                  style={{
                    padding: '0.6rem 1.4rem', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff',
                    border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)', opacity: submittingGoal ? 0.7 : 1
                  }}
                >
                  {submittingGoal ? 'Saving Goal...' : 'Add Financial Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT GOAL MODAL ─────────────────────────────────────────────────── */}
      {editingGoal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1.5rem'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '16px',
            width: '100%', maxWidth: '540px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>✏️</span>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem', fontWeight: 700 }}>
                  Edit Financial Goal
                </h3>
              </div>
              <button 
                onClick={() => setEditingGoal(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateGoal} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                  GOAL NAME *
                </label>
                <input 
                  type="text"
                  required
                  value={editingGoal.name}
                  onChange={e => setEditingGoal(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  style={{
                    width: '100%', padding: '0.65rem 0.9rem', background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                    CATEGORY
                  </label>
                  <select 
                    value={editingGoal.category}
                    onChange={e => setEditingGoal(prev => prev ? ({ ...prev, category: e.target.value as any }) : null)}
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', background: 'rgba(15,23,42,0.9)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', outline: 'none'
                    }}
                  >
                    <option value="Education">Education 🎓</option>
                    <option value="Retirement">Retirement ☂️</option>
                    <option value="Purchase">Purchase 🚗</option>
                    <option value="Emergency Fund">Emergency Fund 🛡️</option>
                    <option value="Other">Other 🎯</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                    PRIORITY
                  </label>
                  <select 
                    value={editingGoal.priority}
                    onChange={e => setEditingGoal(prev => prev ? ({ ...prev, priority: e.target.value as any }) : null)}
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', background: 'rgba(15,23,42,0.9)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', outline: 'none'
                    }}
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                    TARGET AMOUNT ({currency === 'INR' ? '₹' : '$'}) *
                  </label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={editingGoal.target_amount}
                    onChange={e => setEditingGoal(prev => prev ? ({ ...prev, target_amount: Number(e.target.value) }) : null)}
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                    TARGET YEAR *
                  </label>
                  <input 
                    type="number"
                    required
                    min={new Date().getFullYear()}
                    max={2100}
                    value={editingGoal.target_year}
                    onChange={e => setEditingGoal(prev => prev ? ({ ...prev, target_year: Number(e.target.value) }) : null)}
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                    ALREADY SAVED ({currency === 'INR' ? '₹' : '$'})
                  </label>
                  <input 
                    type="number"
                    min="0"
                    value={editingGoal.already_saved}
                    onChange={e => setEditingGoal(prev => prev ? ({ ...prev, already_saved: Number(e.target.value) }) : null)}
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                    MONTHLY SAVINGS ({currency === 'INR' ? '₹' : '$'})
                  </label>
                  <input 
                    type="number"
                    min="0"
                    value={editingGoal.monthly_contribution}
                    onChange={e => setEditingGoal(prev => prev ? ({ ...prev, monthly_contribution: Number(e.target.value) }) : null)}
                    style={{
                      width: '100%', padding: '0.65rem 0.9rem', background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.8rem' }}>
                <button 
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  style={{
                    padding: '0.6rem 1.25rem', background: 'transparent', color: '#94a3b8',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submittingEdit}
                  style={{
                    padding: '0.6rem 1.4rem', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff',
                    border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)', opacity: submittingEdit ? 0.7 : 1
                  }}
                >
                  {submittingEdit ? 'Updating Goal...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </AppShell>
  );
}
