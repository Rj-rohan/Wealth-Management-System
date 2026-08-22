"use client";
import { useState } from "react";
import { Badge, Button, Skeleton, SegmentedControl } from "@/components/ui";
import ClientSelector from "@/components/ui/ClientSelector";
import Card, { CardHeader } from "@/components/ui/Card";
import { useRecommendations } from "../hooks/useRecommendations";
import { useNotifications } from "@/context/NotificationContext";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import { Lightbulb, Check, TrendingUp, Shield, DollarSign, Wallet, CreditCard, ArrowLeftRight, Clock, AlertCircle } from "lucide-react";

const CAT_ICON = {
  investment: TrendingUp, savings: Wallet, insurance: Shield, tax: DollarSign,
  retirement: Clock, debt: CreditCard, liquidity: ArrowLeftRight, emergency_fund: AlertCircle,
};
const CAT_LABELS = [
  { value: "all", label: "All" },
  { value: "investment", label: "Investment" },
  { value: "savings", label: "Savings" },
  { value: "insurance", label: "Insurance" },
  { value: "tax", label: "Tax" },
  { value: "retirement", label: "Retirement" },
  { value: "debt", label: "Debt" },
];
const PRIORITY_TONE = { high: "danger", medium: "warning", low: "info" };

export default function RecommendationsWorkspace() {
  const [clientId, setClientId] = useState("");
  const [cat, setCat] = useState("all");
  const { recs, advisorAdvice, advisorAnalysis, loading, markActioned } = useRecommendations(clientId);
  const { success } = useNotifications();

  const filtered = cat === "all" ? recs : recs.filter((r) => r.category === cat);

  async function handleAction(recId) {
    await markActioned(recId);
    success("Advice action marked as completed");
  }

  return (
    <div className="space-y-5">
      <ClientSelector value={clientId} onChange={setClientId} />

      {!clientId && (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Lightbulb size={40} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--muted-strong)" }}>Select a client to view personalized advice</p>
        </div>
      )}

      {clientId && loading && <Skeleton height={400} rounded={16} />}

      {clientId && !loading && (
        <>
          {/* Executive Summary / Advisor Advice Banner */}
          {advisorAdvice?.summary && (
            <div className="rounded-2xl p-5 space-y-2" style={{ background: "rgba(22, 217, 106, 0.06)", border: "1px solid rgba(22, 217, 106, 0.25)" }}>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-md" style={{ background: "var(--primary)", color: "#061009" }}>
                  <Shield size={14} />
                </span>
                <h3 className="text-sm font-bold tracking-wide uppercase" style={{ color: "var(--primary)" }}>
                  YOUR PERSONALIZED FINANCIAL ADVICE
                </h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                {advisorAdvice.summary}
              </p>
              {advisorAnalysis?.financialSituationAnalysis && (
                <div className="mt-3 pt-3 text-xs" style={{ borderTop: "1px solid rgba(22, 217, 106, 0.15)", color: "var(--muted)" }}>
                  <strong style={{ color: "var(--muted-strong)" }}>Advisor Assessment:</strong> {advisorAnalysis.financialSituationAnalysis}
                </div>
              )}
            </div>
          )}

          <SegmentedControl options={CAT_LABELS} value={cat} onChange={setCat} />

          {filtered.length === 0 && (
            <div className="rounded-2xl p-8 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--muted)" }}>No advice items in this category</p>
            </div>
          )}

          <StaggerGroup className="space-y-3">
            {filtered.map((r, idx) => {
              const Icon = CAT_ICON[r.category] || Lightbulb;
              return (
                <StaggerItem key={r.id || idx}>
                  <Card hover>
                    <div className="flex items-start gap-4">
                      <span className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0" style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>
                        <Icon size={18} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{r.title}</h4>
                          <Badge tone={PRIORITY_TONE[r.priority] || "info"}>Priority: {r.priority}</Badge>
                          <Badge tone={r.status === "actioned" ? "success" : "neutral"}>{r.status}</Badge>
                        </div>
                        <div className="mt-2.5 space-y-2 text-sm">
                          <div className="p-2.5 rounded-lg" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--muted-strong)" }}>
                              Why this is important
                            </p>
                            <p style={{ color: "var(--muted-strong)" }}>{r.explanation}</p>
                          </div>
                          {r.expectedBenefit && (
                            <div className="p-2.5 rounded-lg" style={{ background: "rgba(22, 217, 106, 0.05)", border: "1px solid rgba(22, 217, 106, 0.2)" }}>
                              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--primary)" }}>
                                Suggested direction
                              </p>
                              <p className="font-medium" style={{ color: "var(--foreground)" }}>{r.expectedBenefit}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs" style={{ color: "var(--muted)" }}>
                          <span><strong style={{ color: "var(--info)" }}>Timeline:</strong> {r.estimatedTimeline}</span>
                        </div>
                      </div>
                      {r.status === "pending" && (
                        <Button size="sm" variant="secondary" icon={Check} onClick={() => handleAction(r.id)} className="flex-shrink-0">
                          Done
                        </Button>
                      )}
                    </div>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </>
      )}
    </div>
  );
}
