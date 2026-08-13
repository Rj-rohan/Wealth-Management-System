"use client";
import { useState } from "react";
import { Tabs, Skeleton } from "@/components/ui";
import ClientSelector from "@/components/ui/ClientSelector";
import { useFinancialAnalysis } from "../hooks/useFinancialAnalysis";
import NetWorthAnalysis from "./NetWorthAnalysis";
import CashFlowAnalysis from "./CashFlowAnalysis";
import IncomeBreakdown from "./IncomeBreakdown";
import ExpenseBreakdown from "./ExpenseBreakdown";
import DebtAnalysis from "./DebtAnalysis";
import EmergencyFundCard from "./EmergencyFundCard";
import FinancialHealthScore from "./FinancialHealthScore";
import { TrendingUp, ArrowLeftRight, DollarSign, CreditCard, Shield, Activity } from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "networth", label: "Net Worth", icon: TrendingUp },
  { id: "cashflow", label: "Cash Flow", icon: ArrowLeftRight },
  { id: "income", label: "Income", icon: DollarSign },
  { id: "expenses", label: "Expenses", icon: DollarSign },
  { id: "debt", label: "Debt", icon: CreditCard },
  { id: "emergency", label: "Emergency Fund", icon: Shield },
];

export default function FinancialAnalysisWorkspace() {
  const [clientId, setClientId] = useState("");
  const [tab, setTab] = useState("overview");
  const { data, loading } = useFinancialAnalysis(clientId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <ClientSelector value={clientId} onChange={setClientId} />
      </div>

      {!clientId && (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Activity size={40} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--muted-strong)" }}>Select a client to view their financial analysis</p>
        </div>
      )}

      {clientId && loading && (
        <div className="space-y-4">
          <Skeleton height={44} rounded={12} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton height={200} rounded={16} />
            <Skeleton height={200} rounded={16} />
            <Skeleton height={200} rounded={16} />
          </div>
        </div>
      )}

      {clientId && !loading && data && (
        <>
          <Tabs tabs={TABS} active={tab} onChange={setTab} />

          {tab === "overview" && (
            <div className="space-y-5">
              <FinancialHealthScore data={data} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <NetWorthAnalysis data={data} compact />
                <CashFlowAnalysis data={data} compact />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <IncomeBreakdown data={data} compact />
                <ExpenseBreakdown data={data} compact />
                <EmergencyFundCard data={data} />
              </div>
            </div>
          )}
          {tab === "networth" && <NetWorthAnalysis data={data} />}
          {tab === "cashflow" && <CashFlowAnalysis data={data} />}
          {tab === "income" && <IncomeBreakdown data={data} />}
          {tab === "expenses" && <ExpenseBreakdown data={data} />}
          {tab === "debt" && <DebtAnalysis data={data} />}
          {tab === "emergency" && <EmergencyFundCard data={data} full />}
        </>
      )}
    </div>
  );
}
