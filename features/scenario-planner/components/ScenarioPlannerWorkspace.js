"use client";
import { useState } from "react";
import { Skeleton, StatsCard } from "@/components/ui";
import ClientSelector from "@/components/ui/ClientSelector";
import Card, { CardHeader } from "@/components/ui/Card";
import MetricRow from "@/components/ui/MetricRow";
import { RangeSlider } from "@/components/ui";
import AreaTrend from "@/components/charts/AreaTrend";
import { useScenarioPlanner } from "../hooks/useScenarioPlanner";
import { GitBranch, TrendingUp, Target, Wallet, Calendar } from "lucide-react";
import { formatCurrency } from "@/utils/format";

export default function ScenarioPlannerWorkspace() {
  const [clientId, setClientId] = useState("");
  const { baseline, params, results, loading, updateParam } = useScenarioPlanner(clientId);

  return (
    <div className="space-y-5">
      <ClientSelector value={clientId} onChange={setClientId} />

      {!clientId && (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <GitBranch size={40} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--muted-strong)" }}>Select a client to run financial scenarios</p>
        </div>
      )}

      {clientId && loading && <Skeleton height={500} rounded={16} />}

      {clientId && !loading && params && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Controls */}
          <div className="space-y-5">
            <Card>
              <CardHeader title="Scenario Parameters" icon={GitBranch} />
              <div className="space-y-5 mt-2">
                <RangeSlider label="Monthly Savings" value={params.monthlySavings} min={0} max={Math.max(30000, params.monthlySavings * 2)} step={500} onChange={(v) => updateParam("monthlySavings", v)} format={(v) => formatCurrency(v)} />
                <RangeSlider label="Monthly Income" value={params.monthlyIncome} min={0} max={Math.max(50000, params.monthlyIncome * 2)} step={1000} onChange={(v) => updateParam("monthlyIncome", v)} format={(v) => formatCurrency(v)} />
                <RangeSlider label="Monthly Expenses" value={params.monthlyExpenses} min={0} max={Math.max(40000, params.monthlyExpenses * 2)} step={500} onChange={(v) => updateParam("monthlyExpenses", v)} format={(v) => formatCurrency(v)} />
                <RangeSlider label="Investment Return" value={params.investmentReturn} min={0} max={20} step={0.5} onChange={(v) => updateParam("investmentReturn", v)} unit="%" />
                <RangeSlider label="Inflation Rate" value={params.inflation} min={0} max={10} step={0.5} onChange={(v) => updateParam("inflation", v)} unit="%" />
                <RangeSlider label="Retirement Age" value={params.retirementAge} min={45} max={80} step={1} onChange={(v) => updateParam("retirementAge", v)} />
              </div>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-5">
            {results && (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 gap-3">
                  <StatsCard label="Future Net Worth" value={formatCurrency(results.futureNetWorth)} icon={TrendingUp} tone="primary" />
                  <StatsCard label="Retirement Corpus" value={formatCurrency(results.retirementCorpus)} icon={Wallet} tone="success" />
                  <StatsCard label="Monthly Retirement Income" value={formatCurrency(results.monthlyRetirementIncome)} icon={Calendar} tone="info" footnote={`Based on 4% withdrawal rate`} />
                  <StatsCard label="Years to Retirement" value={results.yearsToRetirement} icon={Target} tone="warning" />
                </div>

                {/* Net Worth Projection */}
                <Card>
                  <CardHeader title="Net Worth Projection" subtitle={`Age ${baseline?.currentAge || 0} to ${params.retirementAge}`} icon={TrendingUp} />
                  <AreaTrend data={results.projections} dataKey="netWorth" xKey="age" height={300} valueFormatter={(v) => formatCurrency(v)} />
                </Card>

                {/* Goal Impact */}
                {results.goalImpact?.length > 0 && (
                  <Card>
                    <CardHeader title="Goal Completion Impact" icon={Target} />
                    {results.goalImpact.map((g) => (
                      <MetricRow
                        key={g.id}
                        label={g.label}
                        value={g.canMeet ? "✅ On Track" : "⚠️ Shortfall"}
                        sub={`${formatCurrency(g.projectedAmount)} / ${formatCurrency(g.targetAmount)}`}
                        tone={g.canMeet ? "success" : "warning"}
                      />
                    ))}
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
