"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button, SegmentedControl, Skeleton, Modal } from "@/components/ui";
import { calendarService } from "@/services/calendar.service";
import { addDays, addMonths, buildMonthGrid, buildWeekDays, monthLabel, dayLabel, startOfDay } from "../utils";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DayView from "./DayView";
import { styleFor } from "./eventStyle";
import { formatTime } from "@/utils/format";
import ScheduleAppointmentModal from "@/features/appointments/components/ScheduleAppointmentModal";

export default function CalendarWorkspace() {
  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayModal, setDayModal] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const range = useCallback(() => {
    if (view === "month") {
      const grid = buildMonthGrid(cursor);
      return { start: grid[0], end: addDays(grid[grid.length - 1], 1) };
    }
    if (view === "week") {
      const days = buildWeekDays(cursor);
      return { start: days[0], end: addDays(days[6], 1) };
    }
    return { start: startOfDay(cursor), end: addDays(startOfDay(cursor), 1) };
  }, [view, cursor]);

  const load = useCallback(async () => {
    setLoading(true);
    const { start, end } = range();
    const data = await calendarService.events({ start: start.toISOString(), end: end.toISOString() });
    setEvents(data);
    setLoading(false);
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  function navigate(dir) {
    if (view === "month") setCursor((c) => addMonths(c, dir));
    else if (view === "week") setCursor((c) => addDays(c, dir * 7));
    else setCursor((c) => addDays(c, dir));
  }

  const heading = view === "day" ? dayLabel(cursor) : view === "week" ? `Week of ${buildWeekDays(cursor)[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : monthLabel(cursor);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", color: "var(--muted-strong)" }} aria-label="Previous">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => navigate(1)} className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", color: "var(--muted-strong)" }} aria-label="Next">
            <ChevronRight size={16} />
          </button>
          <button onClick={() => setCursor(new Date())} className="px-3 py-2 rounded-xl text-sm font-medium" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", color: "var(--muted-strong)" }}>
            Today
          </button>
          <h2 className="text-base font-semibold ml-1" style={{ color: "var(--foreground)" }}>{heading}</h2>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl
            size="sm"
            options={[
              { value: "month", label: "Month" },
              { value: "week", label: "Week" },
              { value: "day", label: "Day" },
            ]}
            value={view}
            onChange={setView}
          />
          <Button icon={Plus} onClick={() => setScheduleOpen(true)}>New</Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {[["meeting", "Meeting"], ["blocked", "Blocked time"], ["holiday", "Holiday"]].map(([type, label]) => {
          const s = styleFor(type);
          return (
            <span key={type} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.dot }} /> {label}
            </span>
          );
        })}
      </div>

      {loading ? (
        <Skeleton height={420} rounded={16} />
      ) : view === "month" ? (
        <MonthView cursor={cursor} events={events} onSelectDay={(day, dayEvents) => setDayModal({ day, events: dayEvents })} />
      ) : view === "week" ? (
        <WeekView cursor={cursor} events={events} onSelectEvent={() => {}} />
      ) : (
        <DayView cursor={cursor} events={events} onSelectEvent={() => {}} />
      )}

      <Modal open={Boolean(dayModal)} onClose={() => setDayModal(null)} title={dayModal ? dayLabel(dayModal.day) : ""}>
        {dayModal?.events.length ? (
          <div className="space-y-2">
            {dayModal.events.map((e) => {
              const s = styleFor(e.type);
              return (
                <div key={e.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{e.title}</p>
                    {e.clientName && <p className="text-xs" style={{ color: "var(--muted)" }}>{e.clientName}</p>}
                  </div>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{e.allDay ? "All day" : formatTime(e.start)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Nothing scheduled for this day.</p>
        )}
      </Modal>

      <ScheduleAppointmentModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} onCreated={load} />
    </div>
  );
}
