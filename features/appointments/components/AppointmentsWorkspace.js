"use client";
import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { CalendarClock, Plus } from "lucide-react";
import { SegmentedControl, Button, Skeleton, EmptyState } from "@/components/ui";
import { appointmentsService } from "@/services/appointments.service";
import AppointmentCard from "./AppointmentCard";
import ScheduleAppointmentModal from "./ScheduleAppointmentModal";

export default function AppointmentsWorkspace() {
  const [scope, setScope] = useState("upcoming");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await appointmentsService.list({ scope });
    setItems(data);
    setLoading(false);
  }, [scope]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SegmentedControl
          options={[
            { value: "upcoming", label: "Upcoming" },
            { value: "past", label: "Past" },
          ]}
          value={scope}
          onChange={setScope}
        />
        <Button icon={Plus} onClick={() => setScheduleOpen(true)}>
          Schedule Appointment
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={130} rounded={16} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={scope === "upcoming" ? "No upcoming appointments" : "No past appointments"}
          description={scope === "upcoming" ? "Schedule a consultation to get started." : "Completed meetings will appear here."}
          action={scope === "upcoming" ? <Button onClick={() => setScheduleOpen(true)}>Schedule Appointment</Button> : null}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {items.map((a) => (
              <AppointmentCard key={a.id} appointment={a} onChanged={load} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <ScheduleAppointmentModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} onCreated={load} />
    </div>
  );
}
