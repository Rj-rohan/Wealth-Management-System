"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mail, MapPin, ArrowRight } from "lucide-react";
import { Avatar, StatusBadge } from "@/components/ui";
import { formatCompact, timeAgo } from "@/utils/format";

export default function ClientCard({ client }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
      whileHover={{ y: -4, boxShadow: "0 18px 44px rgba(0,0,0,0.4)" }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start gap-3">
        <motion.div whileHover={{ scale: 1.06 }} transition={{ type: "spring", stiffness: 300 }}>
          <Avatar name={client.name} size="md" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
            {client.name}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
            {client.occupation}
          </p>
        </div>
        <StatusBadge status={client.status} kind="client" />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>Net Worth</p>
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{formatCompact(client.netWorth)}</p>
        </div>
        <div>
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>Risk Profile</p>
          <div className="mt-0.5"><StatusBadge status={client.riskProfile} kind="risk" /></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {client.tags.slice(0, 3).map((t) => (
          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--surface-hover)", color: "var(--muted-strong)" }}>
            {t}
          </span>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-strong)" }}>
                <Mail size={12} /> {client.email}
              </p>
              <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-strong)" }}>
                <MapPin size={12} /> {client.location}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <p className="text-[11px]" style={{ color: "var(--muted)" }}>Assets</p>
                  <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{formatCompact(client.assets)}</p>
                </div>
                <div>
                  <p className="text-[11px]" style={{ color: "var(--muted)" }}>Liabilities</p>
                  <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{formatCompact(client.liabilities)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <span className="text-[11px]" style={{ color: "var(--muted)" }}>Last contact {timeAgo(client.lastContact)}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
            style={{ color: "var(--muted)" }}
            aria-label="Expand"
          >
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={15} />
            </motion.span>
          </button>
          <button
            onClick={() => router.push(`/clients/${client.id}`)}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
            style={{ background: "var(--primary-dim)", color: "var(--primary)" }}
          >
            View <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
