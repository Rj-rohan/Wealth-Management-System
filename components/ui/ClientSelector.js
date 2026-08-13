"use client";
import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, User } from "lucide-react";
import { clientsService } from "@/services/clients.service";

// Searchable client dropdown used across all Phase 3 feature workspaces.
export default function ClientSelector({ value, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    clientsService.list({ pageSize: 100, sortBy: "name", sortDir: "asc" }).then((res) => {
      setClients(res.items);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = clients.find((c) => c.id === value);
  const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium w-full sm:w-auto min-w-[220px] transition-all"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
      >
        <User size={14} style={{ color: "var(--muted)" }} />
        <span className="flex-1 text-left truncate">{selected ? selected.name : "Select client…"}</span>
        <ChevronDown size={14} style={{ color: "var(--muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && (
        <div
          className="absolute z-40 mt-1 w-full min-w-[260px] rounded-xl overflow-hidden shadow-2xl"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border-strong)" }}
        >
          <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: "var(--surface-hover)" }}>
              <Search size={13} style={{ color: "var(--muted)" }} />
              <input
                type="text"
                placeholder="Search clients…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-xs flex-1"
                style={{ color: "var(--foreground)" }}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {loading && <p className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>Loading…</p>}
            {!loading && filtered.length === 0 && <p className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>No clients found</p>}
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => { onChange(c.id); setOpen(false); setSearch(""); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors"
                style={{
                  color: c.id === value ? "var(--primary)" : "var(--foreground)",
                  background: c.id === value ? "var(--primary-dim)" : "transparent",
                }}
                onMouseEnter={(e) => { if (c.id !== value) e.currentTarget.style.background = "var(--surface-hover)"; }}
                onMouseLeave={(e) => { if (c.id !== value) e.currentTarget.style.background = "transparent"; }}
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold flex-shrink-0"
                  style={{ background: "var(--primary-dim)", color: "var(--primary)" }}>
                  {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{c.occupation} • {c.location}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
