"use client";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import GoalPlanningWorkspace from "@/features/goal-planning/components/GoalPlanningWorkspace";

export default function GoalsPage() {
  return (
    <AppShell title="Goal Planning" subtitle="Track and manage financial goals">
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        <PageTransition>
          <GoalPlanningWorkspace />
        </PageTransition>
      </div>
    </AppShell>
  );
}
