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
  { value: "wealth", label: "💰 Wealth Creation", desc: "Grow money over long term" },
  { value: "retirement", label: "🏖️ Retirement Planning", desc: "Secure my future" },
  { value: "house", label: "🏠 Buy a House", desc: "Save for property" },
  { value: "education", label: "🎓 Child's Education", desc: "Fund education goals" },
  { value: "income", label: "📈 Regular Income", desc: "Dividends & passive income" },
];

const riskOptions = [
  { value: "low", label: "🛡️ Low", desc: "I hate losing money" },
  { value: "medium", label: "⚖️ Medium", desc: "Some ups and downs are ok" },
  { value: "high", label: "🚀 High", desc: "I can handle big swings for big gains" },
];

const typeColors = {
  Conservative: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", badge: "bg-blue-100 text-blue-700" },
  "Aggressive Growth": { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", badge: "bg-green-100 text-green-700" },
  "Wealth Builder": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", badge: "bg-purple-100 text-purple-700" },
  Balanced: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", badge: "bg-amber-100 text-amber-700" },
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
  const colors = preview ? typeColors[preview.type] : {};

  function handleFinish() {
    saveProfile({ ...form, age: Number(form.age), horizon: Number(form.horizon), monthlyInvestment: Number(form.monthlyInvestment), monthlyIncome: Number(form.monthlyIncome), existingPortfolio: Number(form.existingPortfolio) });
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Progress Bar */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex gap-2 mb-6">
            {steps.map((s, i) => (
              <div key={s.id} className={`flex-1 h-1.5 rounded-full transition-all ${i <= step ? "bg-blue-600" : "bg-gray-200"}`} />
            ))}
          </div>
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-widest">{steps[step].subtitle}</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">{steps[step].title}</h2>
        </div>

        <div className="px-8 pb-8">
          {/* Step 0 — Basic Info */}
          {step === 0 && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Your Name</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Rahul Sharma" className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Age</label>
                <input type="number" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="e.g. 28" className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Occupation</label>
                <select value={form.occupation} onChange={(e) => set("occupation", e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">Select occupation</option>
                  <option value="salaried">Salaried Employee</option>
                  <option value="business">Business Owner</option>
                  <option value="freelancer">Freelancer / Self-Employed</option>
                  <option value="student">Student</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
              <button disabled={!form.name || !form.age || !form.occupation} onClick={() => setStep(1)} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold mt-2 disabled:opacity-40 hover:bg-blue-700 transition-colors">
                Continue →
              </button>
            </div>
          )}

          {/* Step 1 — Financial Info */}
          {step === 1 && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Monthly Income (₹)</label>
                <input type="number" value={form.monthlyIncome} onChange={(e) => set("monthlyIncome", e.target.value)} placeholder="e.g. 80000" className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Monthly Investment Budget (₹)</label>
                <p className="text-xs text-gray-400 mb-1">How much can you invest each month?</p>
                <input type="number" value={form.monthlyInvestment} onChange={(e) => set("monthlyInvestment", e.target.value)} placeholder="e.g. 15000" className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                {form.monthlyIncome && form.monthlyInvestment && (
                  <p className="text-xs mt-1 text-blue-600 font-medium">
                    You are investing {Math.round((form.monthlyInvestment / form.monthlyIncome) * 100)}% of income
                    {(form.monthlyInvestment / form.monthlyIncome) >= 0.2 ? " 🎯 Great!" : " — Buffett recommends saving at least 20%"}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Existing Portfolio Value (₹)</label>
                <p className="text-xs text-gray-400 mb-1">Total current investments (0 if none)</p>
                <input type="number" value={form.existingPortfolio} onChange={(e) => set("existingPortfolio", e.target.value)} placeholder="e.g. 200000" className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(0)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50">← Back</button>
                <button disabled={!form.monthlyIncome || !form.monthlyInvestment} onClick={() => setStep(2)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors">Continue →</button>
              </div>
            </div>
          )}

          {/* Step 2 — Goals & Risk */}
          {step === 2 && (
            <div className="space-y-5 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Primary Investment Goal</label>
                <div className="grid grid-cols-1 gap-2">
                  {goalOptions.map((g) => (
                    <button key={g.value} onClick={() => set("goal", g.value)} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${form.goal === g.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <span className="text-xl">{g.label.split(" ")[0]}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{g.label.substring(3)}</p>
                        <p className="text-xs text-gray-400">{g.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Risk Appetite</label>
                <div className="grid grid-cols-3 gap-2">
                  {riskOptions.map((r) => (
                    <button key={r.value} onClick={() => set("riskAppetite", r.value)} className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-center transition-all ${form.riskAppetite === r.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <span className="text-xl">{r.label.split(" ")[0]}</span>
                      <p className="text-xs font-medium text-gray-700">{r.label.substring(3)}</p>
                      <p className="text-xs text-gray-400">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Investment Horizon (years)</label>
                <input type="number" value={form.horizon} onChange={(e) => set("horizon", e.target.value)} placeholder="e.g. 10" className="mt-1 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50">← Back</button>
                <button disabled={!form.goal || !form.riskAppetite || !form.horizon} onClick={() => setStep(3)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors">See My Profile →</button>
              </div>
            </div>
          )}

          {/* Step 3 — Result */}
          {step === 3 && preview && (
            <div className="mt-4">
              <div className={`rounded-xl border p-5 mb-5 ${colors.bg} ${colors.border}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{preview.icon}</span>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">You are a</p>
                    <h3 className={`text-xl font-bold ${colors.text}`}>{preview.type} Investor</h3>
                  </div>
                </div>
                <p className={`text-sm mb-4 ${colors.text}`}>{preview.desc}</p>

                {/* Allocation */}
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Recommended Allocation</p>
                <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-2">
                  <div className="bg-blue-500" style={{ width: `${preview.allocation.equity}%` }} />
                  <div className="bg-gray-300" style={{ width: `${preview.allocation.debt}%` }} />
                  <div className="bg-yellow-400" style={{ width: `${preview.allocation.gold}%` }} />
                </div>
                <div className="flex gap-4 text-xs text-gray-600">
                  <span>🔵 Equity {preview.allocation.equity}%</span>
                  <span>⚪ Debt {preview.allocation.debt}%</span>
                  <span>🟡 Gold {preview.allocation.gold}%</span>
                </div>

                {/* Monthly Budget Breakdown */}
                {form.monthlyInvestment && (
                  <div className="mt-4 pt-4 border-t border-current/10">
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Monthly ₹{Number(form.monthlyInvestment).toLocaleString()} split</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs"><span>📊 Equity</span><span className="font-semibold">₹{Math.round(form.monthlyInvestment * preview.allocation.equity / 100).toLocaleString()}</span></div>
                      <div className="flex justify-between text-xs"><span>🏦 Debt/FD</span><span className="font-semibold">₹{Math.round(form.monthlyInvestment * preview.allocation.debt / 100).toLocaleString()}</span></div>
                      <div className="flex justify-between text-xs"><span>🪙 Gold/SGB</span><span className="font-semibold">₹{Math.round(form.monthlyInvestment * preview.allocation.gold / 100).toLocaleString()}</span></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Buffett Quote for their type */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                <p className="text-xs text-amber-600 font-semibold mb-1">💬 Buffett says for {preview.type} investors:</p>
                <p className="text-sm text-amber-800 italic">&quot;{preview.buffettAdvice}&quot;</p>
              </div>

              <button onClick={handleFinish} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-base hover:bg-blue-700 transition-colors">
                🎯 Let&apos;s Start Investing →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
