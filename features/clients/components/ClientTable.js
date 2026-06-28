"use client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, StatusBadge } from "@/components/ui";
import { formatCompact, timeAgo } from "@/utils/format";

export default function ClientTable({ clients }) {
  const router = useRouter();
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Client", "Status", "Risk", "Net Worth", "Location", "Last Contact"].map((h) => (
                <th key={h} className="text-left font-medium px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {clients.map((c, i) => (
                <motion.tr
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                  onClick={() => router.push(`/clients/${c.id}`)}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  whileHover={{ backgroundColor: "var(--surface-hover)" }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium truncate" style={{ color: "var(--foreground)" }}>{c.name}</p>
                        <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} kind="client" /></td>
                  <td className="px-4 py-3"><StatusBadge status={c.riskProfile} kind="risk" /></td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--foreground)" }}>{formatCompact(c.netWorth)}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted-strong)" }}>{c.location}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted)" }}>{timeAgo(c.lastContact)}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
