"use client";
import { use } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import ReportPreview from "@/features/reports/components/ReportPreview";
import { useReportData } from "@/features/reports/hooks/useReports";
import { Skeleton } from "@/components/ui";

export default function ReportTypePage({ params }) {
  const { type } = use(params);
  const searchParams = useSearchParams();
  const clientId = searchParams.get("client") || "";
  const { data, loading } = useReportData(clientId, type);

  return (
    <AppShell title="Report" subtitle="Financial report preview">
      <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
        <PageTransition>
          {loading ? (
            <div className="space-y-4">
              <Skeleton height={80} rounded={16} />
              <Skeleton height={400} rounded={16} />
            </div>
          ) : data ? (
            <ReportPreview data={data} />
          ) : (
            <div className="rounded-2xl p-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--muted)" }}>No data available for this report</p>
            </div>
          )}
        </PageTransition>
      </div>
    </AppShell>
  );
}
