"use client";
import { LayoutGrid, Table2, ArrowUpDown, Plus } from "lucide-react";
import { SearchBox, Select, SegmentedControl, Button } from "@/components/ui";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "prospect", label: "Prospect" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
];

const RISK_OPTIONS = [
  { value: "all", label: "All risk levels" },
  { value: "conservative", label: "Conservative" },
  { value: "moderate", label: "Moderate" },
  { value: "aggressive", label: "Aggressive" },
];

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "netWorth", label: "Net Worth" },
  { value: "status", label: "Status" },
  { value: "lastContact", label: "Last Contact" },
];

export default function ClientFilters({ query, onChange, view, onViewChange, onAdd }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex-1 min-w-[200px]">
          <SearchBox value={query.search} onChange={(v) => onChange({ search: v })} placeholder="Search clients by name, email, occupation…" />
        </div>
        <SegmentedControl
          size="sm"
          options={[
            { value: "grid", label: "Grid", icon: LayoutGrid },
            { value: "table", label: "Table", icon: Table2 },
          ]}
          value={view}
          onChange={onViewChange}
        />
        <Button icon={Plus} onClick={onAdd}>
          Add Client
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Select className="!w-auto min-w-[150px]" options={STATUS_OPTIONS} value={query.status} onChange={(e) => onChange({ status: e.target.value })} placeholder="Status" />
        <Select className="!w-auto min-w-[160px]" options={RISK_OPTIONS} value={query.risk} onChange={(e) => onChange({ risk: e.target.value })} placeholder="Risk" />
        <Select className="!w-auto min-w-[150px]" options={SORT_OPTIONS} value={query.sortBy} onChange={(e) => onChange({ sortBy: e.target.value })} placeholder="Sort by" />
        <button
          onClick={() => onChange({ sortDir: query.sortDir === "asc" ? "desc" : "asc" })}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm transition-colors"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", color: "var(--muted-strong)" }}
          title="Toggle sort direction"
        >
          <ArrowUpDown size={15} />
          {query.sortDir === "asc" ? "Asc" : "Desc"}
        </button>
      </div>
    </div>
  );
}
