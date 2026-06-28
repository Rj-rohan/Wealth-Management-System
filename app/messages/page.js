"use client";
import AppShell from "@/components/layout/AppShell";
import MessagesWorkspace from "@/features/messages/components/MessagesWorkspace";

export default function MessagesPage() {
  return (
    <AppShell title="Messages" subtitle="Communicate with your clients">
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        <MessagesWorkspace />
      </div>
    </AppShell>
  );
}
