"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Phone, MapPin, Clock, MoreVertical, CalendarClock, XCircle, NotebookPen } from "lucide-react";
import { Avatar, StatusBadge, Button, Input, Textarea } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { appointmentsService } from "@/services/appointments.service";
import { formatDate, formatTime } from "@/utils/format";

const TYPE = {
  video: { icon: Video, label: "Video" },
  phone: { icon: Phone, label: "Phone" },
  in_person: { icon: MapPin, label: "In Person" },
};

export default function AppointmentCard({ appointment, onChanged }) {
  const { success, error: notifyError } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState(null); // 'reschedule' | 'notes'
  const [busy, setBusy] = useState(false);
  const [rescheduleAt, setRescheduleAt] = useState("");
  const [notes, setNotes] = useState(appointment.notes || "");

  const type = TYPE[appointment.type] || TYPE.video;
  const TypeIcon = type.icon;
  const isUpcoming = appointment.status === "upcoming";

  async function cancel() {
    setBusy(true);
    try {
      await appointmentsService.cancel(appointment.id);
      success("Appointment cancelled");
      onChanged?.();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveReschedule() {
    if (!rescheduleAt) return;
    setBusy(true);
    try {
      await appointmentsService.reschedule(appointment.id, new Date(rescheduleAt).toISOString());
      success("Appointment rescheduled");
      setPanel(null);
      onChanged?.();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveNotes() {
    setBusy(true);
    try {
      await appointmentsService.saveNotes(appointment.id, notes);
      success("Notes saved");
      setPanel(null);
      onChanged?.();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      className="rounded-2xl p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start gap-3">
        <span className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0" style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>
          <TypeIcon size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{appointment.title}</p>
            <StatusBadge status={appointment.status} kind="appointment" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Avatar name={appointment.clientName} size="xs" />
            <span className="text-xs" style={{ color: "var(--muted-strong)" }}>{appointment.clientName}</span>
          </div>
          <p className="flex items-center gap-1.5 text-xs mt-1.5" style={{ color: "var(--muted)" }}>
            <Clock size={12} /> {formatDate(appointment.start)} · {formatTime(appointment.start)} · {appointment.duration} min · {type.label}
          </p>
        </div>

        {isUpcoming && (
          <div className="relative">
            <button onClick={() => setMenuOpen((o) => !o)} className="p-1.5 rounded-lg" style={{ color: "var(--muted)" }} aria-label="Actions">
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-1 w-44 rounded-xl overflow-hidden z-20 py-1"
                style={{ background: "var(--surface-raised)", border: "1px solid var(--border-strong)", boxShadow: "0 16px 40px rgba(0,0,0,0.45)" }}
              >
                <button onClick={() => { setPanel("reschedule"); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm" style={{ color: "var(--muted-strong)" }}>
                  <CalendarClock size={14} /> Reschedule
                </button>
                <button onClick={() => { setPanel("notes"); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm" style={{ color: "var(--muted-strong)" }}>
                  <NotebookPen size={14} /> Meeting notes
                </button>
                <button onClick={() => { cancel(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm" style={{ color: "var(--danger)" }}>
                  <XCircle size={14} /> Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {panel === "reschedule" && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 pt-3 flex items-end gap-2" style={{ borderTop: "1px solid var(--border)" }}>
              <Input type="datetime-local" name="reschedule" label="New date & time" value={rescheduleAt} onChange={(e) => setRescheduleAt(e.target.value)} />
              <Button size="sm" onClick={saveReschedule} loading={busy}>Save</Button>
            </div>
          </motion.div>
        )}
        {panel === "notes" && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
              <Textarea name="notes" rows={3} placeholder="Meeting notes…" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setPanel(null)}>Close</Button>
                <Button size="sm" onClick={saveNotes} loading={busy}>Save notes</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isUpcoming && appointment.notes && (
        <p className="text-xs mt-3 pt-3" style={{ color: "var(--muted)", borderTop: "1px solid var(--border)" }}>
          {appointment.notes}
        </p>
      )}
    </motion.div>
  );
}
