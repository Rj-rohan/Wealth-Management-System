import { useState, useEffect, useCallback } from "react";
import AppShell from "../components/AppShell";
import CosmicBackground from "../components/CosmicBackground";
import GlassCard from "../components/GlassCard";
import AnimatedNumber from "../components/AnimatedNumber";
import ShimmerLoader from "../components/ShimmerLoader";
import ErrorCard from "../components/ErrorCard";

const DEFAULT_SYMBOLS = "INFY,TCS,HDFC,NTPC,APOLLOTYRE,CEATLTD,INDUSINDBK,HINDUNILVR,RELIANCE,HDFCBANK,ICICIBANK,SBIN,WIPRO,BHARTIARTL,ITC,TATAMOTORS";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getHeatColor(pct) {
  const clamped = Math.max(-5, Math.min(5, pct));
  if (clamped < 0) {
    const t = Math.abs(clamped) / 5;
    const r = Math.round(30 + t * 170);
    const g = Math.round(30 + (1 - t) * 10);
    const b = Math.round(30 + (1 - t) * 10);
    return `rgb(${r},${g},${b})`;
  } else if (clamped > 0) {
    const t = clamped / 5;
    const r = Math.round(30 + (1 - t) * 10);
    const g = Math.round(30 + t * 170);
    const b = Math.round(30 + (1 - t) * 10);
    return `rgb(${r},${g},${b})`;
  }
  return "rgb(50,50,55)";
}

export default function MarketPulsePage() {
  const [quotes, setQuotes] = useState([]);
  const [news, setNews] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hoveredTile, setHoveredTile] = useState(null);

  const fetchData = useCallback(async () => {
    setLoadingQuotes(true);
    setLoadingNews(true);
    setError(null);

    try {
      const [quotesRes, newsRes] = await Promise.all([
        fetch(`/api/market/quotes?symbols=${DEFAULT_SYMBOLS}`),
        fetch("/api/market/news"),
      ]);

      if (!quotesRes.ok) throw new Error("Failed to fetch market data");
      const quotesData = await quotesRes.json();
      setQuotes(quotesData);
      setLoadingQuotes(false);

      if (newsRes.ok) {
        const newsData = await newsRes.json();
        setNews(newsData);
      }
      setLoadingNews(false);
    } catch (err) {
      setError(err.message);
      setLoadingQuotes(false);
      setLoadingNews(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <AppShell pageTitle="Market pulse" pageSubtitle="Real-time market intelligence">
      <CosmicBackground />
      <div style={{ position: "relative", zIndex: 1, padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>

        {/* Animated Ticker */}
        {quotes.length > 0 && (
          <div style={{
            overflow: "hidden",
            marginBottom: "24px",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              display: "flex",
              animation: "tickerScroll 30s linear infinite",
              whiteSpace: "nowrap",
              padding: "12px 0",
            }}>
              {[...quotes, ...quotes].map((q, i) => (
                <span key={`${q.symbol}-${i}`} style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0 20px",
                  fontSize: "13px",
                  flexShrink: 0,
                }}>
                  <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{q.symbol}</span>
                  <span style={{ color: "#94a3b8" }}>₹{q.price?.toLocaleString("en-IN")}</span>
                  <span style={{
                    color: q.changePercent >= 0 ? "#10b981" : "#ef4444",
                    fontWeight: 500,
                  }}>
                    {q.changePercent >= 0 ? "▲" : "▼"} {Math.abs(q.changePercent)}%
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.15)", margin: "0 4px" }}>•</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
          <button
            onClick={handleRefresh}
            disabled={loadingQuotes}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "#f1f5f9",
              fontSize: "13px",
              fontWeight: 500,
              cursor: loadingQuotes ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              opacity: loadingQuotes ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loadingQuotes) {
                e.currentTarget.style.background = "rgba(124,58,237,0.15)";
                e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: loadingQuotes ? "spin 1s linear infinite" : "none" }}>
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {loadingQuotes ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && <ErrorCard message={error} onRetry={handleRefresh} />}

        {/* Main Content */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

          {/* Left: Heat Map */}
          <div style={{ minWidth: 0 }}>
            <h2 style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>
              Portfolio heat map
            </h2>
            {loadingQuotes ? (
              <ShimmerLoader type="grid" rows={8} />
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "8px",
              }}>
                {quotes.map((q, i) => (
                  <div
                    key={q.symbol}
                    style={{
                      position: "relative",
                      background: getHeatColor(q.changePercent),
                      borderRadius: "12px",
                      padding: "14px",
                      cursor: "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      animation: `fadeUp 0.4s ease ${i * 60}ms both`,
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                    onMouseEnter={(e) => {
                      setHoveredTile(q.symbol);
                      e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
                      e.currentTarget.style.zIndex = "10";
                    }}
                    onMouseLeave={(e) => {
                      setHoveredTile(null);
                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.zIndex = "1";
                    }}
                  >
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9", marginBottom: "4px" }}>
                      {q.symbol}
                    </p>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "2px" }}>
                      ₹{q.price?.toLocaleString("en-IN")}
                    </p>
                    <p style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: q.changePercent >= 0 ? "#a7f3d0" : "#fca5a5",
                    }}>
                      {q.changePercent >= 0 ? "+" : ""}{q.changePercent}%
                    </p>

                    {/* Tooltip */}
                    {hoveredTile === q.symbol && (
                      <div style={{
                        position: "absolute",
                        bottom: "calc(100% + 8px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "rgba(15,15,25,0.95)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        whiteSpace: "nowrap",
                        zIndex: 50,
                        animation: "fadeUp 0.15s ease both",
                      }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9", marginBottom: "4px" }}>{q.symbol}</p>
                        <p style={{ fontSize: "12px", color: "#94a3b8" }}>Price: ₹{q.price?.toLocaleString("en-IN")}</p>
                        <p style={{ fontSize: "12px", color: "#94a3b8" }}>
                          Change: <span style={{ color: q.change >= 0 ? "#10b981" : "#ef4444" }}>
                            {q.change >= 0 ? "+" : ""}₹{q.change?.toFixed(1)}
                          </span>
                        </p>
                        <p style={{ fontSize: "12px", color: "#94a3b8" }}>
                          Percent: <span style={{ color: q.changePercent >= 0 ? "#10b981" : "#ef4444" }}>
                            {q.changePercent >= 0 ? "+" : ""}{q.changePercent}%
                          </span>
                        </p>
                        <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                          Updated: {timeAgo(q.lastUpdated)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: News Feed */}
          <div style={{ minWidth: 0 }}>
            <h2 style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>
              Market news
            </h2>
            {loadingNews ? (
              <ShimmerLoader type="list" rows={5} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {news.map((n, i) => (
                  <a
                    key={i}
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      textDecoration: "none",
                      background: "rgba(255,255,255,0.04)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      padding: "16px",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                      animation: `slideInRight 0.5s ease ${i * 80}ms both`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateX(-4px)";
                      e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)";
                      e.currentTarget.style.boxShadow = "0 0 20px rgba(124,58,237,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateX(0)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <span style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: "rgba(124,58,237,0.15)",
                        color: "#a78bfa",
                      }}>
                        {n.source}
                      </span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>{timeAgo(n.publishedAt)}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0 }}>
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </div>
                    <p style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#f1f5f9",
                      marginBottom: "6px",
                      lineHeight: 1.4,
                    }}>
                      {n.title}
                    </p>
                    <p style={{
                      fontSize: "12px",
                      color: "#94a3b8",
                      lineHeight: 1.5,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}>
                      {n.snippet}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes tickerScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(24px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @media (max-width: 768px) {
            .market-pulse-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </AppShell>
  );
}
