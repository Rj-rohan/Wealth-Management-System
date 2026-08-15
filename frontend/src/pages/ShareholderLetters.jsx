import { useState } from "react";
import { Link } from "react-router-dom";
import { useInvestorProfile } from "../context/InvestorProfileContext";
import AppShell from "../components/AppShell";

const letters = [
  {
    year: 1998,
    theme: "Long-term Thinking",
    icon: "⏳",
    tags: ["mindset", "compounding"],
    relevantFor: ["Conservative", "Balanced", "Wealth Builder", "Aggressive Growth"],
    keyQuote: "No matter how great the talent or efforts, some things just take time. You can't produce a baby in one month by getting nine women pregnant.",
    lessons: [
      "Compounding works best when left undisturbed for long periods.",
      "Patience is a competitive advantage most investors lack.",
      "Avoid measuring performance in short time frames.",
    ],
    indianContext: "SIP investors who stayed invested through 2008 and 2020 crashes earned 14%+ CAGR. Those who exited locked in permanent losses.",
  },
  {
    year: 2000,
    theme: "Avoiding Speculation",
    icon: "⚠️",
    tags: ["valuation", "risk"],
    relevantFor: ["Conservative", "Balanced"],
    keyQuote: "What the wise man does in the beginning, the fool does in the end.",
    lessons: [
      "Don't chase momentum stocks at bubble valuations.",
      "The dot-com crash wiped out investors who bought stories, not businesses.",
      "Buffett avoided tech during the bubble — and was vindicated.",
    ],
    indianContext: "Lesson applies to Indian SME IPO frenzies and tip-based penny stock investing prevalent today.",
  },
  {
    year: 2002,
    theme: "Economic Moat",
    icon: "🏰",
    tags: ["moat", "business quality"],
    relevantFor: ["Balanced", "Aggressive Growth", "Wealth Builder"],
    keyQuote: "The key to investing is not assessing how much an industry is going to affect society, or how much it will grow, but rather determining the competitive advantage of any given company.",
    lessons: [
      "A business without a moat loses pricing power over time.",
      "Sustainable competitive advantage = durable returns.",
      "Ask: what stops competitors from taking this business's profits?",
    ],
    indianContext: "Asian Paints' distribution moat kept competitors out for decades. Nestle India's brand moat in Maggi survived a major crisis.",
  },
  {
    year: 2004,
    theme: "Management Quality",
    icon: "👔",
    tags: ["management", "trust"],
    relevantFor: ["Conservative", "Balanced", "Wealth Builder"],
    keyQuote: "When a management with a reputation for brilliance tackles a business with a reputation for poor fundamental economics, it is the reputation of the business that remains intact.",
    lessons: [
      "Great management cannot fix a broken business model.",
      "Look for honest, owner-operator type management.",
      "High promoter holding = management has skin in the game.",
    ],
    indianContext: "Motilal Oswal's research shows promoter holding > 50% correlates with better long-term wealth creation in Indian markets.",
  },
  {
    year: 2007,
    theme: "Margin of Safety",
    icon: "🛡️",
    tags: ["valuation", "safety"],
    relevantFor: ["Conservative", "Balanced"],
    keyQuote: "Price is what you pay. Value is what you get.",
    lessons: [
      "Always buy at a discount to intrinsic value.",
      "Margin of safety protects you when your assumptions are wrong.",
      "Never overpay — even for a great business.",
    ],
    indianContext: "MRF was a 'boring' tyre company bought cheap — it became India's highest-priced stock. Value was always there, just unrecognized.",
  },
  {
    year: 2008,
    theme: "Opportunity in Crisis",
    icon: "📉",
    tags: ["crisis", "opportunity"],
    relevantFor: ["Aggressive Growth", "Balanced"],
    keyQuote: "Be fearful when others are greedy and greedy when others are fearful.",
    lessons: [
      "Market crashes are sales, not disasters, for long-term investors.",
      "Keep cash ready for opportunistic buying in downturns.",
      "2008 crash — quality stocks fell 60%, then recovered 300% by 2012.",
    ],
    indianContext: "Nifty fell 55% in 2008. Those who invested at the bottom earned 4x returns in 4 years. SIP investors who stayed in got massive rupee cost averaging benefit.",
  },
  {
    year: 2010,
    theme: "Circle of Competence",
    icon: "🎯",
    tags: ["knowledge", "discipline"],
    relevantFor: ["Conservative", "Balanced", "Wealth Builder", "Aggressive Growth"],
    keyQuote: "Risk comes from not knowing what you are doing.",
    lessons: [
      "Only invest in businesses you can understand and explain.",
      "Saying 'I don't know' is more profitable than guessing.",
      "Your circle of competence doesn't need to be large, just well-defined.",
    ],
    indianContext: "Most retail investors lose in F&O and penny stocks — sectors outside their circle of competence. Stick to what you understand.",
  },
  {
    year: 2013,
    theme: "Dividend & Reinvestment",
    icon: "💸",
    tags: ["dividends", "reinvestment"],
    relevantFor: ["Conservative", "Wealth Builder"],
    keyQuote: "The best business to own is one that over an extended period can employ large amounts of incremental capital at very high rates of return.",
    lessons: [
      "A business that reinvests earnings at high ROE compounds wealth better than dividends.",
      "Dividend yield matters for income investors, but ROE matters more for growth.",
      "Avoid dividend traps — high yield with declining earnings is a red flag.",
    ],
    indianContext: "Coal India has high dividend yield but stagnant earnings. ITC's high yield masks stagnant business growth — classic Buffett warning.",
  },
  {
    year: 2016,
    theme: "Index Funds vs Active",
    icon: "📊",
    tags: ["indexing", "passive"],
    relevantFor: ["Conservative", "Balanced"],
    keyQuote: "When trillions of dollars are managed by Wall Streeters charging high fees, it will usually be the managers who reap outsized profits, not the clients.",
    lessons: [
      "Low-cost index funds beat most active funds over 20 years.",
      "If you can't analyze stocks deeply, index investing is the smart choice.",
      "Cost of investing matters as much as returns.",
    ],
    indianContext: "Nifty 50 index has beaten 80%+ of actively managed large-cap funds over 10 years in India. Nifty 50 ETF or index funds suit Conservative investors perfectly.",
  },
  {
    year: 2017,
    theme: "The Power of Compounding",
    icon: "🌱",
    tags: ["compounding", "time"],
    relevantFor: ["Conservative", "Balanced", "Wealth Builder", "Aggressive Growth"],
    keyQuote: "My wealth has come from a combination of living in America, some lucky genes, and compound interest.",
    lessons: [
      "₹1 lakh at 15% CAGR becomes ₹16 lakhs in 20 years.",
      "The last decade of compounding creates more wealth than the first two combined.",
      "Starting early is the single most important financial decision.",
    ],
    indianContext: "A 25-year-old investing ₹5000/month in a 12% CAGR instrument will have ₹1.76 crore by 60. Starting at 35 gives only ₹54 lakhs.",
  },
];

const tagColors = {
  compounding: { color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  mindset: { color: "#A855F7", bg: "rgba(168,85,247,0.1)" },
  valuation: { color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  risk: { color: "#DC2626", bg: "rgba(220,38,38,0.1)" },
  moat: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  "business quality": { color: "#F97316", bg: "rgba(249,115,22,0.1)" },
  management: { color: "#6366F1", bg: "rgba(99,102,241,0.1)" },
  trust: { color: "#14B8A6", bg: "rgba(20,184,166,0.1)" },
  safety: { color: "#06B6D4", bg: "rgba(6,182,212,0.1)" },
  crisis: { color: "#DC2626", bg: "rgba(220,38,38,0.1)" },
  opportunity: { color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  knowledge: { color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  discipline: { color: "#A1A1AA", bg: "rgba(161,161,170,0.1)" },
  dividends: { color: "#D4AF37", bg: "rgba(212,175,55,0.1)" },
  reinvestment: { color: "#84CC16", bg: "rgba(132,204,22,0.1)" },
  indexing: { color: "#EC4899", bg: "rgba(236,72,153,0.1)" },
  passive: { color: "#A855F7", bg: "rgba(168,85,247,0.1)" },
  time: { color: "#14B8A6", bg: "rgba(20,184,166,0.1)" },
};

const allTags = [...new Set(letters.flatMap((l) => l.tags))];

export default function ShareholderLetters() {
  const { profile } = useInvestorProfile();
  const [filter, setFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const displayed = letters.filter((l) => {
    const matchesProfile = filter === "all" || (profile && l.relevantFor.includes(profile.investor.type));
    const matchesTag = !tagFilter || l.tags.includes(tagFilter);
    return matchesProfile && matchesTag;
  });

  return (
    <AppShell pageTitle="Shareholder Letters" pageSubtitle="Buffett's 1998–2017 letters with Indian market context">
      <div className="px-6 py-6 max-w-4xl mx-auto">

        {/* Profile + Tag Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter("all")}
            className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: filter === "all" ? "#22C55E" : "rgba(255,255,255,0.04)",
              color: filter === "all" ? "#000" : "#A1A1AA",
              border: `1px solid ${filter === "all" ? "transparent" : "rgba(255,255,255,0.07)"}`,
            }}
          >
            All Letters ({letters.length})
          </button>
          {profile && (
            <button
              onClick={() => setFilter("me")}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filter === "me" ? "#22C55E" : "rgba(255,255,255,0.04)",
                color: filter === "me" ? "#000" : "#A1A1AA",
                border: `1px solid ${filter === "me" ? "transparent" : "rgba(255,255,255,0.07)"}`,
              }}
            >
              {profile.investor.icon} For {profile.name || profile.investor.type}
            </button>
          )}
        </div>

        {/* Topic Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setTagFilter(null)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: !tagFilter ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
              color: !tagFilter ? "#fff" : "#A1A1AA",
            }}
          >
            All Topics
          </button>
          {allTags.map((t) => {
            const tc = tagColors[t] || { color: "#A1A1AA", bg: "rgba(161,161,170,0.1)" };
            const isActive = tagFilter === t;
            return (
              <button
                key={t}
                onClick={() => setTagFilter(tagFilter === t ? null : t)}
                className="px-3 py-1 rounded-full text-xs font-medium capitalize transition-all"
                style={{
                  background: isActive ? tc.bg : "rgba(255,255,255,0.04)",
                  color: isActive ? tc.color : "#A1A1AA",
                  border: `1px solid ${isActive ? tc.color + "30" : "rgba(255,255,255,0.07)"}`,
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        <p className="text-xs mb-5" style={{ color: "#A1A1AA" }}>
          Showing <span className="text-white font-medium">{displayed.length}</span> letters
        </p>

        <div className="space-y-3">
          {displayed.map((l) => {
            const isExpanded = expanded === l.year;
            return (
              <div
                key={l.year}
                className="rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  background: "#161B22",
                  border: `1px solid ${isExpanded ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)"}`,
                }}
              >
                <button
                  className="w-full text-left p-5"
                  onClick={() => setExpanded(isExpanded ? null : l.year)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-xl flex-shrink-0 mt-0.5">{l.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="font-semibold text-white text-sm">{l.year} Letter</span>
                          <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
                          <span className="text-sm font-medium" style={{ color: "#A1A1AA" }}>{l.theme}</span>
                          {profile && l.relevantFor.includes(profile.investor.type) && (
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}
                            >
                              ✓ For You
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {l.tags.map((t) => {
                            const tc = tagColors[t] || { color: "#A1A1AA", bg: "rgba(161,161,170,0.1)" };
                            return (
                              <span
                                key={t}
                                className="text-xs px-2 py-0.5 rounded-full capitalize"
                                style={{ background: tc.bg, color: tc.color }}
                              >
                                {t}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm flex-shrink-0" style={{ color: "#A1A1AA" }}>
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>

                  <div
                    className="mt-3 pl-4 py-2"
                    style={{ borderLeft: "2px solid rgba(212,175,55,0.4)" }}
                  >
                    <p className="text-sm italic leading-relaxed" style={{ color: "#A1A1AA" }}>
                      &quot;{l.keyQuote}&quot;
                    </p>
                  </div>
                </button>

                {isExpanded && (
                  <div
                    className="p-5 space-y-4"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#A1A1AA" }}>
                        Key Lessons
                      </p>
                      <ul className="space-y-2">
                        {l.lessons.map((lesson) => (
                          <li key={lesson} className="flex items-start gap-2.5 text-sm text-white">
                            <span className="flex-shrink-0 mt-0.5" style={{ color: "#22C55E" }}>→</span>
                            {lesson}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div
                      className="rounded-xl p-4"
                      style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.15)" }}
                    >
                      <p className="text-xs font-semibold mb-2" style={{ color: "#D4AF37" }}>🇮🇳 Indian Market Context</p>
                      <p className="text-sm leading-relaxed text-white">{l.indianContext}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
