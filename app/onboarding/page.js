"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, classifyInvestor } from "../context/UserContext";

const steps = [
  { id: "basic", title: "About You", subtitle: "Let's start with the basics" },
  { id: "financial", title: "Your Finances", subtitle: "Help us understand your money" },
  { id: "goals", title: "Investment Goals", subtitle: "What are you investing for?" },
  { id: "result", title: "Your Investor Profile", subtitle: "Here's what we found" },
];

const goalOptions = [
  { value: "wealth", label: "Wealth Creation", emoji: "💰", desc: "Grow money over long term" },
  { value: "retirement", label: "Retirement Planning", emoji: "🏖️", desc: "Secure my future" },
  { value: "house", label: "Buy a House", emoji: "🏠", desc: "Save for property" },
  { value: "education", label: "Child's Education", emoji: "🎓", desc: "Fund education goals" },
  { value: "income", label: "Regular Income", emoji: "📈", desc: "Dividends & passive income" },
];

const riskOptions = [
  { value: "low", label: "Low", emoji: "🛡️", desc: "Capital preservation first" },
  { value: "medium", label: "Medium", emoji: "⚖️", desc: "Balanced growth & safety" },
  { value: "high", label: "High", emoji: "🚀", desc: "Maximize long-term growth" },
];

const typeAccents = {
  Conservative: { color: "#3B82F6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" },
  "Aggressive Growth": { color: "#22C55E", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)" },
  "Wealth Builder": { color: "#A855F7", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.25)" },
  Balanced: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
};

const inputClass = {
  background: "#1C2128",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#ffffff",
  borderRadius: "10px",
  padding: "12px 14px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
  transition: "border-color 0.15s",
};

const labelStyle = {
  fontSize: "13px",
  fontWeight: "500",
  color: "#A1A1AA",
  display: "block",
  marginBottom: "8px",
};

export default function Onboarding() {
  const { saveProfile } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", age: "", occupation: "",
    monthlyIncome: "", monthlyInvestment: "", existingPortfolio: "",
    goal: "", riskAppetite: "", horizon: "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const preview = step === 3 ? classifyInvestor({ ...form, age: Number(form.age), horizon: Number(form.horizon), monthlyInvestment: Number(form.monthlyInvestment) }) : null;
  const accent = preview ? typeAccents[preview.type] : typeAccents["Balanced"];

  function handleFinish() {
    saveProfile({ ...form, age: Number(form.age), horizon: Number(form.horizon), monthlyInvestment: Number(form.monthlyInvestment), monthlyIncome: Number(form.monthlyIncome), existingPortfolio: Number(form.existingPortfolio) });
    router.push("/");
  }

  const savingsRate = form.monthlyIncome && form.monthlyInvestment
    ? Math.round((form.monthlyInvestment / form.monthlyIncome) * 100)
    : null;

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "#0D1117" }}
    >
      {/* Left Panel — Brand */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-[420px] flex-shrink-0"
        style={{ background: "#161B22", borderRight: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold"
              style={{ background: "#22C55E", color: "#000" }}
            >
              M
            </div>
            <div>
              <p className="text-white font-semibold text-sm">MyMoneyPlant</p>
              <p className="text-xs" style={{ color: "#A1A1AA" }}>Wealth Platform</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white leading-tight">
                Build wealth like<br />the best investors do.
              </h1>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "#A1A1AA" }}>
                A personalized investment platform powered by Warren Buffett&apos;s time-tested methodology.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: "📊", text: "Buffett-scored stock screening" },
                { icon: "📈", text: "Portfolio P&L tracking" },
                { icon: "🏛️", text: "Sector research & analysis" },
                { icon: "📬", text: "Shareholder letter insights" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm text-white">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.15)" }}
        >
          <p className="text-sm italic text-white leading-relaxed">
            &quot;The stock market is a device for transferring money from the impatient to the patient.&quot;
          </p>
          <p className="text-xs mt-2 font-medium" style={{ color: "#D4AF37" }}>— Warren Buffett</p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Progress */}
          <div className="flex gap-1.5 mb-8">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{ background: i <= step ? "#22C55E" : "rgba(255,255,255,0.1)" }}
              />
            ))}
          </div>

          {/* Step Header */}
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#22C55E" }}>
              Step {step + 1} of {steps.length} — {steps[step].subtitle}
            </p>
            <h2 className="text-2xl font-bold text-white">{steps[step].title}</h2>
          </div>

          {/* Step 0 — Basic Info */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  style={inputClass}
                  onFocus={(e) => { e.target.style.borderColor = "#22C55E50"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Age</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => set("age", e.target.value)}
                  placeholder="e.g. 28"
                  style={inputClass}
                  onFocus={(e) => { e.target.style.borderColor = "#22C55E50"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Occupation</label>
                <select
                  value={form.occupation}
                  onChange={(e) => set("occupation", e.target.value)}
                  style={{ ...inputClass, cursor: "pointer" }}
                  onFocus={(e) => { e.target.style.borderColor = "#22C55E50"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                >
                  <option value="" style={{ background: "#1C2128" }}>Select occupation</option>
                  <option value="salaried" style={{ background: "#1C2128" }}>Salaried Employee</option>
                  <option value="business" style={{ background: "#1C2128" }}>Business Owner</option>
                  <option value="freelancer" style={{ background: "#1C2128" }}>Freelancer / Self-Employed</option>
                  <option value="student" style={{ background: "#1C2128" }}>Student</option>
                  <option value="retired" style={{ background: "#1C2128" }}>Retired</option>
                </select>
              </div>
              <button
                disabled={!form.name || !form.age || !form.occupation}
                onClick={() => setStep(1)}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-150"
                style={{
                  background: (!form.name || !form.age || !form.occupation) ? "rgba(34,197,94,0.3)" : "#22C55E",
                  color: (!form.name || !form.age || !form.occupation) ? "rgba(0,0,0,0.4)" : "#000",
                  cursor: (!form.name || !form.age || !form.occupation) ? "not-allowed" : "pointer",
                }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 1 — Financial Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label style={labelStyle}>Monthly Income (₹)</label>
                <input
                  type="number"
                  value={form.monthlyIncome}
                  onChange={(e) => set("monthlyIncome", e.target.value)}
                  placeholder="e.g. 80000"
                  style={inputClass}
                  onFocus={(e) => { e.target.style.borderColor = "#22C55E50"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Monthly Investment Budget (₹)
                  <span className="ml-1 text-xs" style={{ color: "#A1A1AA" }}>How much can you invest each month?</span>
                </label>
                <input
                  type="number"
                  value={form.monthlyInvestment}
                  onChange={(e) => set("monthlyInvestment", e.target.value)}
                  placeholder="e.g. 15000"
                  style={inputClass}
                  onFocus={(e) => { e.target.style.borderColor = "#22C55E50"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                />
                {savingsRate !== null && (
                  <div
                    className="mt-2 px-3 py-2 rounded-lg text-xs font-medium"
                    style={{
                      background: savingsRate >= 20 ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
                      color: savingsRate >= 20 ? "#22C55E" : "#F59E0B",
                      border: `1px solid ${savingsRate >= 20 ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`,
                    }}
                  >
                    Investing {savingsRate}% of income
                    {savingsRate >= 20 ? " — Excellent! Buffett-approved." : " — Buffett recommends at least 20%"}
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>
                  Existing Portfolio Value (₹)
                  <span className="ml-1 text-xs" style={{ color: "#A1A1AA" }}>Total current investments (0 if none)</span>
                </label>
                <input
                  type="number"
                  value={form.existingPortfolio}
                  onChange={(e) => set("existingPortfolio", e.target.value)}
                  placeholder="e.g. 200000"
                  style={inputClass}
                  onFocus={(e) => { e.target.style.borderColor = "#22C55E50"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  ← Back
                </button>
                <button
                  disabled={!form.monthlyIncome || !form.monthlyInvestment}
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: (!form.monthlyIncome || !form.monthlyInvestment) ? "rgba(34,197,94,0.3)" : "#22C55E",
                    color: (!form.monthlyIncome || !form.monthlyInvestment) ? "rgba(0,0,0,0.4)" : "#000",
                    cursor: (!form.monthlyIncome || !form.monthlyInvestment) ? "not-allowed" : "pointer",
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Goals & Risk */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium block mb-3" style={{ color: "#A1A1AA" }}>Primary Investment Goal</label>
                <div className="space-y-2">
                  {goalOptions.map((g) => {
                    const isSelected = form.goal === g.value;
                    return (
                      <button
                        key={g.value}
                        onClick={() => set("goal", g.value)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150"
                        style={{
                          background: isSelected ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${isSelected ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.07)"}`,
                        }}
                      >
                        <span className="text-lg flex-shrink-0">{g.emoji}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: isSelected ? "#22C55E" : "#ffffff" }}>{g.label}</p>
                          <p className="text-xs" style={{ color: "#A1A1AA" }}>{g.desc}</p>
                        </div>
                        {isSelected && (
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: "#22C55E" }}
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

              <div>
                <label className="text-sm font-medium block mb-3" style={{ color: "#A1A1AA" }}>Risk Appetite</label>
                <div className="grid grid-cols-3 gap-2">
                  {riskOptions.map((r) => {
                    const isSelected = form.riskAppetite === r.value;
                    return (
                      <button
                        key={r.value}
                        onClick={() => set("riskAppetite", r.value)}
                        className="flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl transition-all duration-150"
                        style={{
                          background: isSelected ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${isSelected ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.07)"}`,
                        }}
                      >
                        <span className="text-xl">{r.emoji}</span>
                        <p className="text-xs font-semibold" style={{ color: isSelected ? "#22C55E" : "#ffffff" }}>{r.label}</p>
                        <p className="text-xs text-center leading-tight" style={{ color: "#A1A1AA" }}>{r.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Investment Horizon (years)</label>
                <input
                  type="number"
                  value={form.horizon}
                  onChange={(e) => set("horizon", e.target.value)}
                  placeholder="e.g. 10"
                  style={inputClass}
                  onFocus={(e) => { e.target.style.borderColor = "#22C55E50"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  ← Back
                </button>
                <button
                  disabled={!form.goal || !form.riskAppetite || !form.horizon}
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: (!form.goal || !form.riskAppetite || !form.horizon) ? "rgba(34,197,94,0.3)" : "#22C55E",
                    color: (!form.goal || !form.riskAppetite || !form.horizon) ? "rgba(0,0,0,0.4)" : "#000",
                    cursor: (!form.goal || !form.riskAppetite || !form.horizon) ? "not-allowed" : "pointer",
                  }}
                >
                  See My Profile →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Result */}
          {step === 3 && preview && (
            <div className="space-y-4">
              {/* Investor Type Card */}
              <div
                className="rounded-xl p-5"
                style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{preview.icon}</span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider mb-0.5" style={{ color: accent.color }}>You are a</p>
                    <h3 className="text-xl font-bold text-white">{preview.type} Investor</h3>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#A1A1AA" }}>{preview.desc}</p>

                <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#A1A1AA" }}>
                    Recommended Allocation
                  </p>
                  <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div style={{ width: `${preview.allocation.equity}%`, background: "#22C55E", borderRadius: "99px" }} />
                    <div style={{ width: `${preview.allocation.debt}%`, background: "#A1A1AA", borderRadius: "99px" }} />
                    <div style={{ width: `${preview.allocation.gold}%`, background: "#D4AF37", borderRadius: "99px" }} />
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span style={{ color: "#22C55E" }}>Equity {preview.allocation.equity}%</span>
                    <span style={{ color: "#A1A1AA" }}>Debt {preview.allocation.debt}%</span>
                    <span style={{ color: "#D4AF37" }}>Gold {preview.allocation.gold}%</span>
                  </div>
                </div>

                {form.monthlyInvestment && (
                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#A1A1AA" }}>
                      Monthly ₹{Number(form.monthlyInvestment).toLocaleString()} split
                    </p>
                    <div className="space-y-2">
                      {[
                        { label: "Equity", pct: preview.allocation.equity, color: "#22C55E" },
                        { label: "Debt/FD", pct: preview.allocation.debt, color: "#A1A1AA" },
                        { label: "Gold/SGB", pct: preview.allocation.gold, color: "#D4AF37" },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                            <span className="text-xs text-white">{row.label}</span>
                          </div>
                          <span className="text-xs font-semibold text-white">
                            ₹{Math.round(form.monthlyInvestment * row.pct / 100).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Buffett Quote */}
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.15)" }}
              >
                <p className="text-xs font-semibold mb-1.5" style={{ color: "#D4AF37" }}>Buffett says for {preview.type} investors:</p>
                <p className="text-sm italic text-white">&quot;{preview.buffettAdvice}&quot;</p>
              </div>

              <button
                onClick={handleFinish}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
                style={{ background: "#22C55E", color: "#000" }}
              >
                Start Investing →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
