"use client";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import RiskAssessmentWorkspace from "@/features/risk-assessment/components/RiskAssessmentWorkspace";

export default function RiskAssessmentPage() {
  return (
    <AppShell title="Risk Assessment" subtitle="Client risk profiling & analysis">
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        <PageTransition>
          <RiskAssessmentWorkspace />
        </PageTransition>
      </div>
    </AppShell>
  );
}
