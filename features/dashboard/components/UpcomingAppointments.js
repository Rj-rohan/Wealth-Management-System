"use client";
import { CalendarClock, Clock } from "lucide-react";
import { Card, CardHeader, Badge, Avatar, EmptyState } from "@/components/ui";
import { UPCOMING_APPOINTMENTS } from "../constants";

export default function UpcomingAppointments() {
  const items = UPCOMING_APPOINTMENTS;

  return (
    <Card>
      <CardHeader title="Upcoming Appointments" subtitle="Your next consultations" icon={CalendarClock} />
      {items.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No upcoming appointments" description="New consultations will appear here." />
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-xl p-3 transition-colors"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
            >
              <Avatar name={a.client} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                  {a.client}
                </p>
                <p className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                  <Clock size={11} /> {a.time} · {a.type}
                </p>
              </div>
              <Badge tone={a.status === "confirmed" ? "success" : "warning"}>
                {a.status === "confirmed" ? "Confirmed" : "Pending"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
