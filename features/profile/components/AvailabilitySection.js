"use client";
import { useState } from "react";
import { CalendarRange, Pencil, X } from "lucide-react";
import { Card, CardHeader, Button, Select, Input, Toggle } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { profileService } from "../services/profileService";
import { WORKING_DAYS, TIMEZONES, CONSULTATION_DURATIONS } from "@/constants/options";

function formatWorkingHours(wh) {
  if (!wh) return "—";
  if (typeof wh === "string") return wh;
  if (typeof wh === "object") {
    if (wh.text) return wh.text;
    if (wh.start && wh.end) return `${wh.start} – ${wh.end}`;
    try {
      return JSON.stringify(wh);
    } catch {
      return "—";
    }
  }
  return String(wh);
}

export default function AvailabilitySection({ availability, onUpdated }) {
  const { success, error: notifyError } = useNotifications();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const data = availability || {};
  const days = Array.isArray(data.working_days) ? data.working_days : [];

  function startEdit() {
    setForm({
      working_days: days,
      working_hours: formatWorkingHours(data.working_hours) === "—" ? "" : formatWorkingHours(data.working_hours),
      timezone: data.timezone || "",
      consultation_duration: data.consultation_duration || "",
      vacation_mode: Boolean(data.vacation_mode),
    });
    setEditing(true);
  }

  function toggleDay(day) {
    setForm((f) => {
      const set = new Set(f.working_days || []);
      set.has(day) ? set.delete(day) : set.add(day);
      return { ...f, working_days: WORKING_DAYS.filter((d) => set.has(d)) };
    });
  }

  async function save() {
    setSaving(true);
    try {
      const aggregate = await profileService.updateAvailability(form);
      onUpdated?.(aggregate);
      success("Availability updated");
      setEditing(false);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const durationLabel =
    CONSULTATION_DURATIONS.find((d) => d.value === String(data.consultation_duration))?.label ||
    (data.consultation_duration ? `${data.consultation_duration} minutes` : "—");

  return (
    <Card>
      <CardHeader
        title="Availability"
        subtitle="When clients can book you"
        icon={CalendarRange}
        action={
          editing ? (
            <Button size="sm" variant="ghost" icon={X} onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
          ) : (
            <Button size="sm" variant="secondary" icon={Pencil} onClick={startEdit}>
              Edit
            </Button>
          )
        }
      />

      {editing ? (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted-strong)" }}>
              Working Days
            </p>
            <div className="flex flex-wrap gap-1.5">
              {WORKING_DAYS.map((day) => {
                const active = (form.working_days || []).includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      background: active ? "var(--primary-dim)" : "var(--surface-raised)",
                      color: active ? "var(--primary)" : "var(--muted)",
                      border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                    }}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              name="working_hours"
              label="Working Hours"
              placeholder="e.g. 9:00 AM – 5:00 PM"
              value={form.working_hours}
              onChange={(e) => setForm((f) => ({ ...f, working_hours: e.target.value }))}
            />
            <Select
              name="timezone"
              label="Time Zone"
              options={TIMEZONES}
              value={form.timezone}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
            />
            <Select
              name="consultation_duration"
              label="Consultation Duration"
              options={CONSULTATION_DURATIONS}
              value={String(form.consultation_duration || "")}
              onChange={(e) => setForm((f) => ({ ...f, consultation_duration: e.target.value }))}
            />
          </div>

          <Toggle
            label="Vacation mode"
            description="Temporarily hide your availability from clients"
            checked={form.vacation_mode}
            onChange={(v) => setForm((f) => ({ ...f, vacation_mode: v }))}
          />

          <div className="flex justify-end">
            <Button onClick={save} loading={saving}>
              Save changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>
              Working Days
            </p>
            {days.length ? (
              <div className="flex flex-wrap gap-1.5">
                {days.map((d) => (
                  <span key={d} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: "var(--surface-hover)", color: "var(--muted-strong)" }}>
                    {d}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--foreground)" }}>—</p>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ["Working Hours", formatWorkingHours(data.working_hours)],
              ["Time Zone", data.timezone || "—"],
              ["Duration", durationLabel],
              ["Vacation Mode", data.vacation_mode ? "On" : "Off"],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs font-medium mb-0.5" style={{ color: "var(--muted)" }}>
                  {label}
                </p>
                <p className="text-sm" style={{ color: "var(--foreground)" }}>
                  {val}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
