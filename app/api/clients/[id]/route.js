import { db } from "@/lib/db/database";
import { ok, fail } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { id } = await params;
  const client = await db.findOne("clients", { id });
  if (!client) return fail("Client not found", 404);

  const appointments = await db.findMany("appointments", { client_id: id });
  const documents = await db.findMany("documents", { client_id: id });
  const notes = await db.findMany("notes", { client_id: id });
  const goals = await db.findMany("client_goals", { client_id: id });

  return ok({
    id: client.id,
    firstName: client.first_name,
    lastName: client.last_name,
    name: client.name || `${client.first_name || ""} ${client.last_name || ""}`.trim(),
    email: client.email,
    phone: client.phone,
    status: client.status,
    riskProfile: client.risk_profile || client.riskProfile || "moderate",
    age: client.age,
    occupation: client.occupation,
    location: client.location,
    joinedDate: client.joined_date || client.joinedDate,
    lastContact: client.last_contact || client.lastContact,
    netWorth: Number(client.net_worth || client.netWorth || 0),
    assets: Number(client.assets || 0),
    liabilities: Number(client.liabilities || 0),
    income: Number(client.income || 0),
    expenses: Number(client.expenses || 0),
    allocation: typeof client.allocation === "string" ? JSON.parse(client.allocation) : client.allocation || {},
    tags: typeof client.tags === "string" ? JSON.parse(client.tags) : client.tags || [],
    appointments,
    documents,
    notes,
    goals: (goals || []).map((g) => ({
      id: g.id,
      label: g.label,
      type: g.type,
      target: Number(g.target_amount || g.targetAmount || 0),
      targetAmount: Number(g.target_amount || g.targetAmount || 0),
      currentSavings: Number(g.current_savings || g.currentSavings || 0),
      progress: Number(g.progress || 0),
      priority: g.priority,
      status: g.status,
      targetDate: g.target_date || g.targetDate,
    })),
  });
}

export async function PUT(request, { params }) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON body");
  }

  const patch = {};
  if (body.firstName !== undefined) patch.first_name = body.firstName;
  if (body.lastName !== undefined) patch.last_name = body.lastName;
  if (body.name !== undefined) patch.name = body.name;
  if (body.email !== undefined) patch.email = body.email;
  if (body.phone !== undefined) patch.phone = body.phone;
  if (body.status !== undefined) patch.status = body.status;
  if (body.riskProfile !== undefined) patch.risk_profile = body.riskProfile;
  if (body.occupation !== undefined) patch.occupation = body.occupation;
  if (body.location !== undefined) patch.location = body.location;
  if (body.assets !== undefined) patch.assets = body.assets;
  if (body.liabilities !== undefined) patch.liabilities = body.liabilities;
  if (body.income !== undefined) patch.income = body.income;
  if (body.expenses !== undefined) patch.expenses = body.expenses;
  if (body.allocation !== undefined) patch.allocation = body.allocation;
  if (body.tags !== undefined) patch.tags = body.tags;

  if (patch.assets !== undefined || patch.liabilities !== undefined) {
    const existing = await db.findOne("clients", { id });
    const assets = patch.assets !== undefined ? patch.assets : existing.assets;
    const liabilities = patch.liabilities !== undefined ? patch.liabilities : existing.liabilities;
    patch.net_worth = assets - liabilities;
  }

  const updated = await db.update("clients", { id }, patch);
  return ok(updated);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await db.remove("clients", { id });
  return ok({ deleted: true, id });
}
