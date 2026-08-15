import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import AppShell from "../components/AppShell";
import CosmicBackground from "../components/CosmicBackground";
import GlassCard from "../components/GlassCard";
import AnimatedNumber from "../components/AnimatedNumber";
import TypewriterText from "../components/TypewriterText";
import ErrorCard from "../components/ErrorCard";

const SCENARIOS = [
  { id: "market_crash_20", label: "Market crash", icon: "📉" },
  { id: "rate_hike_200bps", label: "Rate hike", icon: "📊" },
  { id: "currency_shock_15", label: "FX shock", icon: "💱" },
  { id: "liquidity_crunch", label: "Liquidity crunch", icon: "🏦" },
  { id: "custom", label: "Custom", icon: "⚙️" },
];

function RiskScoreArc({ score, size = 160 }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 1200;
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const offset = circumference - (animatedScore / 100) * circumference;
  const color = animatedScore <= 40 ? "#10b981" : animatedScore <= 70 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke 0.5s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: "36px", fontWeight: 700, color }}>{animatedScore}</span>
        <span style={{ fontSize: "11px", color: "#64748b", marginTop: "-4px" }}>Risk score</span>
      </div>
    </div>
  );
}

function MeteorTransition({ active }) {
  if (!active) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50, pointerEvents: "none",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        width: "200px", height: "2px",
        background: "linear-gradient(90deg, transparent, #7c3aed, #06b6d4, transparent)",
        top: "30%", left: "-200px",
        animation: "meteorStrike 0.8s ease-out forwards",
        boxShadow: "0 0 20px rgba(124,58,237,0.6), 0 0 60px rgba(6,182,212,0.3)",
      }} />
      <style>{`
        @keyframes meteorStrike {
          0% { left: -200px; top: 10%; opacity: 1; }
          100% { left: calc(100% + 200px); top: 60%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function RiskRadarPage() {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [customParams, setCustomParams] = useState({ equityShock: -15, bondShock: -5, goldShock: 5 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [meteorActive, setMeteorActive] = useState(false);
  const [shakeActive, setShakeActive] = useState(false);
  const [showNarrative, setShowNarrative] = useState(false);
  const [showMitigations, setShowMitigations] = useState([]);
  const riskScore = result ? Math.min(100, Math.round(Math.abs(result.totalImpactPercent) * 3.5 + 30)) : 42;

  async function runSimulation() {
    if (!selectedScenario) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setMeteorActive(true);
    setShowNarrative(false);
    setShowMitigations([]);

    try {
      const res = await fetch("/api/risk/stress-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: selectedScenario,
          customParams: selectedScenario === "custom" ? customParams : undefined,
          holdings: [],
        }),
      });

      if (!res.ok) throw new Error("Simulation failed");
      const data = await res.json();

      setTimeout(() => {
        setMeteorActive(false);
        setResult(data);
        setShakeActive(true);
        setTimeout(() => setShakeActive(false), 400);
        setTimeout(() => setShowNarrative(true), 500);
        // Stagger mitigations
        (data.mitigations || []).forEach((_, i) => {
          setTimeout(() => setShowMitigations((prev) => [...prev, i]), 800 + i * 300);
        });
      }, 800);
    } catch (err) {
      setMeteorActive(false);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const chartData = result?.holdings?.map((h) => ({
    name: h.name,
    before: h.before,
    after: h.after,
    impact: h.impact,
  })) || [];

  return (
    <AppShell pageTitle="Risk radar" pageSubtitle="Portfolio stress testing & simulation">
      <CosmicBackground />
      <MeteorTransition active={meteorActive} />
      <div style={{ position: "relative", zIndex: 1, padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>

        {/* Top: Risk Score + Scenario Selector */}
        <div style={{ display: "flex", gap: "24px", marginBottom: "24px", alignItems: "start", flexWrap: "wrap" }}>
          <GlassCard delay={0} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 32px" }}>
            <RiskScoreArc score={riskScore} />
          </GlassCard>

          <div style={{ flex: 1, minWidth: "300px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              Select scenario
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedScenario(s.id)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "24px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: selectedScenario === s.id ? "1px solid rgba(124,58,237,0.5)" : "1px solid rgba(255,255,255,0.1)",
                    background: selectedScenario === s.id ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                    color: selectedScenario === s.id ? "#a78bfa" : "#94a3b8",
                  }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {/* Custom Shock Panel */}
            {selectedScenario === "custom" && (
              <GlassCard delay={0} style={{ marginBottom: "16px", padding: "16px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "12px" }}>Custom shock parameters</p>
                {[
                  { key: "equityShock", label: "Equity shock %" },
                  { key: "bondShock", label: "Bond shock %" },
                  { key: "goldShock", label: "Gold shock %" },
                ].map((param) => (
                  <div key={param.key} style={{ marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>{param.label}</span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: customParams[param.key] < 0 ? "#ef4444" : "#10b981" }}>
                        {customParams[param.key]}%
                      </span>
                    </div>
                    <input
                      type="range" min="-50" max="50" step="1"
                      value={customParams[param.key]}
                      onChange={(e) => setCustomParams((p) => ({ ...p, [param.key]: Number(e.target.value) }))}
                      style={{ width: "100%", accentColor: "#7c3aed" }}
                    />
                  </div>
                ))}
              </GlassCard>
            )}

            <button
              onClick={runSimulation}
              disabled={!selectedScenario || loading}
              style={{
                padding: "12px 28px",
                borderRadius: "12px",
                background: !selectedScenario || loading ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                border: "none",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: !selectedScenario || loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Running simulation...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Run simulation
                </>
              )}
            </button>
          </div>
        </div>

        {error && <ErrorCard message={error} onRetry={runSimulation} />}

        {/* Results */}
        {result && (
          <div>
            {/* Impact Chart + Narrative */}
            <div style={{ display: "grid", gridTemplateColumns: "55% 1fr", gap: "20px", marginBottom: "20px" }}>

              {/* Chart */}
              <GlassCard delay={0} style={{ padding: "20px", animation: shakeActive ? "shake 0.4s ease" : undefined }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9", marginBottom: "16px" }}>Impact by holding</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                    />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} width={80} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10,10,20,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "10px",
                        color: "#f1f5f9",
                        fontSize: "12px",
                      }}
                      formatter={(val) => `₹${val.toLocaleString("en-IN")}`}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", color: "#64748b" }} />
                    <Bar dataKey="before" name="Before" fill="#475569" radius={[0, 4, 4, 0]} animationDuration={800} />
                    <Bar dataKey="after" name="After" radius={[0, 4, 4, 0]} animationDuration={1200}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.impact < 0 ? "#ef4444" : "#10b981"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>

              {/* Narrative + Mitigations */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {showNarrative && (
                  <GlassCard delay={0} style={{ borderLeft: "3px solid #7c3aed" }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#a78bfa", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      AI risk narrative
                    </p>
                    <TypewriterText
                      text={result.narrative}
                      speed={18}
                      style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: 1.7 }}
                    />
                  </GlassCard>
                )}

                {result.mitigations?.map((action, i) => (
                  showMitigations.includes(i) && (
                    <GlassCard key={i} delay={0} style={{
                      borderLeft: "3px solid #06b6d4",
                      padding: "14px 16px",
                      animation: "fadeUp 0.4s ease both",
                    }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                        <div style={{
                          width: "20px", height: "20px", borderRadius: "6px",
                          background: "rgba(6,182,212,0.15)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, marginTop: "1px",
                        }}>
                          <span style={{ fontSize: "10px", color: "#06b6d4", fontWeight: 700 }}>{i + 1}</span>
                        </div>
                        <p style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: 1.5 }}>{action}</p>
                      </div>
                    </GlassCard>
                  )
                ))}
              </div>
            </div>

            {/* Total Impact Summary */}
            <GlassCard delay={300} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "40px", padding: "24px" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>Total impact</p>
                <p style={{ fontSize: "28px", fontWeight: 700, color: result.totalImpact < 0 ? "#ef4444" : "#10b981" }}>
                  <AnimatedNumber
                    value={Math.abs(result.totalImpact)}
                    prefix={result.totalImpact < 0 ? "-₹" : "+₹"}
                    duration={1200}
                  />
                </p>
              </div>
              <div style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.1)" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>Percent change</p>
                <p style={{ fontSize: "28px", fontWeight: 700, color: result.totalImpactPercent < 0 ? "#ef4444" : "#10b981" }}>
                  <AnimatedNumber
                    value={Math.abs(result.totalImpactPercent)}
                    prefix={result.totalImpactPercent < 0 ? "-" : "+"}
                    suffix="%"
                    decimals={2}
                    duration={1200}
                    formatIndian={false}
                  />
                </p>
              </div>
              <div style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.1)" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>Est. recovery</p>
                <p style={{ fontSize: "28px", fontWeight: 700, color: "#f59e0b" }}>
                  <AnimatedNumber value={result.recoveryEstimateDays} suffix=" days" duration={1000} formatIndian={false} />
                </p>
              </div>
            </GlassCard>
          </div>
        )}

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-4px); }
            40% { transform: translateX(4px); }
            60% { transform: translateX(-3px); }
            80% { transform: translateX(2px); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </AppShell>
  );
}
