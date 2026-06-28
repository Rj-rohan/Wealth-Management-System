"use client";
import { Video, Phone, MapPin, CalendarClock } from "lucide-react";
import { Card, CardHeader, StatusBadge, EmptyState } from "@/components/ui";
import { formatDate, formatTime } from "@/utils/format";

const TYPE_ICON = { video: Video, phone: Phone, in_person: MapPin };

export default function MeetingHistory({ appointments = [] }) {
  const sorted = [...appointments].sort((a, b) => new Date(b.start) - new Date(a.start));
  return (
    <Card>
      <CardHeader title="Meeting History" subtitle="Past and upcoming consultations" icon={CalendarClock} />
      {sorted.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No meetings yet" />
      ) : (
        <div className="space-y-2">
          {sorted.map((a) => {
            const Icon = TYPE_ICON[a.type] || Video;
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
                <span className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0" style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>
                  <Icon size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{a.title}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {formatDate(a.start)} · {formatTime(a.start)} · {a.duration} min
                  </p>
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
