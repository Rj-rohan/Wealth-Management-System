"use client";
import Card, { CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui";
import { FileText, Clock } from "lucide-react";
import { formatDate } from "@/utils/format";
import Link from "next/link";

export default function RecentPlans({ plans = [] }) {
  if (!plans.length) return null;

  const STATUS_TONE = { draft: "neutral", active: "success", under_review: "warning", completed: "info", archived: "neutral" };

  return (
    <Card>
      <CardHeader title="Recent Plans" subtitle={`${plans.length} plans`} icon={FileText} action={
        <Link href="/financial-plans" className="text-xs font-medium" style={{ color: "var(--primary)" }}>View all</Link>
      } />
      <div className="space-y-1">
        {plans.map((p) => (
          <Link key={p.id} href={`/financial-plans/${p.id}`} className="flex items-center justify-between py-2.5 transition-colors rounded-lg px-1"
            style={{ borderBottom: "1px solid var(--border)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{p.clientName}</p>
              <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{p.title}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <Badge tone={STATUS_TONE[p.status]}>{p.status.replace(/_/g, " ")}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
