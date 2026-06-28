"use client";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import DocumentsWorkspace from "@/features/documents/components/DocumentsWorkspace";

export default function DocumentsPage() {
  return (
    <AppShell title="Documents" subtitle="Organize client files and records">
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        <PageTransition>
          <DocumentsWorkspace />
        </PageTransition>
      </div>
    </AppShell>
  );
}
