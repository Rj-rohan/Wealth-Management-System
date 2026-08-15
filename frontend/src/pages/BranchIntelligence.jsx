import { useState, useEffect, useCallback, useRef } from "react";
import AppShell from "../components/AppShell";
import BranchMap from "../components/BranchMap";
import CosmicBackground from "../components/CosmicBackground";
import GlassCard from "../components/GlassCard";
import AnimatedNumber from "../components/AnimatedNumber";
import ShimmerLoader from "../components/ShimmerLoader";
import ErrorCard from "../components/ErrorCard";

const statusColors = {
  healthy: "#10b981",
  warning: "#f59e0b",
  critical: "#ef4444",
};

function formatCurrency(val) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

function BranchPin({ status }) {
  const color = statusColors[status] || "#64748b";
  const isCritical = status === "critical";
  return (
    <div style={{ position: "relative", cursor: "pointer" }}>
      <svg width="32" height="32" viewBox="0 0 32 32">
        {isCritical && (
          <circle cx="16" cy="16" r="14" fill="none" stroke={color} strokeWidth="2" opacity="0.4"
            style={{ animation: "pulsePin 2s ease-in-out infinite" }} />
        )}
        <circle cx="16" cy="16" r="10" fill={color} opacity="0.25" />
        <circle cx="16" cy="16" r="6" fill={color} />
        <circle cx="16" cy="16" r="3" fill="#fff" opacity="0.6" />
      </svg>
    </div>
  );
}

function BranchCard({ branch, isActive, onClick }) {
  const color = statusColors[branch.status] || "#64748b";
  const revenueWidth = branch.monthlyRevenue / Math.max(branch.monthlyRevenue, branch.monthlyExpenses) * 100;
  const expenseWidth = branch.monthlyExpenses / Math.max(branch.monthlyRevenue, branch.monthlyExpenses) * 100;

  return (
    <div
      onClick={onClick}
      style={{
        background: isActive ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.04)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${isActive ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: "12px",
        padding: "16px",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9" }}>{branch.name}</p>
          <p style={{ fontSize: "12px", color: "#64748b" }}>{branch.city}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {branch.alertCount > 0 && (
            <span style={{
              fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "6px",
              background: "rgba(239,68,68,0.15)", color: "#ef4444",
            }}>
              {branch.alertCount} alert{branch.alertCount > 1 ? "s" : ""}
            </span>
          )}
          <span style={{
            fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
            padding: "3px 8px", borderRadius: "6px",
            background: `${color}20`, color: color,
          }}>
            {branch.status}
          </span>
        </div>
      </div>

      <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>Cash position</p>
      <p style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9", marginBottom: "12px" }}>
        <AnimatedNumber value={branch.cashPosition / 100000} prefix="₹" suffix="L" decimals={1} duration={800} />
      </p>

      {/* Revenue vs Expenses bars */}
      <div style={{ marginBottom: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ fontSize: "10px", color: "#64748b" }}>Revenue</span>
          <span style={{ fontSize: "10px", color: "#10b981" }}>{formatCurrency(branch.monthlyRevenue)}</span>
        </div>
        <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.06)" }}>
          <div style={{ height: "100%", width: `${revenueWidth}%`, borderRadius: "2px", background: "#10b981", transition: "width 0.8s ease" }} />
        </div>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ fontSize: "10px", color: "#64748b" }}>Expenses</span>
          <span style={{ fontSize: "10px", color: "#f59e0b" }}>{formatCurrency(branch.monthlyExpenses)}</span>
        </div>
        <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.06)" }}>
          <div style={{ height: "100%", width: `${expenseWidth}%`, borderRadius: "2px", background: "#f59e0b", transition: "width 0.8s ease" }} />
        </div>
      </div>
    </div>
  );
}

export default function BranchIntelligencePage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeBranch, setActiveBranch] = useState(null);
  const [infoOverlay, setInfoOverlay] = useState(null);
  const mapRef = useRef(null);

  // The map is optional. Without a key the loader is never mounted — otherwise
  // Google injects its own error banner over the page.
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const hasMapsKey = mapsApiKey.length > 0;

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/branches/financial-summary");
      if (!res.ok) throw new Error("Failed to load branch data");
      const data = await res.json();
      setBranches(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleBranchClick = useCallback((branch) => {
    setActiveBranch(branch.branchId);
    setInfoOverlay(branch);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: branch.lat, lng: branch.lng });
      mapRef.current.setZoom(12);
    }
  }, []);

  const totalCash = branches.reduce((s, b) => s + b.cashPosition, 0);
  const alertBranches = branches.filter((b) => b.alertCount > 0).length;

  return (
    <AppShell pageTitle="Branch intelligence" pageSubtitle="Geographic financial overview">
      <CosmicBackground />
      <div style={{ position: "relative", zIndex: 1, height: "calc(100vh - 60px)", display: "flex", flexDirection: "column" }}>

        {/* KPI Bar */}
        <div style={{ display: "flex", gap: "12px", padding: "16px 24px", flexShrink: 0 }}>
          {[
            { label: "Total branches", value: branches.length, color: "#7c3aed" },
            { label: "Total cash", value: formatCurrency(totalCash), color: "#06b6d4" },
            { label: "Branches with alerts", value: alertBranches, color: alertBranches > 0 ? "#ef4444" : "#10b981" },
          ].map((kpi, i) => (
            <div
              key={kpi.label}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 16px", borderRadius: "10px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                animation: `fadeUp 0.4s ease ${i * 80}ms both`,
              }}
            >
              <span style={{ fontSize: "12px", color: "#64748b" }}>{kpi.label}</span>
              <span style={{ fontSize: "15px", fontWeight: 700, color: kpi.color }}>{kpi.value}</span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ padding: "0 24px" }}>
            <ErrorCard message={error} onRetry={fetchBranches} />
          </div>
        )}

        {/* Main Split */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", padding: "0 24px 24px" }}>

          {/* Left: Map */}
          <div style={{ flex: "0 0 65%", borderRadius: "16px", overflow: "hidden", marginRight: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
            {loading ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.02)" }}>
                <ShimmerLoader rows={1} />
              </div>
            ) : hasMapsKey ? (
              <BranchMap
                apiKey={mapsApiKey}
                branches={branches}
                infoOverlay={infoOverlay}
                onBranchClick={handleBranchClick}
                onCloseOverlay={() => setInfoOverlay(null)}
                mapRef={mapRef}
                renderPin={(branch) => <BranchPin status={branch.status} />}
                statusColors={statusColors}
                formatCurrency={formatCurrency}
              />
            ) : (
              <div style={{
                height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.02)", flexDirection: "column", gap: "12px",
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <p style={{ color: "#64748b", fontSize: "13px" }}>Add VITE_GOOGLE_MAPS_API_KEY to frontend/.env to enable the map. Branch metrics below are unaffected.</p>
              </div>
            )}
          </div>

          {/* Right: Branch List */}
          <div style={{ flex: "0 0 calc(35% - 16px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <h2 style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: 600, marginBottom: "12px", flexShrink: 0 }}>
              All branches
            </h2>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {loading ? (
                <ShimmerLoader type="list" rows={4} />
              ) : (
                branches.map((branch, i) => (
                  <div key={branch.branchId} style={{ animation: `fadeUp 0.4s ease ${i * 80}ms both` }}>
                    <BranchCard
                      branch={branch}
                      isActive={activeBranch === branch.branchId}
                      onClick={() => handleBranchClick(branch)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pulsePin {
            0%, 100% { r: 14; opacity: 0.4; }
            50% { r: 16; opacity: 0.1; }
          }
        `}</style>
      </div>
    </AppShell>
  );
}
