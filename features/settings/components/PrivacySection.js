"use client";
import { useState } from "react";
import { EyeOff } from "lucide-react";
import { Card, CardHeader, Toggle } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { settingsService } from "../services/settingsService";

const ITEMS = [
  { key: "profile_visible", label: "Public profile", description: "Allow clients to discover your profile" },
  { key: "show_contact", label: "Show contact details", description: "Display your phone and email on your public profile" },
];

export default function PrivacySection({ settings, onUpdated }) {
  const { error: notifyError } = useNotifications();
  const [saving, setSaving] = useState(null);
  const privacy = settings?.privacy || {};

  async function toggle(key, value) {
    setSaving(key);
    const next = { ...privacy, [key]: value };
    try {
      const data = await settingsService.update({ privacy: next });
      onUpdated?.(data.settings);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card>
      <CardHeader title="Privacy" subtitle="Control your visibility" icon={EyeOff} />
      <div className="space-y-4">
        {ITEMS.map((item) => (
          <Toggle
            key={item.key}
            label={item.label}
            description={item.description}
            checked={Boolean(privacy[item.key])}
            disabled={saving === item.key}
            onChange={(v) => toggle(item.key, v)}
          />
        ))}
      </div>
    </Card>
  );
}
