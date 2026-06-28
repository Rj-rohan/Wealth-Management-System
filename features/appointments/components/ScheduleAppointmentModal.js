"use client";
import { useState, useEffect } from "react";
import { Modal, Input, Select, Button } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { clientsService } from "@/services/clients.service";
import { appointmentsService } from "@/services/appointments.service";

const TYPES = [
  { value: "video", label: "Video Call" },
  { value: "phone", label: "Phone Call" },
  { value: "in_person", label: "In Person" },
];
const DURATIONS = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
];
const TITLES = ["Portfolio Review", "Retirement Planning", "Tax Planning", "Financial Planning", "Risk Assessment", "Estate Planning", "Quarterly Check-in"];

export default function ScheduleAppointmentModal({ open, onClose, onCreated, presetClientId }) {
  const { success, error: notifyError } = useNotifications();
  const [clients, setClients] = useState([]);
  const [values, setValues] = useState({ clientId: presetClientId || "", title: "Portfolio Review", type: "video", date: "", time: "10:00", duration: "45" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) clientsService.list({ pageSize: 100 }).then((r) => setClients(r.items));
  }, [open]);

  useEffect(() => {
    if (presetClientId) setValues((v) => ({ ...v, clientId: presetClientId }));
  }, [presetClientId]);

  function update(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function save() {
    const next = {};
    if (!values.clientId) next.clientId = "Select a client";
    if (!values.date) next.date = "Pick a date";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const start = new Date(`${values.date}T${values.time}:00`).toISOString();
      const apt = await appointmentsService.create({
        clientId: values.clientId,
        title: values.title,
        type: values.type,
        start,
        duration: Number(values.duration),
      });
      success("Appointment scheduled");
      onCreated?.(apt);
      onClose();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule Appointment"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} loading={saving}>Schedule</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Client"
          className="sm:col-span-2"
          placeholder="Select a client"
          options={clients.map((c) => ({ value: c.id, label: c.name }))}
          value={values.clientId}
          onChange={(e) => update("clientId", e.target.value)}
          error={errors.clientId}
          required
        />
        <Select label="Meeting" options={TITLES} value={values.title} onChange={(e) => update("title", e.target.value)} />
        <Select label="Type" options={TYPES} value={values.type} onChange={(e) => update("type", e.target.value)} />
        <Input label="Date" type="date" name="date" value={values.date} onChange={(e) => update("date", e.target.value)} error={errors.date} required />
        <Input label="Time" type="time" name="time" value={values.time} onChange={(e) => update("time", e.target.value)} />
        <Select label="Duration" options={DURATIONS} value={values.duration} onChange={(e) => update("duration", e.target.value)} className="sm:col-span-2" />
      </div>
    </Modal>
  );
}
