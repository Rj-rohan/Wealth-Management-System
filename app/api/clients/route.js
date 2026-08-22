import { db } from "@/lib/db/database";
import { ok, fail, created } from "@/lib/api/response";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const risk = searchParams.get("risk") || "all";
  const sortBy = searchParams.get("sortBy") || "name";
  const sortDir = searchParams.get("sortDir") || "asc";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "9", 10);

  let rows = await db.findMany("clients");

  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.occupation || "").toLowerCase().includes(q)
    );
  }
  if (status !== "all") rows = rows.filter((c) => c.status === status);
  if (risk !== "all") rows = rows.filter((c) => c.risk_profile === risk || c.riskProfile === risk);

  const STATUS_ORDER = { prospect: 0, pending: 1, active: 2, inactive: 3, archived: 4 };

  rows.sort((a, b) => {
    let av, bv;
    if (sortBy === "status") {
      av = STATUS_ORDER[a.status] ?? 99;
      bv = STATUS_ORDER[b.status] ?? 99;
    } else if (sortBy === "netWorth") {
      av = Number(a.net_worth || a.netWorth || 0);
      bv = Number(b.net_worth || b.netWorth || 0);
    } else if (sortBy === "lastContact") {
      av = new Date(a.last_contact || a.lastContact || 0).getTime();
      bv = new Date(b.last_contact || b.lastContact || 0).getTime();
    } else {
      av = (a.name || "").toLowerCase();
      bv = (b.name || "").toLowerCase();
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize).map(formatClient);

  return ok({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body");
  }

  const first_name = body.firstName || body.first_name || "";
  const last_name = body.lastName || body.last_name || "";
  const name = `${first_name} ${last_name}`.trim() || body.name || "Unnamed Client";

  const client = await db.insert("clients", {
    first_name,
    last_name,
    name,
    email: body.email || "",
    phone: body.phone || "",
    status: body.status || "prospect",
    risk_profile: body.riskProfile || body.risk_profile || "moderate",
    age: body.age || 30,
    occupation: body.occupation || "",
    location: body.location || "",
    net_worth: body.netWorth || body.net_worth || 0,
    assets: body.assets || 0,
    liabilities: body.liabilities || 0,
    income: body.income || 0,
    expenses: body.expenses || 0,
    allocation: body.allocation || { equity: 50, fixedIncome: 30, cash: 10, alternatives: 5, realEstate: 5 },
    tags: body.tags || [],
    joined_date: new Date().toISOString(),
    last_contact: new Date().toISOString(),
  });

  return created(formatClient(client));
}

function formatClient(c) {
  if (!c) return null;
  return {
    id: c.id,
    firstName: c.first_name,
    lastName: c.last_name,
    name: c.name || `${c.first_name || ""} ${c.last_name || ""}`.trim(),
    email: c.email,
    phone: c.phone,
    status: c.status,
    riskProfile: c.risk_profile || c.riskProfile || "moderate",
    age: c.age,
    occupation: c.occupation,
    location: c.location,
    joinedDate: c.joined_date || c.joinedDate,
    lastContact: c.last_contact || c.lastContact,
    netWorth: Number(c.net_worth || c.netWorth || 0),
    assets: Number(c.assets || 0),
    liabilities: Number(c.liabilities || 0),
    income: Number(c.income || 0),
    expenses: Number(c.expenses || 0),
    allocation: typeof c.allocation === "string" ? JSON.parse(c.allocation) : c.allocation || {},
    tags: typeof c.tags === "string" ? JSON.parse(c.tags) : c.tags || [],
  };
}
