// Central in-memory mock dataset shared by all Phase 2 services.
// Generated deterministically so the demo is stable, while still allowing
// in-session mutations (create/update/delete) by the services layer.
//
// When the Personal Wealth Management module ships, each service can swap its
// reads/writes here for Supabase queries without any UI changes.
import { makeHelpers } from "./random";

const FIRST = [
  "Eleanor", "Marcus", "Priya", "David", "Sofia", "Liam", "Amara", "Noah", "Chloe", "Mateo",
  "Hannah", "Omar", "Isabella", "Ethan", "Yuki", "Gabriel", "Leila", "Lucas", "Nora", "Idris",
  "Camila", "Sebastian", "Aisha", "Henry", "Freya", "Diego",
];
const LAST = [
  "Whitman", "Lindqvist", "Raghunathan", "Okafor", "Moreau", "Bennett", "Diallo", "Schneider",
  "Rossi", "Alvarez", "Nakamura", "Haddad", "Petrova", "Carlsen", "Fernandes", "Kowalski",
  "Mensah", "Park", "Andersson", "Costa",
];
const CITIES = [
  "New York, US", "London, UK", "Singapore", "Dubai, AE", "Toronto, CA", "Zurich, CH",
  "Sydney, AU", "Mumbai, IN", "Berlin, DE", "Stockholm, SE",
];
const OCCUPATIONS = [
  "Surgeon", "Tech Founder", "Corporate Lawyer", "Airline Pilot", "Architect", "Professor",
  "Investment Banker", "Business Owner", "Creative Director", "Retired Executive", "Dentist", "Consultant",
];
const STATUSES = ["prospect", "pending", "active", "active", "active", "inactive", "archived"];
const RISK = ["conservative", "moderate", "aggressive"];
const GOAL_TEMPLATES = [
  { label: "Retirement at 60", target: 2500000 },
  { label: "Children's education fund", target: 400000 },
  { label: "Second home purchase", target: 800000 },
  { label: "Build emergency reserve", target: 150000 },
  { label: "Philanthropic endowment", target: 1000000 },
  { label: "Business succession", target: 3000000 },
];
const MEETING_TYPES = ["video", "phone", "in_person"];
const MEETING_TITLES = [
  "Portfolio Review", "Retirement Planning", "Tax Planning", "Financial Planning",
  "Risk Assessment", "Estate Planning", "Quarterly Check-in", "Onboarding Consultation",
];
const DOC_CATEGORIES = ["kyc", "identity", "tax", "investment_statements", "reports", "other"];
const DOC_NAMES = {
  kyc: ["KYC Form", "Source of Funds Declaration", "Client Agreement"],
  identity: ["Passport Copy", "Driver's License", "Proof of Address"],
  tax: ["Tax Return 2025", "W-2 Statement", "Capital Gains Summary"],
  investment_statements: ["Q1 Portfolio Statement", "Annual Holdings Report", "Brokerage Statement"],
  reports: ["Financial Plan Report", "Risk Profile Report", "Performance Review"],
  other: ["Meeting Memo", "Correspondence", "Misc Notes"],
};
const MSG_SNIPPETS = [
  "Thanks for the update on my portfolio.",
  "Could we move our meeting to next week?",
  "I've attached the documents you requested.",
  "What's your view on the recent market dip?",
  "Appreciate the detailed plan, looks great.",
  "Can you review my retirement projections?",
  "Just confirming our call tomorrow.",
  "Happy with the rebalancing, thank you!",
];

const h = makeHelpers(20260629);

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function buildClient(i) {
  const first = FIRST[i % FIRST.length];
  const last = h.pick(LAST);
  const name = `${first} ${last}`;
  const status = h.pick(STATUSES);
  const risk = h.pick(RISK);

  const assets = h.int(200, 8000) * 1000;
  const liabilities = h.int(0, Math.round(assets * 0.4 / 1000)) * 1000;
  const income = h.int(120, 1200) * 1000;
  const expenses = Math.round(income * h.float(0.3, 0.7));

  const allocByRisk = {
    conservative: { equity: 30, fixedIncome: 45, cash: 15, alternatives: 5, realEstate: 5 },
    moderate: { equity: 55, fixedIncome: 25, cash: 8, alternatives: 7, realEstate: 5 },
    aggressive: { equity: 75, fixedIncome: 10, cash: 5, alternatives: 7, realEstate: 3 },
  }[risk];

  const goals = h.sample(GOAL_TEMPLATES, h.int(1, 3)).map((g, idx) => ({
    id: `${i}-goal-${idx}`,
    label: g.label,
    target: g.target,
    progress: h.int(10, 95),
  }));

  return {
    id: `cl_${String(i + 1).padStart(3, "0")}`,
    firstName: first,
    lastName: last,
    name,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@email.com`,
    phone: `+1 ${h.int(200, 989)} ${h.int(100, 999)} ${h.int(1000, 9999)}`,
    status,
    riskProfile: risk,
    age: h.int(28, 72),
    occupation: h.pick(OCCUPATIONS),
    location: h.pick(CITIES),
    joinedDate: daysFromNow(-h.int(20, 900)).toISOString(),
    lastContact: daysFromNow(-h.int(0, 45)).toISOString(),
    netWorth: assets - liabilities,
    assets,
    liabilities,
    income,
    expenses,
    allocation: allocByRisk,
    goals,
    tags: h.sample(["High Net Worth", "Referral", "Tax-Sensitive", "ESG", "Retiree", "Entrepreneur"], h.int(1, 3)),
  };
}

function buildAppointments(clients) {
  const out = [];
  let id = 1;
  clients.forEach((c) => {
    const count = h.int(0, 3);
    for (let k = 0; k < count; k++) {
      const offset = h.int(-40, 25);
      const date = daysFromNow(offset);
      date.setHours(h.int(8, 17), h.bool() ? 0 : 30, 0, 0);
      const status = offset < 0 ? (h.bool(0.85) ? "completed" : "cancelled") : "upcoming";
      out.push({
        id: `apt_${String(id++).padStart(3, "0")}`,
        clientId: c.id,
        clientName: c.name,
        title: h.pick(MEETING_TITLES),
        type: h.pick(MEETING_TYPES),
        start: date.toISOString(),
        duration: h.pick([30, 45, 60]),
        status,
        notes: status === "completed" ? "Reviewed objectives and agreed on next steps." : "",
      });
    }
  });
  return out.sort((a, b) => new Date(a.start) - new Date(b.start));
}

function buildConversations(clients) {
  const subset = h.sample(clients, 8);
  return subset.map((c, i) => {
    const msgCount = h.int(3, 8);
    const messages = [];
    for (let k = 0; k < msgCount; k++) {
      const fromClient = h.bool(0.55);
      const minsAgo = (msgCount - k) * h.int(40, 600);
      messages.push({
        id: `msg_${c.id}_${k}`,
        from: fromClient ? "client" : "advisor",
        text: h.pick(MSG_SNIPPETS),
        at: new Date(Date.now() - minsAgo * 60000).toISOString(),
        read: fromClient ? h.bool(0.6) : true,
      });
    }
    const unread = messages.filter((m) => m.from === "client" && !m.read).length;
    return {
      id: `conv_${i + 1}`,
      clientId: c.id,
      clientName: c.name,
      lastMessage: messages[messages.length - 1].text,
      lastAt: messages[messages.length - 1].at,
      unread,
      messages,
    };
  });
}

function buildDocuments(clients) {
  const out = [];
  let id = 1;
  clients.forEach((c) => {
    const count = h.int(1, 5);
    const cats = h.sample(DOC_CATEGORIES, count);
    cats.forEach((cat) => {
      out.push({
        id: `doc_${String(id++).padStart(3, "0")}`,
        clientId: c.id,
        clientName: c.name,
        name: `${h.pick(DOC_NAMES[cat])}.pdf`,
        category: cat,
        sizeKb: h.int(80, 5200),
        uploadedAt: daysFromNow(-h.int(0, 300)).toISOString(),
      });
    });
  });
  return out.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

function buildNotes(clients) {
  const subset = h.sample(clients, 10);
  const texts = [
    "Client prefers conservative positioning ahead of retirement.",
    "Discussed tax-loss harvesting opportunities for Q4.",
    "Interested in ESG-focused funds — follow up with options.",
    "Reviewing estate plan; needs referral to estate attorney.",
    "Wants to increase monthly contributions starting next quarter.",
    "Concerned about market volatility — reassured on long-term plan.",
  ];
  return subset.map((c, i) => ({
    id: `note_${i + 1}`,
    clientId: c.id,
    clientName: c.name,
    type: h.bool(0.4) ? "meeting" : "private",
    pinned: h.bool(0.3),
    title: h.pick(MEETING_TITLES) + " notes",
    body: h.pick(texts),
    createdAt: daysFromNow(-h.int(0, 120)).toISOString(),
  }));
}

// ---- Singleton dataset -----------------------------------------------------
const clients = Array.from({ length: 26 }, (_, i) => buildClient(i));

export const dataset = {
  clients,
  appointments: buildAppointments(clients),
  conversations: buildConversations(clients),
  documents: buildDocuments(clients),
  notes: buildNotes(clients),
};
