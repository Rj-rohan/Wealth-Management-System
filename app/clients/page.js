"use client";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import ClientsWorkspace from "@/features/clients/components/ClientsWorkspace";

export default function ClientsPage() {
  return (
    <AppShell title="Clients" subtitle="Manage your client relationships">
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        <PageTransition>
          <ClientsWorkspace />
        </PageTransition>
      </div>
    </AppShell>
  );
}
