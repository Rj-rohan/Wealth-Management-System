"use client";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { Card, CardHeader, Avatar, StatusBadge, EmptyState, Button } from "@/components/ui";
import { formatCompact, timeAgo } from "@/utils/format";

export default function RecentClients({ clients = [] }) {
  const router = useRouter();
  return (
    <Card>
      <CardHeader
        title="Recent Clients"
        subtitle="Recently contacted"
        icon={Users}
        action={<Button size="sm" variant="ghost" onClick={() => router.push("/clients")}>View all</Button>}
      />
      {clients.length === 0 ? (
        <EmptyState icon={Users} title="No clients yet" />
      ) : (
        <div className="space-y-1.5">
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => router.push(`/clients/${c.id}`)}
              className="w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Avatar name={c.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{c.name}</p>
                <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{formatCompact(c.netWorth)} · {timeAgo(c.lastContact)}</p>
              </div>
              <StatusBadge status={c.status} kind="client" />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
