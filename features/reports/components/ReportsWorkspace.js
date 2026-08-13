"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui";
import ClientSelector from "@/components/ui/ClientSelector";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import { useReports } from "../hooks/useReports";
import { FileBarChart, Activity, TrendingUp, ArrowLeftRight, Target, LineChart, PieChart, Shield } from "lucide-react";

const ICON_MAP = {
  Activity, TrendingUp, ArrowLeftRight, Target, LineChart, PieChart, Shield,
  Sunset: TrendingUp, FileBarChart,
};

export default function ReportsWorkspace() {
  const [clientId, setClientId] = useState("");
  const { reportTypes, loading } = useReports();
  const router = useRouter();

  function handleReportClick(type) {
    if (!clientId) return;
    router.push(`/reports/${type}?client=${clientId}`);
  }

  return (
    <div className="space-y-5">
      <ClientSelector value={clientId} onChange={setClientId} />

      {!clientId && (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <FileBarChart size={40} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--muted-strong)" }}>Select a client to generate financial reports</p>
        </div>
      )}

      {clientId && loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={160} rounded={16} />)}
        </div>
      )}

      {clientId && !loading && (
        <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {reportTypes.map((r) => {
            const Icon = ICON_MAP[r.icon] || FileBarChart;
            return (
              <StaggerItem key={r.type}>
                <button
                  onClick={() => handleReportClick(r.type)}
                  className="w-full text-left rounded-2xl p-5 transition-all duration-200 group"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}
                >
                  <span className="flex items-center justify-center w-11 h-11 rounded-xl mb-3 transition-colors"
                    style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>
                    <Icon size={20} />
                  </span>
                  <h4 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{r.title}</h4>
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--muted)" }}>{r.description}</p>
                </button>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}
    </div>
  );
}
