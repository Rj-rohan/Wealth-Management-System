import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { CalendarClock, Plus, Video, CalendarCheck } from "lucide-react";
import { SegmentedControl, Button, Skeleton, EmptyState, Badge } from "@/components/ui";
import { appointmentsService } from "@/services/appointments.service";
import AppointmentCard from "./AppointmentCard";
import ScheduleMeetingModal from "./ScheduleMeetingModal";

export default function AppointmentsWorkspace() {
  const [scope, setScope] = useState("upcoming");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await appointmentsService.list({ scope });
    setItems(data);
    setLoading(false);
  }, [scope]);

  useEffect(() => {
    load();
    // Check Google connection status
    fetch("/api/google/status")
      .then((r) => r.json())
      .then((d) => {
        if (d?.data?.isConnected) setGoogleConnected(true);
      })
      .catch(() => {});
  }, [load]);

  async function handleConnectGoogle() {
    try {
      const res = await fetch("/api/google/oauth");
      const data = await res.json();
      if (data?.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (err) {
      console.error("Failed to get Google OAuth URL:", err);
    }
  }

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
        <div className="flex items-center gap-2">
          {googleConnected ? (
            <Badge tone="success">
              <CalendarCheck size={13} className="mr-1 inline" /> Google Calendar Connected
            </Badge>
          ) : (
            <Button size="sm" variant="secondary" onClick={handleConnectGoogle}>
              Connect Google Calendar
            </Button>
          )}
          <Button icon={Plus} onClick={() => setScheduleOpen(true)}>
            Schedule Meeting
          </Button>
        </div>
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
          description={scope === "upcoming" ? "Schedule a Google Meet consultation to get started." : "Completed meetings will appear here."}
          action={scope === "upcoming" ? <Button onClick={() => setScheduleOpen(true)}>Schedule Meeting</Button> : null}
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

      <ScheduleMeetingModal isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} onCreated={load} />
    </div>
  );
}
