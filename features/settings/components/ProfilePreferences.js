"use client";
import { useState } from "react";
import { SlidersHorizontal, Moon, Sun, Monitor } from "lucide-react";
import { Card, CardHeader } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { settingsService } from "../services/settingsService";

const THEMES = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
];

export default function ProfilePreferences({ settings, onUpdated }) {
  const { success, error: notifyError } = useNotifications();
  const [saving, setSaving] = useState(false);
  const theme = settings?.theme || "dark";

  async function setTheme(value) {
    setSaving(true);
    try {
      const data = await settingsService.update({ theme: value });
      onUpdated?.(data.settings);
      success("Preferences saved");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Profile Preferences" subtitle="Personalize your workspace appearance" icon={SlidersHorizontal} />
      <p className="text-xs font-medium mb-2" style={{ color: "var(--muted-strong)" }}>
        Theme
      </p>
      <div className="grid grid-cols-3 gap-2.5 max-w-md">
        {THEMES.map(({ value, label, icon: Icon }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              disabled={saving}
              onClick={() => setTheme(value)}
              className="flex flex-col items-center gap-2 rounded-xl py-4 transition-all duration-150"
              style={{
                background: active ? "var(--primary-dim)" : "var(--surface-raised)",
                border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                color: active ? "var(--primary)" : "var(--muted-strong)",
              }}
            >
              <Icon size={18} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>
        Light and system themes will be available in an upcoming release.
      </p>
    </Card>
  );
}
