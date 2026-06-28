"use client";
import { motion } from "framer-motion";
import { Avatar, SearchBox } from "@/components/ui";
import { timeAgo } from "@/utils/format";

export default function ConversationList({ conversations, activeId, onSelect, search, onSearch, loading }) {
  return (
    <div className="flex flex-col h-full" style={{ borderRight: "1px solid var(--border)" }}>
      <div className="p-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <SearchBox value={search} onChange={onSearch} placeholder="Search conversations…" />
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl" style={{ background: "var(--surface-raised)" }} />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-sm text-center mt-8" style={{ color: "var(--muted)" }}>No conversations found</p>
        ) : (
          conversations.map((c) => {
            const active = c.id === activeId;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors"
                style={{ background: active ? "var(--primary-dim)" : "transparent", borderBottom: "1px solid var(--border)" }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface-hover)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <Avatar name={c.clientName} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{c.clientName}</p>
                    <span className="text-[10px] flex-shrink-0" style={{ color: "var(--muted)" }}>{timeAgo(c.lastAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{c.lastMessage}</p>
                    {c.unread > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center justify-center text-[10px] font-bold rounded-full flex-shrink-0"
                        style={{ minWidth: 18, height: 18, padding: "0 5px", background: "var(--primary)", color: "#fff" }}
                      >
                        {c.unread}
                      </motion.span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
