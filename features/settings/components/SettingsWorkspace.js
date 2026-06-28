"use client";
import { useState } from "react";
import { SlidersHorizontal, Bell, ShieldCheck, EyeOff, UserCog } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { useSettings } from "../hooks/useSettings";
import ProfilePreferences from "./ProfilePreferences";
import NotificationPreferences from "./NotificationPreferences";
import SecuritySection from "./SecuritySection";
import PrivacySection from "./PrivacySection";
import AccountSection from "./AccountSection";

const SECTIONS = [
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "privacy", label: "Privacy", icon: EyeOff },
  { id: "account", label: "Account", icon: UserCog },
];

export default function SettingsWorkspace() {
  const { settings, setSettings, loading } = useSettings();
  const [active, setActive] = useState("preferences");

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">
      {/* Section nav */}
      <nav className="flex md:flex-col gap-1 overflow-x-auto">
        {SECTIONS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors"
              style={{
                background: isActive ? "var(--primary-dim)" : "transparent",
                color: isActive ? "var(--primary)" : "var(--muted)",
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Section content */}
      <div className="min-w-0">
        {loading ? (
          <Skeleton height={260} rounded={16} />
        ) : (
          <>
            {active === "preferences" && <ProfilePreferences settings={settings} onUpdated={setSettings} />}
            {active === "notifications" && <NotificationPreferences settings={settings} onUpdated={setSettings} />}
            {active === "security" && <SecuritySection settings={settings} onUpdated={setSettings} />}
            {active === "privacy" && <PrivacySection settings={settings} onUpdated={setSettings} />}
            {active === "account" && <AccountSection />}
          </>
        )}
      </div>
    </div>
  );
}
