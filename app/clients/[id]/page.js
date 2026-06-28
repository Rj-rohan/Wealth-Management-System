"use client";
import { use } from "react";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import ClientDetail from "@/features/clients/components/ClientDetail";

export default function ClientDetailPage({ params }) {
  const { id } = use(params);
  return (
    <AppShell title="Client Profile" subtitle="Detailed client view">
      <div className="px-4 md:px-6 py-6 max-w-5xl mx-auto">
        <PageTransition>
          <ClientDetail id={id} />
        </PageTransition>
      </div>
    </AppShell>
  );
}
