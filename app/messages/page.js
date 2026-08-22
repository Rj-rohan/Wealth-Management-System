import AppShell from "@/components/layout/AppShell";
import MessagesWorkspace from "@/features/messages/components/MessagesWorkspace";
import { Radio, ExternalLink } from "lucide-react";

export default function MessagesPage() {
  return (
    <AppShell title="Messages" subtitle="Communicate and call your clients via WebRTC">
      <div className="px-4 md:px-6 py-4 max-w-6xl mx-auto space-y-3">
        {/* Real WebRTC Voice Call Helper Banner */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <Radio size={15} className="animate-pulse text-emerald-400" />
            <span>Real Browser-to-Browser WebRTC Voice Calls are live.</span>
          </div>
          <a
            href="/client-portal"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors shadow-sm"
          >
            <span>Open Client Portal (Browser 2)</span>
            <ExternalLink size={12} />
          </a>
        </div>

        <MessagesWorkspace />
      </div>
    </AppShell>
  );
}
