"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, onChange, total, pageSize }) {
  if (totalPages <= 1) {
    return (
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        {total} result{total === 1 ? "" : "s"}
      </p>
    );
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const btn = {
    background: "var(--surface-raised)",
    border: "1px solid var(--border)",
    color: "var(--muted-strong)",
  };

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-40 transition-colors"
          style={btn}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
          const active = p === page;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: active ? "var(--primary)" : "var(--surface-raised)",
                border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                color: active ? "#fff" : "var(--muted-strong)",
              }}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-40 transition-colors"
          style={btn}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
