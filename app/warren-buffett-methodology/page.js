"use client";
import { useState } from "react";
import { useUser } from "../context/UserContext";
import AppShell from "../components/AppShell";

const principles = [
  {
    id: 1,
    icon: "🏰",
    title: "Economic Moat",
    subtitle: "Sustainable Competitive Advantage",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    quote: "In business, I look for economic castles protected by unbreachable moats.",
    description:
      "A moat is what stops competitors from eroding a company's profits. Without one, any business advantage is temporary. Buffett only buys businesses where the moat is wide, durable, and growing.",
    types: [
      { label: "Brand Power", example: "HUL, Nestle India — consumers pay premium without questioning" },
      { label: "Switching Costs", example: "TCS, Infosys — clients can't easily migrate away" },
      { label: "Network Effect", example: "BSE, NSE — more users = more value for everyone" },
      { label: "Cost Advantage", example: "Ujjivan SFB — lowest cost of operations in microfinance" },
      { label: "Regulated Asset", example: "NTPC, Power Grid — government-backed monopoly returns" },
    ],
    indianContext:
      "Asian Paints has held 50%+ market share for 30 years despite dozens of competitors. That is a moat. MRF commands a price premium in tyres purely on brand trust.",
    checkQuestion: "What would happen to this business if a well-funded competitor entered tomorrow?",
  },
  {
    id: 2,
    icon: "📈",
    title: "Return on Equity",
    subtitle: "Management's Ability to Compound Capital",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.2)",
    quote: "The best business to own is one that over an extended period can employ large amounts of incremental capital at very high rates of return.",
    description:
      "ROE measures how efficiently management turns shareholder money into profit. Buffett wants ROE consistently above 15% — not a one-year spike, but sustained over 5–10 years. High ROE with low debt is the gold standard.",
    types: [
      { label: "ROE ≥ 25%", example: "Exceptional — TCS (50%), Infosys (31%)" },
      { label: "ROE 15–25%", example: "Strong — CEAT (16.5%), HUL (22.5%)" },
      { label: "ROE 12–15%", example: "Acceptable for banks — IndusInd (14.2%)" },
      { label: "ROE < 12%", example: "Avoid — capital is being destroyed in real terms" },
    ],
    indianContext:
      "Motilal Oswal Wealth Creation Study shows that stocks with sustained ROE > 20% over 10 years delivered 4x the Nifty returns. ROE is the single best predictor of long-term wealth creation.",
    checkQuestion: "Has ROE been above 15% for each of the last 5 years, without using excessive debt?",
  },
  {
    id: 3,
    icon: "🏦",
    title: "Low Debt",
    subtitle: "Financial Strength & Flexibility",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
    quote: "I've seen more people fail because of liquor and leverage — leverage being borrowed money.",
    description:
      "Debt amplifies both gains and losses. Buffett prefers businesses that fund growth from their own earnings. A debt-free or low-debt company can survive recessions, invest counter-cyclically, and never faces existential risk from a credit crunch.",
    types: [
      { label: "D/E ≤ 0.3", example: "Ideal — TCS (0.0), Infosys (0.1), Britannia (0.1)" },
      { label: "D/E 0.3–0.7", example: "Acceptable — CEAT (0.4), Apollo Tyres (0.6)" },
      { label: "D/E 0.7–1.5", example: "Caution — monitor interest coverage carefully" },
      { label: "D/E > 1.5", example: "Avoid (except banks where leverage is structural)" },
    ],
    indianContext:
      "IL&FS, DHFL, and Yes Bank all collapsed under debt. Buffett would never have touched them. Meanwhile, TCS with zero debt sailed through every crisis and kept buying back shares.",
    checkQuestion: "Can this business survive 2 years of zero revenue using only its balance sheet?",
  },
  {
    id: 4,
    icon: "📊",
    title: "Earnings Growth",
    subtitle: "Consistent Compounding Over Time",
    color: "#A855F7",
    bg: "rgba(168,85,247,0.08)",
    border: "rgba(168,85,247,0.2)",
    quote: "Our favorite holding period is forever — but only if earnings keep compounding.",
    description:
      "Buffett wants earnings that grow predictably, not cyclically. A 5-year EPS CAGR above 12% means the business is genuinely expanding. Erratic earnings — up 40% one year, down 20% the next — signal a commodity business with no pricing power.",
    types: [
      { label: "EPS CAGR ≥ 20%", example: "Exceptional compounder — Ujjivan (35%), CEAT (21%)" },
      { label: "EPS CAGR 12–20%", example: "Strong — Infosys (12%), Apollo Tyres (18%)" },
      { label: "EPS CAGR 7–12%", example: "Moderate — acceptable if moat is strong" },
      { label: "EPS CAGR < 7%", example: "Weak — barely beating inflation" },
    ],
    indianContext:
      "Bajaj Finance compounded EPS at 35%+ for a decade. ₹1 lakh invested in 2010 became ₹85 lakhs by 2020. That is what consistent earnings growth does to wealth.",
    checkQuestion: "Has EPS grown every year for 5 years, or are there large gaps and reversals?",
  },
  {
    id: 5,
    icon: "🛡️",
    title: "Margin of Safety",
    subtitle: "Never Overpay — Even for the Best Business",
    color: "#06B6D4",
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.2)",
    quote: "Price is what you pay. Value is what you get.",
    description:
      "Even a wonderful business is a bad investment at the wrong price. Margin of safety means buying at a meaningful discount to intrinsic value — so that even if your assumptions are wrong, you don't lose money. Buffett uses PEG ratio as a quick valuation check.",
    types: [
      { label: "PEG ≤ 1.0", example: "Undervalued — strong buy territory" },
      { label: "PEG 1.0–1.5", example: "Fair value — acceptable for quality businesses" },
      { label: "PEG 1.5–2.5", example: "Slightly expensive — wait for a better entry" },
      { label: "PEG > 2.5", example: "Overvalued — avoid, story priced in" },
    ],
    indianContext:
      "In 2020 crash, Infosys fell to P/E of 14x with 12% growth — PEG of 1.17. That was a Buffett-grade entry. By 2021 it was at P/E 35x. The margin of safety window was brief.",
    checkQuestion: "Am I paying a fair price, or am I paying for optimism that may not materialise?",
  },
  {
    id: 6,
    icon: "⏳",
    title: "Long-term Thinking",
    subtitle: "Time in Market Beats Timing the Market",
    color: "#D4AF37",
    bg: "rgba(212,175,55,0.08)",
    border: "rgba(212,175,55,0.2)",
    quote: "Someone is sitting in the shade today because someone planted a tree a long time ago.",
    description:
      "Buffett's edge is not intelligence — it is patience. He holds businesses for decades, letting compounding do the work. Short-term thinking forces you to react to noise. Long-term thinking lets you ignore it. The longer your horizon, the more forgiving the market is of entry price.",
    types: [
      { label: "Horizon ≥ 10 years", example: "Ideal — compounding works exponentially" },
      { label: "Horizon 5–10 years", example: "Good — most business cycles play out" },
      { label: "Horizon 2–5 years", example: "Acceptable — but reduces margin for error" },
      { label: "Horizon < 2 years", example: "Speculation, not investing" },
    ],
    indianContext:
      "₹1 lakh in Nifty 50 in 2003 = ₹22 lakhs in 2023 (15% CAGR). The investor who held through 2008, 2011, 2015, 2018, and 2020 crashes got all of it. The one who traded in and out got a fraction.",
    checkQuestion: "Would I still want to own this business if the stock market closed for 10 years?",
  },
];

const scoringCriteria = [
  { label: "ROE", pts: 25, desc: "Sustained return on equity", color: "#22C55E" },
  { label: "Debt/Equity", pts: 20, desc: "Financial strength", color: "#3B82F6" },
  { label: "Earnings Growth", pts: 20, desc: "5-year EPS CAGR", color: "#A855F7" },
  { label: "Valuation (PEG)", pts: 15, desc: "P/E vs growth rate", color: "#06B6D4" },
  { label: "Promoter Holding", pts: 10, desc: "Skin in the game", color: "#F59E0B" },
  { label: "Revenue Growth", pts: 10, desc: "Business expansion", color: "#F97316" },
];

const ratingBands = [
  { range: "80–100", label: "Strong Buy", color: "#22C55E", bg: "rgba(34,197,94,0.1)", desc: "Exceptional business at a fair price" },
  { range: "65–79", label: "Buy", color: "#3B82F6", bg: "rgba(59,130,246,0.1)", desc: "Good business, worth accumulating" },
  { range: "50–64", label: "Hold", color: "#F59E0B", bg: "rgba(245,158,11,0.1)", desc: "Decent but not compelling" },
  { range: "0–49", label: "Avoid", color: "#DC2626", bg: "rgba(220,38,38,0.1)", desc: "Does not meet Buffett's standards" },
];

const investorGuidance = {
  Conservative: {
    focus: ["Low Debt", "Margin of Safety", "Long-term Thinking"],
    avoid: "High-growth stocks with P/E > 20x",
    strategy: "Focus on dividend-paying large-caps with ROE > 15% and D/E < 0.5. FMCG and Power sectors suit you best.",
    color: "#3B82F6",
  },
  Balanced: {
    focus: ["Economic Moat", "Return on Equity", "Earnings Growth"],
    avoid: "Speculative micro-caps and high-debt cyclicals",
    strategy: "Mix of quality large-caps and select mid-caps. Look for PEG ≤ 1.5 with ROE > 18%. IT and FMCG are your core.",
    color: "#F59E0B",
  },
  "Wealth Builder": {
    focus: ["Return on Equity", "Earnings Growth", "Economic Moat"],
    avoid: "Low-ROE businesses and dividend traps",
    strategy: "Long-horizon compounders with ROE > 20% and EPS CAGR > 15%. Banking and IT quality names. Hold for 7–10 years.",
    color: "#A855F7",
  },
  "Aggressive Growth": {
    focus: ["Earnings Growth", "Economic Moat", "Return on Equity"],
    avoid: "Slow-growth defensives and low-ROE value traps",
    strategy: "High-conviction bets on quality compounders. PEG up to 2x acceptable if moat is wide and growth is 20%+. Microfinance and mid-cap IT.",
    color: "#22C55E",
  },
};

const INIT_FORM = {
  q1: "", q2: "", q3: "",
  q4: "", q5: "",
  roe: "", ownerEarnings: "", profitMargins: "",
  intrinsicValue: "", q10: "",
};

function calcAssessmentScore(f) {
  const yesPartialNo = (v) => v === "Yes" ? 10 : v === "Partially" ? 5 : 0;
  const business = yesPartialNo(f.q1) + yesPartialNo(f.q2) + yesPartialNo(f.q3);
  const management = yesPartialNo(f.q4) + yesPartialNo(f.q5);
  const roe = Number(f.roe);
  const roeScore = roe >= 20 ? 15 : roe >= 15 ? 10 : roe >= 10 ? 5 : 0;
  const pm = Number(f.profitMargins);
  const pmScore = pm >= 20 ? 15 : pm >= 15 ? 10 : pm >= 10 ? 5 : 0;
  const financial = roeScore + pmScore;
  const valueScore = f.q10 === "Yes" ? 20 : f.q10 === "Not Sure" ? 10 : 0;
  const total = business + management + financial + valueScore;
  return {
    total,
    breakdown: [
      { label: "Business Tenets", score: business, max: 30, color: "#22C55E" },
      { label: "Management Tenets", score: management, max: 20, color: "#3B82F6" },
      { label: "Financial Tenets", score: financial, max: 30, color: "#A855F7" },
      { label: "Value Tenets", score: valueScore, max: 20, color: "#F59E0B" },
    ],
    rating: total >= 80 ? "Strong Buy" : total >= 65 ? "Buy" : total >= 50 ? "Hold" : "Avoid",
    ratingColor: total >= 80 ? "#22C55E" : total >= 65 ? "#3B82F6" : total >= 50 ? "#F59E0B" : "#DC2626",
    ratingBg: total >= 80 ? "rgba(34,197,94,0.1)" : total >= 65 ? "rgba(59,130,246,0.1)" : total >= 50 ? "rgba(245,158,11,0.1)" : "rgba(220,38,38,0.1)",
    advice: total >= 80
      ? "This company passes Buffett's core tests. Strong business fundamentals, trustworthy management, healthy financials, and available at a discount. Worth serious consideration."
      : total >= 65
      ? "A good business with most Buffett criteria met. Minor concerns exist — review the weaker areas before committing capital."
      : total >= 50
      ? "Mediocre on Buffett's checklist. Hold if already owned, but not a compelling new investment at this time."
      : "This company fails multiple Buffett criteria. Avoid until fundamentals improve significantly.",
  };
}

const fieldStyle = {
  background: "#1C2128",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#ffffff",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "13px",
  width: "100%",
  outline: "none",
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: "500",
  color: "#A1A1AA",
  display: "block",
  marginBottom: "6px",
};

function SectionCard({ title, icon, color, bg, border, children }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#161B22", border: `1px solid ${border}` }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: bg }}>
        <span className="text-lg">{icon}</span>
        <p className="text-sm font-semibold" style={{ color }}>{title}</p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function DropdownField({ label, value, onChange, options }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...fieldStyle, cursor: "pointer" }}
        onFocus={(e) => { e.target.style.borderColor = "rgba(34,197,94,0.5)"; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
      >
        <option value="" style={{ background: "#1C2128" }}>Select an answer</option>
        {options.map((o) => <option key={o} value={o} style={{ background: "#1C2128" }}>{o}</option>)}
      </select>
    </div>
  );
}

function NumberField({ label, value, onChange, placeholder, prefix, suffix }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#A1A1AA" }}>{prefix}</span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...fieldStyle, paddingLeft: prefix ? "28px" : "14px", paddingRight: suffix ? "36px" : "14px" }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(34,197,94,0.5)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#A1A1AA" }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}

export default function WarrenBuffettMethodology() {
  const { profile } = useUser();
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState("principles");
  const [form, setForm] = useState(INIT_FORM);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  function handleAnalyze() {
    const missing = [];
    if (!form.q1) missing.push("Q1: Simple & understandable");
    if (!form.q2) missing.push("Q2: Consistent operating history");
    if (!form.q3) missing.push("Q3: Favorable long-term prospects");
    if (!form.q4) missing.push("Q4: Rational management");
    if (!form.q5) missing.push("Q5: Candid with shareholders");
    if (!form.roe) missing.push("ROE (%)");
    if (!form.ownerEarnings) missing.push("Owner Earnings");
    if (!form.profitMargins) missing.push("Profit Margins (%)");
    if (!form.intrinsicValue) missing.push("Intrinsic Value");
    if (!form.q10) missing.push("Q10: Discount to intrinsic value");
    if (missing.length > 0) { setErrors(missing); setResult(null); return; }
    setErrors([]);
    setResult(calcAssessmentScore(form));
  }

  function handleReset() {
    setForm(INIT_FORM);
    setResult(null);
    setErrors([]);
  }

  const guidance = profile ? investorGuidance[profile.investor.type] : null;

  return (
    <AppShell
      pageTitle="Warren Buffett Methodology"
      pageSubtitle="The 6 principles behind the 100-point Secret Sauce scoring engine"
    >
      <div className="px-6 py-6 max-w-5xl mx-auto space-y-6">

        {/* Hero Quote */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl flex-shrink-0" style={{ color: "#D4AF37" }}>&ldquo;</span>
            <div>
              <p className="text-base leading-relaxed italic text-white">
                It&apos;s far better to buy a wonderful company at a fair price than a fair company at a wonderful price.
              </p>
              <p className="text-sm mt-3 font-semibold" style={{ color: "#D4AF37" }}>— Warren Buffett</p>
              <p className="text-xs mt-1" style={{ color: "#A1A1AA" }}>
                The foundation of every scoring decision in this platform.
              </p>
            </div>
          </div>
        </div>

        {/* Personalised Guidance Banner */}
        {guidance && (
          <div
            className="rounded-xl p-5"
            style={{ background: `${guidance.color}0D`, border: `1px solid ${guidance.color}30` }}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{profile.investor.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white mb-1">
                  Buffett&apos;s methodology for {profile.investor.type} investors
                </p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: "#A1A1AA" }}>
                  {guidance.strategy}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-medium" style={{ color: "#A1A1AA" }}>Focus on:</span>
                  {guidance.focus.map((f) => (
                    <span
                      key={f}
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${guidance.color}18`, color: guidance.color }}
                    >
                      {f}
                    </span>
                  ))}
                  <span className="text-xs font-medium ml-2" style={{ color: "#A1A1AA" }}>Avoid:</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(220,38,38,0.1)", color: "#DC2626" }}
                  >
                    {guidance.avoid}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: "principles", label: "6 Core Principles" },
            { id: "scoring", label: "100-Point Formula" },
            { id: "assessment", label: "Assess a Company" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.id ? "#22C55E" : "rgba(255,255,255,0.04)",
                color: activeTab === tab.id ? "#000" : "#A1A1AA",
                border: `1px solid ${activeTab === tab.id ? "transparent" : "rgba(255,255,255,0.07)"}`,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Principles Tab */}
        {activeTab === "principles" && (
          <div className="space-y-3">
            {principles.map((p) => {
              const isExpanded = expanded === p.id;
              const isRelevant = guidance && guidance.focus.includes(p.title);
              return (
                <div
                  key={p.id}
                  className="rounded-xl overflow-hidden transition-all duration-200"
                  style={{
                    background: "#161B22",
                    border: `1px solid ${isExpanded ? p.border : "rgba(255,255,255,0.07)"}`,
                  }}
                >
                  <button
                    className="w-full text-left p-5"
                    onClick={() => setExpanded(isExpanded ? null : p.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ background: p.bg }}
                        >
                          {p.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-white text-sm">
                              Principle {p.id} — {p.title}
                            </span>
                            {isRelevant && (
                              <span
                                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}
                              >
                                ✓ Key for You
                              </span>
                            )}
                          </div>
                          <p className="text-xs" style={{ color: "#A1A1AA" }}>{p.subtitle}</p>
                        </div>
                      </div>
                      <span className="text-sm flex-shrink-0" style={{ color: "#A1A1AA" }}>
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>

                    {/* Quote preview */}
                    <div
                      className="mt-3 pl-4 py-2"
                      style={{ borderLeft: `2px solid ${p.color}60` }}
                    >
                      <p className="text-sm italic leading-relaxed" style={{ color: "#A1A1AA" }}>
                        &quot;{p.quote}&quot;
                      </p>
                    </div>
                  </button>

                  {isExpanded && (
                    <div
                      className="p-5 space-y-5"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
                    >
                      {/* Description */}
                      <p className="text-sm leading-relaxed text-white">{p.description}</p>

                      {/* Tiers */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#A1A1AA" }}>
                          How to evaluate
                        </p>
                        <div className="space-y-2">
                          {p.types.map((t, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-3 rounded-lg p-3"
                              style={{ background: "rgba(255,255,255,0.03)" }}
                            >
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                                style={{ background: p.bg, color: p.color }}
                              >
                                {t.label}
                              </span>
                              <p className="text-xs" style={{ color: "#A1A1AA" }}>{t.example}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Indian Context */}
                      <div
                        className="rounded-xl p-4"
                        style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.15)" }}
                      >
                        <p className="text-xs font-semibold mb-2" style={{ color: "#D4AF37" }}>
                          🇮🇳 Indian Market Context
                        </p>
                        <p className="text-sm leading-relaxed text-white">{p.indianContext}</p>
                      </div>

                      {/* Check Question */}
                      <div
                        className="rounded-xl p-4"
                        style={{ background: p.bg, border: `1px solid ${p.border}` }}
                      >
                        <p className="text-xs font-semibold mb-1" style={{ color: p.color }}>
                          Buffett&apos;s Check Question
                        </p>
                        <p className="text-sm italic text-white">{p.checkQuestion}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Assessment Tab */}
        {activeTab === "assessment" && (
          <div className="space-y-5">

            {/* Section 1 */}
            <SectionCard title="Section 1 — Business Tenets" icon="🏢" color="#22C55E" bg="rgba(34,197,94,0.06)" border="rgba(34,197,94,0.15)">
              <DropdownField label="1. Is the business simple and understandable?" value={form.q1} onChange={(v) => set("q1", v)} options={["Yes", "Partially", "No"]} />
              <DropdownField label="2. Does the business have a consistent operating history?" value={form.q2} onChange={(v) => set("q2", v)} options={["Yes", "Partially", "No"]} />
              <DropdownField label="3. Does the business have favorable long-term prospects?" value={form.q3} onChange={(v) => set("q3", v)} options={["Yes", "Partially", "No"]} />
            </SectionCard>

            {/* Section 2 */}
            <SectionCard title="Section 2 — Management Tenets" icon="👔" color="#3B82F6" bg="rgba(59,130,246,0.06)" border="rgba(59,130,246,0.15)">
              <DropdownField label="4. Is management rational?" value={form.q4} onChange={(v) => set("q4", v)} options={["Yes", "Partially", "No"]} />
              <DropdownField label="5. Is management candid with shareholders?" value={form.q5} onChange={(v) => set("q5", v)} options={["Yes", "Partially", "No"]} />
            </SectionCard>

            {/* Section 3 */}
            <SectionCard title="Section 3 — Financial Tenets" icon="📊" color="#A855F7" bg="rgba(168,85,247,0.06)" border="rgba(168,85,247,0.15)">
              <NumberField label="6. Return on Equity (ROE)" value={form.roe} onChange={(v) => set("roe", v)} placeholder="e.g. 18" suffix="%" />
              <NumberField label="7. Owner Earnings (₹)" value={form.ownerEarnings} onChange={(v) => set("ownerEarnings", v)} placeholder="e.g. 25000000" prefix="₹" />
              <NumberField label="8. Profit Margins" value={form.profitMargins} onChange={(v) => set("profitMargins", v)} placeholder="e.g. 22" suffix="%" />
            </SectionCard>

            {/* Section 4 */}
            <SectionCard title="Section 4 — Value Tenets" icon="💰" color="#F59E0B" bg="rgba(245,158,11,0.06)" border="rgba(245,158,11,0.15)">
              <NumberField label="9. Intrinsic Value (₹)" value={form.intrinsicValue} onChange={(v) => set("intrinsicValue", v)} placeholder="e.g. 3200" prefix="₹" />
              <DropdownField label="10. Can the company be purchased at a significant discount to its intrinsic value?" value={form.q10} onChange={(v) => set("q10", v)} options={["Yes", "No", "Not Sure"]} />
            </SectionCard>

            {/* Validation Errors */}
            {errors.length > 0 && (
              <div className="rounded-xl p-4" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#DC2626" }}>Please fill in all required fields:</p>
                <ul className="space-y-1">
                  {errors.map((e) => (
                    <li key={e} className="text-xs flex items-center gap-2" style={{ color: "#A1A1AA" }}>
                      <span style={{ color: "#DC2626" }}>✕</span> {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Analyze Button */}
            <div className="flex gap-3">
              <button
                onClick={handleAnalyze}
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: "#22C55E", color: "#000" }}
              >
                Analyze Company →
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.06)", color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Reset
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className="space-y-4">

                {/* Score + Rating */}
                <div
                  className="rounded-xl p-6"
                  style={{ background: result.ratingBg, border: `1px solid ${result.ratingColor}30` }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#A1A1AA" }}>Buffett Score</p>
                      <p className="text-5xl font-bold" style={{ color: result.ratingColor }}>{result.total}<span className="text-xl text-white">/100</span></p>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-lg font-bold px-4 py-2 rounded-xl"
                        style={{ background: result.ratingBg, color: result.ratingColor, border: `1px solid ${result.ratingColor}40` }}
                      >
                        {result.rating}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed mt-4 text-white">{result.advice}</p>
                </div>

                {/* Score Breakdown */}
                <div
                  className="rounded-xl p-5"
                  style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#A1A1AA" }}>Score Breakdown</p>
                  <div className="space-y-3">
                    {result.breakdown.map((b) => (
                      <div key={b.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-white">{b.label}</span>
                          <span className="text-sm font-bold" style={{ color: b.color }}>{b.score}/{b.max}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${(b.score / b.max) * 100}%`, background: b.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#22C55E" }}>✓ Strengths</p>
                    <ul className="space-y-2">
                      {result.breakdown.filter((b) => b.score / b.max >= 0.6).length === 0
                        ? <li className="text-xs" style={{ color: "#A1A1AA" }}>No strong areas identified</li>
                        : result.breakdown.filter((b) => b.score / b.max >= 0.6).map((b) => (
                          <li key={b.label} className="flex items-center gap-2 text-xs text-white">
                            <span style={{ color: "#22C55E" }}>→</span> {b.label} ({b.score}/{b.max})
                          </li>
                        ))
                      }
                    </ul>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.15)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#DC2626" }}>✕ Weaknesses</p>
                    <ul className="space-y-2">
                      {result.breakdown.filter((b) => b.score / b.max < 0.6).length === 0
                        ? <li className="text-xs" style={{ color: "#A1A1AA" }}>No weak areas — excellent!</li>
                        : result.breakdown.filter((b) => b.score / b.max < 0.6).map((b) => (
                          <li key={b.label} className="flex items-center gap-2 text-xs text-white">
                            <span style={{ color: "#DC2626" }}>→</span> {b.label} ({b.score}/{b.max})
                          </li>
                        ))
                      }
                    </ul>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* Scoring Tab */}
        {activeTab === "scoring" && (
          <div className="space-y-5">

            {/* Score Bar Breakdown */}
            <div
              className="rounded-xl p-5"
              style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#A1A1AA" }}>
                How the 100-point score is calculated
              </p>
              <div className="space-y-4">
                {scoringCriteria.map((c) => (
                  <div key={c.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-sm font-semibold text-white">{c.label}</span>
                        <span className="text-xs ml-2" style={{ color: "#A1A1AA" }}>{c.desc}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: c.color }}>{c.pts} pts</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${c.pts}%`, background: c.color }}
                      />
                    </div>
                  </div>
                ))}
                <div
                  className="flex justify-between items-center pt-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span className="text-sm font-semibold" style={{ color: "#A1A1AA" }}>Total</span>
                  <span className="text-lg font-bold text-white">100 pts</span>
                </div>
              </div>
            </div>

            {/* Rating Bands */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#A1A1AA" }}>
                Rating bands
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ratingBands.map((r) => (
                  <div
                    key={r.label}
                    className="rounded-xl p-4"
                    style={{ background: r.bg, border: `1px solid ${r.color}30` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-bold" style={{ color: r.color }}>{r.label}</span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}
                      >
                        {r.range}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: "#A1A1AA" }}>{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Scoring Notes */}
            <div
              className="rounded-xl p-5"
              style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#D4AF37" }}>
                Important scoring notes
              </p>
              <ul className="space-y-2">
                {[
                  "Banking and Microfinance stocks use adjusted D/E thresholds — high leverage is structural, not a red flag.",
                  "ROE threshold for banks is 12% vs 15% for non-financial companies.",
                  "PEG ratio is calculated as P/E ÷ 5-year EPS CAGR. A PEG of 1 means you are paying exactly for the growth.",
                  "Promoter holding above 50% signals management conviction — they have skin in the game.",
                  "A score of 80+ does not guarantee returns — it means the business quality is exceptional at current price.",
                ].map((note, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "#A1A1AA" }}>
                    <span className="flex-shrink-0 mt-0.5" style={{ color: "#D4AF37" }}>→</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
