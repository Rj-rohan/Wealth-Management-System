import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea,
} from "recharts";
import AppShell from "../components/AppShell";
import CosmicBackground from "../components/CosmicBackground";
import GlassCard from "../components/GlassCard";
import AnimatedNumber from "../components/AnimatedNumber";
import TypewriterText from "../components/TypewriterText";
import ShimmerLoader from "../components/ShimmerLoader";
import ErrorCard from "../components/ErrorCard";

function formatCurrency(val) {
  if (Math.abs(val) >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function TreasuryAutopilotPage() {
  const [forecast, setForecast] = useState(null);
  const [narrative, setNarrative] = useState(null);
  const [loading, setLoading] = useState(true);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/treasury/forecast?days=90");
      if (!res.ok) throw new Error("Failed to load forecast");
      const data = await res.json();
      setForecast(data);

      // Fetch narrative
      setNarrativeLoading(true);
      try {
        const narRes = await fetch("/api/treasury/narrative", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ forecastData: data }),
        });
        if (narRes.ok) {
          const narData = await narRes.json();
          setNarrative(narData);
        }
      } catch {
        // Narrative is optional
      } finally {
        setNarrativeLoading(false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  // Prepare chart data (sample every 3rd day for readability)
  const chartData = forecast?.projections?.filter((_, i) => i % 3 === 0 || i === forecast.projections.length - 1).map((p) => ({
    date: formatDateShort(p.date),
    fullDate: p.date,
    cash: p.projectedCash,
    confidence: p.confidence,
  })) || [];

  // Find shortfall zones for ReferenceArea
  const shortfallZones = [];
  if (forecast?.shortfallDates?.length > 0) {
    let start = forecast.shortfallDates[0];
    let prev = start;
    for (let i = 1; i <= forecast.shortfallDates.length; i++) {
      const current = forecast.shortfallDates[i];
      if (current && new Date(current) - new Date(prev) <= 86400000 * 4) {
        prev = current;
      } else {
        shortfallZones.push({ start: formatDateShort(start), end: formatDateShort(prev) });
        start = current;
        prev = current;
      }
    }
  }

  return (
    <AppShell pageTitle="Treasury autopilot" pageSubtitle="AI-powered cash flow forecasting">
      <CosmicBackground />
      <div style={{ position: "relative", zIndex: 1, padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Current cash", value: forecast?.currentCash || 0, color: "#f1f5f9", delay: 0 },
            { label: "Projected cash (90 days)", value: forecast?.projectedCash90d || 0, color: "#06b6d4", delay: 80 },
            { label: "Idle cash available", value: forecast?.idleCashAmount || 0, color: "#10b981", delay: 160 },
          ].map((kpi) => (
            <GlassCard key={kpi.label} delay={kpi.delay}>
              <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px", fontWeight: 500 }}>{kpi.label}</p>
              <p style={{ fontSize: "24px", fontWeight: 700, color: kpi.color }}>
                {loading ? "..." : (
                  <AnimatedNumber value={kpi.value / 100000} prefix="₹" suffix="L" decimals={1} duration={1200} />
                )}
              </p>
            </GlassCard>
          ))}
        </div>

        {error && <ErrorCard message={error} onRetry={fetchForecast} />}

        {/* Main Chart */}
        {loading ? (
          <ShimmerLoader rows={1} />
        ) : (
          <GlassCard delay={200} style={{ marginBottom: "24px", padding: "24px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9", marginBottom: "16px" }}>
              90-day cash flow projection
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickFormatter={(v) => formatCurrency(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10,10,20,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    color: "#f1f5f9",
                    fontSize: "12px",
                  }}
                  formatter={(val) => [formatCurrency(val), "Projected cash"]}
                  labelStyle={{ color: "#94a3b8" }}
                />
                {shortfallZones.map((zone, i) => (
                  <ReferenceArea
                    key={i}
                    x1={zone.start}
                    x2={zone.end}
                    fill="rgba(239,68,68,0.15)"
                    stroke="rgba(239,68,68,0.3)"
                    strokeDasharray="3 3"
                  />
                ))}
                <Area
                  type="monotone"
                  dataKey="cash"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#cashGradient)"
                  animationDuration={2000}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        )}

        {/* Shortfall Alerts + FD Ladder */}
        {!loading && forecast && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>

            {/* Shortfall Alerts */}
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9", marginBottom: "12px" }}>
                Shortfall alerts
              </p>
              {forecast.shortfallDates.length === 0 ? (
                <GlassCard delay={300} style={{ padding: "24px", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>✅</div>
                  <p style={{ fontSize: "13px", color: "#10b981", fontWeight: 600 }}>No shortfalls projected</p>
                  <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Cash position remains healthy throughout the forecast period</p>
                </GlassCard>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {forecast.shortfallDates.slice(0, 5).map((date, i) => {
                    const projection = forecast.projections.find((p) => p.date === date);
                    return (
                      <GlassCard key={date} delay={300 + i * 80} style={{
                        borderLeft: "3px solid #ef4444",
                        padding: "14px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>
                              {formatDateShort(date)}
                            </p>
                            <p style={{ fontSize: "11px", color: "#ef4444" }}>
                              Projected: {formatCurrency(projection?.projectedCash || 0)}
                            </p>
                          </div>
                          <button style={{
                            padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 600,
                            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                            color: "#ef4444", cursor: "pointer",
                          }}>
                            Review
                          </button>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FD Ladder */}
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9", marginBottom: "12px" }}>
                FD ladder suggestion
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(forecast.fdLadderSuggestion || []).map((fd, i) => (
                  <GlassCard key={fd.tenor} delay={400 + i * 80} style={{
                    borderLeft: "3px solid #06b6d4",
                    padding: "16px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <span style={{
                            fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px",
                            background: "rgba(6,182,212,0.15)", color: "#06b6d4",
                          }}>
                            {fd.tenor}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>@ {fd.rate}% p.a.</span>
                        </div>
                        <p style={{ fontSize: "16px", fontWeight: 700, color: "#f1f5f9" }}>
                          {formatCurrency(fd.amount)}
                        </p>
                        <p style={{ fontSize: "11px", color: "#10b981", marginTop: "2px" }}>
                          Est. return: {formatCurrency(fd.estimatedReturn)}
                        </p>
                      </div>
                      <button style={{
                        padding: "8px 14px", borderRadius: "8px", fontSize: "11px", fontWeight: 600,
                        background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)",
                        color: "#06b6d4", cursor: "pointer", transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(6,182,212,0.2)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(6,182,212,0.1)"; }}
                      >
                        Initiate FD
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Narrative */}
        {!loading && narrative && (
          <GlassCard delay={600} style={{ borderLeft: "3px solid #7c3aed" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#a78bfa", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              AI treasury analysis
            </p>
            <TypewriterText
              text={narrative.summary}
              speed={12}
              style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: 1.7, display: "block", marginBottom: "16px" }}
            />
            {narrative.actions && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                {narrative.actions.map((action, i) => (
                  <div key={i} style={{
                    display: "flex", gap: "10px", alignItems: "start",
                    padding: "10px 12px", borderRadius: "8px",
                    background: "rgba(255,255,255,0.03)",
                    animation: `fadeUp 0.4s ease ${800 + i * 150}ms both`,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.5 }}>{action}</p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}
