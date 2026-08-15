"use client";
import Card from "@/components/ui/Card";
import MetricRow from "@/components/ui/MetricRow";
import { Button } from "@/components/ui";
import { Printer, Download, FileText } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/format";

export default function ReportPreview({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-5">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{data.title}</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>
          <Button size="sm" variant="outline" icon={Download}>Export PDF</Button>
        </div>
      </div>

      {/* Report Content */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="px-8 py-6" style={{ background: "radial-gradient(800px circle at 50% 0%, rgba(22,217,106,0.1), transparent 60%)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText size={20} style={{ color: "var(--primary)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>Meridian Wealth Advisory</span>
              </div>
              <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{data.title}</h1>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Generated {formatDate(data.generatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Client & Advisor Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-8 py-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>Client</p>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{data.client.name}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{data.client.email}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{data.client.occupation} • {data.client.location}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>Advisor</p>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{data.advisor.name}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{data.advisor.firm}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{data.advisor.email}</p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="px-8 py-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Financial Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Net Worth", value: formatCurrency(data.netWorth) },
              { label: "Total Assets", value: formatCurrency(data.assets) },
              { label: "Total Liabilities", value: formatCurrency(data.liabilities) },
              { label: "Health Score", value: `${data.financial?.healthScore || "—"}/100` },
            ].map((m) => (
              <div key={m.label} className="rounded-xl p-3" style={{ background: "var(--surface-hover)" }}>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{m.label}</p>
                <p className="text-lg font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Goals Summary */}
        {data.goals?.length > 0 && (
          <div className="px-8 py-6" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Goals Overview</h3>
            {data.goals.map((g) => (
              <MetricRow key={g.id} label={g.label} value={`${g.progress}%`} sub={`Target: ${formatCurrency(g.targetAmount)}`} tone={g.progress > 70 ? "success" : g.progress > 40 ? "warning" : "danger"} />
            ))}
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations?.length > 0 && (
          <div className="px-8 py-6">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Key Recommendations</h3>
            {data.recommendations.filter((r) => r.priority === "high").slice(0, 5).map((r) => (
              <div key={r.id} className="py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{r.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{r.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
