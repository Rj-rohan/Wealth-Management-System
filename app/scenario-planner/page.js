"use client";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import ScenarioPlannerWorkspace from "@/features/scenario-planner/components/ScenarioPlannerWorkspace";

export default function ScenarioPlannerPage() {
  return (
    <AppShell title="Scenario Planner" subtitle="What-if financial simulations">
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        <PageTransition>
          <ScenarioPlannerWorkspace />
        </PageTransition>
      </div>
    </AppShell>
  );
}
