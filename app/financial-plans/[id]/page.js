"use client";
import { use } from "react";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import PlanDetail from "@/features/financial-plans/components/PlanDetail";
import { usePlanDetail } from "@/features/financial-plans/hooks/useFinancialPlans";
import { Skeleton } from "@/components/ui";

export default function PlanDetailPage({ params }) {
  const { id } = use(params);
  const { plan, loading } = usePlanDetail(id);

  return (
    <AppShell title="Financial Plan" subtitle="Plan details">
      <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto">
        <PageTransition>
          {loading ? (
            <div className="space-y-4">
              <Skeleton height={140} rounded={16} />
              <Skeleton height={200} rounded={16} />
              <Skeleton height={300} rounded={16} />
            </div>
          ) : (
            <PlanDetail plan={plan} />
          )}
        </PageTransition>
      </div>
    </AppShell>
  );
}
