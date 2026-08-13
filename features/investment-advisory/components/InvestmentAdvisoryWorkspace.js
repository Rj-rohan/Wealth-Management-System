"use client";
import { useState } from "react";
import { Tabs, Skeleton, Badge } from "@/components/ui";
import ClientSelector from "@/components/ui/ClientSelector";
import MetricRow from "@/components/ui/MetricRow";
import Card, { CardHeader } from "@/components/ui/Card";
import DonutChart from "@/components/charts/DonutChart";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import { TrendingUp, BarChart3, Clock, Droplets, Shield } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { usePortfolioData } from "@/features/portfolio-review/hooks/usePortfolio";

const TYPES = [
  { id: "all", label: "All" },
  { id: "stock", label: "Stocks" },
  { id: "mutual_fund", label: "Mutual Funds" },
  { id: "etf", label: "ETFs" },
  { id: "bond", label: "Bonds" },
  { id: "gold", label: "Gold" },
  { id: "fixed_deposit", label: "Fixed Deposits" },
];

const RISK_TONE = { low: "success", medium: "warning", high: "danger" };

export default function InvestmentAdvisoryWorkspace() {
  const [clientId, setClientId] = useState("");
  const [type, setType] = useState("all");
  const { data, loading } = usePortfolioData(clientId);

  const holdings = data?.holdings?.filter((h) => type === "all" || h.type === type) || [];

  // Group by type for summary
  const byType = {};
  (data?.holdings || []).forEach((h) => {
    const label = h.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    byType[label] = (byType[label] || 0) + h.currentValue;
  });
  const typeData = Object.entries(byType).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-5">
      <ClientSelector value={clientId} onChange={setClientId} />

      {!clientId && (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <BarChart3 size={40} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--muted-strong)" }}>Select a client to view investment recommendations</p>
        </div>
      )}

      {clientId && loading && <Skeleton height={400} rounded={16} />}

      {clientId && !loading && data && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2">
              <CardHeader title="Investment Types" subtitle={`${data.holdings?.length || 0} holdings`} icon={BarChart3} />
              <Tabs tabs={TYPES} active={type} onChange={setType} />
              <div className="mt-4 space-y-1">
                {holdings.length === 0 && <p className="text-sm py-4 text-center" style={{ color: "var(--muted)" }}>No investments in this category</p>}
                {holdings.map((h) => (
                  <div key={h.id} className="flex items-center justify-between py-3 px-1" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{h.name}</p>
                        {h.ticker && <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--surface-hover)", color: "var(--muted)" }}>{h.ticker}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge tone={RISK_TONE[h.riskLevel]}>{h.riskLevel} risk</Badge>
                        <span className="text-xs" style={{ color: "var(--muted)" }}>{h.sector}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{formatCurrency(h.currentValue)}</p>
                      <p className="text-xs font-medium" style={{ color: h.returnPct >= 0 ? "var(--success)" : "var(--danger)" }}>
                        {h.returnPct >= 0 ? "+" : ""}{h.returnPct}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-5">
              <Card>
                <CardHeader title="By Investment Type" icon={TrendingUp} />
                <DonutChart data={typeData} height={200} valueFormatter={(v) => formatCurrency(v)} />
              </Card>
              <Card>
                <CardHeader title="Key Metrics" icon={Shield} />
                <MetricRow label="Diversification" value={`${data.analysis?.diversificationScore || 0}/100`} tone="info" />
                <MetricRow label="Risk Score" value={`${data.analysis?.riskScore || 0}/100`} tone={data.analysis?.riskScore < 50 ? "success" : "warning"} />
                <MetricRow label="Volatility" value={`${data.analysis?.volatility || 0}%`} />
                <MetricRow label="Sharpe Ratio" value={data.analysis?.sharpeRatio || "—"} tone="info" />
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
