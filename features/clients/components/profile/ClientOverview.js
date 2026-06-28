"use client";
import { Card, CardHeader } from "@/components/ui";
import { UserRound, Wallet } from "lucide-react";
import { formatCompact, formatDate, timeAgo } from "@/utils/format";
import GoalsList from "./GoalsList";

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium mb-0.5" style={{ color: "var(--muted)" }}>{label}</p>
      <p className="text-sm" style={{ color: "var(--foreground)" }}>{value || "—"}</p>
    </div>
  );
}

export default function ClientOverview({ client }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <Card>
          <CardHeader title="Personal Information" icon={UserRound} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            <Field label="Email" value={client.email} />
            <Field label="Phone" value={client.phone} />
            <Field label="Age" value={client.age} />
            <Field label="Occupation" value={client.occupation} />
            <Field label="Location" value={client.location} />
            <Field label="Client Since" value={formatDate(client.joinedDate)} />
          </div>
        </Card>
        <GoalsList goals={client.goals} />
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader title="Financial Snapshot" icon={Wallet} />
          <div className="space-y-3">
            {[
              ["Net Worth", formatCompact(client.netWorth)],
              ["Assets", formatCompact(client.assets)],
              ["Liabilities", formatCompact(client.liabilities)],
              ["Annual Income", formatCompact(client.income)],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--muted-strong)" }}>{label}</span>
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{val}</span>
              </div>
            ))}
            <div className="pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="text-xs" style={{ color: "var(--muted)" }}>Last contact {timeAgo(client.lastContact)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
