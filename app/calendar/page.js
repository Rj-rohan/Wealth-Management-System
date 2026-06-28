"use client";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import CalendarWorkspace from "@/features/calendar/components/CalendarWorkspace";

export default function CalendarPage() {
  return (
    <AppShell title="Calendar" subtitle="Your schedule at a glance">
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        <PageTransition>
          <CalendarWorkspace />
        </PageTransition>
      </div>
    </AppShell>
  );
}
