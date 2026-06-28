"use client";
import { motion } from "framer-motion";
import { buildWeekDays, isSameDay, HOURS } from "../utils";
import { styleFor } from "./eventStyle";
import { formatTime } from "@/utils/format";

export default function WeekView({ cursor, events, onSelectEvent }) {
  const days = buildWeekDays(cursor);
  const today = new Date();

  return (
    <div className="rounded-2xl overflow-hidden overflow-x-auto" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="min-w-[760px]">
        <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)", borderBottom: "1px solid var(--border)" }}>
          <div />
          {days.map((d) => {
            const isToday = isSameDay(d, today);
            return (
              <div key={d.toISOString()} className="px-2 py-2 text-center" style={{ borderLeft: "1px solid var(--border)" }}>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{d.toLocaleDateString("en-US", { weekday: "short" })}</p>
                <p className="text-sm font-semibold" style={{ color: isToday ? "var(--primary)" : "var(--foreground)" }}>{d.getDate()}</p>
              </div>
            );
          })}
        </div>

        <div className="relative">
          {HOURS.map((h) => (
            <div key={h} className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)", borderBottom: "1px solid var(--border)", minHeight: 56 }}>
              <div className="px-2 py-1 text-[11px]" style={{ color: "var(--muted)" }}>{h}:00</div>
              {days.map((d) => {
                const cellEvents = events.filter((e) => {
                  const ed = new Date(e.start);
                  return isSameDay(ed, d) && ed.getHours() === h;
                });
                return (
                  <div key={d.toISOString() + h} className="p-1 space-y-1" style={{ borderLeft: "1px solid var(--border)" }}>
                    {cellEvents.map((e) => {
                      const s = styleFor(e.type);
                      return (
                        <motion.button
                          key={e.id}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => onSelectEvent?.(e)}
                          className="w-full text-left text-[10px] px-1.5 py-1 rounded-md truncate"
                          style={{ background: s.bg, color: s.color }}
                        >
                          <span className="font-medium">{formatTime(e.start)}</span> {e.title}
                        </motion.button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
