"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Search } from "lucide-react";
import { Button, Skeleton, SearchBox, SegmentedControl } from "@/components/ui";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import { useFinancialPlans } from "../hooks/useFinancialPlans";
import { financialPlansService } from "@/services/financial-plans.service";
import PlanCard from "./PlanCard";
import { useNotifications } from "@/context/NotificationContext";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "under_review", label: "Review" },
  { value: "archived", label: "Archived" },
];

export default function FinancialPlansWorkspace() {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const { plans, loading, reload } = useFinancialPlans({ status, search });
  const router = useRouter();
  const { success } = useNotifications();

  async function handleDuplicate(plan) {
    await financialPlansService.duplicate(plan.id);
    success("Plan duplicated");
    reload();
  }

  async function handleArchive(plan) {
    await financialPlansService.archive(plan.id);
    success("Plan archived");
    reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchBox value={search} onChange={setSearch} placeholder="Search plans…" />
        <Button icon={Plus} size="sm" onClick={() => router.push("/financial-plans/new")}>New Plan</Button>
      </div>

      <SegmentedControl options={STATUS_FILTERS} value={status} onChange={setStatus} />

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} height={220} rounded={16} />)}
        </div>
      )}

      {!loading && plans.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <FileText size={40} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--muted-strong)" }}>No financial plans found</p>
        </div>
      )}

      {!loading && plans.length > 0 && (
        <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((p) => (
            <StaggerItem key={p.id}>
              <PlanCard plan={p} onClick={() => router.push(`/financial-plans/${p.id}`)} onDuplicate={handleDuplicate} onArchive={handleArchive} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}
