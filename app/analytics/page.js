"use client";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import AnalyticsWorkspace from "@/features/analytics/components/AnalyticsWorkspace";

export default function AnalyticsPage() {
  return (
    <AppShell title="Analytics" subtitle="Insights across your practice">
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        <PageTransition>
          <AnalyticsWorkspace />
        </PageTransition>
      </div>
    </AppShell>
  );
}
