"use client";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import ReportsWorkspace from "@/features/reports/components/ReportsWorkspace";

export default function ReportsPage() {
  return (
    <AppShell title="Reports" subtitle="Generate professional financial reports">
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        <PageTransition>
          <ReportsWorkspace />
        </PageTransition>
      </div>
    </AppShell>
  );
}
