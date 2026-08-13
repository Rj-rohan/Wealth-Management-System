"use client";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import FinancialAnalysisWorkspace from "@/features/financial-analysis/components/FinancialAnalysisWorkspace";

export default function FinancialAnalysisPage() {
  return (
    <AppShell title="Financial Analysis" subtitle="Client financial health overview">
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        <PageTransition>
          <FinancialAnalysisWorkspace />
        </PageTransition>
      </div>
    </AppShell>
  );
}
