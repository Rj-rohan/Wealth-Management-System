"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Card, { CardHeader } from "@/components/ui/Card";
import { Badge, Button, Skeleton } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { advisorAdviceService } from "@/services/advisorAdvice.service";
import { formatCurrency } from "@/utils/format";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import {
  Sparkles,
  Target,
  Wallet,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Shield,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

const PRIORITY_TONE = {
  high: "danger",
  medium: "warning",
  low: "info",
  High: "danger",
  Medium: "warning",
  Low: "info",
};

export default function AdvisorAnalysisAdvice({ client }) {
  const { success, error } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [financialSituationAnalysis, setFinancialSituationAnalysis] = useState("");
  const [goalAnalysis, setGoalAnalysis] = useState("");
  const [overallAssessment, setOverallAssessment] = useState("");

  const [generatedAdvice, setGeneratedAdvice] = useState(null);

  useEffect(() => {
    if (!client?.id) return;
    let active = true;
    setLoading(true);

    advisorAdviceService
      .getAdvice(client.id)
      .then((res) => {
        if (!active) return;
        if (res?.advisorAnalysis) {
          setFinancialSituationAnalysis(res.advisorAnalysis.financialSituationAnalysis || "");
          setGoalAnalysis(res.advisorAnalysis.goalAnalysis || "");
          setOverallAssessment(res.advisorAnalysis.overallAssessment || "");
        }
        if (res?.advice) {
          setGeneratedAdvice({
            summary: res.summary || res.advice.summary,
            adviceList: Array.isArray(res.advice) ? res.advice : res.advice.adviceList || [],
            updatedAt: res.updatedAt || res.advice.updatedAt,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [client?.id]);

  const goals = client?.goals || [];
  const hasGoals = goals.length > 0;

  async function handleGenerateAdvice() {
    const cleanSituation = financialSituationAnalysis.trim();
    const cleanGoalAnalysis = goalAnalysis.trim();
    const cleanOverall = overallAssessment.trim();

    if (!cleanSituation && !cleanGoalAnalysis && !cleanOverall) {
      error("Financial analysis required. Please enter your assessment notes first.");
      return;
    }

    if (!hasGoals) {
      error("Client has no financial goals registered. Please add at least one goal in Goal Planning before generating personalized advice.");
      return;
    }

    setGenerating(true);
    try {
      const res = await advisorAdviceService.generateAdvice({
        clientId: client.id,
        financialSituationAnalysis: cleanSituation,
        goalAnalysis: cleanGoalAnalysis,
        overallAssessment: cleanOverall,
      });

      if (res?.status === "insufficient_data") {
        error(res.message || "Cannot generate advice: required financial data or goals are missing.");
        return;
      }

      setGeneratedAdvice({
        summary: res.summary,
        adviceList: res.advice,
        updatedAt: res.updatedAt || new Date().toISOString(),
      });

      success("Personalized advice generated and saved successfully!");
    } catch (err) {
      error(err.message || "Failed to generate advice");
    } finally {
      setGenerating(false);
    }
  }

  function handleLoadTemplate() {
    if (client.name.includes("Amit")) {
      setFinancialSituationAnalysis(
        "The client has strong cash flow with high monthly savings (₹1.5L/month) and aggressive risk tolerance (score 82). The current asset allocation has good equity participation but high liability in vehicle debt."
      );
      setGoalAnalysis(
        "Early Retirement (2048) is the primary ambitious goal requiring aggressive equity compounding. Property Purchase (2030) is the intermediate goal requiring dedicated down-payment accumulation."
      );
      setOverallAssessment(
        "Optimize surplus deployment into high-growth equity funds, accelerate vehicle debt reduction, and maintain structured goal-based SIPs."
      );
    } else if (client.name.includes("Priya")) {
      setFinancialSituationAnalysis(
        "The client is a business owner with substantial real estate assets and moderate risk tolerance (score 50). The debt ratio is 40% due to home loan liabilities."
      );
      setGoalAnalysis(
        "Children Education (2035) and Retirement (2045) are primary family goals. Home Loan Reduction (2030) is high priority to reduce recurring EMI burden."
      );
      setOverallAssessment(
        "Balance real estate illiquidity by increasing hybrid equity and debt fund allocations, while aggressively prepaying home loan principal."
      );
    } else if (client.name.includes("Atharva")) {
      setFinancialSituationAnalysis(
        "Atharva has an impressive monthly surplus of ₹70,000 (47% savings rate) with net worth at ₹22.5L and zero high-interest revolving debt. His emergency liquidity reserve is fully funded for 6 months (₹4.8L)."
      );
      setGoalAnalysis(
        "His primary long-term target is Financial Independence by age 40 (FIRE), alongside an intermediate goal for luxury property down-payment in 2029. Vehicle debt is manageable at 11% EMI burden."
      );
      setOverallAssessment(
        "Channel 65% of the monthly surplus into systematic index and flexi-cap equity compounding, while accelerating vehicle loan prepayment over the next 18 months to achieve a zero-debt status."
      );
    } else {
      setFinancialSituationAnalysis(
        "The client has a stable IT salary with 45% savings rate and moderate-growth risk profile (score 65). Liquid emergency fund is currently below the recommended 6-month threshold."
      );
      setGoalAnalysis(
        "Retirement (2055) is the primary long-term wealth goal. Emergency fund expansion and first home purchase (2032) are near-term milestones."
      );
      setOverallAssessment(
        "Prioritize establishing a 6-month emergency buffer before scaling equity SIPs, then automate monthly index and flexi-cap investments."
      );
    }
  }

  if (loading) {
    return <Skeleton height={400} rounded={16} />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Client Financial & Goals Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Client Financial Overview" subtitle="Real-time financial status" icon={Wallet} />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Net Worth</p>
              <p className="text-base font-semibold mt-0.5" style={{ color: "var(--foreground)" }}>{formatCurrency(client.net_worth || client.netWorth || 0)}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Risk Profile</p>
              <p className="text-base font-semibold mt-0.5 capitalize" style={{ color: "var(--primary)" }}>{client.risk_profile || "Moderate"}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Total Assets</p>
              <p className="text-base font-semibold mt-0.5" style={{ color: "var(--success)" }}>{formatCurrency(client.assets || 0)}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Total Liabilities</p>
              <p className="text-base font-semibold mt-0.5" style={{ color: "var(--danger)" }}>{formatCurrency(client.liabilities || 0)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Client Financial Goals" subtitle={`${goals.length} Active Goals`} icon={Target} />
          <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
            {goals.length === 0 ? (
              <div className="p-4 rounded-xl text-center space-y-2" style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                <p className="text-xs font-semibold text-amber-500">No financial goals registered</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>At least 1 goal is required before generating personalized advice.</p>
                <Link href="/goal-planning">
                  <Button size="sm" variant="secondary" icon={Target} className="mt-1">
                    Go to Goal Planning
                  </Button>
                </Link>
              </div>
            ) : (
              goals.map((g) => (
                <div
                  key={g.id || g.label}
                  className="flex items-center justify-between p-2.5 rounded-xl text-sm"
                  style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate" style={{ color: "var(--foreground)" }}>{g.label || g.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      Target: {formatCurrency(g.target_amount || g.targetAmount || 0)} • {g.target_date ? new Date(g.target_date).getFullYear() : "Long term"}
                    </p>
                  </div>
                  <Badge tone={PRIORITY_TONE[g.priority] || "info"}>{g.priority || "Medium"}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* 2. Advisor Analysis Entry Section */}
      <Card>
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>
                <FileText size={16} />
              </span>
              <h3 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Advisor Financial Analysis</h3>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Enter your professional assessment of {client.name}&apos;s financial situation and goals before generating advice.
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={handleLoadTemplate} icon={Sparkles}>
            Load Advisor Notes
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted-strong)" }}>
              1. Financial Situation Analysis
            </label>
            <textarea
              rows={3}
              value={financialSituationAnalysis}
              onChange={(e) => setFinancialSituationAnalysis(e.target.value)}
              placeholder="E.g., The client has a stable income and good savings rate. The client has a moderate risk profile..."
              className="w-full rounded-xl p-3 text-sm transition-colors outline-none resize-none"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted-strong)" }}>
              2. Goal Analysis
            </label>
            <textarea
              rows={3}
              value={goalAnalysis}
              onChange={(e) => setGoalAnalysis(e.target.value)}
              placeholder="E.g., Retirement is the primary long-term goal. Child education is another important goal. The current financial position should be aligned..."
              className="w-full rounded-xl p-3 text-sm transition-colors outline-none resize-none"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted-strong)" }}>
              3. Advisor&apos;s Overall Assessment
            </label>
            <textarea
              rows={2}
              value={overallAssessment}
              onChange={(e) => setOverallAssessment(e.target.value)}
              placeholder="E.g., Focus on maintaining adequate liquidity before pursuing long-term house purchase or high-risk allocations."
              className="w-full rounded-xl p-3 text-sm transition-colors outline-none resize-none"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              The LLM will convert your analysis into personalized, client-friendly advice.
            </p>
            <Button
              variant="primary"
              icon={Sparkles}
              loading={generating}
              disabled={generating}
              onClick={handleGenerateAdvice}
            >
              {generating ? "Generating Personalized Advice..." : "Generate Personalized Advice"}
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Generated Personalized Client-Facing Advice */}
      {generatedAdvice && (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: "rgba(22, 217, 106, 0.06)", border: "1px solid rgba(22, 217, 106, 0.25)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-md" style={{ background: "var(--primary)", color: "#061009" }}>
                <CheckCircle2 size={14} />
              </span>
              <h3 className="text-sm font-bold tracking-wide uppercase" style={{ color: "var(--primary)" }}>
                YOUR PERSONALIZED FINANCIAL ADVICE
              </h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
              {generatedAdvice.summary}
            </p>
            {generatedAdvice.updatedAt && (
              <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                Generated on {new Date(generatedAdvice.updatedAt).toLocaleDateString()} at {new Date(generatedAdvice.updatedAt).toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(generatedAdvice.adviceList || []).map((item, index) => (
              <Card key={index} hover>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex items-center justify-center w-8 h-8 rounded-lg"
                        style={{ background: "var(--primary-dim)", color: "var(--primary)" }}
                      >
                        <Shield size={16} />
                      </span>
                      <h4 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        {item.title}
                      </h4>
                    </div>
                    <Badge tone={PRIORITY_TONE[item.priority] || "info"}>{item.priority || "Medium"}</Badge>
                  </div>

                  <div className="p-2.5 rounded-lg" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--muted-strong)" }}>
                      Why this is important
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--muted-strong)" }}>
                      {item.explanation}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg" style={{ background: "rgba(22, 217, 106, 0.05)", border: "1px solid rgba(22, 217, 106, 0.2)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--primary)" }}>
                      Suggested direction
                    </p>
                    <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                      {item.action}
                    </p>
                  </div>

                  {item.relatedGoal && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                      <Target size={12} style={{ color: "var(--primary)" }} />
                      <span>Linked Goal: <strong>{item.relatedGoal}</strong></span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
