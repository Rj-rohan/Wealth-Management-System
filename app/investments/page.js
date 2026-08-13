"use client";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import InvestmentAdvisoryWorkspace from "@/features/investment-advisory/components/InvestmentAdvisoryWorkspace";

export default function InvestmentsPage() {
  return (
    <AppShell title="Investments" subtitle="Investment advisory & recommendations">
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        <PageTransition>
          <InvestmentAdvisoryWorkspace />
        </PageTransition>
      </div>
    </AppShell>
  );
}
