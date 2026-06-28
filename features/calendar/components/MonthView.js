"use client";
import { motion } from "framer-motion";
import { WEEKDAYS, buildMonthGrid, isSameDay } from "../utils";
import { styleFor } from "./eventStyle";

export default function MonthView({ cursor, events, onSelectDay }) {
  const grid = buildMonthGrid(cursor);
  const today = new Date();
  const month = cursor.getMonth();

  function eventsOn(day) {
    return events.filter((e) => isSameDay(new Date(e.start), day));
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="grid grid-cols-7" style={{ borderBottom: "1px solid var(--border)" }}>
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-3 py-2 text-xs font-medium text-center" style={{ color: "var(--muted)" }}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grid.map((day, i) => {
          const inMonth = day.getMonth() === month;
          const isToday = isSameDay(day, today);
          const dayEvents = eventsOn(day);
          return (
            <motion.button
              key={i}
              onClick={() => onSelectDay(day, dayEvents)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.005, 0.15) }}
              className="text-left p-2 min-h-[92px] transition-colors"
              style={{
                borderRight: (i + 1) % 7 === 0 ? "none" : "1px solid var(--border)",
                borderBottom: i < 35 ? "1px solid var(--border)" : "none",
                background: isToday ? "var(--primary-dim)" : "transparent",
                opacity: inMonth ? 1 : 0.4,
              }}
              onMouseEnter={(e) => { if (!isToday) e.currentTarget.style.background = "var(--surface-hover)"; }}
              onMouseLeave={(e) => { if (!isToday) e.currentTarget.style.background = "transparent"; }}
            >
              <span
                className="inline-flex items-center justify-center text-xs font-medium w-6 h-6 rounded-full"
                style={{ color: isToday ? "var(--primary)" : "var(--foreground)", fontWeight: isToday ? 700 : 500 }}
              >
                {day.getDate()}
              </span>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map((e) => {
                  const s = styleFor(e.type);
                  return (
                    <div key={e.id} className="text-[10px] px-1.5 py-0.5 rounded-md truncate" style={{ background: s.bg, color: s.color }}>
                      {e.title}
                    </div>
                  );
                })}
                {dayEvents.length > 2 && (
                  <div className="text-[10px] px-1.5" style={{ color: "var(--muted)" }}>+{dayEvents.length - 2} more</div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
