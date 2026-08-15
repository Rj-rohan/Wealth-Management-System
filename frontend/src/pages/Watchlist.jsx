import { useState, useEffect } from "react";
import AppShell from "../components/AppShell";
import { useAppStore } from "../store/useAppStore";
import { fetchWatchlist, removeWatchlistItem } from "../services/api";

const SORT_OPTIONS = [
  { value: "date", label: "Date Added" },
  { value: "score_desc", label: "Score: High → Low" },
  { value: "score_asc", label: "Score: Low → High" },
  { value: "name", label: "Name A → Z" },
];

const RATING_COLORS = {
  "Strong Buy": "#22C55E",
  Buy: "#3B82F6",
  Hold: "#F59E0B",
  Avoid: "#DC2626",
};

const RATING_BG = {
  "Strong Buy": "rgba(34,197,94,0.1)",
  Buy: "rgba(59,130,246,0.1)",
  Hold: "rgba(245,158,11,0.1)",
  Avoid: "rgba(220,38,38,0.1)",
};

const RATING_EMOJI = {
  "Strong Buy": "🟢",
  Buy: "🔵",
  Hold: "🟡",
  Avoid: "🔴",
};

export default function Watchlist() {
  const user = useAppStore((s) => s.user);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchWatchlist(user.id)
      .then((list) => { if (!cancelled) { setItems(list); setError(null); } })
      .catch((err) => { if (!cancelled) setError(err.message || "Could not load your watchlist."); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [user?.id]);

  async function remove(id) {
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await removeWatchlistItem(user.id, id);
    } catch (err) {
      setItems(previous);
      setError(err.message || "Could not remove that company.");
    }
  }

  // The API returns newest-first, so "date" keeps the server order.
  const filtered = items
    .filter((i) => i.companyName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "score_desc") return b.score - a.score;
      if (sort === "score_asc") return a.score - b.score;
      if (sort === "name") return a.companyName.localeCompare(b.companyName);
      return 0;
    });

  const fieldStyle = {
    background: "#1C2128",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "9px 14px",
    fontSize: "13px",
    outline: "none",
  };

  return (
    <AppShell pageTitle="Watchlist" pageSubtitle="Companies assessed using Buffett's methodology">
      <div className="px-6 py-6 max-w-4xl mx-auto space-y-5">

        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.25)", color: "#fca5a5" }}
          >
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company..."
            style={{ ...fieldStyle, flex: "1 1 200px", minWidth: "160px" }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(34,197,94,0.5)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ ...fieldStyle, cursor: "pointer" }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(34,197,94,0.5)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} style={{ background: "#1C2128" }}>{o.label}</option>
            ))}
          </select>
          <span className="text-xs" style={{ color: "#A1A1AA" }}>
            {filtered.length} {filtered.length === 1 ? "company" : "companies"}
          </span>
        </div>

        {/* Empty State */}
        {loaded && items.length === 0 && (
          <div
            className="rounded-xl p-10 text-center"
            style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-3xl mb-3">⭐</p>
            <p className="text-sm font-semibold text-white mb-1">Your watchlist is empty</p>
            <p className="text-xs" style={{ color: "#A1A1AA" }}>
              Assess a company in the Buffett Methodology page and click &quot;Add to Watchlist&quot;.
            </p>
          </div>
        )}

        {/* No search results */}
        {loaded && items.length > 0 && filtered.length === 0 && (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-sm text-white mb-1">No companies match &quot;{search}&quot;</p>
            <p className="text-xs" style={{ color: "#A1A1AA" }}>Try a different search term.</p>
          </div>
        )}

        {/* Watchlist Items */}
        {filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((item) => {
              const color = RATING_COLORS[item.rating] || "#A1A1AA";
              const bg = RATING_BG[item.rating] || "rgba(255,255,255,0.04)";
              const emoji = RATING_EMOJI[item.rating] || "⚪";
              return (
                <div
                  key={item.id}
                  className="rounded-xl p-5 flex items-center gap-4 flex-wrap"
                  style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {/* Score circle */}
                  <div
                    className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                    style={{ background: bg, border: `1px solid ${color}30` }}
                  >
                    <span className="text-lg font-bold leading-none" style={{ color }}>{item.score}</span>
                    <span className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>/100</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{item.companyName}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: bg, color }}
                      >
                        {emoji} {item.rating}
                      </span>
                      <span className="text-xs" style={{ color: "#A1A1AA" }}>Assessed {item.date}</span>
                    </div>
                    {/* Score bar */}
                    <div className="mt-2.5 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", maxWidth: "240px" }}>
                      <div className="h-full rounded-full" style={{ width: `${item.score}%`, background: color }} />
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => remove(item.id)}
                    className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.15)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.18)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.08)"; }}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </AppShell>
  );
}
