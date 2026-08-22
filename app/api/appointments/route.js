import { db } from "@/lib/db/database";
import { ok, fail, created } from "@/lib/api/response";

function isUpcoming(a) {
  return a.status === "upcoming" && new Date(a.start) >= new Date(Date.now() - 60 * 60 * 1000);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") || "upcoming";

  let rows = await db.findMany("appointments");

  if (scope === "upcoming") {
    rows = rows.filter(isUpcoming).sort((a, b) => new Date(a.start) - new Date(b.start));
  } else if (scope === "past") {
    rows = rows.filter((a) => !isUpcoming(a)).sort((a, b) => new Date(b.start) - new Date(a.start));
  } else {
    rows.sort((a, b) => new Date(b.start) - new Date(a.start));
  }

  return ok(rows);
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body");
  }

  let clientName = body.clientName || body.client_name || "Client";
  if (body.clientId && !body.clientName) {
    const client = await db.findOne("clients", { id: body.clientId });
    if (client) clientName = client.name;
  }

  const apt = await db.insert("appointments", {
    client_id: body.clientId || body.client_id,
    client_name: clientName,
    title: body.title || "Meeting",
    type: body.type || "video",
    start: body.start || new Date().toISOString(),
    duration: body.duration || 45,
    status: body.status || "upcoming",
    notes: body.notes || "",
  });

  return created(apt);
}
