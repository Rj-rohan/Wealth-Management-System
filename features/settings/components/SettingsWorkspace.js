"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Bell, ShieldCheck, EyeOff, UserCog, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { useSettings } from "../hooks/useSettings";
import ProfilePreferences from "./ProfilePreferences";
import NotificationPreferences from "./NotificationPreferences";
import SecuritySection from "./SecuritySection";
import PrivacySection from "./PrivacySection";
import AccountSection from "./AccountSection";
import IntegrationsSection from "./IntegrationsSection";
import { useNotifications } from "@/context/NotificationContext";

const SECTIONS = [
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "integrations", label: "Integrations & Calendar", icon: Calendar },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "privacy", label: "Privacy", icon: EyeOff },
  { id: "account", label: "Account", icon: UserCog },
];

export default function SettingsWorkspace() {
  const searchParams = useSearchParams();
  const { success, error: notifyError } = useNotifications();
  const { settings, setSettings, loading } = useSettings();
  const [active, setActive] = useState("preferences");

  useEffect(() => {
    const tab = searchParams?.get("tab");
    const googleConnected = searchParams?.get("google_connected");
    const errorParam = searchParams?.get("error");
    const errorMsg = searchParams?.get("msg");

    if (tab && SECTIONS.some((s) => s.id === tab)) {
      setActive(tab);
    } else if (googleConnected === "true") {
      setActive("integrations");
      success("Google Calendar connected successfully!");
    } else if (errorParam) {
      setActive("integrations");
      notifyError(errorMsg || "Failed to complete Google Calendar authorization");
    }
  }, [searchParams]);

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
            {active === "integrations" && <IntegrationsSection />}
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
