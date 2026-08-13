"use client";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import FinancialPlansWorkspace from "@/features/financial-plans/components/FinancialPlansWorkspace";

export default function FinancialPlansPage() {
  return (
    <AppShell title="Financial Plans" subtitle="Create and manage financial plans">
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        <PageTransition>
          <FinancialPlansWorkspace />
        </PageTransition>
      </div>
    </AppShell>
  );
}
