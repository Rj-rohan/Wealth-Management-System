"use client";
import { useState } from "react";
import { Bell } from "lucide-react";
import { Card, CardHeader, Toggle } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { settingsService } from "../services/settingsService";

const ITEMS = [
  { key: "email", label: "Email notifications", description: "Receive important updates by email" },
  { key: "push", label: "Push notifications", description: "Get real-time alerts in your browser" },
  { key: "meeting_reminders", label: "Meeting reminders", description: "Be reminded before scheduled consultations" },
  { key: "product_updates", label: "Product updates", description: "News about new features and improvements" },
];

export default function NotificationPreferences({ settings, onUpdated }) {
  const { error: notifyError } = useNotifications();
  const [saving, setSaving] = useState(null);
  const prefs = settings?.notifications || {};

  async function toggle(key, value) {
    setSaving(key);
    const next = { ...prefs, [key]: value };
    try {
      const data = await settingsService.update({ notifications: next });
      onUpdated?.(data.settings);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card>
      <CardHeader title="Notification Preferences" subtitle="Choose what you want to hear about" icon={Bell} />
      <div className="space-y-4">
        {ITEMS.map((item) => (
          <Toggle
            key={item.key}
            label={item.label}
            description={item.description}
            checked={Boolean(prefs[item.key])}
            disabled={saving === item.key}
            onChange={(v) => toggle(item.key, v)}
          />
        ))}
      </div>
    </Card>
  );
}
