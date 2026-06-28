"use client";
import AppShell from "@/components/layout/AppShell";
import PageTransition from "@/components/motion/PageTransition";
import NotesWorkspace from "@/features/notes/components/NotesWorkspace";

export default function NotesPage() {
  return (
    <AppShell title="Notes" subtitle="Your private and meeting notes">
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        <PageTransition>
          <NotesWorkspace />
        </PageTransition>
      </div>
    </AppShell>
  );
}
