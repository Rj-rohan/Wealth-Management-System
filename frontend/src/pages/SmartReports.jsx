import { useState, useCallback } from "react";
import AppShell from "../components/AppShell";
import CosmicBackground from "../components/CosmicBackground";
import GlassCard from "../components/GlassCard";
import ShimmerLoader from "../components/ShimmerLoader";
import ErrorCard from "../components/ErrorCard";

const REPORT_TYPES = [
  { id: "quarterly", label: "Quarterly review" },
  { id: "portfolio", label: "Portfolio analysis" },
  { id: "risk", label: "Risk assessment" },
  { id: "cashflow", label: "Cash flow report" },
];

const STATUS_MESSAGES = [
  "Fetching market benchmarks...",
  "Analysing financial data...",
  "Writing executive narrative...",
  "Formatting report...",
];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function SmartReportsPage() {
  const [reportType, setReportType] = useState("quarterly");
  const [period, setPeriod] = useState("Q1 FY2025-26");
  const [generating, setGenerating] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [reportHistory, setReportHistory] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [visibleSections, setVisibleSections] = useState([]);

  const generateReport = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setReport(null);
    setVisibleSections([]);
    setStatusIndex(0);

    // Cycle through status messages
    const statusInterval = setInterval(() => {
      setStatusIndex((prev) => {
        if (prev >= STATUS_MESSAGES.length - 1) {
          clearInterval(statusInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType, period, companyData: null }),
      });

      clearInterval(statusInterval);

      if (!res.ok) throw new Error("Failed to generate report");
      const data = await res.json();
      setReport(data);

      // Animate sections in
      (data.sections || []).forEach((_, i) => {
        setTimeout(() => setVisibleSections((prev) => [...prev, i]), i * 400);
      });

      // Add to history
      setReportHistory((prev) => [{
        type: reportType,
        period,
        generatedAt: data.generatedAt,
        wordCount: data.wordCount,
        data,
      }, ...prev].slice(0, 10));
    } catch (err) {
      clearInterval(statusInterval);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }, [reportType, period]);

  const downloadPDF = useCallback(async () => {
    if (!report) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Title
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("Wealth Management System", margin, y);
      y += 10;

      doc.setFontSize(22);
      doc.setTextColor(22, 163, 74);
      const titleText = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
      doc.text(titleText, margin, y);
      y += 8;

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Period: ${period} | Generated: ${formatDate(report.generatedAt)}`, margin, y);
      y += 4;

      // Line
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Sections
      for (const section of report.sections) {
        if (y > 260) {
          doc.addPage();
          y = margin;
        }

        doc.setFontSize(14);
        doc.setTextColor(22, 163, 74);
        doc.text(section.title, margin, y);
        y += 8;

        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        const paragraphs = section.content.split("\n").filter(Boolean);
        for (const para of paragraphs) {
          const lines = doc.splitTextToSize(para, contentWidth);
          for (const line of lines) {
            if (y > 275) {
              doc.addPage();
              y = margin;
            }
            doc.text(line, margin, y);
            y += 5;
          }
          y += 3;
        }
        y += 5;
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          "Confidential — AI generated report. Advisory simulation only, not financial advice.",
          pageWidth / 2, 290, { align: "center" }
        );
      }

      doc.save(`${reportType}_report_${period.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF download error:", err);
      setError("Could not generate the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, [report, reportType, period]);

  return (
    <AppShell pageTitle="Smart reports" pageSubtitle="AI-narrated financial report generation">
      <CosmicBackground />
      <div style={{ position: "relative", zIndex: 1, padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>

        {/* Report Configuration */}
        <GlassCard delay={0} style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Report type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  color: "#f1f5f9",
                  fontSize: "13px",
                  outline: "none",
                  cursor: "pointer",
                  appearance: "none",
                }}
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t.id} value={t.id} style={{ background: "#1a1a2e" }}>{t.label}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Period
              </label>
              <input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="e.g. Q1 FY2025-26"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  color: "#f1f5f9",
                  fontSize: "13px",
                  outline: "none",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(124,58,237,0.5)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; }}
              />
            </div>

            <button
              onClick={generateReport}
              disabled={generating}
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                background: generating ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                border: "none",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: generating ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                whiteSpace: "nowrap",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
              </svg>
              {generating ? "Generating..." : "Generate report"}
            </button>
          </div>
        </GlassCard>

        {/* Progress Bar */}
        {generating && (
          <GlassCard delay={0} style={{ marginBottom: "24px" }}>
            <div style={{
              height: "4px",
              borderRadius: "2px",
              background: "rgba(255,255,255,0.06)",
              marginBottom: "12px",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                borderRadius: "2px",
                background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
                width: `${((statusIndex + 1) / STATUS_MESSAGES.length) * 100}%`,
                transition: "width 0.5s ease",
              }} />
            </div>
            <p style={{
              fontSize: "13px",
              color: "#a78bfa",
              textAlign: "center",
              animation: "fadeUp 0.3s ease both",
            }}>
              {STATUS_MESSAGES[statusIndex]}
            </p>
          </GlassCard>
        )}

        {error && <ErrorCard message={error} onRetry={generateReport} />}

        {/* Report Preview + Metadata */}
        {report && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>

            {/* Left: Report Preview */}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9", marginBottom: "12px" }}>Report preview</p>
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "24px",
                maxHeight: "500px",
                overflowY: "auto",
              }}>
                {report.sections.map((section, i) => (
                  visibleSections.includes(i) && (
                    <div key={i} style={{
                      marginBottom: "20px",
                      animation: "fadeUp 0.4s ease both",
                    }}>
                      <h3 style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#7c3aed",
                        marginBottom: "10px",
                        paddingBottom: "6px",
                        borderBottom: "1px solid rgba(124,58,237,0.2)",
                      }}>
                        {section.title}
                      </h3>
                      {section.content.split("\n").filter(Boolean).map((para, j) => (
                        <p key={j} style={{
                          fontSize: "13px",
                          color: "#cbd5e1",
                          lineHeight: 1.7,
                          marginBottom: "10px",
                        }}>
                          {para}
                        </p>
                      ))}
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Right: Metadata + Download */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9", marginBottom: "0" }}>Report details</p>

              <GlassCard delay={0}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {[
                    { label: "Generated", value: formatDate(report.generatedAt) },
                    { label: "Period", value: report.period },
                    { label: "Type", value: report.reportType },
                    { label: "Word count", value: `${report.wordCount} words` },
                  ].map((meta) => (
                    <div key={meta.label}>
                      <p style={{ fontSize: "10px", color: "#64748b", marginBottom: "3px" }}>{meta.label}</p>
                      <p style={{ fontSize: "13px", color: "#f1f5f9", fontWeight: 500 }}>{meta.value}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Download Button */}
              <button
                onClick={downloadPDF}
                disabled={downloading}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  border: "none",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: downloading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                  opacity: downloading ? 0.7 : 1,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {downloading ? "Preparing PDF..." : "Download PDF"}
              </button>

              {/* Share + Schedule */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button style={{
                  padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: 600,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94a3b8", cursor: "pointer", transition: "all 0.2s ease",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)"; e.currentTarget.style.color = "#a78bfa"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#94a3b8"; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share
                </button>
                <button style={{
                  padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: 600,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94a3b8", cursor: "pointer", transition: "all 0.2s ease",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.3)"; e.currentTarget.style.color = "#06b6d4"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#94a3b8"; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report History */}
        {reportHistory.length > 0 && (
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9", marginBottom: "12px" }}>Report history</p>
            <GlassCard delay={0} style={{ padding: "0", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {["Type", "Period", "Generated", "Words", ""].map((h) => (
                        <th key={h} style={{
                          textAlign: "left",
                          padding: "12px 16px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportHistory.map((r, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: i < reportHistory.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                          animation: `fadeUp 0.3s ease ${i * 60}ms both`,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px",
                            background: "rgba(124,58,237,0.15)", color: "#a78bfa",
                          }}>
                            {r.type}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#f1f5f9" }}>{r.period}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{formatDate(r.generatedAt)}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{r.wordCount}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <button
                            onClick={() => setReport(r.data)}
                            style={{
                              fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "6px",
                              background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)",
                              color: "#06b6d4", cursor: "pointer",
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </AppShell>
  );
}
