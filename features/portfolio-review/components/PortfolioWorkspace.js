"use client";
import { useState } from "react";
import { Tabs, Skeleton, StatsCard, Badge } from "@/components/ui";
import ClientSelector from "@/components/ui/ClientSelector";
import Card, { CardHeader } from "@/components/ui/Card";
import MetricRow from "@/components/ui/MetricRow";
import { ScoreRing } from "@/components/ui";
import DonutChart from "@/components/charts/DonutChart";
import TreemapChart from "@/components/charts/TreemapChart";
import LineMulti from "@/components/charts/LineMulti";
import { usePortfolioData } from "../hooks/usePortfolio";
import { portfolioService } from "@/services/portfolio.service";
import { PieChart, TrendingUp, BarChart3, Globe, Activity, ArrowUpDown, Wallet } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { useState as useRecsState, useEffect } from "react";

export default function PortfolioWorkspace() {
  const [clientId, setClientId] = useState("");
  const [tab, setTab] = useState("overview");
  const { data, loading } = usePortfolioData(clientId);
  const [recs, setRecs] = useState([]);

  // Load recommendations when data is available
  useEffect(() => {
    if (clientId) {
      portfolioService.getRecommendations(clientId).then(setRecs);
    }
  }, [clientId]);

  // Derived data
  const assetAllocation = [];
  const sectorAllocation = [];
  const geoAllocation = [];
  if (data?.holdings) {
    const byType = {}, bySector = {}, byGeo = {};
    data.holdings.forEach((h) => {
      const tLabel = h.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      byType[tLabel] = (byType[tLabel] || 0) + h.currentValue;
      bySector[h.sector] = (bySector[h.sector] || 0) + h.currentValue;
      byGeo[h.geography] = (byGeo[h.geography] || 0) + h.currentValue;
    });
    Object.entries(byType).forEach(([name, value]) => assetAllocation.push({ name, value }));
    Object.entries(bySector).forEach(([name, value]) => sectorAllocation.push({ name, value }));
    Object.entries(byGeo).forEach(([name, value]) => geoAllocation.push({ name, value }));
  }

  const TABS = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "holdings", label: "Holdings", icon: Wallet },
    { id: "allocation", label: "Allocation", icon: PieChart },
    { id: "performance", label: "Performance", icon: TrendingUp },
    { id: "recommendations", label: "Actions", icon: ArrowUpDown },
  ];

  const ACTION_TONE = { buy: "success", hold: "info", sell: "danger", rebalance: "warning" };

  return (
    <div className="space-y-5">
      <ClientSelector value={clientId} onChange={setClientId} />

      {!clientId && (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <PieChart size={40} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--muted-strong)" }}>Select a client to review their portfolio</p>
        </div>
      )}

      {clientId && loading && <Skeleton height={500} rounded={16} />}

      {clientId && !loading && data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatsCard label="Portfolio Value" value={formatCurrency(data.totalValue)} icon={Wallet} tone="primary" />
            <StatsCard label="Total Return" value={`${data.totalReturn >= 0 ? "+" : ""}${data.totalReturn}%`} icon={TrendingUp} tone={data.totalReturn >= 0 ? "success" : "danger"} />
            <StatsCard label="Risk Score" value={`${data.analysis.riskScore}/100`} icon={Activity} tone={data.analysis.riskScore < 50 ? "success" : "warning"} />
            <StatsCard label="Diversification" value={`${data.analysis.diversificationScore}/100`} icon={BarChart3} tone="info" />
          </div>

          <Tabs tabs={TABS} active={tab} onChange={setTab} />

          {tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card>
                <CardHeader title="Asset Allocation" icon={PieChart} />
                <DonutChart data={assetAllocation} height={240} valueFormatter={(v) => formatCurrency(v)} />
              </Card>
              <Card>
                <CardHeader title="Portfolio Growth" icon={TrendingUp} />
                <LineMulti data={data.performanceHistory} xKey="month" lines={[
                  { dataKey: "value", name: "Portfolio", color: "#16D96A" },
                  { dataKey: "benchmark", name: "Benchmark", color: "#8A94A6", dashed: true },
                ]} valueFormatter={(v) => formatCurrency(v)} />
              </Card>
              <Card>
                <CardHeader title="Sector Distribution" icon={BarChart3} />
                <TreemapChart data={sectorAllocation} height={220} valueFormatter={(v) => formatCurrency(v)} />
              </Card>
              <Card>
                <CardHeader title="Portfolio Analysis" icon={Activity} />
                <MetricRow label="Volatility" value={`${data.analysis.volatility}%`} />
                <MetricRow label="Allocation Drift" value={`${data.analysis.allocationDrift}%`} tone={data.analysis.allocationDrift > 8 ? "warning" : "success"} />
                <MetricRow label="Concentration Risk" value={data.analysis.concentrationRisk} tone={data.analysis.concentrationRisk === "low" ? "success" : "warning"} />
                <MetricRow label="Sharpe Ratio" value={data.analysis.sharpeRatio} tone="info" />
              </Card>
            </div>
          )}

          {tab === "holdings" && (
            <Card>
              <CardHeader title="Current Holdings" subtitle={`${data.holdings.length} positions`} icon={Wallet} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Name", "Type", "Sector", "Cost", "Value", "Return", "Risk"].map((h) => (
                        <th key={h} className="text-left py-2.5 px-2 font-medium text-xs" style={{ color: "var(--muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.holdings.map((h) => (
                      <tr key={h.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="py-2.5 px-2">
                          <p className="font-medium" style={{ color: "var(--foreground)" }}>{h.name}</p>
                          {h.ticker && <p className="text-xs" style={{ color: "var(--muted)" }}>{h.ticker}</p>}
                        </td>
                        <td className="py-2.5 px-2"><Badge tone="neutral">{h.type.replace(/_/g, " ")}</Badge></td>
                        <td className="py-2.5 px-2" style={{ color: "var(--muted-strong)" }}>{h.sector}</td>
                        <td className="py-2.5 px-2" style={{ color: "var(--muted-strong)" }}>{formatCurrency(h.costBasis)}</td>
                        <td className="py-2.5 px-2 font-medium" style={{ color: "var(--foreground)" }}>{formatCurrency(h.currentValue)}</td>
                        <td className="py-2.5 px-2 font-medium" style={{ color: h.returnPct >= 0 ? "var(--success)" : "var(--danger)" }}>{h.returnPct >= 0 ? "+" : ""}{h.returnPct}%</td>
                        <td className="py-2.5 px-2"><Badge tone={h.riskLevel === "low" ? "success" : h.riskLevel === "high" ? "danger" : "warning"}>{h.riskLevel}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {tab === "allocation" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Card><CardHeader title="By Asset Type" icon={PieChart} /><DonutChart data={assetAllocation} valueFormatter={(v) => formatCurrency(v)} /></Card>
              <Card><CardHeader title="By Sector" icon={BarChart3} /><DonutChart data={sectorAllocation} valueFormatter={(v) => formatCurrency(v)} /></Card>
              <Card><CardHeader title="By Geography" icon={Globe} /><DonutChart data={geoAllocation} valueFormatter={(v) => formatCurrency(v)} /></Card>
            </div>
          )}

          {tab === "performance" && (
            <Card>
              <CardHeader title="Performance vs Benchmark" icon={TrendingUp} />
              <LineMulti data={data.performanceHistory} xKey="month" height={360} lines={[
                { dataKey: "value", name: "Portfolio", color: "#16D96A" },
                { dataKey: "benchmark", name: "Benchmark", color: "#8A94A6", dashed: true },
              ]} valueFormatter={(v) => formatCurrency(v)} />
            </Card>
          )}

          {tab === "recommendations" && (
            <Card>
              <CardHeader title="Portfolio Actions" subtitle="Buy, Hold, Sell & Rebalance" icon={ArrowUpDown} />
              <div className="space-y-1">
                {recs.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge tone={ACTION_TONE[r.action]}>{r.action.toUpperCase()}</Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{r.name}</p>
                        <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{r.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
