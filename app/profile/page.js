"use client";
import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import ProfileWorkspace from "@/features/profile/components/ProfileWorkspace";
import Spinner from "@/components/ui/Spinner";

export default function ProfilePage() {
  return (
    <AppShell title="My Profile" subtitle="Manage your advisor profile and credentials">
      <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto">
        <Suspense fallback={<Spinner size={24} fullscreen />}>
          <ProfileWorkspace />
        </Suspense>
      </div>
    </AppShell>
  );
}
