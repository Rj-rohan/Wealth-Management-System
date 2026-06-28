"use client";
import { useRouter } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { Card, CardHeader, Avatar, EmptyState, Button } from "@/components/ui";
import { timeAgo } from "@/utils/format";

export default function LatestMessages({ conversations = [] }) {
  const router = useRouter();
  return (
    <Card>
      <CardHeader
        title="Latest Messages"
        subtitle="Unread conversations"
        icon={MessagesSquare}
        action={<Button size="sm" variant="ghost" onClick={() => router.push("/messages")}>Open</Button>}
      />
      {conversations.length === 0 ? (
        <EmptyState icon={MessagesSquare} title="No unread messages" description="You're all caught up." />
      ) : (
        <div className="space-y-1.5">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => router.push("/messages")}
              className="w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Avatar name={c.clientName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{c.clientName}</p>
                <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{c.lastMessage}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>{timeAgo(c.lastAt)}</span>
                <span className="flex items-center justify-center text-[10px] font-bold rounded-full" style={{ minWidth: 18, height: 18, padding: "0 5px", background: "var(--primary)", color: "#fff" }}>
                  {c.unread}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
