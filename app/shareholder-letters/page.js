"use client";
import { useState } from "react";
import Link from "next/link";
import { useUser } from "../context/UserContext";

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
  compounding: "bg-green-100 text-green-700",
  mindset: "bg-purple-100 text-purple-700",
  valuation: "bg-blue-100 text-blue-700",
  risk: "bg-red-100 text-red-700",
  moat: "bg-amber-100 text-amber-700",
  "business quality": "bg-orange-100 text-orange-700",
  management: "bg-indigo-100 text-indigo-700",
  trust: "bg-teal-100 text-teal-700",
  safety: "bg-cyan-100 text-cyan-700",
  crisis: "bg-red-100 text-red-700",
  opportunity: "bg-green-100 text-green-700",
  knowledge: "bg-blue-100 text-blue-700",
  discipline: "bg-gray-100 text-gray-700",
  dividends: "bg-yellow-100 text-yellow-700",
  reinvestment: "bg-lime-100 text-lime-700",
  indexing: "bg-pink-100 text-pink-700",
  passive: "bg-purple-100 text-purple-700",
  time: "bg-teal-100 text-teal-700",
};

const allTags = [...new Set(letters.flatMap((l) => l.tags))];

export default function ShareholderLetters() {
  const { profile } = useUser();
  const [filter, setFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const displayed = letters.filter((l) => {
    const matchesProfile = filter === "all" || (profile && l.relevantFor.includes(profile.investor.type));
    const matchesTag = !tagFilter || l.tags.includes(tagFilter);
    return matchesProfile && matchesTag;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📬 Buffett Shareholder Letters</h1>
            <p className="text-sm text-gray-500">Key wisdom from 1998–2017 letters, with Indian market context</p>
          </div>
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-full text-sm font-medium ${filter === "all" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
            All Letters ({letters.length})
          </button>
          {profile && (
            <button onClick={() => setFilter("me")} className={`px-4 py-2 rounded-full text-sm font-medium ${filter === "me" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
              {profile.investor.icon} For {profile.name || profile.investor.type}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setTagFilter(null)} className={`px-3 py-1 rounded-full text-xs font-medium ${!tagFilter ? "bg-gray-800 text-white" : "bg-white border border-gray-200 text-gray-500"}`}>All Topics</button>
          {allTags.map((t) => (
            <button key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)} className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${tagFilter === t ? "bg-gray-800 text-white" : `${tagColors[t] || "bg-gray-100 text-gray-600"} border border-transparent`}`}>
              {t}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-500 mb-5">Showing {displayed.length} letters</p>

        <div className="space-y-4">
          {displayed.map((l) => (
            <div key={l.year} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
              <button className="w-full text-left p-5" onClick={() => setExpanded(expanded === l.year ? null : l.year)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{l.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">{l.year} Letter</span>
                        <span className="text-gray-500">·</span>
                        <span className="font-semibold text-gray-700">{l.theme}</span>
                        {profile && l.relevantFor.includes(profile.investor.type) && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">✓ For You</span>
                        )}
                      </div>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {l.tags.map((t) => (
                          <span key={t} className={`text-xs px-2 py-0.5 rounded-full capitalize ${tagColors[t] || "bg-gray-100 text-gray-600"}`}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">{expanded === l.year ? "▲" : "▼"}</span>
                </div>

                <blockquote className="mt-3 border-l-4 border-amber-400 pl-4 text-sm text-gray-700 italic">
                  &quot;{l.keyQuote}&quot;
                </blockquote>
              </button>

              {expanded === l.year && (
                <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">📌 Key Lessons</p>
                    <ul className="space-y-1.5">
                      {l.lessons.map((lesson) => (
                        <li key={lesson} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-blue-500 mt-0.5">→</span>
                          {lesson}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-amber-700 uppercase mb-1">🇮🇳 Indian Market Context</p>
                    <p className="text-sm text-amber-800">{l.indianContext}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
