"use client";
import AppShell from "@/components/layout/AppShell";
import SettingsWorkspace from "@/features/settings/components/SettingsWorkspace";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Configure your account and preferences">
      <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
        <SettingsWorkspace />
      </div>
    </AppShell>
  );
}
