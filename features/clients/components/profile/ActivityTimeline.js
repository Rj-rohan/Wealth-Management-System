"use client";
import { motion } from "framer-motion";
import { CalendarClock, FileText, StickyNote, Activity } from "lucide-react";
import { Card, CardHeader, EmptyState } from "@/components/ui";
import { formatDate, formatTime } from "@/utils/format";

const ICONS = { meeting: CalendarClock, document: FileText, note: StickyNote };

export default function ActivityTimeline({ client }) {
  const events = [
    ...(client.appointments || []).map((a) => ({
      id: a.id,
      kind: "meeting",
      title: a.title,
      detail: `${a.type.replace("_", " ")} · ${a.status}`,
      at: a.start,
    })),
    ...(client.documents || []).map((d) => ({ id: d.id, kind: "document", title: `Document: ${d.name}`, detail: d.category, at: d.uploadedAt })),
    ...(client.notes || []).map((n) => ({ id: n.id, kind: "note", title: n.title, detail: n.type, at: n.createdAt })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at));

  return (
    <Card>
      <CardHeader title="Activity Timeline" subtitle="Everything that's happened" icon={Activity} />
      {events.length === 0 ? (
        <EmptyState icon={Activity} title="No activity yet" />
      ) : (
        <div className="space-y-1">
          {events.map((e, i) => {
            const Icon = ICONS[e.kind] || Activity;
            const last = i === events.length - 1;
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ background: "var(--surface-raised)", color: "var(--primary)", border: "1px solid var(--border)" }}>
                    <Icon size={14} />
                  </span>
                  {!last && <span className="flex-1 w-px my-1" style={{ background: "var(--border)" }} />}
                </div>
                <div className="pb-4 min-w-0">
                  <p className="text-sm truncate" style={{ color: "var(--foreground)" }}>{e.title}</p>
                  <p className="text-xs mt-0.5 capitalize" style={{ color: "var(--muted)" }}>
                    {e.detail} · {formatDate(e.at)} {formatTime(e.at)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
