"use client";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import AppointmentsWorkspace from "@/features/appointments/components/AppointmentsWorkspace";

export default function AppointmentsPage() {
  return (
    <AppShell title="Appointments" subtitle="Manage your consultations">
      <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto">
        <PageTransition>
          <AppointmentsWorkspace />
        </PageTransition>
      </div>
    </AppShell>
  );
}
