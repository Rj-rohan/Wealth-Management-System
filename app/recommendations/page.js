"use client";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import RecommendationsWorkspace from "@/features/recommendations/components/RecommendationsWorkspace";

export default function RecommendationsPage() {
  return (
    <AppShell title="Personalized Advice" subtitle="Advisor-driven personalized financial advice">
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        <PageTransition>
          <RecommendationsWorkspace />
        </PageTransition>
      </div>
    </AppShell>
  );
}
