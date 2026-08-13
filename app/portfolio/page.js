"use client";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import PortfolioWorkspace from "@/features/portfolio-review/components/PortfolioWorkspace";

export default function PortfolioPage() {
  return (
    <AppShell title="Portfolio Review" subtitle="Portfolio analysis & management">
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        <PageTransition>
          <PortfolioWorkspace />
        </PageTransition>
      </div>
    </AppShell>
  );
}
