import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { apiJson } from '../services/api';
import { useInvestorProfile } from '../context/InvestorProfileContext';
import InvestingStyleStep, {
  InvestingStyleValue,
  isInvestingStyleComplete,
} from '../components/InvestingStyleStep';
import { RiskQuestion, FinancialSnapshot } from '../types';

// ─── Wizard Step Components ────────────────────────────────────────────────────

const STEPS = [
  'Basic Info & Family',
  'Income',
  'Assets',
  'Liabilities',
  'Goals',
  'Risk Assessment',
  'Investing Style',
  'Insurance',
  'Consent',
];

/** Whole years between a date of birth and today. */
function ageFromDob(dob: string): number {
  if (!dob) return 0;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const monthDelta = now.getMonth() - born.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < born.getDate())) age--;
  return age > 0 ? age : 0;
}

// Default goal template
const emptyGoal = () => ({
  name: '', category: 'Retirement', priority: 'High',
  target_amount: '', target_year: new Date().getFullYear() + 20,
  already_saved: '', monthly_contribution: '',
});

// Default account template
const emptyAccount = () => ({
  institution_name: '', institution_type: 'Bank', account_name: '',
  account_type: 'Savings', holdings: [emptyHolding()],
});

// Default holding template
const emptyHolding = () => ({
  name: '', category: 'Cash', current_value: '', is_liquid: true,
});

// Default liability template
const emptyLiability = () => ({
  name: '', category: 'Credit Card', outstanding_balance: '',
  interest_rate: '', monthly_payment: '',
});

// Default dependent template
const emptyDependent = () => ({
  name: '', relationship: 'Child', dob: '',
});

const PRIORITY_COLORS: Record<string, string> = {
  High: '#e63946', Medium: '#f4a261', Low: '#2ec4b6',
};
const CATEGORY_COLORS: Record<string, string> = {
  VULNERABLE: '#e63946', CAUTION: '#f4a261', HEALTHY: '#2ec4b6', EXCELLENT: '#06d6a0',
};

export default function Onboarding() {
  const { user, setUser, setFinancialSnapshot } = useAppStore();
  const { saveProfile } = useInvestorProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [snapshot, setSnapshot] = useState<FinancialSnapshot | null>(null);
  const [riskQuestions, setRiskQuestions] = useState<RiskQuestion[]>([]);

  // Form state
  const [form, setForm] = useState({
    dob: '',
    occupation: '',
    marital_status: 'Single',
    dependents: [] as ReturnType<typeof emptyDependent>[],

    income: { salary: '', business: '', rental: '', other: '' },

    accounts: [emptyAccount()] as ReturnType<typeof emptyAccount>[],

    liabilities: [] as ReturnType<typeof emptyLiability>[],

    goals: [emptyGoal()] as ReturnType<typeof emptyGoal>[],

    risk_answers: {} as Record<string, number>,

    investing_style: {
      goal: '', riskAppetite: '', horizon: '', monthlyInvestment: '',
    } as InvestingStyleValue,

    insurance: {
      life_coverage: '', health_coverage: '',
      disability_coverage_monthly: '', has_long_term_care: false,
    },

    has_will: false,
    has_poa: false,
    has_hc_proxy: false,
    consent_advisory_disclaimer: false,
  });

  useEffect(() => {
    apiJson<RiskQuestion[]>('/risk-questions')
      .then(setRiskQuestions)
      .catch(console.error);
  }, []);

  const updateForm = (path: string[], value: unknown) => {
    setForm(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      let cur: any = next;
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
      cur[path[path.length - 1]] = value;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Normalize numbers
      const payload = {
        ...form,
        income: {
          salary: Number(form.income.salary) || 0,
          business: Number(form.income.business) || 0,
          rental: Number(form.income.rental) || 0,
          other: Number(form.income.other) || 0,
        },
        accounts: form.accounts.map(a => ({
          ...a,
          holdings: a.holdings.map(h => ({
            ...h,
            current_value: Number(h.current_value) || 0,
          })),
        })),
        liabilities: form.liabilities.map(l => ({
          ...l,
          outstanding_balance: Number(l.outstanding_balance) || 0,
          interest_rate: (Number(l.interest_rate) || 0) / 100,
          monthly_payment: Number(l.monthly_payment) || 0,
        })),
        goals: form.goals.map(g => ({
          ...g,
          target_amount: Number(g.target_amount) || 0,
          target_year: Number(g.target_year) || new Date().getFullYear() + 10,
          already_saved: Number(g.already_saved) || 0,
          monthly_contribution: Number(g.monthly_contribution) || 0,
        })),
        insurance: {
          life_coverage: Number(form.insurance.life_coverage) || 0,
          health_coverage: Number(form.insurance.health_coverage) || 0,
          disability_coverage_monthly: Number(form.insurance.disability_coverage_monthly) || 0,
          has_long_term_care: form.insurance.has_long_term_care,
        },
      };

      const data = await apiJson<FinancialSnapshot>(`/users/${user.id}/wealth-discovery`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Persist the investing style alongside the wealth discovery. Age comes
      // from date of birth and the existing portfolio from the accounts just
      // entered, so neither is asked twice.
      const style = form.investing_style;
      if (isInvestingStyleComplete(style)) {
        const existingPortfolio = payload.accounts.reduce(
          (sum, a) => sum + a.holdings.reduce((s, h) => s + (Number(h.current_value) || 0), 0),
          0,
        );
        try {
          await saveProfile({
            age: ageFromDob(form.dob),
            riskAppetite: style.riskAppetite,
            horizon: Number(style.horizon),
            monthlyInvestment: Number(style.monthlyInvestment) || 0,
            goal: style.goal,
            existingPortfolio,
          });
        } catch (err) {
          // The wealth plan is saved; a failed style save must not block entry.
          console.error('Investor profile save failed:', err);
        }
      }

      setSnapshot(data);
      setFinancialSnapshot(data);
      setUser({ ...user, onboarding_complete: true, segment: data.segment });
    } catch (err) {
      console.error('Onboarding submission failed:', err);
      setSubmitting(false);
    }
  };

  // ── Completed screen ───────────────────────────────────────────────────────
  if (snapshot) {
    return <FinancialSnapshotScreen snapshot={snapshot} onContinue={() => navigate('/dashboard')} />;
  }

  // ── Submitting state ───────────────────────────────────────────────────────
  if (submitting) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '2rem' }}>
        <div style={{ fontSize: '3rem' }}>⚙️</div>
        <h2 style={{ color: 'var(--text-primary)' }}>Analysing your financial profile...</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Calculating your Wealth Health Score and generating personalised recommendations.</p>
        <div className="spinner" />
      </div>
    );
  }

  const isLastStep = step === STEPS.length - 1;

  const canProceed = () => {
    if (step === 0) return form.dob && form.occupation;
    if (step === 1) return Number(form.income.salary) + Number(form.income.business) + Number(form.income.rental) + Number(form.income.other) > 0;
    if (step === 4) return form.goals.length > 0 && form.goals[0].name && form.goals[0].target_amount;
    if (step === 5) return Object.keys(form.risk_answers).length === riskQuestions.length;
    if (step === 6) return isInvestingStyleComplete(form.investing_style);
    if (step === 8) return form.consent_advisory_disclaimer;
    return true;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>Wealth Management System</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,165,0,0.15)', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
            Wealth Discovery Wizard
          </span>
        </div>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Step {step + 1} of {STEPS.length}</span>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)' }}>
        <div style={{ height: '100%', width: `${((step + 1) / STEPS.length) * 100}%`, background: 'var(--accent-primary)', transition: 'width 0.4s ease' }} />
      </div>

      {/* Step Indicators */}
      <div style={{ display: 'flex', overflowX: 'auto', padding: '1rem 2rem', gap: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 600,
              background: i < step ? 'var(--accent-primary)' : i === step ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)',
              border: i === step ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: i < step ? '#fff' : i === step ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '0.75rem', color: i === step ? 'var(--text-primary)' : 'var(--text-secondary)', display: i > 4 ? 'none' : 'block' }}>
              {s}
            </span>
            {i < STEPS.length - 1 && <div style={{ width: '20px', height: '1px', background: 'var(--border-color)' }} />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div style={{ flex: 1, padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Step {step + 1}: {STEPS[step]}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          {step === 0 && "Let's start with your personal information and family situation."}
          {step === 1 && "Tell us about all your income sources. Include annual amounts."}
          {step === 2 && "Add your financial accounts and the holdings within each one."}
          {step === 3 && "List all your debts and liabilities. We'll factor them into your plan."}
          {step === 4 && "Define your financial goals with funding details. The Goal Funding Engine uses this data."}
          {step === 5 && "Answer all 12 questions to calculate your personalised risk profile."}
          {step === 6 && "How you invest month to month. This sets your investor type, which personalises the Research and Markets tools."}
          {step === 7 && "Insurance protects your wealth plan. Tell us what coverage you have."}
          {step === 8 && "Review and consent to proceed. Your Financial Snapshot will be generated."}
        </p>

        {step === 0 && <Step1BasicInfo form={form} update={updateForm} />}
        {step === 1 && <Step2Income form={form} update={updateForm} />}
        {step === 2 && <Step3Assets form={form} setForm={setForm} />}
        {step === 3 && <Step4Liabilities form={form} setForm={setForm} />}
        {step === 4 && <Step5Goals form={form} setForm={setForm} />}
        {step === 5 && <Step6Risk form={form} update={updateForm} questions={riskQuestions} />}
        {step === 6 && (
          <InvestingStyleStep
            value={form.investing_style}
            onChange={patch => setForm(prev => ({ ...prev, investing_style: { ...prev.investing_style, ...patch } }))}
            age={ageFromDob(form.dob)}
            annualIncome={
              Number(form.income.salary) + Number(form.income.business) +
              Number(form.income.rental) + Number(form.income.other)
            }
          />
        )}
        {step === 7 && <Step7Insurance form={form} update={updateForm} />}
        {step === 8 && <Step8Consent form={form} update={updateForm} />}
      </div>

      {/* Navigation */}
      <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{
            padding: '0.75rem 2rem', borderRadius: '8px', cursor: step === 0 ? 'not-allowed' : 'pointer',
            background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-color)',
            color: step === 0 ? 'var(--text-secondary)' : 'var(--text-primary)', fontSize: '0.875rem',
          }}
        >
          ← Back
        </button>
        <button
          onClick={isLastStep ? handleSubmit : () => setStep(s => s + 1)}
          disabled={!canProceed()}
          style={{
            padding: '0.75rem 2rem', borderRadius: '8px', cursor: canProceed() ? 'pointer' : 'not-allowed',
            background: canProceed() ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
            border: 'none', color: canProceed() ? '#fff' : 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600,
          }}
        >
          {isLastStep ? '🚀 Generate My Financial Snapshot' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

// ─── Step 1: Basic Info & Family ──────────────────────────────────────────────
function Step1BasicInfo({ form, update }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="form-grid-2">
        <FormField label="Date of Birth" required>
          <input type="date" className="form-input" value={form.dob} onChange={e => update(['dob'], e.target.value)} />
        </FormField>
        <FormField label="Occupation" required>
          <input type="text" className="form-input" placeholder="e.g. Software Engineer" value={form.occupation} onChange={e => update(['occupation'], e.target.value)} />
        </FormField>
      </div>

      <FormField label="Marital Status">
        <select className="form-input" value={form.marital_status} onChange={e => update(['marital_status'], e.target.value)}>
          {['Single', 'Married', 'Divorced', 'Widowed', 'Domestic Partnership'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </FormField>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Family Members / Dependents</label>
          <button
            className="btn-secondary"
            onClick={() => update(['dependents'], [...form.dependents, emptyDependent()])}
          >
            + Add Member
          </button>
        </div>
        {form.dependents.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontStyle: 'italic' }}>
            No dependents added. Click "+ Add Member" to add a spouse, child, or parent.
          </p>
        )}
        {form.dependents.map((dep: any, i: number) => (
          <div key={i} className="list-card" style={{ marginBottom: '0.75rem' }}>
            <div className="form-grid-3">
              <FormField label="Name">
                <input className="form-input" value={dep.name} placeholder="Full name"
                  onChange={e => update(['dependents', i, 'name'], e.target.value)} />
              </FormField>
              <FormField label="Relationship">
                <select className="form-input" value={dep.relationship}
                  onChange={e => update(['dependents', i, 'relationship'], e.target.value)}>
                  {['Spouse', 'Child', 'Parent', 'Dependent'].map(r => <option key={r}>{r}</option>)}
                </select>
              </FormField>
              <FormField label="Date of Birth">
                <input type="date" className="form-input" value={dep.dob}
                  onChange={e => update(['dependents', i, 'dob'], e.target.value)} />
              </FormField>
            </div>
            <button className="btn-danger-sm" onClick={() => {
              const next = [...form.dependents];
              next.splice(i, 1);
              update(['dependents'], next);
            }}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Income ────────────────────────────────────────────────────────────
function Step2Income({ form, update }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="info-box">💡 Enter annual amounts. All income streams contribute to your Wealth Health Score.</div>
      <div className="form-grid-2">
        <FormField label="Salary / Employment Income (Annual)" required>
          <input type="number" className="form-input" placeholder="₹0" value={form.income.salary}
            onChange={e => update(['income', 'salary'], e.target.value)} />
        </FormField>
        <FormField label="Business Income (Annual)">
          <input type="number" className="form-input" placeholder="₹0" value={form.income.business}
            onChange={e => update(['income', 'business'], e.target.value)} />
        </FormField>
        <FormField label="Rental Income (Annual)">
          <input type="number" className="form-input" placeholder="₹0" value={form.income.rental}
            onChange={e => update(['income', 'rental'], e.target.value)} />
        </FormField>
        <FormField label="Other Income (Annual)">
          <input type="number" className="form-input" placeholder="Dividends, freelance, etc." value={form.income.other}
            onChange={e => update(['income', 'other'], e.target.value)} />
        </FormField>
      </div>
      {(() => {
        const total = Number(form.income.salary) + Number(form.income.business) + Number(form.income.rental) + Number(form.income.other);
        return total > 0 ? (
          <div className="summary-card">
            <span>Total Annual Income</span>
            <strong>₹{total.toLocaleString()}</strong>
          </div>
        ) : null;
      })()}
    </div>
  );
}

// ─── Step 3: Assets (Institution → Account → Holdings) ───────────────────────
function Step3Assets({ form, setForm }: any) {
  const addAccount = () => setForm((prev: any) => ({ ...prev, accounts: [...prev.accounts, emptyAccount()] }));
  const removeAccount = (i: number) => setForm((prev: any) => ({
    ...prev, accounts: prev.accounts.filter((_: any, idx: number) => idx !== i),
  }));
  const addHolding = (ai: number) => setForm((prev: any) => {
    const next = JSON.parse(JSON.stringify(prev));
    next.accounts[ai].holdings.push(emptyHolding());
    return next;
  });
  const removeHolding = (ai: number, hi: number) => setForm((prev: any) => {
    const next = JSON.parse(JSON.stringify(prev));
    next.accounts[ai].holdings.splice(hi, 1);
    return next;
  });
  const updateAccount = (ai: number, field: string, value: any) => setForm((prev: any) => {
    const next = JSON.parse(JSON.stringify(prev));
    next.accounts[ai][field] = value;
    return next;
  });
  const updateHolding = (ai: number, hi: number, field: string, value: any) => setForm((prev: any) => {
    const next = JSON.parse(JSON.stringify(prev));
    next.accounts[ai].holdings[hi][field] = value;
    return next;
  });

  const HOLDING_CATEGORIES = ['Cash', 'Stocks', 'Mutual Funds', 'Gold', 'Real Estate', 'EPF', 'PPF', 'NPS', 'Bonds', 'Crypto', 'Fixed Deposits', 'Other'];
  const ACCOUNT_TYPES = ['Checking', 'Savings', 'Demat', 'Brokerage', 'Retirement', 'Other'];
  const INSTITUTION_TYPES = ['Bank', 'Brokerage', 'Insurance', 'Government', 'Other'];

  const totalAssets = form.accounts.reduce((sum: number, a: any) =>
    sum + a.holdings.reduce((s: number, h: any) => s + (Number(h.current_value) || 0), 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="info-box">
        🏦 <strong>Institution → Account → Holdings.</strong> Group your assets by where they are held. This enables richer analytics later.
      </div>

      {form.accounts.map((acct: any, ai: number) => (
        <div key={ai} className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, color: 'var(--accent-primary)' }}>Account {ai + 1}</h4>
            {form.accounts.length > 1 && (
              <button className="btn-danger-sm" onClick={() => removeAccount(ai)}>Remove Account</button>
            )}
          </div>

          <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
            <FormField label="Institution Name">
              <input className="form-input" placeholder="e.g. HDFC Bank" value={acct.institution_name}
                onChange={e => updateAccount(ai, 'institution_name', e.target.value)} />
            </FormField>
            <FormField label="Institution Type">
              <select className="form-input" value={acct.institution_type}
                onChange={e => updateAccount(ai, 'institution_type', e.target.value)}>
                {INSTITUTION_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Account Name">
              <input className="form-input" placeholder="e.g. Primary Savings" value={acct.account_name}
                onChange={e => updateAccount(ai, 'account_name', e.target.value)} />
            </FormField>
            <FormField label="Account Type">
              <select className="form-input" value={acct.account_type}
                onChange={e => updateAccount(ai, 'account_type', e.target.value)}>
                {ACCOUNT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </FormField>
          </div>

          <div style={{ paddingLeft: '1rem', borderLeft: '2px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Holdings</span>
              <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                onClick={() => addHolding(ai)}>+ Add Holding</button>
            </div>

            {acct.holdings.map((h: any, hi: number) => (
              <div key={hi} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem', marginBottom: '0.5rem' }}>
                <div className="form-grid-4">
                  <FormField label="Name">
                    <input className="form-input" placeholder="e.g. Nifty 50 ETF" value={h.name}
                      onChange={e => updateHolding(ai, hi, 'name', e.target.value)} />
                  </FormField>
                  <FormField label="Category">
                    <select className="form-input" value={h.category}
                      onChange={e => updateHolding(ai, hi, 'category', e.target.value)}>
                      {HOLDING_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Current Value (₹)">
                    <input type="number" className="form-input" placeholder="0" value={h.current_value}
                      onChange={e => updateHolding(ai, hi, 'current_value', e.target.value)} />
                  </FormField>
                  <FormField label="Liquid?">
                    <select className="form-input" value={h.is_liquid ? 'yes' : 'no'}
                      onChange={e => updateHolding(ai, hi, 'is_liquid', e.target.value === 'yes')}>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </FormField>
                </div>
                {acct.holdings.length > 1 && (
                  <button className="btn-danger-sm" style={{ marginTop: '0.5rem' }}
                    onClick={() => removeHolding(ai, hi)}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button className="btn-secondary" onClick={addAccount}>+ Add Another Account</button>

      {totalAssets > 0 && (
        <div className="summary-card">
          <span>Total Assets Value</span>
          <strong>₹{totalAssets.toLocaleString()}</strong>
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Liabilities ──────────────────────────────────────────────────────
function Step4Liabilities({ form, setForm }: any) {
  const CATEGORIES = ['Home Loan', 'Education Loan', 'Vehicle Loan', 'Credit Card', 'Other'];

  const addLiability = () => setForm((prev: any) => ({ ...prev, liabilities: [...prev.liabilities, emptyLiability()] }));
  const removeLiability = (i: number) => setForm((prev: any) => ({
    ...prev, liabilities: prev.liabilities.filter((_: any, idx: number) => idx !== i),
  }));
  const updateLiability = (i: number, field: string, value: any) => setForm((prev: any) => {
    const next = JSON.parse(JSON.stringify(prev));
    next.liabilities[i][field] = value;
    return next;
  });

  const totalDebt = form.liabilities.reduce((s: number, l: any) => s + (Number(l.outstanding_balance) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="info-box">
        💳 Net Worth = Assets − Liabilities. Accurate liabilities enable better debt management recommendations.
      </div>

      {form.liabilities.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
          <p>No liabilities added. If you have no debts, that's great! Click Continue.</p>
        </div>
      )}

      {form.liabilities.map((l: any, i: number) => (
        <div key={i} className="glass-panel" style={{ padding: '1.25rem' }}>
          <div className="form-grid-2">
            <FormField label="Liability Name">
              <input className="form-input" placeholder="e.g. SBI Home Loan" value={l.name}
                onChange={e => updateLiability(i, 'name', e.target.value)} />
            </FormField>
            <FormField label="Category">
              <select className="form-input" value={l.category}
                onChange={e => updateLiability(i, 'category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Outstanding Balance (₹)">
              <input type="number" className="form-input" placeholder="0" value={l.outstanding_balance}
                onChange={e => updateLiability(i, 'outstanding_balance', e.target.value)} />
            </FormField>
            <FormField label="Interest Rate (%)">
              <input type="number" className="form-input" placeholder="e.g. 18.5" value={l.interest_rate}
                onChange={e => updateLiability(i, 'interest_rate', e.target.value)} />
            </FormField>
            <FormField label="Monthly Payment (₹)">
              <input type="number" className="form-input" placeholder="0" value={l.monthly_payment}
                onChange={e => updateLiability(i, 'monthly_payment', e.target.value)} />
            </FormField>
          </div>
          <button className="btn-danger-sm" style={{ marginTop: '0.75rem' }} onClick={() => removeLiability(i)}>Remove</button>
        </div>
      ))}

      <button className="btn-secondary" onClick={addLiability}>+ Add Liability</button>

      {totalDebt > 0 && (
        <div className="summary-card" style={{ borderColor: 'rgba(230, 57, 70, 0.4)' }}>
          <span>Total Outstanding Debt</span>
          <strong style={{ color: '#e63946' }}>₹{totalDebt.toLocaleString()}</strong>
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Goals ────────────────────────────────────────────────────────────
function Step5Goals({ form, setForm }: any) {
  const CATEGORIES = ['Retirement', 'Education', 'Purchase', 'Travel', 'Business', 'Wealth Creation', 'Emergency Fund', 'General Savings'];

  const addGoal = () => setForm((prev: any) => ({ ...prev, goals: [...prev.goals, emptyGoal()] }));
  const removeGoal = (i: number) => setForm((prev: any) => ({
    ...prev, goals: prev.goals.filter((_: any, idx: number) => idx !== i),
  }));
  const updateGoal = (i: number, field: string, value: any) => setForm((prev: any) => {
    const next = JSON.parse(JSON.stringify(prev));
    next.goals[i][field] = value;
    return next;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="info-box">
        🎯 Each goal must have funding details for the Goal Funding Engine to calculate shortfalls and solver options.
      </div>

      {form.goals.map((g: any, i: number) => (
        <div key={i} className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0 }}>Goal {i + 1}: {g.name || 'New Goal'}</h4>
            {form.goals.length > 1 && (
              <button className="btn-danger-sm" onClick={() => removeGoal(i)}>Remove</button>
            )}
          </div>
          <div className="form-grid-2">
            <FormField label="Goal Name" required>
              <input className="form-input" placeholder="e.g. Retirement at 60" value={g.name}
                onChange={e => updateGoal(i, 'name', e.target.value)} />
            </FormField>
            <FormField label="Category">
              <select className="form-input" value={g.category}
                onChange={e => updateGoal(i, 'category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Target Amount (₹)" required>
              <input type="number" className="form-input" placeholder="0" value={g.target_amount}
                onChange={e => updateGoal(i, 'target_amount', e.target.value)} />
            </FormField>
            <FormField label="Target Year">
              <input type="number" className="form-input" placeholder={String(new Date().getFullYear() + 10)} value={g.target_year}
                onChange={e => updateGoal(i, 'target_year', e.target.value)} />
            </FormField>
            <FormField label="Already Saved (₹)">
              <input type="number" className="form-input" placeholder="0" value={g.already_saved}
                onChange={e => updateGoal(i, 'already_saved', e.target.value)} />
            </FormField>
            <FormField label="Monthly Contribution (₹)">
              <input type="number" className="form-input" placeholder="0" value={g.monthly_contribution}
                onChange={e => updateGoal(i, 'monthly_contribution', e.target.value)} />
            </FormField>
            <FormField label="Priority">
              <select className="form-input" value={g.priority}
                onChange={e => updateGoal(i, 'priority', e.target.value)}>
                {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
              </select>
            </FormField>
          </div>
        </div>
      ))}

      <button className="btn-secondary" onClick={addGoal}>+ Add Another Goal</button>
    </div>
  );
}

// ─── Step 6: Risk Assessment ──────────────────────────────────────────────────
function Step6Risk({ form, update, questions }: any) {
  const answered = Object.keys(form.risk_answers).length;
  const total = questions.length;
  const currentScore = Object.values(form.risk_answers).reduce((s: any, v: any) => s + v, 0);

  let profilePreview = '';
  if (answered > 0) {
    const projected = Math.round(((currentScore as number) / answered) * total);
    if (projected <= 20) profilePreview = 'Conservative';
    else if (projected <= 30) profilePreview = 'Moderately Conservative';
    else if (projected <= 42) profilePreview = 'Balanced';
    else if (projected <= 52) profilePreview = 'Growth';
    else profilePreview = 'Aggressive';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="info-box">
        📊 Based on recognized investor suitability concepts and the Edelman methodology. Your answers calculate a score that maps to your risk profile.
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(99,102,241,0.1)', borderRadius: '8px' }}>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '8px' }}>
          <div style={{ width: `${(answered / Math.max(1, total)) * 100}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '4px', transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{answered}/{total} answered</span>
        {profilePreview && <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-primary)', flexShrink: 0 }}>≈ {profilePreview}</span>}
      </div>

      {questions.map((q: RiskQuestion) => (
        <div key={q.id} className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontWeight: 600, marginBottom: '1rem', lineHeight: 1.5 }}>{q.question}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {q.options.map(opt => (
              <label key={opt.score} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem',
                borderRadius: '8px', cursor: 'pointer',
                background: form.risk_answers[q.id] === opt.score ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${form.risk_answers[q.id] === opt.score ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                transition: 'all 0.2s',
              }}>
                <input type="radio" name={q.id} value={opt.score} style={{ marginTop: '2px' }}
                  checked={form.risk_answers[q.id] === opt.score}
                  onChange={() => update(['risk_answers', q.id], opt.score)} />
                <span style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Step 7: Insurance ────────────────────────────────────────────────────────
function Step7Insurance({ form, update }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="info-box">
        🛡️ Insurance is your wealth plan's safety net. Edelman considers it foundational before any growth investing.
      </div>
      <div className="form-grid-2">
        <FormField label="Life Insurance Coverage (₹)" hint="Total sum assured across all policies">
          <input type="number" className="form-input" placeholder="0" value={form.insurance.life_coverage}
            onChange={e => update(['insurance', 'life_coverage'], e.target.value)} />
        </FormField>
        <FormField label="Health Insurance Coverage (₹)" hint="Annual coverage limit">
          <input type="number" className="form-input" placeholder="0" value={form.insurance.health_coverage}
            onChange={e => update(['insurance', 'health_coverage'], e.target.value)} />
        </FormField>
        <FormField label="Disability Coverage (₹/month)" hint="Monthly benefit if you cannot work">
          <input type="number" className="form-input" placeholder="0" value={form.insurance.disability_coverage_monthly}
            onChange={e => update(['insurance', 'disability_coverage_monthly'], e.target.value)} />
        </FormField>
        <FormField label="Long Term Care Insurance">
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            {['Yes', 'No'].map(v => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="ltc" value={v}
                  checked={form.insurance.has_long_term_care === (v === 'Yes')}
                  onChange={() => update(['insurance', 'has_long_term_care'], v === 'Yes')} />
                {v}
              </label>
            ))}
          </div>
        </FormField>
      </div>
    </div>
  );
}

// ─── Step 8: Consent ──────────────────────────────────────────────────────────
function Step8Consent({ form, update }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h4 style={{ marginTop: 0, color: 'var(--accent-primary)' }}>Estate Planning Documents</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Edelman considers these foundational. Missing documents will generate priority recommendations.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { key: 'has_will', label: 'I have a Will', hint: 'A legal document distributing your assets' },
            { key: 'has_poa', label: 'I have a Durable Power of Attorney', hint: 'Designates someone to handle finances if incapacitated' },
            { key: 'has_hc_proxy', label: 'I have a Healthcare Proxy / Advance Directive', hint: 'Designates someone to make medical decisions for you' },
          ].map(({ key, label, hint }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" style={{ marginTop: '3px' }}
                checked={(form as any)[key]}
                onChange={e => update([key], e.target.checked)} />
              <div>
                <div style={{ fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{hint}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(255,165,0,0.3)' }}>
        <h4 style={{ marginTop: 0, color: '#f4a261' }}>⚠️ Advisory Disclosure</h4>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          The recommendations generated by this platform are <strong>advisory simulations only</strong> and do not constitute financial advice, investment advice, or a solicitation to buy or sell any security. This platform does not execute trades, hold client assets, act as a broker-dealer, or provide investment advisory services. All projections use assumptions that may not reflect actual market conditions. Past performance does not guarantee future results. Please consult a qualified financial professional before making significant financial decisions.
        </p>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginTop: '1rem' }}>
          <input type="checkbox" style={{ marginTop: '3px' }}
            checked={form.consent_advisory_disclaimer}
            onChange={e => update(['consent_advisory_disclaimer'], e.target.checked)} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            I understand and agree that recommendations are advisory simulations only and do not constitute financial advice.
          </span>
        </label>
      </div>
    </div>
  );
}

// ─── Financial Snapshot Screen (Post-Onboarding) ──────────────────────────────
function FinancialSnapshotScreen({ snapshot, onContinue }: { snapshot: FinancialSnapshot; onContinue: () => void }) {
  const whs = snapshot.whs;
  const catColor = CATEGORY_COLORS[whs.category] ?? '#6366f1';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '700px', width: '100%' }}>
        {/* Congratulations Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Your Financial Snapshot is Ready</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Segment: <strong style={{ color: 'var(--accent-primary)' }}>{snapshot.segment}</strong> &nbsp;·&nbsp;
            Risk Profile: <strong style={{ color: 'var(--accent-primary)' }}>{snapshot.risk_profile}</strong>
          </p>
        </div>

        {/* WHS Score */}
        <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem', marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wealth Health Score</p>
          <div style={{ fontSize: '4.5rem', fontWeight: 700, color: catColor, lineHeight: 1 }}>{whs.score}</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: catColor, marginBottom: '1.5rem' }}>{whs.category}</div>
          <div className="form-grid-2" style={{ textAlign: 'left', gap: '0.75rem' }}>
            {[
              { label: 'Net Worth', value: `₹${(whs.net_worth ?? 0).toLocaleString()}` },
              { label: 'Monthly Savings', value: `₹${(whs.monthly_savings ?? 0).toLocaleString()}` },
              { label: 'Savings Rate', value: `${whs.savings_rate ?? 0}%` },
              { label: 'Emergency Fund', value: `${whs.emergency_fund_coverage ?? 0} months` },
              { label: 'Retirement Readiness', value: `${whs.retirement_readiness ?? 0}%` },
              { label: 'Debt Ratio', value: `${whs.debt_ratio ?? 0}%` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{label}</div>
                <div style={{ fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Risks */}
        {snapshot.top_risks.length > 0 && (
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>⚡ Top Priority Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {snapshot.top_risks.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: `3px solid ${PRIORITY_COLORS[r.priority] ?? '#6366f1'}` }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: PRIORITY_COLORS[r.priority] ?? '#6366f1', background: `${PRIORITY_COLORS[r.priority]}22`, padding: '0.2rem 0.5rem', borderRadius: '4px', flexShrink: 0, marginTop: '1px', textTransform: 'uppercase' }}>
                    {r.priority}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{r.category}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assumptions */}
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Projection Assumptions</h4>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Expected Return', value: `${(snapshot.assumptions.expected_return * 100).toFixed(0)}%` },
              { label: 'Inflation', value: `${(snapshot.assumptions.inflation_rate * 100).toFixed(0)}%` },
              { label: 'Retirement Inflation', value: `${(snapshot.assumptions.retirement_inflation * 100).toFixed(0)}%` },
              { label: 'Education Inflation', value: `${(snapshot.assumptions.education_inflation * 100).toFixed(0)}%` },
            ].map(({ label, value }) => (
              <div key={label} style={{ fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}: </span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>

        <button onClick={onContinue} style={{
          width: '100%', padding: '1rem', borderRadius: '10px', fontSize: '1rem', fontWeight: 700,
          background: 'var(--accent-primary)', border: 'none', color: '#fff', cursor: 'pointer',
        }}>
          Proceed to Dashboard →
        </button>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {snapshot.disclaimer}
        </p>
      </div>
    </div>
  );
}

// ─── Shared UI Components ─────────────────────────────────────────────────────
function FormField({ label, children, required, hint }: { label: string; children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}{required && <span style={{ color: '#e63946', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{hint}</p>}
    </div>
  );
}
