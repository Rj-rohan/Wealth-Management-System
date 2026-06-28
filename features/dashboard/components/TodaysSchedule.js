"use client";
import { useRouter } from "next/navigation";
import { Video, Phone, MapPin, CalendarClock } from "lucide-react";
import { Card, CardHeader, StatusBadge, EmptyState, Button } from "@/components/ui";
import { formatTime } from "@/utils/format";

const TYPE_ICON = { video: Video, phone: Phone, in_person: MapPin };

export default function TodaysSchedule({ items = [] }) {
  const router = useRouter();
  return (
    <Card>
      <CardHeader
        title="Today's Schedule"
        subtitle="Your meetings today"
        icon={CalendarClock}
        action={<Button size="sm" variant="ghost" onClick={() => router.push("/calendar")}>Calendar</Button>}
      />
      {items.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No meetings today" description="Enjoy the open calendar, or schedule a consultation." />
      ) : (
        <div className="space-y-2">
          {items.map((a) => {
            const Icon = TYPE_ICON[a.type] || Video;
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
                <span className="text-xs font-mono w-14 flex-shrink-0" style={{ color: "var(--muted)" }}>{formatTime(a.start)}</span>
                <span className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>
                  <Icon size={15} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{a.title}</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{a.clientName}</p>
                </div>
                <StatusBadge status={a.status} kind="appointment" />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
