"use client";
import { motion } from "framer-motion";
import { Video, Phone, MapPin, Ban, PartyPopper } from "lucide-react";
import { isSameDay, HOURS, dayLabel } from "../utils";
import { styleFor } from "./eventStyle";
import { formatTime } from "@/utils/format";
import { EmptyState } from "@/components/ui";

const META_ICON = { video: Video, phone: Phone, in_person: MapPin, blocked: Ban, holiday: PartyPopper };

export default function DayView({ cursor, events, onSelectEvent }) {
  const dayEvents = events.filter((e) => isSameDay(new Date(e.start), cursor)).sort((a, b) => new Date(a.start) - new Date(b.start));

  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <p className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>{dayLabel(cursor)}</p>
      {dayEvents.length === 0 ? (
        <EmptyState title="Nothing scheduled" description="This day is clear." />
      ) : (
        <div className="space-y-2">
          {dayEvents.map((e, i) => {
            const s = styleFor(e.type);
            const Icon = META_ICON[e.meetingType] || META_ICON[e.type] || Video;
            return (
              <motion.button
                key={e.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onSelectEvent?.(e)}
                className="w-full flex items-center gap-3 rounded-xl p-3 text-left"
                style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
              >
                <span className="text-xs font-mono w-14 flex-shrink-0" style={{ color: "var(--muted)" }}>{e.allDay ? "All day" : formatTime(e.start)}</span>
                <span className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0" style={{ background: s.bg, color: s.color }}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{e.title}</p>
                  {e.clientName && <p className="text-xs" style={{ color: "var(--muted)" }}>{e.clientName}</p>}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
